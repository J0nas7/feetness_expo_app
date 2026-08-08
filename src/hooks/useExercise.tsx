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

type WorkoutPeriod = {
    year?: string;
    month?: string;
    week?: string;
};

type BulkWorkoutUpdate = {
    workoutIds: number[];
    exercise?: Workout['exercise'];
    goal?: {
        metric: Workout['goalMetric'];
        amount: number;
    };
};

const getISOWeekInfo = (dateValue: Date) => {
    const date = new Date(dateValue.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const year = date.getFullYear();
    const weekOne = new Date(year, 0, 4);
    const week = 1 + Math.round(
        ((date.getTime() - weekOne.getTime()) / 86400000 - 3 + ((weekOne.getDay() + 6) % 7)) / 7
    );
    return { year, week };
};

type StopExerciseOptions = {
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

export function useExercise() {
    const STORAGE_KEY = 'workouts';

    const bulkDestroyWorkouts = useCallback(async (workoutIds: number[]) => {
        const selectedIds = new Set(workoutIds);
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const workouts: Workout[] = stored ? JSON.parse(stored) : [];
        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(workouts.filter((workout) => !selectedIds.has(workout.id))),
        );
    }, []);

    const bulkUpdateWorkouts = useCallback(async ({ workoutIds, exercise, goal }: BulkWorkoutUpdate) => {
        const selectedIds = new Set(workoutIds);
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const workouts: Workout[] = stored ? JSON.parse(stored) : [];
        const updatedWorkouts = workouts.map((workout) => {
            if (!selectedIds.has(workout.id)) return workout;
            const completed = goal?.metric === 'distance'
                ? workout.distance / 1000
                : workout.elapsedTime / 60;

            return {
                ...workout,
                ...(exercise ? { exercise } : {}),
                ...(goal ? {
                    goalMetric: goal.metric,
                    goalAmount: goal.amount,
                    percentage: completed / goal.amount * 100,
                } : {}),
            };
        });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWorkouts));
    }, []);

    const destroyWorkout = useCallback(async (workout: Workout) => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const workouts: Workout[] = JSON.parse(stored);
        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(workouts.filter((item) => item.id !== workout.id)),
        );
    }, []);

    const indexWorkouts = useCallback(async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        return (stored ? JSON.parse(stored) : []) as Workout[];
    }, []);

    const updateWorkout = useCallback(async (updatedWorkout: Workout) => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const workouts: Workout[] = stored ? JSON.parse(stored) : [];
        const exists = workouts.some((workout) => workout.id === updatedWorkout.id);
        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(exists
                ? workouts.map((workout) => workout.id === updatedWorkout.id ? updatedWorkout : workout)
                : [...workouts, updatedWorkout]),
        );
    }, []);

    const readWorkoutsByPeriod = useCallback(async ({ year, month, week }: WorkoutPeriod) => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const allWorkouts: Workout[] = stored ? JSON.parse(stored) : [];
        const selectedYear = Number(year);
        const selectedMonth = month === undefined ? undefined : Number(month);
        const selectedWeek = week === undefined ? undefined : Number(week);

        return allWorkouts.filter((workout) => {
            const workoutDate = new Date(workout.startTime);
            if (selectedMonth !== undefined) {
                return workoutDate.getFullYear() === selectedYear && workoutDate.getMonth() === selectedMonth;
            }
            const isoPeriod = getISOWeekInfo(workoutDate);
            return isoPeriod.year === selectedYear && isoPeriod.week === selectedWeek;
        }).sort((a, b) => b.startTime - a.startTime);
    }, []);

    const showWorkout = useCallback(async (workoutId: number) => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) return undefined;

        const workouts: Workout[] = JSON.parse(stored);
        return workouts.find((workout) => workout.id === workoutId);
    }, []);

    const stopExercise = useCallback(async ({
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
    }: StopExerciseOptions) => {
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

            const storedWorkouts = await AsyncStorage.getItem(STORAGE_KEY);
            const workouts: Workout[] = storedWorkouts ? JSON.parse(storedWorkouts) : [];
            workouts.push(workoutData);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));

            resetWorkoutStoreAndNotify();

            router.replace({
                pathname: '/finished-exercise',
                params: { workout: JSON.stringify(workoutData) },
            });
        } catch (error) {
            console.error('Error stopping workout', error);
        }
    }, []);

    return { bulkDestroyWorkouts, bulkUpdateWorkouts, destroyWorkout, indexWorkouts, readWorkoutsByPeriod, showWorkout, stopExercise, updateWorkout };
}
