import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomNav, ScreenHeader } from '../components/ui';
import { colors, radius } from '../theme';
import { CareProfile, emptyCareProfile, getCareProfile, saveCareProfile } from '../services/storage';

const fields: { key: keyof CareProfile; icon: keyof typeof Ionicons.glyphMap; title: string; placeholder: string }[] = [
  { key: 'name', icon: 'person', title: 'My name', placeholder: 'Example: Gustavo' },
  { key: 'people', icon: 'people', title: 'People', placeholder: 'Example: Maria — daughter' },
  { key: 'places', icon: 'location', title: 'Places', placeholder: 'Example: home, park, university' },
  { key: 'routine', icon: 'time', title: 'Routine', placeholder: 'Example: therapy on Tuesday mornings' },
  { key: 'preferences', icon: 'options', title: 'Preferences', placeholder: 'Example: short, direct sentences' },
];

export default function Profile(){
  const router=useRouter();
  const [profile,setProfile]=useState<CareProfile>(emptyCareProfile);
  const [saved,setSaved]=useState(false);
  useFocusEffect(useCallback(()=>{getCareProfile().then(setProfile)},[]));
  const save=async()=>{await saveCareProfile(profile);setSaved(true);setTimeout(()=>setSaved(false),1800)};
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><ScreenHeader title="Care Profile" onBack={()=>router.replace('/home')}/><Text style={styles.title}>Context that helps.</Text><Text style={styles.copy}>Add only details that make communication easier. Everything stays on this device.</Text>{fields.map(field=><View key={field.key} style={styles.card}><View style={styles.label}><View style={styles.icon}><Ionicons name={field.icon} size={21} color="#2867FA"/></View><Text style={styles.cardTitle}>{field.title}</Text></View><TextInput value={profile[field.key]} onChangeText={value=>{setSaved(false);setProfile({...profile,[field.key]:value})}} placeholder={field.placeholder} placeholderTextColor="#94A3B8" style={styles.input} multiline maxLength={240}/></View>)}<Pressable onPress={save} style={styles.save}><Ionicons name={saved?'checkmark-circle':'save-outline'} size={21} color="white"/><Text style={styles.saveText}>{saved?'Saved on this device':'Save profile'}</Text></Pressable><Pressable onPress={()=>router.push('/premium')} style={styles.pro}><Ionicons name="diamond" size={26} color={colors.purple}/><View style={{flex:1}}><Text style={styles.proTitle}>ReVoice+</Text><Text style={styles.proCopy}>Multiple profiles and richer personalized context.</Text></View><Ionicons name="arrow-forward" size={21} color={colors.purple}/></Pressable></ScrollView></KeyboardAvoidingView><BottomNav active="Profile" /></SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},content:{padding:22,paddingBottom:40},title:{fontFamily:'Jakarta-ExtraBold',fontSize:30,color:colors.text,marginTop:15},copy:{fontFamily:'Jakarta-Regular',fontSize:14,lineHeight:21,color:colors.muted,marginTop:7,marginBottom:20},card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14,marginBottom:10},label:{flexDirection:'row',alignItems:'center',gap:10},icon:{width:38,height:38,borderRadius:13,backgroundColor:'#EDF4FF',alignItems:'center',justifyContent:'center'},cardTitle:{fontFamily:'Jakarta-SemiBold',fontSize:15,color:colors.text},input:{minHeight:48,marginTop:9,borderRadius:radius.sm,backgroundColor:colors.background,paddingHorizontal:12,paddingVertical:10,fontFamily:'Jakarta-Regular',fontSize:13,color:colors.text,textAlignVertical:'top'},save:{minHeight:56,borderRadius:radius.md,backgroundColor:'#2867FA',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,marginTop:4},saveText:{fontFamily:'Jakarta-SemiBold',fontSize:14,color:'white'},pro:{marginTop:14,minHeight:82,padding:16,borderRadius:radius.md,backgroundColor:'#F4EDFF',borderWidth:1,borderColor:'#DDC9FF',flexDirection:'row',alignItems:'center',gap:13},proTitle:{fontFamily:'Jakarta-Bold',fontSize:16,color:colors.purple},proCopy:{fontFamily:'Jakarta-Regular',fontSize:12,color:colors.muted,marginTop:3}});
