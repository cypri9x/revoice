import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ErrorCard, ScreenHeader } from '../components/ui';
import { colors, radius, shadow } from '../theme';
import { getVisualIntentSuggestions } from '../services/api';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Camera() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureStep, setCaptureStep] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [lastFrames, setLastFrames] = useState<string[]>([]);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => { setActive(true); return () => setActive(false); }, []));

  const understandMoment = async () => {
    if (!cameraRef.current || !ready || capturing) return;
    setCapturing(true);
    setSuggestions([]);
    setError('');
    const frames: string[] = [];
    try {
      for (let index = 1; index <= 3; index += 1) {
        setCaptureStep(index);
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.2, skipProcessing: false });
        if (!photo?.base64) throw new Error('A frame could not be captured.');
        frames.push(photo.base64);
        if (index < 3) await wait(550);
      }
      setCaptureStep(0);
      setLastFrames(frames);
      setSuggestions(await getVisualIntentSuggestions(frames));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.');
    } finally {
      setCaptureStep(0);
      setCapturing(false);
    }
  };

  const refine = async () => {
    if (lastFrames.length !== 3 || !hint.trim()) return;
    setCapturing(true);
    setError('');
    try { setSuggestions(await getVisualIntentSuggestions(lastFrames, hint)); setHint(''); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setCapturing(false); }
  };

  if (!permission) return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.primary} /></SafeAreaView>;

  if (!permission.granted) return <SafeAreaView style={styles.permission}><Ionicons name="camera-outline" size={58} color={colors.primary} /><Text style={styles.permissionTitle}>Live Camera Assist</Text><Text style={styles.permissionCopy}>Allow camera access so ReVoice can understand the moment you choose to show. Images are not saved.</Text><Pressable style={styles.allowButton} onPress={requestPermission}><Text style={styles.allowText}>Allow camera</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.notNow}>Not now</Text></Pressable></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><ScreenHeader title="Live Camera Assist" onBack={() => router.back()} /></View>
    <Pressable style={styles.cameraWrap} onPress={understandMoment} disabled={capturing} accessibilityRole="button" accessibilityLabel="Capture three frames and understand this moment">
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" active={active} animateShutter={false} onCameraReady={() => setReady(true)} onMountError={({ message }) => setError(message)} />
      <View style={styles.vignette} />
      <View style={styles.guide}><View style={styles.cornerTopLeft} /><View style={styles.cornerTopRight} /><View style={styles.cornerBottomLeft} /><View style={styles.cornerBottomRight} /></View>
      {capturing && <View style={styles.captureOverlay}><View style={styles.pulse}><Text style={styles.captureNumber}>{captureStep || 'AI'}</Text></View><Text style={styles.captureTitle}>{captureStep ? `Capturing moment ${captureStep} of 3` : 'Understanding the moment...'}</Text><Text style={styles.captureCopy}>Keep the camera pointed at the situation</Text></View>}
      {!capturing && <View style={styles.cameraHint}><Ionicons name="scan-outline" size={20} color="white" /><Text style={styles.cameraHintText}>Point at the situation, then tap anywhere</Text></View>}
    </Pressable>
    <View style={styles.panel}>
      {error ? <ErrorCard message={error} /> : suggestions.length ? <><Text style={styles.panelTitle}>What might you want to say?</Text>{suggestions.map(suggestion => <Pressable key={suggestion} onPress={() => router.push({ pathname: '/speak', params: { text: suggestion } })} style={styles.suggestion}><Text style={styles.suggestionText}>{suggestion}</Text><Ionicons name="play-circle" size={38} color="#2867FA" /></Pressable>)}<Text style={styles.notQuite}>None of these? Add one small clue.</Text><View style={styles.refineRow}><TextInput value={hint} onChangeText={setHint} placeholder="Example: I want help" placeholderTextColor="#94A3B8" maxLength={160} style={styles.hintInput} onSubmitEditing={refine}/><Pressable onPress={refine} disabled={!hint.trim()||capturing} style={[styles.refineButton,(!hint.trim()||capturing)&&{opacity:.45}]}>{capturing?<ActivityIndicator color="white"/>:<Ionicons name="sparkles" size={21} color="white"/>}</Pressable></View></> : <><Text style={styles.panelTitle}>Show the moment, not just an object.</Text><Text style={styles.panelCopy}>ReVoice captures three temporary frames to understand what is happening. You always choose the phrase before anything is spoken.</Text><Pressable onPress={understandMoment} disabled={!ready || capturing} style={[styles.captureButton, (!ready || capturing) && { opacity: 0.55 }]}>{capturing ? <ActivityIndicator color="white" /> : <><View style={styles.captureDot} /><Text style={styles.captureButtonText}>Understand this moment</Text></>}</Pressable></>}
      {suggestions.length > 0 && <Pressable onPress={understandMoment} style={styles.tryAgain}><Ionicons name="refresh" size={18} color={colors.primary} /><Text style={styles.tryAgainText}>Scan another moment</Text></Pressable>}
      <Text style={styles.privacy}>Three frames are sent securely for analysis and are not stored by ReVoice.</Text>
    </View>
  </SafeAreaView>;
}

