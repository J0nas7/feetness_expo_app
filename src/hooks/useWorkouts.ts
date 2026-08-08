import { Workout } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

const STORAGE_KEY = 'workouts';

type WorkoutPeriod = {
    year?: string;
    month?: string;
    week?: string;
};

type BulkWorkoutUpdate = {
    workoutIds: number[];
    exercise?: Workout['exercise'];
    goal?: { metric: Workout['goalMetric']; amount: number };
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

export function useWorkouts() {
    const indexWorkouts = useCallback(async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        return (stored ? JSON.parse(stored) : []) as Workout[];
    }, []);

    const updateWorkout = useCallback(async (updatedWorkout: Workout) => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const workouts: Workout[] = stored ? JSON.parse(stored) : [];
        const exists = workouts.some((workout) => workout.id === updatedWorkout.id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(
            exists
                ? workouts.map((workout) => workout.id === updatedWorkout.id ? updatedWorkout : workout)
                : [...workouts, updatedWorkout]
        ));
    }, []);

    const destroyWorkout = useCallback(async (workout: Workout) => {
        const workouts = await indexWorkouts();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(workouts.filter((item) => item.id !== workout.id)));
    }, [indexWorkouts]);

    const bulkDestroyWorkouts = useCallback(async (workoutIds: number[]) => {
        const selectedIds = new Set(workoutIds);
        const workouts = await indexWorkouts();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(workouts.filter((workout) => !selectedIds.has(workout.id))));
    }, [indexWorkouts]);

    const bulkUpdateWorkouts = useCallback(async ({ workoutIds, exercise, goal }: BulkWorkoutUpdate) => {
        const selectedIds = new Set(workoutIds);
        const workouts = await indexWorkouts();
        const updatedWorkouts = workouts.map((workout) => {
            if (!selectedIds.has(workout.id)) return workout;
            const completed = goal?.metric === 'distance' ? workout.distance / 1000 : workout.elapsedTime / 60;
            return {
                ...workout,
                ...(exercise ? { exercise } : {}),
                ...(goal ? { goalMetric: goal.metric, goalAmount: goal.amount, percentage: completed / goal.amount * 100 } : {}),
            };
        });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWorkouts));
    }, [indexWorkouts]);

    const readWorkoutsByPeriod = useCallback(async ({ year, month, week }: WorkoutPeriod) => {
        const workouts = await indexWorkouts();
        const selectedYear = Number(year);
        const selectedMonth = month === undefined ? undefined : Number(month);
        const selectedWeek = week === undefined ? undefined : Number(week);
        return workouts.filter((workout) => {
            const workoutDate = new Date(workout.startTime);
            if (selectedMonth !== undefined) {
                return workoutDate.getFullYear() === selectedYear && workoutDate.getMonth() === selectedMonth;
            }
            const isoPeriod = getISOWeekInfo(workoutDate);
            return isoPeriod.year === selectedYear && isoPeriod.week === selectedWeek;
        }).sort((a, b) => b.startTime - a.startTime);
    }, [indexWorkouts]);

    const showWorkout = useCallback(async (workoutId: number) => {
        const workouts = await indexWorkouts();
        return workouts.find((workout) => workout.id === workoutId);
    }, [indexWorkouts]);

    return { bulkDestroyWorkouts, bulkUpdateWorkouts, destroyWorkout, indexWorkouts, readWorkoutsByPeriod, showWorkout, updateWorkout };
}
