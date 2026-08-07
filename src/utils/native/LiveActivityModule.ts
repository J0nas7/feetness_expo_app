import { EmitterSubscription, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { activityName } from '@/i18n';

const { TimeTracking } = NativeModules;
const { BackgroundSpeechAndroid } = NativeModules;
const workoutNativeModule = Platform.OS === 'ios' ? TimeTracking : BackgroundSpeechAndroid;
const workoutEventEmitter = workoutNativeModule
    ? new NativeEventEmitter(workoutNativeModule)
    : null;

export type WorkoutCommand = 'pause' | 'resume' | 'stop';

export function startLiveActivity() {
    console.log("startLiveActivity TimeTracking Live Activity", TimeTracking)
    if (Platform.OS === 'ios' && TimeTracking?.startActivity) {
        console.log("Starting TimeTracking Live Activity")
        TimeTracking.startActivity();
    }
}

interface UpdateLiveActivityParams {
    distance: string;
    timeSpend: string;
    percent: number;
    pace: number;
    exercise?: "cycling" | "running" | "walking";
    goalAmount?: number;
    goalMetric?: "min" | "km";
}

export function updateLiveActivity({
    distance,
    timeSpend,
    percent,
    pace,
    exercise,
    goalAmount,
    goalMetric
}: UpdateLiveActivityParams) {
    console.log("updateLiveActivity TimeTracking Live Activity", TimeTracking, distance, timeSpend, percent, pace, exercise, goalAmount, goalMetric)
    if (Platform.OS === 'ios' && TimeTracking?.updateActivity) {
        console.log("Updating TimeTracking Live Activity")
        TimeTracking.updateActivity(distance, timeSpend, percent, pace, exercise, goalAmount, goalMetric);
    }
}

export function endLiveActivity() {
    if (Platform.OS === 'ios' && TimeTracking?.endActivity) {
        console.log("Ending TimeTracking Live Activity")
        TimeTracking.endActivity();
    }
}

export function setNativeWorkoutPaused(isPaused: boolean) {
    if (Platform.OS === 'ios' && TimeTracking?.setWorkoutPaused) {
        TimeTracking.setWorkoutPaused(isPaused);
    } else if (Platform.OS === 'android' && BackgroundSpeechAndroid?.setWorkoutPaused) {
        BackgroundSpeechAndroid.setWorkoutPaused(isPaused);
    }
}

export function isNativeWorkoutPaused(): boolean {
    if (Platform.OS === 'ios' && TimeTracking?.isWorkoutPaused) {
        return Boolean(TimeTracking.isWorkoutPaused());
    }
    if (Platform.OS === 'android' && BackgroundSpeechAndroid?.isWorkoutPaused) {
        return Boolean(BackgroundSpeechAndroid.isWorkoutPaused());
    }
    return false;
}

interface AndroidWorkoutNotificationParams {
    exercise: "cycling" | "running" | "walking";
    distanceKm: number;
    elapsedSeconds: number;
    percent: number;
    pace: number;
    goalAmount: number;
    goalMetric: "min" | "km";
}

export function startAndroidWorkoutNotification(
    exercise: AndroidWorkoutNotificationParams['exercise'],
    goalAmount: number,
    goalMetric: AndroidWorkoutNotificationParams['goalMetric'],
) {
    if (Platform.OS === 'android' && BackgroundSpeechAndroid?.startWorkout) {
        BackgroundSpeechAndroid.startWorkout(activityName(exercise), goalAmount, goalMetric);
    }
}

export function updateAndroidWorkoutNotification(params: AndroidWorkoutNotificationParams) {
    if (Platform.OS === 'android' && BackgroundSpeechAndroid?.updateWorkout) {
        BackgroundSpeechAndroid.updateWorkout(
            activityName(params.exercise),
            params.distanceKm,
            params.elapsedSeconds,
            params.percent,
            params.pace,
            params.goalAmount,
            params.goalMetric,
        );
    }
}

export function endAndroidWorkoutNotification() {
    if (Platform.OS === 'android' && BackgroundSpeechAndroid?.endWorkout) {
        BackgroundSpeechAndroid.endWorkout();
    }
}

export function subscribeToWorkoutCommands(
    listener: (command: WorkoutCommand) => void,
): EmitterSubscription | null {
    if (!workoutEventEmitter) return null;

    return workoutEventEmitter.addListener('workoutCommand', ({ command }) => {
        if (command === 'pause' || command === 'resume' || command === 'stop') {
            listener(command);
        }
    });
}
