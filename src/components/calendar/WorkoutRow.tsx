import { activityName, t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { Workout } from '@/types/WorkoutDTO';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { EXERCISE_ICON, formatDuration } from './model';

interface Props {
    workout: Workout;
    localeTag: string;
    onDelete: (workout: Workout) => void;
}

export const WorkoutRow = ({ workout, localeTag, onDelete }: Props) => {
    const theme = useTheme() as MyTheme;
    const styles = StyleSheet.create({
        workout: { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 12, backgroundColor: theme.colors.surface, marginBottom: 8 },
        icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.card, marginRight: 11 },
        title: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
        goalStatus: { fontSize: 18, marginLeft: 8 },
        meta: { color: theme.colors.tertiaryText, fontSize: 12, marginTop: 3 },
        actions: { flexDirection: 'row', marginBottom: 8 },
        action: { width: 80, justifyContent: 'center', alignItems: 'center' },
        actionText: { color: 'white', fontWeight: '600' },
    });
    const actions = <View style={styles.actions}>
        <Pressable
            style={[styles.action, { backgroundColor: '#3b82f6', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }]}
            onPress={() => router.push({ pathname: '/edit-workout', params: { workout: JSON.stringify(workout) } })}
        ><Text style={styles.actionText}>{t('common.actions.edit')}</Text></Pressable>
        <Pressable
            style={[styles.action, { backgroundColor: '#ef4444', borderTopRightRadius: 12, borderBottomRightRadius: 12 }]}
            onPress={() => onDelete(workout)}
        ><Text style={styles.actionText}>{t('common.actions.delete')}</Text></Pressable>
    </View>;

    return <Swipeable renderRightActions={() => actions} overshootRight={false}>
        <Pressable style={styles.workout} onPress={() => router.push({ pathname: '/finished-exercise', params: { workout: JSON.stringify(workout) } })}>
            <View style={styles.icon}><Text>{EXERCISE_ICON[workout.exercise]}</Text></View>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                    {activityName(workout.exercise)}{' · '}{t('progress.workoutGoal', {
                        amount: workout.goalAmount,
                        unit: workout.goalMetric === 'distance' ? 'km' : 'min',
                    })}{' '}
                    <Text style={[styles.goalStatus, { color: workout.percentage >= 100 ? theme.colors.success : theme.colors.notification }]}>
                        {workout.percentage >= 100 ? '✓' : '•'}
                    </Text>
                </Text>
                <Text style={styles.meta}>{new Date(workout.startTime).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })} · {(workout.distance / 1000).toFixed(1)} km · {formatDuration(workout.elapsedTime)}</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={11} color={theme.colors.tertiaryText} />
        </Pressable>
    </Swipeable>;
};
