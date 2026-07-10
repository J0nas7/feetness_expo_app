import { createStyles } from '@/components/exercise/exercise/CreateStyles';
import { GoalProgress } from '@/components/exercise/GoalProgress';
import { OnboardingData, Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { WORKOUT_LOCATION_TASK } from '@/utils/location/workoutLocationTask';
import { resetWorkoutStoreAndNotify, subscribeToWorkout } from '@/utils/location/workoutStore';
import { endLiveActivity, startLiveActivity, updateLiveActivity } from '@/utils/native/LiveActivityModule';
import { speak, startSpeechService, stopSpeak, stopSpeechService } from "@/utils/native/NativeSpeech";
import { sendWorkoutUpdate } from '@/utils/native/WatchBridge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import MapView from 'react-native-maps';
import { ExerciseMap } from './ExerciseMap';
import { ExerciseStats } from './ExerciseStats';

export interface ExerciseProps {
    exercise: "Cykling" | "Løb" | "Gågang";
    goalAmount: number;
    goalMetric: "duration" | "distance";
}

export const Exercise: React.FC<ExerciseProps> = (props) => {
    const theme = useTheme() as MyTheme;
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
    const lastSpokenBucketRef = React.useRef(0); // bucket = Math.floor(elapsed / 300)
    const lastSpokenPercentageBucketRef = React.useRef(0); // percentageBucket = Math.floor(percentage / 10)
    const lastSpokenDistanceBucketRef = React.useRef(0); // distanceBucket = Math.floor(distance / 1000)

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

    useEffect(() => { workoutPausesOrStarts_Resumes() }, [isPaused]);

    useFocusEffect(
        React.useCallback(() => {
            startSpeechService(); // Start Android speech service

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
            lastSpokenBucketRef.current = 0;
            lastSpokenPercentageBucketRef.current = 0;

            // Speak the message
            setTimeout(() => {
                speak(props.exercise);
                setTimeout(() => {
                    speak(`${props.goalAmount} ${(props.goalMetric === "distance" ? "kilometer" : "minutter")}`);
                }, 1000)
            }, 1000)

            return () => {
                stopSpeak();
                stopSpeechService(); // Stop Android speech service when leaving workout
            };
        }, [])
    );

    // Start background location updates
    useEffect(() => {
        (async () => {
            startLiveActivity();

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
        })();
    }, []);

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

        sendWorkoutUpdate(distance, paceRef.current, elapsed);

        speakProgress(elapsed);
        speakPercentageProgress();
        speakDistanceProgress();
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

    const speakProgress = (elapsed: number) => {
        // 5-minute buckets
        const BUCKET_SECONDS = 300;
        const bucket = Math.floor(elapsed / BUCKET_SECONDS);

        if (bucket > lastSpokenBucketRef.current) {
            lastSpokenBucketRef.current = bucket;

            const distKm = Math.floor(distanceRef.current / 1000);
            const distDecimal = ((distanceRef.current / 1000).toFixed(2).split('.')[1]);

            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);

            const paceMinutes = Math.floor(paceRef.current);
            const paceSeconds = Math.floor((paceRef.current - paceMinutes) * 60);

            // Only speak every 30 seconds
            speak(
                `Fremskridt ${percentageRef.current} procent, ` +
                `varighed ${hours > 0 ? `${hours} time og ` : ''}${minutes} minutter, ` +
                `distance ${distKm} komma ${distDecimal} kilometer, ` +
                `tempo ${paceMinutes} minutter og ${paceSeconds} sekunder`
            );
        }
    };

    const speakPercentageProgress = () => {
        // 20% buckets: 20, 40, 60, 80, 100
        const bucket = Math.floor(percentageRef.current / 20);

        // Ignore 0%
        if (bucket <= 0) return;

        if (bucket > lastSpokenPercentageBucketRef.current) {
            lastSpokenPercentageBucketRef.current = bucket;

            const reachedPercentage = bucket * 20;

            speak(`Du har nået ${reachedPercentage} procent af dit mål.`);
        }
    };

    const speakDistanceProgress = () => {
        // 1km buckets: 1, 2, 3, 4, 5...
        const bucket = Math.floor(distanceRef.current / 1000);

        // Ignore 0km
        if (bucket <= 0) return;

        if (bucket > lastSpokenDistanceBucketRef.current) {
            lastSpokenDistanceBucketRef.current = bucket;

            const reachedDistance = bucket; // in km

            speak(`Du har nået ${reachedDistance} kilometer.`);
        }
    };

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

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <ExerciseMap
                    location={location}
                    segments={segments}
                    startPoint={startPoint}
                    mapRef={mapRef}
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

            <View style={styles.goalOverlay}>
                <GoalProgress
                    percentage={percentage}
                    goalAmount={props.goalAmount}
                    goalMetric={props.goalMetric}
                />
            </View>
        </View>
    );
};
