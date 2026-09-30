import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../theme';
import { hasCompletedOnboarding } from '../services/storage';

export default function Index() { const router = useRouter(); useEffect(() => { hasCompletedOnboarding().then(done => router.replace(done ? '/home' : '/onboarding')); }, [router]); return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>; }
