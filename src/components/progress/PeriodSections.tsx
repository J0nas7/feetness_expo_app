import { usePlans } from '@/components/plan/usePlans';
import { activityName, locale, t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { ProgressPeriod, Workout } from '@/types/WorkoutDTO';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

const EXERCISE_ICON: Record<string, string> = {
    running: '🏃‍♂️',
    cycling: '🚴‍♀️',
    walking: '🚶‍♂️',
};

interface PeriodSectionsProps {
    periods: ProgressPeriod[]
    confirmDeleteWorkout: (workout: Workout) => Promise<void>
    isMonthPeriod: (p: ProgressPeriod) => p is {
        year: number;
        month: number;
        workouts: Workout[];
    }
}

export const PeriodSections: React.FC<PeriodSectionsProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const { plans } = usePlans();
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
        planProgress: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            borderStyle: "solid",
            borderColor: theme.colors.surface,
            borderWidth: 1
        },
        planProgressContent: {
            flex: 1,
        },
        planProgressLabels: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        planProgressTitle: {
            color: theme.colors.text,
            fontSize: 13,
            fontWeight: '700',
        },
        planProgressValue: {
            color: theme.colors.tertiaryText,
            fontSize: 12,
            fontWeight: '600',
        },
        planProgressTrack: {
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: theme.colors.border,
        },
        planProgressFill: {
            height: '100%',
            borderRadius: 4,
        },
        planProgressChevron: {
            marginLeft: 12,
        },
    });

    return props.periods.map((period, idx) => {

        const totalDistance = period.workouts.reduce((s, w) => s + w.distance, 0)
        const totalDuration = period.workouts.reduce((s, w) => s + w.elapsedTime, 0)
        const completedGoals = period.workouts.filter((w) => w.percentage >= 100).length
        const monthlyPeriod = props.isMonthPeriod(period) ? period : null;
        const monthlyPlan = monthlyPeriod
            ? plans.find((plan) => plan.period === `${String(monthlyPeriod.month + 1).padStart(2, '0')}-${monthlyPeriod.year}`)
            : undefined;
        const completedPlanAmount = monthlyPlan?.metric === 'distance'
            ? totalDistance / 1000
            : totalDuration / 3600;
        const planPercentage = monthlyPlan && monthlyPlan.goal > 0
            ? completedPlanAmount / monthlyPlan.goal * 100
            : 0;
        const progressWidth = `${Math.min(Math.max(planPercentage, 0), 100)}%` as `${number}%`;
        const planUnit = monthlyPlan?.metric === 'distance' ? 'km' : t('progress.hours');

        const now = new Date();

        const localeTag = locale === 'da' ? 'da-DK' : 'en-US';
        const periodTitle = props.isMonthPeriod(period)
            ? new Date(period.year, period.month).toLocaleString(localeTag, { month: 'long', year: 'numeric' })
            : t('progress.period.week', {
                week: String(period.week).padStart(2, '0'),
                date: new Date(period.workouts[0]?.startTime || now).toLocaleDateString(localeTag),
            });

        // Find three workouts that have the longest distance
        const longestDistanceWorkouts = [...period.workouts]
            .sort((a, b) => b.distance - a.distance)
            .slice(0, 3);

        const handleEdit = (workout: Workout) => {
            router.push({
                pathname: '/edit-workout',
                params: { workout: JSON.stringify(workout) },
            });
        };

        const renderRightActions = (workout: Workout) => (
            <View
                style={{
                    flexDirection: 'row',
                    marginBottom: 8,
                }}
            >
                <Pressable
                    onPress={() => handleEdit(workout)}
                    style={{
                        width: 80,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#3b82f6',
                        borderTopLeftRadius: 12,
                        borderBottomLeftRadius: 12,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                        {t('common.actions.edit')}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => props.confirmDeleteWorkout(workout)}
                    style={{
                        width: 80,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#ef4444',
                        borderTopRightRadius: 12,
                        borderBottomRightRadius: 12,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: '600' }}>
                        {t('common.actions.delete')}
                    </Text>
                </Pressable>
            </View>
        );

        const formatDuration = (seconds: number): string => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);

            if (hours > 0) {
                return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
            }

            return `${minutes}:${String(secs).padStart(2, "0")}`;
        }

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
                    <Text style={styles.summaryText}>
                        🎯 {t(completedGoals === 1 ? 'progress.summary.completedGoal' : 'progress.summary.completedGoals', { count: completedGoals })}
                    </Text>
                </View>

                {monthlyPeriod && monthlyPlan && <Pressable
                    style={styles.planProgress}
                    onPress={() => router.push({ pathname: '/edit-plan', params: { id: monthlyPlan.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={t('progress.editMonthlyPlan', { period: periodTitle })}
                >
                    <View style={styles.planProgressContent}>
                        <View style={styles.planProgressLabels}>
                            <Text style={styles.planProgressTitle}>{t('progress.monthlyPlan')} · {Math.round(planPercentage)}%</Text>
                            <Text style={styles.planProgressValue}>{Number(completedPlanAmount.toFixed(1))} / {monthlyPlan.goal} {planUnit}</Text>
                        </View>
                        <View
                            style={styles.planProgressTrack}
                            accessibilityRole="progressbar"
                            accessibilityValue={{ min: 0, max: 100, now: Math.min(Math.round(planPercentage), 100) }}
                        >
                            <View style={[styles.planProgressFill, { width: progressWidth, backgroundColor: planPercentage >= 100 ? theme.colors.success : theme.colors.primary }]} />
                        </View>
                    </View>
                    <FontAwesome5 style={styles.planProgressChevron} name="chevron-right" size={14} color={theme.colors.tertiaryText} />
                </Pressable>}

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
                        <Swipeable
                            key={workout.id}
                            renderRightActions={() => renderRightActions(workout)}
                            overshootRight={false}
                        >
                            <Pressable
                                style={styles.workoutCard}
                                onPress={navigateToWorkoutDetails}
                            >
                                <Text style={styles.workoutIcon}>
                                    {EXERCISE_ICON[workout.exercise]}
                                </Text>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.workoutTitle}>
                                        {activityName(workout.exercise)} ·{' '}
                                        {t('progress.workoutGoal', {
                                            amount: workout.goalAmount,
                                            unit: workout.goalMetric === 'distance' ? 'km' : 'min',
                                        })}{' '}
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
                                    </Text>
                                    <Text style={styles.workoutMeta}>
                                        {(workout.distance / 1000).toFixed(1)} km ·{' '}
                                        {formatDuration(workout.elapsedTime)}
                                    </Text>
                                    <Text style={styles.workoutMeta}>
                                        {new Date(workout.startTime).toLocaleDateString(localeTag)}
                                    </Text>
                                </View>

                                <View>
                                    <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                                        {longestDistanceWorkouts[0]?.id === workout.id ? (
                                            <>🥇</>
                                        ) : longestDistanceWorkouts[1]?.id === workout.id ? (
                                            <>🥈</>
                                        ) : longestDistanceWorkouts[2]?.id === workout.id ? (
                                            <>🥉</>
                                        ) : null}
                                    </Text>
                                </View>
                            </Pressable>
                        </Swipeable>
                    );
                })}
            </View>
        );
    })
}
