import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem } from '../types';

const HISTORY_KEY = '@revoice/history';
const ONBOARDING_KEY = '@revoice/onboarding';

export async function hasCompletedOnboarding() { return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true'; }
export async function completeOnboarding() { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); }
export async function getHistory(): Promise<HistoryItem[]> {
  try { return JSON.parse((await AsyncStorage.getItem(HISTORY_KEY)) ?? '[]'); } catch { return []; }
}
export async function saveSpokenPhrase(text: string) {
  const items = await getHistory();
  const item: HistoryItem = { id: `${Date.now()}`, text, createdAt: new Date().toISOString(), favorite: false };
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...items].slice(0, 100)));
}
export async function setHistory(items: HistoryItem[]) { await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items)); }
