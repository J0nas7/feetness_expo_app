import { t } from '@/i18n';
import { Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { deriveSummaryMetrics, formatSummaryPace, formatSummaryTime } from './workoutSummaryAnalysis';

const Stat = ({ value, label, styles }: { value: string | number; label: string; styles: ReturnType<typeof createStyles> }) =>
    <View style={styles.item}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>;

const createStyles = (theme: MyTheme) => StyleSheet.create({
    container: { height: '40%', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, paddingVertical: 20, paddingHorizontal: 15, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 5, shadowColor: theme.colors.text, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    animatedGrid: { width: '100%' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', width: '100%' },
    item: { width: '30%', alignItems: 'center', paddingTop: 20, marginBottom: 20 },
    value: { fontSize: 18, fontWeight: 'bold', color: theme.colors.secondaryText },
    label: { fontSize: 14, color: theme.colors.tertiaryText },
    toggle: { position: 'absolute', right: 5, top: '50%', width: 36, height: 52, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
});

export function WorkoutSummaryStats({ workout }: { workout: Workout }) {
    const theme = useTheme() as MyTheme;
    const styles = createStyles(theme);
    const [secondary, setSecondary] = useState(false);
    const animation = useRef(new Animated.Value(1)).current;
    const metrics = deriveSummaryMetrics(workout);
    const toggle = () => Animated.timing(animation, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
        setSecondary((value) => !value);
        animation.setValue(0);
        Animated.timing(animation, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });

    return <View style={styles.container}>
        <Animated.View style={[styles.animatedGrid, { opacity: animation, transform: [{ translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [secondary ? 20 : -20, 0] }) }] }]}>
            <View style={styles.grid}>{secondary ? <>
                <Stat styles={styles} value={((workout.pausedDistance ?? 0) / 1000).toFixed(2)} label={t('exercise.pausedDistance')} />
                <Stat styles={styles} value={formatSummaryTime(workout.pausedTime ?? 0)} label={t('exercise.pausedTime')} />
                <Stat styles={styles} value="0" label={`bpm ${t('exercise.maximum')}`} />
                <Stat styles={styles} value={metrics.averageSpeed.toFixed(1)} label="km/h" />
                <Stat styles={styles} value={`${Math.round(metrics.maximumAltitude)} m`} label={`m ${t('exercise.altitude')}`} />
                <Stat styles={styles} value={metrics.kilometersPerMinute.toFixed(3)} label="km/m" />
            </> : <>
                <Stat styles={styles} value={(workout.distance / 1000).toFixed(2)} label="km" />
                <Stat styles={styles} value={formatSummaryTime(workout.elapsedTime)} label={t('exercise.time')} />
                <Stat styles={styles} value={formatSummaryPace(workout.pace)} label="min/km" />
                <Stat styles={styles} value="0" label={t('exercise.steps')} />
                <Stat styles={styles} value={Math.floor(workout.calories)} label="Kcal" />
                <Stat styles={styles} value="0" label="bpm" />
            </>}</View>
        </Animated.View>
        <Pressable style={styles.toggle} onPress={toggle} accessibilityRole="button" accessibilityLabel={secondary ? t('exercise.summaryStats.showPrimary') : t('exercise.summaryStats.showMore')}>
            <FontAwesome5 name="chevron-right" size={20} color={theme.colors.tertiaryText} />
        </Pressable>
    </View>;
}
