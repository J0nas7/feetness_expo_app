import { CalendarView, addDays, isoWeek, sameDay, startOfDay, startOfWeek } from '@/components/calendar';
import { locale, t } from '@/i18n';
import { Workout } from '@/types/WorkoutDTO';
import { DEMO_WORKOUTS } from '@/utils/progress/demoWorkouts';
import { useActionSheet } from '@expo/react-native-action-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { usePlans } from './usePlans';
import { useWorkouts } from './useWorkouts';

export const useCalendar = () => {
    const { plans } = usePlans();
    const { showActionSheetWithOptions } = useActionSheet();
    const { destroyWorkout, indexWorkouts } = useWorkouts();
    const localeTag = locale === 'da' ? 'da-DK' : 'en-US';
    const [view, setView] = React.useState<CalendarView>('month');
    const [cursor, setCursor] = React.useState(startOfDay(new Date()));
    const [workouts, setWorkouts] = React.useState<Workout[]>([]);
    const [loading, setLoading] = React.useState(true);

    useFocusEffect(React.useCallback(() => {
        void (async () => {
            const data = await AsyncStorage.getItem('currentWorkout');
            if (!data) return;
            await AsyncStorage.removeItem('currentWorkout');
            router.push({ pathname: '/explore', params: { ...JSON.parse(data) } });
        })();
    }, []));

    useFocusEffect(React.useCallback(() => {
        let active = true;
        indexWorkouts()
            .then((stored) => { if (active) setWorkouts(stored.length ? stored : DEMO_WORKOUTS); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [indexWorkouts]));

    const periodWorkouts = React.useMemo(() => workouts.filter((workout) => {
        const date = new Date(workout.startTime);
        if (view === 'day') return sameDay(date, cursor);
        if (view === 'week') {
            const start = startOfWeek(cursor);
            return date >= start && date < addDays(start, 7);
        }
        if (view === 'month') return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth();
        return date.getFullYear() === cursor.getFullYear();
    }), [cursor, view, workouts]);

    const chartPeriods = React.useMemo(() => Array.from({ length: 7 }, (_, offset) => {
        if (view === 'day') {
            const date = addDays(cursor, -offset);
            return { year: date.getFullYear(), date: date.getTime(), workouts: workouts.filter((workout) => sameDay(new Date(workout.startTime), date)) };
        }
        if (view === 'week') {
            const date = addDays(startOfWeek(cursor), -offset * 7);
            const end = addDays(date, 7);
            return { year: date.getFullYear(), week: isoWeek(date), workouts: workouts.filter((workout) => {
                const workoutDate = new Date(workout.startTime);
                return workoutDate >= date && workoutDate < end;
            }) };
        }
        if (view === 'month') {
            const date = new Date(cursor.getFullYear(), cursor.getMonth() - offset, 1);
            return { year: date.getFullYear(), month: date.getMonth(), workouts: workouts.filter((workout) => {
                const workoutDate = new Date(workout.startTime);
                return workoutDate.getFullYear() === date.getFullYear() && workoutDate.getMonth() === date.getMonth();
            }) };
        }
        const year = cursor.getFullYear() - offset;
        return { year, workouts: workouts.filter((workout) => new Date(workout.startTime).getFullYear() === year) };
    }), [cursor, view, workouts]);

    const title = view === 'day'
        ? cursor.toLocaleDateString(localeTag, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : view === 'week'
            ? t('progress.calendar.weekTitle', { week: isoWeek(cursor), year: startOfWeek(cursor).getFullYear() })
            : view === 'month'
                ? cursor.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })
                : String(cursor.getFullYear());

    const move = (direction: number) => setCursor((current) => view === 'day' ? addDays(current, direction)
        : view === 'week' ? addDays(current, direction * 7)
            : view === 'month' ? new Date(current.getFullYear(), current.getMonth() + direction, 1)
                : new Date(current.getFullYear() + direction, current.getMonth(), 1));
    const selectDay = (date: Date) => { setCursor(startOfDay(date)); setView('day'); };
    const selectMonth = (month: number) => { setCursor(new Date(cursor.getFullYear(), month, 1)); setView('month'); };
    const selectToday = () => setCursor(startOfDay(new Date()));

    const confirmDelete = (workout: Workout) => showActionSheetWithOptions({
        options: [t('progress.deleteWorkout.action'), t('common.actions.cancel')],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        title: t('progress.deleteWorkout.title'),
    }, (selectedIndex) => {
        if (selectedIndex === 0) void destroyWorkout(workout).then(() => {
            setWorkouts((current) => current.filter((item) => item.id !== workout.id));
        });
    });

    return {
        chartPeriods,
        confirmDelete,
        cursor,
        loading,
        localeTag,
        move,
        periodWorkouts,
        plans,
        selectDay,
        selectMonth,
        selectToday,
        setView,
        title,
        view,
        workouts,
    };
};
