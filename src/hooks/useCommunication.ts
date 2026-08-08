import { ProgressBucketUpdate } from '@/hooks/useSpeech';
import { updateAndroidWorkoutNotification, updateLiveActivity } from '@/utils/native/LiveActivityModule';
import { publishWatchWorkout } from '@/utils/native/WatchBridge';
import { useCallback } from 'react';

type Exercise = 'cycling' | 'running' | 'walking';
type GoalMetric = 'duration' | 'distance';

type ProgressUpdate = {
    elapsed: number;
    distance: number;
    pace: number;
    workoutPercentage: number;
};

type CommunicationOptions = {
    exercise: Exercise;
    goalAmount: number;
    goalMetric: GoalMetric;
    speakProgressUpdates: (update: ProgressUpdate) => ProgressBucketUpdate[];
};

type WorkoutUpdate = {
    distance: number;
    elapsed: number;
    pace: number;
    calories: number;
    percentage: number;
    isPaused: boolean;
};

export function useCommunication({
    exercise,
    goalAmount,
    goalMetric,
    speakProgressUpdates,
}: CommunicationOptions) {
    const communicateWorkoutUpdate = useCallback((update: WorkoutUpdate) => {
        const nativeGoalMetric = goalMetric === 'duration' ? 'min' : 'km';

        updateLiveActivity({
            distance: `${(update.distance / 1000).toFixed(2)} km, `,
            timeSpend: `${Math.floor(update.elapsed / 60)}:${String(Math.floor(update.elapsed % 60)).padStart(2, '0')}`,
            percent: update.percentage,
            pace: update.pace,
            exercise,
            goalAmount,
            goalMetric: nativeGoalMetric,
        });

        updateAndroidWorkoutNotification({
            exercise,
            distanceKm: update.distance / 1000,
            elapsedSeconds: update.elapsed,
            percent: update.percentage,
            pace: update.pace,
            goalAmount,
            goalMetric: nativeGoalMetric,
        });

        const bucketTimestamp = Date.now();
        const bucketUpdates = speakProgressUpdates({
            elapsed: update.elapsed,
            distance: update.distance,
            pace: update.pace,
            workoutPercentage: update.percentage,
        }).map((bucketUpdate, index) => ({
            ...bucketUpdate,
            id: `${bucketTimestamp}-${index}`,
            createdAt: bucketTimestamp,
        }));

        publishWatchWorkout({
            status: update.isPaused ? 'paused' : 'running',
            exercise,
            distance: update.distance,
            pace: update.pace,
            elapsed: update.elapsed,
            calories: update.calories,
            percent: update.percentage,
            goalAmount,
            goalMetric,
            bucketUpdates: bucketUpdates.length > 0 ? bucketUpdates : undefined,
        });
    }, [exercise, goalAmount, goalMetric, speakProgressUpdates]);

    return { communicateWorkoutUpdate };
}
