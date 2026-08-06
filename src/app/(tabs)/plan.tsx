import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const STORAGE_KEY = 'plans';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

type CrudMode = 'LIST' | 'CREATE' | 'EDIT';

type Metric = 'distance' | 'duration';

type Plan = {
    id: string;
    period: string;
    metric: Metric;
    goal: number;
};

const DEMO_PLANS: Plan[] = [
    { id: '1', period: 'Januar', metric: 'distance', goal: 80 },
    { id: '2', period: 'Februar', metric: 'duration', goal: 12 },
    { id: '3', period: 'Marts', metric: 'distance', goal: 120 },
    { id: '4', period: 'April', metric: 'duration', goal: 15 },
    { id: '5', period: 'Maj', metric: 'distance', goal: 150 },
    { id: '6', period: 'Juni', metric: 'duration', goal: 18 },
    { id: '7', period: 'Juli', metric: 'distance', goal: 200 },
    { id: '8', period: 'August', metric: 'duration', goal: 20 },
    { id: '9', period: 'September', metric: 'distance', goal: 175 },
    { id: '10', period: 'Oktober', metric: 'duration', goal: 16 },
    { id: '11', period: 'November', metric: 'distance', goal: 130 },
    { id: '12', period: 'December', metric: 'duration', goal: 14 },
    { id: '13', period: 'Forår 2027', metric: 'distance', goal: 300 },
    { id: '14', period: 'Sommer 2027', metric: 'duration', goal: 30 },
    { id: '15', period: 'Efterår 2027', metric: 'distance', goal: 250 },
    { id: '16', period: 'Vinter 2027', metric: 'duration', goal: 25 },
    { id: '17', period: 'Halvmaraton', metric: 'distance', goal: 500 },
    { id: '18', period: 'Ironman-træning', metric: 'duration', goal: 40 },
    { id: '19', period: 'Maratonblok', metric: 'distance', goal: 650 },
    { id: '20', period: 'Årsmål 2027', metric: 'distance', goal: 2500 },
];

const currentDate = new Date();

