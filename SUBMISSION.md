# ReVoice — Shipaton submission copy

## Tagline

Turn intent into voice.

## Short description

ReVoice is an AI-assisted communication app that helps people turn fragments of meaning, visual context, and incomplete speech into clear phrases they can review and speak aloud.

## Project description

ReVoice was built for people who know what they want to communicate but may have difficulty finding or producing the complete sentence in the moment. Essential communication never depends on AI: Quick Speak, Yes/No, common needs, and device text-to-speech remain immediately available.

For more complex situations, the Intent Builder turns a few simple clues into exactly three possible phrases. The person always reviews and chooses the message before ReVoice speaks it. Live Camera Assist can use temporary visual context to suggest relevant phrases, while Voice Intent and live captions offer another path when speaking a fragment is easier than typing it.

A local care profile can provide useful context such as important people, places, routines, and preferences. ReVoice+ uses RevenueCat offerings, purchases, CustomerInfo, restore purchases, and the active `pro` entitlement to unlock advanced tools. Premium access is never simulated or stored as a local flag.

The guiding principle is simple: AI should not speak for a person. It should help that person be heard.

## RevenueCat integration

ReVoice uses the RevenueCat React Native SDK with a `default` offering and Monthly, Yearly, and Lifetime packages. A successful purchase updates CustomerInfo, activates the `pro` entitlement, removes the Camera Assist lock immediately, and restores access after an app restart. The demo uses RevenueCat Test Store in an Android EAS Development Build.

## Social impact

Communication barriers can reduce independence in ordinary moments: asking for water, expressing pain, requesting help, or sharing a more personal thought. ReVoice combines always-available essentials with optional AI assistance while preserving human choice at every step. This approach is designed to support autonomy without pretending to infer a person's intent with certainty.

## Design notes

ReVoice uses large touch targets, a calm high-contrast visual hierarchy, recognizable communication cards, and a consistent blue-purple identity. Essential actions stay close to the Home screen, while advanced flows reveal complexity progressively. The interface also includes dark mode, editable and reorderable Quick Speak cards, front and rear camera support, and live captions.

## Repository

https://github.com/cypri9x/revoice

## Demo checklist

- Keep the published video under two minutes.
- Set the video to Public or Unlisted, not Private.
- Show the app running on Android.
- Show the complete RevenueCat flow: locked Camera Assist → ReVoice+ → Test Store purchase → active entitlement → unlocked Camera Assist.
- Avoid copyrighted music or third-party protected material.
