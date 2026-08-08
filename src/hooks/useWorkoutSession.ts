import { ProgressBucketUpdate } from '@/hooks/useSpeech';
import { Segment, Workout } from '@/types';
import { WORKOUT_LOCATION_TASK } from '@/utils/location/workoutLocationTask';
import { resetWorkoutStoreAndNotify } from '@/utils/location/workoutStore';
import { endAndroidWorkoutNotification, endLiveActivity, setNativeWorkoutPaused, startAndroidWorkoutNotification, startLiveActivity, updateAndroidWorkoutNotification, updateLiveActivity } from '@/utils/native/LiveActivityModule';
import { publishWatchWorkout } from '@/utils/native/WatchBridge';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback } from 'react';
import MapView from 'react-native-maps';
import { useWorkouts } from './useWorkouts';

type ValueRef<T> = { current: T };
type ProgressUpdate = { elapsed: number; distance: number; pace: number; workoutPercentage: number };
type WorkoutUpdate = { distance: number; elapsed: number; pace: number; calories: number; percentage: number; isPaused: boolean };

type SessionOptions = {
    exercise: Workout['exercise'];
    goalAmount: number;
    goalMetric: Workout['goalMetric'];
    speakProgressUpdates: (update: ProgressUpdate) => ProgressBucketUpdate[];
};

export type StopWorkoutOptions = {
    percentage: number;
    distanceRef: ValueRef<number>;
    elapsedTimeRef: ValueRef<number>;
    elapsedPausedTimeRef: ValueRef<number>;
    distancePausedRef: ValueRef<number>;
    paceRef: ValueRef<number>;
    caloriesRef: ValueRef<number>;
    percentageRef: ValueRef<number>;
    startTimeRef: ValueRef<number>;
    pathRef: ValueRef<Workout['path']>;
    segments: Segment[];
    locationSubRef: ValueRef<Location.LocationSubscription | null>;
    mapRef: ValueRef<MapView | null>;
};

export const getWorkoutMet = (exercise: Workout['exercise'], paceMinPerKm: number) => {
    if (exercise === 'walking') return paceMinPerKm > 12 ? 2.8 : paceMinPerKm > 9 ? 3.5 : 5;
    const speedKmh = 60 / paceMinPerKm;
    if (exercise === 'running') return speedKmh < 8 ? 8.3 : speedKmh < 10 ? 9.8 : speedKmh < 12 ? 11.5 : 12.5;
    return speedKmh < 15 ? 4.5 : speedKmh < 20 ? 6.8 : speedKmh < 25 ? 8.5 : 10.5;
};

export const calculateWorkoutCalories = (met: number, weightKg: number, elapsedSeconds: number) =>
    met * weightKg * (elapsedSeconds / 3600);

export function useWorkoutSession({ exercise, goalAmount, goalMetric, speakProgressUpdates }: SessionOptions) {
    const { updateWorkout } = useWorkouts();

    const startWorkout = useCallback(() => {
        startLiveActivity();
        startAndroidWorkoutNotification(exercise, goalAmount, goalMetric === 'duration' ? 'min' : 'km');
        updateLiveActivity({ distance: '0,0 km, ', timeSpend: '00:00', percent: 0, pace: 0, exercise, goalAmount, goalMetric: goalMetric === 'duration' ? 'min' : 'km' });
    }, [exercise, goalAmount, goalMetric]);

    const pauseWorkout = useCallback((paused: boolean) => {
        setNativeWorkoutPaused(paused);
    }, []);

    const publishWorkoutState = useCallback((update: WorkoutUpdate) => {
        publishWatchWorkout({ status: update.isPaused ? 'paused' : 'running', exercise, distance: update.distance, pace: update.pace, elapsed: update.elapsed, calories: update.calories, percent: update.percentage, goalAmount, goalMetric });
    }, [exercise, goalAmount, goalMetric]);

    const communicateWorkoutUpdate = useCallback((update: WorkoutUpdate) => {
        const nativeGoalMetric = goalMetric === 'duration' ? 'min' : 'km';
        updateLiveActivity({ distance: `${(update.distance / 1000).toFixed(2)} km, `, timeSpend: `${Math.floor(update.elapsed / 60)}:${String(Math.floor(update.elapsed % 60)).padStart(2, '0')}`, percent: update.percentage, pace: update.pace, exercise, goalAmount, goalMetric: nativeGoalMetric });
        updateAndroidWorkoutNotification({ exercise, distanceKm: update.distance / 1000, elapsedSeconds: update.elapsed, percent: update.percentage, pace: update.pace, goalAmount, goalMetric: nativeGoalMetric });
        const bucketTimestamp = Date.now();
        const bucketUpdates = speakProgressUpdates({ elapsed: update.elapsed, distance: update.distance, pace: update.pace, workoutPercentage: update.percentage }).map((item, index) => ({ ...item, id: `${bucketTimestamp}-${index}`, createdAt: bucketTimestamp }));
        publishWatchWorkout({ status: update.isPaused ? 'paused' : 'running', exercise, distance: update.distance, pace: update.pace, elapsed: update.elapsed, calories: update.calories, percent: update.percentage, goalAmount, goalMetric, bucketUpdates: bucketUpdates.length ? bucketUpdates : undefined });
    }, [exercise, goalAmount, goalMetric, speakProgressUpdates]);

    const stopWorkout = useCallback(async ({ percentage, distanceRef, elapsedTimeRef, elapsedPausedTimeRef, distancePausedRef, paceRef, caloriesRef, percentageRef, startTimeRef, pathRef, segments, locationSubRef, mapRef }: StopWorkoutOptions) => {
        try {
            if (await Location.hasStartedLocationUpdatesAsync(WORKOUT_LOCATION_TASK)) await Location.stopLocationUpdatesAsync(WORKOUT_LOCATION_TASK);
            endLiveActivity();
            endAndroidWorkoutNotification();
            publishWatchWorkout({ status: 'finished', exercise, distance: distanceRef.current, pace: paceRef.current, elapsed: elapsedTimeRef.current, calories: caloriesRef.current, percent: percentageRef.current, goalAmount, goalMetric });
            locationSubRef.current?.remove();
            locationSubRef.current = null;
            if (pathRef.current.length > 1) mapRef.current?.fitToCoordinates(pathRef.current, { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true });
            const workout: Workout = { id: Date.now(), exercise, goalAmount, goalMetric, percentage, startTime: startTimeRef.current, endTime: Date.now(), distance: distanceRef.current, elapsedTime: elapsedTimeRef.current, pausedDistance: distancePausedRef.current, pausedTime: elapsedPausedTimeRef.current, pace: paceRef.current, calories: caloriesRef.current, path: pathRef.current, segments };
            await updateWorkout(workout);
            resetWorkoutStoreAndNotify();
            router.replace({ pathname: '/finished-exercise', params: { workout: JSON.stringify(workout) } });
        } catch (error) {
            console.error('Error stopping workout', error);
        }
    }, [exercise, goalAmount, goalMetric, updateWorkout]);

    return { communicateWorkoutUpdate, pauseWorkout, publishWorkoutState, startWorkout, stopWorkout };
}