const corner = { position: 'absolute' as const, width: 32, height: 32, borderColor: 'white' };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }, header: { paddingHorizontal: 20, backgroundColor: colors.background },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 34, backgroundColor: colors.background }, permissionTitle: { fontFamily: 'Jakarta-Bold', fontSize: 25, color: colors.text, marginTop: 18 }, permissionCopy: { fontFamily: 'Jakarta-Regular', fontSize: 14, lineHeight: 22, color: colors.muted, textAlign: 'center', marginTop: 9 }, allowButton: { minWidth: 210, minHeight: 56, backgroundColor: '#2867FA', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 25 }, allowText: { color: 'white', fontFamily: 'Jakarta-SemiBold', fontSize: 15 }, notNow: { fontFamily: 'Jakarta-Medium', color: colors.muted, padding: 18 },
  cameraWrap: { height: '47%', minHeight: 300, backgroundColor: colors.navy, overflow: 'hidden' }, vignette: { position: 'absolute', inset: 0, backgroundColor: 'rgba(3,10,35,0.12)' }, guide: { position: 'absolute', inset: 28 }, cornerTopLeft: { ...corner, top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 }, cornerTopRight: { ...corner, top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 }, cornerBottomLeft: { ...corner, bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 }, cornerBottomRight: { ...corner, bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  cameraHint: { position: 'absolute', bottom: 18, alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(7,20,59,0.75)', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 99 }, cameraHintText: { color: 'white', fontFamily: 'Jakarta-Medium', fontSize: 12 }, captureOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(7,20,59,0.72)', alignItems: 'center', justifyContent: 'center' }, pulse: { width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }, captureNumber: { color: 'white', fontFamily: 'Jakarta-ExtraBold', fontSize: 28 }, captureTitle: { color: 'white', fontFamily: 'Jakarta-Bold', fontSize: 17, marginTop: 15 }, captureCopy: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Jakarta-Regular', fontSize: 12, marginTop: 5 },
  panel: { flex: 1, padding: 18, backgroundColor: colors.background }, panelTitle: { fontFamily: 'Jakarta-Bold', fontSize: 18, color: colors.text }, panelCopy: { fontFamily: 'Jakarta-Regular', fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 5 }, captureButton: { minHeight: 58, borderRadius: radius.md, backgroundColor: '#2867FA', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, marginTop: 14, ...shadow }, captureDot: { width: 17, height: 17, borderRadius: 9, backgroundColor: 'white', borderWidth: 4, borderColor: '#C9DAFF' }, captureButtonText: { fontFamily: 'Jakarta-SemiBold', fontSize: 15, color: 'white' },
  suggestion: { minHeight: 62, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }, suggestionText: { flex: 1, fontFamily: 'Jakarta-Medium', fontSize: 13, lineHeight: 19, color: colors.text }, notQuite:{fontFamily:'Jakarta-SemiBold',fontSize:11,color:colors.muted,marginTop:10},refineRow:{flexDirection:'row',gap:8,marginTop:6},hintInput:{flex:1,minHeight:44,borderRadius:radius.sm,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,paddingHorizontal:12,fontFamily:'Jakarta-Regular',fontSize:12,color:colors.text},refineButton:{width:46,borderRadius:radius.sm,backgroundColor:colors.purple,alignItems:'center',justifyContent:'center'}, tryAgain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 12 }, tryAgainText: { fontFamily: 'Jakarta-SemiBold', fontSize: 12, color: colors.primary }, privacy: { fontFamily: 'Jakarta-Regular', fontSize: 9, color: '#94A3B8', textAlign: 'center', marginTop: 10 },
});
