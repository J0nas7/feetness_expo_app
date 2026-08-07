import { createOnboardingStyles } from '@/styles/modules/OnboardingStyles';
import { t } from '@/i18n';
import { MyTheme } from '@/types/theme';
import { Pressable, Text, View } from 'react-native';

interface GenderPageProps {
    theme: MyTheme
    gender: string
    setGenderModalVisible: React.Dispatch<React.SetStateAction<boolean>>
}

export const GenderPage: React.FC<GenderPageProps> = (props) => {
    const onboardingStyles = createOnboardingStyles(props.theme);
    return (
        <View style={onboardingStyles.center}>
            <Text style={onboardingStyles.title}>{t('onboarding.gender')}</Text>

            <Pressable
                style={[onboardingStyles.selectRow, { borderColor: props.theme.colors.border }]}
                onPress={() => props.setGenderModalVisible(true)}
            >
                <Text style={[onboardingStyles.selectText, { color: props.theme.colors.text }]}>
                    {props.gender}
                </Text>
            </Pressable>
        </View>
    );
}
