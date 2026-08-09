import { BigLogo, DateOfBirthPage, FirstNamePage, FitnessLevel, FitnessLevelPage, GenderPage, HeightPage, WeightPage } from '@/components';
import { createOnboardingStyles } from '@/styles/modules/OnboardingStyles';
import { OnboardingData, PageTitles } from '@/types';
import { useOnboarding } from '@/hooks/useOnboarding';
import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const theme = useTheme() as MyTheme;
    const { showOnboarding, storeOnboarding } = useOnboarding();
    const styles = createStyles(theme);
    const onboardingStyles = createOnboardingStyles(theme);

    // State for user data
    const [firstName, setFirstName] = useState('');
    const [gender, setGender] = useState('Select gender');
    const [height, setHeight] = useState(170);
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
    const [weight, setWeight] = useState(60);
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
    const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null);
    const [day, setDay] = useState('Day');
    const [month, setMonth] = useState('Month');
    const [year, setYear] = useState('Year');

    // Modal and Loading state
    const [editing, setEditing] = useState<null | PageTitles>(null);
    const [loading, setLoading] = useState(true);

    // Load onboarding data from AsyncStorage
    useEffect(() => {
        const loadOnboardingData = async () => {
            setTimeout(async () => {
                try {
                    const data = await showOnboarding();
                    if (!data) return;

                    setFirstName(data.firstName ?? '');
                    setGender(data.gender ?? 'Select gender');
                    setHeight(data.height ?? 170);
                    setHeightUnit(data.heightUnit ?? 'cm');
                    setWeight(data.weight ?? 60);
                    setWeightUnit(data.weightUnit ?? 'kg');
                    setFitnessLevel(data.fitnessLevel ?? null);

                    if (data.dob) {
                        setDay(data.dob.day ?? 'Day');
                        setMonth(data.dob.month ?? 'Month');
                        setYear(data.dob.year ?? 'Year');
                    }
                } catch (err) {
                    console.error('Failed to load onboarding data', err);
                } finally {
                    setLoading(false);
                }
            }, 3000)
        };

        loadOnboardingData();
    }, [showOnboarding]);

    // Save automatically when values change
    useEffect(() => {
        if (loading) return;
        const data: OnboardingData = {
            firstName, gender, height, heightUnit, weight, weightUnit, fitnessLevel,
            dob: { day, month, year },
        };
        storeOnboarding(data).catch((error) => console.error('Failed to save onboarding data', error));
    }, [
        firstName,
        gender,
        height,
        heightUnit,
        weight,
        weightUnit,
        fitnessLevel,
        day,
        month,
        year,
        loading,
        storeOnboarding,
    ]);

    if (loading) return (
        <View style={styles.logoContainer}>
            <BigLogo size={200} animated={true} />
        </View>
    )

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Profile Settings</Text>

                {/* ---------------- Overview Sections ---------------- */}
                <Pressable style={styles.card} onPress={() => setEditing('FirstName')}>
                    <View>
                        <Text style={styles.label}>First Name</Text>
                        <Text style={styles.value}>{firstName || 'Not set'}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size="20" />
                </Pressable>

                <Pressable style={styles.card} onPress={() => setEditing('Gender')}>
                    <View>
                        <Text style={styles.label}>Gender</Text>
                        <Text style={styles.value}>{gender}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size="20" />
                </Pressable>

                <Pressable style={styles.card} onPress={() => setEditing('Height')}>
                    <View>
                        <Text style={styles.label}>Height</Text>
                        <Text style={styles.value}>{height} {heightUnit}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size="20" />
                </Pressable>

                <Pressable style={styles.card} onPress={() => setEditing('Weight')}>
                    <View>
                        <Text style={styles.label}>Weight</Text>
                        <Text style={styles.value}>{weight} {weightUnit}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size="20" />
                </Pressable>

                <Pressable style={styles.card} onPress={() => setEditing('FitnessLevel')}>
                    <View>
                        <Text style={styles.label}>Fitness Level</Text>
                        <Text style={styles.value}>{fitnessLevel ? (fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1)) : 'Not set'}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size="20" />
                </Pressable>

                <Pressable style={styles.card} onPress={() => setEditing('DateOfBirth')}>
                    <View>
                        <Text style={styles.label}>Date of Birth</Text>
                        <Text style={styles.value}>{day}. {month} {year}</Text>
                    </View>
                    <FontAwesome5 name="chevron-right" size="20" />
                </Pressable>

                {/* ---------------- Modals for editing ---------------- */}
                <Modal visible={editing !== null} animationType="slide" presentationStyle="pageSheet">
                    <View style={onboardingStyles.container}>
                        <Pressable
                            style={{ padding: 16, backgroundColor: theme.colors.background }}
                            onPress={() => setEditing(null)}
                        >
                            <Text style={{ color: theme.colors.primary }}>Close</Text>
                        </Pressable>
                        <View style={onboardingStyles.page}>
                            {editing === 'FirstName' && (
                                <FirstNamePage
                                    theme={theme}
                                    currentPage="FirstName"
                                    firstName={firstName}
                                    setFirstName={setFirstName}
                                    onNext={() => setEditing(null)}
                                />
                            )}

                            {editing === 'Gender' && (
                                <GenderPage
                                    theme={theme}
                                    gender={gender}
                                    setGenderModalVisible={() => setEditing(null)} // can show inline modal
                                />
                            )}

                            {editing === 'Height' && (
                                <HeightPage
                                    theme={theme}
                                    height={height}
                                    setHeight={setHeight}
                                    heightUnit={heightUnit}
                                    setHeightUnit={setHeightUnit}
                                    onNext={() => setEditing(null)}
                                />
                            )}

                            {editing === 'Weight' && (
                                <WeightPage
                                    theme={theme}
                                    weight={weight}
                                    setWeight={setWeight}
                                    weightUnit={weightUnit}
                                    setWeightUnit={setWeightUnit}
                                    onNext={() => setEditing(null)}
                                />
                            )}

                            {editing === 'FitnessLevel' && (
                                <FitnessLevelPage
                                    theme={theme}
                                    fitnessLevel={fitnessLevel}
                                    setFitnessLevel={setFitnessLevel}
                                    onNext={() => setEditing(null)}
                                />
                            )}

                            {editing === 'DateOfBirth' && (
                                <DateOfBirthPage {...{
                                    theme,
                                    day,
                                    month,
                                    year,
                                    setDay,
                                    setMonth,
                                    setYear,
                                    setCompleted: () => null,
                                    onNext: () => setEditing(null)
                                }} />
                            )}
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme: MyTheme) =>
    StyleSheet.create({
        logoContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        container: {
            flex: 1,
            padding: 16,
            backgroundColor: theme.colors.background,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 24,
            color: theme.colors.text,
        },
        card: {
            padding: 16,
            borderRadius: 12,
            backgroundColor: theme.colors.card,
            marginBottom: 12,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
        },
        label: {
            fontSize: 16,
            color: theme.colors.secondaryText,
        },
        value: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginTop: 4,
        },
    });
