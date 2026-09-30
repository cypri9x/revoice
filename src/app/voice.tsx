import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { ErrorCard, ScreenHeader } from '../components/ui';
import { colors, radius, shadow } from '../theme';
import { getVoiceIntentSuggestions } from '../services/api';

export default function VoiceIntent() {
  const router = useRouter();
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().then(async status => {
      setPermission(status.granted);
      if (status.granted) await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    });
  }, []);

  const toggleRecording = async () => {
    if (recorderState.isRecording) {
      await recorder.stop();
      if (!recorder.uri) { setError('The recording could not be prepared.'); return; }
      setLoading(true);
      setError('');
      setSuggestions([]);
      try {
        const audio = await new File(recorder.uri).base64();
        const mimeType = recorder.uri.endsWith('.3gp') ? 'audio/3gpp' : recorder.uri.endsWith('.webm') ? 'audio/webm' : 'audio/m4a';
        const result = await getVoiceIntentSuggestions(audio, mimeType);
        setTranscript(result.transcript);
        setSuggestions(result.suggestions);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
    setTranscript('');
    setSuggestions([]);
    setError('');
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  if (permission === null) return <SafeAreaView style={styles.center}><ActivityIndicator color={colors.primary} /></SafeAreaView>;
  if (!permission) return <SafeAreaView style={styles.center}><Ionicons name="mic-off" size={56} color={colors.muted} /><Text style={styles.title}>Microphone access is off</Text><Text style={styles.copy}>Enable microphone access in device settings to use Voice Intent.</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <View style={styles.content}>
      <ScreenHeader title="Voice Intent" onBack={() => router.back()} />
      <View style={styles.intro}><Text style={styles.title}>Say what you can.</Text><Text style={styles.copy}>A word, a name, or an incomplete sentence is enough. ReVoice will transcribe it and offer three possibilities.</Text></View>
      <View style={styles.recorder}>
        <View style={styles.bars}>{[20,34,48,30,56,39,24].map((height,index) => <View key={index} style={[styles.bar,{height:recorderState.isRecording?height:12,opacity:recorderState.isRecording?1:.3}]} />)}</View>
        <Pressable onPress={toggleRecording} disabled={loading} style={[styles.mic,recorderState.isRecording&&styles.micActive]}>{loading ? <ActivityIndicator color="white" /> : <Ionicons name={recorderState.isRecording?'stop':'mic'} size={42} color="white" />}</Pressable>
        <Text style={styles.status}>{loading?'Understanding your voice...':recorderState.isRecording?'Tap to stop and send':'Tap to start speaking'}</Text>
        {recorderState.isRecording ? <Text style={styles.timer}>{Math.floor(recorderState.durationMillis/1000)}s</Text> : null}
      </View>
      {error ? <ErrorCard message={error} /> : null}
      {transcript ? <View style={styles.transcript}><Text style={styles.label}>We heard</Text><Text style={styles.transcriptText}>{`“${transcript}”`}</Text></View> : null}
      {suggestions.length > 0 ? <View><Text style={styles.heading}>What might you mean?</Text>{suggestions.map(suggestion => <Pressable key={suggestion} onPress={() => router.push({pathname:'/speak',params:{text:suggestion}})} style={styles.suggestion}><Text style={styles.suggestionText}>{suggestion}</Text><Ionicons name="play-circle" size={36} color={colors.primary} /></Pressable>)}</View> : null}
      <Text style={styles.privacy}>Audio is sent only when you stop recording and is not stored by ReVoice.</Text>
    </View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',padding:30,backgroundColor:colors.background},content:{flex:1,padding:22},intro:{marginTop:15},title:{fontFamily:'Jakarta-ExtraBold',fontSize:30,color:colors.text,textAlign:'center'},copy:{fontFamily:'Jakarta-Regular',fontSize:14,lineHeight:21,color:colors.muted,textAlign:'center',marginTop:8},recorder:{alignItems:'center',paddingVertical:28},bars:{height:60,flexDirection:'row',alignItems:'center',gap:7},bar:{width:5,borderRadius:3,backgroundColor:colors.purple},mic:{width:100,height:100,borderRadius:50,backgroundColor:'#2867FA',alignItems:'center',justifyContent:'center',marginTop:15,...shadow},micActive:{backgroundColor:colors.danger},status:{fontFamily:'Jakarta-SemiBold',fontSize:13,color:colors.muted,marginTop:13},timer:{fontFamily:'Jakarta-Bold',fontSize:12,color:colors.danger,marginTop:4},transcript:{backgroundColor:'#F1F5FF',borderRadius:radius.md,padding:14,marginBottom:10},label:{fontFamily:'Jakarta-Bold',fontSize:11,color:colors.primary,textTransform:'uppercase'},transcriptText:{fontFamily:'Jakarta-Medium',fontSize:14,lineHeight:20,color:colors.text,marginTop:5},heading:{fontFamily:'Jakarta-Bold',fontSize:16,color:colors.text,marginVertical:8},suggestion:{minHeight:62,padding:12,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,flexDirection:'row',alignItems:'center',gap:10,marginBottom:8},suggestionText:{flex:1,fontFamily:'Jakarta-Medium',fontSize:13,lineHeight:19,color:colors.text},privacy:{fontFamily:'Jakarta-Regular',fontSize:9,color:'#94A3B8',textAlign:'center',marginTop:'auto'}});
