import { createOnboardingStyles } from '@/styles/modules/OnboardingStyles';
import { useRepeatPress } from '@/hooks/useRepeatPress';
import { t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Dimensions, Pressable, Text, View } from 'react-native';

interface WeightPageProps {
    theme: MyTheme;
    weight: number;
    setWeight: React.Dispatch<React.SetStateAction<number>>;
    weightUnit: 'kg' | 'lb';
    setWeightUnit: React.Dispatch<React.SetStateAction<'kg' | 'lb'>>;
    onNext: (pageName: PageTitles) => void
}

const { width } = Dimensions.get('window');

export const WeightPage: React.FC<WeightPageProps> = (props) => {
    const onboardingStyles = createOnboardingStyles(props.theme);
    const isKg = props.weightUnit === 'kg';

    // Conversion functions
    const kgToLb = (kg: number) => Math.round(kg * 2.20462);
    const lbToKg = (lb: number) => Math.round(lb / 2.20462);

    const setWeightWithHaptics = (value: number) => {
        props.setWeight(value);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    const changeWeight = (amount: number) => {
        const minimum = isKg ? 30 : 66;
        const maximum = isKg ? 200 : 440;
        props.setWeight((current) => Math.min(Math.max(current + amount, minimum), maximum));
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    const decreaseWeightPress = useRepeatPress(() => changeWeight(-1));
    const increaseWeightPress = useRepeatPress(() => changeWeight(1));

    return (
        <View style={onboardingStyles.center}>
            <Text style={onboardingStyles.title}>{t('onboarding.weight')}</Text>

            <View style={onboardingStyles.valueRow}>
                <Pressable
                    style={onboardingStyles.roundButton}
                    {...decreaseWeightPress}
                >
                    <Text style={onboardingStyles.roundButtonText}>-</Text>
                </Pressable>

                <Text style={onboardingStyles.value}>
                    {isKg ? `${props.weight} kg` : `${props.weight.toFixed(1)} lb`}
                </Text>

                <Pressable
                    style={onboardingStyles.roundButton}
                    {...increaseWeightPress}
                >
                    <Text style={onboardingStyles.roundButtonText}>+</Text>
                </Pressable>
            </View>

            <Slider
                minimumValue={isKg ? 30 : 66}    // 30 kg ~ 66 lbs
                maximumValue={isKg ? 200 : 440}  // 200 kg ~ 440 lbs
                step={isKg ? 1 : 1}
                value={props.weight}
                onValueChange={setWeightWithHaptics}
                minimumTrackTintColor="green"
                maximumTrackTintColor="#ccc"
                thumbTintColor="green"
                style={{ width: width * 0.8, marginVertical: 20 }}
            />

            <View style={onboardingStyles.toggleContainer}>
                <Pressable
                    style={[
                        onboardingStyles.toggleButton,
                        props.weightUnit === 'kg' && onboardingStyles.toggleActive,
                    ]}
                    onPress={() => {
                        if (props.weightUnit !== 'kg') {
                            setWeightWithHaptics(lbToKg(props.weight));
                            props.setWeightUnit('kg');
                        }
                    }}
                >
                    <Text
                        style={[
                            onboardingStyles.toggleText,
                            props.weightUnit === 'kg' && onboardingStyles.toggleTextActive,
                        ]}
                    >
                        KG
                    </Text>
                </Pressable>

                <Pressable
                    style={[
                        onboardingStyles.toggleButton,
                        props.weightUnit === 'lb' && onboardingStyles.toggleActive,
                    ]}
                    onPress={() => {
                        if (props.weightUnit !== 'lb') {
                            setWeightWithHaptics(kgToLb(props.weight));
                            props.setWeightUnit('lb');
                        }
                    }}
                >
                    <Text
                        style={[
                            onboardingStyles.toggleText,
                            props.weightUnit === 'lb' && onboardingStyles.toggleTextActive,
                        ]}
                    >
                        LB
                    </Text>
                </Pressable>
            </View>

            <Pressable
                onPress={() => props.onNext("FitnessLevel")}
                style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: props.theme.colors.success,
                    marginTop: 20,
                }}
            >
                <Text style={{ color: props.theme.colors.onPrimary, fontWeight: 'bold' }}>
                    {t('onboarding.next')}
                </Text>
            </Pressable>
        </View>
    );
};
