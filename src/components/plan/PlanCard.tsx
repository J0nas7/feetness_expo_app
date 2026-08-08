import { useExercise } from '@/hooks/useExercise';
import { MyTheme } from '@/types/theme';
import { locale, t } from '@/i18n';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { currentPeriodIndex, formatPeriod, periodIndex, Plan } from './model';

type Props = { plan: Plan; selected: boolean; bulkMode: boolean; onSelect: () => void; onCopy: () => void; onEdit: () => void; onDelete: () => void };
const COMPACT_CARD_HEIGHT = 88;
const PROGRESS_CARD_HEIGHT = 118;
export const planCardHeight = (plan: Plan) =>
    periodIndex(plan.period) > currentPeriodIndex ? COMPACT_CARD_HEIGHT : PROGRESS_CARD_HEIGHT;

export function PlanCard({ plan, selected, bulkMode, onSelect, onCopy, onEdit, onDelete }: Props) {
    const theme = useTheme() as MyTheme;
    const { indexWorkouts } = useExercise();
    const current = periodIndex(plan.period) === currentPeriodIndex;
    const showProgress = periodIndex(plan.period) <= currentPeriodIndex;
    const cardHeight = planCardHeight(plan);
    const [completedAmount, setCompletedAmount] = useState(0);

    useFocusEffect(useCallback(() => {
        let active = true;

        const loadMonthlyProgress = async () => {
            if (!showProgress) {
                if (active) setCompletedAmount(0);
                return;
            }
            const period = /^(0[1-9]|1[0-2])-(\d{4})$/.exec(plan.period);
            if (!period) return;

            const workouts = await indexWorkouts();
            const planMonth = Number(period[1]) - 1;
            const planYear = Number(period[2]);
            const monthlyWorkouts = workouts.filter((workout) => {
                const workoutDate = new Date(workout.startTime);
                return workoutDate.getMonth() === planMonth && workoutDate.getFullYear() === planYear;
            });
            const completed = plan.metric === 'distance'
                ? monthlyWorkouts.reduce((total, workout) => total + workout.distance, 0) / 1000
                : monthlyWorkouts.reduce((total, workout) => total + workout.elapsedTime, 0) / 3600;

            if (active) setCompletedAmount(completed);
        };

        loadMonthlyProgress();
        return () => { active = false; };
    }, [indexWorkouts, plan.metric, plan.period, showProgress]));

    const percentage = plan.goal > 0 ? completedAmount / plan.goal * 100 : 0;
    const displayedPercentage = Math.round(percentage);
    const progressWidth = `${Math.min(Math.max(percentage, 0), 100)}%` as `${number}%`;
    const numberLocale = locale === 'da' ? 'da-DK' : 'en-US';
    const completedLabel = completedAmount.toLocaleString(numberLocale, { maximumFractionDigits: 1 });
    const goalLabel = plan.goal.toLocaleString(numberLocale, { maximumFractionDigits: 2 });
    const unit = plan.metric === 'distance' ? 'km' : t('plan.card.hours');
    const styles = StyleSheet.create({
        wrapper: { marginBottom: 10, borderRadius: 14, overflow: 'hidden' },
        card: { flexDirection: 'row', height: cardHeight, padding: 15, borderRadius: 14, borderWidth: 2, borderColor: 'transparent', backgroundColor: theme.colors.background, alignItems: 'center' },
        selected: { borderColor: theme.colors.primary },
        body: { flex: 1 },
        titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        title: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
        badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: theme.colors.primary },
        badgeText: { color: theme.colors.onPrimary, fontSize: 10, fontWeight: '800' },
        detail: { color: theme.colors.tertiaryText, marginTop: 7 },
        progressTrack: { height: 7, marginTop: 10, borderRadius: 4, overflow: 'hidden', backgroundColor: theme.colors.border },
        progressFill: { height: '100%', borderRadius: 4, backgroundColor: percentage >= 100 ? theme.colors.success : theme.colors.primary },
        progressText: { color: theme.colors.tertiaryText, marginTop: 5, fontSize: 11, fontWeight: '600' },
        actions: { height: cardHeight, flexDirection: 'row' },
        action: { width: 70, alignItems: 'center', justifyContent: 'center', gap: 6 },
        actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    });

    const card = <Pressable style={[styles.card, selected && styles.selected]} onPress={bulkMode ? onSelect : onEdit}>
        <View style={styles.body}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>{formatPeriod(plan.period)}</Text>
                {current && <View style={styles.badge}><Text style={styles.badgeText}>{t('plan.card.currentMonth')}</Text></View>}
            </View>
            <Text style={styles.detail}>{t('plan.card.goal', { goal: goalLabel, unit })}</Text>
            {showProgress && <><View
                style={styles.progressTrack}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.min(displayedPercentage, 100) }}
            >
                <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
                <Text style={styles.progressText}>{completedLabel} / {goalLabel} {unit} · {displayedPercentage}%</Text></>}
        </View>
    </Pressable>;

    if (bulkMode) return <View style={styles.wrapper}>{card}</View>;
    return <Swipeable containerStyle={styles.wrapper} overshootRight={false} renderRightActions={() => <View style={styles.actions}>
        <Pressable style={[styles.action, { backgroundColor: '#D99A00' }]} onPress={onCopy}><FontAwesome5 name="copy" size={17} color="#FFFFFF" /><Text style={styles.actionText}>{t('plan.card.copy')}</Text></Pressable>
        <Pressable style={[styles.action, { backgroundColor: '#2563EB' }]} onPress={onEdit}><FontAwesome5 name="pencil-alt" size={17} color="#FFFFFF" /><Text style={styles.actionText}>{t('plan.card.edit')}</Text></Pressable>
        <Pressable style={[styles.action, { backgroundColor: theme.colors.notification }]} onPress={onDelete}><FontAwesome5 name="trash-alt" size={17} color="#FFFFFF" /><Text style={styles.actionText}>{t('plan.card.delete')}</Text></Pressable>
    </View>}>{card}</Swipeable>;
}
