import { MyTheme } from '@/types/theme';
import { StyleSheet } from 'react-native';

export const createStyles = (theme: MyTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: 'column',
        },
        mapContainer: {
            height: '60%', // Map takes 60% of the screen
        },
        fullMapContainer: {
            flex: 1,
        },
        mapControls: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 24,
            zIndex: 11,
            elevation: 11,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
        },
        closeMapButton: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        compactStatsContainer: {
            flex: 1,
            flexDirection: 'row',
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 16,
            backgroundColor: theme.colors.background,
            shadowColor: theme.colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        compactStatItem: {
            flex: 1,
            alignItems: 'center',
        },
        map: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.border,
        },
        statsContainer: {
            height: '40%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            paddingVertical: 20,
            paddingHorizontal: 15,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            elevation: 5,
            shadowColor: theme.colors.text,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap', // Allows the items to wrap onto new lines
            justifyContent: 'space-evenly', // Even spacing between items
            width: '100%',
        },
        statItem: {
            width: '30%', // 3 items per row (100% / 3 = 33.33%, rounded to 30% for spacing)
            alignItems: 'center',
            marginBottom: 20, // Space between rows
        },
        valueText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.secondaryText,
        },
        unitText: {
            fontSize: 14,
            color: theme.colors.tertiaryText, // Lighter color for units
        },
        goalOverlay: {
            position: 'absolute',
            top: '60%', // slightly above the split (70/30)
            left: '50%',
            transform: [
                { translateX: -70 },
                { translateY: -70 },
            ],
            zIndex: 10,
            elevation: 10, // Android
        },
        goalSibling: {
            position: 'absolute',
            top: '60%', // slightly above the split (70/30)
            left: '50%',
            zIndex: 11,
            elevation: 11, // Android

            width: 48,
            height: 48,

            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        mapButton: {
            transform: [
                { translateX: -130 },
                { translateY: -24 },
            ],
        },
        muteButton: {
            transform: [
                { translateX: 82 },
                { translateY: -24 },
            ],
        },
    })
