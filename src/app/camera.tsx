import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ErrorCard, ScreenHeader } from '../components/ui';
import { colors, radius, shadow } from '../theme';
import { getIntentSuggestions, getVisualIntentSuggestions } from '../services/api';
import { getCareProfile } from '../services/storage';
import { useAppSettings } from '../context/app-settings';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
type SpeechResultEvent = { isFinal: boolean; results: { transcript: string }[] };
type SpeechErrorEvent = { error: string; message: string };
type SpeechModule = {
  addListener: (event: string, listener: (event: any) => void) => { remove: () => void };
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
};
const speechRecognition = requireOptionalNativeModule<SpeechModule>('ExpoSpeechRecognition');

export default function Camera() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const dark = settings.darkMode;
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureStep, setCaptureStep] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionMode, setSuggestionMode] = useState<'camera' | 'caption'>('camera');
  const [lastFrames, setLastFrames] = useState<string[]>([]);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const finalizingTranscript = useRef('');

  useFocusEffect(useCallback(() => { setActive(true); return () => { setActive(false); speechRecognition?.abort(); }; }, []));

  const completeCaption = useCallback(async (transcript: string) => {
    const clean = transcript.trim();
    if (!clean || finalizingTranscript.current === clean) return;
    finalizingTranscript.current = clean;
    setCaptionLoading(true);
    setError('');
    try {
      const profile = await getCareProfile();
      setSuggestionMode('caption');
      setSuggestions(await getIntentSuggestions([clean], profile));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.');
    } finally {
      setCaptionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!speechRecognition) return;
    const start = speechRecognition.addListener('start', () => setRecognizing(true));
    const end = speechRecognition.addListener('end', () => setRecognizing(false));
    const result = speechRecognition.addListener('result', (event: SpeechResultEvent) => {
      const transcript = event.results[0]?.transcript?.trim() ?? '';
      if (transcript) setLiveTranscript(transcript);
      if (event.isFinal && transcript) completeCaption(transcript);
    });
    const recognitionError = speechRecognition.addListener('error', (event: SpeechErrorEvent) => {
      setRecognizing(false);
      if (event.error !== 'aborted' && event.error !== 'no-speech') setError(event.message || 'Live captions are unavailable.');
    });
    return () => { start.remove(); end.remove(); result.remove(); recognitionError.remove(); };
  }, [completeCaption]);

  const toggleCaptions = async () => {
    if (!speechRecognition) {
      setError('Live captions require a ReVoice Development Build, not Expo Go.');
      return;
    }
    if (recognizing) {
      speechRecognition.stop();
      return;
    }
    const permissionResult = await speechRecognition.requestPermissionsAsync();
    if (!permissionResult.granted) {
      setError('Allow microphone and speech recognition access to use live captions.');
      return;
    }
    finalizingTranscript.current = '';
    setLiveTranscript('');
    setSuggestions([]);
    setError('');
    const profile = await getCareProfile();
    const contextualStrings = Object.values(profile).flatMap(value => value.split(/[,\n]/)).map(value => value.trim()).filter(Boolean).slice(0, 20);
    speechRecognition.start({ lang: 'en-US', interimResults: true, continuous: false, maxAlternatives: 1, contextualStrings, iosTaskHint: 'dictation' });
  };

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
      setSuggestionMode('camera');
      setSuggestions(await getVisualIntentSuggestions(frames));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.');
    } finally {
      setCaptureStep(0);
      setCapturing(false);
    }
  };

  const refine = async () => {
    if (!hint.trim() || (suggestionMode === 'camera' && lastFrames.length !== 3)) return;
    setCapturing(true);
    setError('');
    try {
      if (suggestionMode === 'camera') setSuggestions(await getVisualIntentSuggestions(lastFrames, hint));
      else setSuggestions(await getIntentSuggestions([liveTranscript, hint], await getCareProfile()));
      setHint('');
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setCapturing(false); }
  };

  const flipCamera = () => {
    if (capturing) return;
    setReady(false);
    setFacing(current => current === 'back' ? 'front' : 'back');
  };

  if (!permission) return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.primary} /></SafeAreaView>;

  if (!permission.granted) return <SafeAreaView style={styles.permission}><Ionicons name="camera-outline" size={58} color={colors.primary} /><Text style={styles.permissionTitle}>Live Camera Assist</Text><Text style={styles.permissionCopy}>Allow camera access so ReVoice can understand the moment you choose to show. Images are not saved.</Text><Pressable style={styles.allowButton} onPress={requestPermission}><Text style={styles.allowText}>Allow camera</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.notNow}>Not now</Text></Pressable></SafeAreaView>;

  return <SafeAreaView style={[styles.safe, dark && styles.safeDark]} edges={['top']}>
    <View style={[styles.header, dark && styles.safeDark]}><ScreenHeader title="Live Camera Assist" onBack={() => router.back()} dark={dark} action={<Pressable onPress={()=>router.push('/voice')} accessibilityRole="button" accessibilityLabel="Use voice without camera" style={styles.headerMic}><Ionicons name="mic" size={21} color={colors.purple}/></Pressable>} /></View>
    <Pressable style={styles.cameraWrap} onPress={understandMoment} disabled={capturing} accessibilityRole="button" accessibilityLabel="Capture three frames and understand this moment">
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} mirror={facing === 'front'} active={active} animateShutter={false} onCameraReady={() => setReady(true)} onMountError={({ message }) => setError(message)} />
      <View style={styles.vignette} />
      <View style={styles.guide}><View style={styles.cornerTopLeft} /><View style={styles.cornerTopRight} /><View style={styles.cornerBottomLeft} /><View style={styles.cornerBottomRight} /></View>
      {!capturing && <Pressable onPress={flipCamera} accessibilityRole="button" accessibilityLabel={`Use ${facing === 'back' ? 'front' : 'back'} camera`} style={styles.flipButton}><Ionicons name="camera-reverse-outline" size={25} color="white" /></Pressable>}
      {!capturing && <Pressable onPress={toggleCaptions} accessibilityRole="button" accessibilityLabel={recognizing ? 'Stop live captions' : 'Start live captions'} style={[styles.captionButton, recognizing && styles.captionButtonActive]}><Ionicons name={recognizing ? 'stop' : 'mic'} size={24} color="white" /></Pressable>}
      {(recognizing || liveTranscript || captionLoading) && <View style={styles.captionOverlay}><View style={styles.liveBadge}><View style={[styles.liveDot, recognizing && styles.liveDotActive]} /><Text style={styles.liveBadgeText}>{recognizing ? 'LIVE CAPTIONS' : captionLoading ? 'UNDERSTANDING' : suggestions.length ? 'POSSIBLE PHRASE' : 'CAPTION'}</Text></View>{suggestionMode === 'caption' && suggestions[0] && !recognizing ? <CameraCaption suggestion={suggestions[0]} transcript={liveTranscript} /> : <Text style={styles.captionText}>{liveTranscript || 'Listening...'}</Text>}{captionLoading && <ActivityIndicator color="#9A77FF" style={{ marginTop: 8 }} />}</View>}
      {capturing && <View style={styles.captureOverlay}><View style={styles.pulse}><Text style={styles.captureNumber}>{captureStep || 'AI'}</Text></View><Text style={styles.captureTitle}>{captureStep ? `Capturing moment ${captureStep} of 3` : 'Understanding the moment...'}</Text><Text style={styles.captureCopy}>Keep the camera pointed at the situation</Text></View>}
      {!capturing && <View style={styles.cameraHint}><Ionicons name="scan-outline" size={20} color="white" /><Text style={styles.cameraHintText}>Point at the situation, then tap anywhere</Text></View>}
    </Pressable>
    <View style={[styles.panel, dark && styles.safeDark]}>
      {error ? <ErrorCard message={error} /> : suggestions.length ? <><Text style={[styles.panelTitle,dark&&styles.textDark]}>{suggestionMode === 'caption' ? 'What might you mean?' : 'What might you want to say?'}</Text>{suggestions.map(suggestion => <Pressable key={suggestion} onPress={() => router.push({ pathname: '/speak', params: { text: suggestion } })} style={[styles.suggestion,dark&&styles.cardDark]}><AssistedPhrase suggestion={suggestion} transcript={suggestionMode === 'caption' ? liveTranscript : ''} dark={dark}/><Ionicons name="play-circle" size={38} color="#2867FA" /></Pressable>)}<Text style={styles.notQuite}>None of these? Add one small clue.</Text><View style={styles.refineRow}><TextInput value={hint} onChangeText={setHint} placeholder="Example: I want help" placeholderTextColor="#94A3B8" maxLength={160} style={[styles.hintInput,dark&&styles.cardDark,dark&&styles.textDark]} onSubmitEditing={refine}/><Pressable onPress={refine} disabled={!hint.trim()||capturing} style={[styles.refineButton,(!hint.trim()||capturing)&&{opacity:.45}]}>{capturing?<ActivityIndicator color="white"/>:<Ionicons name="sparkles" size={21} color="white"/>}</Pressable></View></> : <><Text style={[styles.panelTitle,dark&&styles.textDark]}>Show the moment, or turn on captions.</Text><Text style={styles.panelCopy}>Use the camera button for three temporary frames, or tap the microphone to see your words while you speak.</Text><Pressable onPress={understandMoment} disabled={!ready || capturing || recognizing} style={[styles.captureButton, (!ready || capturing || recognizing) && { opacity: 0.55 }]}>{capturing ? <ActivityIndicator color="white" /> : <><View style={styles.captureDot} /><Text style={styles.captureButtonText}>Understand this moment</Text></>}</Pressable></>}
      {suggestions.length > 0 && <Pressable onPress={suggestionMode === 'camera' ? understandMoment : toggleCaptions} style={styles.tryAgain}><Ionicons name="refresh" size={18} color={colors.primary} /><Text style={styles.tryAgainText}>{suggestionMode === 'camera' ? 'Scan another moment' : 'Try another caption'}</Text></Pressable>}
      <Text style={styles.privacy}>Frames or recognized text are sent only when you activate a tool. ReVoice does not store the camera or microphone recording.</Text>
    </View>
  </SafeAreaView>;
}

