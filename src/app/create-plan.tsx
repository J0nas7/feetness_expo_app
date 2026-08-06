import { PlanFormScreen } from '@/components/plan/PlanFormScreen';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function CreatePlanRoute() {
    const { copyFrom } = useLocalSearchParams<{ copyFrom?: string }>();
    return <>
        <Stack.Screen options={{ title: copyFrom ? 'Kopiér plan' : 'Ny månedsplan' }} />
        <PlanFormScreen kind="create" copyFrom={copyFrom} />
    </>;
}
