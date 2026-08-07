import { MyTheme } from '@/types/theme'
import { t } from '@/i18n'
import { useTheme } from '@react-navigation/native'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface PeriodSelectorProps {
    periodType: "week" | "month"
    setPeriodType: React.Dispatch<React.SetStateAction<"week" | "month">>
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = (props) => {
    const theme = useTheme() as MyTheme;
    const styles = StyleSheet.create({
        periodSelector: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 24,
            gap: 16,
        },
        periodOption: {
            fontSize: 16,
            opacity: 0.5,
            color: theme.colors.text,
        },
        periodOptionActive: {
            fontSize: 18,
            fontWeight: '700',
            opacity: 1,
            color: theme.colors.success,
        },
    })

    return (
        <View style={styles.periodSelector}>
            {['week', 'month'].map((type) => (
                <Text
                    key={type}
                    onPress={() => props.setPeriodType(type as 'week' | 'month')}
                    style={[
                        styles.periodOption,
                        props.periodType === type && styles.periodOptionActive,
                    ]}
                >
                    {t(`progress.period.selector.${type}`)}
                </Text>
            ))}
        </View>
    )
}
