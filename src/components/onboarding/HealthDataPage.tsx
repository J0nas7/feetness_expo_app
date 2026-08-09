import { BigLogo } from '@/components/global/BigLogo';
import { t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import { requestHealthDataPermissions } from '@/utils/requestHealthDataPermissions';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HealthDataPageProps {
    theme: MyTheme;
    currentPage: PageTitles;
    onNext: (pageName: PageTitles) => void;
}

export const HealthDataPage: React.FC<HealthDataPageProps> = ({ theme, currentPage, onNext }) => {
    const handleEnableHealthData = useCallback(async () => {
        try {
            console.log("handleEnableHealthData()")
            await requestHealthDataPermissions();
        } catch (error) {
            console.error('Error requesting health data permissions', error);
        }

        onNext("FirstName");
    }, [onNext]);

    useEffect(() => {
        console.log("currentPage", currentPage)
        if (currentPage === 'HealthData') {
            handleEnableHealthData();
        }
    }, [handleEnableHealthData, currentPage]);

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
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <BigLogo size={200} icon="❤️" />

                <View>
                    <Text style={styles.title}>{t('onboarding.healthTitle')}</Text>
                    <Text style={styles.description}>
                        {t('onboarding.healthLine1')}
                    </Text>
                    <Text style={styles.description}>
                        {t('onboarding.healthLine2')}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};
