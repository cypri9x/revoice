import { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';
import { useAppSettings } from '../context/app-settings';

export function Brand({ compact = false }: { compact?: boolean }) {
  const { settings } = useAppSettings();
  return <View style={styles.brand}><Image source={require('../../assets/branding/revoice-symbol-transparent.png')} style={{ width: compact ? 34 : 44, height: compact ? 34 : 44 }} resizeMode="contain" /><Text style={[styles.brandText, compact && { fontSize: 21 }, settings.darkMode && styles.darkText]}>ReVoice</Text></View>;
}
export function GradientButton({ title, icon = 'sparkles', onPress, disabled, loading, style }: { title: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; loading?: boolean; style?: ViewStyle }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.buttonWrap, style, pressed && { transform: [{ scale: 0.985 }] }, (disabled || loading) && { opacity: 0.55 }]}><LinearGradient colors={['#4F8CFF', '#2867FA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>{loading ? <ActivityIndicator color="white" /> : <><Ionicons name={icon} size={20} color="white" /><Text style={styles.buttonText}>{title}</Text></>}</LinearGradient></Pressable>;
}
export function ScreenHeader({ title, onBack, action }: { title?: string; onBack?: () => void; action?: ReactNode }) {
  const { settings } = useAppSettings();
  const foreground = settings.darkMode ? '#F8FAFF' : colors.text;
  return <View style={styles.header}>{onBack ? <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back"><Ionicons name="chevron-back" size={28} color={foreground} /></Pressable> : <Brand compact />}{title ? <Text style={[styles.headerTitle, settings.darkMode && styles.darkText]}>{title}</Text> : <View style={{ flex: 1 }} />}{action ?? <View style={{ width: 28 }} />}</View>;
}
export function ErrorCard({ message }: { message: string }) {
  const networkError = /fetch|network|connection|internet/i.test(message);
  return <View style={styles.error}><Ionicons name={networkError ? 'wifi-outline' : 'sparkles-outline'} size={22} color={colors.danger} /><View style={{ flex: 1 }}><Text style={styles.errorTitle}>{networkError ? 'Connection paused' : 'Let’s try that again'}</Text><Text style={styles.errorText}>{networkError ? 'We couldn’t reach ReVoice right now. Check your connection and try once more.' : 'We couldn’t create a clear suggestion this time. Add a small detail or try again.'}</Text></View></View>;
}

const mainTabs = [
  { icon: 'home-outline', activeIcon: 'home', label: 'Home', path: '/home' },
  { icon: 'time-outline', activeIcon: 'time', label: 'History', path: '/history' },
  { icon: 'person-outline', activeIcon: 'person', label: 'Profile', path: '/profile' },
  { icon: 'settings-outline', activeIcon: 'settings', label: 'Settings', path: '/settings' },
] as const;

export function BottomNav({ active }: { active: 'Home' | 'History' | 'Profile' | 'Settings' }) {
  const router = useRouter();
  const { settings } = useAppSettings();
  return <View style={[styles.nav, settings.darkMode && styles.navDark]}>{mainTabs.map(tab => {
    const selected = tab.label === active;
    return <Pressable key={tab.label} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={tab.label} onPress={() => router.replace(tab.path)} style={styles.navItem}><Ionicons name={selected ? tab.activeIcon : tab.icon} size={23} color={selected ? colors.primary : colors.muted} /><Text style={[styles.navText, selected && styles.navTextActive]}>{tab.label}</Text></Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brandText: { fontFamily: 'Jakarta-Bold', fontSize: 25, color: colors.text, letterSpacing: -1 },
  buttonWrap: { borderRadius: radius.md, ...shadow }, button: { minHeight: 58, borderRadius: radius.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 22 }, buttonText: { color: 'white', fontFamily: 'Jakarta-SemiBold', fontSize: 16 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 }, headerTitle: { flex: 1, fontFamily: 'Jakarta-Bold', fontSize: 20, color: colors.text },
  error: { backgroundColor: '#FFF3F5', borderColor: '#FFD7DE', borderWidth: 1, borderRadius: radius.md, padding: 16, flexDirection: 'row', gap: 12 }, errorTitle: { fontFamily: 'Jakarta-SemiBold', color: colors.text, marginBottom: 3 }, errorText: { fontFamily: 'Jakarta-Regular', color: colors.muted, lineHeight: 20 },
  nav: { height: 72, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  navItem: { flex: 1, minWidth: 64, alignItems: 'center', gap: 3 },
  navText: { fontFamily: 'Jakarta-Medium', fontSize: 10, color: colors.muted },
  navTextActive: { color: colors.primary },
  navDark: { backgroundColor: '#0D172A', borderColor: '#263653' },
  darkText: { color: '#F8FAFF' },
});
