import { t } from '@/i18n';
import { Workout } from '@/types';
import { hasBackgroundPermission, hasLocationPermission } from '@/utils/location/location';
import { WORKOUT_LOCATION_TASK } from '@/utils/location/workoutLocationTask';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

export function useWorkoutLocation(exercise: Workout['exercise'], startWorkout: () => void) {
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const locationSubRef = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            }
            if (cancelled) return;
            startWorkout();
            const distanceInterval = exercise === 'cycling' ? 15 : 5;
            const timeInterval = exercise === 'cycling' ? 5000 : 3000;
            const [foregroundGranted, backgroundGranted] = await Promise.all([hasLocationPermission(), hasBackgroundPermission()]);
            if (cancelled) return;
            if (!foregroundGranted || !backgroundGranted) {
                Alert.alert(t('exercise.location.permissionTitle'), Platform.OS === 'android' ? t('exercise.location.androidPermission') : t('exercise.location.iosPermission'), [
                    { text: t('common.actions.cancel'), style: 'cancel' },
                    { text: t('exercise.location.openSettings'), onPress: () => void Linking.openSettings() },
                ]);
                return;
            }
            await Location.startLocationUpdatesAsync(WORKOUT_LOCATION_TASK, {
                accuracy: Location.Accuracy.High, distanceInterval, timeInterval,
                showsBackgroundLocationIndicator: true,
                foregroundService: { notificationTitle: t('exercise.location.notificationTitle'), notificationBody: t('exercise.location.notificationBody') },
            });
        })().catch((error) => {
            console.error('Unable to start workout location tracking', error);
            Alert.alert(t('exercise.location.unavailableTitle'), t('exercise.location.unavailableMessage'));
        });
        return () => { cancelled = true; };
    }, [exercise, startWorkout]);

    return { location, locationSubRef, setLocation };
}
