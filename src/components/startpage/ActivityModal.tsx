import { activityName } from '@/i18n';
import { createStartpageStyles } from '@/styles/modules/StartpageStyles';
import { ExerciseType } from '@/types';
import { MyTheme } from '@/types/theme';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface Props {
    theme: MyTheme;
    visible: boolean;
    onClose: () => void;
    onSelect: (activity: ExerciseType) => void;
}

const ACTIVITIES: ExerciseType[] = ['cycling', 'running', 'walking'];

export const ActivityModal = ({ theme, visible, onClose, onSelect }: Props) => {
    const styles = createStartpageStyles(theme);
    return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
            {ACTIVITIES.map((activity) => (
                <Pressable key={activity} style={styles.modalItem} onPress={() => onSelect(activity)}>
                    <Text style={styles.modalItemText}>{activityName(activity)}</Text>
                </Pressable>
            ))}
        </View>
    </Modal>;
};
