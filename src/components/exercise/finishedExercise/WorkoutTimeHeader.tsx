import { MyTheme } from '@/types/theme';
import { t } from '@/i18n';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatWorkoutPace, formatWorkoutTime, GroupedPace } from './workoutTimeAnalysis';

export function WorkoutTimeHeader({ elapsedTime, groups }: { elapsedTime: number; groups: GroupedPace[] }) {
    const theme = useTheme() as MyTheme;
    const fastest = groups.reduce<GroupedPace | undefined>((best, group) => !best || group.avgPace < best.avgPace ? group : best, undefined);
    const styles = StyleSheet.create({
        hero: { alignItems: 'center', marginBottom: 10 },
        time: { fontSize: 42, fontWeight: 'bold', color: theme.colors.text },
        label: { fontSize: 14, color: theme.colors.tertiaryText, marginTop: 4 },
        badge: { alignSelf: 'center', marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.colors.surface },
        badgeText: { color: theme.colors.secondaryText, fontSize: 13, fontWeight: '600' },
    });
    return <>
        <View style={styles.hero}>
            <Text style={styles.time}>{formatWorkoutTime(elapsedTime)}</Text>
            <Text style={styles.label}>{t('exercise.timeSummary.totalTimeBlocks', { count: groups.length })}</Text>
        </View>
        {fastest && <View style={styles.badge}><Text style={styles.badgeText}>🏆 {t('exercise.timeSummary.fastestBlock', { pace: formatWorkoutPace(fastest.avgPace) })}</Text></View>}
    </>;
}