function AssistedPhrase({ suggestion, transcript, dark }: { suggestion: string; transcript: string; dark: boolean }) {
  const spoken = transcript.trim().replace(/[.!?]+$/, '');
  const isCompletion = spoken.length > 2 && suggestion.toLocaleLowerCase().startsWith(spoken.toLocaleLowerCase());
  if (!isCompletion) return <Text style={[styles.suggestionText,dark&&styles.textDark]}>{suggestion}</Text>;
  return <Text style={[styles.suggestionText,dark&&styles.textDark]}>{suggestion.slice(0, spoken.length)}<Text style={styles.assistedText}>{suggestion.slice(spoken.length)}</Text></Text>;
}

function CameraCaption({ suggestion, transcript }: { suggestion: string; transcript: string }) {
  const spoken = transcript.trim().replace(/[.!?]+$/, '');
  const isCompletion = spoken.length > 2 && suggestion.toLocaleLowerCase().startsWith(spoken.toLocaleLowerCase());
  if (!isCompletion) return <Text style={styles.captionText}>{suggestion}</Text>;
  return <Text style={styles.captionText}>{suggestion.slice(0, spoken.length)}<Text style={styles.captionCompletion}>{suggestion.slice(spoken.length)}</Text></Text>;
}

const corner = { position: 'absolute' as const, width: 32, height: 32, borderColor: 'white' };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, safeDark:{backgroundColor:'#071022'},textDark:{color:'#F8FAFF'},cardDark:{backgroundColor:'#111C33',borderColor:'#263653'}, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }, header: { paddingHorizontal: 20, backgroundColor: colors.background }, headerMic:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:'#F4EDFF'},
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 34, backgroundColor: colors.background }, permissionTitle: { fontFamily: 'Jakarta-Bold', fontSize: 25, color: colors.text, marginTop: 18 }, permissionCopy: { fontFamily: 'Jakarta-Regular', fontSize: 14, lineHeight: 22, color: colors.muted, textAlign: 'center', marginTop: 9 }, allowButton: { minWidth: 210, minHeight: 56, backgroundColor: '#2867FA', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 25 }, allowText: { color: 'white', fontFamily: 'Jakarta-SemiBold', fontSize: 15 }, notNow: { fontFamily: 'Jakarta-Medium', color: colors.muted, padding: 18 },
  cameraWrap: { height: '50%', minHeight: 320, backgroundColor: colors.navy, overflow: 'hidden' }, vignette: { position: 'absolute', inset: 0, backgroundColor: 'rgba(3,10,35,0.12)' }, guide: { position: 'absolute', inset: 28 }, cornerTopLeft: { ...corner, top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 }, cornerTopRight: { ...corner, top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 }, cornerBottomLeft: { ...corner, bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 }, cornerBottomRight: { ...corner, bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  flipButton: { position: 'absolute', top: 16, right: 16, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,20,59,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }, captionButton: { position: 'absolute', top: 16, left: 16, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,20,59,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }, captionButtonActive: { backgroundColor: colors.purple, borderColor: '#D8C6FF' }, captionOverlay: { position: 'absolute', left: 20, right: 20, bottom: 66, borderRadius: radius.md, padding: 14, backgroundColor: 'rgba(7,20,59,0.86)', borderWidth: 1, borderColor: 'rgba(154,119,255,0.65)' }, liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#94A3B8' }, liveDotActive: { backgroundColor: '#FF5F76' }, liveBadgeText: { fontFamily: 'Jakarta-Bold', fontSize: 9, letterSpacing: 1, color: '#BDA7FF' }, captionText: { fontFamily: 'Jakarta-SemiBold', fontSize: 18, lineHeight: 25, color: 'white', marginTop: 7 }, captionCompletion: { color: '#BDA7FF', fontFamily: 'Jakarta-Bold' }, cameraHint: { position: 'absolute', bottom: 18, alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(7,20,59,0.75)', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 99 }, cameraHintText: { color: 'white', fontFamily: 'Jakarta-Medium', fontSize: 12 }, captureOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(7,20,59,0.72)', alignItems: 'center', justifyContent: 'center' }, pulse: { width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }, captureNumber: { color: 'white', fontFamily: 'Jakarta-ExtraBold', fontSize: 28 }, captureTitle: { color: 'white', fontFamily: 'Jakarta-Bold', fontSize: 17, marginTop: 15 }, captureCopy: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Jakarta-Regular', fontSize: 12, marginTop: 5 },
  panel: { flex: 1, padding: 18, backgroundColor: colors.background }, panelTitle: { fontFamily: 'Jakarta-Bold', fontSize: 18, color: colors.text }, panelCopy: { fontFamily: 'Jakarta-Regular', fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 5 }, captureButton: { minHeight: 58, borderRadius: radius.md, backgroundColor: '#2867FA', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, marginTop: 14, ...shadow }, captureDot: { width: 17, height: 17, borderRadius: 9, backgroundColor: 'white', borderWidth: 4, borderColor: '#C9DAFF' }, captureButtonText: { fontFamily: 'Jakarta-SemiBold', fontSize: 15, color: 'white' },
  suggestion: { minHeight: 62, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }, suggestionText: { flex: 1, fontFamily: 'Jakarta-Medium', fontSize: 13, lineHeight: 19, color: colors.text }, assistedText: { color: colors.purple, fontFamily: 'Jakarta-Bold' }, notQuite:{fontFamily:'Jakarta-SemiBold',fontSize:11,color:colors.muted,marginTop:10},refineRow:{flexDirection:'row',gap:8,marginTop:6},hintInput:{flex:1,minHeight:44,borderRadius:radius.sm,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,paddingHorizontal:12,fontFamily:'Jakarta-Regular',fontSize:12,color:colors.text},refineButton:{width:46,borderRadius:radius.sm,backgroundColor:colors.purple,alignItems:'center',justifyContent:'center'}, tryAgain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 12 }, tryAgainText: { fontFamily: 'Jakarta-SemiBold', fontSize: 12, color: colors.primary }, privacy: { fontFamily: 'Jakarta-Regular', fontSize: 9, color: '#94A3B8', textAlign: 'center', marginTop: 10 },
});
