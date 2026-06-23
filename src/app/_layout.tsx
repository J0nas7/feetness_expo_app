import { AppStateGate, OnboardingGate } from '@/components';
import { MyTheme } from '@/types/theme';
import '@/utils/location/workoutLocationTask';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { DefaultTheme, DarkTheme as NavigationDarkTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const LightTheme: MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#ffffff',           // main container background
      text: '#000000',                 // default text
      primary: 'green',                // used for buttons/toggles
      card: '#eeeeee',                 // modal, controls container
      border: '#cccccc',               // borders like toggle, selectRow
      notification: '#ff3b30',         // optional for alerts
      secondaryText: '#333333',        // togglerText
      tertiaryText: '#777777',        // lighter color
      overlay: 'rgba(0,0,0,0.4)',      // modalBackdrop
      surface: '#eeeeee',              // togglerButton background
      success: 'green',                // startButton, toggleActive
      onPrimary: '#ffffff',            // text on buttons
    },
  };

  const DarkTheme: MyTheme = {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      background: '#121212',           // main container
      text: '#eeeeee',                 // default text
      primary: '#4caf50',              // green-ish for buttons
      card: '#1e1e1e',                 // modal, controls
      border: '#444444',               // borders
      notification: '#ff453a',         // alerts
      secondaryText: '#cccccc',        // togglerText
      tertiaryText: '#aaaaaa',        // darker color
      overlay: 'rgba(255,255,255,0.1)',// modal backdrop
      surface: '#2c2c2c',              // togglerButton background
      success: '#4caf50',              // startButton, toggleActive
      onPrimary: '#ffffff',            // text on buttons
    },
  };

  return (
    <GestureHandlerRootView>
      <ActionSheetProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
          <AppStateGate>
            <OnboardingGate />

            <Stack>
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="explore" options={{ headerShown: false }} />
              <Stack.Screen
                name="finished-exercise"
                options={{
                  headerShown: true,      // show header
                  title: 'Workout Complete', // custom title
                  headerLeft: () => (
                    <Pressable
                      onPress={() => router.back()}
                    >
                      <Text style={{ color: 'gray', fontWeight: 'bold' }}>&lt; Fremskridt</Text>
                    </Pressable>
                  ),
                }}
              />
            </Stack>
          </AppStateGate>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ActionSheetProvider>
    </GestureHandlerRootView>
  );
}
