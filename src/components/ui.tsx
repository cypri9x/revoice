import { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <View style={styles.brand}><Image source={require('../../assets/branding/revoice-symbol-transparent.png')} style={{ width: compact ? 34 : 44, height: compact ? 34 : 44 }} resizeMode="contain" /><Text style={[styles.brandText, compact && { fontSize: 21 }]}>ReVoice</Text></View>;
}
export function GradientButton({ title, icon = 'sparkles', onPress, disabled, loading, style }: { title: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; loading?: boolean; style?: ViewStyle }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.buttonWrap, style, pressed && { transform: [{ scale: 0.985 }] }, (disabled || loading) && { opacity: 0.55 }]}><LinearGradient colors={['#4F8CFF', '#2867FA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>{loading ? <ActivityIndicator color="white" /> : <><Ionicons name={icon} size={20} color="white" /><Text style={styles.buttonText}>{title}</Text></>}</LinearGradient></Pressable>;
}
export function ScreenHeader({ title, onBack, action }: { title?: string; onBack?: () => void; action?: ReactNode }) {
  return <View style={styles.header}>{onBack ? <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back"><Ionicons name="chevron-back" size={28} color={colors.text} /></Pressable> : <Brand compact />}{title ? <Text style={styles.headerTitle}>{title}</Text> : <View style={{ flex: 1 }} />}{action ?? <View style={{ width: 28 }} />}</View>;
}
export function ErrorCard({ message }: { message: string }) { return <View style={styles.error}><Ionicons name="cloud-offline-outline" size={22} color={colors.danger} /><View style={{ flex: 1 }}><Text style={styles.errorTitle}>We couldn't create suggestions right now.</Text><Text style={styles.errorText}>{message} Your Quick Speak tools are still available.</Text></View></View>; }

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brandText: { fontFamily: 'Jakarta-Bold', fontSize: 25, color: colors.text, letterSpacing: -1 },
  buttonWrap: { borderRadius: radius.md, ...shadow }, button: { minHeight: 58, borderRadius: radius.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 22 }, buttonText: { color: 'white', fontFamily: 'Jakarta-SemiBold', fontSize: 16 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 }, headerTitle: { flex: 1, fontFamily: 'Jakarta-Bold', fontSize: 20, color: colors.text },
  error: { backgroundColor: '#FFF3F5', borderColor: '#FFD7DE', borderWidth: 1, borderRadius: radius.md, padding: 16, flexDirection: 'row', gap: 12 }, errorTitle: { fontFamily: 'Jakarta-SemiBold', color: colors.text, marginBottom: 3 }, errorText: { fontFamily: 'Jakarta-Regular', color: colors.muted, lineHeight: 20 },
});
