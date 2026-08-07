import { BigLogo } from '@/components/global/BigLogo';
import { t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface WelcomeProps {
    onNext: (pageName: PageTitles) => void
}

export const Welcome: React.FC<WelcomeProps> = (props) => {
    const theme = useTheme() as MyTheme;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        content: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        icon: {
            marginBottom: 30,
        },
        button: {
            backgroundColor: theme.colors.success,
            padding: 20,
            borderRadius: 12,
            alignItems: 'center',
        },
        startText: {
            color: theme.colors.onPrimary,
            fontSize: 26,
            fontWeight: 'bold',
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.icon}>
                    <BigLogo size={200} />
                </View>
                <Pressable
                    onPress={() => props.onNext("Location")}
                    style={styles.button}
                >
                    <Text style={styles.startText}>{t('onboarding.getStarted')}</Text>
                </Pressable>
            </View>
        </View>
    );
};
