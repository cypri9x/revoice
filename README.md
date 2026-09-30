# ReVoice

**Turn intent into voice.**

ReVoice is an assistive communication app that helps a person turn fragments of meaning into possible spoken phrases. AI never decides what the person means:

**Human Intent → AI Assistance → Human Choice → Voice**

## Features

- Essential Quick Speak phrases that work without AI
- Intent Builder with exactly three AI-assisted interpretations
- Human selection before any phrase is spoken
- Device text-to-speech with slower, repeat, and stop controls
- Camera Assist for visual-context communication possibilities
- Local history and favorites
- RevenueCat-powered ReVoice+ subscription architecture
- Large touch targets, clear hierarchy, and accessible labels

## Architecture

The Expo mobile app calls two narrow Vercel functions: `POST /api/intent` and `POST /api/visual-intent`. Only the backend calls OpenAI. Device speech stays native and local. RevenueCat communicates directly through its mobile SDK.

## Run locally

1. Install dependencies with `npm install --legacy-peer-deps`.
2. Copy `.env.example` to `.env.local`.
3. Set `EXPO_PUBLIC_API_BASE_URL` to the deployed backend URL (or your LAN-accessible local URL).
4. Run `npm start` and scan the QR code with Expo Go.

Quick Speak, navigation, photo selection, and device TTS work in Expo Go. RevenueCat purchases require an EAS Development Build.

## Environment variables

- `EXPO_PUBLIC_API_BASE_URL`: public backend URL embedded in the app.
- `EXPO_PUBLIC_REVENUECAT_API_KEY`: RevenueCat **public** platform SDK key.
- `OPENAI_API_KEY`: backend-only **secret**. Configure it in Vercel Project Settings → Environment Variables. Never expose it through an `EXPO_PUBLIC_` variable.

## Development build

After configuring EAS and the Android RevenueCat public SDK key:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile development --platform android
```

Install the resulting build on the Android test device, then run `npx expo start --dev-client`.

## Safety and privacy

ReVoice is an assistive communication tool. It does not diagnose, treat, or provide medical advice and is not a substitute for professional care or emergency services. See [PRIVACY.md](./PRIVACY.md).

## Shipaton

Created by Gustavo de Carvalho Cypriano, University of São Paulo (USP), for RevenueCat Shipaton 2026 — Next Gen.

## License

MIT
