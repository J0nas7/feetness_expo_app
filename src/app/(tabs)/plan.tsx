import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import {
    Alert,
    Button,
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

export default function PlanScreen() {
    const theme = useTheme() as MyTheme;
    const insets = useSafeAreaInsets();

    const styles = StyleSheet.create({
        container: {
            padding: 20,
        },

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

    const [plans, setPlans] = useState<Plan[]>([]);

    const [mode, setMode] = useState<CrudMode>('LIST');
    const [displayBulkMode, setDisplayBulkMode] = useState<boolean>(false);
    const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [period, setPeriod] = useState('');
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
        setPeriod('');
        setMetric('distance');
        setGoal('');
    };

    const addOrUpdate = async () => {
        if (!period.trim()) {
            Alert.alert('Periode mangler');
            return;
        }

        if (!goal.trim()) {
            Alert.alert('Mål mangler');
            return;
        }

        const plan: Plan = {
            id: editingId ?? Date.now().toString(),
            period,
            metric,
            goal: Number(goal),
        };

        if (editingId) {
            const updated = plans.map((p) =>
                p.id === editingId ? plan : p
            );

            await savePlans(updated);
        } else {
            await savePlans([...plans, plan]);
        }

        clearForm();
        setMode("LIST");
    };

    const editPlan = (plan: Plan) => {
        setEditingId(plan.id);
        setPeriod(plan.period);
        setMetric(plan.metric);
        setGoal(plan.goal.toString());

        setMode("EDIT");
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

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {mode === "CREATE" ? (
                <View style={styles.container}>
                    <Text style={styles.label}>Periode</Text>

                    <TextInput
                        style={styles.input}
                        value={period}
                        onChangeText={setPeriod}
                        placeholder="Fx. August"
                    />

                    <Text style={styles.label}>Type</Text>

                    <View style={styles.metricRow}>
                        <View style={{ flex: 1 }}>
                            <Button
                                title="Distance"
                                onPress={() => setMetric('distance')}
                                color={
                                    metric === 'distance'
                                        ? theme.colors.primary
                                        : '#999'
                                }
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Button
                                title="Varighed"
                                onPress={() => setMetric('duration')}
                                color={
                                    metric === 'duration'
                                        ? theme.colors.primary
                                        : '#999'
                                }
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>
                        Mål ({metric === 'distance' ? 'km' : 'timer'})
                    </Text>

                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={goal}
                        onChangeText={setGoal}
                        placeholder="100"
                    />

                    <Button
                        title={
                            editingId
                                ? 'Opdater plan'
                                : 'Gem plan'
                        }
                        onPress={addOrUpdate}
                    />

                    <View style={{ height: 12 }} />

                    <Button
                        title="Annuller"
                        color="gray"
                        onPress={() => {
                            clearForm();
                            setMode("LIST");
                        }}
                    />
                </View>
            ) : mode === "EDIT" ? (
                <ScrollView
                    contentContainerStyle={[
                        styles.container,
                        {
                            paddingBottom: 100,
                        },
                    ]}
                >
                    <Text
                        style={{
                            fontSize: 28,
                            fontWeight: "700",
                            marginBottom: 24,
                        }}
                    >
                        Rediger plan
                    </Text>

                    <Text style={styles.label}>Periode</Text>

                    <TextInput
                        style={styles.input}
                        value={period}
                        onChangeText={setPeriod}
                        placeholder="Fx. August"
                    />

                    <Text style={styles.label}>Type</Text>

                    <View style={styles.metricRow}>
                        <View style={{ flex: 1 }}>
                            <Button
                                title="Distance"
                                onPress={() => setMetric("distance")}
                                color={
                                    metric === "distance"
                                        ? theme.colors.primary
                                        : "#999"
                                }
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Button
                                title="Varighed"
                                onPress={() => setMetric("duration")}
                                color={
                                    metric === "duration"
                                        ? theme.colors.primary
                                        : "#999"
                                }
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>
                        Mål ({metric === "distance" ? "km" : "timer"})
                    </Text>

                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={goal}
                        onChangeText={setGoal}
                        placeholder="100"
                    />

                    <Button
                        title="Gem ændringer"
                        onPress={addOrUpdate}
                    />

                    <View style={{ height: 20 }} />

                    <Button
                        title="Annuller"
                        color="gray"
                        onPress={() => {
                            clearForm();
                            setMode("LIST");
                        }}
                    />

                    <View style={{ height: 60 }} />

                    <Pressable
                        onPress={() => deletePlan(editingId!)}
                        style={{
                            alignSelf: "center",
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: "#ffeaea",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <FontAwesome5
                            name="trash-alt"
                            size={24}
                            color="#d11a2a"
                        />
                    </Pressable>
                </ScrollView>
            ) : mode === "LIST" ? (
                <>
                    <Pressable
                        onPress={() => {
                            setDisplayBulkMode(!displayBulkMode)
                        }}
                        style={styles.bulkButton}
                    >
                        <Text style={{ color: theme.colors.primary }}>{displayBulkMode ? "OK" : "Rediger"}</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            clearForm();
                            setMode("CREATE");
                        }}
                        style={styles.createButton}
                    >
                        <FontAwesome5 name="plus" size="20" color="white" />
                    </Pressable>

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

                            {plans.map((plan) => (
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
                                            {plan.period}
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
                            ))}
                        </ScrollView>
                    </View>
                </>
            ) : null}
        </SafeAreaView>
    );
}
