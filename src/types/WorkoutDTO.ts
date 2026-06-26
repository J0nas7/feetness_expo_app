export type ExerciseType = "Cykling" | "Løb" | "Gågang";
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
    pace: number; // min/km (avg)

    path: { latitude: number; longitude: number }[];
    segments: Segment[];
}

export interface ProgressPeriod {
    year: number;
    month?: number;   // optional if using weeks
    week?: number;    // optional if using weeks
    workouts: Workout[];
}
