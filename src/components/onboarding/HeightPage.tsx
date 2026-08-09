import { createOnboardingStyles } from '@/styles/modules/OnboardingStyles';
import { t } from '@/i18n';
import { PageTitles } from '@/types';
import { MyTheme } from '@/types/theme';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Dimensions, Pressable, Text, View } from 'react-native';

interface HeightPageProps {
    theme: MyTheme;
    height: number;
    setHeight: React.Dispatch<React.SetStateAction<number>>;
    heightUnit: 'cm' | 'ft';
    setHeightUnit: React.Dispatch<React.SetStateAction<'cm' | 'ft'>>;
    onNext: (pageName: PageTitles) => void
}

const { width } = Dimensions.get('window');

export const HeightPage: React.FC<HeightPageProps> = (props) => {
    const onboardingStyles = createOnboardingStyles(props.theme);
    const isCm = props.heightUnit === 'cm';
    const cmToFt = (cm: number) => Math.floor(cm / 30.48);
    const ftToCm = (ft: number) => Math.floor(ft * 30.48);

    const pressHeight = (direction: "plus" | "minus") => {
        let newHeight = props.height

        if (direction === "plus") newHeight++
        if (direction === "minus") newHeight--

        setHeightWithHaptics(newHeight)
    }

    const setHeightWithHaptics = (value: number) => {
        props.setHeight(value);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <View style={onboardingStyles.center}>
            <Text style={onboardingStyles.title}>{t('onboarding.height')}</Text>

            <View style={onboardingStyles.valueRow}>
                <Pressable
                    style={onboardingStyles.roundButton}
                    onPress={() => pressHeight('minus')}
                >
                    <Text style={onboardingStyles.roundButtonText}>-</Text>
                </Pressable>

                <Text style={onboardingStyles.value}>
                    {isCm
                        ? `${props.height} cm`
                        : `${props.height.toFixed(1)} ft`}
                </Text>

                <Pressable
                    style={onboardingStyles.roundButton}
                    onPress={() => pressHeight('plus')}
                >
                    <Text style={onboardingStyles.roundButtonText}>+</Text>
                </Pressable>
            </View>


            <Slider
                minimumValue={isCm ? 120 : 4}
                maximumValue={isCm ? 220 : 7}
                step={isCm ? 1 : 0.1}
                value={props.height}
                onValueChange={setHeightWithHaptics}
                minimumTrackTintColor="green"
                maximumTrackTintColor="#ccc"
                thumbTintColor="green"
                style={{ width: width * 0.8 }}
            />

            <View style={onboardingStyles.toggleContainer}>
                <Pressable
                    style={[
                        onboardingStyles.toggleButton,
                        props.heightUnit === 'cm' && onboardingStyles.toggleActive,
                    ]}
                    onPress={() => {
                        if (props.heightUnit !== 'cm') {
                            setHeightWithHaptics(ftToCm(props.height));
                            props.setHeightUnit('cm');
                        }
                    }}
                >
                    <Text
                        style={[
                            onboardingStyles.toggleText,
                            props.heightUnit === 'cm' && onboardingStyles.toggleTextActive,
                        ]}
                    >
                        CM
                    </Text>
                </Pressable>

                <Pressable
                    style={[
                        onboardingStyles.toggleButton,
                        props.heightUnit === 'ft' && onboardingStyles.toggleActive,
                    ]}
                    onPress={() => {
                        if (props.heightUnit !== 'ft') {
                            setHeightWithHaptics(cmToFt(props.height));
                            props.setHeightUnit('ft');
                        }
                    }}
                >
                    <Text
                        style={[
                            onboardingStyles.toggleText,
                            props.heightUnit === 'ft' && onboardingStyles.toggleTextActive,
                        ]}
                    >
                        FT
                    </Text>
                </Pressable>
            </View>

            <Pressable
                onPress={() => props.onNext("Weight")}
                style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: props.theme.colors.success,
                }}
            >
                <Text style={{ color: props.theme.colors.onPrimary }}>
                    {t('onboarding.next')}
                </Text>
            </Pressable>
        </View>
    );
};
