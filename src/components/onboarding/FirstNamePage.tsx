import { createOnboardingStyles } from '@/styles/modules/OnboardingStyles';
import { t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

interface FirstNamePageProps {
    theme: MyTheme;
    currentPage: PageTitles
    firstName: string;
    setFirstName: (value: string) => void;
    onNext: (pageName: PageTitles) => void
}

export const FirstNamePage: React.FC<FirstNamePageProps> = (props) => {
    const onboardingStyles = createOnboardingStyles(props.theme);
    const [localName, setLocalName] = useState(props.firstName);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (props.currentPage !== "FirstName") return

        // Slight delay helps on Android / during navigation
        const timeout = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        return () => clearTimeout(timeout);
    }, [props.currentPage]);

    const handleNext = () => {
        const trimmed = localName.trim();
        if (trimmed.length > 0) {
            props.setFirstName(trimmed);
            props.onNext("Gender");
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: props.theme.colors.text }}>
                        {t('onboarding.firstNameQuestion')}
                    </Text>

                    <TextInput
                        ref={inputRef}
                        style={{
                            borderWidth: 1,
                            borderColor: props.theme.colors.border,
                            borderRadius: 12,
                            width: '80%',
                            height: 50,
                            paddingHorizontal: 16,
                            fontSize: 18,
                            color: props.theme.colors.text,
                            marginBottom: 20,
                        }}
                        placeholder={t('onboarding.firstName')}
                        placeholderTextColor={props.theme.colors.secondaryText}
                        value={localName}
                        onChangeText={setLocalName}
                        autoCapitalize="words"
                    />

                    <Pressable
                        onPress={handleNext}
                        style={[
                            onboardingStyles.nextButton,
                            localName.trim().length > 0 ? onboardingStyles.nextButtonActive : onboardingStyles.nextButtonInactive
                        ]}
                        disabled={localName.trim().length === 0}
                    >
                        <Text style={onboardingStyles.nextButtonText}>
                            {t('onboarding.next')}
                        </Text>
                    </Pressable>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};
