import { createOnboardingStyles } from '@/styles/modules/OnboardingStyles';
import { locale, t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface DateOfBirthPageProps {
    theme: MyTheme;
    day: string;
    month: string;
    year: string;
    setDay: (v: string) => void;
    setMonth: (v: string) => void;
    setYear: (v: string) => void;
    setCompleted: (value: React.SetStateAction<boolean>) => void
    onNext: (pageName: PageTitles) => void
}

export const DateOfBirthPage: React.FC<DateOfBirthPageProps> = ({
    theme,
    day,
    month,
    year,
    setDay,
    setMonth,
    setYear,
    setCompleted,
    onNext
}) => {
    const onboardingStyles = createOnboardingStyles(theme);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth(); // 0-indexed
    const currentDay = today.getDate();

    // ---------- Local picker state ----------
    const [localDay, setLocalDay] = useState(day);
    const [localMonth, setLocalMonth] = useState(month);
    const [localYear, setLocalYear] = useState(year);

    const monthsAll = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthLabel = (month: string) => new Date(2000, monthsAll.indexOf(month), 1)
        .toLocaleString(locale === 'da' ? 'da-DK' : 'en-US', { month: 'long' });
    const years = Array.from(
        { length: 100 },
        (_, i) => `${new Date().getFullYear() - i}`
    );

    // Filter months based on current year
    const months = localYear === `${currentYear}`
        ? monthsAll.slice(0, currentMonthIndex + 1)
        : monthsAll;

    // Filter days based on current month/year
    const selectedYearNum = localYear !== 'Year' ? parseInt(localYear, 10) : currentYear - 1;
    const selectedMonthIndex =
        localMonth !== 'Month' ? monthsAll.indexOf(localMonth) : currentMonthIndex;

    const monthDays = new Date(selectedYearNum, selectedMonthIndex + 1, 0).getDate(); // Get number of days in a month

    const daysMax =
        selectedYearNum === currentYear &&
            selectedMonthIndex === currentMonthIndex
            ? Math.min(monthDays, currentDay)
            : monthDays;
    const days = Array.from({ length: daysMax }, (_, i) => `${i + 1}`);

    const canContinue =
        localDay !== 'Day' &&
        localMonth !== 'Month' &&
        localYear !== 'Year';

    // ---------- Validate date ----------
    const getSelectedDate = (d: string, m: string, y: string) => {
        const monthIndex = months.indexOf(m);
        return new Date(parseInt(y, 10), monthIndex, parseInt(d, 10));
    };

    const isFutureDate = (d: string, m: string, y: string) => {
        if (d === 'Day' || m === 'Month' || y === 'Year') return false;
        return getSelectedDate(d, m, y) > today;
    };

    const resetToToday = () => {
        setLocalDay(`${today.getDate()}`);
        setLocalMonth(months[today.getMonth()]);
        setLocalYear(`${today.getFullYear()}`);
    };

    // ---------- Setter with validation ----------
    const handleDayChange = (d: string) => {
        const newDay = d;
        if (isFutureDate(newDay, localMonth, localYear)) {
            resetToToday();
        } else {
            setLocalDay(newDay);
        }
    };

    const handleMonthChange = (m: string) => {
        const newMonth = m;
        if (isFutureDate(localDay, newMonth, localYear)) {
            resetToToday();
        } else {
            setLocalMonth(newMonth);
            // also adjust day if it exceeds new max
            const maxDay = (localYear === `${currentYear}` && monthsAll.indexOf(newMonth) === currentMonthIndex)
                ? currentDay
                : 31;
            if (parseInt(localDay, 10) > maxDay) setLocalDay(`${maxDay}`);
        }
    };

    const handleYearChange = (y: string) => {
        const newYear = y;
        if (isFutureDate(localDay, localMonth, newYear)) {
            resetToToday();
        } else {
            setLocalYear(newYear);
            // adjust month/day if necessary
            if (parseInt(newYear, 10) === currentYear) {
                if (monthsAll.indexOf(localMonth) > currentMonthIndex) setLocalMonth(monthsAll[currentMonthIndex]);
                if (parseInt(localDay, 10) > currentDay && localMonth === monthsAll[currentMonthIndex]) setLocalDay(`${currentDay}`);
            }
        }
    };

    const handleNext = () => {
        if (!canContinue) return;

        setDay(localDay);
        setMonth(localMonth);
        setYear(localYear);

        setCompleted(true);
        onNext('Finished');
    };

    return (
        <View style={onboardingStyles.center}>
            <Text style={onboardingStyles.title}>{t('onboarding.birthDate')}</Text>

            <View style={{ flexDirection: 'row', width: '100%' }}>
                {/* Day */}
                <Picker
                    style={{ flex: 1 }}
                    selectedValue={localDay}
                    onValueChange={handleDayChange}
                    itemStyle={{ color: theme.colors.text }}
                >
                    <Picker.Item label={t('onboarding.day')} value="Day" />
                    {days.map(d => (
                        <Picker.Item key={d} label={d} value={d} />
                    ))}
                </Picker>

                {/* Month */}
                <Picker
                    style={{ flex: 1 }}
                    selectedValue={localMonth}
                    onValueChange={handleMonthChange}
                    itemStyle={{ color: theme.colors.text }}
                >
                    <Picker.Item label={t('onboarding.month')} value="Month" />
                    {months.map(m => (
                        <Picker.Item key={m} label={monthLabel(m)} value={m} />
                    ))}
                </Picker>

                {/* Year */}
                <Picker
                    style={{ flex: 1 }}
                    selectedValue={localYear}
                    onValueChange={handleYearChange}
                    itemStyle={{ color: theme.colors.text }}
                >
                    <Picker.Item label={t('onboarding.year')} value="Year" />
                    {years.map(y => (
                        <Picker.Item key={y} label={y} value={y} />
                    ))}
                </Picker>
            </View>

            {/* ---------- Next button ---------- */}
            <Pressable
                onPress={handleNext}
                disabled={!canContinue}
                style={[
                    onboardingStyles.nextButton,
                    canContinue ? onboardingStyles.nextButtonActive : onboardingStyles.nextButtonInactive
                ]}
            >
                <Text style={onboardingStyles.nextButtonText}>
                    {t('onboarding.next')}
                </Text>
            </Pressable>
        </View>
    );
};
