import { FinishedExercise } from '@/components';
import { Workout } from "@/types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from "expo-router";
import React from 'react';

const STORAGE_KEY = 'workouts';

export default function FinishedExerciseScreen() {
    const { workout } = useLocalSearchParams<{
        workout: string;
    }>();

    const [currentWorkout, setCurrentWorkout] = React.useState<Workout>(() => JSON.parse(workout));

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const refreshWorkout = async () => {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (!stored) return;

                const workouts: Workout[] = JSON.parse(stored);
                const updatedWorkout = workouts.find((item) => item.id === currentWorkout.id);
                if (isActive && updatedWorkout) setCurrentWorkout(updatedWorkout);
            };

            refreshWorkout();
            return () => { isActive = false; };
        }, [currentWorkout.id])
    );

    return <FinishedExercise workout={currentWorkout} />;
}
