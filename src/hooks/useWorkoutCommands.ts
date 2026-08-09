import { t } from '@/i18n';
import { subscribeToWorkoutCommands } from '@/utils/native/LiveActivityModule';
import { subscribeToWatchWorkoutCommands } from '@/utils/native/WatchBridge';
import { useEffect } from 'react';
import { Platform } from 'react-native';

type Options = {
    enqueueSpeech: (message: string) => void;
    isPausedRef: { current: boolean };
    pauseFromNative: (paused: boolean) => void;
    pauseFromWatch: (paused: boolean) => void;
    stopExerciseRef: { current: () => Promise<void> };
};

export function useWorkoutCommands({ enqueueSpeech, isPausedRef, pauseFromNative, pauseFromWatch, stopExerciseRef }: Options) {
    useEffect(() => {
        const subscription = subscribeToWatchWorkoutCommands((command) => {
            if (command === 'stop') return void stopExerciseRef.current();
            const paused = command === 'pause';
            if (isPausedRef.current === paused) return;
            enqueueSpeech(t(paused ? 'common.actions.pause' : 'common.actions.resume'));
            pauseFromWatch(paused);
        });
        return () => subscription?.remove();
    }, [enqueueSpeech, isPausedRef, pauseFromWatch, stopExerciseRef]);

    useEffect(() => {
        const subscription = subscribeToWorkoutCommands((command) => {
            if (command === 'stop') return void stopExerciseRef.current();
            const paused = command === 'pause';
            if (isPausedRef.current === paused) return;
            if (Platform.OS === 'ios') enqueueSpeech(t(paused ? 'common.actions.pause' : 'common.actions.resume'));
            pauseFromNative(paused);
        });
        return () => subscription?.remove();
    }, [enqueueSpeech, isPausedRef, pauseFromNative, stopExerciseRef]);
}
