import { MyTheme } from '@/types/theme';
import { t } from '@/i18n';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatWorkoutPace, GroupedPace, workoutPaceColor } from './workoutTimeAnalysis';

export function GroupedPaceChart({ groups }: { groups: GroupedPace[] }) {
    const theme = useTheme() as MyTheme;
    const animations = useRef(groups.map(() => new Animated.Value(0))).current;
    const scrollHint = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.stagger(60, animations.map((value) => Animated.timing(value, { toValue: 1, duration: 350, useNativeDriver: false }))).start();
    }, [animations]);
    useEffect(() => {
        const animation = Animated.loop(Animated.sequence([
            Animated.timing(scrollHint, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(scrollHint, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]));
        animation.start();
        return () => animation.stop();
    }, [scrollHint]);

    const paces = groups.map(({ avgPace }) => avgPace).filter((pace) => pace > 0 && isFinite(pace));
    const minimum = paces.length ? Math.min(...paces) : 0;
    const range = paces.length ? Math.max(...paces) - minimum : 0;
    const height = (pace: number) => range > 0 ? 30 + ((pace - minimum) / range) * 80 : 70;
    const styles = StyleSheet.create({
        title: { fontSize: 16, fontWeight: '600', color: theme.colors.secondaryText, marginTop: 30, marginBottom: 12 },
        chart: { flexDirection: 'row', alignItems: 'flex-end', minHeight: 170, paddingHorizontal: 4, paddingTop: 8, gap: 4 },
        wrapper: { width: 20, height: 160, alignItems: 'center', justifyContent: 'flex-end' },
        value: { width: 25, height: 12, fontSize: 10, fontWeight: '700', transform: [{ rotate: '-90deg' }] },
        bar: { width: 12, marginTop: 20, borderRadius: 6, boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.35)' },
        group: { height: 20, marginTop: 6, fontSize: 11, color: theme.colors.tertiaryText },
        hint: { height: 24, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    });
    return <>
        <Text style={styles.title}>{t('exercise.timeSummary.groupedPace')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chart}>{groups.map((group, index) => {
                const color = workoutPaceColor(group.avgPace);
                return <View key={index} style={styles.wrapper}>
                    <Text style={[styles.value, { color }]}>{formatWorkoutPace(group.avgPace)}</Text>
                    <Animated.View style={[styles.bar, { height: animations[index].interpolate({ inputRange: [0, 1], outputRange: [0, height(group.avgPace)] }), backgroundColor: color }]} />
                    <Text style={styles.group}>&apos;{index + 1}</Text>
                </View>;
            })}</View>
        </ScrollView>
        <View style={styles.hint} pointerEvents="none"><Animated.View style={{ opacity: scrollHint.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] }), transform: [{ translateX: scrollHint.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }) }] }}>
            <FontAwesome5 name="arrows-alt-h" size={12} color={theme.colors.tertiaryText} />
        </Animated.View></View>
    </>;
}
