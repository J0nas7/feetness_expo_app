import { t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface ButtonsProps {
    isPaused: boolean
    setIsPaused: (value: React.SetStateAction<boolean>) => void
    stopExercise: () => void
};

export const Buttons: React.FC<ButtonsProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const SLIDE_WIDTH = 260;
    const KNOB_SIZE = 50;

    const doPause = React.useCallback(() => {
        props.setIsPaused(true)
    }, []);

    const translateX = useSharedValue(0);
    const gestureFinished = React.useRef(false);

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = Math.max(
                0,
                Math.min(e.translationX, SLIDE_WIDTH - KNOB_SIZE)
            );
        })
        .onEnd(() => {
            // Ensure this only triggers when the gesture is complete and the threshold is crossed
            if (translateX.value > SLIDE_WIDTH * 0.7 && !gestureFinished.current) {
                translateX.value = withSpring(SLIDE_WIDTH - KNOB_SIZE);

                // Set isPaused to true only once after gesture completion
                runOnJS(doPause)();
                translateX.value = withSpring(0);
            } else {
                translateX.value = withSpring(0);
                gestureFinished.current = false; // Reset when slider is moved back
            }
        });

    const knobStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value ?? 0 }],
    }));

    const styles = StyleSheet.create({
        container: {
            width: SLIDE_WIDTH,
            height: 60,
            backgroundColor: theme.colors.surface,
            borderRadius: 30,
            justifyContent: 'flex-start',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20
        },
        buttonArea: {
            display: "flex",
            flexDirection: "row",
            gap: 20
        },
        pauseButton: {
            backgroundColor: theme.colors.success,
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 25,
            marginTop: 10,
        },
        pauseText: {
            color: theme.colors.onPrimary,
            fontWeight: 'bold',
            fontSize: 16,
            textTransform: 'uppercase',
        },
        stopButton: {
            backgroundColor: theme.colors.notification,
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 30,
            marginTop: 10,
        },
        stopText: {
            color: theme.colors.onPrimary,
            fontWeight: 'bold',
            fontSize: 16,
            textTransform: 'uppercase',
        },
        knob: {
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: 25,
            backgroundColor: theme.colors.success,
            marginLeft: 5,
        },
        slideToPause: {
            color: theme.colors.text,
        }
    });

    if (props.isPaused) {
        return (
            <View style={styles.buttonArea}>
                <Pressable
                    style={styles.pauseButton}
                    onPress={() => props.setIsPaused(prev => !prev)}
                >
                    <Text style={styles.pauseText}>{t(props.isPaused ? 'common.actions.resume' : 'common.actions.pause')}</Text>
                </Pressable>
                <Pressable style={styles.stopButton} onPress={props.stopExercise}>
                    <Text style={styles.stopText}>{t('common.actions.stop')}</Text>
                </Pressable>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.knob, knobStyle]} />
            </GestureDetector>
            <Text style={styles.slideToPause}>{t('exercise.slideToPause')}</Text>
        </View>
    );
}
