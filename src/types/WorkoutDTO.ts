export type ExerciseType = "cycling" | "running" | "walking";
export type GoalMetric = "duration" | "distance";

export type Segment = {
    coords: {
        latitude: number;
        longitude: number;
        altitude: number | null;
    }[];
    pace: number; // min/km
}

export type Workout = {
    id: number;
    exercise: ExerciseType;
    goalAmount: number;
    goalMetric: GoalMetric;
    percentage: number; // percentage of goal completion

    startTime: number;
    endTime: number;

    distance: number; // meters
    elapsedTime: number; // seconds
    pausedDistance?: number; // meters; optional for workouts saved before pause tracking
    pausedTime?: number; // seconds; optional for workouts saved before pause tracking
    calories: number; // kcal
    pace: number; // min/km (avg)

    path: { latitude: number; longitude: number }[];
    segments: Segment[];
}

export interface ProgressPeriod {
    year: number;
    month?: number;   // optional if using weeks
    week?: number;    // optional if using weeks
    date?: number;    // optional timestamp for day charts
    workouts: Workout[];
}
