import { t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CALENDAR_VIEWS, CalendarView } from './model';

interface Props {
    view: CalendarView;
    title: string;
    onChangeView: (view: CalendarView) => void;
    onMove: (direction: number) => void;
}

export const CalendarHeader = ({ view, title, onChangeView, onMove }: Props) => {
    const theme = useTheme() as MyTheme;
    const styles = StyleSheet.create({
        modeBar: { flexDirection: 'row', marginVertical: 12, padding: 3, borderRadius: 9, backgroundColor: theme.colors.surface },
        mode: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 7 },
        modeActive: { backgroundColor: theme.colors.background, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
        modeText: { color: theme.colors.secondaryText, fontSize: 12, fontWeight: '600' },
        modeTextActive: { color: theme.colors.primary },
        navigation: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
        navButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
        titleWrap: { flex: 1 },
        title: { color: theme.colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
    });

    return <>
        <View style={styles.modeBar}>{CALENDAR_VIEWS.map((item) => (
            <Pressable key={item} style={[styles.mode, view === item && styles.modeActive]} onPress={() => onChangeView(item)}>
                <Text style={[styles.modeText, view === item && styles.modeTextActive]}>{t(`progress.calendar.views.${item}`)}</Text>
            </Pressable>
        ))}</View>
        <View style={styles.navigation}>
            <Pressable style={styles.navButton} onPress={() => onMove(-1)}><FontAwesome5 name="chevron-left" size={17} color={theme.colors.primary} /></Pressable>
            <View style={styles.titleWrap}><Text style={styles.title}>{title}</Text></View>
            <Pressable style={styles.navButton} onPress={() => onMove(1)}><FontAwesome5 name="chevron-right" size={17} color={theme.colors.primary} /></Pressable>
        </View>
    </>;
};
