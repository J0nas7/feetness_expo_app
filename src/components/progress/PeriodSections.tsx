import { usePlans } from '@/components/plan/usePlans';
import { activityName, locale, t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { ExerciseType, ProgressPeriod, Workout } from '@/types/WorkoutDTO';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const EXERCISE_ICON: Record<ExerciseType, string> = {
    running: '🏃‍♂️',
    cycling: '🚴‍♀️',
    walking: '🚶‍♂️',
};

interface PeriodSectionsProps {
    periods: ProgressPeriod[]
    isMonthPeriod: (p: ProgressPeriod) => p is {
        year: number;
        month: number;
        workouts: Workout[];
    }
}

const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return hours > 0
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const PeriodSections: React.FC<PeriodSectionsProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const { plans } = usePlans();
    const localeTag = locale === 'da' ? 'da-DK' : 'en-US';
    const now = new Date();

    const styles = StyleSheet.create({
        periodSection: { marginBottom: 30 },
        periodTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: theme.colors.text },
        summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
        summaryText: { color: theme.colors.secondaryText, fontSize: 12 },
        planProgress: {
            flexDirection: 'row', alignItems: 'center', marginBottom: 14, padding: 14,
            borderRadius: 12, borderColor: theme.colors.border, borderWidth: 1,
        },
        planProgressContent: { flex: 1 },
        planProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
        planProgressTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '700', flexShrink: 1 },
        planProgressValue: { color: theme.colors.tertiaryText, fontSize: 12, fontWeight: '600' },
        planProgressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: theme.colors.border },
        planProgressFill: { height: '100%', borderRadius: 4 },
        planProgressChevron: { marginLeft: 12 },
        planPace: { color: theme.colors.secondaryText, fontSize: 12, lineHeight: 18, marginTop: 9 },
        activityGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
        activityCard: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: theme.colors.surface },
        activityTitle: { color: theme.colors.text, fontSize: 12, fontWeight: '700', marginBottom: 7 },
        activityMetric: { color: theme.colors.secondaryText, fontSize: 11, marginTop: 3 },
        listLink: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 7, paddingVertical: 8 },
        listLinkText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
    });

    return props.periods.map((period, idx) => {
        const totalDistance = period.workouts.reduce((sum, workout) => sum + workout.distance, 0);
        const totalDuration = period.workouts.reduce((sum, workout) => sum + workout.elapsedTime, 0);
        const completedGoals = period.workouts.filter((workout) => workout.percentage >= 100).length;
        const monthlyPeriod = props.isMonthPeriod(period) ? period : null;
        const isCurrentMonth = monthlyPeriod?.year === now.getFullYear() && monthlyPeriod.month === now.getMonth();
        const monthlyPlan = monthlyPeriod
            ? plans.find((plan) => plan.period === `${String(monthlyPeriod.month + 1).padStart(2, '0')}-${monthlyPeriod.year}`)
            : undefined;
        const completedPlanAmount = monthlyPlan?.metric === 'distance' ? totalDistance / 1000 : totalDuration / 3600;
        const planPercentage = monthlyPlan && monthlyPlan.goal > 0 ? completedPlanAmount / monthlyPlan.goal * 100 : 0;
        const progressWidth = `${Math.min(Math.max(planPercentage, 0), 100)}%` as `${number}%`;
        const planUnit = monthlyPlan?.metric === 'distance' ? 'km' : t('progress.hours');
        const remainingPlanAmount = monthlyPlan ? Math.max(monthlyPlan.goal - completedPlanAmount, 0) : 0;
        const remainingDisplayAmount = monthlyPlan?.metric === 'distance' ? remainingPlanAmount : remainingPlanAmount * 60;
        const remainingUnit = monthlyPlan?.metric === 'distance' ? 'km' : t('progress.minutes');
        const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;

        const periodTitle = monthlyPeriod
            ? new Date(monthlyPeriod.year, monthlyPeriod.month).toLocaleString(localeTag, { month: 'long', year: 'numeric' })
            : t('progress.period.week', {
                week: String(period.week).padStart(2, '0'),
                date: new Date(period.workouts[0]?.startTime || now).toLocaleDateString(localeTag),
            });

        const activitySummaries = (['walking', 'running', 'cycling'] as ExerciseType[]).map((exercise) => {
            const workouts = period.workouts.filter((workout) => workout.exercise === exercise);
            return {
                exercise,
                distance: workouts.reduce((sum, workout) => sum + workout.distance, 0),
                duration: workouts.reduce((sum, workout) => sum + workout.elapsedTime, 0),
                goals: workouts.filter((workout) => workout.percentage >= 100).length,
            };
        });

        return (
            <View key={`${period.year}-${period.month ?? period.week ?? idx}`} style={styles.periodSection}>
                <Text style={styles.periodTitle}>{periodTitle}</Text>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>⏱ {formatDuration(totalDuration)}</Text>
                    <Text style={styles.summaryText}>📏 {(totalDistance / 1000).toFixed(1)} km</Text>
                    <Text style={styles.summaryText}>🎯 {t(completedGoals === 1 ? 'progress.summary.completedGoal' : 'progress.summary.completedGoals', { count: completedGoals })}</Text>
                </View>

                {monthlyPeriod && monthlyPlan && (
                    <Pressable
                        style={styles.planProgress}
                        onPress={() => router.push({ pathname: '/edit-plan', params: { id: monthlyPlan.id } })}
                        accessibilityRole="button"
                        accessibilityLabel={t('progress.editMonthlyPlan', { period: periodTitle })}
                    >
                        <View style={styles.planProgressContent}>
                            <View style={styles.planProgressLabels}>
                                <Text style={styles.planProgressTitle}>
                                    {t('progress.monthlyPlan')}{isCurrentMonth ? ` · ${t('progress.currentMonth')}` : ''} · {Math.round(planPercentage)}%
                                </Text>
                                <Text style={styles.planProgressValue}>{Number(completedPlanAmount.toFixed(1))} / {monthlyPlan.goal} {planUnit}</Text>
                            </View>
                            <View style={styles.planProgressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.min(Math.round(planPercentage), 100) }}>
                                <View style={[styles.planProgressFill, { width: progressWidth, backgroundColor: planPercentage >= 100 ? theme.colors.success : theme.colors.primary }]} />
                            </View>
                            {isCurrentMonth && planPercentage < 100 && (
                                <Text style={styles.planPace}>
                                    {t('progress.monthlyPace', {
                                        remaining: Number(remainingDisplayAmount.toFixed(1)),
                                        unit: remainingUnit,
                                        days: daysLeft,
                                        daily: Number((remainingDisplayAmount / daysLeft).toFixed(1)),
                                    })}
                                </Text>
                            )}
                        </View>
                        <FontAwesome5 style={styles.planProgressChevron} name="chevron-right" size={14} color={theme.colors.tertiaryText} />
                    </Pressable>
                )}

                <View style={styles.activityGrid}>
                    {activitySummaries.map((summary) => (
                        <View key={summary.exercise} style={styles.activityCard}>
                            <Text style={styles.activityTitle}>{EXERCISE_ICON[summary.exercise]} {activityName(summary.exercise)}</Text>
                            <Text style={styles.activityMetric}>{(summary.distance / 1000).toFixed(1)} km</Text>
                            <Text style={styles.activityMetric}>{formatDuration(summary.duration)}</Text>
                            <Text style={styles.activityMetric}>{t('progress.summary.goalsShort', { count: summary.goals })}</Text>
                        </View>
                    ))}
                </View>

                <Pressable
                    style={styles.listLink}
                    onPress={() => router.push({
                        pathname: '/period-list',
                        params: {
                            title: periodTitle,
                            year: String(period.year),
                            ...(monthlyPeriod
                                ? { month: String(monthlyPeriod.month) }
                                : { week: String(period.week) }),
                        },
                    })}
                    accessibilityRole="link"
                >
                    <Text style={styles.listLinkText}>{t('progress.viewWorkoutList')}</Text>
                    <FontAwesome5 name="chevron-right" size={11} color={theme.colors.primary} />
                </Pressable>
            </View>
        );
    });
};
