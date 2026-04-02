import { ReusePreviousWorkout } from '@/components';
import { createStartpageStyles } from '@/styles/modules/StartpageStyles';
import { ExerciseType, GoalMetric, Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

export interface ControlsProps {
    theme: MyTheme;
    showCustom: boolean
    mode: GoalMetric
    setMode: React.Dispatch<React.SetStateAction<GoalMetric>>
    pressGoalAmount: (direction: "minus" | "plus") => void
    distance: number
    duration: number
    setDistance: React.Dispatch<React.SetStateAction<number>>
    setDuration: React.Dispatch<React.SetStateAction<number>>
    setActivityModalVisible: React.Dispatch<React.SetStateAction<boolean>>
    activity: ExerciseType
    savedWorkouts: Workout[]
    setActivity: React.Dispatch<React.SetStateAction<ExerciseType>>
    setShowCustom: React.Dispatch<React.SetStateAction<boolean>>
}

export const Controls: React.FC<ControlsProps> = (props) => {
    const styles = createStartpageStyles(props.theme);

    return (
        <View style={styles.controls}>
            {props.showCustom ? ( // Show Custom Settings
                <View>
                    {/* Number selector */}
                    <Text style={styles.label}>
                        {props.mode === 'distance' ? 'Distance' : 'Duration'}
                    </Text>

                    <View style={{
                        alignItems: "center",
                    }}>
                        <View style={styles.valueRow}>
                            <Pressable
                                style={styles.roundButton}
                                onPress={() => props.pressGoalAmount('minus')}
                            >
                                <Text style={styles.roundButtonText}>-</Text>
                            </Pressable>

                            <Text style={styles.value}>
                                {props.mode === 'distance'
                                    ? `${props.distance.toFixed(2)} km`
                                    : `${props.duration} min`}
                            </Text>

                            <Pressable
                                style={styles.roundButton}
                                onPress={() => props.pressGoalAmount('plus')}
                            >
                                <Text style={styles.roundButtonText}>+</Text>
                            </Pressable>
                        </View>
                    </View>

                    <Slider
                        minimumValue={props.mode === 'distance' ? 0.25 : 10}
                        maximumValue={props.mode === 'distance' ? 20 : 300}
                        step={props.mode === 'distance' ? 0.25 : 5}
                        value={props.mode === 'distance' ? props.distance : props.duration}
                        onValueChange={(v) => {
                            if (props.mode === 'distance') {
                                props.setDistance(v)
                            } else {
                                props.setDuration(v)
                            }
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        minimumTrackTintColor="green"
                        maximumTrackTintColor="#ccc"
                        thumbTintColor="green"
                    />

                    {/* Toggle */}
                    <View style={styles.toggleContainer}>
                        <Pressable
                            style={[
                                styles.toggleButton,
                                props.mode === 'distance' && styles.toggleActive,
                            ]}
                            onPress={() => props.setMode('distance')}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    props.mode === 'distance' && styles.toggleTextActive,
                                ]}
                            >
                                Distance
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.toggleButton,
                                props.mode === 'duration' && styles.toggleActive,
                            ]}
                            onPress={() => props.setMode('duration')}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    props.mode === 'duration' && styles.toggleTextActive,
                                ]}
                            >
                                Duration
                            </Text>
                        </Pressable>
                    </View>

                    {/* Activity select */}
                    <Text style={styles.label}>Activity</Text>

                    <Pressable
                        style={styles.selectRow}
                        onPress={() => props.setActivityModalVisible(true)}
                    >
                        <Text style={styles.selectText}>{props.activity}</Text>
                    </Pressable>

                    {/* START button */}
                    <Pressable
                        onPress={async () => {
                            // Save workout config in AsyncStorage
                            const workoutConfig = {
                                mode: props.mode,
                                distance: props.distance,
                                duration: props.duration,
                                activity: props.activity
                            };
                            await AsyncStorage.setItem('currentWorkout', JSON.stringify(workoutConfig));

                            // Navigate to progress page cleanly, no params
                            router.push('/progress');
                        }}
                        style={styles.startButton}
                    >
                        <Text style={styles.startText}>START</Text>
                    </Pressable>
                </View>
            ) : ( // Use Previous Workouts
                <>
                    <Text style={styles.label}>
                        Reuse previous workouts
                    </Text>
                    <FlatList<Workout>
                        data={props.savedWorkouts}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 16 }}
                        ListEmptyComponent={
                            <Text style={{ color: props.theme.colors.tertiaryText, textAlign: 'center', marginVertical: 10 }}>
                                No saved workouts
                            </Text>
                        }
                        renderItem={({ item }) => (
                            <ReusePreviousWorkout
                                item={item}
                                setMode={props.setMode}
                                setDistance={props.setDistance}
                                setDuration={props.setDuration}
                                setActivity={props.setActivity}
                                setShowCustom={props.setShowCustom}
                            />
                        )}
                    />
                </>
            )}

            {/* Custom/workouts toggler */}
            <Pressable
                onPress={() => props.setShowCustom(!props.showCustom)}
                style={styles.togglerButton}
            >
                <Text style={styles.togglerText}>
                    {props.showCustom ? 'Use Previous Workouts' : 'Show Custom Settings'}
                </Text>
            </Pressable>
        </View>
    )
}
