# virt
 
A swipe-based dating app prototype built with React Native, Expo, and Supabase. It includes email authentication, profile onboarding, a mutual-preference discovery feed, real-time chat, push notifications, and a handful of polished match animations.
 
> **Note:** This project was built with the help of [Claude](https://claude.ai), an AI assistant made by Anthropic.
 
> **Status:** Prototype. Not production-ready. See [Known limitations](#known-limitations).
 
---
 
## Features
 
- **Authentication**: email and password sign-up and login through Supabase Auth, with the session persisted on-device
- **Onboarding**: new users build a profile (name, age, gender, bio, interests, photos, who they're looking for, age range, distance)
- **Discovery feed**: swipeable profile cards with photo "story" bars
  - Mutual filtering: both people must fit each other's gender and age preferences
  - Already-liked profiles are excluded, and profiles without photos are skipped
  - Boosted profiles are surfaced first, and the rest are shuffled
  - Daily like limit (50 free likes per UTC day)
- **Matching**: a mutual like creates a match, with a full-screen match animation, haptics, and sound
- **Matches screen**: matches, conversations with last-message previews, and a "Liked you" tab (premium-gated)
- **Real-time chat**: messages sync live through Supabase Realtime
- **Push notifications**: sent through the Expo push service for new matches and messages
- **Photo uploads**: images are uploaded to Supabase Storage
- **Settings**: change email or password, hide your profile from the feed, log out, and delete your account
## Tech stack
 
| Area | Technology |
| --- | --- |
| Framework | [Expo](https://expo.dev) SDK 54, React Native 0.81, React 19 |
| Language | TypeScript (strict mode) |
| Backend | [Supabase](https://supabase.com): Auth, Postgres, Realtime, Storage |
| Gestures and animation | `react-native-gesture-handler`, React Native `Animated` |
| Feedback | `expo-haptics`, `expo-audio` |
| Media | `expo-image-picker`, `expo-linear-gradient` |
| Notifications | `expo-notifications`, `expo-device` |
| Fonts | `@expo-google-fonts/lilita-one` |
 
## Project structure
 
```
.
├── App.tsx                 # Root component, auth gate, bottom tab bar
├── index.ts                # Expo entry point
├── components/             # ProfileCard, MatchExplosion, NumberPicker, ErrorBoundary
├── context/                # AuthContext, ProfileContext
├── data/                   # Shared types, constants, legacy mock profiles
├── lib/
│   ├── supabase.ts         # Supabase client (reads env vars)
│   ├── feedAlgorithm.ts    # Feed filtering, likes, match creation
│   ├── notifications.ts    # Expo push registration and sending
│   └── storage.ts          # Photo upload helper
├── screens/                # Feed, Matches, Chat, MyProfile, Settings, Onboarding
│   └── auth/               # Login, Signup
└── assets/                 # Icons and sound effects
```
 
## Getting started
 
### Prerequisites
 
- Node.js (LTS recommended)
- The [Expo Go](https://expo.dev/go) app on a phone, or an iOS simulator or Android emulator
- A free [Supabase](https://supabase.com) project
### 1. Install dependencies
 
```bash
npm install
```
 
### 2. Configure environment variables
 
Copy the example file and fill in your own Supabase values:
 
```bash
cp .env.example .env
```
 
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
```
 
Both values are in your Supabase dashboard under **Project Settings → API**.
 
> **Never commit your `.env` file.** It is already listed in `.gitignore`. Use only the **anon / publishable** key in this app, and never the `service_role` key.
 
Optionally, set `EXPO_PUBLIC_DEV_MODE=true` to show a "Reset likes" button on the profile screen while testing.
 
### 3. Set up the Supabase backend
 
The app expects the following. A SQL schema is **not included** in this repository yet, so you will need to create them yourself.
 
**Tables**
 
| Table | Columns the app uses |
| --- | --- |
| `profiles` | `id` (matches the auth user id), `name`, `age`, `bio`, `photos` (text[]), `interests` (text[]), `gender`, `looking_for`, `distance_preference`, `age_min`, `age_max`, `is_premium`, `hidden`, `boosted_until`, `push_token` |
| `likes` | `id`, `liker_id`, `liked_id`, `created_at` (unique on `liker_id, liked_id`) |
| `matches` | `id`, `user1_id`, `user2_id` (unique on `user1_id, user2_id`) |
| `messages` | `id`, `match_id`, `sender_id`, `content`, `created_at` |
 
**Storage**: a public bucket named `photos`.
 
**Realtime**: enable Realtime on the `messages` table.
 
**Row Level Security**: enable RLS on every table and write policies so users can only read and write what they should. The anon key ships inside the app bundle, so RLS is your real security boundary.
 
### 4. Run the app
 
```bash
npm start        # Expo dev server
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web (limited support)
```
 
## Known limitations
 
This is a prototype, and these are the main gaps to close before anything resembling a real launch:
 
- **No database schema or RLS policies in the repo.** Security depends entirely on how your Supabase project is configured.
- **The daily like limit is enforced on the client**, so it can be bypassed. Move it server-side (an RPC or database policy).
- **Push notifications are sent from the client.** A server-side function would be safer and more reliable.
- **Premium is a flag only.** `is_premium` and `boosted_until` are read from the database, but there is no payment integration.
- **Account deletion removes the profile row.** Confirm that your database cascades to likes, matches, and messages, and that uploaded photos and the auth user are cleaned up.
- **No distance or location logic yet.** `distance_preference` is stored but not used for filtering.
- **Placeholder links.** The privacy policy, terms, and support email in Settings point to placeholder `virt.app` addresses.
- **Housekeeping.** Some dependencies in `package.json` are unused (`@react-navigation/*`, `react-native-masked-view`, `expo-av`, `expo-secure-store`, `@expo-google-fonts/fredoka-one`), and `data/profiles.ts` still contains unused mock profiles.
