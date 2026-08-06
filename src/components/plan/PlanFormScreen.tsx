import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { PlanFormFields } from './PlanFormFields';
import { BulkGoalMode, BulkOperation, calculateBulkGoal, Metric, nextAvailablePeriod, now, PERIOD_PATTERN, Plan } from './model';
import { loadPlans, savePlans } from './storage';

type Props = { kind: 'create' | 'edit' | 'bulk'; planId?: string; copyFrom?: string; selectedIds?: string[] };

export function PlanFormScreen({ kind, planId, copyFrom, selectedIds = [] }: Props) {
    const theme = useTheme() as MyTheme;
    const [plans, setPlans] = useState<Plan[]>([]);
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [metric, setMetric] = useState<Metric>('distance');
    const [goal, setGoal] = useState('');
    const [bulkGoalMode, setBulkGoalMode] = useState<BulkGoalMode>('assign');
    const [bulkOperation, setBulkOperation] = useState<BulkOperation>('add');
    const isBulk = kind === 'bulk';

    useEffect(() => {
        loadPlans().then((storedPlans) => {
            setPlans(storedPlans);
            const source = storedPlans.find((plan) => plan.id === (kind === 'edit' ? planId : copyFrom));
            if (!source) return;
            const period = kind === 'create' ? nextAvailablePeriod(source.period, storedPlans) : (() => {
                const match = PERIOD_PATTERN.exec(source.period);
                return match ? { month: Number(match[1]), year: Number(match[2]) } : { month: now.getMonth() + 1, year: now.getFullYear() };
            })();
            setMonth(period.month);
            setYear(period.year);
            setMetric(source.metric);
            setGoal(String(source.goal));
        });
    }, [copyFrom, kind, planId]);

    const submit = async () => {
        const amount = Number(goal.replace(',', '.'));
        if (!goal.trim() || !Number.isFinite(amount) || amount <= 0) {
            Alert.alert('Ugyldigt mål', 'Indtast et tal, der er større end 0.');
            return;
        }

        if (isBulk) {
            const ids = new Set(selectedIds);
            const nextGoal = (plan: Plan) => calculateBulkGoal(plan.goal, amount, bulkGoalMode, bulkOperation);
            if (plans.some((plan) => ids.has(plan.id) && nextGoal(plan) <= 0)) {
                Alert.alert('Ugyldigt resultat', 'Ændringen ville give mindst én plan et mål på 0 eller mindre.');
                return;
            }
            await savePlans(plans.map((plan) => ids.has(plan.id) ? { ...plan, metric, goal: Number(nextGoal(plan).toFixed(2)) } : plan));
            router.back();
            return;
        }

        const period = `${String(month).padStart(2, '0')}-${year}`;
        if (plans.some((plan) => plan.period === period && plan.id !== planId)) {
            Alert.alert('Planen findes allerede', `Der er allerede en plan for ${period}.`);
            return;
        }
        const updatedPlan: Plan = { id: kind === 'edit' && planId ? planId : Date.now().toString(), period, metric, goal: amount };
        await savePlans(kind === 'edit' ? plans.map((plan) => plan.id === planId ? updatedPlan : plan) : [...plans, updatedPlan]);
        router.back();
    };

    const remove = () => planId && Alert.alert('Slet plan?', 'Handlingen kan ikke fortrydes.', [
        { text: 'Annuller', style: 'cancel' },
        { text: 'Slet', style: 'destructive', onPress: async () => { await savePlans(plans.filter((plan) => plan.id !== planId)); router.back(); } },
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
            <Text style={styles.intro}>{isBulk ? `${selectedIds.length} planer valgt` : copyFrom ? 'Mål og måleenhed er kopieret. Vælg måned for den nye plan.' : 'Vælg måned, måleenhed og mål.'}</Text>
            <PlanFormFields
                month={month} year={year} metric={metric} goal={goal} isBulk={isBulk}
                bulkGoalMode={bulkGoalMode} bulkOperation={bulkOperation}
                onMonthChange={setMonth} onYearChange={setYear} onMetricChange={setMetric} onGoalChange={setGoal}
                onBulkGoalModeChange={setBulkGoalMode} onBulkOperationChange={setBulkOperation}
            />
            <Pressable style={styles.save} onPress={submit}>
                <Text style={styles.saveText}>{isBulk ? `Opdater ${selectedIds.length} planer` : kind === 'edit' ? 'Gem ændringer' : `Opret plan for ${String(month).padStart(2, '0')}-${year}`}</Text>
            </Pressable>
            {kind === 'edit' && <Pressable style={styles.delete} onPress={remove}>
                <FontAwesome5 name="trash-alt" size={16} color={theme.colors.notification} />
                <Text style={styles.deleteText}>Slet plan</Text>
            </Pressable>}
        </ScrollView>
    </KeyboardAvoidingView>;
}
