import { EditWorkoutScreen } from '@/components/exercise/EditWorkoutScreen';
import { useLocalSearchParams } from 'expo-router';

export default function EditWorkoutsBulkRoute() {
    const { ids = '' } = useLocalSearchParams<{ ids?: string }>();
    const selectedIds = ids.split(',').map(Number).filter(Number.isFinite);
    return <EditWorkoutScreen mode="bulk" selectedIds={selectedIds} />;
}
