import { Workout } from '@/types/WorkoutDTO';

const now = new Date();

export const DEMO_WORKOUTS: Workout[] = Array.from({ length: 7 }).flatMap((_, monthOffset) => {
    const workoutsThisMonth = 4 + Math.floor(Math.random() * 5);
    const baseDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);

    return Array.from({ length: workoutsThisMonth }).map((__, index) => {
        const exerciseTypes = ['running', 'cycling', 'walking'] as const;
        const exercise = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1 + Math.floor(Math.random() * 26));

        return {
            id: monthOffset * 10 + index,
            exercise,
            goalAmount: exercise === 'cycling' ? 45 : 5,
            goalMetric: exercise === 'cycling' ? 'duration' : 'distance',
            percentage: 80 + Math.floor(Math.random() * 50),
            startTime: start.getTime(),
            endTime: start.getTime(),
            distance: 3000 + Math.random() * 7000,
            elapsedTime: 1200 + Math.random() * 2400,
            calories: 200 + Math.random() * 400,
            pace: 4 + Math.random() * 4,
            path: [],
            segments: [],
        };
    });
});
