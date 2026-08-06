import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plan } from './model';

const STORAGE_KEY = 'plans';

export const loadPlans = async (): Promise<Plan[]> => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const savePlans = async (plans: Plan[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
};
