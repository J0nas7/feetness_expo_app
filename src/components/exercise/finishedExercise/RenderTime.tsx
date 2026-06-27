import { Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

type GroupedSegment = {
    pace: number;
    count: number;
    avgPace: number;
    km: number;
};

const GROUP_SECONDS = 60;

export const RenderTime = ({ workout }: { workout: Workout }) => {
    const theme = useTheme() as MyTheme;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        return h > 0
            ? `${pad(h)}:${pad(m)}:${pad(s)}`
            : `${pad(m)}:${pad(s)}`;
    };

    const formatPace = (pace: number) =>
        pace > 0
            ? `${Math.floor(pace)}:${pad(Math.floor((pace % 1) * 60))}`
            : '-';

    const paceToColor = (pace: number) => {
        if (!pace || !isFinite(pace)) return "#95a5a6";
        if (pace < 5.5) return "#2ecc71"; // fast (<5:30 min/km) → green
        if (pace < 6.5) return "#f1c40f"; // moderate (5:30–6:30 min/km) → yellow
        return "#e74c3c"; // slow (>6:30 min/km) → red
    };

    /**
     * 🧠 GROUPING LOGIC
     * We assume each segment ≈ small time slice.
     * We group by index into fixed buckets.
     */
    const groupedSegments: GroupedSegment[] = useMemo(() => {
        const groups: GroupedSegment[] = [];

        const chunkSize = Math.max(
            1,
            Math.floor(workout.segments.length / (workout.elapsedTime / GROUP_SECONDS))
        );

        let distanceSoFar = 0;
        let kmCounter = 0;

        for (let i = 0; i < workout.segments.length; i += chunkSize) {
            const slice = workout.segments.slice(i, i + chunkSize);

            const avgPace =
                slice.reduce((sum, s) => sum + (s.pace || 0), 0) / slice.length;

            const segDistance = slice.reduce((sum, s) => sum + (s.coords?.length || 0), 0);

            distanceSoFar += segDistance;

            const km = distanceSoFar / 1000;

            groups.push({
                pace: avgPace,
                avgPace,
                count: slice.length,
                km,
            });
        }

        return groups;
    }, [workout.segments, workout.elapsedTime]);

    // 🏆 fastest group
    const fastestGroup = groupedSegments.reduce((best, curr) =>
        curr.avgPace < best.avgPace ? curr : best,
        groupedSegments[0]
    );

    /**
     * 🧠 ALTITUDE DATA
     * We extract altitude data from the workout segments for
     * visualizations and analysis of elevation changes during the workout.
     */
    const altitudeData = useMemo(() => {
        return workout.segments
            .flatMap(segment => segment.coords)
            .filter(coord => coord.altitude != null)
            .map(coord => coord.altitude as number);
    }, [workout.segments]);

    const minAltitude = Math.min(...altitudeData);
    const maxAltitude = Math.max(...altitudeData);

    let ascent = 0;
    let descent = 0;

    for (let i = 1; i < altitudeData.length; i++) {
        const diff = altitudeData[i] - altitudeData[i - 1];

        if (diff > 0) ascent += diff;
        else descent += Math.abs(diff);
    }

    // 📊 animations
    const animations = useRef(
        groupedSegments.map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        Animated.stagger(
            60,
            animations.map(anim =>
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: false,
                })
            )
        ).start();
    }, []);

    const maxPace = Math.max(...groupedSegments.map(s => s.avgPace || 1));

    const cumulativeData = groupedSegments.map((_, index) => {
        return groupedSegments
            .slice(0, index + 1)
            .reduce((sum, g) => sum + g.avgPace * GROUP_SECONDS * 60, 0);
    });

    const cumulativePoints = cumulativeData
        .map((val, i) => {
            const x = (i / (cumulativeData.length - 1 || 1)) * chartWidth;

            const y =
                chartHeight -
                (val / maxCumulative) * (chartHeight - 20);

            return `${x},${y}`;
        })
        .join(' ');

    const maxCumulative = Math.max(...cumulativeData, 1);

    const chartWidth = 320;
    const chartHeight = 120;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },

        content: {
            padding: 20,
            paddingBottom: 40,
        },

        hero: {
            alignItems: 'center',
            marginBottom: 10,
        },

        heroTime: {
            fontSize: 42,
            fontWeight: 'bold',
            color: theme.colors.text,
        },

        heroLabel: {
            fontSize: 14,
            color: theme.colors.tertiaryText,
            marginTop: 4,
        },

        badge: {
            alignSelf: 'center',
            marginTop: 10,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
        },

        badgeText: {
            color: theme.colors.secondaryText,
            fontSize: 13,
            fontWeight: '600',
        },

        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.secondaryText,
            marginTop: 30,
            marginBottom: 12,
        },

        row: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },

        label: {
            width: 40,
            color: theme.colors.tertiaryText,
        },

        barWrap: {
            flex: 1,
            height: 10,
            backgroundColor: theme.colors.border,
            borderRadius: 6,
            overflow: 'hidden',
            marginHorizontal: 10,
        },

        bar: {
            height: '100%',
            borderRadius: 6,
        },

        value: {
            width: 60,
            textAlign: 'right',
            color: theme.colors.secondaryText,
        },
        chartDescription: {
            color: theme.colors.tertiaryText,
            fontSize: 13,
            marginBottom: 10,
        },

        axisRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
        },

        axisLabel: {
            fontSize: 11,
            color: theme.colors.tertiaryText,
        },

        axisFooterRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 6,
        },

        legendContainer: {
            flexDirection: 'row',
            marginTop: 12,
            flexWrap: 'wrap',
            gap: 12,
        },

        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },

        legendColor: {
            width: 10,
            height: 10,
            borderRadius: 2,
        },

        legendText: {
            fontSize: 12,
            color: theme.colors.secondaryText,
        },
    });

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>

                {/* HERO */}
                <View style={styles.hero}>
                    <Text style={styles.heroTime}>
                        {formatTime(workout.elapsedTime)}
                    </Text>
                    <Text style={styles.heroLabel}>
                        Total Time • {groupedSegments.length} blocks
                    </Text>
                </View>

                {/* FASTEST */}
                {fastestGroup && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            🏆 Fastest block: {formatPace(fastestGroup.avgPace)} min/km
                        </Text>
                    </View>
                )}

                {/* GROUPED SEGMENTS */}
                <Text style={styles.sectionTitle}>Pace (grouped)</Text>

                {groupedSegments.map((seg, i) => {
                    const prevKm = groupedSegments[i - 1]?.km ?? 0;
                    const currentKm = Math.floor(seg.km);
                    const showKmMilestone = currentKm > Math.floor(prevKm);

                    /*{
                        showKmMilestone && currentKm > 0 && (
                            <View style={{ marginVertical: 6 }}>
                                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                                    🏁 {currentKm} km reached
                                </Text>
                            </View>
                        )
                    }*/

                    return (
                        <View key={i} style={styles.row}>
                            <Text style={styles.label}>'{i + 1}</Text>

                            <View style={styles.barWrap}>
                                <Animated.View
                                    style={[
                                        styles.bar,
                                        {
                                            width: animations[i].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [
                                                    '0%',
                                                    `${(seg.avgPace / maxPace) * 100}%`,
                                                ],
                                            }),
                                            backgroundColor: paceToColor(seg.avgPace),
                                        },
                                    ]}
                                />
                            </View>

                            <Text style={styles.value}>
                                {formatPace(seg.avgPace)}
                            </Text>
                        </View>
                    )
                })}

                {/* 📈 CUMULATIVE */}
                <Text style={styles.sectionTitle}>Progress Over Time</Text>

                <Text style={styles.chartDescription}>
                    This shows how your effort accumulated during the workout.
                    Steeper line = slower pace, flatter = faster segments.
                </Text>

                <View style={styles.axisRow}>
                    <Text style={styles.axisLabel}>Start</Text>
                    <Text style={styles.axisLabel}>Finish</Text>
                </View>

                <Svg height={chartHeight} width="100%">
                    <Polyline
                        points={cumulativeData
                            .map((val, i) => {
                                const x =
                                    (i /
                                        (cumulativeData.length - 1 || 1)) *
                                    chartWidth;

                                const y =
                                    chartHeight -
                                    (val / maxCumulative) * (chartHeight - 20);

                                return `${x},${y}`;
                            })
                            .join(' ')
                        }
                        fill="none"
                        stroke={theme.colors.primary}
                        strokeWidth="3"
                    />

                    {/* Start marker */}
                    <Polyline
                        points={`0,${chartHeight} 0,${chartHeight}`}
                        stroke={theme.colors.success}
                        strokeWidth="6"
                    />

                    {/* End marker */}
                    <Polyline
                        points={`${chartWidth},0 ${chartWidth},0`}
                        stroke={theme.colors.notification}
                        strokeWidth="6"
                    />
                </Svg>

                <View style={styles.axisFooterRow}>
                    <Text style={styles.axisLabel}>Beginning of workout</Text>
                    <Text style={styles.axisLabel}>End of workout</Text>
                </View>

                {/* LEGEND */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View
                            style={[
                                styles.legendColor,
                                { backgroundColor: theme.colors.primary },
                            ]}
                        />
                        <Text style={styles.legendText}>
                            Accumulated effort
                        </Text>
                    </View>

                    <View style={styles.legendItem}>
                        <View
                            style={[
                                styles.legendColor,
                                { backgroundColor: theme.colors.success },
                            ]}
                        />
                        <Text style={styles.legendText}>
                            Start
                        </Text>
                    </View>

                    <View style={styles.legendItem}>
                        <View
                            style={[
                                styles.legendColor,
                                { backgroundColor: theme.colors.notification },
                            ]}
                        />
                        <Text style={styles.legendText}>
                            Finish
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Elevation Profile</Text>

                <Text style={styles.chartDescription}>
                    Elevation changes throughout your workout.
                </Text>

                <Svg height={chartHeight} width="100%">
                    <Polyline
                        points={altitudeData
                            .map((altitude, i) => {
                                const x = (i / (altitudeData.length - 1 || 1)) * chartWidth;

                                const y =
                                    chartHeight -
                                    ((altitude - minAltitude) / (maxAltitude - minAltitude || 1)) *
                                    (chartHeight - 20);

                                return `${x},${y}`;
                            })
                            .join(" ")
                        }
                        fill="rgba(142, 68, 173, 0.15)"
                        stroke="#8e44ad"
                        strokeWidth={3}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                </Svg>

                <View style={styles.axisFooterRow}>
                    <Text style={styles.axisLabel}>
                        Min {Math.round(minAltitude)} m
                    </Text>

                    <Text style={styles.axisLabel}>
                        Max {Math.round(maxAltitude)} m
                    </Text>
                </View>

                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <Text style={styles.legendText}>
                            ⬆️ {Math.round(ascent)} m
                        </Text>
                    </View>

                    <View style={styles.legendItem}>
                        <Text style={styles.legendText}>
                            ⬇️ {Math.round(descent)} m
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};
