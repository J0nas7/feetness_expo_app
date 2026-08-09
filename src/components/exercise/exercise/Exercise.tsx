import { createStyles } from '@/components/exercise/exercise/CreateStyles';
import { GoalProgress } from '@/components/exercise/GoalProgress';
import { useWorkoutCommands } from '@/hooks/useWorkoutCommands';
import { useWorkoutLocation } from '@/hooks/useWorkoutLocation';
import { useWorkoutMetrics } from '@/hooks/useWorkoutMetrics';
import { useWorkoutPause } from '@/hooks/useWorkoutPause';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { usePlans } from '@/hooks/usePlans';
import { useSpeech } from '@/hooks/useSpeech';
import { activityName, t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import MapView from 'react-native-maps';
import { ExerciseMap } from './ExerciseMap';
import { CompactExerciseStats, ExerciseStats } from './ExerciseStats';

export interface ExerciseProps {
    exercise: "cycling" | "running" | "walking";
    goalAmount: number;
    goalMetric: "duration" | "distance";
}

export const Exercise: React.FC<ExerciseProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const { enqueueSpeech, isMuted, resetProgress, setMonthPlanProgress, speakProgressUpdates, start: startSpeech, stop: stopSpeech, toggleMute } = useSpeech();
    const { loadCurrentMonthPlan } = usePlans();
    const { communicateWorkoutUpdate, pauseWorkout, publishWorkoutState, startWorkout, stopWorkout } = useWorkoutSession({
        exercise: props.exercise,
        goalAmount: props.goalAmount,
        goalMetric: props.goalMetric,
        speakProgressUpdates,
    });
    const [activeView, setActiveView] = useState<'summary' | 'map'>('summary');
    const stopExerciseRef = React.useRef<() => Promise<void>>(async () => { });
    const mapRef = React.useRef<MapView>(null);
    const styles = createStyles(theme);
    const pause = useWorkoutPause({
        enqueueSpeech, pauseWorkout, publishWorkoutState,
        currentState: () => ({ distance: distanceRef.current, pace: paceRef.current, elapsed: elapsedActiveTimeRef.current, calories: caloriesRef.current, percentage: percentageRef.current }),
    });
    const { elapsedActiveTime, elapsedActiveTimeRef, elapsedPausedTimeRef, finalizeTimer, getActiveSeconds, resetTimer, startTimeRef } = useWorkoutTimer(pause.isPaused);
    const { location, locationSubRef, setLocation } = useWorkoutLocation(props.exercise, startWorkout);
    const { calories, caloriesRef, distance, distancePausedRef, distanceRef, pace, paceRef, path, pathRef, percentage, percentageRef, resetMetrics, segments } = useWorkoutMetrics({
        exercise: props.exercise, goalAmount: props.goalAmount, goalMetric: props.goalMetric,
        elapsedActiveTime, elapsedActiveTimeRef, getActiveSeconds, isPausedRef: pause.isPausedRef,
        communicateWorkoutUpdate, setLocation,
    });
    const startPoint = path[0];
    const stopExercise = () => {
        finalizeTimer();
        return stopWorkout({
            percentage, distanceRef, elapsedTimeRef: elapsedActiveTimeRef, elapsedPausedTimeRef, distancePausedRef, paceRef, caloriesRef, percentageRef,
            startTimeRef, pathRef, segments, locationSubRef, mapRef,
        });
    };
    stopExerciseRef.current = stopExercise;
    useWorkoutCommands({ enqueueSpeech, isPausedRef: pause.isPausedRef, pauseFromNative: pause.pauseFromNative, pauseFromWatch: pause.pauseFromWatch, stopExerciseRef });

    useFocusEffect(
        React.useCallback(() => {
            let active = true;
            startSpeech(); // Start Android speech service

            resetTimer();
            resetMetrics();
            resetProgress();

            loadCurrentMonthPlan()
                .then((currentMonthPlan) => {
                    if (!active || !currentMonthPlan) return;
                    setMonthPlanProgress(currentMonthPlan.monthPlan, currentMonthPlan.completedAmount);
                })
                .catch((error) => {
                    console.error('Failed to load current month plan progress', error);
                });

            // Speak the message
            setTimeout(() => {
                enqueueSpeech(activityName(props.exercise));
                const unitKey = props.goalMetric === 'distance'
                    ? (props.goalAmount === 1 ? 'kilometer' : 'kilometers')
                    : (props.goalAmount === 1 ? 'minute' : 'minutes');
                enqueueSpeech(t('exercise.speech.goal', {
                    amount: props.goalAmount,
                    unit: t(`exercise.speech.${unitKey}`),
                }));
            }, 1000)

            return () => {
                active = false;
                stopSpeech(); // Stop Android speech service when leaving workout
            };
        }, [enqueueSpeech, loadCurrentMonthPlan, props.exercise, props.goalAmount, props.goalMetric, resetMetrics, resetProgress, resetTimer, setMonthPlanProgress, startSpeech, stopSpeech])
    );

    if (activeView === 'map') {
        return (
            <View style={styles.container}>
                <View style={styles.fullMapContainer}>
                    <ExerciseMap
                        location={location}
                        segments={segments}
                        startPoint={startPoint}
                        mapRef={mapRef}
                        showUserLocation={false}
                    />
                </View>
                <View style={styles.mapControls}>
                    <CompactExerciseStats
                        theme={theme}
                        distance={distance}
                        elapsedTime={elapsedActiveTime}
                        pace={pace}
                    />
                    <Pressable
                        style={styles.closeMapButton}
                        onPress={() => setActiveView('summary')}
                        accessibilityRole="button"
                        accessibilityLabel={t('exercise.closeMap')}
                    >
                        <FontAwesome5
                            name="times"
                            size={22}
                            color={theme.colors.onPrimary}
                        />
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <ExerciseMap
                    location={location}
                    segments={segments}
                    startPoint={startPoint}
                    mapRef={mapRef}
                    showUserLocation
                />
            </View>

            <ExerciseStats
                theme={theme}
                distance={distance}
                elapsedTime={elapsedActiveTime}
                pace={pace}
                calories={calories}
                isPaused={pause.isPaused}
                setIsPaused={pause.setIsPaused}
                stopExercise={stopExercise}
            />

            <Pressable
                style={[
                    styles.goalSibling,
                    styles.mapButton,
                ]}
                onPress={() => setActiveView('map')}
                accessibilityRole="button"
                accessibilityLabel={t('exercise.openMap')}
            >
                <FontAwesome5
                    name="expand-arrows-alt"
                    size={22}
                    color={theme.colors.onPrimary}
                />
            </Pressable>
            <View style={styles.goalOverlay}>
                <GoalProgress
                    percentage={percentage}
                    goalAmount={props.goalAmount}
                    goalMetric={props.goalMetric}
                />
            </View>
            <Pressable
                style={[styles.goalSibling, styles.muteButton]}
                onPress={toggleMute}
                accessibilityRole="button"
                accessibilityLabel={t(isMuted ? 'exercise.enableVoice' : 'exercise.disableVoice')}
                accessibilityState={{ checked: isMuted }}
            >
                <FontAwesome5
                    name={isMuted ? 'volume-mute' : 'volume-up'}
                    size={22}
                    color={theme.colors.onPrimary}
                />
            </Pressable>
        </View>
    );
};
