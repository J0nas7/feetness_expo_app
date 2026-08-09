import { BarChartsWithPeriods, BigLogo, PeriodSections, PeriodSelector } from '@/components';
import { useWorkouts } from '@/hooks/useWorkouts';
import { t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { ProgressPeriod, Workout } from '@/types/WorkoutDTO';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const now = new Date();

const DEMO_WORKOUTS: Workout[] = Array.from({ length: 7 }).flatMap(
    (_, monthOffset) => {
        const workoutsThisMonth = 4 + Math.floor(Math.random() * 5); // 4–8
        const baseDate = new Date(
            now.getFullYear(),
            now.getMonth() - monthOffset,
            1
        );

        return Array.from({ length: workoutsThisMonth }).map((__, i) => {
            const exerciseTypes = ['running', 'cycling', 'walking'] as const;
            const exercise =
                exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];

            const day = 1 + Math.floor(Math.random() * 26);
            const start = new Date(
                baseDate.getFullYear(),
                baseDate.getMonth(),
                day
            );

            return {
                id: monthOffset * 10 + i,
                exercise,
                goalAmount: exercise === 'cycling' ? 45 : 5,
                goalMetric: exercise === 'cycling' ? 'duration' : 'distance',
                percentage: 80 + Math.floor(Math.random() * 50), // some fail, some pass
                startTime: start.getTime(),
                endTime: start.getTime(),
                distance: 3000 + Math.random() * 7000,
                elapsedTime: 1200 + Math.random() * 2400,
                calories: 200 + Math.random() * 400,
                pace: 4 + Math.random() * 4,
                path: [],
                segments: [],
            };
        });
    }
);

// Calculates the ISO week number and ISO week-year for a given date.
const getISOWeekInfo = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);

    // Thursday determines ISO week-year
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));

    const weekYear = date.getFullYear();

    const week1 = new Date(weekYear, 0, 4);
    const week =
        1 +
        Math.round(
            ((date.getTime() - week1.getTime()) / 86400000 -
                3 +
                ((week1.getDay() + 6) % 7)) /
            7
        );

    return { weekYear, week };
}

// Converts an ISO week number and ISO week-year to a timestamp (milliseconds since epoch).
const isoWeekToDate = (year: number, week: number) => {
    // Jan 4th is always in ISO week 1
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7; // Sunday = 7
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);

    const result = new Date(mondayWeek1);
    result.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
    return result.getTime();
}

const isMonthPeriod = (
    period: ProgressPeriod
): period is { year: number; month: number; workouts: Workout[] } => "month" in period;

export const distributeWorkouts = (
    workouts: Workout[],
    basePeriods: ProgressPeriod[],
): ProgressPeriod[] => basePeriods
    .map((period) => ({
        ...period,
        workouts: workouts
            .filter((workout) => {
                const date = new Date(workout.startTime);
                if (isMonthPeriod(period)) {
                    return period.year === date.getFullYear() && period.month === date.getMonth();
                }

                const { weekYear, week } = getISOWeekInfo(date);
                return period.year === weekYear && period.week === week;
            })
            .sort((a, b) => b.startTime - a.startTime),
    }))
    .sort((a, b) => {
        if (isMonthPeriod(a) && isMonthPeriod(b)) {
            return b.year !== a.year ? b.year - a.year : b.month - a.month;
        }
        if (a.week !== undefined && b.week !== undefined) {
            return isoWeekToDate(b.year, b.week) - isoWeekToDate(a.year, a.week);
        }
        return 0;
    });

const ProgressView = () => {
    // ==== HOOKS ====
    const theme = useTheme() as MyTheme;
    const { indexWorkouts } = useWorkouts();

    // ==== VARIABLES, STATE AND REFS ====
    const [periodType, setPeriodType] = React.useState<'week' | 'month'>('month');
    const [allWorkouts, setAllWorkouts] = useState<Workout[] | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const basePeriods = React.useMemo(() => {
        const now = new Date();

        return periodType === 'month'
            ? Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                return { year: d.getFullYear(), month: d.getMonth(), workouts: [] as Workout[] };
            })
            : Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(now.getDate() - i * 7); // go back i weeks
                const { weekYear, week } = getISOWeekInfo(d);
                return { year: weekYear, week, workouts: [] as Workout[] };
            });
    }, [periodType]);

    const periods = React.useMemo(
        () => allWorkouts ? distributeWorkouts(allWorkouts, basePeriods) : [],
        [allWorkouts, basePeriods],
    );

    // ==== EFFECTS ====
    // On screen focus, remove any saved 'currentWorkout' and redirect to '/explore' with its data.
    useFocusEffect(
        React.useCallback(() => {
            (async () => {
                const data = await AsyncStorage.getItem('currentWorkout')
                if (!data) return

                // Removal before redirect
                await AsyncStorage.removeItem('currentWorkout');
                const workout = JSON.parse(data)
                router.push({
                    pathname: '/explore',
                    params: { ...workout },
                });
            })();
        }, [])
    );

    // On screen focus, load workouts from storage (or use demo), sort them, and distribute them into periods for display.
    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const loadAndDistributeWorkouts = async () => {
                let workouts = DEMO_WORKOUTS

                const data = await indexWorkouts();
                if (!isActive) return;

                // Use stored workouts if available
                if (data.length) workouts = data;

                setAllWorkouts(workouts);
            };

            loadAndDistributeWorkouts();

            // Cleanup function to mark the effect as inactive
            return () => {
                isActive = false;
            };
        }, [indexWorkouts])
    );

    const refreshWorkouts = async () => {
        setIsRefreshing(true);
        try {
            const storedWorkouts = await indexWorkouts();
            setAllWorkouts(storedWorkouts.length ? storedWorkouts : DEMO_WORKOUTS);
        } finally {
            setIsRefreshing(false);
        }
    };

    // ==== RENDERING ====
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: 16,
        },
        createButton: {
            position: 'absolute',
            right: 20,
            bottom: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 6,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
        },
    });

    if (!allWorkouts || !periods.length)
        return <BigLogo size={200} animated />

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refreshWorkouts}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {/* Period Selector */}
                <PeriodSelector periodType={periodType} setPeriodType={setPeriodType} />

                {/* Bar Chart Area */}
                <BarChartsWithPeriods periods={periods} periodType={periodType} />

                {/* Period Sections */}
                <PeriodSections {...{
                    periods,
                    allWorkouts,
                    isMonthPeriod
                }} />
            </ScrollView>
            <Pressable
                style={styles.createButton}
                onPress={() => router.push('/create-workout')}
                accessibilityRole="button"
                accessibilityLabel={t('exercise.createWorkout.accessibility')}
            >
                <FontAwesome5 name="plus" size={22} color={theme.colors.onPrimary} />
            </Pressable>
        </SafeAreaView>
    );
};

export default ProgressView;
