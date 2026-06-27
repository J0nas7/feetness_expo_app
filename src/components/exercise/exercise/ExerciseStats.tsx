import { Buttons } from '@/components';
import { createStyles } from '@/components/exercise/exercise/CreateStyles';
import { MyTheme } from '@/types/theme';
import React from 'react';
import { Text, View } from 'react-native';

interface ExerciseStatsProps {
    theme: MyTheme;
    distance: number;
    elapsedTime: number;
    pace: number;
    calories: number;
    isPaused: boolean;
    setIsPaused: (value: React.SetStateAction<boolean>) => void
    stopExercise: () => void;
}

export const ExerciseStats: React.FC<ExerciseStatsProps> = ({
    theme, distance, elapsedTime, pace, calories, isPaused, setIsPaused, stopExercise
}) => {
    const styles = createStyles(theme);

    // Function to format pace (minutes/km)
    const formatPace = (pace: number): string => {
        if (pace === 0) return "-"; // If no distance is covered, display N/A
        const minutes = Math.floor(pace); // Full minutes
        const seconds = Math.floor((pace - minutes) * 60); // Remaining seconds
        return `${minutes}:${padTime(seconds)}`; // Format as MM:SS
    };

    // Function to format elapsed time as MM:SS or HH:MM:SS
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${padTime(hours)}:${padTime(minutes)}:${padTime(remainingSeconds)}`;
        } else {
            return `${padTime(minutes)}:${padTime(remainingSeconds)}`;
        }
    };

    // Helper function to pad the time with leading zeros
    const padTime = (time: number): string => {
        return time < 10 ? `0${time}` : `${time}`;
    };

    return (
        <View style={styles.statsContainer}>
            <View style={styles.grid}>
                <View style={styles.statItem}>
                    <Text style={styles.valueText}>{((distance) / 1000).toFixed(2)} </Text>
                    <Text style={styles.unitText}>km</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.valueText}>{formatTime(elapsedTime)}</Text>
                    <Text style={styles.unitText}>Time</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.valueText}>{formatPace(pace)}</Text>
                    <Text style={styles.unitText}>min/km</Text>
                </View>

                {/* Placeholder stats */}
                <View style={styles.statItem}>
                    <Text style={styles.valueText}>0</Text>
                    <Text style={styles.unitText}>Steps</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.valueText}>{Math.floor(calories)}</Text>
                    <Text style={styles.unitText}>Kcal</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.valueText}>0</Text>
                    <Text style={styles.unitText}>bpm</Text>
                </View>
            </View>

            <Buttons
                isPaused={isPaused}
                setIsPaused={setIsPaused}
                stopExercise={stopExercise}
            />
        </View>
    );
};
