# Feetness

**Feetness** is a React Native/Expo fitness app, allowing users to track their workouts, routes, pace, distance, and duration. It supports activities like cycling, running, and walking, and provides voice feedback on progress.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Key Components](#key-components)

---

## Features

- Track workouts: cycling, running, and walking
- Real-time distance, pace, and duration tracking
- Map view of workout paths
- Voice feedback for progress every 5 minutes
- Pause/resume workouts
- Save workouts locally using AsyncStorage
- Goal-based tracking (distance or duration)
- Workout history accessible after finishing exercises

---

## Tech Stack

- **React Native** 0.81
- **Expo** 54
- **TypeScript**
- **React Navigation** 7
- **React Native Maps**
- **Expo Location & Task Manager** for GPS tracking
- **AsyncStorage** for persistent storage
- **Expo Speech** for voice feedback
- **Geolib** for distance calculations

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/feetness_expo_app.git
cd feetness_expo_app
```

2. Install dependencies:

```bash
npm install
```

3. Start the Expo development server:

```bash
npm start
```

4. Run on a device or simulator:

```bash
npm run android   # for Android
npm run ios       # for iOS
npm run web       # for Web
```

## Usage

1. Open the app on your device.
2. Navigate to Start in the tabs.
3. Select an exercise type: Cycling, Running, or Walking.
4. Set a goal (distance in km or duration in minutes).
5. Start the workout:
* The map shows your route in real time
* Voice prompts provide updates on progress
6. Pause/resume as needed.
7. Finish workout:
* The workout data (distance, pace, time, path) is saved locally
* You can view details on the Progress tab

## Project Structure

src/
├─ app/                # Main Expo Router screens
│  ├─ (tabs)/          # Bottom tab navigation
│  ├─ explore/         # Explore workouts
│  ├─ finished-exercise.tsx
│  └─ onboarding.tsx
├─ components/         # UI components
│  ├─ exercise/        # Workout components
│  │  ├─ exercise/     # Core exercise logic & map
│  │  ├─ GoalProgress.tsx
│  │  └─ FinishedExercise.tsx
│  └─ global/          # Global UI components
├─ types/              # TypeScript types
├─ utils/              # Utilities
│  ├─ location/        # Location tracking & workout store
│  └─ native/          # Native speech & live activity modules
└─ styles/             # Global styles

## Key Components

* Exercise.tsx: Main workout screen, handles state, timer, location tracking, and progress.
* ExerciseMap.tsx: Displays user's route and segments on a map.
* ExerciseStats.tsx: Shows distance, pace, elapsed time, and pause/resume controls.
* GoalProgress.tsx: Circular progress indicator for workout goals.
* workoutStore.ts: Handles background location updates, distance calculations, and notifying listeners.
* NativeSpeech.ts: Integrates text-to-speech for real-time workout feedback.

