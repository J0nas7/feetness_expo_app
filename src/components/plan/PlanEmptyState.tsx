import { MyTheme } from '@/types/theme';
import { t } from '@/i18n';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function PlanEmptyState({ onCreate }: { onCreate: () => void }) {
    const theme = useTheme() as MyTheme;
    const styles = StyleSheet.create({
        container: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 90 },
        icon: { width: 76, height: 76, borderRadius: 38, backgroundColor: `${theme.colors.primary}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
        title: { color: theme.colors.text, fontSize: 23, fontWeight: '800', textAlign: 'center' },
        text: { color: theme.colors.tertiaryText, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, marginBottom: 24 },
        button: { backgroundColor: theme.colors.primary, paddingHorizontal: 22, paddingVertical: 15, borderRadius: 15 },
        buttonText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '800' },
    });
    return <View style={styles.container}>
        <View style={styles.icon}><FontAwesome5 name="calendar-plus" size={30} color={theme.colors.primary} /></View>
        <Text style={styles.title}>{t('plan.empty')}</Text>
        <Text style={styles.text}>{t('plan.emptyDescription')}</Text>
        <Pressable style={styles.button} onPress={onCreate}><Text style={styles.buttonText}>{t('plan.create')}</Text></Pressable>
    </View>;
}
