import { useOnboarding } from '@/hooks/useOnboarding'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'

interface BigLogoProps {
    size: number
    icon?: string
    animated?: boolean
}

export const BigLogo: React.FC<BigLogoProps> = (props) => {
    const { showOnboarding } = useOnboarding();
    const [LOGO, setLogo] = useState<string>(props.icon || "🏃‍♀️")

    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Animate icon scale
    useEffect(() => {
        if (props.animated) {
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
        }
    }, [scaleAnim]);

    useEffect(() => {
        (async () => {
            if (props.icon) return

            const data = await showOnboarding();
            if (!data) return;

            if (data.gender) setLogo(data.gender === "Male" ? "🏃" : "🏃‍♀️")
        })();
    }, [props.icon, showOnboarding])

    const styles = StyleSheet.create({
        icon: {
            fontSize: props.size,
        }
    })

    if (props.animated) {
        return (
            <Animated.Text style={[styles.icon, { transform: [{ scale: scaleAnim }] }]}>
                {LOGO}
            </Animated.Text>
        )
    }

    return <Text style={styles.icon}>{LOGO}</Text>
}
