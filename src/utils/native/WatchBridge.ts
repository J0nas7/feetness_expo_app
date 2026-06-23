import { NativeModules, Platform } from 'react-native';

const { WatchBridge } = NativeModules;

export function sendWorkoutUpdate(distance: number, pace: number, elapsed: number) {
    if (Platform.OS === 'ios' && WatchBridge?.sendWorkoutUpdate) {
        WatchBridge.sendWorkoutUpdate(distance, pace, elapsed);
    }
}
