import { ExerciseType, GoalMetric, Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Reuse {
    setMode: (value: React.SetStateAction<GoalMetric>) => void
    setDistance: (value: React.SetStateAction<number>) => void
    setDuration: (value: React.SetStateAction<number>) => void
    setActivity: (value: React.SetStateAction<ExerciseType>) => void
    setShowCustom: (value: React.SetStateAction<boolean>) => void
}

export const ReusePreviousWorkout: React.FC<Reuse & { item: Workout }> = (props) => {
    const theme = useTheme() as MyTheme;

    const workoutValue =
        props.item.goalMetric === 'distance'
            ? `${props.item.goalAmount} km`
            : `${props.item.goalAmount} min`;

    const styles = StyleSheet.create({
        savedWorkoutItem: {
            paddingVertical: 10,
            paddingHorizontal: 15,
            backgroundColor: theme.colors.surface,
            borderRadius: 10,
            boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.6)',
            marginVertical: 5,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between'
        },
        savedWorkoutText: {
            fontSize: 16,
            color: theme.colors.secondaryText,
        },
        savedWorkoutDate: {
            fontSize: 14,
            color: theme.colors.secondaryText,
        },
    })

    return (
        <Pressable
            style={styles.savedWorkoutItem}
            onPress={() => {
                // Apply saved workout settings
                props.setMode(props.item.goalMetric);
                if (props.item.goalMetric === 'distance') props.setDistance(props.item.goalAmount);
                if (props.item.goalMetric === 'duration') props.setDuration(props.item.goalAmount);
                props.setActivity(props.item.exercise);
                props.setShowCustom(true);
            }}
        >
            <Text style={styles.savedWorkoutText}>
                {props.item.exercise} – {workoutValue}
            </Text>
            <Text style={styles.savedWorkoutDate}>
                {new Date(props.item.id).toLocaleString()}
            </Text>
        </Pressable>
    );
}
