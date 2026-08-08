import { MyTheme } from '@/types/theme';
import { locale, t } from '@/i18n';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentPeriodIndex, PERIOD_PATTERN, periodIndex, Plan, sortPlans } from './model';
import { planCardHeight, PlanCard } from './PlanCard';
import { PlanEmptyState } from './PlanEmptyState';
import { PlanToolbar } from './PlanToolbar';
import { usePlans } from '@/hooks/usePlans';
import { useWorkouts } from '@/hooks/useWorkouts';

type PeriodProgress = Record<string, { distance: number; duration: number }>;

export function PlanListScreen() {
    const theme = useTheme() as MyTheme;
    const { plans, savePlans, refreshPlans } = usePlans();
    const { indexWorkouts } = useWorkouts();
    const [refreshing, setRefreshing] = useState(false);
    const [progressByPeriod, setProgressByPeriod] = useState<PeriodProgress>({});
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const scrollY = useRef(0);
    const selectionScrollRef = useRef<ScrollView>(null);
    const selectionRowRefs = useRef(new Map<string, View>());
    const selectionLayouts = useRef(new Map<string, { x: number; y: number; width: number; height: number }>());
    const insideRows = useRef(new Set<string>());

    const sortedPlans = useMemo(() => sortPlans(plans), [plans]);
    const pastPlans = useMemo(() => sortedPlans.filter((plan) => periodIndex(plan.period) < currentPeriodIndex), [sortedPlans]);
    const activePlans = useMemo(() => sortedPlans.filter((plan) => periodIndex(plan.period) >= currentPeriodIndex), [sortedPlans]);
    const allSelected = plans.length > 0 && selectedIds.length === plans.length;
    const localizedPeriod = (period: string) => {
        const match = PERIOD_PATTERN.exec(period);
        return match
            ? new Date(Number(match[2]), Number(match[1]) - 1).toLocaleString(locale === 'da' ? 'da-DK' : 'en-US', { month: 'short', year: 'numeric' })
            : period;
    };

    const refreshProgress = useCallback(async () => {
        const workouts = await indexWorkouts();
        const progress = workouts.reduce<PeriodProgress>((periods, workout) => {
            const workoutDate = new Date(workout.startTime);
            if (Number.isNaN(workoutDate.getTime())) return periods;

            const period = `${String(workoutDate.getMonth() + 1).padStart(2, '0')}-${workoutDate.getFullYear()}`;
            const totals = periods[period] ?? { distance: 0, duration: 0 };
            totals.distance += workout.distance / 1000;
            totals.duration += workout.elapsedTime / 3600;
            periods[period] = totals;
            return periods;
        }, {});
        setProgressByPeriod(progress);
    }, [indexWorkouts]);

    useFocusEffect(useCallback(() => {
        setSelectedIds([]);
        setBulkMode(false);
        void refreshProgress();
    }, [refreshProgress]));

    const toggleSelected = (id: string) => setSelectedIds((previous) =>
        previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );

    const checkSelectionPosition = (x: number, y: number) => {
        for (const [id, layout] of selectionLayouts.current) {
            const adjustedY = layout.y - scrollY.current;
            const inside = x >= layout.x && x <= layout.x + layout.width && y >= adjustedY && y <= adjustedY + layout.height;
            if (inside && !insideRows.current.has(id)) {
                insideRows.current.add(id);
                toggleSelected(id);
            } else if (!inside) {
                insideRows.current.delete(id);
            }
        }
    };

    const selectionGesture = Gesture.Pan().runOnJS(true)
        .onBegin((event) => checkSelectionPosition(event.absoluteX, event.absoluteY))
        .onUpdate((event) => checkSelectionPosition(event.absoluteX, event.absoluteY))
        .onEnd(() => insideRows.current.clear());

    const deletePlan = (plan: Plan) => Alert.alert(t('plan.delete.title'), t('plan.delete.warning'), [
        { text: t('common.actions.cancel'), style: 'cancel' },
        { text: t('common.actions.delete'), style: 'destructive', onPress: () => savePlans(plans.filter((item) => item.id !== plan.id)) },
    ]);

    const deleteSelected = () => Alert.alert(
        t(selectedIds.length === 1 ? 'plan.delete.selectedTitle' : 'plan.delete.selectedTitlePlural', { count: selectedIds.length }),
        t('plan.delete.warning'),
        [
            { text: t('common.actions.cancel'), style: 'cancel' },
            { text: t('common.actions.delete'), style: 'destructive', onPress: async () => {
                const selected = new Set(selectedIds);
                await savePlans(plans.filter((plan) => !selected.has(plan.id)));
                setSelectedIds([]);
            } },
        ]
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([refreshPlans(), refreshProgress()]);
        } finally {
            setRefreshing(false);
        }
    }, [refreshPlans, refreshProgress]);

    const styles = StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.colors.background },
        listFrame: { flex: 1, flexDirection: 'row' },
        selectionScroll: { width: '15%', flexGrow: 0, flexShrink: 0 },
        selectionContent: { paddingTop: 20, paddingLeft: 10, paddingRight: 6, paddingBottom: 110 },
        planScroll: { width: '85%', flexGrow: 0, flexShrink: 0 },
        planScrollFull: { width: '100%' },
        listContent: { paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: 110 },
        fixedHeader: { height: 50, flexDirection: 'row', alignItems: 'center' },
        historyTitle: { flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '800', marginLeft: 10 },
        countBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: theme.colors.border },
        countText: { color: theme.colors.tertiaryText, fontSize: 12, fontWeight: '700' },
        sectionHeading: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
        selectionRow: { marginBottom: 10, borderRadius: 12, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
        checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
        noActivePlans: { color: theme.colors.tertiaryText, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
        floatingButton: { position: 'absolute', width: 60, height: 60, bottom: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
        primaryFloating: { right: 20, backgroundColor: theme.colors.primary },
        dangerFloating: { left: 20, backgroundColor: theme.colors.notification },
    });

    const renderCard = (plan: Plan) => <PlanCard
        key={plan.id}
        plan={plan}
        completedAmount={progressByPeriod[plan.period]?.[plan.metric === 'distance' ? 'distance' : 'duration'] ?? 0}
        selected={selectedIds.includes(plan.id)}
        bulkMode={bulkMode}
        onSelect={() => toggleSelected(plan.id)}
        onCopy={() => router.push({ pathname: '/create-plan', params: { copyFrom: plan.id } })}
        onEdit={() => router.push({ pathname: '/edit-plan', params: { id: plan.id } })}
        onDelete={() => deletePlan(plan)}
    />;

    const renderSelectionRow = (plan: Plan) => <View
        key={plan.id}
        style={[styles.selectionRow, { height: planCardHeight(plan) }]}
        ref={(ref) => { if (ref) selectionRowRefs.current.set(plan.id, ref); }}
        onLayout={() => selectionRowRefs.current.get(plan.id)?.measureInWindow((x, y, width, height) => selectionLayouts.current.set(plan.id, { x, y, width, height }))}
    >
        <Pressable style={styles.checkbox} onPress={() => toggleSelected(plan.id)} accessibilityLabel={t('plan.accessibility.select', { period: localizedPeriod(plan.period) })}>
            {selectedIds.includes(plan.id) && <FontAwesome5 name="check" size={13} color={theme.colors.primary} />}
        </Pressable>
    </View>;

    return <SafeAreaView style={styles.safeArea}>
        <PlanToolbar
            bulkMode={bulkMode}
            selectedCount={selectedIds.length}
            allSelected={allSelected}
            hasPlans={plans.length > 0}
            onToggleAll={() => setSelectedIds(allSelected ? [] : plans.map((plan) => plan.id))}
            onToggleBulkMode={() => { setSelectedIds([]); setBulkMode((value) => !value); }}
        />

        {plans.length === 0 ? <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
        >
            <PlanEmptyState onCreate={() => router.push('/create-plan')} />
        </ScrollView> : <View style={styles.listFrame}>
            {bulkMode && <GestureDetector gesture={selectionGesture}>
                <ScrollView ref={selectionScrollRef} style={styles.selectionScroll} contentContainerStyle={styles.selectionContent} scrollEnabled={false} bounces={false}>
                    {pastPlans.length > 0 && <><View style={styles.fixedHeader} />{historyExpanded && pastPlans.map(renderSelectionRow)}</>}
                    <View style={styles.fixedHeader} />
                    {activePlans.map(renderSelectionRow)}
                </ScrollView>
            </GestureDetector>}

            <ScrollView
                style={[styles.planScroll, !bulkMode && styles.planScrollFull]}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
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
                    <Pressable style={styles.fixedHeader} onPress={() => { selectionLayouts.current.clear(); setHistoryExpanded((value) => !value); }}>
                        <FontAwesome5 name={historyExpanded ? 'chevron-down' : 'chevron-right'} size={14} color={theme.colors.tertiaryText} />
                        <Text style={styles.historyTitle}>{t('plan.history')}</Text>
                        <View style={styles.countBadge}><Text style={styles.countText}>{pastPlans.length}</Text></View>
                    </Pressable>
                    {historyExpanded && pastPlans.map(renderCard)}
                </>}
                <View style={styles.fixedHeader}><Text style={styles.sectionHeading}>{t('plan.current')}</Text></View>
                {activePlans.length > 0 ? activePlans.map(renderCard) : <Text style={styles.noActivePlans}>{t('plan.noCurrent')}</Text>}
            </ScrollView>
        </View>}

        {!bulkMode && plans.length > 0 && <Pressable style={[styles.floatingButton, styles.primaryFloating]} onPress={() => router.push('/create-plan')} accessibilityLabel={t('plan.accessibility.create')}>
            <FontAwesome5 name="plus" size={20} color={theme.colors.onPrimary} />
        </Pressable>}
        {bulkMode && selectedIds.length > 0 && <>
            <Pressable style={[styles.floatingButton, styles.dangerFloating]} onPress={deleteSelected} accessibilityLabel={t(selectedIds.length === 1 ? 'plan.accessibility.deleteSelected' : 'plan.accessibility.deleteSelectedPlural', { count: selectedIds.length })}><FontAwesome5 name="trash-alt" size={20} color="#FFFFFF" /></Pressable>
            <Pressable style={[styles.floatingButton, styles.primaryFloating]} onPress={() => router.push({ pathname: '/edit-bulk', params: { ids: selectedIds.join(',') } })} accessibilityLabel={t(selectedIds.length === 1 ? 'plan.accessibility.editSelected' : 'plan.accessibility.editSelectedPlural', { count: selectedIds.length })}><FontAwesome5 name="pencil-alt" size={20} color={theme.colors.onPrimary} /></Pressable>
        </>}
    </SafeAreaView>;
}
