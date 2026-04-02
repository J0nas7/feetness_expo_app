import * as Location from 'expo-location';
import { getDistance } from 'geolib';

type Point = { latitude: number; longitude: number };

export type Segment = {
    coords: [Point, Point];
    pace: number; // min/km
};

let prevCoords: Location.LocationObjectCoords | null = null;
let prevTime: number | null = null;

let distance = 0;
let path: Point[] = [];
let segments: Segment[] = [];

type Listener = (data: {
    distance: number;
    path: Point[];
    segments: Segment[];
    location: Location.LocationObjectCoords;
}) => void;

const listeners = new Set<Listener>();

export const subscribeToWorkout = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const storeLocationUpdate = (loc: Location.LocationObject) => {
    const MIN_DISTANCE_METERS = 5; // ignore tiny GPS jumps
    const MAX_DISTANCE_METERS = 50; // ignore unrealistic spikes

    const coords = loc.coords;
    const now = Date.now();

    if (prevCoords) {
        const delta = getDistance(
            { latitude: prevCoords.latitude, longitude: prevCoords.longitude },
            { latitude: coords.latitude, longitude: coords.longitude }
        );

        // 🚫 Ignore GPS noise (too small)
        if (delta < MIN_DISTANCE_METERS) {
            return;
        }

        // 🚫 Ignore unrealistic jumps (bad GPS)
        if (delta > MAX_DISTANCE_METERS) {
            prevCoords = coords;
            prevTime = now;
            return;
        }

        distance += delta;

        const currPoint = { latitude: coords.latitude, longitude: coords.longitude };
        const prevPoint = { latitude: prevCoords.latitude, longitude: prevCoords.longitude };

        path.push(currPoint);

        // delta time in seconds
        const deltaSeconds = prevTime ? (now - prevTime) / 1000 : 0;
        prevTime = now;

        const segmentPace = delta > 0 ? (deltaSeconds / (delta / 1000)) / 60 : 0;

        segments.push({
            coords: [prevPoint, currPoint],
            pace: segmentPace,
        });
    } else {
        // first point
        path.push({ latitude: coords.latitude, longitude: coords.longitude });
        prevTime = now;
    }

    prevCoords = coords;

    // notify subscribers
    listeners.forEach(l =>
        l({
            distance,
            path: [...path],
            segments: [...segments],
            location: coords,
        })
    );
};

export const resetWorkoutStore = () => {
    prevCoords = null;
    prevTime = null;
    distance = 0;
    path = [];
    segments = [];
};

/**
 * Reset store AND notify subscribers with empty data
 */
export const resetWorkoutStoreAndNotify = () => {
    resetWorkoutStore();

    listeners.forEach(l =>
        l({
            distance: 0,
            path: [],
            segments: [],
            location: null as any, // or undefined if you prefer
        })
    );
};
