import { OnboardingData } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

const ONBOARDING_STORAGE_KEY = 'onboardingData';

export function useOnboarding() {
    const showOnboarding = useCallback(async (): Promise<OnboardingData | null> => {
        const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        return stored ? JSON.parse(stored) as OnboardingData : null;
    }, []);

    const storeOnboarding = useCallback(async (data: OnboardingData) => {
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
        return data;
    }, []);

    const updateOnboarding = useCallback(async (changes: Partial<OnboardingData>) => {
        const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        const current = stored ? JSON.parse(stored) as OnboardingData : null;
        if (!current) return null;
        const updated = { ...current, ...changes };
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    }, []);

    const destroyOnboarding = useCallback(async () => {
        await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }, []);

    return { destroyOnboarding, showOnboarding, storeOnboarding, updateOnboarding };
}
