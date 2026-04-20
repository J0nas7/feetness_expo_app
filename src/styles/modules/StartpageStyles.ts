import { MyTheme } from '@/types/theme';
import { Platform, StyleSheet } from 'react-native';

export const createStartpageStyles = (theme: MyTheme) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        mapContainer: {
            flex: 4, // 40%
            overflow: "visible",
            backgroundColor: theme.colors.border,
        },
        mapGradient: {
            position: 'absolute',
            bottom: 0,
            height: 150, // controls softness of transition
            width: '100%',
        },
        controls: {
            flex: 6, // 60%
            padding: 16,
            width: '100%',
            // borderTopLeftRadius: 32,
            // borderTopRightRadius: 32,
        },
        label: {
            fontSize: 16,
            fontWeight: '600',
            textAlign: "center",
            color: theme.colors.text,
            marginTop: 12,
        },
        value: {
            fontSize: 22,
            fontWeight: 'bold',
            color: theme.colors.text,
            textAlign: "center",
            marginBottom: 8,
            alignItems: "center",
        },
        picker: {
            marginVertical: Platform.OS === 'ios' ? 8 : 0,
        },

        valueRow: {
            width: '50%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            marginTop: 10,
        },

        roundButton: {
            width: 40,
            height: 40,
            borderRadius: "100%",
            backgroundColor: theme.colors.text,
            alignItems: 'center',
            justifyContent: 'center',
        },

        roundButtonText: {
            color: theme.colors.background,
            fontSize: 25,
            fontWeight: 700,
        },

        toggleContainer: {
            flexDirection: 'row',
            marginVertical: 12,
            boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.6)',
        },
        toggleButton: {
            flex: 1,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        toggleActive: {
            backgroundColor: theme.colors.success,
        },
        toggleText: {
            color: theme.colors.text,
            fontWeight: '600',
        },
        toggleTextActive: {
            color: theme.colors.text,
        },
        selectRow: {
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 14,
            marginTop: 8,
            boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.6)',
        },
        selectText: {
            fontSize: 16,
            color: theme.colors.text,
            textAlign: "center",
        },
        togglerButton: {
            marginTop: 10,
            alignSelf: 'center',
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.6)',
        },
        togglerText: {
            fontSize: 14,
            color: theme.colors.secondaryText,
        },
        modalBackdrop: {
            flex: 1,
            backgroundColor: theme.colors.overlay,
        },

        modalContainer: {
            backgroundColor: theme.colors.card,
            padding: 20,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
        },

        modalItem: {
            paddingVertical: 16,
        },

        modalItemText: {
            fontSize: 18,
            color: theme.colors.text,
        },

        startButton: {
            marginTop: 20,
            backgroundColor: theme.colors.success,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            boxShadow: '2px 2px 0 0 rgba(0, 0, 0, 0.6)',
        },
        startText: {
            color: theme.colors.onPrimary,
            fontSize: 20,
            fontWeight: 'bold',
        },
    });
