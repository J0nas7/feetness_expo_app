import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { currentPeriodIndex, formatPeriod, periodIndex, Plan } from './model';

type Props = { plan: Plan; selected: boolean; bulkMode: boolean; onSelect: () => void; onCopy: () => void; onEdit: () => void; onDelete: () => void };

export function PlanCard({ plan, selected, bulkMode, onSelect, onCopy, onEdit, onDelete }: Props) {
    const theme = useTheme() as MyTheme;
    const current = periodIndex(plan.period) === currentPeriodIndex;
    const styles = StyleSheet.create({
        wrapper: { marginBottom: 10, borderRadius: 14, overflow: 'hidden' },
        card: { flexDirection: 'row', height: 88, padding: 15, borderRadius: 14, borderWidth: 2, borderColor: 'transparent', backgroundColor: theme.colors.background, alignItems: 'center' },
        current: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}0D` },
        selected: { borderColor: theme.colors.primary },
        body: { flex: 1 },
        titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        title: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
        badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: theme.colors.primary },
        badgeText: { color: theme.colors.onPrimary, fontSize: 10, fontWeight: '800' },
        detail: { color: theme.colors.tertiaryText, marginTop: 7 },
        actions: { height: 88, flexDirection: 'row' },
        action: { width: 70, alignItems: 'center', justifyContent: 'center', gap: 6 },
        actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    });
    const card = <Pressable style={[styles.card, current && styles.current, selected && styles.selected]} onPress={bulkMode ? onSelect : onEdit}>
        <View style={styles.body}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>{formatPeriod(plan.period)}</Text>
                {current && <View style={styles.badge}><Text style={styles.badgeText}>DENNE MÅNED</Text></View>}
            </View>
            <Text style={styles.detail}>Mål: {plan.goal} {plan.metric === 'distance' ? 'km' : 'timer'}</Text>
        </View>
    </Pressable>;

    if (bulkMode) return <View style={styles.wrapper}>{card}</View>;
    return <Swipeable containerStyle={styles.wrapper} overshootRight={false} renderRightActions={() => <View style={styles.actions}>
        <Pressable style={[styles.action, { backgroundColor: '#D99A00' }]} onPress={onCopy}><FontAwesome5 name="copy" size={17} color="#FFFFFF" /><Text style={styles.actionText}>Kopiér</Text></Pressable>
        <Pressable style={[styles.action, { backgroundColor: '#2563EB' }]} onPress={onEdit}><FontAwesome5 name="pencil-alt" size={17} color="#FFFFFF" /><Text style={styles.actionText}>Rediger</Text></Pressable>
        <Pressable style={[styles.action, { backgroundColor: theme.colors.notification }]} onPress={onDelete}><FontAwesome5 name="trash-alt" size={17} color="#FFFFFF" /><Text style={styles.actionText}>Slet</Text></Pressable>
    </View>}>{card}</Swipeable>;
}
