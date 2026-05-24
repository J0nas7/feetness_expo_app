import { MyTheme } from '@/types/theme';
import { speak } from "@/utils/native/NativeSpeech";
import { useFocusEffect, useTheme } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedProps,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

// Create Animated version of Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CountdownScreenProps {
    setIsCountingDown: React.Dispatch<React.SetStateAction<boolean>>
}

export const CountdownScreen: React.FC<CountdownScreenProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const [number, setNumber] = useState(5);

    const radius = 100;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;

    const progress = useSharedValue(0);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset:
            circumference - circumference * progress.value,
    }));

    const wait = (ms: number) =>
        new Promise(resolve => setTimeout(resolve, ms));

    const animateCircle = () => {
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
    };

    const runCountdown = useCallback(async () => {
        const countdown = [
            { value: 5, speech: "Fem" },
            { value: 4, speech: "Fire" },
            { value: 3, speech: "Tre" },
            { value: 2, speech: "To" },
            { value: 1, speech: "En" },
        ];

        // Animation phase
        await animateCircle();

        for (const item of countdown) {
            setNumber(item.value);

            // Speech phase
            speak(item.speech);

            // Small delay so speech engine initializes first
            await wait(500);

            if (item.value !== 1) {
                // Animation phase
                await animateCircle();
            }
        }

        props.setIsCountingDown(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            runCountdown();

            return () => {
                Speech.stop();
            };
        }, [])
    );

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent'
        },
        number: {
            position: 'absolute',
            fontSize: 100,
            color: theme.colors.text,
        },
    }), [theme.colors.text]);

    return (
        <View style={styles.container}>
            <Svg
                height={radius * 2 + strokeWidth * 2}
                width={radius * 2 + strokeWidth * 2}
            >
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
        </View>
    );
}
