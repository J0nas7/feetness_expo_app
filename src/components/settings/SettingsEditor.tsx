import { DateOfBirthPage, FirstNamePage, FitnessLevelPage, GenderPage, HeightPage, WeightPage } from '@/components';
import { SettingsController } from '@/hooks/useSettings';
import { createOnboardingStyles } from '@/styles/modules/OnboardingStyles';
import { MyTheme } from '@/types/theme';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

export const SettingsEditor = ({ theme, settings }: { theme: MyTheme; settings: SettingsController }) => {
    const styles = createOnboardingStyles(theme);
    return <Modal visible={settings.editing !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
            <Pressable style={{ padding: 16, backgroundColor: theme.colors.background }} onPress={settings.closeEditor}>
                <Text style={{ color: theme.colors.primary }}>Close</Text>
            </Pressable>
            <View style={styles.page}>
                {settings.editing === 'FirstName' && <FirstNamePage theme={theme} currentPage="FirstName" firstName={settings.firstName} setFirstName={settings.setFirstName} onNext={settings.closeEditor} />}
                {settings.editing === 'Gender' && <GenderPage theme={theme} gender={settings.gender} setGenderModalVisible={settings.closeEditor} />}
                {settings.editing === 'Height' && <HeightPage theme={theme} height={settings.height} setHeight={settings.setHeight} heightUnit={settings.heightUnit} setHeightUnit={settings.setHeightUnit} onNext={settings.closeEditor} />}
                {settings.editing === 'Weight' && <WeightPage theme={theme} weight={settings.weight} setWeight={settings.setWeight} weightUnit={settings.weightUnit} setWeightUnit={settings.setWeightUnit} onNext={settings.closeEditor} />}
                {settings.editing === 'FitnessLevel' && <FitnessLevelPage theme={theme} fitnessLevel={settings.fitnessLevel} setFitnessLevel={settings.setFitnessLevel} onNext={settings.closeEditor} />}
                {settings.editing === 'DateOfBirth' && <DateOfBirthPage theme={theme} day={settings.day} month={settings.month} year={settings.year} setDay={settings.setDay} setMonth={settings.setMonth} setYear={settings.setYear} setCompleted={() => null} onNext={settings.closeEditor} />}
            </View>
        </View>
    </Modal>;
};
