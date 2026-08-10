import { FitnessLevel } from '@/components';
import { OnboardingData, PageTitles } from '@/types';
import React from 'react';
import { useOnboarding } from './useOnboarding';

export const useSettings = () => {
    const { showOnboarding, storeOnboarding } = useOnboarding();
    const [firstName, setFirstName] = React.useState('');
    const [gender, setGender] = React.useState('Select gender');
    const [height, setHeight] = React.useState(170);
    const [heightUnit, setHeightUnit] = React.useState<'cm' | 'ft'>('cm');
    const [weight, setWeight] = React.useState(60);
    const [weightUnit, setWeightUnit] = React.useState<'kg' | 'lb'>('kg');
    const [fitnessLevel, setFitnessLevel] = React.useState<FitnessLevel | null>(null);
    const [day, setDay] = React.useState('Day');
    const [month, setMonth] = React.useState('Month');
    const [year, setYear] = React.useState('Year');
    const [editing, setEditing] = React.useState<PageTitles | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let active = true;
        const timer = setTimeout(() => {
            void showOnboarding().then((data) => {
                if (!active || !data) return;
                setFirstName(data.firstName ?? '');
                setGender(data.gender ?? 'Select gender');
                setHeight(data.height ?? 170);
                setHeightUnit(data.heightUnit ?? 'cm');
                setWeight(data.weight ?? 60);
                setWeightUnit(data.weightUnit ?? 'kg');
                setFitnessLevel(data.fitnessLevel ?? null);
                if (data.dob) {
                    setDay(data.dob.day ?? 'Day');
                    setMonth(data.dob.month ?? 'Month');
                    setYear(data.dob.year ?? 'Year');
                }
            }).catch((error) => console.error('Failed to load onboarding data', error))
                .finally(() => { if (active) setLoading(false); });
        }, 3000);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [showOnboarding]);

    React.useEffect(() => {
        if (loading) return;
        const data: OnboardingData = {
            firstName, gender, height, heightUnit, weight, weightUnit, fitnessLevel,
            dob: { day, month, year },
        };
        void storeOnboarding(data).catch((error) => console.error('Failed to save onboarding data', error));
    }, [day, firstName, fitnessLevel, gender, height, heightUnit, loading, month, storeOnboarding, weight, weightUnit, year]);

    return {
        closeEditor: () => setEditing(null),
        day,
        editing,
        firstName,
        fitnessLevel,
        gender,
        height,
        heightUnit,
        loading,
        month,
        openEditor: setEditing,
        setDay,
        setFirstName,
        setFitnessLevel,
        setGender,
        setHeight,
        setHeightUnit,
        setMonth,
        setWeight,
        setWeightUnit,
        setYear,
        weight,
        weightUnit,
        year,
    };
};

export type SettingsController = ReturnType<typeof useSettings>;
