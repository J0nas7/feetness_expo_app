import { createStyles } from '@/components/exercise/exercise/CreateStyles';
import { GoalProgress } from '@/components/exercise/GoalProgress';
import { calculateWorkoutCalories, getWorkoutMet, useWorkoutSession } from '@/hooks/useWorkoutSession';
import { usePlans } from '@/hooks/usePlans';
import { useSpeech } from '@/hooks/useSpeech';
import { activityName, t } from '@/i18n';
import { OnboardingData } from '@/types';
import { MyTheme } from '@/types/theme';
import { hasBackgroundPermission, hasLocationPermission } from '@/utils/location/location';
import { WORKOUT_LOCATION_TASK } from '@/utils/location/workoutLocationTask';
import { resetWorkoutLocationAnchor, resetWorkoutStoreAndNotify, subscribeToWorkout } from '@/utils/location/workoutStore';
import { subscribeToWorkoutCommands } from '@/utils/native/LiveActivityModule';
import { subscribeToWatchWorkoutCommands } from '@/utils/native/WatchBridge';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, PermissionsAndroid, Platform, Pressable, View } from 'react-native';
import MapView from 'react-native-maps';
import { ExerciseMap } from './ExerciseMap';
import { CompactExerciseStats, ExerciseStats } from './ExerciseStats';

export interface ExerciseProps {
    exercise: "cycling" | "running" | "walking";
    goalAmount: number;
    goalMetric: "duration" | "distance";
}

