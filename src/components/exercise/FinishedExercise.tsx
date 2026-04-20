import { RenderNavigation, RenderSummary, RenderTime } from '@/components/exercise/finishedExercise/index';
import { Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FinishedExerciseProps {
    workout: Workout;
}

export const FinishedExercise: React.FC<FinishedExerciseProps> = ({ workout }) => {
    const theme = useTheme() as MyTheme;

    const [activeTab, setActiveTab] = useState<'summary' | 'time' | 'media'>('summary');

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView edges={['left', 'right']} style={{ flex: 1 }}>
                {activeTab === 'summary' && <RenderSummary workout={workout} />}
                {activeTab === 'time' && <RenderTime workout={workout} />}
                {activeTab === 'media' && <></>}
            </SafeAreaView>

            <RenderNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
        </View>
    );
};
