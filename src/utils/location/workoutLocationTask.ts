import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { storeLocationUpdate } from './workoutStore';
import { isNativeWorkoutPaused } from '../native/LiveActivityModule';

export const WORKOUT_LOCATION_TASK = 'WORKOUT_LOCATION_TASK';

TaskManager.defineTask(WORKOUT_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
        console.error('Location task error:', error);
        return;
    }

    const { locations } = data as {
        locations: Location.LocationObject[];
    };

    if (!locations?.length) return;
    for (const location of locations) {
        storeLocationUpdate(location, isNativeWorkoutPaused());
    }
});
