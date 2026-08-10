import { BarChartsWithPeriods } from '@/components';
import { CalendarHeader, DayView, MonthView, WeekView, WorkoutSummary, YearView } from '@/components/calendar';
import { useCalendar } from '@/hooks/useCalendar';
import { t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutCalendar() {
    const theme = useTheme() as MyTheme;
    const calendar = useCalendar();

    const renderView = () => {
        if (calendar.view === 'day') {
            return <DayView workouts={calendar.periodWorkouts} localeTag={calendar.localeTag} onDelete={calendar.confirmDelete} />;
        }
        if (calendar.view === 'week') {
            return <WeekView cursor={calendar.cursor} workouts={calendar.workouts} localeTag={calendar.localeTag} onDelete={calendar.confirmDelete} onSelectDay={calendar.selectDay} />;
        }
        if (calendar.view === 'month') {
            return <MonthView year={calendar.cursor.getFullYear()} month={calendar.cursor.getMonth()} workouts={calendar.workouts} plans={calendar.plans} localeTag={calendar.localeTag} onSelectDay={calendar.selectDay} />;
        }
        return <YearView year={calendar.cursor.getFullYear()} workouts={calendar.workouts} localeTag={calendar.localeTag} onSelectMonth={calendar.selectMonth} />;
    };

    const styles = StyleSheet.create({
        screen: { flex: 1, backgroundColor: theme.colors.background },
        content: { paddingHorizontal: 14, paddingBottom: 100 },
        empty: { color: theme.colors.tertiaryText, textAlign: 'center', paddingVertical: 30 },
        todayButton: { position: 'absolute', left: 20, bottom: 20, minHeight: 44, paddingHorizontal: 18, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, borderColor: theme.colors.primary, borderWidth: 1, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 5 },
        todayText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
    });

    return <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
            <CalendarHeader view={calendar.view} title={calendar.title} onChangeView={calendar.setView} onMove={calendar.move} />
            <BarChartsWithPeriods periods={calendar.chartPeriods} periodType={calendar.view} />
            <WorkoutSummary workouts={calendar.periodWorkouts} />
            {calendar.loading ? <Text style={styles.empty}>{t('progress.calendar.loading')}</Text> : renderView()}
        </ScrollView>
        <Pressable style={styles.todayButton} onPress={calendar.selectToday} accessibilityRole="button" accessibilityLabel={t('progress.calendar.today')}>
            <Text style={styles.todayText}>{t('progress.calendar.today')}</Text>
        </Pressable>
    </SafeAreaView>;
}
