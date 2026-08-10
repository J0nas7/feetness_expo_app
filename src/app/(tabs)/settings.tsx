import { BigLogo } from '@/components';
import { SettingsEditor, SettingsOverview } from '@/components/settings';
import { useSettings } from '@/hooks/useSettings';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const theme = useTheme() as MyTheme;
    const settings = useSettings();
    const styles = StyleSheet.create({
        loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
    });

    if (settings.loading) return <View style={styles.loading}><BigLogo size={200} animated /></View>;

    return <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
            <SettingsOverview theme={theme} settings={settings} />
            <SettingsEditor theme={theme} settings={settings} />
        </ScrollView>
    </SafeAreaView>;
}
