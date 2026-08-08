import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Plan } from './model';
import { loadPlans, savePlans as persistPlans } from './storage';

export const usePlans = () => {
    const [plans, setPlans] = useState<Plan[]>([]);

    useFocusEffect(useCallback(() => {
        let mounted = true;
        loadPlans().then((storedPlans) => { if (mounted) setPlans(storedPlans); });
        return () => { mounted = false; };
    }, []));

    const savePlans = useCallback(async (newPlans: Plan[]) => {
        setPlans(newPlans);
        await persistPlans(newPlans);
    }, []);

    const refreshPlans = useCallback(async () => {
        const storedPlans = await loadPlans();
        setPlans(storedPlans);
        return storedPlans;
    }, []);

    return { plans, savePlans, refreshPlans };
};
