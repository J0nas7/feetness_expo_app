import { BarChartsWithPeriods } from '@/components';
import { useWorkouts } from '@/hooks/useWorkouts';
import { activityName, locale, t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { ExerciseType, Workout } from '@/types/WorkoutDTO';
import { DEMO_WORKOUTS } from '@/utils/progress/demoWorkouts';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CalendarView = 'day' | 'week' | 'month' | 'year';

const VIEWS: CalendarView[] = ['day', 'week', 'month', 'year'];
const ACTIVITIES: ExerciseType[] = ['walking', 'running', 'cycling'];
const EXERCISE_ICON: Record<ExerciseType, string> = {
    running: '🏃‍♂️',
    cycling: '🚴‍♀️',
    walking: '🚶‍♂️',
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const sameDay = (left: Date, right: Date) => startOfDay(left).getTime() === startOfDay(right).getTime();
const startOfWeek = (date: Date) => addDays(startOfDay(date), -((date.getDay() + 6) % 7));
const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
const isoWeek = (value: Date) => {
    const date = new Date(value.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const first = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - first.getTime()) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7);
};

export default function WorkoutCalendar() {
    const theme = useTheme() as MyTheme;
    const { indexWorkouts } = useWorkouts();
    const localeTag = locale === 'da' ? 'da-DK' : 'en-US';
    const [view, setView] = React.useState<CalendarView>('month');
    const [cursor, setCursor] = React.useState(startOfDay(new Date()));
    const [workouts, setWorkouts] = React.useState<Workout[]>([]);
    const [loading, setLoading] = React.useState(true);

    useFocusEffect(React.useCallback(() => {
        let active = true;
        indexWorkouts().then((stored) => {
            if (active) setWorkouts(stored.length ? stored : DEMO_WORKOUTS);
        }).finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [indexWorkouts]));

    const styles = StyleSheet.create({
        screen: { flex: 1, backgroundColor: theme.colors.background },
        content: { paddingHorizontal: 14, paddingBottom: 100 },
        modeBar: { flexDirection: 'row', marginVertical: 12, padding: 3, borderRadius: 9, backgroundColor: theme.colors.surface },
        mode: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 7 },
        modeActive: { backgroundColor: theme.colors.background, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
        modeText: { color: theme.colors.secondaryText, fontSize: 12, fontWeight: '600' },
        modeTextActive: { color: theme.colors.primary },
        navigation: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
        navButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
        navTitleWrap: { flex: 1 },
        navTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
        todayButton: { position: 'absolute', left: 20, bottom: 20, minHeight: 44, paddingHorizontal: 18, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderColor: theme.colors.primary, borderWidth: 1, borderStyle: "solid", elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 5 },
        todayText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
        summary: { borderRadius: 14, padding: 14, backgroundColor: theme.colors.surface, marginBottom: 18 },
        totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
        totalMetric: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
        activityRow: { flexDirection: 'row', gap: 7 },
        activity: { flex: 1, alignItems: 'center' },
        activityTitle: { color: theme.colors.text, fontSize: 11, fontWeight: '700', marginBottom: 5 },
        activityMetric: { color: theme.colors.tertiaryText, fontSize: 10, marginTop: 2 },
        sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 9 },
        workout: { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 12, backgroundColor: theme.colors.surface, marginBottom: 8 },
        workoutIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.card, marginRight: 11 },
        workoutTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
        workoutMeta: { color: theme.colors.tertiaryText, fontSize: 12, marginTop: 3 },
        empty: { color: theme.colors.tertiaryText, textAlign: 'center', paddingVertical: 30 },
        weekDay: { marginBottom: 18 },
        weekHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
        weekBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: theme.colors.surface },
        weekBadgeToday: { backgroundColor: theme.colors.primary },
        weekDayNumber: { color: theme.colors.text, fontWeight: '700' },
        weekDayNumberToday: { color: theme.colors.onPrimary },
        weekLabel: { color: theme.colors.text, fontWeight: '700', flex: 1 },
        weekdayHeader: { flexDirection: 'row', marginBottom: 5 },
        weekNumberSpace: { width: 28 },
        weekdayName: { flex: 1, textAlign: 'center', color: theme.colors.tertiaryText, fontSize: 10, fontWeight: '700' },
        monthRow: { flexDirection: 'row', minHeight: 64 },
        weekNumber: { width: 28, color: theme.colors.tertiaryText, fontSize: 9, paddingTop: 8, textAlign: 'center' },
        dayCell: { flex: 1, minWidth: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, paddingVertical: 6, paddingHorizontal: 2, alignItems: 'center' },
        outsideDay: { opacity: 0.35 },
        dayNumber: { color: theme.colors.text, fontSize: 11, width: 23, height: 23, lineHeight: 23, textAlign: 'center', borderRadius: 12 },
        todayNumber: { color: theme.colors.onPrimary, backgroundColor: theme.colors.primary, fontWeight: '700' },
        cellMetric: { color: theme.colors.tertiaryText, fontSize: 8, marginTop: 2 },
        yearGrid: { flexDirection: 'row', flexWrap: 'wrap' },
        monthCard: { width: '33.333%', paddingHorizontal: 5, marginBottom: 18 },
        monthName: { color: theme.colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5 },
        miniHeader: { flexDirection: 'row' },
        miniDayName: { flex: 1, color: theme.colors.tertiaryText, fontSize: 6, textAlign: 'center' },
        miniRow: { flexDirection: 'row' },
        miniDay: { flex: 1, color: theme.colors.text, fontSize: 7, lineHeight: 12, textAlign: 'center' },
        miniWorkoutDay: { color: theme.colors.primary, fontWeight: '900' },
    });

    const workoutsForDay = React.useCallback((date: Date) => workouts.filter((workout) => sameDay(new Date(workout.startTime), date)).sort((a, b) => a.startTime - b.startTime), [workouts]);
    const periodWorkouts = React.useMemo(() => workouts.filter((workout) => {
        const date = new Date(workout.startTime);
        if (view === 'day') return sameDay(date, cursor);
        if (view === 'week') { const start = startOfWeek(cursor); return date >= start && date < addDays(start, 7); }
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
            return {
                year: date.getFullYear(), week: isoWeek(date), workouts: workouts.filter((workout) => {
                    const workoutDate = new Date(workout.startTime);
                    return workoutDate >= date && workoutDate < end;
                })
            };
        }
        if (view === 'month') {
            const date = new Date(cursor.getFullYear(), cursor.getMonth() - offset, 1);
            return {
                year: date.getFullYear(), month: date.getMonth(), workouts: workouts.filter((workout) => {
                    const workoutDate = new Date(workout.startTime);
                    return workoutDate.getFullYear() === date.getFullYear() && workoutDate.getMonth() === date.getMonth();
                })
            };
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

    const Summary = ({ items }: { items: Workout[] }) => {
        const summarize = (values: Workout[]) => ({
            distance: values.reduce((sum, item) => sum + item.distance, 0),
            duration: values.reduce((sum, item) => sum + item.elapsedTime, 0),
            goals: values.filter((item) => item.percentage >= 100).length,
        });
        const total = summarize(items);
        return <View style={styles.summary}>
            <View style={styles.totalRow}>
                <Text style={styles.totalMetric}>⏱ {formatDuration(total.duration)}</Text>
                <Text style={styles.totalMetric}>📏 {(total.distance / 1000).toFixed(1)} km</Text>
                <Text style={styles.totalMetric}>🎯 {total.goals}</Text>
            </View>
            <View style={styles.activityRow}>{ACTIVITIES.map((exercise) => {
                const value = summarize(items.filter((item) => item.exercise === exercise));
                return <View style={styles.activity} key={exercise}>
                    <Text style={styles.activityTitle}>{EXERCISE_ICON[exercise]}  {activityName(exercise)}</Text>
                    <Text style={styles.activityMetric}>{formatDuration(value.duration)}</Text>
                    <Text style={styles.activityMetric}>{(value.distance / 1000).toFixed(1)} km</Text>
                    <Text style={styles.activityMetric}>{t('progress.summary.goalsShort', { count: value.goals })}</Text>
                </View>;
            })}</View>
        </View>;
    };

    const WorkoutRow = ({ workout }: { workout: Workout }) => <Pressable style={styles.workout} onPress={() => router.push({ pathname: '/finished-exercise', params: { workout: JSON.stringify(workout) } })}>
        <View style={styles.workoutIcon}>
            <Text>{EXERCISE_ICON[workout.exercise]}</Text>
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.workoutTitle}>{activityName(workout.exercise)}</Text>
            <Text style={styles.workoutMeta}>{new Date(workout.startTime).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })} · {(workout.distance / 1000).toFixed(1)} km · {formatDuration(workout.elapsedTime)}</Text>
        </View>
        <FontAwesome5 name="chevron-right" size={11} color={theme.colors.tertiaryText} />
    </Pressable>;

    const monthWeeks = (year: number, month: number) => {
        const first = startOfWeek(new Date(year, month, 1));
        const last = new Date(year, month + 1, 0);
        const result: Date[][] = [];
        for (let weekStart = first; weekStart <= last; weekStart = addDays(weekStart, 7)) result.push(Array.from({ length: 7 }, (_, day) => addDays(weekStart, day)));
        return result;
    };

    const renderDay = () => <>{periodWorkouts.length ? periodWorkouts.map((workout) => <WorkoutRow key={workout.id} workout={workout} />) : <Text style={styles.empty}>{t('progress.calendar.noWorkouts')}</Text>}</>;
    const renderWeek = () => <>{Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index)).map((date) => {
        const items = workoutsForDay(date);
        const today = sameDay(date, new Date());
        return <View key={dateKey(date)} style={styles.weekDay}>
            <Pressable style={styles.weekHeading} onPress={() => selectDay(date)}>
                <View style={[styles.weekBadge, today && styles.weekBadgeToday]}><Text style={[styles.weekDayNumber, today && styles.weekDayNumberToday]}>{date.getDate()}</Text></View>
                <Text style={styles.weekLabel}>{date.toLocaleDateString(localeTag, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                <FontAwesome5 name="chevron-right" size={11} color={theme.colors.tertiaryText} />
            </Pressable>
            {items.length ? items.map((workout) => <WorkoutRow key={workout.id} workout={workout} />) : <Text style={[styles.empty, { paddingVertical: 7 }]}>{t('progress.calendar.noWorkouts')}</Text>}
        </View>;
    })}</>;
    const renderMonth = (year = cursor.getFullYear(), month = cursor.getMonth(), interactive = true) => <>
        <View style={styles.weekdayHeader}><View style={styles.weekNumberSpace} />{Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date(2024, 0, 1)), i)).map((date) => <Text key={date.getDay()} style={styles.weekdayName}>{date.toLocaleDateString(localeTag, { weekday: 'narrow' })}</Text>)}</View>
        {monthWeeks(year, month).map((week) => <View key={dateKey(week[0])} style={styles.monthRow}>
            <Text style={styles.weekNumber}>{isoWeek(week[0])}</Text>
            {week.map((date) => {
                const items = workoutsForDay(date);
                const distance = items.reduce((sum, item) => sum + item.distance, 0);
                const duration = items.reduce((sum, item) => sum + item.elapsedTime, 0);
                return <Pressable disabled={!interactive} key={dateKey(date)} style={[styles.dayCell, date.getMonth() !== month && styles.outsideDay]} onPress={() => selectDay(date)}>
                    <Text style={[styles.dayNumber, sameDay(date, new Date()) && styles.todayNumber]}>{date.getDate()}</Text>
                    {!!items.length && <><Text numberOfLines={1} style={styles.cellMetric}>{(distance / 1000).toFixed(1)}k</Text><Text numberOfLines={1} style={styles.cellMetric}>{formatDuration(duration)}</Text></>}
                </Pressable>;
            })}
        </View>)}
    </>;
    const renderYear = () => <View style={styles.yearGrid}>{Array.from({ length: 12 }, (_, month) => {
        const weeks = monthWeeks(cursor.getFullYear(), month);
        return <Pressable key={month} style={styles.monthCard} onPress={() => selectMonth(month)}>
            <Text style={styles.monthName}>{new Date(cursor.getFullYear(), month, 1).toLocaleDateString(localeTag, { month: 'long' })}</Text>
            <View style={styles.miniHeader}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((name, i) => <Text key={`${name}-${i}`} style={styles.miniDayName}>{name}</Text>)}</View>
            {weeks.map((week) => <View key={dateKey(week[0])} style={styles.miniRow}>{week.map((date) => {
                const hasWorkout = workoutsForDay(date).length > 0;
                return <Text key={dateKey(date)} style={[styles.miniDay, date.getMonth() !== month && styles.outsideDay, hasWorkout && styles.miniWorkoutDay]}>{date.getDate()}</Text>;
            })}</View>)}
        </Pressable>;
    })}</View>;

    return <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.modeBar}>{VIEWS.map((item) => <Pressable key={item} style={[styles.mode, view === item && styles.modeActive]} onPress={() => setView(item)}><Text style={[styles.modeText, view === item && styles.modeTextActive]}>{t(`progress.calendar.views.${item}`)}</Text></Pressable>)}</View>
            <View style={styles.navigation}>
                <Pressable style={styles.navButton} onPress={() => move(-1)}><FontAwesome5 name="chevron-left" size={17} color={theme.colors.primary} /></Pressable>
                <View style={styles.navTitleWrap}><Text style={styles.navTitle}>{title}</Text></View>
                <Pressable style={styles.navButton} onPress={() => move(1)}><FontAwesome5 name="chevron-right" size={17} color={theme.colors.primary} /></Pressable>
            </View>
            <BarChartsWithPeriods periods={chartPeriods} periodType={view} />
            <Summary items={periodWorkouts} />
            {loading ? <Text style={styles.empty}>{t('progress.calendar.loading')}</Text> : view === 'day' ? renderDay() : view === 'week' ? renderWeek() : view === 'month' ? renderMonth() : renderYear()}
        </ScrollView>
        <Pressable
            style={styles.todayButton}
            onPress={() => setCursor(startOfDay(new Date()))}
            accessibilityRole="button"
            accessibilityLabel={t('progress.calendar.today')}
        >
            <Text style={styles.todayText}>{t('progress.calendar.today')}</Text>
        </Pressable>
    </SafeAreaView>;
}
