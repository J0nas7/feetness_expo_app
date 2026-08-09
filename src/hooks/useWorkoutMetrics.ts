import { Workout } from '@/types';
import { resetWorkoutStoreAndNotify, subscribeToWorkout } from '@/utils/location/workoutStore';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateWorkoutCalories, getWorkoutMet } from './useWorkoutSession';
import { useOnboarding } from './useOnboarding';

type WorkoutUpdate = { distance: number; elapsed: number; pace: number; calories: number; percentage: number; isPaused: boolean };
type Options = {
    exercise: Workout['exercise'];
    goalAmount: number;
    goalMetric: Workout['goalMetric'];
    elapsedActiveTime: number;
    elapsedActiveTimeRef: { current: number };
    getActiveSeconds: () => number;
    isPausedRef: { current: boolean };
    communicateWorkoutUpdate: (update: WorkoutUpdate) => void;
    setLocation: (location: Location.LocationObjectCoords | null) => void;
};

export function useWorkoutMetrics({ exercise, goalAmount, goalMetric, elapsedActiveTime, elapsedActiveTimeRef, getActiveSeconds, isPausedRef, communicateWorkoutUpdate, setLocation }: Options) {
    const { showOnboarding } = useOnboarding();
    const [distance, setDistance] = useState(0);
    const [pace, setPace] = useState(0);
    const [calories, setCalories] = useState(0);
    const [path, setPath] = useState<Workout['path']>([]);
    const [segments, setSegments] = useState<Workout['segments']>([]);
    const [weight, setWeight] = useState(60);
    const distanceRef = useRef(0);
    const distanceActiveRef = useRef(0);
    const distancePausedRef = useRef(0);
    const paceRef = useRef(0);
    const caloriesRef = useRef(0);
    const percentageRef = useRef(0);
    const pathRef = useRef<Workout['path']>([]);
    const elevationGainRef = useRef(0);

    const calculatePercentage = useCallback((currentDistance: number, elapsed: number) => {
        const progress = goalMetric === 'distance'
            ? currentDistance / (goalAmount * 1000)
            : elapsed / (goalAmount * 60);
        return Math.round(Math.min(progress, 1) * 100);
    }, [goalAmount, goalMetric]);

    const updateMetrics = useCallback((currentDistance: number, elevationGain: number, elapsed: number) => {
        const met = getWorkoutMet(exercise, paceRef.current);
        const nextCalories = calculateWorkoutCalories(met, weight, elapsed) + (elevationGain * 0.9 * weight / 100);
        const percentage = calculatePercentage(currentDistance, elapsed);
        caloriesRef.current = nextCalories;
        percentageRef.current = percentage;
        setCalories(nextCalories);
        communicateWorkoutUpdate({ elapsed, distance: currentDistance, pace: paceRef.current, calories: nextCalories, percentage, isPaused: isPausedRef.current });
    }, [calculatePercentage, communicateWorkoutUpdate, exercise, isPausedRef, weight]);

    useEffect(() => {
        if (!isPausedRef.current) updateMetrics(distanceRef.current, elevationGainRef.current, elapsedActiveTime);
    }, [elapsedActiveTime, isPausedRef, updateMetrics]);

    useEffect(() => {
        const unsubscribe = subscribeToWorkout(({ distance: storedDistance, distanceDelta, path: storedPath, segments: storedSegments, location, elevationGain }) => {
            setLocation(location);
            if (isPausedRef.current) {
                distancePausedRef.current += distanceDelta;
                return;
            }
            distanceActiveRef.current += distanceDelta;
            const elapsed = getActiveSeconds();
            if (storedDistance > 0 && elapsed > 0) {
                paceRef.current = (elapsed / 60) / (storedDistance / 1000);
                setPace(paceRef.current);
            }
            distanceRef.current = storedDistance;
            pathRef.current = storedPath;
            elevationGainRef.current = elevationGain;
            setDistance(storedDistance);
            setPath(storedPath);
            setSegments(storedSegments);
            updateMetrics(storedDistance, elevationGain, elapsed);
        });
        return () => { unsubscribe(); };
    }, [getActiveSeconds, isPausedRef, setLocation, updateMetrics]);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            try {
                const onboarding = await showOnboarding();
                if (onboarding) setWeight(onboarding.weight ?? 60);
            } catch (error) {
                console.error('Failed to load onboarding data', error);
            }
        }, 3000);
        return () => clearTimeout(timeout);
    }, [showOnboarding]);

    const resetMetrics = useCallback(() => {
        resetWorkoutStoreAndNotify();
        distanceRef.current = 0;
        distanceActiveRef.current = 0;
        distancePausedRef.current = 0;
        paceRef.current = 0;
        caloriesRef.current = 0;
        percentageRef.current = 0;
        pathRef.current = [];
        elevationGainRef.current = 0;
        setDistance(0); setPace(0); setCalories(0); setPath([]); setSegments([]); setLocation(null);
    }, [setLocation]);

    return { calories, caloriesRef, distance, distancePausedRef, distanceRef, pace, paceRef, path, pathRef, percentage: calculatePercentage(distance, elapsedActiveTime), percentageRef, resetMetrics, segments };
}
