// StepCounterView.tsx
// DEMO VERSION – custom bar chart (no chart-kit, no HealthKit)

import { MyTheme } from '@/types/theme';
import { locale, t } from '@/i18n';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated as RNAnimated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const STEP_GOAL = 5000;

// ---------------- Demo Data ----------------
const demoStepsToday = 3842;
const demoDistanceKm = 2.97;
const demoFloors: number = 6;

// Past 7 days, excluding today (oldest → newest)
const demoWeeklySteps = [4200, 5100, 3100, 6100, 4800, 7200, 5600];

export default function StepCounterView() {
    const theme = useTheme() as MyTheme;
    const goalPercent = Math.min(demoStepsToday / STEP_GOAL, 1);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
        },
        steps: {
            flex: 5,
            color: theme.colors.text,
            fontSize: 36,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 24,
        },
        metrics: {
            flex: 1,
            marginBottom: 32,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        metric: {
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
        },
        metricIcon: {
            color: theme.colors.text,
            fontSize: 20,
        },
        metricValue: {
            color: theme.colors.text,
            fontSize: 20,
        },
    });

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                {/* Top: Animated Steps Circle */}
                <StepsCircle steps={demoStepsToday} goal={STEP_GOAL} />

                {/* Middle */}
                <View style={styles.metrics}>
                    <View style={styles.metric}>
                        <Text style={styles.metricIcon}>📍</Text>
                        <Text style={styles.metricValue}>{demoDistanceKm.toLocaleString(locale === 'da' ? 'da-DK' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={styles.metricIcon}>🏁</Text>
                        <Text style={styles.metricValue}>{(goalPercent * 100).toFixed(0)}%</Text>
                    </View>
                    <View style={styles.metric}>
                        <Text style={styles.metricIcon}>👣</Text>
                        <Text style={styles.metricValue}>{t(demoFloors === 1 ? 'steps.floor' : 'steps.floors', { count: demoFloors })}</Text>
                    </View>
                </View>

                {/* Bottom */}
                <StepsBarChart values={demoWeeklySteps} />
            </View>
        </SafeAreaView>
    );
}

/* ---------------- Steps Circle Component ---------------- */

interface StepsCircleProps {
    steps: number;
    goal: number;
}

const StepsCircle: React.FC<StepsCircleProps> = ({ steps, goal }) => {
    const theme = useTheme() as MyTheme;

    const radius = 100;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const animation = useRef(new RNAnimated.Value(0)).current;

    const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);

    useFocusEffect(
        React.useCallback(() => {
            animation.setValue(0);
            RNAnimated.timing(animation, {
                toValue: Math.min(steps / goal, 1),
                duration: 800,
                useNativeDriver: false,
            }).start();
        }, [animation, goal, steps])
    );


    const strokeDashoffset = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    const styles = StyleSheet.create({
        circleContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
        },
        circleText: {
            color: theme.colors.text,
            position: 'absolute',
            fontSize: 24,
            fontWeight: 'bold',
        },
    })

    return (
        <View style={styles.circleContainer}>
            <Svg height={radius * 2 + strokeWidth * 2} width={radius * 2 + strokeWidth * 2}>
                <Circle
                    stroke="#eee"
                    fill="transparent"
                    cx={radius + strokeWidth}
                    cy={radius + strokeWidth}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <AnimatedCircle
                    stroke="#4CAF50"
                    fill="transparent"
                    cx={radius + strokeWidth}
                    cy={radius + strokeWidth}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    originX={radius + strokeWidth}
                    originY={radius + strokeWidth}
                />
            </Svg>
            <Text style={styles.circleText}>
                {t(steps === 1 ? 'steps.step' : 'steps.steps', { count: steps.toLocaleString(locale === 'da' ? 'da-DK' : 'en-US') })}
            </Text>
        </View>
    );
};

/* ---------------- Custom Steps Bar Chart ---------------- */

const StepsBarChart: React.FC<{ values: number[] }> = ({ values }) => {
    const theme = useTheme() as MyTheme;
    const maxValue = Math.max(...values, 1);

    const animatedHeights = useRef(values.map(() => new RNAnimated.Value(0))).current;
    const animatedLabels = useRef(values.map(() => new RNAnimated.Value(0))).current;

    useFocusEffect(
        React.useCallback(() => {
            values.forEach((v, idx) => {
                const heightPercent = v === 0 ? 4 : (v / maxValue) * 100;

                RNAnimated.timing(animatedHeights[idx], {
                    toValue: heightPercent,
                    duration: 500,
                    useNativeDriver: false,
                }).start();

                RNAnimated.timing(animatedLabels[idx], {
                    toValue: v,
                    duration: 500,
                    useNativeDriver: false,
                }).start();
            });
        }, [animatedHeights, animatedLabels, maxValue, values])
    );

    const styles = StyleSheet.create({
        chartArea: {
            flex: 4,
        },
        chart: {
            height: "100%",
            flexDirection: 'row',
            alignItems: 'flex-end',
        },
        chartTitle: {
            color: theme.colors.text,
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 12,
        },
        barWrapper: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-end',
        },
        bar: {
            width: 18,
            backgroundColor: '#4CAF50',
            borderRadius: 6,
        },
        barLabel: {
            marginTop: 6,
            fontSize: 12,
            color: theme.colors.secondaryText,
        },
    })

    return (
        <View style={styles.chartArea}>
            <Text style={styles.chartTitle}>{t('steps.lastSevenDays')}</Text>
            <View style={styles.chart}>
                {values.map((v, idx) => (
                    <View key={idx} style={styles.barWrapper}>
                        <AnimatedNumber value={animatedLabels[idx]} />

                        <RNAnimated.View
                            style={[
                                styles.bar,
                                {
                                    height: animatedHeights[idx].interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ['0%', '100%'],
                                    }),
                                    opacity: v === 0 ? 0.3 : 1,
                                },
                            ]}
                        />

                        <Text style={styles.barLabel}>{t('steps.daysAgo', { count: 7 - idx })}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const AnimatedNumber: React.FC<{ value: RNAnimated.Value }> = ({ value }) => {
    const [display, setDisplay] = React.useState(0);

    useEffect(() => {
        const id = value.addListener(({ value }) => {
            setDisplay(Math.round(value));
        });
        return () => value.removeListener(id);
    }, [value]);

    const styles = StyleSheet.create({
        barValue: {
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 4,
            color: '#4CAF50',
        },
    })

    return <Text style={styles.barValue}>{display}</Text>;
};
