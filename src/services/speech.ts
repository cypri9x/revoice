import * as Speech from 'expo-speech';
import { saveSpokenPhrase } from './storage';

export async function speak(text: string, slower = false, callbacks?: { onStart?: () => void; onDone?: () => void; onError?: () => void }) {
  await Speech.stop();
  await new Promise(resolve => setTimeout(resolve, 120));
  Speech.speak(text, { language: 'en-US', rate: slower ? 0.69 : 0.92, pitch: 1, onStart: callbacks?.onStart, onDone: callbacks?.onDone, onStopped: callbacks?.onDone, onError: callbacks?.onError });
  await saveSpokenPhrase(text);
}
export const stopSpeaking = () => Speech.stop();
