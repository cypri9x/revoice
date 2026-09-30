import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { View } from 'react-native';
import { colors } from '../theme';
import { configureRevenueCat } from '../services/revenuecat';

export default function RootLayout() {
  const [loaded] = useFonts({ 'Jakarta-Regular': PlusJakartaSans_400Regular, 'Jakarta-Medium': PlusJakartaSans_500Medium, 'Jakarta-SemiBold': PlusJakartaSans_600SemiBold, 'Jakarta-Bold': PlusJakartaSans_700Bold, 'Jakarta-ExtraBold': PlusJakartaSans_800ExtraBold });
  useEffect(() => { configureRevenueCat(); }, []);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }} /></>;
}
