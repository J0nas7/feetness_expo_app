import { BigLogo } from '@/components/global/BigLogo';
import { t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import { requestLocationPermissions } from '@/utils/location/location';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LocationPageProps {
    theme: MyTheme;
    currentPage: PageTitles
    onNext: (pageName: PageTitles) => void
}

export const LocationPage: React.FC<LocationPageProps> = ({ theme, currentPage, onNext }) => {
    const handleEnableLocation = useCallback(async () => {
        try {
            await requestLocationPermissions();
        } catch (error) {
            console.error('Error requesting location', error);
        }
        onNext("HealthData");
    }, [onNext]);

    useEffect(() => {
        if (currentPage === "Location") {
            handleEnableLocation()
        }
    }, [handleEnableLocation, currentPage])

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        content: {
            flex: 1,
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            opacity: 0.5,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 20,
            color: theme.colors.text,
            textAlign: 'center',
        },
        description: {
            fontSize: 18,
            color: theme.colors.secondaryText,
            textAlign: 'center',
        },
        button: {
            backgroundColor: theme.colors.success,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
        },
        buttonText: {
            color: theme.colors.onPrimary,
            fontSize: 20,
            fontWeight: 'bold',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <BigLogo size={200} icon="🏃‍♂️" />
                <View>
                    <Text style={styles.title}>{t('onboarding.locationTitle')}</Text>
                    <Text style={styles.description}>{t('onboarding.locationLine1')}</Text>
                    <Text style={[styles.description]}>{t('onboarding.locationLine2')}</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};
