import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BulkGoalMode, BulkOperation, Metric, MONTHS } from './model';

type Props = {
    month: number;
    year: number;
    metric: Metric;
    goal: string;
    isBulk: boolean;
    bulkGoalMode: BulkGoalMode;
    bulkOperation: BulkOperation;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
    onMetricChange: (metric: Metric) => void;
    onGoalChange: (goal: string) => void;
    onBulkGoalModeChange: (mode: BulkGoalMode) => void;
    onBulkOperationChange: (operation: BulkOperation) => void;
};

export function PlanFormFields(props: Props) {
    const theme = useTheme() as MyTheme;
    const styles = StyleSheet.create({
        section: { backgroundColor: theme.colors.background, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
        title: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
        yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
        yearButton: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
        yearText: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
        monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        monthButton: { width: '22.9%', minWidth: 58, paddingVertical: 11, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
        selectedButton: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
        buttonText: { color: theme.colors.text, fontWeight: '700' },
        selectedText: { color: theme.colors.onPrimary, fontWeight: '800' },
        segmented: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: theme.colors.border },
        segment: { flex: 1, flexDirection: 'row', gap: 7, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
        operations: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
        operation: { width: '48.5%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
        operationSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}18` },
        operationText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
        amount: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 15 },
        input: { flex: 1, color: theme.colors.text, fontSize: 22, fontWeight: '700', paddingVertical: 14 },
        unit: { color: theme.colors.tertiaryText, fontSize: 16, fontWeight: '700' },
        hint: { color: theme.colors.tertiaryText, fontSize: 13, lineHeight: 18, marginTop: 10 },
    });
    const operations: { value: BulkOperation; label: string }[] = [
        { value: 'add', label: 'Læg til' },
        { value: 'subtract', label: 'Træk fra' },
        { value: 'increasePercent', label: 'Forøg med %' },
        { value: 'decreasePercent', label: 'Reducer med %' },
    ];
    const isPercent = props.bulkOperation === 'increasePercent' || props.bulkOperation === 'decreasePercent';

    return <>
        {!props.isBulk && <View style={styles.section}>
            <Text style={styles.title}>Måned og år</Text>
            <View style={styles.yearRow}>
                <Pressable style={styles.yearButton} onPress={() => props.onYearChange(props.year - 1)} accessibilityLabel="Forrige år"><FontAwesome5 name="minus" size={14} color={theme.colors.text} /></Pressable>
                <Text style={styles.yearText}>{props.year}</Text>
                <Pressable style={styles.yearButton} onPress={() => props.onYearChange(props.year + 1)} accessibilityLabel="Næste år"><FontAwesome5 name="plus" size={14} color={theme.colors.text} /></Pressable>
            </View>
            <View style={styles.monthGrid}>{MONTHS.map((name, index) => {
                const selected = props.month === index + 1;
                return <Pressable key={name} style={[styles.monthButton, selected && styles.selectedButton]} onPress={() => props.onMonthChange(index + 1)}>
                    <Text style={[styles.buttonText, selected && styles.selectedText]}>{name}</Text>
                </Pressable>;
            })}</View>
        </View>}

        <View style={styles.section}>
            <Text style={styles.title}>Planens måleenhed</Text>
            <View style={styles.segmented}>{([['distance', 'road', 'Distance'], ['duration', 'clock', 'Varighed']] as const).map(([value, icon, label]) => {
                const selected = props.metric === value;
                return <Pressable key={value} style={[styles.segment, selected && styles.selectedButton]} onPress={() => props.onMetricChange(value)}>
                    <FontAwesome5 name={icon} size={15} color={selected ? theme.colors.onPrimary : theme.colors.tertiaryText} />
                    <Text style={[styles.buttonText, selected && styles.selectedText]}>{label}</Text>
                </Pressable>;
            })}</View>
        </View>

        {props.isBulk && <View style={styles.section}>
            <Text style={styles.title}>Sådan ændres målet</Text>
            <View style={styles.segmented}>
                {([['assign', 'Samme mål'], ['relative', 'Relativ ændring']] as const).map(([value, label]) => <Pressable key={value} style={[styles.segment, props.bulkGoalMode === value && styles.selectedButton]} onPress={() => props.onBulkGoalModeChange(value)}>
                    <Text style={[styles.buttonText, props.bulkGoalMode === value && styles.selectedText]}>{label}</Text>
                </Pressable>)}
            </View>
            {props.bulkGoalMode === 'relative' && <View style={styles.operations}>{operations.map((operation) => <Pressable key={operation.value} style={[styles.operation, props.bulkOperation === operation.value && styles.operationSelected]} onPress={() => props.onBulkOperationChange(operation.value)}>
                <Text style={styles.operationText}>{operation.label}</Text>
            </Pressable>)}</View>}
        </View>}

        <View style={styles.section}>
            <Text style={styles.title}>{props.isBulk && props.bulkGoalMode === 'relative' ? 'Ændring' : 'Planens mål'}</Text>
            <View style={styles.amount}>
                <TextInput style={styles.input} keyboardType="decimal-pad" value={props.goal} onChangeText={props.onGoalChange} placeholder="0" placeholderTextColor={theme.colors.tertiaryText} returnKeyType="done" />
                <Text style={styles.unit}>{props.isBulk && props.bulkGoalMode === 'relative' && isPercent ? '%' : props.metric === 'distance' ? 'km' : 'timer'}</Text>
            </View>
            {props.isBulk && <Text style={styles.hint}>{props.bulkGoalMode === 'assign' ? 'Alle valgte planer får det samme mål og den valgte måleenhed.' : 'Ændringen beregnes ud fra hver plans nuværende mål.'}</Text>}
        </View>
    </>;
}
