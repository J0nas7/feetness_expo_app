import { NativeModules, Platform } from 'react-native';

const { TimeTracking } = NativeModules;

export function startLiveActivity() {
    console.log("startLiveActivity TimeTracking Live Activity", TimeTracking)
    if (Platform.OS === 'ios' && TimeTracking?.startActivity) {
        console.log("Starting TimeTracking Live Activity")
        TimeTracking.startActivity();
    }
}

export function updateLiveActivity({ distance, timeSpend, percent }: { distance: string, timeSpend: string, percent: number }) {
    console.log("updateLiveActivity TimeTracking Live Activity", TimeTracking)
    if (Platform.OS === 'ios' && TimeTracking?.updateActivity) {
        console.log("Updating TimeTracking Live Activity")
        TimeTracking.updateActivity(distance, timeSpend, percent);
    }
}

export function endLiveActivity() {
    if (Platform.OS === 'ios' && TimeTracking?.endActivity) {
        console.log("Ending TimeTracking Live Activity")
        TimeTracking.endActivity();
    }
}
