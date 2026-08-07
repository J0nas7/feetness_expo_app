import { createStyles } from '@/components/exercise/exercise/CreateStyles';
import { GoalProgress } from '@/components/exercise/GoalProgress';
import { loadPlans } from '@/components/plan/storage';
import { useSpeech } from '@/hooks/useSpeech';
import { OnboardingData, Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { hasBackgroundPermission, hasLocationPermission } from '@/utils/location/location';
import { WORKOUT_LOCATION_TASK } from '@/utils/location/workoutLocationTask';
import { resetWorkoutLocationAnchor, resetWorkoutStoreAndNotify, subscribeToWorkout } from '@/utils/location/workoutStore';
import { endAndroidWorkoutNotification, endLiveActivity, setNativeWorkoutPaused, startAndroidWorkoutNotification, startLiveActivity, subscribeToWorkoutCommands, updateAndroidWorkoutNotification, updateLiveActivity } from '@/utils/native/LiveActivityModule';
import { publishWatchWorkout, subscribeToWatchWorkoutCommands } from '@/utils/native/WatchBridge';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, PermissionsAndroid, Platform, Pressable, View } from 'react-native';
import MapView from 'react-native-maps';
import { ExerciseMap } from './ExerciseMap';
import { CompactExerciseStats, ExerciseStats } from './ExerciseStats';

export interface ExerciseProps {
    exercise: "Cykling" | "Løb" | "Gågang";
    goalAmount: number;
    goalMetric: "duration" | "distance";
}

