import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEY = 'plans';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const PERIOD_PATTERN = /^(0[1-9]|1[0-2])-(\d{4})$/;

type CrudMode = 'LIST' | 'CREATE' | 'EDIT';
type Metric = 'distance' | 'duration';
type BulkGoalMode = 'assign' | 'relative';
type BulkOperation = 'add' | 'subtract' | 'increasePercent' | 'decreasePercent';
type Plan = { id: string; period: string; metric: Metric; goal: number };

const currentDate = new Date();
const currentPeriodIndex = currentDate.getFullYear() * 12 + currentDate.getMonth();

const periodIndex = (period: string) => {
    const match = PERIOD_PATTERN.exec(period);
    return match ? Number(match[2]) * 12 + Number(match[1]) - 1 : Number.MAX_SAFE_INTEGER;
};

const formatPeriod = (period: string) => {
    const match = PERIOD_PATTERN.exec(period);
    return match ? `${MONTHS[Number(match[1]) - 1]} ${match[2]}` : period;
};

export default function PlanScreen() {
    const theme = useTheme() as MyTheme;
    const [plans, setPlans] = useState<Plan[]>([]);
    const [mode, setMode] = useState<CrudMode>('LIST');
    const [displayBulkMode, setDisplayBulkMode] = useState(false);
    const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());
    const [metric, setMetric] = useState<Metric>('distance');
    const [goal, setGoal] = useState('');
    const [bulkGoalMode, setBulkGoalMode] = useState<BulkGoalMode>('assign');
    const [bulkOperation, setBulkOperation] = useState<BulkOperation>('add');
    const scrollY = useRef(0);
    const selectionScrollRef = useRef<ScrollView>(null);
    const planScrollRef = useRef<ScrollView>(null);
    const selectionRowRefs = useRef(new Map<string, View>());
    const selectionLayouts = useRef(new Map<string, { x: number; y: number; width: number; height: number }>());
    const insideRows = useRef(new Set<string>());

    const sortedPlans = useMemo(
        () => [...plans].sort((a, b) => periodIndex(a.period) - periodIndex(b.period)),
        [plans]
    );
    const pastPlans = useMemo(
        () => sortedPlans.filter((plan) => periodIndex(plan.period) < currentPeriodIndex),
        [sortedPlans]
    );
    const activePlans = useMemo(
        () => sortedPlans.filter((plan) => periodIndex(plan.period) >= currentPeriodIndex),
        [sortedPlans]
    );
    const allSelected = plans.length > 0 && selectedPlans.length === plans.length;
    const isBulkEditing = mode === 'EDIT' && displayBulkMode && selectedPlans.length > 0;

    const savePlans = async (newPlans: Plan[]) => {
        setPlans(newPlans);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
    };

    useFocusEffect(useCallback(() => {
        let mounted = true;
        const load = async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (mounted) setPlans(stored ? JSON.parse(stored) : []);
        };
        load();
        return () => { mounted = false; };
    }, []));

    const clearForm = () => {
        setEditingId(null);
        setMonth(currentDate.getMonth() + 1);
        setYear(currentDate.getFullYear());
        setMetric('distance');
        setGoal('');
        setBulkGoalMode('assign');
        setBulkOperation('add');
    };

    const closeForm = () => { clearForm(); setMode('LIST'); };

    const exitBulkMode = () => {
        clearForm();
        setSelectedPlans([]);
        setDisplayBulkMode(false);
        setMode('LIST');
    };

    const addOrUpdate = async () => {
        const numericGoal = Number(goal.replace(',', '.'));
        if (!goal.trim() || !Number.isFinite(numericGoal) || numericGoal <= 0) {
            Alert.alert('Ugyldigt mål', 'Indtast et tal, der er større end 0.');
            return;
        }

        if (isBulkEditing) {
            const selectedIds = new Set(selectedPlans);
            const calculateGoal = (originalGoal: number) => {
                if (bulkGoalMode === 'assign') return numericGoal;
                if (bulkOperation === 'add') return originalGoal + numericGoal;
                if (bulkOperation === 'subtract') return originalGoal - numericGoal;
                if (bulkOperation === 'increasePercent') return originalGoal * (1 + numericGoal / 100);
                return originalGoal * (1 - numericGoal / 100);
            };
            const invalidResult = plans.some((plan) => selectedIds.has(plan.id) && calculateGoal(plan.goal) <= 0);
            if (invalidResult) {
                Alert.alert('Ugyldigt resultat', 'Ændringen ville give mindst én plan et mål på 0 eller mindre.');
                return;
            }
            await savePlans(plans.map((plan) => selectedIds.has(plan.id)
                ? { ...plan, metric, goal: Number(calculateGoal(plan.goal).toFixed(2)) }
                : plan
            ));
            exitBulkMode();
            return;
        }

        const period = `${String(month).padStart(2, '0')}-${year}`;
        if (plans.some((plan) => plan.period === period && plan.id !== editingId)) {
            Alert.alert('Planen findes allerede', `Der er allerede en plan for ${period}.`);
            return;
        }
        const plan: Plan = { id: editingId ?? Date.now().toString(), period, metric, goal: numericGoal };
        await savePlans(editingId
            ? plans.map((item) => item.id === editingId ? plan : item)
            : [...plans, plan]
        );
        closeForm();
    };

    const editPlan = (plan: Plan) => {
        const match = PERIOD_PATTERN.exec(plan.period);
        setEditingId(plan.id);
        setMonth(match ? Number(match[1]) : currentDate.getMonth() + 1);
        setYear(match ? Number(match[2]) : currentDate.getFullYear());
        setMetric(plan.metric);
        setGoal(String(plan.goal));
        setMode('EDIT');
    };

    const copyPlan = (plan: Plan) => {
        let candidate = periodIndex(plan.period);
        if (!Number.isFinite(candidate) || candidate === Number.MAX_SAFE_INTEGER) candidate = currentPeriodIndex;
        do { candidate += 1; } while (plans.some((item) => periodIndex(item.period) === candidate));
        setEditingId(null);
        setMonth(candidate % 12 + 1);
        setYear(Math.floor(candidate / 12));
        setMetric(plan.metric);
        setGoal(String(plan.goal));
        setMode('CREATE');
    };

    const deletePlan = (id: string) => Alert.alert('Slet plan?', 'Handlingen kan ikke fortrydes.', [
        { text: 'Annuller', style: 'cancel' },
        { text: 'Slet', style: 'destructive', onPress: async () => { await savePlans(plans.filter((plan) => plan.id !== id)); closeForm(); } },
    ]);

    const deleteSelectedPlans = () => Alert.alert(
        `Slet ${selectedPlans.length} ${selectedPlans.length === 1 ? 'plan' : 'planer'}?`,
        'Handlingen kan ikke fortrydes.',
        [
            { text: 'Annuller', style: 'cancel' },
            {
                text: 'Slet', style: 'destructive', onPress: async () => {
                    const selectedIds = new Set(selectedPlans);
                    await savePlans(plans.filter((plan) => !selectedIds.has(plan.id)));
                    setSelectedPlans([]);
                }
            },
        ]
    );

    const toggleSelected = (id: string) => setSelectedPlans((previous) =>
        previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );

    const checkSelectionPosition = (x: number, y: number) => {
        for (const [id, layout] of selectionLayouts.current) {
            const adjustedY = layout.y - scrollY.current;
            const isInside = x >= layout.x
                && x <= layout.x + layout.width
                && y >= adjustedY
                && y <= adjustedY + layout.height;

            if (isInside && !insideRows.current.has(id)) {
                insideRows.current.add(id);
                toggleSelected(id);
            } else if (!isInside) {
                insideRows.current.delete(id);
            }
        }
    };

    const selectionGesture = Gesture.Pan()
        .runOnJS(true)
        .onBegin((event) => checkSelectionPosition(event.absoluteX, event.absoluteY))
        .onUpdate((event) => checkSelectionPosition(event.absoluteX, event.absoluteY))
        .onEnd(() => insideRows.current.clear());

    const styles = StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.colors.background },
        formContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 48 },
        header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
        backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
        headingWrap: { flex: 1, marginLeft: 14 },
        heading: { color: theme.colors.text, fontSize: 27, fontWeight: '800' },
        subtitle: { color: theme.colors.tertiaryText, marginTop: 2, fontSize: 14 },
        section: { backgroundColor: theme.colors.background, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
        sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
        yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
        yearButton: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
        yearText: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
        monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        monthButton: { width: '22.9%', minWidth: 58, paddingVertical: 11, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
        monthSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
        monthText: { color: theme.colors.text, fontWeight: '600' },
        selectedText: { color: theme.colors.background, fontWeight: '800' },
        segmentedRow: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: theme.colors.border },
        segment: { flex: 1, flexDirection: 'row', gap: 7, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
        segmentSelected: { backgroundColor: theme.colors.primary },
        segmentText: { color: theme.colors.tertiaryText, fontSize: 13, fontWeight: '700' },
        operationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
        operationButton: { width: '48.5%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
        operationSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}18` },
        operationText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
        amountWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 15 },
        amountInput: { flex: 1, color: theme.colors.text, fontSize: 22, fontWeight: '700', paddingVertical: 14 },
        unit: { color: theme.colors.tertiaryText, fontSize: 16, fontWeight: '700' },
        hint: { color: theme.colors.tertiaryText, fontSize: 13, lineHeight: 18, marginTop: 10 },
        saveButton: { backgroundColor: theme.colors.primary, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
        saveText: { color: theme.colors.background, fontSize: 16, fontWeight: '800' },
        deleteButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, marginTop: 14 },
        deleteText: { color: theme.colors.notification, fontWeight: '700' },
        toolbar: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
        toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
        toolbarTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
        toolbarButtonText: { color: theme.colors.primary, fontWeight: '700' },
        listFrame: { flex: 1, flexDirection: 'row' },
        selectionScroll: { width: '15%', flexGrow: 0, flexShrink: 0 },
        selectionContent: { paddingTop: 20, paddingLeft: 10, paddingRight: 6, paddingBottom: 110 },
        planScroll: { width: '85%', flexGrow: 0, flexShrink: 0 },
        planScrollFull: { width: '100%' },
        listContent: { paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: 110 },
        historyHeader: { height: 50, flexDirection: 'row', alignItems: 'center' },
        historyTitle: { flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '800' },
        countBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: theme.colors.border },
        countText: { color: theme.colors.tertiaryText, fontSize: 12, fontWeight: '700' },
        sectionHeader: { height: 50, justifyContent: 'center' },
        sectionHeading: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
        card: { flexDirection: 'row', height: 88, marginBottom: 10, padding: 15, borderRadius: 14, borderWidth: 2, borderColor: 'transparent', backgroundColor: theme.colors.background, alignItems: 'center' },
        currentCard: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}0D` },
        selectedCard: { borderColor: theme.colors.primary },
        selectionRow: { height: 88, marginBottom: 10, borderRadius: 12, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
        checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
        cardBody: { flex: 1 },
        cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
        currentBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: theme.colors.primary },
        currentBadgeText: { color: theme.colors.background, fontSize: 10, fontWeight: '800' },
        cardDetail: { color: theme.colors.tertiaryText, marginTop: 7 },
        copyButton: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
        emptyState: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 90 },
        emptyIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: `${theme.colors.primary}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
        emptyTitle: { color: theme.colors.text, fontSize: 23, fontWeight: '800', textAlign: 'center' },
        emptyText: { color: theme.colors.tertiaryText, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, marginBottom: 24 },
        emptyButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 22, paddingVertical: 15, borderRadius: 15 },
        floatingButton: { position: 'absolute', width: 60, height: 60, bottom: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
        primaryFloating: { right: 20, backgroundColor: theme.colors.primary },
        dangerFloating: { left: 20, backgroundColor: theme.colors.notification },
    });

    const renderForm = () => {
        const operationOptions: { value: BulkOperation; label: string }[] = [
            { value: 'add', label: 'Læg til' },
            { value: 'subtract', label: 'Træk fra' },
            { value: 'increasePercent', label: 'Forøg med %' },
            { value: 'decreasePercent', label: 'Reducer med %' },
        ];
        const isPercent = bulkOperation === 'increasePercent' || bulkOperation === 'decreasePercent';

        return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={closeForm} accessibilityLabel="Annuller">
                        <FontAwesome5 name="chevron-left" size={17} color={theme.colors.text} />
                    </Pressable>
                    <View style={styles.headingWrap}>
                        <Text style={styles.heading}>{isBulkEditing ? 'Rediger planer' : mode === 'EDIT' ? 'Rediger plan' : 'Ny månedsplan'}</Text>
                        <Text style={styles.subtitle}>{isBulkEditing ? `${selectedPlans.length} planer valgt` : 'Vælg måned, type og dit mål'}</Text>
                    </View>
                </View>

                {!isBulkEditing && <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Måned og år</Text>
                    <View style={styles.yearRow}>
                        <Pressable style={styles.yearButton} onPress={() => setYear((value) => value - 1)} accessibilityLabel="Forrige år"><FontAwesome5 name="minus" size={14} color={theme.colors.text} /></Pressable>
                        <Text style={styles.yearText}>{year}</Text>
                        <Pressable style={styles.yearButton} onPress={() => setYear((value) => value + 1)} accessibilityLabel="Næste år"><FontAwesome5 name="plus" size={14} color={theme.colors.text} /></Pressable>
                    </View>
                    <View style={styles.monthGrid}>{MONTHS.map((name, index) => {
                        const selected = month === index + 1;
                        return <Pressable key={name} style={[styles.monthButton, selected && styles.monthSelected]} onPress={() => setMonth(index + 1)}>
                            <Text style={[styles.monthText, selected && styles.selectedText]}>{name}</Text>
                        </Pressable>;
                    })}</View>
                </View>}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Planens måleenhed</Text>
                    <View style={styles.segmentedRow}>
                        {([['distance', 'road', 'Distance'], ['duration', 'clock', 'Varighed']] as const).map(([value, icon, label]) => {
                            const selected = metric === value;
                            return <Pressable key={value} style={[styles.segment, selected && styles.segmentSelected]} onPress={() => setMetric(value)}>
                                <FontAwesome5 name={icon} size={15} color={selected ? theme.colors.background : theme.colors.tertiaryText} />
                                <Text style={[styles.segmentText, selected && styles.selectedText]}>{label}</Text>
                            </Pressable>;
                        })}
                    </View>
                </View>

                {isBulkEditing && <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sådan ændres målet</Text>
                    <View style={styles.segmentedRow}>
                        <Pressable style={[styles.segment, bulkGoalMode === 'assign' && styles.segmentSelected]} onPress={() => setBulkGoalMode('assign')}>
                            <Text style={[styles.segmentText, bulkGoalMode === 'assign' && styles.selectedText]}>Samme mål</Text>
                        </Pressable>
                        <Pressable style={[styles.segment, bulkGoalMode === 'relative' && styles.segmentSelected]} onPress={() => setBulkGoalMode('relative')}>
                            <Text style={[styles.segmentText, bulkGoalMode === 'relative' && styles.selectedText]}>Relativ ændring</Text>
                        </Pressable>
                    </View>
                    {bulkGoalMode === 'relative' && <View style={styles.operationGrid}>{operationOptions.map((option) =>
                        <Pressable key={option.value} style={[styles.operationButton, bulkOperation === option.value && styles.operationSelected]} onPress={() => setBulkOperation(option.value)}>
                            <Text style={styles.operationText}>{option.label}</Text>
                        </Pressable>
                    )}</View>}
                </View>}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isBulkEditing && bulkGoalMode === 'relative' ? 'Ændring' : 'Planens mål'}</Text>
                    <View style={styles.amountWrap}>
                        <TextInput style={styles.amountInput} keyboardType="decimal-pad" value={goal} onChangeText={setGoal} placeholder="0" placeholderTextColor={theme.colors.tertiaryText} returnKeyType="done" />
                        <Text style={styles.unit}>{isBulkEditing && bulkGoalMode === 'relative' && isPercent ? '%' : metric === 'distance' ? 'km' : 'timer'}</Text>
                    </View>
                    {isBulkEditing && <Text style={styles.hint}>{bulkGoalMode === 'assign'
                        ? 'Alle valgte planer får det samme mål og den valgte måleenhed.'
                        : 'Ændringen beregnes ud fra hver plans nuværende mål.'}</Text>}
                </View>

                <Pressable style={styles.saveButton} onPress={addOrUpdate}>
                    <Text style={styles.saveText}>{isBulkEditing ? `Opdater ${selectedPlans.length} planer` : mode === 'EDIT' ? 'Gem ændringer' : `Opret plan for ${String(month).padStart(2, '0')}-${year}`}</Text>
                </Pressable>
                {mode === 'EDIT' && editingId && <Pressable style={styles.deleteButton} onPress={() => deletePlan(editingId)}>
                    <FontAwesome5 name="trash-alt" size={16} color={theme.colors.notification} />
                    <Text style={styles.deleteText}>Slet plan</Text>
                </Pressable>}
            </ScrollView>
        </KeyboardAvoidingView>;
    };

    const renderPlan = (plan: Plan) => {
        const selected = selectedPlans.includes(plan.id);
        const isCurrent = periodIndex(plan.period) === currentPeriodIndex;
        return <View key={plan.id} style={[styles.card, isCurrent && styles.currentCard, selected && styles.selectedCard]}>
            <Pressable style={styles.cardBody} onPress={() => displayBulkMode ? toggleSelected(plan.id) : editPlan(plan)}>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{formatPeriod(plan.period)}</Text>
                    {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>DENNE MÅNED</Text></View>}
                </View>
                <Text style={styles.cardDetail}>Mål: {plan.goal} {plan.metric === 'distance' ? 'km' : 'timer'}</Text>
            </Pressable>
            {!displayBulkMode && <Pressable style={styles.copyButton} onPress={() => copyPlan(plan)} accessibilityLabel={`Kopiér ${formatPeriod(plan.period)}`}>
                <FontAwesome5 name="copy" size={16} color={theme.colors.primary} />
            </Pressable>}
        </View>;
    };

    const renderSelectionRow = (plan: Plan) => {
        const selected = selectedPlans.includes(plan.id);
        return <View
            key={plan.id}
            style={styles.selectionRow}
            ref={(ref) => { if (ref) selectionRowRefs.current.set(plan.id, ref); }}
            onLayout={() => selectionRowRefs.current.get(plan.id)?.measureInWindow((x, y, width, height) => {
                selectionLayouts.current.set(plan.id, { x, y, width, height });
            })}
        >
            <Pressable style={styles.checkbox} onPress={() => toggleSelected(plan.id)} accessibilityLabel={`Vælg ${formatPeriod(plan.period)}`}>
                {selected && <FontAwesome5 name="check" size={13} color={theme.colors.primary} />}
            </Pressable>
        </View>;
    };

    return <SafeAreaView style={styles.safeArea}>
        {mode !== 'LIST' ? renderForm() : <>
            <View style={styles.toolbar}>
                <Text style={styles.toolbarTitle}>{displayBulkMode ? `${selectedPlans.length} valgt` : 'Månedsplaner'}</Text>
                <View style={styles.toolbarActions}>
                    {displayBulkMode && <Pressable onPress={() => setSelectedPlans(allSelected ? [] : plans.map((plan) => plan.id))}>
                        <Text style={styles.toolbarButtonText}>{allSelected ? 'Fravælg alle' : 'Vælg alle'}</Text>
                    </Pressable>}
                    {plans.length > 0 && <Pressable onPress={() => { setSelectedPlans([]); setDisplayBulkMode((value) => !value); }}>
                        <Text style={styles.toolbarButtonText}>{displayBulkMode ? 'OK' : 'Rediger'}</Text>
                    </Pressable>}
                </View>
            </View>

            {plans.length === 0 ? <View style={styles.emptyState}>
                <View style={styles.emptyIcon}><FontAwesome5 name="calendar-plus" size={30} color={theme.colors.primary} /></View>
                <Text style={styles.emptyTitle}>Din plan starter her</Text>
                <Text style={styles.emptyText}>Opret et månedligt mål for distance eller varighed, og hold fokus på din træning.</Text>
                <Pressable style={styles.emptyButton} onPress={() => { clearForm(); setMode('CREATE'); }}>
                    <Text style={styles.saveText}>Opret din første plan</Text>
                </Pressable>
            </View> : <View style={styles.listFrame}>
                {displayBulkMode && <GestureDetector gesture={selectionGesture}>
                    <ScrollView
                        ref={selectionScrollRef}
                        style={styles.selectionScroll}
                        contentContainerStyle={styles.selectionContent}
                        scrollEnabled={false}
                        bounces={false}
                    >
                        {pastPlans.length > 0 && <>
                            <View style={styles.historyHeader} />
                            {historyExpanded && pastPlans.map(renderSelectionRow)}
                        </>}
                        <View style={styles.sectionHeader} />
                        {activePlans.map(renderSelectionRow)}
                    </ScrollView>
                </GestureDetector>}

                <ScrollView
                    ref={planScrollRef}
                    style={[styles.planScroll, !displayBulkMode && styles.planScrollFull]}
                    contentContainerStyle={styles.listContent}
                    onScroll={(event) => {
                        const y = event.nativeEvent.contentOffset.y;
                        scrollY.current = y;
                        selectionScrollRef.current?.scrollTo({ y, animated: false });
                    }}
                    scrollEventThrottle={16}
                    bounces={false}
                    alwaysBounceVertical={false}
                >
                    {pastPlans.length > 0 && <>
                        <Pressable style={styles.historyHeader} onPress={() => {
                            selectionLayouts.current.clear();
                            setHistoryExpanded((value) => !value);
                        }}>
                            <FontAwesome5 name={historyExpanded ? 'chevron-down' : 'chevron-right'} size={14} color={theme.colors.tertiaryText} />
                            <Text style={[styles.historyTitle, { marginLeft: 10 }]}>Historik</Text>
                            <View style={styles.countBadge}><Text style={styles.countText}>{pastPlans.length}</Text></View>
                        </Pressable>
                        {historyExpanded && pastPlans.map(renderPlan)}
                    </>}
                    <View style={styles.sectionHeader}><Text style={styles.sectionHeading}>Aktuelle og kommende</Text></View>
                    {activePlans.length > 0
                        ? activePlans.map(renderPlan)
                        : <Text style={styles.emptyText}>Der er ingen aktuelle eller kommende planer endnu.</Text>}
                </ScrollView>
            </View>}

            {!displayBulkMode && plans.length > 0 && <Pressable style={[styles.floatingButton, styles.primaryFloating]} onPress={() => { clearForm(); setMode('CREATE'); }} accessibilityLabel="Opret plan">
                <FontAwesome5 name="plus" size={20} color="white" />
            </Pressable>}
            {displayBulkMode && selectedPlans.length > 0 && <>
                <Pressable style={[styles.floatingButton, styles.dangerFloating]} onPress={deleteSelectedPlans} accessibilityLabel={`Slet ${selectedPlans.length} valgte planer`}>
                    <FontAwesome5 name="trash-alt" size={20} color="white" />
                </Pressable>
                <Pressable style={[styles.floatingButton, styles.primaryFloating]} onPress={() => { clearForm(); setMode('EDIT'); }} accessibilityLabel={`Rediger ${selectedPlans.length} valgte planer`}>
                    <FontAwesome5 name="pencil-alt" size={20} color="white" />
                </Pressable>
            </>}
        </>}
    </SafeAreaView>;
}
