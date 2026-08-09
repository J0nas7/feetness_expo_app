import { Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ElevationProfile } from './ElevationProfile';
import { GroupedPaceChart } from './GroupedPaceChart';
import { analyzeElevation, groupWorkoutPace } from './workoutTimeAnalysis';
import { WorkoutTimeHeader } from './WorkoutTimeHeader';

export const RenderTime = ({ workout }: { workout: Workout }) => {
    const theme = useTheme() as MyTheme;
    const groupedPace = useMemo(() => groupWorkoutPace(workout), [workout]);
    const elevation = useMemo(() => analyzeElevation(workout), [workout]);
    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        content: { padding: 20, paddingBottom: 40 },
    });

    return <ScrollView style={styles.container}>
        <View style={styles.content}>
            <WorkoutTimeHeader elapsedTime={workout.elapsedTime} groups={groupedPace} />
            <GroupedPaceChart groups={groupedPace} />
            <ElevationProfile analysis={elevation} />
        </View>
    </ScrollView>;
};
