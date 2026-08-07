import { EmitterSubscription, NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { TimeTracking } = NativeModules;
const workoutEventEmitter = Platform.OS === 'ios' && TimeTracking
    ? new NativeEventEmitter(TimeTracking)
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
    exercise?: "Cykling" | "Løb" | "Gågang";
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
    }
}

export function isNativeWorkoutPaused(): boolean {
    if (Platform.OS !== 'ios' || !TimeTracking?.isWorkoutPaused) return false;
    return Boolean(TimeTracking.isWorkoutPaused());
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
