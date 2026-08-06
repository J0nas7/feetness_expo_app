import { PlanFormScreen } from '@/components/plan/PlanFormScreen';
import { useLocalSearchParams } from 'expo-router';

export default function EditPlanRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <PlanFormScreen kind="edit" planId={id} />;
}
