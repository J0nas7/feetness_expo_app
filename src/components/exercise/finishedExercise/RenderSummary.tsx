import { Workout } from '@/types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WorkoutSummaryControls } from './WorkoutSummaryControls';
import { WorkoutSummaryMap } from './WorkoutSummaryMap';
import { WorkoutSummaryStats } from './WorkoutSummaryStats';

type Tab = 'summary' | 'time' | 'media' | 'map';
interface RenderSummaryProps {
    workout: Workout;
    setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
}

export const RenderSummary = ({ workout, setActiveTab }: RenderSummaryProps) => {
    const styles = StyleSheet.create({ container: { flex: 1, flexDirection: 'column' } });
    return <View style={styles.container}>
        <WorkoutSummaryMap workout={workout} />
        <WorkoutSummaryStats workout={workout} />
        <WorkoutSummaryControls workout={workout} setActiveTab={setActiveTab} />
    </View>;
};
