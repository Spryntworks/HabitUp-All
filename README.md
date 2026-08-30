# HabitUp - Daily Habit Tracker (React Native & Expo)

A minimalist, frictionless daily habit tracker mobile application built with **React Native**, **Expo**, **TypeScript**, and **AsyncStorage**.

## Features

- **Daily Habit Tracking**: Tap to complete with celebratory animations and haptic feedback.
- **Streak & Analytics Engine**: Real-time calculated current streak, longest streak, completion percentage, and weekly distributions.
- **Gamified Living Plant Garden**: 5 evolutionary plant stages (from Sprouting Seed to Golden Tree of Life) synced with your consistency.
- **Interactive Calendar & Heatmaps**: Full monthly tracking with date-by-date habit check-in status.
- **Optimistic Sync & Local Persistence**: Offline-first storage via `@react-native-async-storage/async-storage`.
- **Customizable Habits**: Categories (Health, Fitness, Mindfulness, Learning, Productivity, Finance), custom colors, icons, frequencies, and reminder schedules.

## Project Structure

```
├── app.json                  # Expo mobile application configuration (iOS, Android)
├── package.json              # React Native, Expo & Web dependencies
├── App.tsx                   # Main React Native root entry point
└── src/
    ├── types.ts              # Data types & interfaces
    ├── context/
    │   └── HabitContext.tsx  # Centralized React Native state & persistence engine
    ├── components/
    │   ├── mobile/           # Native mobile components (BottomTabBar, MobileShell, HabitCard)
    │   ├── views/            # Native screens (Home, Habits, Stats, Calendar, Streaks, Settings)
    │   └── modals/           # Native modal dialogs (Create, Detail, Garden, Notifications)
    └── utils/                # Streak calculators & date formatters
```

## Running on Mobile (Expo)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

3. Scan the QR code using the **Expo Go** app on iOS or Android.

## Building Native Binaries (APK / IPA)

```bash
# Build Android standalone APK
npx eas-cli build -p android --profile preview

# Build iOS standalone IPA
npx eas-cli build -p ios --profile preview
```
