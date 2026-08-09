import { createOnboardingStyles } from '@/styles/modules/OnboardingStyles';
import { t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import { Pressable, Text, View } from 'react-native';

export type FitnessLevel = 'beginner' | 'experienced' | 'athletic';

interface FitnessLevelPageProps {
    theme: MyTheme;
    fitnessLevel: FitnessLevel | null;
    setFitnessLevel: React.Dispatch<React.SetStateAction<FitnessLevel | null>>;
    onNext: (pageName: PageTitles) => void
}

export const FitnessLevelPage: React.FC<FitnessLevelPageProps> = (props) => {
    const onboardingStyles = createOnboardingStyles(props.theme);
    return (
        <View style={onboardingStyles.center}>
            <Text style={onboardingStyles.title}>{t('onboarding.fitnessLevel')}</Text>

            <View style={onboardingStyles.toggleContainer}>
                {(['beginner', 'experienced', 'athletic'] as FitnessLevel[]).map(
                    (level) => (
                        <Pressable
                            key={level}
                            style={[
                                onboardingStyles.toggleButton,
                                props.fitnessLevel === level &&
                                onboardingStyles.toggleActive,
                            ]}
                            onPress={() => {
                                props.setFitnessLevel(level)
                                props.onNext("DateOfBirth")
                            }}
                        >
                            <Text
                                style={[
                                    onboardingStyles.toggleText,
                                    props.fitnessLevel === level &&
                                    onboardingStyles.toggleTextActive,
                                ]}
                            >
                                {t(`onboarding.fitnessLevels.${level}`).toUpperCase()}
                            </Text>
                        </Pressable>
                    )
                )}
            </View>
        </View>
    );
};
