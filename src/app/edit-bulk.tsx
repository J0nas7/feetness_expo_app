import { PlanFormScreen } from '@/components/plan/PlanFormScreen';
import { useLocalSearchParams } from 'expo-router';

export default function EditBulkRoute() {
    const { ids = '' } = useLocalSearchParams<{ ids?: string }>();
    return <PlanFormScreen kind="bulk" selectedIds={ids.split(',').filter(Boolean)} />;
}
