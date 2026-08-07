import { EditWorkoutScreen } from '@/components/exercise/EditWorkoutScreen';
import { Workout } from '@/types';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function EditWorkoutRoute() {
    const { workout } = useLocalSearchParams<{ workout?: string }>();
    if (!workout) return <Redirect href="/(tabs)/progress" />;

    try {
        return <EditWorkoutScreen workout={JSON.parse(workout) as Workout} />;
    } catch {
        return <Redirect href="/(tabs)/progress" />;
    }
}

