import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem } from '../types';

const HISTORY_KEY = '@revoice/history';
const ONBOARDING_KEY = '@revoice/onboarding';
const QUICK_CARDS_KEY = '@revoice/quick-cards';
const PROFILE_KEY = '@revoice/care-profile';
const SETTINGS_KEY = '@revoice/settings';

export type CareProfile = { name: string; people: string; places: string; routine: string; preferences: string };
export type QuickCard = { icon: string; label: string; text: string };
export const emptyCareProfile: CareProfile = { name: '', people: '', places: '', routine: '', preferences: '' };
export type AppSettings = { darkMode: boolean; defaultSlower: boolean };
export const defaultAppSettings: AppSettings = { darkMode: false, defaultSlower: false };

export async function hasCompletedOnboarding() { return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true'; }
export async function completeOnboarding() { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); }
export async function getHistory(): Promise<HistoryItem[]> {
  try { return JSON.parse((await AsyncStorage.getItem(HISTORY_KEY)) ?? '[]'); } catch { return []; }
}
export async function saveSpokenPhrase(text: string) {
  const items = await getHistory();
  const existing = items.find(item => item.text.trim().toLowerCase() === text.trim().toLowerCase());
  const remaining = existing ? items.filter(item => item.id !== existing.id) : items;
  const item: HistoryItem = { id: `${Date.now()}`, text, createdAt: new Date().toISOString(), favorite: false };
  if (existing) item.favorite = existing.favorite;
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...remaining].slice(0, 30)));
}
export async function setHistory(items: HistoryItem[]) { await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items)); }
export async function getQuickCards(fallback: QuickCard[]) { try { const raw = await AsyncStorage.getItem(QUICK_CARDS_KEY); if (raw === null) return fallback; const saved = JSON.parse(raw); return Array.isArray(saved) ? saved as QuickCard[] : fallback; } catch { return fallback; } }
export async function saveQuickCards(cards: QuickCard[]) { await AsyncStorage.setItem(QUICK_CARDS_KEY, JSON.stringify(cards)); }
export async function getCareProfile(): Promise<CareProfile> { try { return { ...emptyCareProfile, ...JSON.parse((await AsyncStorage.getItem(PROFILE_KEY)) ?? '{}') }; } catch { return emptyCareProfile; } }
export async function saveCareProfile(profile: CareProfile) { await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
export async function getAppSettings(): Promise<AppSettings> { try { return { ...defaultAppSettings, ...JSON.parse((await AsyncStorage.getItem(SETTINGS_KEY)) ?? '{}') }; } catch { return defaultAppSettings; } }
export async function saveAppSettings(settings: AppSettings) { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
