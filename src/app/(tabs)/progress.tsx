import { BarChartsWithPeriods, BigLogo, PeriodSections, PeriodSelector } from '@/components';
import { MyTheme } from '@/types/theme';
import { ProgressPeriod, Workout } from '@/types/WorkoutDTO';
import { useActionSheet } from '@expo/react-native-action-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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
            const exerciseTypes = ['Løb', 'Cykling', 'Gågang'] as const;
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
                goalAmount: exercise === 'Cykling' ? 45 : 5,
                goalMetric: exercise === 'Cykling' ? 'duration' : 'distance',
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

const ProgressView = () => {
    // ==== HOOKS ====
    const theme = useTheme() as MyTheme;
    const { showActionSheetWithOptions } = useActionSheet();

    // ==== VARIABLES, STATE AND REFS ====
    const [periodType, setPeriodType] = React.useState<'week' | 'month'>('month');
    const [sortedWorkouts, setSortedWorkouts] = useState<Workout[]>([]);
    const [periods, setPeriods] = useState<ProgressPeriod[]>([]);

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
    const STORAGE_KEY = 'workouts';
    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const loadAndDistributeWorkouts = async () => {
                // Stop if the component is unmounted
                if (!isActive) return;

                let workouts = DEMO_WORKOUTS

                // Attempt to load stored workouts
                const stored = await AsyncStorage.getItem(STORAGE_KEY);

                if (!stored) return;

                const data: Workout[] = JSON.parse(stored);

                // Use stored workouts if available
                if (data.length) workouts = data;

                calculateProgress(workouts);
            };

            loadAndDistributeWorkouts();

            // Cleanup function to mark the effect as inactive
            return () => {
                isActive = false;
            };
        }, [basePeriods, periodType])
    );

    const handleDeleteWorkout = async (workout: Workout) => {
        // Load stored workouts
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (!stored) return;

        const workouts: Workout[] = JSON.parse(stored);

        // Filter out the workout to delete
        const updatedWorkouts = workouts.filter(w => w.id !== workout.id);

        // Save the updated workouts back to storage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWorkouts));

        // Recalculate progress to update the UI
        calculateProgress(updatedWorkouts);
    }

    const confirmDeleteWorkout = async (workout: Workout) => {
        const options = ['Delete Workout', 'Cancel'];
        const destructiveButtonIndex = 0;
        const cancelButtonIndex = 1;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                destructiveButtonIndex,
                title: 'Delete this workout?',
            },
            (selectedIndex) => {
                if (selectedIndex === destructiveButtonIndex) {
                    handleDeleteWorkout(workout);
                }
            }
        );
    };

    const calculateProgress = (workouts: Workout[]) => {
        // Sort workouts by start time (newest first) and update state
        setSortedWorkouts([...workouts].sort(
            (a, b) => b.startTime - a.startTime
        ))

        // Clear workouts in all periods before reassigning
        basePeriods.forEach((p) => {
            p.workouts = [];
        });

        // Assign each workout to the correct period (month or week)
        workouts.forEach((w) => {
            const d = new Date(w.startTime);

            const period = basePeriods.find((p) =>
                p.year === d.getFullYear() &&
                (isMonthPeriod(p) ? p.month === d.getMonth() : p.week === getISOWeekInfo(d).week)
            );

            // Add workout to the period if found
            if (period) period?.workouts.push(w);
        });

        // Sort workouts inside each period (newest first)
        basePeriods.forEach((p) => {
            p.workouts.sort((a, b) => b.startTime - a.startTime);
        });

        // Sort periods themselves (month vs month, week vs week)
        const periods = basePeriods.sort((a, b) => {
            // month vs month
            if (isMonthPeriod(a) && isMonthPeriod(b)) {
                return b.year !== a.year
                    ? b.year - a.year
                    : b.month - a.month;
            }

            // week vs week
            if (!isMonthPeriod(a) && !isMonthPeriod(b)) {
                return isoWeekToDate(b.year, b.week) - isoWeekToDate(a.year, a.week);
            }

            // optional: decide how month vs week should be ordered
            return 0;
        });

        // Update state with the sorted periods
        setPeriods(periods)
    }

    // ==== METHODS ====
    // Type guard to check if a ProgressPeriod is a monthly period.
    const isMonthPeriod = (
        p: ProgressPeriod
    ): p is { year: number; month: number; workouts: Workout[] } => {
        return "month" in p;
    };

    // ==== RENDERING ====
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: 16,
        },
    });

    if (!periods.length)
        return <BigLogo size={200} animated />

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                {/* Period Selector */}
                <PeriodSelector periodType={periodType} setPeriodType={setPeriodType} />

                {/* Bar Chart Area */}
                <BarChartsWithPeriods periods={periods} periodType={periodType} />

                {/* Period Sections */}
                <PeriodSections {...{
                    periods,
                    confirmDeleteWorkout,
                    isMonthPeriod
                }} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProgressView;
