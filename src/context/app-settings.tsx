import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppSettings, defaultAppSettings, getAppSettings, saveAppSettings } from '../services/storage';

type AppSettingsContextValue = { settings: AppSettings; updateSettings: (next: Partial<AppSettings>) => Promise<void> };
const AppSettingsContext = createContext<AppSettingsContextValue>({ settings: defaultAppSettings, updateSettings: async () => {} });

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultAppSettings);
  useEffect(() => { getAppSettings().then(setSettings); }, []);
  const updateSettings = async (next: Partial<AppSettings>) => { const value = { ...settings, ...next }; setSettings(value); await saveAppSettings(value); };
  return <AppSettingsContext.Provider value={{ settings, updateSettings }}>{children}</AppSettingsContext.Provider>;
}

export const useAppSettings = () => useContext(AppSettingsContext);
