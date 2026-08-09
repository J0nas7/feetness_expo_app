import { Controls, Map } from '@/components/startpage';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useOnboarding } from '@/hooks/useOnboarding';
import { activityName } from '@/i18n';
import { createStartpageStyles } from '@/styles/modules/StartpageStyles';
import { ExerciseType, GoalMetric, Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { getCurrentLocation, hasBackgroundPermission, hasLocationPermission } from '@/utils/location/location';
import { WORKOUT_LOCATION_TASK } from '@/utils/location/workoutLocationTask';
import { endLiveActivity } from '@/utils/native/LiveActivityModule';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';

export default function StartScreen() {
    const theme = useTheme() as MyTheme;
    const { indexWorkouts } = useWorkouts();
    const { showOnboarding } = useOnboarding();

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [mode, setMode] = useState<GoalMetric>('distance');
    const [distance, setDistance] = useState(5);   // km
    const [duration, setDuration] = useState(30);  // min
    const [activity, setActivity] = useState<ExerciseType>('cycling');
    const [activityModalVisible, setActivityModalVisible] = useState(false);
    const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
    const [showCustom, setShowCustom] = useState(true); // toggler

    // Stop any ongoing location tracking when screen is focused
    useFocusEffect(
        useCallback(() => {
            const stopAnyOngoingTracking = async () => {
                const isRunning = await Location.hasStartedLocationUpdatesAsync(WORKOUT_LOCATION_TASK);

                // Stop background location tracking if active
                if (isRunning) {
                    await Location.stopLocationUpdatesAsync(WORKOUT_LOCATION_TASK);
                }

                // Ensure live activity is also stopped
                endLiveActivity();
            };

            stopAnyOngoingTracking();
        }, [])
    );

    // Check user location permissions
    useFocusEffect(
        useCallback(() => {
            const checkUserLocationPermissions = async () => {
                const onboarding = await showOnboarding();
                if (!onboarding) return;

                const fgPermission = await hasLocationPermission();
                const bgPermission = await hasBackgroundPermission();

                if (!bgPermission) {
                    Alert.alert(
                        'Permission Required',
                        'Both foreground and background location permissions are required to track your workout. You can enable it in settings.'
                    );
                }
            };

            checkUserLocationPermissions();
        }, [showOnboarding])
    );

    // Get user location
    useFocusEffect(
        useCallback(() => {
            const fetchLocation = async () => {
                const lastKnownLocation = await Location.getLastKnownPositionAsync();
                if (lastKnownLocation) setLocation(lastKnownLocation);

                const loc = await getCurrentLocation();
                if (loc) {
                    setLocation(loc);
                } else {
                    console.warn('Could not get location');
                }
            };

            fetchLocation()
        }, [])
    );

    // Load workouts from AsyncStorage
    useFocusEffect(
        React.useCallback(() => {
            (async () => {
                try {
                    const workouts = await indexWorkouts();
                    const seen = new Set<string>();
                    const uniqueWorkouts = [...workouts].reverse().filter((workout) => {
                        const key = `${workout.exercise}-${workout.goalAmount}-${workout.goalMetric}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });
                    setSavedWorkouts(uniqueWorkouts);
                } catch (error) {
                    console.error('Error loading workouts', error);
                }
            })();
        }, [indexWorkouts])
    );

    // Handle plus/minus buttons for distance/duration
    const pressGoalAmount = (direction: "plus" | "minus") => {
        let newGoalAmount = mode === 'distance' ? distance : duration

        mode === 'distance' ? 0.25 : 5

        if (direction === "plus") {
            if (mode === 'distance') newGoalAmount = (newGoalAmount + 0.25)
            if (mode === 'duration') newGoalAmount = (newGoalAmount + 5)
        }
        if (direction === "minus") {
            if (mode === 'distance') newGoalAmount = (newGoalAmount - 0.25)
            if (mode === 'duration') newGoalAmount = (newGoalAmount - 5)
        }

        mode === 'distance'
            ? setDistance(newGoalAmount)
            : setDuration(newGoalAmount)
    }

    // Styles
    const styles = createStartpageStyles(theme);

    return (
        <View style={styles.container}>
            {/* 🗺 MAP (40%) */}
            <Map theme={theme} location={location} />

            {/* 🎛 CONTROLS (60%) */}
            <Controls {...{
                theme,
                showCustom,
                mode,
                setMode,
                pressGoalAmount,
                distance,
                duration,
                setDistance,
                setDuration,
                setActivityModalVisible,
                activity,
                savedWorkouts,
                setActivity,
                setShowCustom,
            }} />

            <Modal
                visible={activityModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setActivityModalVisible(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setActivityModalVisible(false)}
                />

                <View style={styles.modalContainer}>
                    {(['cycling', 'running', 'walking'] as ExerciseType[]).map((item) => (
                        <Pressable
                            key={item}
                            style={styles.modalItem}
                            onPress={() => {
                                setActivity(item);
                                setActivityModalVisible(false);
                            }}
                        >
                            <Text style={styles.modalItemText}>{activityName(item)}</Text>
                        </Pressable>
                    ))}
                </View>
            </Modal>
        </View>
    );
}
