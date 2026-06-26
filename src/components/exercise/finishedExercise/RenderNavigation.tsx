import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RenderNavigationProps {
    activeTab: 'summary' | 'time' | 'media' | 'map';
    setActiveTab: React.Dispatch<React.SetStateAction<'summary' | 'time' | 'media' | 'map'>>
}

export const RenderNavigation = ({ activeTab, setActiveTab }: RenderNavigationProps) => {
    const theme = useTheme() as MyTheme;

    const styles = StyleSheet.create({
        navigation: {
            width: '100%',
            backgroundColor: theme.colors.surface,
        },
        innerNavigation: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap', // Allows the items to wrap onto new lines
            justifyContent: 'space-evenly', // Even spacing between items
            paddingVertical: 12,
        }
    })

    return (
        <View style={styles.navigation}>
            <SafeAreaView edges={['bottom']} style={styles.innerNavigation}>
                <Pressable onPress={() => setActiveTab('summary')}>
                    <FontAwesome5
                        name="flag-checkered"
                        size={20}
                        color={activeTab === 'summary' ? theme.colors.primary : theme.colors.tertiaryText}
                    />
                </Pressable>

                <Pressable onPress={() => setActiveTab('time')}>
                    <FontAwesome5
                        name="stopwatch"
                        size={20}
                        color={activeTab === 'time' ? theme.colors.primary : theme.colors.tertiaryText}
                    />
                </Pressable>

                <Pressable onPress={() => setActiveTab('media')}>
                    <FontAwesome5
                        name="camera"
                        size={20}
                        color={activeTab === 'media' ? theme.colors.primary : theme.colors.tertiaryText}
                    />
                </Pressable>
            </SafeAreaView>
        </View>
    )
}
