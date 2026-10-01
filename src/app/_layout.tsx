import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { View } from 'react-native';
import { colors } from '../theme';
import { configureRevenueCat } from '../services/revenuecat';
import { AppSettingsProvider, useAppSettings } from '../context/app-settings';

export default function RootLayout() {
  const [loaded] = useFonts({ 'Jakarta-Regular': PlusJakartaSans_400Regular, 'Jakarta-Medium': PlusJakartaSans_500Medium, 'Jakarta-SemiBold': PlusJakartaSans_600SemiBold, 'Jakarta-Bold': PlusJakartaSans_700Bold, 'Jakarta-ExtraBold': PlusJakartaSans_800ExtraBold });
  useEffect(() => { configureRevenueCat(); }, []);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return <AppSettingsProvider><AppNavigator /></AppSettingsProvider>;
}

function AppNavigator() {
  const { settings } = useAppSettings();
  const backgroundColor = settings.darkMode ? '#071022' : colors.background;
  return <><StatusBar style={settings.darkMode ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor }, animation: 'slide_from_right' }} /></>;
}
