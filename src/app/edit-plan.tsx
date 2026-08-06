import { PlanFormScreen } from '@/components/plan/PlanFormScreen';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function EditPlanRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <>
        <Stack.Screen options={{ title: 'Rediger plan' }} />
        <PlanFormScreen kind="edit" planId={id} />
    </>;
}
