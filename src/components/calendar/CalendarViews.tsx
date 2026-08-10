import { Plan } from '@/components/plan/model';
import { t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { Workout } from '@/types/WorkoutDTO';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, dateKey, formatDuration, isoWeek, monthWeeks, sameDay, startOfWeek } from './model';
import { WorkoutRow } from './WorkoutRow';

interface SharedProps {
    workouts: Workout[];
    localeTag: string;
    onDelete: (workout: Workout) => void;
}

export const DayView = ({ workouts, localeTag, onDelete }: SharedProps) => {
    const theme = useTheme() as MyTheme;
    return workouts.length
        ? <>{workouts.map((workout) => <WorkoutRow key={workout.id} workout={workout} localeTag={localeTag} onDelete={onDelete} />)}</>
        : <Text style={{ color: theme.colors.tertiaryText, textAlign: 'center', paddingVertical: 30 }}>{t('progress.calendar.noWorkouts')}</Text>;
};

export const WeekView = ({ cursor, workouts, localeTag, onDelete, onSelectDay }: SharedProps & { cursor: Date; onSelectDay: (date: Date) => void }) => {
    const theme = useTheme() as MyTheme;
    const styles = StyleSheet.create({
        day: { marginBottom: 18 },
        heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
        badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: theme.colors.surface },
        badgeToday: { backgroundColor: theme.colors.primary },
        number: { color: theme.colors.text, fontWeight: '700' },
        numberToday: { color: theme.colors.onPrimary },
        label: { color: theme.colors.text, fontWeight: '700', flex: 1 },
        empty: { color: theme.colors.tertiaryText, textAlign: 'center', paddingVertical: 7 },
    });
    return <>{Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index)).map((date) => {
        const items = workouts.filter((workout) => sameDay(new Date(workout.startTime), date)).sort((a, b) => a.startTime - b.startTime);
        const today = sameDay(date, new Date());
        return <View key={dateKey(date)} style={styles.day}>
            <Pressable style={styles.heading} onPress={() => onSelectDay(date)}>
                <View style={[styles.badge, today && styles.badgeToday]}><Text style={[styles.number, today && styles.numberToday]}>{date.getDate()}</Text></View>
                <Text style={styles.label}>{date.toLocaleDateString(localeTag, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                <FontAwesome5 name="chevron-right" size={11} color={theme.colors.tertiaryText} />
            </Pressable>
            {items.length ? items.map((workout) => <WorkoutRow key={workout.id} workout={workout} localeTag={localeTag} onDelete={onDelete} />) : <Text style={styles.empty}>{t('progress.calendar.noWorkouts')}</Text>}
        </View>;
    })}</>;
};

