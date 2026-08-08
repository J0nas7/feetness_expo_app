import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'hasCompletedOnboarding';

export const hasCompletedOnboarding = async (): Promise<boolean> => {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === 'true';
};

export const setOnboardingCompleted = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
};
