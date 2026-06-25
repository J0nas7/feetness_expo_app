import { NativeModules, Platform } from 'react-native';

const { TimeTracking } = NativeModules;

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
    exercise?: "Cykling" | "Løb" | "Gågang";
    goalAmount?: number;
    goalMetric?: "min" | "km";
}

export function updateLiveActivity({
    distance,
    timeSpend,
    percent,
    exercise,
    goalAmount,
    goalMetric
}: UpdateLiveActivityParams) {
    console.log("updateLiveActivity TimeTracking Live Activity", TimeTracking, distance, timeSpend, percent, exercise, goalAmount, goalMetric)
    if (Platform.OS === 'ios' && TimeTracking?.updateActivity) {
        console.log("Updating TimeTracking Live Activity")
        TimeTracking.updateActivity(distance, timeSpend, percent, exercise, goalAmount, goalMetric);
    }
}

export function endLiveActivity() {
    if (Platform.OS === 'ios' && TimeTracking?.endActivity) {
        console.log("Ending TimeTracking Live Activity")
        TimeTracking.endActivity();
    }
}
