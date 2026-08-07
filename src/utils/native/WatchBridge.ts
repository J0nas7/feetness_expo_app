import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type WatchWorkoutCommand = 'pause' | 'resume' | 'stop';

export interface WatchWorkoutSnapshot {
    status: 'idle' | 'running' | 'paused' | 'finished';
    exercise?: string;
    distance?: number;
    pace?: number;
    elapsed?: number;
    calories?: number;
    percent?: number;
    goalAmount?: number;
    goalMetric?: 'duration' | 'distance';
}

const { WatchBridge } = NativeModules;

export function publishWatchWorkout(snapshot: WatchWorkoutSnapshot) {
    if (Platform.OS === 'ios' && WatchBridge?.publishWorkout) {
        WatchBridge.publishWorkout(snapshot);
    }
}

export function subscribeToWatchWorkoutCommands(
    listener: (command: WatchWorkoutCommand) => void,
) {
    if (Platform.OS !== 'ios' || !WatchBridge) return null;

    const emitter = new NativeEventEmitter(WatchBridge);
    return emitter.addListener('watchWorkoutCommand', (event: { command?: string }) => {
        if (event.command === 'pause' || event.command === 'resume' || event.command === 'stop') {
            listener(event.command);
        }
    });
}