export const Exercise: React.FC<ExerciseProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const { enqueueSpeech, isMuted, resetProgress, setMonthPlanProgress, speakProgressUpdates, start: startSpeech, stop: stopSpeech, toggleMute } = useSpeech();
    const [activeView, setActiveView] = useState<'summary' | 'map'>('summary');
    const [isPaused, setIsPaused] = useState(false); // pause/resume
    const [startTime, setStartTime] = useState<number>(Date.now()); // Start time in milliseconds
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [distance, setDistance] = useState<number>(0); // Distance in meters
    const [elapsedTime, setElapsedTime] = useState<number>(0); // Elapsed time in seconds
    const [pace, setPace] = useState<number>(0); // Elapsed time in seconds
    const [calories, setCalories] = useState<number>(0); // Calories in kcal
    const [path, setPath] = useState<
        { latitude: number; longitude: number }[]
    >([]);
    const [segments, setSegments] = useState<
        {
            coords: {
                latitude: number;
                longitude: number;
                altitude: number | null;
            }[];
            pace: number; // m/s
        }[]
    >([]);
    const startPoint = path[0];

    let progress = 0;
    if (props.goalMetric === 'distance') {
        // distance is in meters, goalAmount is in km
        progress = distance / (props.goalAmount * 1000);
    } else if (props.goalMetric === 'duration') {
        // elapsedTime is in seconds, goalAmount is in minutes
        progress = elapsedTime / (props.goalAmount * 60);
    }
    progress = Math.min(progress, 1); // clamp 0 → 1
    const percentage = Math.round(progress * 100);

    const [weight, setWeight] = useState(60);

    const percentageRef = React.useRef<number>(percentage);
    const isPausedRef = React.useRef<boolean>(isPaused);
    const startTimeRef = React.useRef<number>(startTime);
    const distanceRef = React.useRef<number>(distance);
    const elapsedTimeRef = React.useRef<number>(elapsedTime);
    const paceRef = React.useRef<number>(pace);
    const caloriesRef = React.useRef<number>(0);
    const activeStartTimeRef = React.useRef<number | null>(null);
    const totalActiveMsRef = React.useRef<number>(0);
    const stopExerciseRef = React.useRef<() => Promise<void>>(async () => { });
    const pauseStateInitializedRef = React.useRef(false);
    const applyingNativeCommandRef = React.useRef(false);

    const prevLocationRef = React.useRef<Location.LocationObjectCoords | null>(null);
    const prevTimeRef = React.useRef<number | null>(null);
    const pathRef = React.useRef<
        { latitude: number; longitude: number }[]
    >([]);
    const locationSubRef = React.useRef<Location.LocationSubscription | null>(null);

    const mapRef = React.useRef<MapView>(null);
    const styles = createStyles(theme);

    useEffect(() => { percentageRef.current = percentage; }, [percentage]);
    useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
    useEffect(() => { distanceRef.current = distance; }, [distance]);
    useEffect(() => { elapsedTimeRef.current = elapsedTime; }, [elapsedTime]);
    useEffect(() => { paceRef.current = pace; }, [pace]);
    useEffect(() => { isPausedRef.current = isPaused }, [isPaused]);

    useEffect(() => {
        workoutPausesOrStarts_Resumes();
        resetWorkoutLocationAnchor();

        publishWatchWorkout({
            status: isPaused ? 'paused' : 'running',
            exercise: props.exercise,
            distance: distanceRef.current,
            pace: paceRef.current,
            elapsed: elapsedTimeRef.current,
            calories: caloriesRef.current,
            percent: percentageRef.current,
            goalAmount: props.goalAmount,
            goalMetric: props.goalMetric,
        });

        if (!pauseStateInitializedRef.current) {
            pauseStateInitializedRef.current = true;
        } else if (applyingNativeCommandRef.current) {
            applyingNativeCommandRef.current = false;
        } else {
            enqueueSpeech(isPaused ? 'Pause' : 'Fortsæt');
            setNativeWorkoutPaused(isPaused);
        }
    }, [isPaused]);

    useEffect(() => {
        const subscription = subscribeToWatchWorkoutCommands((command) => {
            if (command === 'stop') {
                void stopExerciseRef.current();
                return;
            }

            const shouldPause = command === 'pause';
            if (isPausedRef.current === shouldPause) return;
            enqueueSpeech(shouldPause ? 'Pause' : 'Fortsæt');
            setIsPaused(shouldPause);
        });

        return () => subscription?.remove();
    }, [enqueueSpeech]);

    useEffect(() => {
        const subscription = subscribeToWorkoutCommands((command) => {
            if (command === 'stop') {
                void stopExerciseRef.current();
                return;
            }

            const shouldPause = command === 'pause';
            if (isPausedRef.current === shouldPause) return;
            if (Platform.OS === 'ios') {
                enqueueSpeech(shouldPause ? 'Pause' : 'Fortsæt');
            }
            applyingNativeCommandRef.current = true;
            setIsPaused(shouldPause);
        });

        return () => subscription?.remove();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            let active = true;
            startSpeech(); // Start Android speech service

            // Reset global workout store
            resetWorkoutStoreAndNotify();

            // New workout starts
            setStartTime(Date.now());
            setPace(0);
            setCalories(0);
            setPath([]);
            setSegments([]);
            setElapsedTime(0);
            setDistance(0);
            prevLocationRef.current = null;
            pathRef.current = [];

            activeStartTimeRef.current = Date.now();
            resetProgress();

            const loadCurrentMonthPlan = async () => {
                try {
                    const currentDate = new Date();
                    const currentPeriod = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
                    const plans = await loadPlans();
                    const monthPlan = plans.find((plan) => plan.period === currentPeriod) ?? null;
                    if (!monthPlan) return;

                    const storedWorkouts = await AsyncStorage.getItem('workouts');
                    const workouts: Workout[] = storedWorkouts ? JSON.parse(storedWorkouts) : [];
                    const monthlyWorkouts = workouts.filter((workout) => {
                        const workoutDate = new Date(workout.startTime);
                        return workoutDate.getMonth() === currentDate.getMonth()
                            && workoutDate.getFullYear() === currentDate.getFullYear();
                    });
                    const completedAmount = monthPlan.metric === 'distance'
                        ? monthlyWorkouts.reduce((total, workout) => total + workout.distance, 0) / 1000
                        : monthlyWorkouts.reduce((total, workout) => total + workout.elapsedTime, 0) / 3600;

                    if (!active) return;
                    setMonthPlanProgress(monthPlan, completedAmount);
                } catch (error) {
                    console.error('Failed to load current month plan progress', error);
                }
            };

            loadCurrentMonthPlan();

            // Speak the message
            setTimeout(() => {
                enqueueSpeech(props.exercise);
                enqueueSpeech(`${props.goalAmount} ${(props.goalMetric === "distance" ? "kilometer" : "minutter")}`);
            }, 1000)

            return () => {
                active = false;
                stopSpeech(); // Stop Android speech service when leaving workout
            };
        }, [enqueueSpeech, props.exercise, props.goalAmount, props.goalMetric, resetProgress, setMonthPlanProgress, startSpeech, stopSpeech])
    );

    // Start background location updates
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                );
            }

            if (cancelled) return;
            startLiveActivity();
            startAndroidWorkoutNotification(
                props.exercise,
                props.goalAmount,
                props.goalMetric === 'duration' ? 'min' : 'km',
            );

            updateLiveActivity({
                distance: `0,0 km, `,
                timeSpend: `00:00`,
                percent: 0,
                pace: 0,
                exercise: props.exercise,
                goalAmount: props.goalAmount,
                goalMetric: props.goalMetric === "duration" ? "min" : "km"
            });

            let distanceInterval: number | null = null;
            let timeInterval: number | null = null;

            if (props.exercise === "Cykling") {
                distanceInterval = 15; // Update every 15 meters for cycling
                timeInterval = 5000; // Update every 5 seconds for cycling
            } else if (props.exercise === "Løb") {
                distanceInterval = 5; // Update every 5 meters for running
                timeInterval = 3000; // Update every 3 seconds for running
            } else if (props.exercise === "Gågang") {
                distanceInterval = 5; // Update every 5 meters for walking
                timeInterval = 3000; // Update every 3 seconds for walking
            }

            if (distanceInterval === null || timeInterval === null) {
                console.error('Invalid exercise type for location updates');
                return;
            }

            const foregroundGranted = await hasLocationPermission();
            const backgroundGranted = await hasBackgroundPermission();

            if (cancelled) return;

            if (!foregroundGranted || !backgroundGranted) {
                Alert.alert(
                    'Location Permission Required',
                    Platform.OS === 'android'
                        ? 'Feetness needs Location set to “Allow all the time” to track this workout with the screen locked.'
                        : 'Feetness needs Always Location access to track this workout.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
                    ],
                );
                return;
            }

            await Location.startLocationUpdatesAsync(WORKOUT_LOCATION_TASK, {
                accuracy: Location.Accuracy.High,
                distanceInterval: distanceInterval,
                timeInterval: timeInterval,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                    notificationTitle: 'Workout in progress',
                    notificationBody: 'Tracking your route',
                },
            });
        })().catch((error) => {
            console.error('Unable to start workout location tracking', error);
            Alert.alert(
                'Location Tracking Unavailable',
                'Feetness could not start location tracking. Check your location permissions and that Location is enabled.',
            );
        });

        return () => {
            cancelled = true;
        };
    }, [props.exercise, props.goalAmount, props.goalMetric]);

    const exerciseUpdates = (distance: number, elevationGain: number) => {
        const elapsed = getElapsedSeconds();
        elapsedTimeRef.current = elapsed;
        setElapsedTime(elapsed);

        const met = getMet(props.exercise, paceRef.current);
        const baseCalories = calculateCalories(met, weight, elapsed);
        const elevationCalories = (elevationGain * 0.9 * weight / 100);
        const calories = baseCalories + elevationCalories;
        caloriesRef.current = calories;
        setCalories(calories);

        updateLiveActivity({
            distance: `${(distance / 1000).toFixed(2)} km, `,
            timeSpend: `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`,
            percent: percentageRef.current,
            pace: paceRef.current,
            exercise: props.exercise,
            goalAmount: props.goalAmount,
            goalMetric: props.goalMetric === "duration" ? "min" : "km"
        });

        updateAndroidWorkoutNotification({
            exercise: props.exercise,
            distanceKm: distance / 1000,
            elapsedSeconds: elapsed,
            percent: percentageRef.current,
            pace: paceRef.current,
            goalAmount: props.goalAmount,
            goalMetric: props.goalMetric === 'duration' ? 'min' : 'km',
        });

        publishWatchWorkout({
            status: isPausedRef.current ? 'paused' : 'running',
            exercise: props.exercise,
            distance,
            pace: paceRef.current,
            elapsed,
            calories,
            percent: percentageRef.current,
            goalAmount: props.goalAmount,
            goalMetric: props.goalMetric,
        });

        speakProgressUpdates({
            elapsed,
            distance,
            pace: paceRef.current,
            workoutPercentage: percentageRef.current,
        });
    }

    // Subscribe to the workout store for UI updates
    useEffect(() => {
        const unsubscribe = subscribeToWorkout(({ distance, path, segments, location, elevationGain }) => {
            if (isPausedRef.current) return; // Safe pause

            exerciseUpdates(distance, elevationGain);

            // Update UI state
            distanceRef.current = distance;
            setDistance(distance);

            pathRef.current = path;
            setPath(path);

            setSegments(segments);
            setLocation(location);

            const elapsed = getElapsedSeconds();

            if (distance > 0 && elapsed > 0) {
                const km = distance / 1000;
                const minutes = elapsed / 60;
                paceRef.current = minutes / km;
                setPace(paceRef.current);
            }
        });

        const interval = setInterval(() => {
            if (isPausedRef.current) return; // Safe pause

            exerciseUpdates(distanceRef.current, 0);
        }, 1000); // Second-timer interval for foreground updates (distance/pace updates come from workout store subscription)

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const workoutPausesOrStarts_Resumes = () => {
        // === When workout pauses ===
        if (isPaused) {
            prevLocationRef.current = null;
            prevTimeRef.current = null;

            if (activeStartTimeRef.current) {
                totalActiveMsRef.current += Date.now() - activeStartTimeRef.current;
                activeStartTimeRef.current = null;
            }

            return;
        }

        // === Workout starts OR resumes ===
        activeStartTimeRef.current = Date.now();
    }

    // Load onboarding data from AsyncStorage
    useEffect(() => {
        const loadOnboardingData = async () => {
            setTimeout(async () => {
                try {
                    const STORAGE_KEY = 'onboardingData';
                    const stored = await AsyncStorage.getItem(STORAGE_KEY);
                    if (!stored) return;

                    const data: OnboardingData = JSON.parse(stored);

                    setWeight(data.weight ?? 60);
                } catch (err) {
                    console.error('Failed to load onboarding data', err);
                }
            }, 3000)
        };

        loadOnboardingData();
    }, []);

    const getMet = (exercise: string, paceMinPerKm: number) => {
        if (exercise === "Gågang") {
            if (paceMinPerKm > 12) return 2.8;
            if (paceMinPerKm > 9) return 3.5;
            return 5.0;
        }

        if (exercise === "Løb") {
            const speedKmh = 60 / paceMinPerKm;

            if (speedKmh < 8) return 8.3;
            if (speedKmh < 10) return 9.8;
            if (speedKmh < 12) return 11.5;
            return 12.5;
        }

        if (exercise === "Cykling") {
            const speedKmh = 60 / paceMinPerKm;

            if (speedKmh < 15) return 4.5;
            if (speedKmh < 20) return 6.8;
            if (speedKmh < 25) return 8.5;
            return 10.5;
        }

        return 1;
    };

    const calculateCalories = (
        met: number,
        weightKg: number,
        elapsedSeconds: number
    ) => {
        const hours = elapsedSeconds / 3600;
        return met * weightKg * hours;
    };

    const getElapsedSeconds = () => {
        const activeMs = activeStartTimeRef.current
            ? Date.now() - activeStartTimeRef.current
            : 0;

        return Math.floor((totalActiveMsRef.current + activeMs) / 1000);
    };

    const stopExercise = async () => {
        try {
            // Stop background tracking
            const hasStarted = await Location.hasStartedLocationUpdatesAsync(WORKOUT_LOCATION_TASK);
            if (hasStarted) {
                await Location.stopLocationUpdatesAsync(WORKOUT_LOCATION_TASK);
            }

            // Stop live activity
            endLiveActivity();
            endAndroidWorkoutNotification();
            publishWatchWorkout({
                status: 'finished',
                exercise: props.exercise,
                distance: distanceRef.current,
                pace: paceRef.current,
                elapsed: elapsedTimeRef.current,
                calories: caloriesRef.current,
                percent: percentageRef.current,
                goalAmount: props.goalAmount,
                goalMetric: props.goalMetric,
            });

            locationSubRef.current?.remove();
            locationSubRef.current = null;

            // Show entire route
            if (pathRef.current.length > 1) {
                mapRef.current?.fitToCoordinates(pathRef.current, {
                    edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                    animated: true,
                });
            }

            // Save workout to AsyncStorage
            const workoutData: Workout = {
                id: Date.now(),
                exercise: props.exercise,
                goalAmount: props.goalAmount,
                goalMetric: props.goalMetric,
                percentage,
                startTime: startTimeRef.current,
                endTime: Date.now(),
                distance: distanceRef.current,
                elapsedTime: elapsedTimeRef.current,
                pace: paceRef.current,
                calories: caloriesRef.current,
                path: pathRef.current,
                segments,
            };

            // Save workout
            const storedWorkouts = await AsyncStorage.getItem('workouts');
            const workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
            workouts.push(workoutData);
            await AsyncStorage.setItem('workouts', JSON.stringify(workouts));

            //Reset global workout store after finishing
            resetWorkoutStoreAndNotify();

            router.replace({
                pathname: "/finished-exercise",
                params: {
                    workout: JSON.stringify(workoutData),
                },
            });
        } catch (error) {
            console.error('Error stopping workout', error);
        }
    };

    stopExerciseRef.current = stopExercise;

    if (activeView === 'map') {
        return (
            <View style={styles.container}>
                <View style={styles.fullMapContainer}>
                    <ExerciseMap
                        location={location}
                        segments={segments}
                        startPoint={startPoint}
                        mapRef={mapRef}
                        showUserLocation={false}
                    />
                </View>
                <View style={styles.mapControls}>
                    <CompactExerciseStats
                        theme={theme}
                        distance={distance}
                        elapsedTime={elapsedTime}
                        pace={pace}
                    />
                    <Pressable
                        style={styles.closeMapButton}
                        onPress={() => setActiveView('summary')}
                        accessibilityRole="button"
                        accessibilityLabel="Luk kortvisning"
                    >
                        <FontAwesome5
                            name="times"
                            size={22}
                            color={theme.colors.onPrimary}
                        />
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <ExerciseMap
                    location={location}
                    segments={segments}
                    startPoint={startPoint}
                    mapRef={mapRef}
                    showUserLocation
                />
            </View>

            <ExerciseStats
                theme={theme}
                distance={distance}
                elapsedTime={elapsedTime}
                pace={pace}
                calories={calories}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
                stopExercise={stopExercise}
            />

            <Pressable
                style={[
                    styles.goalSibling,
                    styles.mapButton,
                ]}
                onPress={() => setActiveView('map')}
                accessibilityRole="button"
                accessibilityLabel="Åbn kortvisning"
            >
                <FontAwesome5
                    name="expand-arrows-alt"
                    size={22}
                    color={theme.colors.onPrimary}
                />
            </Pressable>
            <View style={styles.goalOverlay}>
                <GoalProgress
                    percentage={percentage}
                    goalAmount={props.goalAmount}
                    goalMetric={props.goalMetric}
                />
            </View>
            <Pressable
                style={[styles.goalSibling, styles.muteButton]}
                onPress={toggleMute}
                accessibilityRole="button"
                accessibilityLabel={isMuted ? 'Slå stemmevejledning til' : 'Slå stemmevejledning fra'}
                accessibilityState={{ checked: isMuted }}
            >
                <FontAwesome6
                    name={isMuted ? 'volume-xmark' : 'volume-high'}
                    size={22}
                    color={theme.colors.onPrimary}
                />
            </Pressable>
        </View>
    );
};