export const Exercise: React.FC<ExerciseProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const { enqueueSpeech, isMuted, resetProgress, setMonthPlanProgress, speakProgressUpdates, start: startSpeech, stop: stopSpeech, toggleMute } = useSpeech();
    const { loadCurrentMonthPlan } = usePlans();
    const { communicateWorkoutUpdate, pauseWorkout, publishWorkoutState, startWorkout, stopWorkout } = useWorkoutSession({
        exercise: props.exercise,
        goalAmount: props.goalAmount,
        goalMetric: props.goalMetric,
        speakProgressUpdates,
    });
    const [activeView, setActiveView] = useState<'summary' | 'map'>('summary');
    const [isPaused, setIsPaused] = useState(false); // pause/resume
    const [startTime, setStartTime] = useState<number>(Date.now()); // Start time in milliseconds
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [distance, setDistance] = useState<number>(0); // Distance in meters
    const [elapsedActiveTime, setElapsedActiveTime] = useState<number>(0);
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
        progress = elapsedActiveTime / (props.goalAmount * 60);
    }
    progress = Math.min(progress, 1); // clamp 0 → 1
    const percentage = Math.round(progress * 100);

    const [weight, setWeight] = useState(60);

    const percentageRef = React.useRef<number>(percentage);
    const isPausedRef = React.useRef<boolean>(isPaused);
    const startTimeRef = React.useRef<number>(startTime);
    const distanceRef = React.useRef<number>(distance);
    const totalElapsedWorkoutTimeRef = React.useRef<number>(0);
    const elapsedActiveTimeRef = React.useRef<number>(elapsedActiveTime);
    const elapsedPausedTimeRef = React.useRef<number>(0);
    const distanceActiveRef = React.useRef<number>(0);
    const distancePausedRef = React.useRef<number>(0);
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
    const stopExercise = () => {
        totalElapsedWorkoutTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
        elapsedPausedTimeRef.current = Math.max(totalElapsedWorkoutTimeRef.current - elapsedActiveTimeRef.current, 0);
        return stopWorkout({
            percentage, distanceRef, elapsedTimeRef: elapsedActiveTimeRef, elapsedPausedTimeRef, distancePausedRef, paceRef, caloriesRef, percentageRef,
            startTimeRef, pathRef, segments, locationSubRef, mapRef,
        });
    };
    stopExerciseRef.current = stopExercise;

    useEffect(() => { percentageRef.current = percentage; }, [percentage]);
    useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
    useEffect(() => { distanceRef.current = distance; }, [distance]);
    useEffect(() => { elapsedActiveTimeRef.current = elapsedActiveTime; }, [elapsedActiveTime]);
    useEffect(() => { paceRef.current = pace; }, [pace]);
    useEffect(() => { isPausedRef.current = isPaused }, [isPaused]);

    useEffect(() => {
        if (isPaused) {
            prevLocationRef.current = null;
            prevTimeRef.current = null;
            if (activeStartTimeRef.current) {
                totalActiveMsRef.current += Date.now() - activeStartTimeRef.current;
                activeStartTimeRef.current = null;
            }
        } else {
            activeStartTimeRef.current = Date.now();
        }
        resetWorkoutLocationAnchor();

        publishWorkoutState({
            distance: distanceRef.current,
            pace: paceRef.current,
            elapsed: elapsedActiveTimeRef.current,
            calories: caloriesRef.current,
            percentage: percentageRef.current,
            isPaused,
        });

        if (!pauseStateInitializedRef.current) {
            pauseStateInitializedRef.current = true;
        } else if (applyingNativeCommandRef.current) {
            applyingNativeCommandRef.current = false;
        } else {
            enqueueSpeech(t(isPaused ? 'common.actions.pause' : 'common.actions.resume'));
            pauseWorkout(isPaused);
        }
    }, [enqueueSpeech, isPaused, pauseWorkout, publishWorkoutState]);

    useEffect(() => {
        const subscription = subscribeToWatchWorkoutCommands((command) => {
            if (command === 'stop') {
                void stopExerciseRef.current();
                return;
            }

            const shouldPause = command === 'pause';
            if (isPausedRef.current === shouldPause) return;
            enqueueSpeech(t(shouldPause ? 'common.actions.pause' : 'common.actions.resume'));
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
                enqueueSpeech(t(shouldPause ? 'common.actions.pause' : 'common.actions.resume'));
            }
            applyingNativeCommandRef.current = true;
            setIsPaused(shouldPause);
        });

        return () => subscription?.remove();
    }, [enqueueSpeech]);

    useFocusEffect(
        React.useCallback(() => {
            let active = true;
            startSpeech(); // Start Android speech service

            // Reset global workout store
            resetWorkoutStoreAndNotify();

            // New workout starts
            const workoutStartedAt = Date.now();
            setStartTime(workoutStartedAt);
            startTimeRef.current = workoutStartedAt;
            setPace(0);
            setCalories(0);
            setPath([]);
            setSegments([]);
            setElapsedActiveTime(0);
            setDistance(0);
            totalElapsedWorkoutTimeRef.current = 0;
            elapsedActiveTimeRef.current = 0;
            elapsedPausedTimeRef.current = 0;
            distanceActiveRef.current = 0;
            distancePausedRef.current = 0;
            prevLocationRef.current = null;
            pathRef.current = [];

            totalActiveMsRef.current = 0;
            activeStartTimeRef.current = workoutStartedAt;
            resetProgress();

            loadCurrentMonthPlan()
                .then((currentMonthPlan) => {
                    if (!active || !currentMonthPlan) return;
                    setMonthPlanProgress(currentMonthPlan.monthPlan, currentMonthPlan.completedAmount);
                })
                .catch((error) => {
                    console.error('Failed to load current month plan progress', error);
                });

            // Speak the message
            setTimeout(() => {
                enqueueSpeech(activityName(props.exercise));
                const unitKey = props.goalMetric === 'distance'
                    ? (props.goalAmount === 1 ? 'kilometer' : 'kilometers')
                    : (props.goalAmount === 1 ? 'minute' : 'minutes');
                enqueueSpeech(t('exercise.speech.goal', {
                    amount: props.goalAmount,
                    unit: t(`exercise.speech.${unitKey}`),
                }));
            }, 1000)

            return () => {
                active = false;
                stopSpeech(); // Stop Android speech service when leaving workout
            };
        }, [enqueueSpeech, loadCurrentMonthPlan, props.exercise, props.goalAmount, props.goalMetric, resetProgress, setMonthPlanProgress, startSpeech, stopSpeech])
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
            startWorkout();

            let distanceInterval: number | null = null;
            let timeInterval: number | null = null;

            if (props.exercise === "cycling") {
                distanceInterval = 15; // Update every 15 meters for cycling
                timeInterval = 5000; // Update every 5 seconds for cycling
            } else if (props.exercise === "running") {
                distanceInterval = 5; // Update every 5 meters for running
                timeInterval = 3000; // Update every 3 seconds for running
            } else if (props.exercise === "walking") {
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
                    t('exercise.location.permissionTitle'),
                    Platform.OS === 'android'
                        ? t('exercise.location.androidPermission')
                        : t('exercise.location.iosPermission'),
                    [
                        { text: t('common.actions.cancel'), style: 'cancel' },
                        { text: t('exercise.location.openSettings'), onPress: () => void Linking.openSettings() },
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
                    notificationTitle: t('exercise.location.notificationTitle'),
                    notificationBody: t('exercise.location.notificationBody'),
                },
            });
        })().catch((error) => {
            console.error('Unable to start workout location tracking', error);
            Alert.alert(
                t('exercise.location.unavailableTitle'),
                t('exercise.location.unavailableMessage'),
            );
        });

        return () => {
            cancelled = true;
        };
    }, [props.exercise, props.goalAmount, props.goalMetric, startWorkout]);

    // Update workout stats and communicate updates to the watch
    const exerciseUpdatesRef = React.useRef<(distance: number, elevationGain: number) => void>(() => { });
    useEffect(() => {
        exerciseUpdatesRef.current = (distance, elevationGain) => {
            const activeMs = activeStartTimeRef.current
                ? Date.now() - activeStartTimeRef.current
                : 0;
            const elapsed = Math.floor((totalActiveMsRef.current + activeMs) / 1000);
            elapsedActiveTimeRef.current = elapsed;
            setElapsedActiveTime(elapsed);

            const currentProgress = props.goalMetric === 'distance'
                ? distance / (props.goalAmount * 1000)
                : elapsed / (props.goalAmount * 60);
            percentageRef.current = Math.round(Math.min(currentProgress, 1) * 100);

            const met = getWorkoutMet(props.exercise, paceRef.current);
            const calories = calculateWorkoutCalories(met, weight, elapsed) + (elevationGain * 0.9 * weight / 100);
            caloriesRef.current = calories;
            setCalories(calories);

            // Communicate updates to the watch and live activity
            communicateWorkoutUpdate({
                elapsed,
                distance,
                pace: paceRef.current,
                calories,
                percentage: percentageRef.current,
                isPaused: isPausedRef.current,
            });
        };
    }, [communicateWorkoutUpdate, props.exercise, props.goalAmount, props.goalMetric, weight]);

    // Subscribe to the workout store for UI updates
    useEffect(() => {
        const unsubscribe = subscribeToWorkout(({ distance, distanceDelta, path, segments, location, elevationGain }) => {
            setLocation(location);

            if (isPausedRef.current) {
                distancePausedRef.current += distanceDelta;
                return;
            }

            distanceActiveRef.current += distanceDelta;

            const elapsed = getElapsedSeconds();
            if (distance > 0 && elapsed > 0) {
                const km = distance / 1000;
                const minutes = elapsed / 60;
                paceRef.current = minutes / km;
                setPace(paceRef.current);
            }

            exerciseUpdatesRef.current(distance, elevationGain);

            // Update UI state
            distanceRef.current = distance;
            setDistance(distance);

            pathRef.current = path;
            setPath(path);

            setSegments(segments);
        });

        const interval = setInterval(() => {
            const totalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            totalElapsedWorkoutTimeRef.current = totalElapsed;

            if (isPausedRef.current) {
                elapsedPausedTimeRef.current = Math.max(totalElapsed - elapsedActiveTimeRef.current, 0);
                return;
            }

            exerciseUpdatesRef.current(distanceRef.current, 0);
        }, 1000); // Second-timer interval for foreground updates (distance/pace updates come from workout store subscription)

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

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

    const getElapsedSeconds = () => {
        const activeMs = activeStartTimeRef.current
            ? Date.now() - activeStartTimeRef.current
            : 0;

        return Math.floor((totalActiveMsRef.current + activeMs) / 1000);
    };

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
                        elapsedTime={elapsedActiveTime}
                        pace={pace}
                    />
                    <Pressable
                        style={styles.closeMapButton}
                        onPress={() => setActiveView('summary')}
                        accessibilityRole="button"
                        accessibilityLabel={t('exercise.closeMap')}
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
                elapsedTime={elapsedActiveTime}
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
                accessibilityLabel={t('exercise.openMap')}
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
                accessibilityLabel={t(isMuted ? 'exercise.enableVoice' : 'exercise.disableVoice')}
                accessibilityState={{ checked: isMuted }}
            >
                <FontAwesome5
                    name={isMuted ? 'volume-mute' : 'volume-up'}
                    size={22}
                    color={theme.colors.onPrimary}
                />
            </Pressable>
        </View>
    );
};
