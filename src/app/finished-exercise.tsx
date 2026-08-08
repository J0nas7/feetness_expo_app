import { FinishedExercise } from '@/components';
import { useWorkouts } from '@/hooks/useWorkouts';
import { Workout } from "@/types";
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from "expo-router";
import React from 'react';

export default function FinishedExerciseScreen() {
    const { showWorkout } = useWorkouts();
    const { workout } = useLocalSearchParams<{
        workout: string;
    }>();

    const [currentWorkout, setCurrentWorkout] = React.useState<Workout>(() => JSON.parse(workout));

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const refreshWorkout = async () => {
                const updatedWorkout = await showWorkout(currentWorkout.id);
                if (isActive && updatedWorkout) setCurrentWorkout(updatedWorkout);
            };

            refreshWorkout();
            return () => { isActive = false; };
        }, [currentWorkout.id, showWorkout])
    );

    return <FinishedExercise workout={currentWorkout} />;
}
