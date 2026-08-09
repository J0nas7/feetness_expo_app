import { Workout } from '@/types';

const GREEN = '#2ecc71';
const YELLOW = '#f1c40f';
const RED = '#e74c3c';

export const summaryPaceColor = (exercise: Workout['exercise'], pace: number) => {
    if (exercise === 'cycling') return pace < 4 ? GREEN : pace < 5 ? YELLOW : RED;
    if (exercise === 'running') return pace < 5.5 ? GREEN : pace < 6.5 ? YELLOW : RED;
    return pace < 11 ? GREEN : pace < 12 ? YELLOW : RED;
};

export const paceLegend = (exercise: Workout['exercise']) => exercise === 'cycling'
    ? [{ label: '<4 min/km', color: GREEN }, { label: '4-5 min/km', color: YELLOW }, { label: 'Min. 5 min/km', color: RED }]
    : exercise === 'running'
        ? [{ label: '<5:30 min/km', color: GREEN }, { label: '5:30-6:30 min/km', color: YELLOW }, { label: 'Min. 6:30 min/km', color: RED }]
        : [{ label: '<10 min/km', color: GREEN }, { label: '11-12 min/km', color: YELLOW }, { label: 'Min. 12 min/km', color: RED }];

const pad = (value: number) => String(value).padStart(2, '0');
export const formatSummaryTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;
    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(remaining)}` : `${pad(minutes)}:${pad(remaining)}`;
};
export const formatSummaryPace = (pace: number) => pace > 0 ? `${Math.floor(pace)}:${pad(Math.floor((pace % 1) * 60))}` : '-';

export const deriveSummaryMetrics = (workout: Workout) => ({
    maximumAltitude: workout.segments.flatMap((segment) => segment.coords)
        .reduce((maximum, coordinate) => coordinate.altitude == null ? maximum : Math.max(maximum, coordinate.altitude), 0),
    averageSpeed: workout.elapsedTime > 0 ? (workout.distance / 1000) / (workout.elapsedTime / 3600) : 0,
    kilometersPerMinute: workout.elapsedTime > 0 ? (workout.distance / 1000) / (workout.elapsedTime / 60) : 0,
});
