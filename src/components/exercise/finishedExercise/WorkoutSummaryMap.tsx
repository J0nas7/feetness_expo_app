import { t } from '@/i18n';
import { Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { paceLegend, summaryPaceColor } from './workoutSummaryAnalysis';

export function WorkoutSummaryMap({ workout }: { workout: Workout }) {
    const theme = useTheme() as MyTheme;
    const mapRef = useRef<MapView>(null);
    const legend = paceLegend(workout.exercise);
    const start = workout.path[0];
    const end = workout.path[workout.path.length - 1];
    const styles = StyleSheet.create({
        container: { height: '60%', position: 'relative' },
        legends: { position: 'absolute', marginTop: 10, zIndex: 10, flexDirection: 'row', justifyContent: 'space-evenly', width: '100%' },
        legend: { width: '30%', alignItems: 'center', backgroundColor: theme.colors.background, padding: 5, borderRadius: 10 },
        legendText: { fontSize: 12 },
        map: { width: '100%', height: '100%', backgroundColor: theme.colors.border },
        gradient: { position: 'absolute', bottom: 0, height: 150, width: '100%' },
    });
    return <View style={styles.container}>
        <View style={styles.legends}>{legend.map((item) => <View key={item.label} style={styles.legend}><Text style={[styles.legendText, { color: item.color }]}>{item.label}</Text></View>)}</View>
        <MapView ref={mapRef} style={styles.map} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false} toolbarEnabled={false}
            onMapReady={() => workout.path.length > 1 && mapRef.current?.fitToCoordinates(workout.path, { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true })}>
            {workout.segments.map((segment, index) => <Polyline key={index} coordinates={segment.coords} strokeColor={summaryPaceColor(workout.exercise, segment.pace)} strokeWidth={4} />)}
            {start && <Marker coordinate={start} title={t('common.actions.start')} pinColor="green" />}
            {end && <Marker coordinate={end} title={t('exercise.finish')} pinColor="red" />}
        </MapView>
        <LinearGradient colors={['transparent', theme.colors.background]} style={styles.gradient} locations={[0, 1]} pointerEvents="none" />
    </View>;
}
