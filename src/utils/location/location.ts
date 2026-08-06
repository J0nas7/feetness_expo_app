import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export type UserLocation = Location.LocationObject | null;

/**
 * Request foreground and background permissions.
 * Returns true if foreground permission granted.
 * Background permission may or may not be granted, but onboarding continues.
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
    try {
        // 1. Foreground
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') {
            Alert.alert(
                'Location Required',
                'Location permission is needed to track your workouts. You can enable it in settings.',
            );
            return false;
        }

        // Background access is required by startLocationUpdatesAsync when a
        // workout continues after the app is no longer in the foreground.
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        console.log('Background location status:', bgStatus);

        if (bgStatus !== 'granted') {
            Alert.alert(
                'Background Location Required',
                Platform.OS === 'android'
                    ? 'To track a workout while the screen is locked, set Location to “Allow all the time” in Android settings.'
                    : 'Enable Always Location access in Settings to track workouts in the background.',
                [
                    { text: 'Not Now', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => void Linking.openSettings() },
                ],
            );
        }

        return true;
    } catch (error) {
        console.error('Error requesting location permissions', error);
        return false;
    }
};

/**
 * Check if location permission is already granted.
 * Does NOT trigger system prompt.
 */
export const hasLocationPermission = async (): Promise<boolean> => {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error checking location permission', error);
        return false;
    }
};

/**
 * Check if background (always) location permission is granted.
 * Does NOT trigger system prompt.
 */
export const hasBackgroundPermission = async (): Promise<boolean> => {
    try {
        const { status } = await Location.getBackgroundPermissionsAsync();
        console.log('bgPermission', status)
        return status === 'granted';
    } catch (error) {
        console.error('Error checking background location permission', error);
        return false;
    }
};

/**
 * Get current device location (foreground only).
 * Returns null if permission not granted or location cannot be retrieved.
 */
export const getCurrentLocation = async (): Promise<UserLocation> => {
    try {
        const hasPermission = await hasLocationPermission();
        if (!hasPermission) {
            console.warn('Foreground location permission not granted');
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
        });
        return location;
    } catch (error) {
        console.error('Error getting current location', error);
        return null;
    }
};
