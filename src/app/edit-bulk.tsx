import { PlanFormScreen } from '@/components/plan/PlanFormScreen';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function EditBulkRoute() {
    const { ids = '' } = useLocalSearchParams<{ ids?: string }>();
    return <>
        <Stack.Screen options={{ title: 'Rediger planer' }} />
        <PlanFormScreen kind="bulk" selectedIds={ids.split(',').filter(Boolean)} />
    </>;
}
