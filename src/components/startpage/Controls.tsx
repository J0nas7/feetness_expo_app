import { ReusePreviousWorkout } from '@/components';
import { createStartpageStyles } from '@/styles/modules/StartpageStyles';
import { ExerciseType, GoalMetric, Workout } from '@/types';
import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { activityName, t } from '@/i18n';

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
    openActivityModal: () => void
    activity: ExerciseType
    savedWorkouts: Workout[]
    setActivity: React.Dispatch<React.SetStateAction<ExerciseType>>
    setShowCustom: React.Dispatch<React.SetStateAction<boolean>>
    onStart: () => void
}

export const Controls: React.FC<ControlsProps> = (props) => {
    const styles = createStartpageStyles(props.theme);

    return (
        <View style={styles.controls}>
            {props.showCustom ? ( // Show Custom Settings
                <View>
                    {/* Number selector */}
                    <Text style={styles.label}>
                        {props.mode === 'distance' ? t('start.distance') : t('start.duration')}
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
                        {([['distance', 'road', t('start.distance')], ['duration', 'clock', t('start.duration')]] as const).map(([value, icon, label]) => {
                            const selected = props.mode === value;
                            return <Pressable key={value} style={[styles.toggleButton, selected && styles.toggleActive]} onPress={() => props.setMode(value)}>
                                <FontAwesome5 name={icon} size={15} color={selected ? props.theme.colors.border : props.theme.colors.success} />
                                <Text
                                    style={[
                                        styles.toggleText,
                                        props.mode === value && styles.toggleTextActive,
                                    ]}
                                >{label}</Text>
                            </Pressable>
                        })}
                    </View>

                    {/* Activity select */}
                    <Text style={styles.label}>{t('common.activity.label')}</Text>

                    <Pressable
                        style={styles.selectRow}
                        onPress={props.openActivityModal}
                    >
                        <Text style={styles.selectText}>{activityName(props.activity)}</Text>
                    </Pressable>

                    {/* START button */}
                    <Pressable
                        onPress={props.onStart}
                        style={styles.startButton}
                    >
                        <Text style={styles.startText}>{t('start.start')}</Text>
                    </Pressable>
                </View>
            ) : ( // Use Previous Workouts
                <>
                    <Text style={styles.label}>
                        {t('start.reuse')}
                    </Text>
                    <FlatList<Workout>
                        data={props.savedWorkouts}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 16 }}
                        ListEmptyComponent={
                            <Text style={{ color: props.theme.colors.tertiaryText, textAlign: 'center', marginVertical: 10 }}>
                                {t('start.empty')}
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
                    {props.showCustom ? t('start.usePrevious') : t('start.custom')}
                </Text>
            </Pressable>
        </View>
    )
}
