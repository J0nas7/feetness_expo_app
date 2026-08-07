import { activityName, t } from '@/i18n';
import { ExerciseType, GoalMetric, Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const STORAGE_KEY = 'workouts';
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

export function EditWorkoutScreen({ workout }: { workout: Workout }) {
    const theme = useTheme() as MyTheme;
    const initialDate = useMemo(() => dateParts(workout.startTime), [workout.startTime]);
    const [exercise, setExercise] = useState(workout.exercise);
    const [date, setDate] = useState(initialDate.date);
    const [time, setTime] = useState(initialDate.time);
    const [distance, setDistance] = useState(String(Number((workout.distance / 1000).toFixed(2))));
    const [duration, setDuration] = useState(String(Number((workout.elapsedTime / 60).toFixed(1))));
    const [calories, setCalories] = useState(String(Math.round(workout.calories)));
    const [goalMetric, setGoalMetric] = useState<GoalMetric>(workout.goalMetric);
    const [goalAmount, setGoalAmount] = useState(String(workout.goalAmount));
    const [saving, setSaving] = useState(false);

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
            ...workout,
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
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            const workouts: Workout[] = stored ? JSON.parse(stored) : [];
            const exists = workouts.some((item) => item.id === workout.id);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(exists
                ? workouts.map((item) => item.id === workout.id ? updated : item)
                : [...workouts, updated]));
            router.back();
        } catch {
            Alert.alert(t('exercise.editWorkout.saveErrorTitle'), t('exercise.editWorkout.saveErrorMessage'));
            setSaving(false);
        }
    };

    return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.hero}>
                <Text style={styles.heroTitle}>{t('exercise.editWorkout.title')}</Text>
                <Text style={styles.heroText}>{t('exercise.editWorkout.intro')}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('exercise.editWorkout.activity')}</Text>
                <View style={styles.segmented}>{activities.map((value) => {
                    const selected = exercise === value;
                    return <Pressable key={value} style={[styles.segment, selected && styles.segmentActive]} onPress={() => setExercise(value)}>
                        <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{activityName(value)}</Text>
                    </Pressable>;
                })}</View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('exercise.editWorkout.when')}</Text>
                <View style={styles.row}>
                    {field(t('exercise.editWorkout.date'), date, setDate, undefined, 'default')}
                    {field(t('exercise.editWorkout.time'), time, setTime, undefined, 'default')}
                </View>
                <Text style={styles.hint}>{t('exercise.editWorkout.dateHint')}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('exercise.editWorkout.results')}</Text>
                <View style={styles.row}>
                    {field(t('start.distance'), distance, setDistance, 'km')}
                    {field(t('start.duration'), duration, setDuration, 'min')}
                </View>
                <View style={{ marginTop: 12 }}>{field(t('exercise.editWorkout.calories'), calories, setCalories, 'kcal')}</View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('exercise.editWorkout.goal')}</Text>
                <View style={styles.segmented}>{(['distance', 'duration'] as GoalMetric[]).map((value) => {
                    const selected = goalMetric === value;
                    return <Pressable key={value} style={[styles.segment, selected && styles.segmentActive]} onPress={() => setGoalMetric(value)}>
                        <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{t(value === 'distance' ? 'start.distance' : 'start.duration')}</Text>
                    </Pressable>;
                })}</View>
                <View style={{ marginTop: 12 }}>{field(t('exercise.editWorkout.goalAmount'), goalAmount, setGoalAmount, goalMetric === 'distance' ? 'km' : 'min')}</View>
            </View>

        </ScrollView>
        <Pressable
            style={styles.save}
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saving ? t('exercise.editWorkout.saving') : t('exercise.editWorkout.save')}
            accessibilityState={{ disabled: saving }}
        >
            <FontAwesome5 name={saving ? 'hourglass-half' : 'check'} size={22} color={theme.colors.onPrimary} />
        </Pressable>
    </KeyboardAvoidingView>;
}
