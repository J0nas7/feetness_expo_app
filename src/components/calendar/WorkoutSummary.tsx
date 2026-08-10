import { activityName, t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { Workout } from '@/types/WorkoutDTO';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ACTIVITIES, EXERCISE_ICON, formatDuration } from './model';

export const WorkoutSummary = ({ workouts }: { workouts: Workout[] }) => {
    const theme = useTheme() as MyTheme;
    const summarize = (values: Workout[]) => ({
        distance: values.reduce((sum, item) => sum + item.distance, 0),
        duration: values.reduce((sum, item) => sum + item.elapsedTime, 0),
        goals: values.filter((item) => item.percentage >= 100).length,
    });
    const total = summarize(workouts);
    const styles = StyleSheet.create({
        summary: { borderRadius: 14, padding: 14, backgroundColor: theme.colors.surface, marginBottom: 18 },
        totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
        totalMetric: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
        activityRow: { flexDirection: 'row', gap: 7 },
        activity: { flex: 1, alignItems: 'center' },
        activityTitle: { color: theme.colors.text, fontSize: 11, fontWeight: '700', marginBottom: 5 },
        activityMetric: { color: theme.colors.tertiaryText, fontSize: 10, marginTop: 2 },
    });

    return <View style={styles.summary}>
        <View style={styles.totalRow}>
            <Text style={styles.totalMetric}>⏱ {formatDuration(total.duration)}</Text>
            <Text style={styles.totalMetric}>📏 {(total.distance / 1000).toFixed(1)} km</Text>
            <Text style={styles.totalMetric}>🎯 {total.goals}</Text>
        </View>
        <View style={styles.activityRow}>{ACTIVITIES.map((exercise) => {
            const value = summarize(workouts.filter((item) => item.exercise === exercise));
            return <View style={styles.activity} key={exercise}>
                <Text style={styles.activityTitle}>{EXERCISE_ICON[exercise]}  {activityName(exercise)}</Text>
                <Text style={styles.activityMetric}>{formatDuration(value.duration)}</Text>
                <Text style={styles.activityMetric}>{(value.distance / 1000).toFixed(1)} km</Text>
                <Text style={styles.activityMetric}>{t('progress.summary.goalsShort', { count: value.goals })}</Text>
            </View>;
        })}</View>
    </View>;
};