export const MonthView = ({ year, month, workouts, plans, localeTag, onSelectDay }: Omit<SharedProps, 'onDelete'> & { year: number; month: number; plans: Plan[]; onSelectDay: (date: Date) => void }) => {
    const theme = useTheme() as MyTheme;
    const now = new Date();
    const monthlyWorkouts = workouts.filter((workout) => {
        const date = new Date(workout.startTime);
        return date.getFullYear() === year && date.getMonth() === month;
    });
    const monthlyPlan = plans.find((plan) => plan.period === `${String(month + 1).padStart(2, '0')}-${year}`);
    const current = year === now.getFullYear() && month === now.getMonth();
    const distance = monthlyWorkouts.reduce((sum, workout) => sum + workout.distance, 0);
    const duration = monthlyWorkouts.reduce((sum, workout) => sum + workout.elapsedTime, 0);
    const completed = monthlyPlan?.metric === 'distance' ? distance / 1000 : duration / 3600;
    const percentage = monthlyPlan && monthlyPlan.goal > 0 ? completed / monthlyPlan.goal * 100 : 0;
    const progressWidth = `${Math.min(Math.max(percentage, 0), 100)}%` as `${number}%`;
    const remaining = monthlyPlan ? Math.max(monthlyPlan.goal - completed, 0) : 0;
    const remainingDisplay = monthlyPlan?.metric === 'distance' ? remaining : remaining * 60;
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
    const periodTitle = new Date(year, month).toLocaleString(localeTag, { month: 'long', year: 'numeric' });
    const styles = StyleSheet.create({
        plan: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, padding: 14, borderRadius: 12, borderColor: theme.colors.border, borderWidth: 1 },
        planContent: { flex: 1 },
        labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
        planTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '700', flexShrink: 1 },
        value: { color: theme.colors.tertiaryText, fontSize: 12, fontWeight: '600' },
        track: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: theme.colors.border },
        fill: { height: '100%', borderRadius: 4 },
        chevron: { marginLeft: 12 },
        pace: { color: theme.colors.secondaryText, fontSize: 12, lineHeight: 18, marginTop: 9 },
        weekdayHeader: { flexDirection: 'row', marginBottom: 5 },
        weekNumberSpace: { width: 28 },
        weekday: { flex: 1, textAlign: 'center', color: theme.colors.tertiaryText, fontSize: 10, fontWeight: '700' },
        row: { flexDirection: 'row', minHeight: 64 },
        weekNumber: { width: 28, color: theme.colors.tertiaryText, fontSize: 9, paddingTop: 8, textAlign: 'center' },
        day: { flex: 1, minWidth: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, paddingVertical: 6, paddingHorizontal: 2, alignItems: 'center' },
        outside: { opacity: 0.35 },
        dayNumber: { color: theme.colors.text, fontSize: 11, width: 23, height: 23, lineHeight: 23, textAlign: 'center', borderRadius: 12 },
        today: { color: theme.colors.onPrimary, backgroundColor: theme.colors.primary, fontWeight: '700' },
        metric: { color: theme.colors.tertiaryText, fontSize: 8, marginTop: 2 },
    });

    return <>
        {monthlyPlan && <Pressable style={styles.plan} onPress={() => router.push({ pathname: '/edit-plan', params: { id: monthlyPlan.id } })} accessibilityRole="button" accessibilityLabel={t('progress.editMonthlyPlan', { period: periodTitle })}>
            <View style={styles.planContent}>
                <View style={styles.labels}>
                    <Text style={styles.planTitle}>{t('progress.monthlyPlan')}{current ? ` · ${t('progress.currentMonth')}` : ''} · {Math.round(percentage)}%</Text>
                    <Text style={styles.value}>{Number(completed.toFixed(1))} / {monthlyPlan.goal} {monthlyPlan.metric === 'distance' ? 'km' : t('progress.hours')}</Text>
                </View>
                <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.min(Math.round(percentage), 100) }}>
                    <View style={[styles.fill, { width: progressWidth, backgroundColor: percentage >= 100 ? theme.colors.success : theme.colors.primary }]} />
                </View>
                {current && percentage < 100 && <Text style={styles.pace}>{t('progress.monthlyPace', {
                    remaining: Number(remainingDisplay.toFixed(1)),
                    unit: monthlyPlan.metric === 'distance' ? 'km' : t('progress.minutes'),
                    days: daysLeft,
                    daily: Number((remainingDisplay / daysLeft).toFixed(1)),
                })}</Text>}
            </View>
            <FontAwesome5 style={styles.chevron} name="chevron-right" size={14} color={theme.colors.tertiaryText} />
        </Pressable>}
        <View style={styles.weekdayHeader}><View style={styles.weekNumberSpace} />{Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(new Date(2024, 0, 1)), index)).map((date) => <Text key={date.getDay()} style={styles.weekday}>{date.toLocaleDateString(localeTag, { weekday: 'narrow' })}</Text>)}</View>
        {monthWeeks(year, month).map((week) => <View key={dateKey(week[0])} style={styles.row}>
            <Text style={styles.weekNumber}>{isoWeek(week[0])}</Text>
            {week.map((date) => {
                const items = workouts.filter((workout) => sameDay(new Date(workout.startTime), date));
                const dayDistance = items.reduce((sum, item) => sum + item.distance, 0);
                const dayDuration = items.reduce((sum, item) => sum + item.elapsedTime, 0);
                return <Pressable key={dateKey(date)} style={[styles.day, date.getMonth() !== month && styles.outside]} onPress={() => onSelectDay(date)}>
                    <Text style={[styles.dayNumber, sameDay(date, new Date()) && styles.today]}>{date.getDate()}</Text>
                    {!!items.length && <><Text numberOfLines={1} style={styles.metric}>{(dayDistance / 1000).toFixed(1)}k</Text><Text numberOfLines={1} style={styles.metric}>{formatDuration(dayDuration)}</Text></>}
                </Pressable>;
            })}
        </View>)}
    </>;
};

export const YearView = ({ year, workouts, localeTag, onSelectMonth }: { year: number; workouts: Workout[]; localeTag: string; onSelectMonth: (month: number) => void }) => {
    const theme = useTheme() as MyTheme;
    const styles = StyleSheet.create({
        grid: { flexDirection: 'row', flexWrap: 'wrap' },
        card: { width: '33.333%', paddingHorizontal: 5, marginBottom: 18 },
        name: { color: theme.colors.text, fontSize: 12, fontWeight: '700', marginBottom: 5 },
        row: { flexDirection: 'row' },
        dayName: { flex: 1, color: theme.colors.tertiaryText, fontSize: 6, textAlign: 'center' },
        day: { flex: 1, color: theme.colors.text, fontSize: 7, lineHeight: 12, textAlign: 'center' },
        outside: { opacity: 0.35 },
        workout: { color: theme.colors.primary, fontWeight: '900' },
    });
    return <View style={styles.grid}>{Array.from({ length: 12 }, (_, month) => (
        <Pressable key={month} style={styles.card} onPress={() => onSelectMonth(month)}>
            <Text style={styles.name}>{new Date(year, month, 1).toLocaleDateString(localeTag, { month: 'long' })}</Text>
            <View style={styles.row}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((name, index) => <Text key={`${name}-${index}`} style={styles.dayName}>{name}</Text>)}</View>
            {monthWeeks(year, month).map((week) => <View key={dateKey(week[0])} style={styles.row}>{week.map((date) => {
                const hasWorkout = workouts.some((workout) => sameDay(new Date(workout.startTime), date));
                return <Text key={dateKey(date)} style={[styles.day, date.getMonth() !== month && styles.outside, hasWorkout && styles.workout]}>{date.getDate()}</Text>;
            })}</View>)}
        </Pressable>
    ))}</View>;
};
