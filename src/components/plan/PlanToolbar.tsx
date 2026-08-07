import { MyTheme } from '@/types/theme';
import { t } from '@/i18n';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { bulkMode: boolean; selectedCount: number; allSelected: boolean; hasPlans: boolean; onToggleAll: () => void; onToggleBulkMode: () => void };

export function PlanToolbar(props: Props) {
    const theme = useTheme() as MyTheme;
    const styles = StyleSheet.create({
        toolbar: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
        title: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
        actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
        action: { color: theme.colors.primary, fontWeight: '700' },
    });
    return <View style={styles.toolbar}>
        <Text style={styles.title}>{props.bulkMode ? t('plan.toolbar.selected', { count: props.selectedCount }) : t('plan.title')}</Text>
        <View style={styles.actions}>
            {props.bulkMode && <Pressable onPress={props.onToggleAll}><Text style={styles.action}>{t(props.allSelected ? 'plan.toolbar.deselectAll' : 'plan.toolbar.selectAll')}</Text></Pressable>}
            {props.hasPlans && <Pressable onPress={props.onToggleBulkMode}><Text style={styles.action}>{t(props.bulkMode ? 'plan.toolbar.done' : 'plan.toolbar.edit')}</Text></Pressable>}
        </View>
    </View>;
}
