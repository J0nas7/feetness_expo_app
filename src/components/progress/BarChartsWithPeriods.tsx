import { MyTheme } from '@/types/theme';
import { ProgressPeriod } from '@/types/WorkoutDTO';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type BarMetric =
    | 'workouts'
    | 'distance'
    | 'duration'
    | 'goals'
    | 'pace';

interface BarChartsWithPeriodsProps {
    periods: ProgressPeriod[];
    periodType: "week" | "month"
}

export const BarChartsWithPeriods: React.FC<BarChartsWithPeriodsProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const [metric, setMetric] = React.useState<BarMetric>('workouts');

    const getMetricValue = (m: typeof props.periods[number]) => {
        switch (metric) {
            case 'workouts':
                return m.workouts.length;

            case 'distance':
                return m.workouts.reduce((s, w) => s + w.distance, 0) / 1000; // km

            case 'duration':
                return m.workouts.reduce((s, w) => s + w.elapsedTime, 0) / 60; // min

            case 'goals':
                return m.workouts.filter((w) => w.percentage >= 100).length;

            case 'pace': {
                if (m.workouts.length === 0) return 0;
                const avg =
                    m.workouts.reduce((s, w) => s + w.pace, 0) /
                    m.workouts.length;
                return Number(avg.toFixed(1));
            }
        }
    };

    const values = props.periods.map(getMetricValue);

    const maxBarValue = Math.max(...values, 1);

    const metricLabel: Record<BarMetric, string> = {
        workouts: 'Number of Workouts',
        distance: 'Total Distance (km)',
        duration: 'Total Duration (min)',
        goals: 'Goals Completed',
        pace: 'Average Pace (min/km)',
    };

    // Create a ref array for animated heights and labels
    const animatedHeights = useRef(
        props.periods.map(() => new Animated.Value(0))
    ).current;

    const animatedLabels = useRef(
        props.periods.map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        props.periods.slice().reverse().forEach((m, idx) => {
            const value = getMetricValue(m);
            const heightPercent = value === 0 ? 4 : (value / maxBarValue) * 100;

            // Animate height
            Animated.timing(animatedHeights[idx], {
                toValue: heightPercent,
                duration: 500,
                useNativeDriver: false,
            }).start();
        });
    }, [metric, maxBarValue, props.periodType]);

    useEffect(() => {
        props.periods.slice().reverse().forEach((m, idx) => {
            const value = getMetricValue(m);

            // Animate label counting
            Animated.timing(animatedLabels[idx], {
                toValue: value,
                duration: 500,
                useNativeDriver: false, // must be false for text
            }).start();
        });
    }, [metric, props.periodType]);

    const styles = StyleSheet.create({
        subtitle: {
            fontSize: 14,
            fontWeight: '800',
            marginBottom: 16,
            textAlign: 'center',
            color: theme.colors.secondaryText,
        },
        metricSelector: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 50,
            fontSize: 20,
        },
        metricIcon: {
            fontSize: 24,
            opacity: 0.5,
            marginHorizontal: 8,
        },

        metricIconActive: {
            opacity: 1,
            fontSize: 28,
            color: theme.colors.success, // green to match bars
        },
        chart: {
            height: 140,
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginBottom: 24,
        },
        barWrapper: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-end',
        },
        bar: {
            width: 18,
            backgroundColor: theme.colors.success,
            borderRadius: 6,
            boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.6)',
        },
        barLabel: {
            marginTop: 6,
            fontSize: 12,
            color: theme.colors.secondaryText,
        },
    })

    return (
        <>
            <View style={styles.metricSelector}>
                {(['workouts', 'distance', 'duration', 'goals', 'pace'] as BarMetric[]).map((m) => (
                    <Text
                        key={m}
                        onPress={() => setMetric(m)}
                        style={[
                            styles.metricIcon,
                            metric === m && styles.metricIconActive, // highlight selected
                        ]}
                    >
                        {{
                            workouts: '🏋️',
                            distance: '📏',
                            duration: '⏱',
                            goals: '🎯',
                            pace: '⚡',
                        }[m]}
                    </Text>
                ))}
            </View>

            <View style={styles.chart}>
                {props.periods
                    .slice()
                    .reverse()
                    .map((m, idx) => {
                        const count = getMetricValue(m);
                        const height = count === 0 ? 4 : (count / maxBarValue) * 100;

                        return (
                            <View key={idx} style={styles.barWrapper}>
                                <AnimatedNumber value={animatedLabels[idx]} decimals={metric === 'pace' ? 1 : 0} />

                                <Animated.View
                                    style={[
                                        styles.bar,
                                        {
                                            height: animatedHeights[idx].interpolate({
                                                inputRange: [0, 100],
                                                outputRange: ['0%', '100%'],
                                            }),
                                            opacity: getMetricValue(m) === 0 ? 0.3 : 1,
                                        },
                                    ]}
                                />

                                <Text style={styles.barLabel}>
                                    {m.week !== undefined
                                        ? `W${String(m.week).padStart(2, '0')}` // Week format
                                        : m.month !== undefined
                                            ? new Date(m.year, m.month).toLocaleString('default', { month: 'short' }) // Month format
                                            : ''}
                                </Text>
                            </View>
                        );
                    })
                }
            </View>

            <Text style={styles.subtitle}>
                {metricLabel[metric]}
            </Text>
        </>
    )
}

const AnimatedNumber: React.FC<{ value: Animated.Value; decimals?: number }> = ({ value, decimals = 0 }) => {
    const theme = useTheme() as MyTheme;
    const [display, setDisplay] = React.useState(0);

    React.useEffect(() => {
        const id = value.addListener(({ value }) => {
            setDisplay(Number(value.toFixed(decimals)));
        });
        return () => value.removeListener(id);
    }, [value]);

    const styles = StyleSheet.create({
        barValue: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 4,
            color: theme.colors.success,
        },
    })

    return <Text style={styles.barValue}>{display}</Text>;
};
