import { activityName, locale, t } from '@/i18n';
import { useExercise } from '@/hooks/useExercise';
import { MyTheme } from '@/types/theme';
import { ExerciseType, Workout } from '@/types/WorkoutDTO';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { Href, router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXERCISE_ICON: Record<ExerciseType, string> = {
    running: '🏃‍♂️',
    cycling: '🚴‍♀️',
    walking: '🚶‍♂️',
};

const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${minutes}:${String(secs).padStart(2, '0')}`;
};

export default function PeriodList() {
    const theme = useTheme() as MyTheme;
    const { showActionSheetWithOptions } = useActionSheet();
    const { bulkDestroyWorkouts, destroyWorkout, readWorkoutsByPeriod } = useExercise();
    const params = useLocalSearchParams<{ title?: string; year?: string; month?: string; week?: string }>();
    const [workouts, setWorkouts] = React.useState<Workout[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [bulkMode, setBulkMode] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const scrollY = React.useRef(0);
    const selectionScrollRef = React.useRef<ScrollView>(null);
    const selectionRowRefs = React.useRef(new Map<number, View>());
    const selectionLayouts = React.useRef(new Map<number, { x: number; y: number; width: number; height: number }>());
    const insideRows = React.useRef(new Set<number>());
    const localeTag = locale === 'da' ? 'da-DK' : 'en-US';
    const longestIds = React.useMemo(
        () => [...workouts].sort((a, b) => b.distance - a.distance).slice(0, 3).map((workout) => workout.id),
        [workouts]
    );

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        toolbar: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
        toolbarTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
        toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
        toolbarAction: { color: theme.colors.primary, fontWeight: '700' },
        listFrame: { flex: 1, flexDirection: 'row' },
        selectionScroll: { width: '15%', flexGrow: 0, flexShrink: 0 },
        selectionContent: { paddingTop: 16, paddingLeft: 10, paddingRight: 6, paddingBottom: 110 },
        workoutScroll: { width: '85%', flexGrow: 0, flexShrink: 0 },
        workoutScrollFull: { width: '100%' },
        content: { padding: 16, paddingBottom: 110 },
        empty: { color: theme.colors.secondaryText, textAlign: 'center', marginTop: 40 },
        skeletonCard: { height: 82, borderRadius: 12, marginBottom: 8, backgroundColor: theme.colors.surface },
        skeletonLine: { height: 10, borderRadius: 5, marginLeft: 52, backgroundColor: theme.colors.border },
        workoutCard: {
            flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: theme.colors.surface,
            borderRadius: 12, marginBottom: 8, height: 82, boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.6)',
        },
        selectedCard: { borderWidth: 2, borderColor: theme.colors.primary },
        selectionRow: { height: 82, marginBottom: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
        checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
        workoutIcon: { fontSize: 24, marginRight: 12 },
        workoutTitle: { fontWeight: '600', color: theme.colors.text },
        workoutMeta: { fontSize: 12, color: theme.colors.tertiaryText },
        goalStatus: { fontSize: 18, marginLeft: 8 },
        action: { width: 80, justifyContent: 'center', alignItems: 'center' },
        actionText: { color: 'white', fontWeight: '600' },
        floatingButton: { position: 'absolute', width: 60, height: 60, bottom: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
        primaryFloating: { right: 20, backgroundColor: theme.colors.primary },
        dangerFloating: { left: 20, backgroundColor: theme.colors.notification },
    });

    const workoutPeriod = React.useMemo(() => ({
        year: params.year,
        month: params.month,
        week: params.week,
    }), [params.month, params.week, params.year]);

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;
            readWorkoutsByPeriod(workoutPeriod)
                .then((periodWorkouts) => {
                    if (isActive) setWorkouts(periodWorkouts);
                })
                .finally(() => {
                    if (isActive) setIsLoading(false);
                });
            return () => { isActive = false; };
        }, [readWorkoutsByPeriod, workoutPeriod])
    );

    useFocusEffect(React.useCallback(() => {
        setSelectedIds([]);
        setBulkMode(false);
    }, []));

    const refreshWorkouts = React.useCallback(async () => {
        setIsRefreshing(true);
        try {
            setWorkouts(await readWorkoutsByPeriod(workoutPeriod));
        } finally {
            setIsRefreshing(false);
        }
    }, [readWorkoutsByPeriod, workoutPeriod]);

    const confirmBulkDestroy = () => Alert.alert(
        t(selectedIds.length === 1 ? 'progress.bulkDelete.title' : 'progress.bulkDelete.titlePlural', { count: selectedIds.length }),
        t('progress.bulkDelete.warning'),
        [
            { text: t('common.actions.cancel'), style: 'cancel' },
            {
                text: t('common.actions.delete'), style: 'destructive', onPress: async () => {
                    const selected = new Set(selectedIds);
                    await bulkDestroyWorkouts(selectedIds);
                    setWorkouts((current) => current.filter((workout) => !selected.has(workout.id)));
                    setSelectedIds([]);
                    setBulkMode(false);
                },
            },
        ]
    );

    const toggleSelected = (id: number) => setSelectedIds((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
    const allSelected = workouts.length > 0 && selectedIds.length === workouts.length;

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

    const confirmDelete = (workout: Workout) => {
        showActionSheetWithOptions({
            options: [t('progress.deleteWorkout.action'), t('common.actions.cancel')],
            destructiveButtonIndex: 0,
            cancelButtonIndex: 1,
            title: t('progress.deleteWorkout.title'),
        }, (selectedIndex) => {
            if (selectedIndex === 0) {
                void destroyWorkout(workout).then(() => {
                    setWorkouts((current) => current.filter((item) => item.id !== workout.id));
                });
            }
        });
    };

    const renderRightActions = (workout: Workout) => (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Pressable
                style={[styles.action, { backgroundColor: '#3b82f6', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }]}
                onPress={() => router.push({ pathname: '/edit-workout', params: { workout: JSON.stringify(workout) } })}
            >
                <Text style={styles.actionText}>{t('common.actions.edit')}</Text>
            </Pressable>
            <Pressable
                style={[styles.action, { backgroundColor: '#ef4444', borderTopRightRadius: 12, borderBottomRightRadius: 12 }]}
                onPress={() => confirmDelete(workout)}
            >
                <Text style={styles.actionText}>{t('common.actions.delete')}</Text>
            </Pressable>
        </View>
    );

    const renderSelectionRow = (workout: Workout) => (
        <View
            key={workout.id}
            style={styles.selectionRow}
            ref={(ref) => { if (ref) selectionRowRefs.current.set(workout.id, ref); }}
            onLayout={() => selectionRowRefs.current.get(workout.id)?.measureInWindow((x, y, width, height) => {
                selectionLayouts.current.set(workout.id, { x, y, width, height });
            })}
        >
            <Pressable style={styles.checkbox} onPress={() => toggleSelected(workout.id)} accessibilityLabel={t('progress.accessibility.selectWorkout')}>
                {selectedIds.includes(workout.id) && <FontAwesome5 name="check" size={13} color={theme.colors.primary} />}
            </Pressable>
        </View>
    );

    const renderWorkout = (workout: Workout) => {
        const medalIndex = longestIds.indexOf(workout.id);
        const card = (
            <Pressable
                style={[styles.workoutCard, selectedIds.includes(workout.id) && styles.selectedCard]}
                onPress={bulkMode
                    ? () => toggleSelected(workout.id)
                    : () => router.push({ pathname: '/finished-exercise', params: { workout: JSON.stringify(workout) } })}
            >
                <Text style={styles.workoutIcon}>{EXERCISE_ICON[workout.exercise]}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.workoutTitle} numberOfLines={1}>
                        {activityName(workout.exercise)} · {t('progress.workoutGoal', {
                            amount: workout.goalAmount,
                            unit: workout.goalMetric === 'distance' ? 'km' : 'min',
                        })}{' '}
                        <Text style={[styles.goalStatus, { color: workout.percentage >= 100 ? theme.colors.success : theme.colors.notification }]}>
                            {workout.percentage >= 100 ? '✓' : '•'}
                        </Text>
                    </Text>
                    <Text style={styles.workoutMeta}>{(workout.distance / 1000).toFixed(1)} km · {formatDuration(workout.elapsedTime)}</Text>
                    <Text style={styles.workoutMeta}>{new Date(workout.startTime).toLocaleDateString(localeTag)}</Text>
                </View>
                <Text>{medalIndex === 0 ? '🥇' : medalIndex === 1 ? '🥈' : medalIndex === 2 ? '🥉' : ''}</Text>
            </Pressable>
        );
        return bulkMode ? <View key={workout.id}>{card}</View> : (
            <Swipeable key={workout.id} renderRightActions={() => renderRightActions(workout)} overshootRight={false}>{card}</Swipeable>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen options={{ title: params.title || t('progress.workoutListTitle') }} />
            <View style={styles.toolbar}>
                <Text style={styles.toolbarTitle}>{bulkMode ? t('progress.toolbar.selected', { count: selectedIds.length }) : t('progress.workoutListTitle')}</Text>
                <View style={styles.toolbarActions}>
                    {bulkMode && <Pressable onPress={() => setSelectedIds(allSelected ? [] : workouts.map((workout) => workout.id))}>
                        <Text style={styles.toolbarAction}>{t(allSelected ? 'progress.toolbar.deselectAll' : 'progress.toolbar.selectAll')}</Text>
                    </Pressable>}
                    {!!workouts.length && <Pressable onPress={() => { setSelectedIds([]); setBulkMode((value) => !value); }}>
                        <Text style={styles.toolbarAction}>{t(bulkMode ? 'progress.toolbar.done' : 'progress.toolbar.edit')}</Text>
                    </Pressable>}
                </View>
            </View>
            <View style={styles.listFrame}>
                {bulkMode && <GestureDetector gesture={selectionGesture}>
                    <ScrollView ref={selectionScrollRef} style={styles.selectionScroll} contentContainerStyle={styles.selectionContent} scrollEnabled={false} bounces={false}>
                        {workouts.map(renderSelectionRow)}
                    </ScrollView>
                </GestureDetector>}
                <ScrollView
                    style={[styles.workoutScroll, !bulkMode && styles.workoutScrollFull]}
                    contentContainerStyle={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refreshWorkouts}
                            tintColor={theme.colors.primary}
                            colors={[theme.colors.primary]}
                        />
                    }
                    onScroll={(event) => {
                        const y = event.nativeEvent.contentOffset.y;
                        scrollY.current = y;
                        selectionScrollRef.current?.scrollTo({ y, animated: false });
                    }}
                    scrollEventThrottle={16}
                >
                {isLoading && [0, 1, 2].map((item) => (
                    <View key={item} style={[styles.skeletonCard, { justifyContent: 'center', gap: 9 }]}>
                        <View style={[styles.skeletonLine, { width: '55%' }]} />
                        <View style={[styles.skeletonLine, { width: '35%' }]} />
                        <View style={[styles.skeletonLine, { width: '25%' }]} />
                    </View>
                ))}
                {!isLoading && !workouts.length && <Text style={styles.empty}>{t('progress.emptyWorkoutList')}</Text>}
                {!isLoading && workouts.map(renderWorkout)}
                </ScrollView>
            </View>
            {bulkMode && selectedIds.length > 0 && <>
                <Pressable style={[styles.floatingButton, styles.dangerFloating]} onPress={confirmBulkDestroy} accessibilityLabel={t('progress.accessibility.deleteSelected', { count: selectedIds.length })}>
                    <FontAwesome5 name="trash-alt" size={20} color="#FFFFFF" />
                </Pressable>
                <Pressable style={[styles.floatingButton, styles.primaryFloating]} onPress={() => router.push({ pathname: '/edit-workouts-bulk', params: { ids: selectedIds.join(',') } } as unknown as Href)} accessibilityLabel={t('progress.accessibility.editSelected', { count: selectedIds.length })}>
                    <FontAwesome5 name="pencil-alt" size={20} color={theme.colors.onPrimary} />
                </Pressable>
            </>}
        </SafeAreaView>
    );
}
