import { useCallback, useEffect, useRef, useState } from 'react';

export function useWorkoutTimer(isPaused: boolean) {
    const [elapsedActiveTime, setElapsedActiveTime] = useState(0);
    const startTimeRef = useRef(Date.now());
    const totalElapsedWorkoutTimeRef = useRef(0);
    const elapsedActiveTimeRef = useRef(0);
    const elapsedPausedTimeRef = useRef(0);
    const activeStartTimeRef = useRef<number | null>(Date.now());
    const totalActiveMsRef = useRef(0);

    const getActiveSeconds = useCallback(() => Math.floor((
        totalActiveMsRef.current + (activeStartTimeRef.current ? Date.now() - activeStartTimeRef.current : 0)
    ) / 1000), []);

    const resetTimer = useCallback((startedAt = Date.now()) => {
        startTimeRef.current = startedAt;
        totalElapsedWorkoutTimeRef.current = 0;
        elapsedActiveTimeRef.current = 0;
        elapsedPausedTimeRef.current = 0;
        totalActiveMsRef.current = 0;
        activeStartTimeRef.current = startedAt;
        setElapsedActiveTime(0);
        return startedAt;
    }, []);

    const finalizeTimer = useCallback(() => {
        totalElapsedWorkoutTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
        elapsedActiveTimeRef.current = getActiveSeconds();
        elapsedPausedTimeRef.current = Math.max(totalElapsedWorkoutTimeRef.current - elapsedActiveTimeRef.current, 0);
    }, [getActiveSeconds]);

    useEffect(() => {
        if (isPaused) {
            if (activeStartTimeRef.current) {
                totalActiveMsRef.current += Date.now() - activeStartTimeRef.current;
                activeStartTimeRef.current = null;
            }
        } else if (activeStartTimeRef.current === null) {
            activeStartTimeRef.current = Date.now();
        }
    }, [isPaused]);

    useEffect(() => {
        const interval = setInterval(() => {
            totalElapsedWorkoutTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const active = getActiveSeconds();
            elapsedActiveTimeRef.current = active;
            elapsedPausedTimeRef.current = Math.max(totalElapsedWorkoutTimeRef.current - active, 0);
            if (!isPaused) setElapsedActiveTime(active);
        }, 1000);
        return () => clearInterval(interval);
    }, [getActiveSeconds, isPaused]);

    return { elapsedActiveTime, elapsedActiveTimeRef, elapsedPausedTimeRef, finalizeTimer, getActiveSeconds, resetTimer, startTimeRef };
}
