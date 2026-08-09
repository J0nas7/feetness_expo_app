import { createOnboardingStyles } from '@/styles/modules/OnboardingStyles';
import { MyTheme } from '@/types/theme';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface SelectModalProps {
    theme: MyTheme;
    visible: boolean;
    items: string[];
    getItemLabel?: (value: string) => string;
    onSelect: (value: string) => void;
    onClose: () => void;
}

export const SelectModal: React.FC<SelectModalProps> = (props) => {
    const onboardingStyles = createOnboardingStyles(props.theme);
    return (
        <Modal
            visible={props.visible}
            transparent
            animationType="slide"
            onRequestClose={props.onClose}
        >
            <Pressable
                style={[
                    onboardingStyles.modalBackdrop,
                    { backgroundColor: props.theme.colors.overlay },
                ]}
                onPress={props.onClose}
            />

            <View
                style={[
                    onboardingStyles.modalContainer,
                    { backgroundColor: props.theme.colors.card },
                ]}
            >
                {props.items.map((item) => (
                    <Pressable
                        key={item}
                        style={onboardingStyles.modalItem}
                        onPress={() => props.onSelect(item)}
                    >
                        <Text
                            style={[
                                onboardingStyles.modalItemText,
                                { color: props.theme.colors.text },
                            ]}
                        >
                            {props.getItemLabel?.(item) ?? item}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </Modal>
    );
};
