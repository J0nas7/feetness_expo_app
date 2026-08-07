import * as Location from 'expo-location';
import { getDistance } from 'geolib';

type Point = {
    latitude: number;
    longitude: number;
    altitude: number | null;
};

export type Segment = {
    coords: [Point, Point];
    pace: number; // min/km
};

let prevCoords: Location.LocationObjectCoords | null = null;
let prevTime: number | null = null;

let distance = 0;
let elevationGainTotal = 0;
let path: Point[] = [];
let segments: Segment[] = [];

type Listener = (data: {
    distance: number;
    path: Point[];
    segments: Segment[];
    location: Location.LocationObjectCoords;
    elevationGain: number;
}) => void;

const listeners = new Set<Listener>();

export const subscribeToWorkout = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const storeLocationUpdate = (loc: Location.LocationObject) => {
    const MIN_DISTANCE_METERS = 12;     // ignore small GPS noise
    const MAX_ACCEPTABLE_ACCURACY = 25; // ignore points with poor accuracy
    const MAX_PLAUSIBLE_SPEED_MPS = 25; // 90 km/h, safely above workout cycling speed

    const coords = loc.coords;
    // TaskManager may deliver several buffered locations at once. Their GPS
    // timestamps preserve the real interval; Date.now() does not.
    const timestamp = loc.timestamp;

    if (coords.accuracy && coords.accuracy > MAX_ACCEPTABLE_ACCURACY) return;

    if (prevCoords) {
        const delta = getDistance(
            { latitude: prevCoords.latitude, longitude: prevCoords.longitude },
            { latitude: coords.latitude, longitude: coords.longitude }
        );

        // 🚫 Ignore GPS noise (too small)
        if (delta < MIN_DISTANCE_METERS) return;

        const elapsedSeconds = prevTime
            ? Math.max((timestamp - prevTime) / 1000, 1)
            : 1;
        const accuracyAllowance = (prevCoords.accuracy ?? 0) + (coords.accuracy ?? 0);
        const maxPlausibleDistance = Math.max(
            50,
            elapsedSeconds * MAX_PLAUSIBLE_SPEED_MPS + accuracyAllowance,
        );

        // Ignore a GPS spike, while allowing longer gaps caused by Android
        // batching background updates (especially common while cycling).
        if (delta > maxPlausibleDistance) {
            return;
        }

        distance += delta;

        const currPoint = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: coords.altitude,
        };

        const prevPoint = {
            latitude: prevCoords.latitude,
            longitude: prevCoords.longitude,
            altitude: prevCoords.altitude,
        };

        let elevationGain = 0;

        if (
            coords.altitude != null &&
            prevCoords.altitude != null
        ) {
            elevationGain =
                coords.altitude - prevCoords.altitude;

            if (elevationGain > 0) {
                elevationGainTotal += elevationGain;
            }
        }

        path.push(currPoint);

        // delta time in seconds
        const deltaSeconds = prevTime ? (timestamp - prevTime) / 1000 : 0;
        prevTime = timestamp;

        const segmentPace = delta > 0 ? (deltaSeconds / (delta / 1000)) / 60 : 0;

        segments.push({
            coords: [prevPoint, currPoint],
            pace: segmentPace,
        });
    } else {
        // first point
        path.push({
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: coords.altitude,
        });

        prevTime = timestamp;
    }

    prevCoords = coords;

    // notify subscribers
    listeners.forEach(l =>
        l({
            distance,
            path: [...path],
            segments: [...segments],
            location: coords,
            elevationGain: elevationGainTotal,
        })
    );
};

export const resetWorkoutStore = () => {
    prevCoords = null;
    prevTime = null;
    distance = 0;
    path = [];
    segments = [];
    elevationGainTotal = 0;
};

export const resetWorkoutLocationAnchor = () => {
    prevCoords = null;
    prevTime = null;
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
            elevationGain: 0,
        })
    );
};
