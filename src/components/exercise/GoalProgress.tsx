import { MyTheme } from '@/types/theme';
import { useTheme } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface GoalProps {
    percentage: number;
    goalAmount: number;
    goalMetric: "distance" | "duration";
}

export const GoalProgress: React.FC<GoalProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const SIZE = 140;
    const STROKE = 12;
    const RADIUS = (SIZE - STROKE) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    const strokeDashoffset =
        CIRCUMFERENCE - (props.percentage / 100) * CIRCUMFERENCE;

    const styles = StyleSheet.create({
        container: {
            width: SIZE,
            height: SIZE,
            justifyContent: 'center',
            alignItems: 'center',
        },
        textContainer: {
            position: 'absolute',
            alignItems: 'center',
        },
        percentText: {
            fontSize: 36,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        goalText: {
            fontSize: 14,
            color: '#7f8c8d',
        },
    });

    return (
        <View style={styles.container}>
            <Svg width={SIZE} height={SIZE}>
                {/* Background circle */}
                <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={theme.colors.surface}
                    strokeWidth={STROKE}
                    fill="none"
                />

                {/* Progress circle */}
                <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke="green"
                    strokeWidth={STROKE}
                    fill={theme.colors.background}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${SIZE / 2}, ${SIZE / 2}`}
                />
            </Svg>

            {/* Center text */}
            <View style={styles.textContainer}>
                <Text style={styles.percentText}>{Math.floor(props.percentage)}%</Text>
                <Text style={styles.goalText}>af {props.goalAmount} {(props.goalMetric === "distance" ? "km" : "min")}</Text>
            </View>
        </View>
    );
};
