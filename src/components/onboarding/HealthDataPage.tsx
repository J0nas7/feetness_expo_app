import { BigLogo } from '@/components/global/BigLogo';
import { t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import { requestHealthDataPermissions } from '@/utils/requestHealthDataPermissions';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HealthDataPageProps {
    theme: MyTheme;
    currentPage: PageTitles;
    onNext: (pageName: PageTitles) => void;
}

export const HealthDataPage: React.FC<HealthDataPageProps> = (props) => {
    const handleEnableHealthData = async () => {
        try {
            console.log("handleEnableHealthData()")
            await requestHealthDataPermissions();
        } catch (error) {
            console.error('Error requesting health data permissions', error);
        }

        props.onNext("FirstName");
    };

    useEffect(() => {
        console.log("props.currentPage", props.currentPage)
        if (props.currentPage === 'HealthData') {
            handleEnableHealthData();
        }
    }, [props.currentPage]);

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
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <BigLogo size={200} icon="❤️" />

                <View>
                    <Text style={styles.title}>{t('onboarding.healthTitle')}</Text>
                    <Text style={styles.description}>
                        Back up your workout data in Apple Health
                    </Text>
                    <Text style={styles.description}>
                        and activate all pedometer- and heartrate-functions.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};
