import { Plan } from '@/components/plan/model';
import { loadPlans, savePlans as persistPlans } from '@/components/plan/storage';
import { Workout } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

export const usePlans = () => {
    const [plans, setPlans] = useState<Plan[]>([]);

    useFocusEffect(useCallback(() => {
        let mounted = true;
        loadPlans().then((storedPlans) => { if (mounted) setPlans(storedPlans); });
        return () => { mounted = false; };
    }, []));

    const savePlans = useCallback(async (newPlans: Plan[]) => {
        setPlans(newPlans);
        await persistPlans(newPlans);
    }, []);

    const refreshPlans = useCallback(async () => {
        const storedPlans = await loadPlans();
        setPlans(storedPlans);
        return storedPlans;
    }, []);

    const loadCurrentMonthPlan = useCallback(async () => {
        const currentDate = new Date();
        const currentPeriod = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
        const storedPlans = await loadPlans();
        const monthPlan = storedPlans.find((plan) => plan.period === currentPeriod) ?? null;
        if (!monthPlan) return null;

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

        return { monthPlan, completedAmount };
    }, []);

    return { plans, savePlans, refreshPlans, loadCurrentMonthPlan };
};
