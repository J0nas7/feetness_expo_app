import { MyTheme } from '@/types/theme';
import { ProgressPeriod, Workout } from '@/types/WorkoutDTO';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';

const EXERCISE_ICON: Record<string, string> = {
    Løb: '🏃‍♂️',
    Cykling: '🚴‍♀️',
    Gågang: '🚶‍♂️',
};

interface PeriodSectionsProps {
    periods: ProgressPeriod[]
    isMonthPeriod: (p: ProgressPeriod) => p is {
        year: number;
        month: number;
        workouts: Workout[];
    }
}

export const PeriodSections: React.FC<PeriodSectionsProps> = (props) => props.periods.map((period, idx) => {
    const theme = useTheme() as MyTheme;
    const styles = StyleSheet.create({
        periodSection: {
            marginBottom: 28,
        },
        periodTitle: {
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 8,
            color: theme.colors.text,
        },
        summaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 12,
        },
        summaryText: {
            color: theme.colors.secondaryText,
        },
        workoutCard: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            marginBottom: 8,
            boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.6)',
        },
        workoutIcon: {
            fontSize: 24,
            marginRight: 12,
        },
        workoutTitle: {
            fontWeight: '600',
            color: theme.colors.text,
        },
        workoutMeta: {
            fontSize: 12,
            color: theme.colors.tertiaryText,
        },
        goalStatus: {
            fontSize: 18,
            marginLeft: 8,
        },
    })

    const totalDistance = period.workouts.reduce((s, w) => s + w.distance, 0)
    const totalDuration = period.workouts.reduce((s, w) => s + w.elapsedTime, 0)
    const completedGoals = period.workouts.filter((w) => w.percentage >= 100).length

    const now = new Date();

    const periodTitle = props.isMonthPeriod(period)
        ? new Date(period.year, period.month).toLocaleString('default', { month: 'long', year: 'numeric' })
        : `Week ${String(period.week).padStart(2, '0')} (${new Date(period.workouts[0]?.startTime || now).toLocaleDateString()})`;

    return (
        <View key={idx} style={styles.periodSection}>
            <Text style={styles.periodTitle}>{periodTitle}</Text>

            <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                    ⏱ {Math.floor(totalDuration / 3600) > 0
                        // HH:MM:SS
                        ? `${Math.floor(totalDuration / 3600)}:${String(Math.floor((totalDuration % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(totalDuration % 60)).padStart(2, '0')}`
                        // MM:SS
                        : `${Math.floor(totalDuration / 60)}:${String(Math.floor(totalDuration % 60)).padStart(2, '0')}`}
                </Text>
                <Text style={styles.summaryText}>
                    📏 {(totalDistance / 1000).toFixed(1)} km
                </Text>
                <Text style={styles.summaryText}>🎯 {completedGoals} goals</Text>
            </View>

            {period.workouts.map((workout) => {
                const goalCompleted = workout.percentage >= 100;

                const navigateToWorkoutDetails = () => {
                    router.push({
                        pathname: "/finished-exercise",
                        params: {
                            workout: JSON.stringify(workout),
                        },
                    });
                }

                return (
                    <Pressable
                        key={workout.id}
                        style={styles.workoutCard}
                        onPress={navigateToWorkoutDetails}
                    >
                        <Text style={styles.workoutIcon}>
                            {EXERCISE_ICON[workout.exercise]}
                        </Text>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.workoutTitle}>
                                {workout.exercise} ·{' '}
                                {workout.goalAmount}
                                {workout.goalMetric === 'distance'
                                    ? ' km'
                                    : ' min'}
                            </Text>
                            <Text style={styles.workoutMeta}>
                                {(workout.distance / 1000).toFixed(1)} km ·{' '}
                                {Math.round(workout.elapsedTime / 60)} min
                            </Text>
                            <Text style={styles.workoutMeta}>
                                {new Date(workout.startTime).toDateString()}
                            </Text>
                        </View>

                        <Text
                            style={[
                                styles.goalStatus,
                                {
                                    color: goalCompleted
                                        ? theme.colors.success
                                        : theme.colors.notification,
                                },
                            ]}
                        >
                            {goalCompleted ? '✓' : '•'}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
})
