# Hymnals of the Adventist Movement
## Complete Launch Guide — App Store & Google Play

---

## STEP 1 — Install prerequisites (do this once)

```bash
# Install Node.js (v18 or higher)
# Download from: https://nodejs.org

# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Verify installs
node --version   # should be 18+
eas --version    # should be 7+
```

---

## STEP 2 — Set up the project

```bash
# Navigate to the project folder (wherever you saved it)
cd hymnals-adventist

# Install all dependencies
npm install

# Start the development server
npx expo start
```

Press `i` to open iOS Simulator, or `a` for Android Emulator.
Or scan the QR code with the **Expo Go** app on your phone.

---

## STEP 3 — Create your Expo account & EAS project

```bash
# Create free account at expo.dev, then:
eas login

# Initialize EAS Build for this project
eas build:configure

# This generates your projectId — copy it into app.json under extra.eas.projectId
```

---

## STEP 4 — Developer accounts (one-time cost)

### Apple App Store
1. Go to: https://developer.apple.com/programs/
2. Enroll in Apple Developer Program — **$99/year**
3. Sign in with your Apple ID
4. After enrollment, get your:
   - Apple ID (your email)
   - Team ID (from Membership page)
   - App Store Connect App ID (after creating app in App Store Connect)
5. Put these into `eas.json` under `submit.production.ios`

### Google Play Store
1. Go to: https://play.google.com/console/
2. Create developer account — **$25 one-time fee**
3. Create the app in Play Console
4. Download service account JSON key for EAS Submit
5. Put path to that file in `eas.json` under `submit.production.android`

---

## STEP 5 — Content licensing (critical)

Before publishing, secure these licenses:

| Content | Status | Action needed |
|---------|--------|---------------|
| Pre-1928 hymnals | Public domain | Free to use |
| 1941 Church Hymnal | Likely public domain | Verify with Review & Herald |
| **1985 SDA Hymnal** | **Copyrighted** | **Contact Review & Herald: rhpa.org** |
| MIDI/audio files | Use public domain MIDI | Source from cpdl.org, MuseScore |
| Multilingual editions | Varies by division | Contact GC Publishing Ministry |

**Review & Herald contact:**
- Website: rhpa.org
- Address: 55 W. Oak Ridge Drive, Hagerstown, MD 21740

---

## STEP 6 — Build for production

```bash
# Build for BOTH platforms at once
eas build --platform all --profile production

# Or build separately:
eas build --platform ios     --profile production
eas build --platform android --profile production

# Monitor build progress at: https://expo.dev/builds
# Builds take 10–20 minutes
```

---

## STEP 7 — Submit to stores

```bash
# Submit iOS build to App Store Connect
eas submit -p ios

# Submit Android build to Google Play
eas submit -p android
```

### App Store metadata to prepare:
- App name: "Hymnals of the Adventist Movement"
- Category: Music / Reference
- Age rating: 4+
- Description (up to 4000 chars)
- Screenshots: iPhone 6.5", iPad 12.9" (required)
- App icon: 1024x1024 PNG (no alpha)
- Privacy policy URL (required — host on your website)

### Google Play metadata:
- Category: Music & Audio
- Content rating: Everyone
- Same screenshots/icon as above
- Privacy policy URL (required)

---

## STEP 8 — Review timelines

| Store | Typical review time |
|-------|-------------------|
| Apple App Store | 1–3 business days |
| Google Play | 2–7 business days |

**Common rejection reasons to avoid:**
- Missing privacy policy
- Audio playback requires background mode (already configured in app.json)
- Copyright claims — make sure all content is properly licensed

---

## STEP 9 — After launch

```bash
# Update the app (no review needed for JS-only changes with Expo Updates)
npx expo publish

# Full binary update (new native features, needs store review)
eas build --platform all
eas submit --platform all
```

---

## Project file structure

```
hymnals-adventist/
├── app.json                    ← Expo config
├── eas.json                    ← Build & submit config
├── package.json
├── src/
│   ├── database/
│   │   ├── schema.sql          ← Full SQLite schema (reference)
│   │   └── db.ts               ← All database queries
│   ├── screens/
│   │   ├── HymnBrowserScreen.tsx   ← Main browse screen
│   │   ├── HymnDetailScreen.tsx    ← Lyrics + audio + cross-index
│   │   ├── FavoritesScreen.tsx     ← (to build next)
│   │   ├── WorshipSetsScreen.tsx   ← (to build next)
│   │   └── SettingsScreen.tsx      ← (to build next)
│   ├── components/             ← Reusable UI components
│   ├── navigation/
│   │   └── AppNavigator.tsx    ← Tab + stack navigation
│   ├── hooks/                  ← Custom React hooks
│   ├── utils/                  ← Helpers
│   └── constants/
│       └── theme.ts            ← Colors, typography, spacing
└── assets/
    ├── audio/                  ← Downloaded MIDI/MP3 files
    ├── fonts/                  ← Custom fonts
    └── images/                 ← Icons, splash, covers
```

---

## Audio content sources (public domain)

| Source | URL | Content |
|--------|-----|---------|
| Choral Public Domain Library | cpdl.org | Sheet music, MusicXML |
| MuseScore Community | musescore.com | MIDI, public domain hymns |
| Hymnary.org | hymnary.org | Hymn metadata, texts |
| Adventist Digital Library | adventistdigitallibrary.org | Historical hymnals |
| Internet Archive | archive.org | Scanned historical editions |

---

## Need help?

- Expo docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction
- EAS Submit: https://docs.expo.dev/submit/introduction
- React Navigation: https://reactnavigation.org
- expo-sqlite: https://docs.expo.dev/versions/latest/sdk/sqlite