export default function PlanScreen() {
    const theme = useTheme() as MyTheme;
    const insets = useSafeAreaInsets();

    const [plans, setPlans] = useState<Plan[]>([]);

    const [mode, setMode] = useState<CrudMode>('LIST');
    const [displayBulkMode, setDisplayBulkMode] = useState<boolean>(false);
    const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());

    const [metric, setMetric] = useState<Metric>('distance');
    const [goal, setGoal] = useState('');

    const scrollY = useRef(0);
    const leftScrollRef = useRef<ScrollView>(null);
    const rightScrollRef = useRef<ScrollView>(null);

    const cardRefs = useRef(new Map<string, View>());
    const insideCards = useRef(new Set<string>());
    const layouts = useRef(new Map<
        string,
        { x: number; y: number; width: number; height: number }
    >());

    const checkPosition = (x: number, y: number) => {
        for (const [id, layout] of layouts.current) {
            const adjustedY = layout.y - scrollY.current;

            const inside =
                x >= layout.x &&
                x <= layout.x + layout.width &&
                y >= adjustedY &&
                y <= adjustedY + layout.height;

            if (inside) {
                if (!insideCards.current.has(id)) {
                    insideCards.current.add(id);
                    toggleSelected(id);
                }
            } else {
                insideCards.current.delete(id);
            }
        }
    };

    const gesture = Gesture.Pan()
        .runOnJS(true)
        .onBegin((e) => {
            console.log("begin");
            checkPosition(e.absoluteX, e.absoluteY);
        })
        .onUpdate((e) => {
            console.log("update");
            checkPosition(e.absoluteX, e.absoluteY);
        })
        .onEnd(() => {
            console.log("end");
            insideCards.current.clear()
        });

    const savePlans = async (newPlans: Plan[]) => {
        setPlans(newPlans);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));

        requestAnimationFrame(() => {
            leftScrollRef.current?.scrollToEnd({ animated: true });
            rightScrollRef.current?.scrollToEnd({ animated: true });
        });
    };

    const toggleSelected = (id: string) => {
        setSelectedPlans((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    useFocusEffect(
        useCallback(() => {
            setSelectedPlans([]);
        }, [displayBulkMode])
    );

    useFocusEffect(
        useCallback(() => {
            let mounted = true;

            const load = async () => {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);

                if (!mounted) return;

                if (stored) {
                    setPlans(JSON.parse(stored));
                } else {
                    setPlans(DEMO_PLANS);
                    await AsyncStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(DEMO_PLANS)
                    );
                }

                requestAnimationFrame(() => {
                    leftScrollRef.current?.scrollToEnd({ animated: true });
                    rightScrollRef.current?.scrollToEnd({ animated: true });
                });
            };

            load();

            return () => {
                mounted = false;
            };
        }, [])
    );

    const clearForm = () => {
        setEditingId(null);
        setMonth(currentDate.getMonth() + 1);
        setYear(currentDate.getFullYear());
        setMetric('distance');
        setGoal('');
    };

    const addOrUpdate = async () => {
        const numericGoal = Number(goal.replace(',', '.'));
        if (!goal.trim() || !Number.isFinite(numericGoal) || numericGoal <= 0) {
            Alert.alert('Ugyldigt mål', 'Indtast et tal, der er større end 0.');
            return;
        }

        const isBulkEditing = displayBulkMode && selectedPlans.length > 0;
        if (isBulkEditing) {
            const selectedIds = new Set(selectedPlans);
            await savePlans(plans.map((plan) =>
                selectedIds.has(plan.id)
                    ? { ...plan, metric, goal: numericGoal }
                    : plan
            ));
            setSelectedPlans([]);
            setDisplayBulkMode(false);
            clearForm();
            setMode('LIST');
            return;
        }

        const period = `${String(month).padStart(2, '0')}-${year}`;
        const duplicate = plans.some((plan) => plan.period === period && plan.id !== editingId);
        if (duplicate) {
            Alert.alert('Planen findes allerede', `Der er allerede en plan for ${period}.`);
            return;
        }
        const plan: Plan = { id: editingId ?? Date.now().toString(), period, metric, goal: numericGoal };
        await savePlans(editingId ? plans.map((item) => item.id === editingId ? plan : item) : [...plans, plan]);
        closeForm();
    };

    const editPlan = (plan: Plan) => {
        const match = /^(0[1-9]|1[0-2])-(\d{4})$/.exec(plan.period);
        setEditingId(plan.id);
        setMonth(match ? Number(match[1]) : currentDate.getMonth() + 1);
        setYear(match ? Number(match[2]) : currentDate.getFullYear());
        setMetric(plan.metric);
        setGoal(String(plan.goal));
        setMode('EDIT');
    };

    const deletePlan = async (id: string) => {
        Alert.alert('Slet plan?', '', [
            {
                text: 'Annuller',
                style: 'cancel',
            },
            {
                text: 'Slet',
                style: 'destructive',
                onPress: async () => {
                    const updated = plans.filter((p) => p.id !== id);
                    await savePlans(updated);

                    if (editingId === id) {
                        clearForm();
                        setMode("LIST");
                    }
                },
            },
        ]);
    };

    const deleteSelectedPlans = () => {
        const selectedCount = selectedPlans.length;

        Alert.alert(
            `Slet ${selectedCount} ${selectedCount === 1 ? 'plan' : 'planer'}?`,
            'Handlingen kan ikke fortrydes.',
            [
                { text: 'Annuller', style: 'cancel' },
                {
                    text: 'Slet',
                    style: 'destructive',
                    onPress: async () => {
                        const selectedIds = new Set(selectedPlans);
                        await savePlans(plans.filter((plan) => !selectedIds.has(plan.id)));
                        setSelectedPlans([]);
                    },
                },
            ]
        );
    };

    const closeForm = () => { clearForm(); setMode('LIST'); };

    const styles = StyleSheet.create({
        container: {
            padding: 20,
        },

        formContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 48 },
        header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
        backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
        headingWrap: { marginLeft: 14 },
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
        segmentedRow: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: theme.colors.background },
        segment: { flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 12, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
        segmentSelected: { backgroundColor: theme.colors.primary },
        segmentText: { color: theme.colors.tertiaryText, fontWeight: '700' },
        amountWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 15 },
        amountInput: { flex: 1, color: theme.colors.text, fontSize: 22, fontWeight: '700', paddingVertical: 14 },
        unit: { color: theme.colors.tertiaryText, fontSize: 16, fontWeight: '700' },
        saveButton: { backgroundColor: theme.colors.primary, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
        saveText: { color: theme.colors.background, fontSize: 16, fontWeight: '800' },
        deleteButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, marginTop: 14 },
        deleteText: { color: theme.colors.notification, fontWeight: '700' },

        bulkButton: {
            position: "absolute",
            margin: 20,
            zIndex: 10,
            top: insets.top + 12,
            left: "auto",
            right: 0
        },

        createButton: {
            position: "absolute",
            width: 60,
            height: 60,
            margin: 20,
            padding: 20,
            backgroundColor: theme.colors.primary,
            borderRadius: "100%",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            top: "auto",
            bottom: 0,
            left: "auto",
            right: 0
        },

        bulkDeleteButton: {
            position: "absolute",
            width: 60,
            height: 60,
            margin: 20,
            backgroundColor: theme.colors.notification,
            borderRadius: 30,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            bottom: 0,
            left: 0,
        },

        input: {
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
        },

        label: {
            fontWeight: '600',
            marginBottom: 6,
            marginTop: 6,
        },

        card: {
            flexDirection: "row",
            width: "98%", // Two cards per row
            height: 80,
            gap: 5,
            padding: 16,
            backgroundColor: "#fefefe",
            alignItems: "center"
        },

        title: {
            fontSize: 18,
            fontWeight: 'bold',
        },

        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 15,
        },

        metricRow: {
            flexDirection: 'row',
            gap: 10,
            marginBottom: 20,
        },

        metricButton: {
            flex: 1,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            alignItems: 'center',
        },

        metricSelected: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },

        metricText: {
            color: '#000',
        },

        metricSelectedText: {
            color: '#fff',
            fontWeight: 'bold',
        },
    });

    const renderForm = () => {
        const isBulkEditing = displayBulkMode && selectedPlans.length > 0;

        return (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                            <Pressable style={styles.yearButton} onPress={() => setYear((value) => value - 1)} accessibilityLabel="Forrige år">
                                <FontAwesome5 name="minus" size={14} color={theme.colors.text} />
                            </Pressable>
                            <Text style={styles.yearText}>{year}</Text>
                            <Pressable style={styles.yearButton} onPress={() => setYear((value) => value + 1)} accessibilityLabel="Næste år">
                                <FontAwesome5 name="plus" size={14} color={theme.colors.text} />
                            </Pressable>
                        </View>
                        <View style={styles.monthGrid}>
                            {MONTHS.map((name, index) => {
                                const selected = month === index + 1;
                                return <Pressable key={name} style={[styles.monthButton, selected && styles.monthSelected]} onPress={() => setMonth(index + 1)}>
                                    <Text style={[styles.monthText, selected && styles.selectedText]}>{name}</Text>
                                </Pressable>;
                            })}
                        </View>
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

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Planens mål</Text>
                        <View style={styles.amountWrap}>
                            <TextInput style={styles.amountInput} keyboardType="decimal-pad" value={goal} onChangeText={setGoal} placeholder="0" placeholderTextColor={theme.colors.tertiaryText} returnKeyType="done" />
                            <Text style={styles.unit}>{metric === 'distance' ? 'km' : 'timer'}</Text>
                        </View>
                    </View>

                    <Pressable style={styles.saveButton} onPress={addOrUpdate}>
                        <Text style={styles.saveText}>{isBulkEditing ? `Opdater ${selectedPlans.length} planer` : mode === 'EDIT' ? 'Gem ændringer' : `Opret plan for ${String(month).padStart(2, '0')}-${year}`}</Text>
                    </Pressable>
                    {mode === 'EDIT' && editingId && <Pressable style={styles.deleteButton} onPress={() => deletePlan(editingId)}>
                        <FontAwesome5 name="trash-alt" size={16} color={theme.colors.notification} />
                        <Text style={styles.deleteText}>Slet plan</Text>
                    </Pressable>}
                </ScrollView>
            </KeyboardAvoidingView>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {mode !== "LIST" ? renderForm() : <>
                <Pressable
                    onPress={() => {
                        setSelectedPlans([]);
                        setDisplayBulkMode(!displayBulkMode)
                    }}
                    style={styles.bulkButton}
                >
                    <Text style={{ color: theme.colors.primary }}>{displayBulkMode ? "OK" : "Rediger"}</Text>
                </Pressable>
                {!displayBulkMode ? (
                    <Pressable
                        onPress={() => {
                            clearForm();
                            setMode("CREATE");
                        }}
                        style={styles.createButton}
                    >
                        <FontAwesome5 name="plus" size="20" color="white" />
                    </Pressable>
                ) : displayBulkMode && selectedPlans.length > 0 ? (
                    <Pressable
                        onPress={() => {
                            clearForm();
                            setMode("EDIT");
                        }}
                        style={styles.createButton}
                    >
                        <FontAwesome5 name="pencil-alt" size="20" color="white" />
                    </Pressable>
                ) : null}
                {displayBulkMode && selectedPlans.length > 0 && (
                    <Pressable
                        onPress={deleteSelectedPlans}
                        style={styles.bulkDeleteButton}
                        accessibilityLabel={`Slet ${selectedPlans.length} valgte planer`}
                    >
                        <FontAwesome5 name="trash-alt" size={20} color="white" />
                    </Pressable>
                )}

                <View style={{ flexDirection: "row", gap: 3 }}>
                    {displayBulkMode && (
                        <GestureDetector gesture={gesture}>
                            <ScrollView
                                contentContainerStyle={styles.container}
                                scrollEnabled={false}
                                ref={leftScrollRef}
                                style={{ width: 80 }}
                            >
                                <View style={{ height: 25 }} />

                                <View>
                                    {plans.map((plan) => (
                                        <View
                                            key={plan.id}
                                            style={{
                                                ...styles.card,
                                                justifyContent: "center",
                                                borderRadius: 8
                                            }}
                                            onLayout={() => {
                                                const ref = cardRefs.current.get(plan.id);

                                                ref?.measureInWindow((x, y, width, height) => {
                                                    layouts.current.set(plan.id, {
                                                        x,
                                                        y,
                                                        width,
                                                        height,
                                                    });
                                                });
                                            }}
                                            ref={(ref) => {
                                                if (ref) {
                                                    cardRefs.current.set(plan.id, ref);
                                                }
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: 11,
                                                    borderWidth: 2,
                                                    borderColor: theme.colors.primary,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                {selectedPlans.includes(plan.id) && (
                                                    <View
                                                        style={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: 6,
                                                            backgroundColor: theme.colors.primary,
                                                        }}
                                                    />
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </GestureDetector>
                    )}

                    <ScrollView
                        contentContainerStyle={styles.container}
                        ref={rightScrollRef}
                        onScroll={(e) => {
                            leftScrollRef.current?.scrollTo({
                                y: e.nativeEvent.contentOffset.y,
                                animated: false,
                            });
                            scrollY.current = e.nativeEvent.contentOffset.y;
                        }}
                        scrollEventThrottle={16}
                        bounces={false}
                        alwaysBounceVertical={false}
                    >
                        <View style={{ height: 25 }} />

                        {plans.map((plan) => {
                            const month = Number(plan.period.split("-")[0]);
                            const year = plan.period.split("-")[1];

                            return (
                                <Pressable
                                    key={plan.id}
                                    style={{
                                        ...styles.card,
                                        borderColor: selectedPlans.includes(plan.id) ? theme.colors.primary : "transparent",
                                        borderStyle: "solid",
                                        borderWidth: 2,
                                        borderRadius: 8
                                    }}
                                    onPress={() => !displayBulkMode ? editPlan(plan) : toggleSelected(plan.id)}
                                >
                                    <View
                                        style={{ width: "100%" }}
                                    >
                                        <Text style={styles.title}>
                                            {MONTHS[month - 1]} {year}
                                        </Text>

                                        <Text style={{ marginTop: 8 }}>
                                            Mål:{' '}
                                            {plan.metric === 'distance'
                                                ? 'distance'
                                                : 'varighed'}{' '}
                                            {plan.goal}{' '}
                                            {plan.metric === 'distance'
                                                ? 'km'
                                                : 'timer'}
                                        </Text>
                                    </View>
                                </Pressable>
                            )
                        })}
                    </ScrollView>
                </View>
            </>}
        </SafeAreaView>
    );
}
