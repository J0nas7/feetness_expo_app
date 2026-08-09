import { createStyles } from '@/components/exercise/exercise/CreateStyles';
import { GoalProgress } from '@/components/exercise/GoalProgress';
import { t } from '@/i18n';
import { Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Tab = 'summary' | 'time' | 'media' | 'map';
export function WorkoutSummaryControls({ workout, setActiveTab }: { workout: Workout; setActiveTab: React.Dispatch<React.SetStateAction<Tab>> }) {
    const theme = useTheme() as MyTheme;
    const shared = createStyles(theme);
    const styles = StyleSheet.create({ goal: { position: 'absolute', top: '60%', left: '50%', transform: [{ translateX: -70 }, { translateY: -70 }], zIndex: 10, elevation: 10 } });
    return <>
        <Pressable style={[shared.goalSibling, shared.mapButton]} onPress={() => setActiveTab('map')} accessibilityRole="button" accessibilityLabel={t('exercise.openMap')}>
            <FontAwesome5 name="expand-arrows-alt" size={22} color={theme.colors.onPrimary} />
        </Pressable>
        <View style={styles.goal}><GoalProgress percentage={workout.percentage} goalAmount={workout.goalAmount} goalMetric={workout.goalMetric} /></View>
        <Pressable style={[shared.goalSibling, shared.muteButton]} onPress={() => router.push({ pathname: '/edit-workout', params: { workout: JSON.stringify(workout) } })} accessibilityRole="button" accessibilityLabel={t('exercise.editWorkout.navigationTitle')}>
            <FontAwesome5 name="pencil-alt" size={20} color={theme.colors.onPrimary} />
        </Pressable>
    </>;
}
