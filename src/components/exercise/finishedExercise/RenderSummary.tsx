import { GoalProgress } from '@/components/exercise/GoalProgress';
import { Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export const RenderSummary = ({ workout }: { workout: Workout; }) => {
    const theme = useTheme() as MyTheme;
    const mapRef = useRef<MapView>(null);

    const startPoint = workout.path[0];
    const endPoint = workout.path[workout.path.length - 1];

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0
            ? `${pad(h)}:${pad(m)}:${pad(s)}`
            : `${pad(m)}:${pad(s)}`;
    };

    const formatPace = (pace: number) =>
        pace > 0 ? `${Math.floor(pace)}:${pad(Math.floor((pace % 1) * 60))}` : "-";

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    const paceToColor = (pace: number) => {
        if (!pace || !isFinite(pace)) return "#95a5a6";
        if (pace < 5) return "#e74c3c";
        if (pace < 6) return "#f1c40f";
        return "#2ecc71";
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: 'column',
        },
        mapContainer: {
            height: '60%', // Map takes 60% of the screen
        },
        map: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.border,
        },
        mapGradient: {
            position: 'absolute',
            bottom: 0,
            height: 150, // controls softness of transition
            width: '100%',
        },
        statsContainer: {
            height: '40%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            paddingVertical: 20,
            paddingHorizontal: 15,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            elevation: 5,
            shadowColor: theme.colors.text,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            display: 'flex',
            flexDirection: 'column',
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap', // Allows the items to wrap onto new lines
            justifyContent: 'space-evenly', // Even spacing between items
            width: '100%',
        },
        navigation: {
            flexDirection: 'row',
            flexWrap: 'wrap', // Allows the items to wrap onto new lines
            justifyContent: 'space-evenly', // Even spacing between items
            width: '100%',
        },
        statItem: {
            width: '30%', // 3 items per row (100% / 3 = 33.33%, rounded to 30% for spacing)
            alignItems: 'center',
            marginBottom: 20, // Space between rows
        },
        valueText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.secondaryText,
        },
        unitText: {
            fontSize: 14,
            color: theme.colors.tertiaryText, // Lighter color for units
        },
        goalOverlay: {
            position: 'absolute',
            top: '60%', // slightly above the split (70/30)
            left: '50%',
            transform: [
                { translateX: -70 },
                { translateY: -70 },
            ],
            zIndex: 10,
            elevation: 10, // Android
        },
    })

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    onMapReady={() => {
                        if (workout.path.length > 1) {
                            mapRef.current?.fitToCoordinates(workout.path, {
                                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                                animated: true,
                            });
                        }
                    }}
                >
                    {workout.segments.map((seg, idx) => (
                        <Polyline
                            key={idx}
                            coordinates={seg.coords}
                            strokeColor={paceToColor(seg.pace)}
                            strokeWidth={4}
                        />
                    ))}

                    {startPoint && <Marker coordinate={startPoint} title="Start" pinColor="green" />}
                    {endPoint && <Marker coordinate={endPoint} title="Finish" pinColor="red" />}
                </MapView>

                {/* Gradient transition */}
                <LinearGradient
                    colors={['transparent', theme.colors.background]}
                    style={styles.mapGradient}
                    locations={[0, 1]}
                    pointerEvents="none"
                />
            </View>
            <View style={styles.statsContainer}>
                <View style={styles.grid}>
                    <View style={styles.statItem}>
                        <Text style={styles.valueText}>{((workout.distance) / 1000).toFixed(2)} </Text>
                        <Text style={styles.unitText}>km</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.valueText}>{formatTime(workout.elapsedTime)}</Text>
                        <Text style={styles.unitText}>Time</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.valueText}>{formatPace(workout.pace)}</Text>
                        <Text style={styles.unitText}>min/km</Text>
                    </View>

                    {/* Placeholder stats */}
                    <View style={styles.statItem}>
                        <Text style={styles.valueText}>0</Text>
                        <Text style={styles.unitText}>Steps</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.valueText}>0</Text>
                        <Text style={styles.unitText}>Kcal</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.valueText}>0</Text>
                        <Text style={styles.unitText}>bpm</Text>
                    </View>
                </View>
            </View>
            <View style={styles.goalOverlay}>
                <GoalProgress
                    percentage={workout.percentage}
                    goalAmount={workout.goalAmount}
                    goalMetric={workout.goalMetric}
                />
            </View>
        </View>
    )
}
