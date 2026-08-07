import { Plan } from '@/components/plan/model';
import { speak as nativeSpeak, startSpeechService, stopSpeak, stopSpeechService } from '@/utils/native/NativeSpeech';
import { useCallback, useRef, useState } from 'react';

type ProgressUpdate = {
    elapsed: number;
    distance: number;
    pace: number;
    workoutPercentage: number;
};

export type ProgressBucketUpdate = {
    kind: 'workoutGoal' | 'distance' | 'monthPlan';
    title: string;
    message: string;
    displayMessage: string;
};

const estimatedSpeechDuration = (text: string) => {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1400, wordCount * 480 + 600);
};

export function useSpeech() {
    const [isMuted, setIsMutedState] = useState(false);
    const isMutedRef = useRef(false);
    const queueRef = useRef<string[]>([]);
    const speakingRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const drainQueueRef = useRef<() => void>(() => undefined);
    const lastTimeBucketRef = useRef(0);
    const lastWorkoutPercentageBucketRef = useRef(0);
    const lastDistanceBucketRef = useRef(0);
    const monthPlanRef = useRef<Plan | null>(null);
    const monthPlanCompletedAmountRef = useRef(0);
    const lastMonthPlanBucketRef = useRef(0);

    const drainQueue = useCallback(() => {
        if (speakingRef.current) return;
        const message = queueRef.current.shift();
        if (!message) return;

        speakingRef.current = true;
        nativeSpeak(message);
        timerRef.current = setTimeout(() => {
            speakingRef.current = false;
            timerRef.current = null;
            drainQueueRef.current();
        }, estimatedSpeechDuration(message));
    }, []);
    drainQueueRef.current = drainQueue;

    const enqueueSpeech = useCallback((message: string) => {
        if (isMutedRef.current) return;
        const normalized = message.trim();
        if (!normalized) return;
        queueRef.current.push(normalized);
        drainQueueRef.current();
    }, []);

    const clearQueue = useCallback(() => {
        queueRef.current = [];
        speakingRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        stopSpeak();
    }, []);

    const start = useCallback(() => startSpeechService(), []);
    const stop = useCallback(() => {
        clearQueue();
        stopSpeechService();
    }, [clearQueue]);

    const setMuted = useCallback((muted: boolean) => {
        isMutedRef.current = muted;
        setIsMutedState(muted);
        if (muted) clearQueue();
    }, [clearQueue]);

    const toggleMute = useCallback(() => {
        setMuted(!isMutedRef.current);
    }, [setMuted]);

    const resetProgress = useCallback(() => {
        lastTimeBucketRef.current = 0;
        lastWorkoutPercentageBucketRef.current = 0;
        lastDistanceBucketRef.current = 0;
        monthPlanRef.current = null;
        monthPlanCompletedAmountRef.current = 0;
        lastMonthPlanBucketRef.current = 0;
    }, []);

    const setMonthPlanProgress = useCallback((plan: Plan, completedAmount: number) => {
        monthPlanRef.current = plan;
        monthPlanCompletedAmountRef.current = completedAmount;
        const percentage = plan.goal > 0 ? completedAmount / plan.goal * 100 : 0;
        lastMonthPlanBucketRef.current = Math.floor(Math.min(percentage, 100) / 10);
    }, []);

    const speakProgressUpdates = useCallback((update: ProgressUpdate) => {
        const bucketUpdates: ProgressBucketUpdate[] = [];
        const timeBucket = Math.floor(update.elapsed / 300);
        if (timeBucket > lastTimeBucketRef.current) {
            lastTimeBucketRef.current = timeBucket;
            const distanceKm = update.distance / 1000;
            const hours = Math.floor(update.elapsed / 3600);
            const minutes = Math.floor((update.elapsed % 3600) / 60);
            const paceMinutes = Math.floor(update.pace);
            const paceSeconds = Math.floor((update.pace - paceMinutes) * 60);
            enqueueSpeech(
                `Fremskridt ${update.workoutPercentage} procent, ` +
                `varighed ${hours > 0 ? `${hours} time og ` : ''}${minutes} minutter, ` +
                `distance ${distanceKm.toFixed(2).replace('.', ' komma ')} kilometer, ` +
                `tempo ${paceMinutes} minutter og ${paceSeconds} sekunder`
            );
        }

        const percentageBucket = Math.floor(update.workoutPercentage / 20);
        if (percentageBucket > 0 && percentageBucket > lastWorkoutPercentageBucketRef.current) {
            lastWorkoutPercentageBucketRef.current = percentageBucket;
            const message = `Du har nået ${percentageBucket * 20} procent af dit mål.`;
            enqueueSpeech(message);
            bucketUpdates.push({
                kind: 'workoutGoal',
                title: 'Mål-fremskridt',
                message,
                displayMessage: `Du har nået\n${percentageBucket * 20} procent\naf dit mål`,
            });
        }

        const distanceBucket = Math.floor(update.distance / 1000);
        if (distanceBucket > 0 && distanceBucket > lastDistanceBucketRef.current) {
            lastDistanceBucketRef.current = distanceBucket;
            const message = `Du har nået ${distanceBucket} kilometer.`;
            enqueueSpeech(message);
            bucketUpdates.push({
                kind: 'distance',
                title: 'Distance',
                message,
                displayMessage: `Du har nået\n${distanceBucket} kilometer`,
            });
        }

        const monthPlan = monthPlanRef.current;
        if (!monthPlan || monthPlan.goal <= 0) return bucketUpdates;
        const currentWorkoutAmount = monthPlan.metric === 'distance'
            ? update.distance / 1000
            : update.elapsed / 3600;
        const completedAmount = monthPlanCompletedAmountRef.current + currentWorkoutAmount;
        const monthBucket = Math.floor(Math.min(completedAmount / monthPlan.goal * 100, 100) / 10);
        if (monthBucket > 0 && monthBucket > lastMonthPlanBucketRef.current) {
            lastMonthPlanBucketRef.current = monthBucket;
            const message = `Du har nået ${monthBucket * 10} procent af din månedsplan.`;
            enqueueSpeech(message);
            bucketUpdates.push({
                kind: 'monthPlan',
                title: 'Månedsplan',
                message,
                displayMessage: `Du har nået\n${monthBucket * 10} procent\naf din månedsplan`,
            });
        }

        return bucketUpdates;
    }, [enqueueSpeech]);

    return {
        enqueueSpeech,
        isMuted,
        resetProgress,
        setMuted,
        setMonthPlanProgress,
        speakProgressUpdates,
        start,
        stop,
        toggleMute,
    };
}
