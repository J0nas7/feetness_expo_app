import { Alert, Platform } from 'react-native';
import AppleHealthKit, {
    HealthKitPermissions,
} from 'react-native-health';

const permissions: HealthKitPermissions = {
    permissions: {
        read: [
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.HeartRate,
        ],
        write: [
            AppleHealthKit.Constants.Permissions.Workout,
        ],
    },
};

export type HealthPermissionStatus = boolean;

/**
 * Request health data permissions.
 * iOS: Apple Health
 * Android: Health Connect / Google Fit
 *
 * Returns true if permission flow was initiated successfully.
 * Actual permission granting may occur outside the app (system UI).
 */
export const requestHealthDataPermissions = async (): Promise<HealthPermissionStatus> => {
    try {
        console.log("requestHealthDataPermissions()")
        if (Platform.OS === 'ios') {
            return new Promise((resolve) => {
                try {
                    console.log('AppleHealthKit module:', AppleHealthKit);
                    AppleHealthKit.initHealthKit(permissions, (error) => {
                        if (error) {
                            // 🔍 Log EVERYTHING useful
                            console.error('HealthKit init error:', error);

                            Alert.alert(
                                'Health Access Denied',
                                'You can enable Health access later in Settings.',
                            );

                            resolve(false);
                            return;
                        }

                        console.log('HealthKit successfully initialized');
                        resolve(true);
                    });
                } catch {
                    console.error("HealthKit failed")
                    resolve(false);
                    return;
                }
            });
        }

        if (Platform.OS === 'android') {
            Alert.alert(
                'Health Access',
                'We use Health Connect to personalize workouts and track activity. You can manage permissions in system settings.',
            );

            /**
             * Placeholder:
             * Future implementation:
             * - Check Health Connect availability
             * - Request read permissions (steps, workouts, calories)
             */
            return true;
        }

        // Unsupported platforms (web, etc.)
        return false;
    } catch (error) {
        console.error('Error requesting health data permissions', error);
        return false;
    }
};

/**
 * Check if health data permission is already granted.
 * Does NOT trigger system prompt.
 */
export const hasHealthDataPermission = async (): Promise<boolean> => {
    // Placeholder: query HealthKit or Health Connect authorization here.
    return false;
};
