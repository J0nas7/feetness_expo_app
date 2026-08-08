import { Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
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
    const scrollHintAnimation = useRef(new Animated.Value(0)).current;

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
    }, [animations]);

    useEffect(() => {
        const animation = Animated.loop(Animated.sequence([
            Animated.timing(scrollHintAnimation, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(scrollHintAnimation, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]));
        animation.start();
        return () => animation.stop();
    }, [scrollHintAnimation]);

    const paceValues = groupedSegments.map((segment) => segment.avgPace).filter((pace) => pace > 0 && isFinite(pace));
    const minPace = paceValues.length > 0 ? Math.min(...paceValues) : 0;
    const maxPace = paceValues.length > 0 ? Math.max(...paceValues) : 0;
    const paceRange = maxPace - minPace;
    const paceBarHeight = (pace: number) => paceRange > 0
        ? 30 + ((pace - minPace) / paceRange) * 80
        : 70;

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

        groupedChart: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            minHeight: 170,
            paddingHorizontal: 4,
            paddingTop: 8,
            gap: 4,
        },

        paceBarWrapper: {
            width: 20,
            height: 160,
            alignItems: 'center',
            justifyContent: 'flex-end',
        },

        paceValue: {
            width: 25,
            height: 12,
            fontSize: 10,
            fontWeight: '700',
            alignItems: 'center',
            transform: [{ rotate: '-90deg' }],
        },

        paceBar: {
            width: 12,
            marginTop: 20,
            borderRadius: 6,
            boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.35)',
        },

        paceGroupLabel: {
            height: 20,
            marginTop: 6,
            fontSize: 11,
            color: theme.colors.tertiaryText,
        },
        scrollHint: {
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
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

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.groupedChart}>
                        {groupedSegments.map((seg, i) => {
                            const color = paceToColor(seg.avgPace);
                            return (
                                <View key={i} style={styles.paceBarWrapper}>
                                    <Text style={[styles.paceValue, { color }]}>
                                        {formatPace(seg.avgPace)}
                                    </Text>
                                    <Animated.View
                                        style={[
                                            styles.paceBar,
                                            {
                                                height: animations[i].interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [
                                                        0,
                                                        paceBarHeight(seg.avgPace),
                                                    ],
                                                }),
                                                backgroundColor: color,
                                            },
                                        ]}
                                    />
                                    <Text style={styles.paceGroupLabel}>&apos;{i + 1}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
                <View style={styles.scrollHint} pointerEvents="none">
                    <Animated.View style={{
                        opacity: scrollHintAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] }),
                        transform: [{ translateX: scrollHintAnimation.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }) }],
                    }}>
                        <FontAwesome5 name="arrows-alt-h" size={12} color={theme.colors.tertiaryText} />
                    </Animated.View>
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
