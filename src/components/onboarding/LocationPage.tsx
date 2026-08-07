import { BigLogo } from '@/components/global/BigLogo';
import { t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import { requestLocationPermissions } from '@/utils/location/location';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LocationPageProps {
    theme: MyTheme;
    currentPage: PageTitles
    onNext: (pageName: PageTitles) => void
}

export const LocationPage: React.FC<LocationPageProps> = (props) => {
    const handleEnableLocation = async () => {
        try {
            const response = await requestLocationPermissions();
        } catch (error) {
            console.error('Error requesting location', error);
        }
        props.onNext("HealthData");
    };

    useEffect(() => {
        if (props.currentPage === "Location") {
            handleEnableLocation()
        }
    }, [props.currentPage])

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: props.theme.colors.background,
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
            color: props.theme.colors.text,
            textAlign: 'center',
        },
        description: {
            fontSize: 18,
            color: props.theme.colors.secondaryText,
            textAlign: 'center',
        },
        button: {
            backgroundColor: props.theme.colors.success,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
        },
        buttonText: {
            color: props.theme.colors.onPrimary,
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
