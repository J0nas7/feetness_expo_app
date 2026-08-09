import { MyTheme } from '@/types/theme';
import { t } from '@/i18n';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { ElevationAnalysis } from './workoutTimeAnalysis';

const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;

export function ElevationProfile({ analysis }: { analysis: ElevationAnalysis }) {
    const theme = useTheme() as MyTheme;
    const { altitudeData, ascent, descent, minAltitude, maxAltitude } = analysis;
    const points = altitudeData.map((altitude, index) => {
        const x = (index / (altitudeData.length - 1 || 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - ((altitude - minAltitude) / (maxAltitude - minAltitude || 1)) * (CHART_HEIGHT - 20);
        return `${x},${y}`;
    }).join(' ');
    const styles = StyleSheet.create({
        title: { fontSize: 16, fontWeight: '600', color: theme.colors.secondaryText, marginTop: 30, marginBottom: 12 },
        description: { color: theme.colors.tertiaryText, fontSize: 13, marginBottom: 10 },
        footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
        axis: { fontSize: 11, color: theme.colors.tertiaryText },
        legend: { flexDirection: 'row', marginTop: 12, gap: 12 },
        legendText: { fontSize: 12, color: theme.colors.secondaryText },
    });
    return <>
        <Text style={styles.title}>{t('exercise.timeSummary.elevationProfile')}</Text>
        <Text style={styles.description}>{t('exercise.timeSummary.elevationDescription')}</Text>
        <Svg height={CHART_HEIGHT} width="100%"><Polyline points={points} fill="rgba(142, 68, 173, 0.15)" stroke="#8e44ad" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" /></Svg>
        <View style={styles.footer}>
            <Text style={styles.axis}>{t('exercise.timeSummary.minimumAltitude', { altitude: Math.round(minAltitude) })}</Text>
            <Text style={styles.axis}>{t('exercise.timeSummary.maximumAltitude', { altitude: Math.round(maxAltitude) })}</Text>
        </View>
        <View style={styles.legend}>
            <Text style={styles.legendText}>⬆️ {Math.round(ascent)} m</Text>
            <Text style={styles.legendText}>⬇️ {Math.round(descent)} m</Text>
        </View>
    </>;
}
