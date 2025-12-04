# Mobile app (React Native + Expo)

This folder contains a fresh Expo-based React Native shell for the NourishLens experience. It reuses Supabase for auth/data and mirrors the main app navigation (Diary, Add, Recipes, Progress, Settings) with native screens.

## Quick start

1. Copy environment variables:
   - `cp .env.example .env`
   - Fill `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` with the same values you use for the web app.
2. Install dependencies (Expo will align versions for your SDK):
   - `cd mobile`
   - `npm install` (or `bun install`/`yarn`)  
   - If versions drift, run `npx expo install <pkg>` to match the SDK.
3. Run the app:
   - `npm run start`
   - Press `i` for iOS simulator or `a` for Android emulator in the Expo CLI.

## What’s implemented

- Supabase client configured for React Native storage (AsyncStorage) with `detectSessionInUrl: false`.
- Auth context with sign-in/up/out flows.
- Navigation: stack + bottom tabs covering Diary, Add, Recipes, Progress, Settings, and a placeholder Onboarding screen.
- Diary screen pulls profile, meals (with meal_items), water logs, and steps for the selected day, matching the web data model.

## Next steps to reach feature parity

- Flesh out Add flows: camera ingestion, barcode scanning, search, and voice—each as dedicated screens calling the existing Supabase tables/functions.
- Port onboarding UI/logic to write into `profiles`, `program_steps`, etc., mirroring the web steps and validations.
- Recreate recipe browsing and detail views using a RN chart/image solution (e.g., `react-native-svg`, `victory-native`).
- Build progress charts for weight/macros/steps; reuse queries from `src/pages/Progress.tsx`.
- Add theming and shared components (buttons, cards) or adopt NativeWind if you want Tailwind-like styling in RN.
- Hook up push notifications and deep links (`scheme` is `nourishlens`) once flows are in place.
