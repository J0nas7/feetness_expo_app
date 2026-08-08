import { activityName, t } from '@/i18n';
import { useWorkouts } from '@/hooks/useWorkouts';
import { ExerciseType, GoalMetric, Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const activities: ExerciseType[] = ['running', 'cycling', 'walking'];

const pad = (value: number) => String(value).padStart(2, '0');
const dateParts = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
        date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
};

const parseNumber = (value: string) => Number(value.trim().replace(',', '.'));

type WorkoutFormProps = { mode?: 'create' | 'edit' | 'bulk'; workout?: Workout; selectedIds?: number[] };

export function EditWorkoutScreen({ mode = 'edit', workout, selectedIds = [] }: WorkoutFormProps) {
    const theme = useTheme() as MyTheme;
    const { bulkUpdateWorkouts, updateWorkout } = useWorkouts();
    const isBulk = mode === 'bulk';
    const source = useMemo<Workout>(() => workout ?? ({
        id: Date.now(),
        exercise: 'running',
        goalAmount: 5,
        goalMetric: 'distance',
        percentage: 0,
        startTime: Date.now(),
        endTime: Date.now(),
        distance: 0,
        elapsedTime: 30 * 60,
        calories: 0,
        pace: 0,
        path: [],
        segments: [],
    }), [workout]);
    const initialDate = useMemo(() => dateParts(source.startTime), [source.startTime]);
    const [exercise, setExercise] = useState(source.exercise);
    const [date, setDate] = useState(initialDate.date);
    const [time, setTime] = useState(initialDate.time);
    const [distance, setDistance] = useState(String(Number((source.distance / 1000).toFixed(2))));
    const [duration, setDuration] = useState(String(Number((source.elapsedTime / 60).toFixed(1))));
    const [calories, setCalories] = useState(String(Math.round(source.calories)));
    const [goalMetric, setGoalMetric] = useState<GoalMetric>(source.goalMetric);
    const [goalAmount, setGoalAmount] = useState(String(source.goalAmount));
    const [saving, setSaving] = useState(false);
    const [changeActivity, setChangeActivity] = useState(false);
    const [changeGoal, setChangeGoal] = useState(false);

    const styles = StyleSheet.create({
        content: { padding: 20, paddingBottom: 110, gap: 16 },
        hero: { padding: 18, borderRadius: 18, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
        heroTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
        heroText: { color: theme.colors.tertiaryText, fontSize: 14, lineHeight: 20, marginTop: 5 },
        section: { padding: 16, borderRadius: 18, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
        sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 13 },
        segmented: { flexDirection: 'row', gap: 8 },
        segment: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 6 },
        segmentActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
        segmentText: { color: theme.colors.text, fontWeight: '700' },
        segmentTextActive: { color: theme.colors.onPrimary },
        row: { flexDirection: 'row', gap: 12 },
        field: { flex: 1 },
        label: { color: theme.colors.tertiaryText, fontSize: 12, fontWeight: '700', marginBottom: 6 },
        inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 13, paddingHorizontal: 12 },
        input: { flex: 1, color: theme.colors.text, fontSize: 17, paddingVertical: 12 },
        unit: { color: theme.colors.tertiaryText, fontWeight: '700' },
        hint: { color: theme.colors.tertiaryText, fontSize: 12, marginTop: 8 },
        sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
        sectionHeaderTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
        applyToggle: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.primary },
        applyToggleActive: { backgroundColor: theme.colors.primary },
        applyToggleText: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
        applyToggleTextActive: { color: theme.colors.onPrimary },
        disabledFields: { opacity: 0.4 },
        save: {
            position: 'absolute',
            right: 20,
            bottom: 20,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: saving ? 0.6 : 1,
            elevation: 6,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
        },
    });

    const field = (label: string, value: string, onChangeText: (value: string) => void, unit?: string, keyboardType: 'decimal-pad' | 'default' = 'decimal-pad') => (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputRow}>
                <TextInput style={styles.input} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholderTextColor={theme.colors.tertiaryText} />
                {unit && <Text style={styles.unit}>{unit}</Text>}
            </View>
        </View>
    );

    const save = async () => {
        if (isBulk) {
            const goal = parseNumber(goalAmount);
            if (!changeActivity && !changeGoal) {
                Alert.alert(t('exercise.editWorkout.bulkNothingTitle'), t('exercise.editWorkout.bulkNothingMessage'));
                return;
            }
            if (changeGoal && (!Number.isFinite(goal) || goal <= 0)) {
                Alert.alert(t('exercise.editWorkout.invalidTitle'), t('exercise.editWorkout.bulkInvalidMessage'));
                return;
            }

            setSaving(true);
            try {
                await bulkUpdateWorkouts({
                    workoutIds: selectedIds,
                    exercise: changeActivity ? exercise : undefined,
                    goal: changeGoal ? { metric: goalMetric, amount: goal } : undefined,
                });
                router.back();
            } catch {
                Alert.alert(t('exercise.editWorkout.saveErrorTitle'), t('exercise.editWorkout.saveErrorMessage'));
                setSaving(false);
            }
            return;
        }

        const distanceKm = parseNumber(distance);
        const durationMinutes = parseNumber(duration);
        const calorieAmount = parseNumber(calories);
        const goal = parseNumber(goalAmount);
        const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
        const timeMatch = /^(\d{2}):(\d{2})$/.exec(time.trim());
        const start = dateMatch && timeMatch
            ? new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]), Number(timeMatch[1]), Number(timeMatch[2]))
            : null;
        const validDate = start && !Number.isNaN(start.getTime())
            && start.getFullYear() === Number(dateMatch?.[1])
            && start.getMonth() === Number(dateMatch?.[2]) - 1
            && start.getDate() === Number(dateMatch?.[3])
            && Number(timeMatch?.[1]) < 24 && Number(timeMatch?.[2]) < 60;

        if (!validDate || !Number.isFinite(distanceKm) || distanceKm < 0 || !Number.isFinite(durationMinutes) || durationMinutes <= 0 || !Number.isFinite(calorieAmount) || calorieAmount < 0 || !Number.isFinite(goal) || goal <= 0) {
            Alert.alert(t('exercise.editWorkout.invalidTitle'), t('exercise.editWorkout.invalidMessage'));
            return;
        }

        setSaving(true);
        const elapsedTime = Math.round(durationMinutes * 60);
        const distanceMeters = distanceKm * 1000;
        const completed = goalMetric === 'distance' ? distanceKm : durationMinutes;
        const updated: Workout = {
            ...source,
            exercise,
            startTime: start.getTime(),
            endTime: start.getTime() + elapsedTime * 1000,
            distance: distanceMeters,
            elapsedTime,
            calories: calorieAmount,
            pace: distanceKm > 0 ? durationMinutes / distanceKm : 0,
            goalMetric,
            goalAmount: goal,
            percentage: completed / goal * 100,
        };

        try {
            await updateWorkout(updated);
            router.back();
        } catch {
            Alert.alert(t('exercise.editWorkout.saveErrorTitle'), t('exercise.editWorkout.saveErrorMessage'));
            setSaving(false);
        }
    };

    return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.hero}>
                <Text style={styles.heroTitle}>{t(isBulk ? 'exercise.editWorkout.bulkTitle' : mode === 'create' ? 'exercise.createWorkout.title' : 'exercise.editWorkout.title', { count: selectedIds.length })}</Text>
                <Text style={styles.heroText}>{t(isBulk ? 'exercise.editWorkout.bulkIntro' : mode === 'create' ? 'exercise.createWorkout.intro' : 'exercise.editWorkout.intro')}</Text>
            </View>

            <View style={styles.section}>
                {isBulk ? <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderTitle}>{t('exercise.editWorkout.activity')}</Text>
                    <Pressable style={[styles.applyToggle, changeActivity && styles.applyToggleActive]} onPress={() => setChangeActivity((value) => !value)}>
                        <Text style={[styles.applyToggleText, changeActivity && styles.applyToggleTextActive]}>{t(changeActivity ? 'exercise.editWorkout.applying' : 'exercise.editWorkout.keepUnchanged')}</Text>
                    </Pressable>
                </View> : <Text style={styles.sectionTitle}>{t('exercise.editWorkout.activity')}</Text>}
                <View style={[styles.segmented, isBulk && !changeActivity && styles.disabledFields]} pointerEvents={isBulk && !changeActivity ? 'none' : 'auto'}>{activities.map((value) => {
                    const selected = exercise === value;
                    return <Pressable key={value} style={[styles.segment, selected && styles.segmentActive]} onPress={() => setExercise(value)}>
                        <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{activityName(value)}</Text>
                    </Pressable>;
                })}</View>
            </View>

            {!isBulk && <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('exercise.editWorkout.when')}</Text>
                <View style={styles.row}>
                    {field(t('exercise.editWorkout.date'), date, setDate, undefined, 'default')}
                    {field(t('exercise.editWorkout.time'), time, setTime, undefined, 'default')}
                </View>
                <Text style={styles.hint}>{t('exercise.editWorkout.dateHint')}</Text>
            </View>}

            {!isBulk && <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('exercise.editWorkout.results')}</Text>
                <View style={styles.row}>
                    {field(t('start.distance'), distance, setDistance, 'km')}
                    {field(t('start.duration'), duration, setDuration, 'min')}
                </View>
                <View style={{ marginTop: 12 }}>{field(t('exercise.editWorkout.calories'), calories, setCalories, 'kcal')}</View>
            </View>}

            <View style={styles.section}>
                {isBulk ? <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderTitle}>{t('exercise.editWorkout.goal')}</Text>
                    <Pressable style={[styles.applyToggle, changeGoal && styles.applyToggleActive]} onPress={() => setChangeGoal((value) => !value)}>
                        <Text style={[styles.applyToggleText, changeGoal && styles.applyToggleTextActive]}>{t(changeGoal ? 'exercise.editWorkout.applying' : 'exercise.editWorkout.keepUnchanged')}</Text>
                    </Pressable>
                </View> : <Text style={styles.sectionTitle}>{t('exercise.editWorkout.goal')}</Text>}
                <View style={isBulk && !changeGoal && styles.disabledFields} pointerEvents={isBulk && !changeGoal ? 'none' : 'auto'}>
                <View style={styles.segmented}>{(['distance', 'duration'] as GoalMetric[]).map((value) => {
                    const selected = goalMetric === value;
                    return <Pressable key={value} style={[styles.segment, selected && styles.segmentActive]} onPress={() => setGoalMetric(value)}>
                        <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{t(value === 'distance' ? 'start.distance' : 'start.duration')}</Text>
                    </Pressable>;
                })}</View>
                <View style={{ marginTop: 12 }}>{field(t('exercise.editWorkout.goalAmount'), goalAmount, setGoalAmount, goalMetric === 'distance' ? 'km' : 'min')}</View>
                </View>
            </View>

        </ScrollView>
        <Pressable
            style={styles.save}
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saving ? t('exercise.editWorkout.saving') : t(isBulk ? 'exercise.editWorkout.bulkSave' : mode === 'create' ? 'exercise.createWorkout.save' : 'exercise.editWorkout.save')}
            accessibilityState={{ disabled: saving }}
        >
            <FontAwesome5 name={saving ? 'hourglass-half' : 'check'} size={22} color={theme.colors.onPrimary} />
        </Pressable>
    </KeyboardAvoidingView>;
}
