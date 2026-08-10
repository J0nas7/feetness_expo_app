import { SettingsController } from '@/hooks/useSettings';
import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    theme: MyTheme;
    settings: SettingsController;
}

export const SettingsOverview = ({ theme, settings }: Props) => {
    const styles = StyleSheet.create({
        title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: theme.colors.text },
        card: { padding: 16, borderRadius: 12, backgroundColor: theme.colors.card, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        label: { fontSize: 16, color: theme.colors.secondaryText },
        value: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text, marginTop: 4 },
    });
    const cards = [
        { page: 'FirstName' as const, label: 'First Name', value: settings.firstName || 'Not set' },
        { page: 'Gender' as const, label: 'Gender', value: settings.gender },
        { page: 'Height' as const, label: 'Height', value: `${settings.height} ${settings.heightUnit}` },
        { page: 'Weight' as const, label: 'Weight', value: `${settings.weight} ${settings.weightUnit}` },
        { page: 'FitnessLevel' as const, label: 'Fitness Level', value: settings.fitnessLevel ? settings.fitnessLevel.charAt(0).toUpperCase() + settings.fitnessLevel.slice(1) : 'Not set' },
        { page: 'DateOfBirth' as const, label: 'Date of Birth', value: `${settings.day}. ${settings.month} ${settings.year}` },
    ];

    return <>
        <Text style={styles.title}>Profile Settings</Text>
        {cards.map((card) => <Pressable key={card.page} style={styles.card} onPress={() => settings.openEditor(card.page)}>
            <View>
                <Text style={styles.label}>{card.label}</Text>
                <Text style={styles.value}>{card.value}</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={20} />
        </Pressable>)}
    </>;
};
