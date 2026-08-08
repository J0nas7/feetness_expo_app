import { MyTheme } from '@/types/theme';
import { usePlans } from '@/hooks/usePlans';
import { locale, t } from '@/i18n';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { PlanFormFields } from './PlanFormFields';
import { BulkGoalMode, BulkOperation, calculateBulkGoal, Metric, nextAvailablePeriod, now, PERIOD_PATTERN, Plan } from './model';

type Props = { kind: 'create' | 'edit' | 'bulk'; planId?: string; copyFrom?: string; selectedIds?: string[] };

export function PlanFormScreen({ kind, planId, copyFrom, selectedIds = [] }: Props) {
    const theme = useTheme() as MyTheme;
    const { plans, savePlans } = usePlans();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [metric, setMetric] = useState<Metric>('distance');
    const [goal, setGoal] = useState('');
    const [bulkGoalMode, setBulkGoalMode] = useState<BulkGoalMode>('assign');
    const [bulkOperation, setBulkOperation] = useState<BulkOperation>('add');
    const isBulk = kind === 'bulk';
    const formatSelectedPeriod = (selectedMonth: number, selectedYear: number) =>
        new Intl.DateTimeFormat(locale === 'da' ? 'da-DK' : 'en-US', { month: 'long', year: 'numeric' })
            .format(new Date(selectedYear, selectedMonth - 1, 1));

    useEffect(() => {
        const source = plans.find((plan) => plan.id === (kind === 'edit' ? planId : copyFrom));
        if (!source) return;
        const period = kind === 'create' ? nextAvailablePeriod(source.period, plans) : (() => {
            const match = PERIOD_PATTERN.exec(source.period);
            return match ? { month: Number(match[1]), year: Number(match[2]) } : { month: now.getMonth() + 1, year: now.getFullYear() };
        })();
        setMonth(period.month);
        setYear(period.year);
        setMetric(source.metric);
        setGoal(String(source.goal));
    }, [copyFrom, kind, planId, plans]);

    const submit = async () => {
        const amount = Number(goal.replace(',', '.'));
        if (!goal.trim() || !Number.isFinite(amount) || amount <= 0) {
            Alert.alert(t('plan.form.invalidGoalTitle'), t('plan.form.invalidGoalMessage'));
            return;
        }

        if (isBulk) {
            const ids = new Set(selectedIds);
            const nextGoal = (plan: Plan) => calculateBulkGoal(plan.goal, amount, bulkGoalMode, bulkOperation);
            if (plans.some((plan) => ids.has(plan.id) && nextGoal(plan) <= 0)) {
                Alert.alert(t('plan.form.invalidResultTitle'), t('plan.form.invalidResultMessage'));
                return;
            }
            await savePlans(plans.map((plan) => ids.has(plan.id) ? { ...plan, metric, goal: Number(nextGoal(plan).toFixed(2)) } : plan));
            router.back();
            return;
        }

        const period = `${String(month).padStart(2, '0')}-${year}`;
        if (plans.some((plan) => plan.period === period && plan.id !== planId)) {
            Alert.alert(t('plan.form.duplicateTitle'), t('plan.form.duplicateMessage', { period: formatSelectedPeriod(month, year) }));
            return;
        }
        const updatedPlan: Plan = { id: kind === 'edit' && planId ? planId : Date.now().toString(), period, metric, goal: amount };
        await savePlans(kind === 'edit' ? plans.map((plan) => plan.id === planId ? updatedPlan : plan) : [...plans, updatedPlan]);
        router.back();
    };

    const remove = () => planId && Alert.alert(t('plan.delete.title'), t('plan.delete.warning'), [
        { text: t('common.actions.cancel'), style: 'cancel' },
        { text: t('common.actions.delete'), style: 'destructive', onPress: async () => { await savePlans(plans.filter((plan) => plan.id !== planId)); router.back(); } },
    ]);

    const styles = StyleSheet.create({
        content: { padding: 20, paddingBottom: 48 },
        intro: { color: theme.colors.tertiaryText, fontSize: 14, marginBottom: 18 },
        save: { backgroundColor: theme.colors.primary, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
        saveText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '800' },
        delete: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, marginTop: 14 },
        deleteText: { color: theme.colors.notification, fontWeight: '700' },
    });

    return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.intro}>{isBulk
                ? t(selectedIds.length === 1 ? 'plan.form.selected' : 'plan.form.selectedPlural', { count: selectedIds.length })
                : copyFrom ? t('plan.form.copiedIntro') : t('plan.form.defaultIntro')}</Text>
            <PlanFormFields
                month={month} year={year} metric={metric} goal={goal} isBulk={isBulk}
                bulkGoalMode={bulkGoalMode} bulkOperation={bulkOperation}
                onMonthChange={setMonth} onYearChange={setYear} onMetricChange={setMetric} onGoalChange={setGoal}
                onBulkGoalModeChange={setBulkGoalMode} onBulkOperationChange={setBulkOperation}
            />
            <Pressable style={styles.save} onPress={submit}>
                <Text style={styles.saveText}>{isBulk
                    ? t(selectedIds.length === 1 ? 'plan.form.update' : 'plan.form.updatePlural', { count: selectedIds.length })
                    : kind === 'edit' ? t('plan.form.saveChanges') : t('plan.form.createFor', { period: formatSelectedPeriod(month, year) })}</Text>
            </Pressable>
            {kind === 'edit' && <Pressable style={styles.delete} onPress={remove}>
                <FontAwesome5 name="trash-alt" size={16} color={theme.colors.notification} />
                <Text style={styles.deleteText}>{t('plan.form.deletePlan')}</Text>
            </Pressable>}
        </ScrollView>
    </KeyboardAvoidingView>;
}
