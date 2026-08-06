import { PlanFormScreen } from '@/components/plan/PlanFormScreen';
import { useLocalSearchParams } from 'expo-router';

export default function CreatePlanRoute() {
    const { copyFrom } = useLocalSearchParams<{ copyFrom?: string }>();
    return <PlanFormScreen kind="create" copyFrom={copyFrom} />;
}
