import { MyTheme } from '@/types/theme';
import { t } from '@/i18n';
import { speak, stopSpeak } from '@/utils/native/NativeSpeech';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const COUNTDOWN_SECONDS = 5;
const SPEECH: Record<number, string> = {
    5: t('exercise.speech.countdown.five'),
    4: t('exercise.speech.countdown.four'),
    3: t('exercise.speech.countdown.three'),
    2: t('exercise.speech.countdown.two'),
    1: t('exercise.speech.countdown.one'),
};
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface CountdownScreenProps {
    setIsCountingDown: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({ setIsCountingDown }) => {
    const theme = useTheme() as MyTheme;
    const [number, setNumber] = useState(COUNTDOWN_SECONDS);
    const deadlineRef = useRef(0);
    const finishedRef = useRef(false);
    const lastSpokenNumberRef = useRef(0);
    const animatedNumberRef = useRef(0);
    const radius = 100;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const progress = useSharedValue(0);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference - circumference * progress.value,
    }));

    const animateCircle = useCallback(() => {
        return new Promise<void>((resolve) => {
            progress.value = 0;

            progress.value = withTiming(
                1,
                {
                    duration: 500,
                    easing: Easing.linear,
                },
                (finished) => {
                    if (finished) {
                        runOnJS(resolve)();
                    }
                }
            );
        });
    }, [progress]);

    useFocusEffect(useCallback(() => {
        finishedRef.current = false;
        lastSpokenNumberRef.current = 0;
        animatedNumberRef.current = 0;
        deadlineRef.current = Date.now() + COUNTDOWN_SECONDS * 1000;

        let interval: ReturnType<typeof setInterval>;

        const updateFromClock = async (forceAnimationSync = false) => {
            if (finishedRef.current) return;

            const remainingMs = deadlineRef.current - Date.now();
            if (remainingMs <= 0) {
                finishedRef.current = true;
                progress.value = 1;
                setIsCountingDown(false);
                return;
            }

            const nextNumber = Math.min(COUNTDOWN_SECONDS, Math.max(1, Math.ceil(remainingMs / 1000)));
            setNumber((current) => current === nextNumber ? current : nextNumber);

            if (lastSpokenNumberRef.current !== nextNumber) {
                lastSpokenNumberRef.current = nextNumber;
                speak(SPEECH[nextNumber]);
            }

            // Small delay so speech engine initializes first
            await wait(500);

            if (nextNumber !== 1 || forceAnimationSync) {
                // Animation phase
                await animateCircle();
            }
        };

        const runCountdown = async () => {
            // Animation phase
            await animateCircle();

            updateFromClock(true);
            interval = setInterval(updateFromClock, 1100);
        }

        runCountdown();
        const appStateSubscription = AppState.addEventListener('change', () => updateFromClock(true));

        return () => {
            if (interval) {
                clearInterval(interval);
            }
            appStateSubscription.remove();
            stopSpeak();
        };
    }, [animateCircle, progress, setIsCountingDown]));

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
        number: { position: 'absolute', fontSize: 100, color: theme.colors.text },
    }), [theme.colors.text]);

    return <View style={styles.container}>
        <Svg height={radius * 2 + strokeWidth * 2} width={radius * 2 + strokeWidth * 2}>
            <AnimatedCircle
                stroke="green"
                fill="transparent"
                cx={radius + strokeWidth}
                cy={radius + strokeWidth}
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference}`}
                animatedProps={animatedProps}
                strokeLinecap="round"
                rotation="-90"
                originX={radius + strokeWidth}
                originY={radius + strokeWidth}
            />
        </Svg>
        <Text style={styles.number}>{number}</Text>
    </View>;
};
