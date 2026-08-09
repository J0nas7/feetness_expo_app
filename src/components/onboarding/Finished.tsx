import { BigLogo } from '@/components/global/BigLogo';
import { t } from '@/i18n';
import { FitnessLevel } from '@/components/onboarding/FitnessLevelPage';
import { OnboardingData, PageTitles } from '@/types';
import { useOnboarding } from '@/hooks/useOnboarding';
import { MyTheme } from '@/types/theme';
import { setOnboardingCompleted } from '@/utils/onboarding';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

type Glitter = {
    id: string;
    anim: Animated.ValueXY;
    size: number;
    duration: number;
};

interface FinishedProps {
    completed: boolean;
    currentPage: PageTitles
    firstName: string;
    gender: string;
    height: number;
    heightUnit: 'cm' | 'ft';
    fitnessLevel: FitnessLevel | null;
    day: string;
    month: string;
    year: string;
}

export const Finished: React.FC<FinishedProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const { storeOnboarding } = useOnboarding();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [glitters, setGlitters] = useState<Glitter[]>([]);

    // State for the button visibility & opacity
    const [showButton, setShowButton] = useState(false);
    const buttonOpacity = useRef(new Animated.Value(0)).current;

    // Save the onboarding
    useEffect(() => {
        if (!props.completed) return

        const completeOnboarding = async () => {
            try {
                const onboardingData: OnboardingData = {
                    firstName: props.firstName,
                    gender: props.gender,
                    height: props.height,
                    heightUnit: props.heightUnit,
                    fitnessLevel: props.fitnessLevel,
                    dob: {
                        day: props.day,
                        month: props.month,
                        year: props.year
                    },
                }

                // save each piece of info as JSON
                await storeOnboarding(onboardingData);

                // mark onboarding complete
                await setOnboardingCompleted();
            } catch (error) {
                console.error('Error saving onboarding data', error);
            }
        }

        completeOnboarding()
    }, [storeOnboarding, props.completed, props.day, props.firstName, props.fitnessLevel, props.gender, props.height, props.heightUnit, props.month, props.year]);

    // Animate icon scale
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [scaleAnim]);

    // Generate and animate glitters
    useEffect(() => {
        const temp: Glitter[] = Array.from({ length: 30 }).map(() => {
            const anim = new Animated.ValueXY({
                x: Math.random() < 0.5 ? -20 : width + 20, // start off-screen left or right
                y: -20, // start above the view
            });
            const size = Math.random() * 8 + 4;
            const duration = 2000 + Math.random() * 2000; // 2-4 seconds
            return { id: Math.random().toString(), anim, size, duration };
        });

        setGlitters(temp);

        const animateGlitter = (g: Glitter) => {
            const startX = Math.random() < 0.5 ? -20 : width + 20;
            const endX = Math.random() * width;

            g.anim.setValue({ x: startX, y: -20 }); // reset start position

            Animated.timing(g.anim, {
                toValue: { x: endX, y: height + 20 },
                duration: g.duration,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(() => animateGlitter(g)); // repeat after finishing
        };

        temp.forEach(g => animateGlitter(g));
    }, []);

    // After 5 seconds, fade in the button
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (props.currentPage === "Finished") {
            timer = setTimeout(() => {
                setShowButton(true);
                Animated.timing(buttonOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }).start();
            }, 5000);
        }

        return () => clearTimeout(timer);
    }, [buttonOpacity, props.currentPage]);

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
            marginBottom: 20,
        },
        welcomeText: {
            fontSize: 48,
            fontWeight: 'bold',
            color: theme.colors.notification,
        },
        glitter: {
            position: 'absolute',
            backgroundColor: theme.colors.success,
            opacity: 0.8,
        },
    });

    return (
        <View style={styles.container}>
            {glitters.map(g => (
                <Animated.View
                    key={g.id}
                    style={[
                        styles.glitter,
                        {
                            width: g.size,
                            height: g.size,
                            borderRadius: g.size / 2,
                            transform: g.anim.getTranslateTransform(), // use transform for x/y
                        },
                    ]}
                />
            ))}
            <View style={styles.content}>
                <View style={styles.icon}>
                    <BigLogo size={200} animated={true} />
                </View>
                <Text style={styles.welcomeText}>{t('onboarding.welcome')}</Text>

                {showButton && (
                    <Animated.View style={{ opacity: buttonOpacity, marginTop: 30 }}>
                        <Pressable
                            onPress={() => router.replace('/(tabs)')}
                            style={{
                                backgroundColor: theme.colors.success,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ color: theme.colors.onPrimary, fontSize: 20, fontWeight: 'bold' }}>
                                {t('onboarding.finishCta', { name: props.firstName })}
                            </Text>
                        </Pressable>
                    </Animated.View>
                )}
            </View>
        </View>
    );
};
