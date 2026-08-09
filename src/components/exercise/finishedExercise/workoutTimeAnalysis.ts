import { Workout } from '@/types';

export type GroupedPace = { avgPace: number };
export type ElevationAnalysis = { altitudeData: number[]; ascent: number; descent: number; minAltitude: number; maxAltitude: number };

const GROUP_SECONDS = 60;

export const groupWorkoutPace = (workout: Workout): GroupedPace[] => {
    if (workout.segments.length === 0) return [];
    const targetGroups = Math.max(workout.elapsedTime / GROUP_SECONDS, 1);
    const chunkSize = Math.max(1, Math.floor(workout.segments.length / targetGroups));
    const groups: GroupedPace[] = [];
    for (let index = 0; index < workout.segments.length; index += chunkSize) {
        const segments = workout.segments.slice(index, index + chunkSize);
        groups.push({ avgPace: segments.reduce((sum, segment) => sum + (segment.pace || 0), 0) / segments.length });
    }
    return groups;
};

export const analyzeElevation = (workout: Workout): ElevationAnalysis => {
    const altitudeData = workout.segments.flatMap((segment) => segment.coords)
        .flatMap((coordinate) => coordinate.altitude == null ? [] : [coordinate.altitude]);
    if (altitudeData.length === 0) return { altitudeData, ascent: 0, descent: 0, minAltitude: 0, maxAltitude: 0 };

    let ascent = 0;
    let descent = 0;
    for (let index = 1; index < altitudeData.length; index++) {
        const difference = altitudeData[index] - altitudeData[index - 1];
        if (difference > 0) ascent += difference;
        else descent += Math.abs(difference);
    }
    return { altitudeData, ascent, descent, minAltitude: Math.min(...altitudeData), maxAltitude: Math.max(...altitudeData) };
};

const pad = (value: number) => String(value).padStart(2, '0');
export const formatWorkoutTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}` : `${pad(minutes)}:${pad(remainingSeconds)}`;
};
export const formatWorkoutPace = (pace: number) => pace > 0 ? `${Math.floor(pace)}:${pad(Math.floor((pace % 1) * 60))}` : '-';
export const workoutPaceColor = (pace: number) => !pace || !isFinite(pace) ? '#95a5a6' : pace < 5.5 ? '#2ecc71' : pace < 6.5 ? '#f1c40f' : '#e74c3c';
