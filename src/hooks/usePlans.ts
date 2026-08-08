import { Plan } from '@/components/plan/model';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useExercise } from './useExercise';

const STORAGE_KEY = 'plans';

export const usePlans = () => {
    const { indexWorkouts } = useExercise();
    const [plans, setPlans] = useState<Plan[]>([]);

    const loadPlans = useCallback(async (): Promise<Plan[]> => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }, []);

    useFocusEffect(useCallback(() => {
        let mounted = true;
        loadPlans().then((storedPlans) => { if (mounted) setPlans(storedPlans); });
        return () => { mounted = false; };
    }, [loadPlans]));

    const savePlans = useCallback(async (newPlans: Plan[]) => {
        setPlans(newPlans);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
    }, []);

    const refreshPlans = useCallback(async () => {
        const storedPlans = await loadPlans();
        setPlans(storedPlans);
        return storedPlans;
    }, [loadPlans]);

    const loadCurrentMonthPlan = useCallback(async () => {
        const currentDate = new Date();
        const currentPeriod = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
        const storedPlans = await loadPlans();
        const monthPlan = storedPlans.find((plan) => plan.period === currentPeriod) ?? null;
        if (!monthPlan) return null;

        const workouts = await indexWorkouts();
        const monthlyWorkouts = workouts.filter((workout) => {
            const workoutDate = new Date(workout.startTime);
            return workoutDate.getMonth() === currentDate.getMonth()
                && workoutDate.getFullYear() === currentDate.getFullYear();
        });
        const completedAmount = monthPlan.metric === 'distance'
            ? monthlyWorkouts.reduce((total, workout) => total + workout.distance, 0) / 1000
            : monthlyWorkouts.reduce((total, workout) => total + workout.elapsedTime, 0) / 3600;

        return { monthPlan, completedAmount };
    }, [indexWorkouts, loadPlans]);

    return { plans, savePlans, refreshPlans, loadCurrentMonthPlan };
};
