import { createStyles } from '@/components/exercise/exercise/CreateStyles';
import { GoalProgress } from '@/components/exercise/GoalProgress';
import { Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { WORKOUT_LOCATION_TASK } from '@/utils/location/workoutLocationTask';
import { resetWorkoutStoreAndNotify, subscribeToWorkout } from '@/utils/location/workoutStore';
import { endLiveActivity, startLiveActivity, updateLiveActivity } from '@/utils/native/LiveActivityModule';
import { speak, startSpeechService, stopSpeak, stopSpeechService } from "@/utils/native/NativeSpeech";
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
    const [path, setPath] = useState<
        { latitude: number; longitude: number }[]
    >([]);
    const [segments, setSegments] = useState<
        {
            coords: { latitude: number; longitude: number }[];
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

    const percentageRef = React.useRef<number>(percentage);
    const isPausedRef = React.useRef<boolean>(isPaused);
    const startTimeRef = React.useRef<number>(startTime);
    const distanceRef = React.useRef<number>(distance);
    const elapsedTimeRef = React.useRef<number>(elapsedTime);
    const paceRef = React.useRef<number>(pace);
    const activeStartTimeRef = React.useRef<number | null>(null);
    const totalActiveMsRef = React.useRef<number>(0);
    const lastSpokenBucketRef = React.useRef(0); // bucket = Math.floor(elapsed / 300)
    const lastSpokenPercentageBucketRef = React.useRef(0); // percentageBucket = Math.floor(percentage / 10)

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
                taskName: `Distance: 0,0 km, `,
                timeSpend: `Tid: 00:00`
            });

            await Location.startLocationUpdatesAsync(WORKOUT_LOCATION_TASK, {
                accuracy: Location.Accuracy.High,
                distanceInterval: 5, // Update every 5 meters
                timeInterval: 3000, // Update every 3 seconds (in case distanceInterval isn't met)
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                    notificationTitle: 'Workout in progress',
                    notificationBody: 'Tracking your route',
                },
            });
        })();
    }, []);

    // Subscribe to the workout store for UI updates
    useEffect(() => {
        const unsubscribe = subscribeToWorkout(({ distance, path, segments, location }) => {
            if (isPausedRef.current) return; // Safe pause

            // Update UI state
            distanceRef.current = distance;
            setDistance(distance);

            pathRef.current = path;
            setPath(path);

            setSegments(segments);
            setLocation(location);

            const elapsed = getElapsedSeconds();
            elapsedTimeRef.current = elapsed;
            setElapsedTime(elapsed);

            if (distance > 0 && elapsed > 0) {
                const km = distance / 1000;
                const minutes = elapsed / 60;
                paceRef.current = minutes / km;
                setPace(paceRef.current);
            }

            updateLiveActivity({
                taskName: `Distance: ${(distance / 1000).toFixed(2)} km, `,
                timeSpend: `Tid: ${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`
            });

            speakProgress(elapsed);
            speakPercentageProgress();
        });

        return () => {
            unsubscribe();
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

    const paceToColor = (pace: number) => {
        if (pace === 0 || !isFinite(pace)) return '#95a5a6'; // unknown / paused

        if (pace < 5) return '#e74c3c';   // fast (<5:00 min/km) → red
        if (pace < 6) return '#f1c40f';   // moderate (5–6) → yellow
        return '#2ecc71';                 // easy (>6) → green
    };

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
                    paceToColor={paceToColor}
                />
            </View>

            <ExerciseStats
                theme={theme}
                distance={distance}
                elapsedTime={elapsedTime}
                pace={pace}
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
