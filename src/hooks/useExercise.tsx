import { Segment, Workout } from '@/types';
import { WORKOUT_LOCATION_TASK } from '@/utils/location/workoutLocationTask';
import { resetWorkoutStoreAndNotify } from '@/utils/location/workoutStore';
import { endAndroidWorkoutNotification, endLiveActivity } from '@/utils/native/LiveActivityModule';
import { publishWatchWorkout } from '@/utils/native/WatchBridge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback } from 'react';
import MapView from 'react-native-maps';

type ValueRef<T> = { current: T };

type UseExerciseOptions = {
    exercise: Workout['exercise'];
    goalAmount: number;
    goalMetric: Workout['goalMetric'];
    percentage: number;
    distanceRef: ValueRef<number>;
    elapsedTimeRef: ValueRef<number>;
    paceRef: ValueRef<number>;
    caloriesRef: ValueRef<number>;
    percentageRef: ValueRef<number>;
    startTimeRef: ValueRef<number>;
    pathRef: ValueRef<Workout['path']>;
    segments: Segment[];
    locationSubRef: ValueRef<Location.LocationSubscription | null>;
    mapRef: ValueRef<MapView | null>;
};

export function useExercise({
    exercise,
    goalAmount,
    goalMetric,
    percentage,
    distanceRef,
    elapsedTimeRef,
    paceRef,
    caloriesRef,
    percentageRef,
    startTimeRef,
    pathRef,
    segments,
    locationSubRef,
    mapRef,
}: UseExerciseOptions) {
    const stopExercise = useCallback(async () => {
        try {
            const hasStarted = await Location.hasStartedLocationUpdatesAsync(WORKOUT_LOCATION_TASK);
            if (hasStarted) {
                await Location.stopLocationUpdatesAsync(WORKOUT_LOCATION_TASK);
            }

            endLiveActivity();
            endAndroidWorkoutNotification();
            publishWatchWorkout({
                status: 'finished',
                exercise,
                distance: distanceRef.current,
                pace: paceRef.current,
                elapsed: elapsedTimeRef.current,
                calories: caloriesRef.current,
                percent: percentageRef.current,
                goalAmount,
                goalMetric,
            });

            locationSubRef.current?.remove();
            locationSubRef.current = null;

            if (pathRef.current.length > 1) {
                mapRef.current?.fitToCoordinates(pathRef.current, {
                    edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                    animated: true,
                });
            }

            const workoutData: Workout = {
                id: Date.now(),
                exercise,
                goalAmount,
                goalMetric,
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

            const storedWorkouts = await AsyncStorage.getItem('workouts');
            const workouts: Workout[] = storedWorkouts ? JSON.parse(storedWorkouts) : [];
            workouts.push(workoutData);
            await AsyncStorage.setItem('workouts', JSON.stringify(workouts));

            resetWorkoutStoreAndNotify();

            router.replace({
                pathname: '/finished-exercise',
                params: { workout: JSON.stringify(workoutData) },
            });
        } catch (error) {
            console.error('Error stopping workout', error);
        }
    }, [
        caloriesRef,
        distanceRef,
        elapsedTimeRef,
        exercise,
        goalAmount,
        goalMetric,
        locationSubRef,
        mapRef,
        paceRef,
        pathRef,
        percentage,
        percentageRef,
        segments,
        startTimeRef,
    ]);

    return { stopExercise };
}
