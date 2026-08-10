import { ExerciseType, GoalMetric, Workout } from '@/types';
import { getCurrentLocation, hasBackgroundPermission, hasLocationPermission } from '@/utils/location/location';
import { WORKOUT_LOCATION_TASK } from '@/utils/location/workoutLocationTask';
import { endLiveActivity } from '@/utils/native/LiveActivityModule';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { useOnboarding } from './useOnboarding';
import { useWorkouts } from './useWorkouts';

export const useStartpage = () => {
    const { indexWorkouts } = useWorkouts();
    const { showOnboarding } = useOnboarding();
    const [location, setLocation] = React.useState<Location.LocationObject | null>(null);
    const [mode, setMode] = React.useState<GoalMetric>('distance');
    const [distance, setDistance] = React.useState(5);
    const [duration, setDuration] = React.useState(30);
    const [activity, setActivity] = React.useState<ExerciseType>('cycling');
    const [activityModalVisible, setActivityModalVisible] = React.useState(false);
    const [savedWorkouts, setSavedWorkouts] = React.useState<Workout[]>([]);
    const [showCustom, setShowCustom] = React.useState(true);

    useFocusEffect(React.useCallback(() => {
        void (async () => {
            const isRunning = await Location.hasStartedLocationUpdatesAsync(WORKOUT_LOCATION_TASK);
            if (isRunning) await Location.stopLocationUpdatesAsync(WORKOUT_LOCATION_TASK);
            endLiveActivity();
        })();
    }, []));

    useFocusEffect(React.useCallback(() => {
        void (async () => {
            const onboarding = await showOnboarding();
            if (!onboarding) return;
            await hasLocationPermission();
            if (!await hasBackgroundPermission()) {
                Alert.alert(
                    'Permission Required',
                    'Both foreground and background location permissions are required to track your workout. You can enable it in settings.'
                );
            }
        })();
    }, [showOnboarding]));

    useFocusEffect(React.useCallback(() => {
        void (async () => {
            const lastKnownLocation = await Location.getLastKnownPositionAsync();
            if (lastKnownLocation) setLocation(lastKnownLocation);
            const currentLocation = await getCurrentLocation();
            if (currentLocation) setLocation(currentLocation);
            else console.warn('Could not get location');
        })();
    }, []));

    useFocusEffect(React.useCallback(() => {
        void indexWorkouts().then((workouts) => {
            const seen = new Set<string>();
            setSavedWorkouts([...workouts].reverse().filter((workout) => {
                const key = `${workout.exercise}-${workout.goalAmount}-${workout.goalMetric}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            }));
        }).catch((error) => console.error('Error loading workouts', error));
    }, [indexWorkouts]));

    const pressGoalAmount = (direction: 'plus' | 'minus') => {
        const increment = mode === 'distance' ? 0.25 : 5;
        const current = mode === 'distance' ? distance : duration;
        const next = direction === 'plus' ? current + increment : current - increment;
        if (mode === 'distance') setDistance(next);
        else setDuration(next);
    };

    const selectActivity = (selectedActivity: ExerciseType) => {
        setActivity(selectedActivity);
        setActivityModalVisible(false);
    };

    const startWorkout = async () => {
        await AsyncStorage.setItem('currentWorkout', JSON.stringify({ mode, distance, duration, activity }));
        router.push('/progress');
    };

    return {
        activity,
        activityModalVisible,
        closeActivityModal: () => setActivityModalVisible(false),
        distance,
        duration,
        location,
        mode,
        openActivityModal: () => setActivityModalVisible(true),
        pressGoalAmount,
        savedWorkouts,
        selectActivity,
        setActivity,
        setDistance,
        setDuration,
        setMode,
        setShowCustom,
        showCustom,
        startWorkout,
    };
};
