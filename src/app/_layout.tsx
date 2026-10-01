import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { View } from "react-native";
import { colors } from "../theme";
import { AppSettingsProvider, useAppSettings } from "../context/app-settings";
import { RevenueCatProvider } from "../context/revenuecat";

export default function RootLayout() {
  const [loaded] = useFonts({
    "Jakarta-Regular": PlusJakartaSans_400Regular,
    "Jakarta-Medium": PlusJakartaSans_500Medium,
    "Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
    "Jakarta-Bold": PlusJakartaSans_700Bold,
    "Jakarta-ExtraBold": PlusJakartaSans_800ExtraBold,
  });
  if (!loaded)
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return (
    <AppSettingsProvider>
      <RevenueCatProvider>
        <AppNavigator />
      </RevenueCatProvider>
    </AppSettingsProvider>
  );
}

function AppNavigator() {
  const { settings } = useAppSettings();
  const backgroundColor = settings.darkMode ? "#071022" : colors.background;
  return (
    <>
      <StatusBar style={settings.darkMode ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
          animation: "slide_from_right",
        }}
      />
    </>
  );
}
