import { ActivityModal, Controls, Map } from '@/components/startpage';
import { useStartpage } from '@/hooks/useStartpage';
import { createStartpageStyles } from '@/styles/modules/StartpageStyles';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';

export default function StartScreen() {
    const theme = useTheme() as MyTheme;
    const startpage = useStartpage();
    const styles = createStartpageStyles(theme);

    return <View style={styles.container}>
        <Map theme={theme} location={startpage.location} />
        <Controls
            theme={theme}
            onStart={startpage.startWorkout}
            {...startpage}
        />
        <ActivityModal
            theme={theme}
            visible={startpage.activityModalVisible}
            onClose={startpage.closeActivityModal}
            onSelect={startpage.selectActivity}
        />
    </View>;
}
