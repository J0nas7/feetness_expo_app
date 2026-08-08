import { activityName, locale, t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { ExerciseType, Workout } from '@/types/WorkoutDTO';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEY = 'workouts';
const EXERCISE_ICON: Record<ExerciseType, string> = {
    running: '🏃‍♂️',
    cycling: '🚴‍♀️',
    walking: '🚶‍♂️',
};

const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${minutes}:${String(secs).padStart(2, '0')}`;
};

const getISOWeekInfo = (dateValue: Date) => {
    const date = new Date(dateValue.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const year = date.getFullYear();
    const weekOne = new Date(year, 0, 4);
    const week = 1 + Math.round(
        ((date.getTime() - weekOne.getTime()) / 86400000 - 3 + ((weekOne.getDay() + 6) % 7)) / 7
    );
    return { year, week };
};

export default function PeriodList() {
    const theme = useTheme() as MyTheme;
    const { showActionSheetWithOptions } = useActionSheet();
    const params = useLocalSearchParams<{ title?: string; year?: string; month?: string; week?: string }>();
    const [workouts, setWorkouts] = React.useState<Workout[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const localeTag = locale === 'da' ? 'da-DK' : 'en-US';
    const longestIds = React.useMemo(
        () => [...workouts].sort((a, b) => b.distance - a.distance).slice(0, 3).map((workout) => workout.id),
        [workouts]
    );

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        content: { padding: 16 },
        empty: { color: theme.colors.secondaryText, textAlign: 'center', marginTop: 40 },
        skeletonCard: { height: 82, borderRadius: 12, marginBottom: 8, backgroundColor: theme.colors.surface },
        skeletonLine: { height: 10, borderRadius: 5, marginLeft: 52, backgroundColor: theme.colors.border },
        workoutCard: {
            flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.colors.surface,
            borderRadius: 12, marginBottom: 8, boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.6)',
        },
        workoutIcon: { fontSize: 24, marginRight: 12 },
        workoutTitle: { fontWeight: '600', color: theme.colors.text },
        workoutMeta: { fontSize: 12, color: theme.colors.tertiaryText },
        goalStatus: { fontSize: 18, marginLeft: 8 },
        action: { width: 80, justifyContent: 'center', alignItems: 'center' },
        actionText: { color: 'white', fontWeight: '600' },
    });

    const readPeriodWorkouts = React.useCallback(async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const allWorkouts: Workout[] = stored ? JSON.parse(stored) : [];
        const selectedYear = Number(params.year);
        const selectedMonth = params.month === undefined ? undefined : Number(params.month);
        const selectedWeek = params.week === undefined ? undefined : Number(params.week);

        return allWorkouts.filter((workout) => {
            const workoutDate = new Date(workout.startTime);
            if (selectedMonth !== undefined) {
                return workoutDate.getFullYear() === selectedYear && workoutDate.getMonth() === selectedMonth;
            }
            const isoPeriod = getISOWeekInfo(workoutDate);
            return isoPeriod.year === selectedYear && isoPeriod.week === selectedWeek;
        }).sort((a, b) => b.startTime - a.startTime);
    }, [params.month, params.week, params.year]);

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;
            readPeriodWorkouts()
                .then((periodWorkouts) => {
                    if (isActive) setWorkouts(periodWorkouts);
                })
                .finally(() => {
                    if (isActive) setIsLoading(false);
                });
            return () => { isActive = false; };
        }, [readPeriodWorkouts])
    );

    const refreshWorkouts = React.useCallback(async () => {
        setIsRefreshing(true);
        try {
            setWorkouts(await readPeriodWorkouts());
        } finally {
            setIsRefreshing(false);
        }
    }, [readPeriodWorkouts]);

    const deleteWorkout = async (workout: Workout) => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
            const allWorkouts: Workout[] = JSON.parse(stored);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allWorkouts.filter((item) => item.id !== workout.id)));
        }
        setWorkouts((current) => current.filter((item) => item.id !== workout.id));
    };

    const confirmDelete = (workout: Workout) => {
        showActionSheetWithOptions({
            options: [t('progress.deleteWorkout.action'), t('common.actions.cancel')],
            destructiveButtonIndex: 0,
            cancelButtonIndex: 1,
            title: t('progress.deleteWorkout.title'),
        }, (selectedIndex) => {
            if (selectedIndex === 0) deleteWorkout(workout);
        });
    };

    const renderRightActions = (workout: Workout) => (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Pressable
                style={[styles.action, { backgroundColor: '#3b82f6', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }]}
                onPress={() => router.push({ pathname: '/edit-workout', params: { workout: JSON.stringify(workout) } })}
            >
                <Text style={styles.actionText}>{t('common.actions.edit')}</Text>
            </Pressable>
            <Pressable
                style={[styles.action, { backgroundColor: '#ef4444', borderTopRightRadius: 12, borderBottomRightRadius: 12 }]}
                onPress={() => confirmDelete(workout)}
            >
                <Text style={styles.actionText}>{t('common.actions.delete')}</Text>
            </Pressable>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen options={{ title: params.title || t('progress.workoutListTitle') }} />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refreshWorkouts}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {isLoading && [0, 1, 2].map((item) => (
                    <View key={item} style={[styles.skeletonCard, { justifyContent: 'center', gap: 9 }]}>
                        <View style={[styles.skeletonLine, { width: '55%' }]} />
                        <View style={[styles.skeletonLine, { width: '35%' }]} />
                        <View style={[styles.skeletonLine, { width: '25%' }]} />
                    </View>
                ))}
                {!isLoading && !workouts.length && <Text style={styles.empty}>{t('progress.emptyWorkoutList')}</Text>}
                {!isLoading && workouts.map((workout) => {
                    const medalIndex = longestIds.indexOf(workout.id);
                    return (
                        <Swipeable key={workout.id} renderRightActions={() => renderRightActions(workout)} overshootRight={false}>
                            <Pressable
                                style={styles.workoutCard}
                                onPress={() => router.push({ pathname: '/finished-exercise', params: { workout: JSON.stringify(workout) } })}
                            >
                                <Text style={styles.workoutIcon}>{EXERCISE_ICON[workout.exercise]}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.workoutTitle}>
                                        {activityName(workout.exercise)} · {t('progress.workoutGoal', {
                                            amount: workout.goalAmount,
                                            unit: workout.goalMetric === 'distance' ? 'km' : 'min',
                                        })}{' '}
                                        <Text style={[styles.goalStatus, { color: workout.percentage >= 100 ? theme.colors.success : theme.colors.notification }]}>
                                            {workout.percentage >= 100 ? '✓' : '•'}
                                        </Text>
                                    </Text>
                                    <Text style={styles.workoutMeta}>{(workout.distance / 1000).toFixed(1)} km · {formatDuration(workout.elapsedTime)}</Text>
                                    <Text style={styles.workoutMeta}>{new Date(workout.startTime).toLocaleDateString(localeTag)}</Text>
                                </View>
                                <Text>{medalIndex === 0 ? '🥇' : medalIndex === 1 ? '🥈' : medalIndex === 2 ? '🥉' : ''}</Text>
                            </Pressable>
                        </Swipeable>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}
