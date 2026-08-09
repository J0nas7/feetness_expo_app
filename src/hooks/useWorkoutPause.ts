import { t } from '@/i18n';
import { resetWorkoutLocationAnchor } from '@/utils/location/workoutStore';
import { useCallback, useEffect, useRef, useState } from 'react';

type WorkoutState = { distance: number; pace: number; elapsed: number; calories: number; percentage: number; isPaused: boolean };
type Options = {
    enqueueSpeech: (message: string) => void;
    pauseWorkout: (paused: boolean) => void;
    publishWorkoutState: (state: WorkoutState) => void;
    currentState: () => Omit<WorkoutState, 'isPaused'>;
};

export function useWorkoutPause({ enqueueSpeech, pauseWorkout, publishWorkoutState, currentState }: Options) {
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(false);
    const initializedRef = useRef(false);
    const applyingNativeCommandRef = useRef(false);
    const currentStateRef = useRef(currentState);
    currentStateRef.current = currentState;

    const pauseFromNative = useCallback((paused: boolean) => {
        applyingNativeCommandRef.current = true;
        isPausedRef.current = paused;
        setIsPaused(paused);
    }, []);

    const pauseFromWatch = useCallback((paused: boolean) => {
        isPausedRef.current = paused;
        setIsPaused(paused);
    }, []);

    const setPaused = useCallback((value: React.SetStateAction<boolean>) => {
        setIsPaused((current) => {
            const next = typeof value === 'function' ? value(current) : value;
            isPausedRef.current = next;
            return next;
        });
    }, []);

    useEffect(() => {
        isPausedRef.current = isPaused;
        resetWorkoutLocationAnchor();
        publishWorkoutState({ ...currentStateRef.current(), isPaused });
        if (!initializedRef.current) {
            initializedRef.current = true;
        } else if (applyingNativeCommandRef.current) {
            applyingNativeCommandRef.current = false;
        } else {
            enqueueSpeech(t(isPaused ? 'common.actions.pause' : 'common.actions.resume'));
            pauseWorkout(isPaused);
        }
    }, [enqueueSpeech, isPaused, pauseWorkout, publishWorkoutState]);

    return { isPaused, isPausedRef, pauseFromNative, pauseFromWatch, setIsPaused: setPaused };
}
