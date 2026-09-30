import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorCard, GradientButton, ScreenHeader } from '../components/ui';
import { colors, radius, shadow } from '../theme';
import { getIntentSuggestions } from '../services/api';

const options = [['person','Me'],['school','Student'],['business','University'],['woman','Daughter'],['calendar','Tomorrow'],['home','Home']] as const;

export default function Intent() {
  const router = useRouter();
  const [fragments, setFragments] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toggle = (value: string) => setFragments(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  const add = () => { const value = input.trim(); if (value && !fragments.includes(value)) { setFragments([...fragments, value]); setInput(''); } };
  const submit = async () => { setLoading(true); setError(''); setSuggestions([]); try { setSuggestions(await getIntentSuggestions(fragments)); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Please try again.'); } finally { setLoading(false); } };

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <ScreenHeader onBack={()=>router.back()} /><Text style={styles.title}>Build your intent</Text><Text style={styles.copy}>Add words, people, places, or a small detail.{`\n`}We'll suggest what you might mean.</Text>
    <View style={styles.options}>{options.map(([icon,label])=><Pressable key={label} onPress={()=>toggle(label)} style={[styles.option,fragments.includes(label)&&styles.selected]}><Ionicons name={icon} size={19} color={fragments.includes(label)?'#2867FA':colors.muted}/><Text style={[styles.optionText,fragments.includes(label)&&{color:'#2867FA'}]}>{label}</Text>{fragments.includes(label)&&<Ionicons name="checkmark" size={17} color="#2867FA"/>}</Pressable>)}</View>
    <View style={styles.inputRow}><TextInput value={input} onChangeText={setInput} onSubmitEditing={add} placeholder={suggestions.length?'Add a clue, then try again':'Add a word or person'} placeholderTextColor="#94A3B8" style={styles.input} maxLength={60}/><Pressable onPress={add} style={styles.add}><Ionicons name="add" size={25} color="white" /></Pressable></View>
    {fragments.length>0&&<View style={styles.chips}>{fragments.map(value=><Pressable key={value} onPress={()=>toggle(value)} style={styles.chip}><Text style={styles.chipText}>{value}</Text><Ionicons name="close" size={16} color="#2867FA"/></Pressable>)}</View>}
    <GradientButton title={loading?'Understanding your intent...':suggestions.length?'Try again':'Get suggestions'} icon={suggestions.length?'refresh':'sparkles'} onPress={submit} loading={loading} disabled={fragments.length===0} style={{marginTop:18}} />
    {error&&<View style={{marginTop:18}}><ErrorCard message={error}/></View>}
    {suggestions.length>0&&<><Text style={styles.heading}>Possible phrases</Text>{suggestions.map((suggestion,index)=><Pressable key={suggestion} onPress={()=>router.push({pathname:'/speak',params:{text:suggestion}})} style={styles.suggestion}><View style={styles.number}><Text style={styles.numberText}>{index+1}</Text></View><Text style={styles.suggestionText}>{suggestion}</Text><View style={styles.play}><Ionicons name="play" size={17} color="white"/></View></Pressable>)}<Text style={styles.refineHelp}>None fit? Add another word or detail above, then tap Try again.</Text></>}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},content:{padding:22,paddingBottom:40},title:{fontFamily:'Jakarta-ExtraBold',fontSize:30,color:colors.text,letterSpacing:-1},copy:{fontFamily:'Jakarta-Regular',fontSize:14,lineHeight:21,color:colors.muted,marginTop:5,marginBottom:18},options:{flexDirection:'row',flexWrap:'wrap',gap:9},option:{flexDirection:'row',alignItems:'center',gap:7,paddingVertical:11,paddingHorizontal:13,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.pill},selected:{backgroundColor:'#EDF4FF',borderColor:colors.primary},optionText:{fontFamily:'Jakarta-SemiBold',fontSize:13,color:colors.text},inputRow:{flexDirection:'row',gap:9,marginTop:15},input:{flex:1,height:52,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:16,fontFamily:'Jakarta-Regular',color:colors.text,backgroundColor:colors.surface},add:{width:52,height:52,alignItems:'center',justifyContent:'center',borderRadius:radius.md,backgroundColor:colors.purple},chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},chip:{flexDirection:'row',alignItems:'center',gap:5,paddingVertical:8,paddingHorizontal:11,borderRadius:radius.pill,backgroundColor:'#EDF4FF'},chipText:{fontFamily:'Jakarta-Medium',fontSize:12,color:'#2867FA'},heading:{fontFamily:'Jakarta-Bold',fontSize:17,color:colors.text,marginTop:25,marginBottom:10},suggestion:{minHeight:76,flexDirection:'row',alignItems:'center',gap:12,padding:14,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,marginBottom:10,...shadow},number:{width:30,height:30,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'#EDF4FF'},numberText:{fontFamily:'Jakarta-Bold',color:'#2867FA'},suggestionText:{flex:1,fontFamily:'Jakarta-Medium',fontSize:14,lineHeight:20,color:colors.text},play:{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',backgroundColor:'#2867FA',paddingLeft:2},refineHelp:{fontFamily:'Jakarta-Regular',fontSize:12,lineHeight:18,color:colors.muted,textAlign:'center',paddingHorizontal:18,marginTop:3}});
