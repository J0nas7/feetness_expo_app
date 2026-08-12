# Feetness frontend

Feetness is a cross-platform workout companion built with Expo and React Native. It supports planning and recording running, walking, and cycling workouts, then reviewing them through a calendar, maps, pace and elevation summaries, and progress views.

The app currently stores user data locally on the device; it does not require a backend to run.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [Native development notes](#native-development-notes)
- [Localization](#localization)
- [Before submitting changes](#before-submitting-changes)

## Features

- Goal-based workout sessions with time, distance, pace, elevation, and route tracking
- Background location tracking and spoken workout updates
- Workout plans, calendar management, history, and progress charts
- iOS HealthKit integration, Live Activities, and an Apple Watch target
- Android foreground workout notifications and native background speech
- Light and dark themes
- English and Danish localization

## Tech Stack

- Expo SDK 54, React Native 0.81, and React 19
- TypeScript with strict mode enabled
- Expo Router for file-based navigation
- React Navigation for tabs and theming
- AsyncStorage for local persistence
- Expo Location and Task Manager for workout tracking
- Native iOS and Android modules generated through local Expo config plugins

## Prerequisites

- Node.js (a current LTS release) and npm
- A physical iOS or Android device for realistic location and background testing
- For iOS: macOS, Xcode, CocoaPods, and an Apple developer team for HealthKit, App Groups, Live Activities, and the Watch target
- For Android: Android Studio, the Android SDK, and a Google Maps API key

Because Feetness contains custom native modules, Expo Go cannot exercise the complete app. Use a local development build with `npm run ios` or `npm run android`.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env
   ```

3. Add an Android Google Maps key to `.env`:

   ```dotenv
   GOOGLE_MAPS_API_KEY=your_key_here
   ```

   This value is read by `app.config.js` during the native build. It can remain empty when working only on iOS.

4. Generate the native projects when needed:

   ```bash
   npm run prebuild:clean
   ```

5. Build and launch the app:

   ```bash
   npm run ios
   # or
   npm run android
   ```

After the development build is installed, `npm start` starts the Metro bundler for subsequent JavaScript and TypeScript changes.

> `npm run prebuild:clean` deletes and regenerates `ios/`, `android/`, and `.expo/`. Do not keep manual native changes in those generated folders. Put reproducible native changes in `native_plugins/` or `targets/` instead.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo development server |
| `npm run ios` | Compile and run the iOS development build |
| `npm run android` | Compile and run the Android development build |
| `npm run web` | Start the web version; native workout features are limited |
| `npm run lint` | Run the Expo ESLint configuration |
| `npm run prebuild:clean` | Regenerate native projects and apply local config plugins |

There is no automated test command yet. At minimum, run `npm run lint` and manually exercise the affected platform before opening a pull request.

## Project Structure

```text
src/
  app/                 Expo Router routes and tab layout
  components/          Screens and reusable UI grouped by feature
  hooks/               Workout, plan, settings, and onboarding behavior
  i18n/                English and Danish application/native strings
  styles/              Shared style modules
  types/               Application and theme types
  utils/               Location tracking, persistence, and native bridges
assets/                 Icons, splash images, fonts, and other static assets
native_plugins/         Expo config plugins and native source templates
targets/                Apple Watch and Live Activity widget targets
app.config.js           Expo app, permissions, platform, and plugin config
```

The `@/` import alias maps to `src/`. Routes live in `src/app`; adding a file there adds a route. Most domain state is exposed through hooks and persisted with AsyncStorage.

## Key Components

- **App shell:** `src/app/_layout.tsx` configures navigation, themes, onboarding, and application-state handling.
- **Workout experience:** `src/components/exercise` contains active workout controls, goal progress, editing, and post-workout summaries.
- **Workout tracking:** `src/hooks/useWorkoutSession.ts` coordinates workout state, while `src/utils/location` handles background location updates, distance, pace, and elevation.
- **Plans and calendar:** `src/components/plan` manages workout plans, and `src/components/calendar` presents scheduled and completed workouts.
- **Progress:** `src/components/progress` provides period-based workout charts and summaries.
- **Native bridges:** `src/utils/native` connects the React Native app to Live Activities, Apple Watch communication, and platform speech services.
- **Localization:** `src/i18n` contains the typed translation helper and feature-level English and Danish strings.

## Native development notes

- Test workout tracking on a real device. Simulators are useful for UI work but do not accurately represent GPS movement, background execution, HealthKit, notifications, or Watch communication.
- Location access includes foreground and background permissions. A workout should be checked with the app active, backgrounded, paused, resumed, and stopped.
- iOS native capabilities depend on the bundle identifier, Apple team, App Group, and entitlements in `app.config.js`. Developers using another Apple account must update those values consistently.
- The Steps screen currently uses demo data; HealthKit permission support exists, but the screen is not yet backed by live step queries.
- Web is primarily useful for quick UI feedback. HealthKit, Live Activities, Apple Watch communication, background location behavior, and the Android workout service are native-only.

## Localization

Application translations are split by feature under `src/i18n/en` and `src/i18n/da`. Native target strings live in the corresponding `.lproj` directories under `targets/`.

When adding user-facing copy:

1. Add the same key to both application locales.
2. Use `t('feature.key')` instead of inline text.
3. Update native target localization files too when the copy appears in the Watch app or Live Activity.

## Before submitting changes

Run:

```bash
npm run lint
npx tsc --noEmit
```

For changes involving permissions, config plugins, or native targets, regenerate the native projects and verify a clean platform build as well.
