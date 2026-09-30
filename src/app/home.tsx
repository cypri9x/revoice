import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, GradientButton } from '../components/ui';
import { colors, radius, shadow } from '../theme';
import { getQuickOrder, saveQuickOrder } from '../services/storage';

const quickItems = [
  { icon: 'water', label: 'Water', text: 'I would like some water.' },
  { icon: 'restaurant', label: 'Food', text: 'I would like something to eat.' },
  { icon: 'business', label: 'Bathroom', text: 'I need to use the bathroom.' },
  { icon: 'flash', label: 'Pain', text: "I'm in pain." },
  { icon: 'bed', label: 'Rest', text: 'I need to rest.' },
  { icon: 'person', label: 'Call someone', text: 'Please call someone for me.' },
] as const;
const defaultOrder = quickItems.map(item => item.label);

export default function Home() {
  const router = useRouter();
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { getQuickOrder(defaultOrder).then(setOrder); }, []));
  const items = useMemo(() => order.map(label => quickItems.find(item => item.label === label)!).filter(Boolean), [order]);
  const openSpeak = (text: string) => router.push({ pathname: '/speak', params: { text } });
  const handleCard = async (label: string, text: string) => {
    if (!editing) return openSpeak(text);
    if (!selected) return setSelected(label);
    if (selected === label) return setSelected(null);
    const next = [...order];
    const first = next.indexOf(selected);
    const second = next.indexOf(label);
    [next[first], next[second]] = [next[second], next[first]];
    setOrder(next);
    setSelected(null);
    await saveQuickOrder(next);
  };

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Brand /><Pressable onPress={() => router.push('/settings')} hitSlop={12}><Ionicons name="settings-outline" size={26} color={colors.muted} /></Pressable></View>
    <Text style={styles.title}>What do you{`\n`}want to say?</Text><Text style={styles.copy}>Tap, type, show a moment, or use quick buttons.{`\n`}We'll suggest phrases you can speak.</Text>
    <GradientButton title="Help me say something" onPress={() => router.push('/intent')} />
    <View style={styles.sectionRow}><Text style={styles.section}>Quick Speak</Text><Pressable onPress={() => { setEditing(!editing); setSelected(null); }}><Text style={styles.customize}>{editing ? 'Done' : 'Customize'}</Text></Pressable></View>
    {editing && <Text style={styles.editHint}>{selected ? 'Now tap another card to swap positions.' : 'Tap a card, then tap where you want it moved.'}</Text>}
    <View style={styles.grid}>{items.map(item => <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => handleCard(item.label, item.text)} style={({ pressed }) => [styles.quick, selected === item.label && styles.selected, pressed && styles.pressed]}>{editing && <Ionicons name="move" size={16} color={colors.muted} style={styles.move} />}<Ionicons name={item.icon} size={29} color={item.label === 'Pain' ? '#FF9E2C' : item.label === 'Rest' ? colors.purple : colors.primary} /><Text style={styles.quickText}>{item.label}</Text></Pressable>)}</View>
    <View style={styles.binary}><Pressable onPress={() => openSpeak('Yes.')} style={[styles.binaryCard, styles.yes]}><Ionicons name="checkmark-circle" size={38} color={colors.mint} /><Text style={styles.binaryText}>Yes</Text></Pressable><Pressable onPress={() => openSpeak('No.')} style={[styles.binaryCard, styles.no]}><Ionicons name="close-circle" size={38} color={colors.danger} /><Text style={styles.binaryText}>No</Text></Pressable></View>
    <Pressable onPress={() => router.push('/camera')} style={styles.live}><Ionicons name="videocam" size={25} color="white" /><View style={{ flex: 1 }}><Text style={styles.liveTitle}>Live Camera Assist</Text><Text style={styles.liveCopy}>Show a moment and get possible phrases</Text></View><Ionicons name="arrow-forward" size={22} color="white" /></Pressable>
  </ScrollView><View style={styles.nav}>{[['home','Home','/home'],['time-outline','History','/history'],['person-outline','Profile','/profile']].map(([icon,label,path]) => <Pressable key={label} onPress={() => router.replace(path as never)} style={styles.navItem}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color={label === 'Home' ? '#2867FA' : colors.muted} /><Text style={[styles.navText,label === 'Home' && {color:'#2867FA'}]}>{label}</Text></Pressable>)}</View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:colors.background},content:{padding:22,paddingBottom:22},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:22},title:{fontFamily:'Jakarta-ExtraBold',fontSize:34,lineHeight:40,color:colors.text,letterSpacing:-1.2},copy:{fontFamily:'Jakarta-Regular',fontSize:14,lineHeight:21,color:colors.muted,marginTop:8,marginBottom:20},sectionRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:25,marginBottom:12},section:{fontFamily:'Jakarta-Bold',fontSize:17,color:colors.text},customize:{fontFamily:'Jakarta-SemiBold',fontSize:13,color:colors.primary},editHint:{fontFamily:'Jakarta-Regular',fontSize:11,color:colors.muted,marginTop:-6,marginBottom:10},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},quick:{width:'31%',minHeight:88,backgroundColor:colors.surface,borderRadius:radius.md,alignItems:'center',justifyContent:'center',gap:7,borderWidth:1,borderColor:'#EEF1F6',...shadow},selected:{borderColor:colors.primary,borderWidth:2,backgroundColor:'#EDF4FF'},pressed:{transform:[{scale:.97}],backgroundColor:colors.paleBlue},move:{position:'absolute',top:8,right:8},quickText:{fontFamily:'Jakarta-SemiBold',fontSize:12,color:colors.text,textAlign:'center'},binary:{flexDirection:'row',gap:12,marginTop:14},binaryCard:{flex:1,minHeight:90,borderRadius:radius.md,alignItems:'center',justifyContent:'center',gap:5},yes:{backgroundColor:'#EAFBF7'},no:{backgroundColor:'#FFF0F3'},binaryText:{fontFamily:'Jakarta-SemiBold',fontSize:14,color:colors.text},live:{minHeight:72,marginTop:13,borderRadius:radius.md,backgroundColor:colors.navy,padding:14,flexDirection:'row',alignItems:'center',gap:12},liveTitle:{fontFamily:'Jakarta-Bold',fontSize:14,color:'white'},liveCopy:{fontFamily:'Jakarta-Regular',fontSize:10,color:'rgba(255,255,255,.72)',marginTop:3},nav:{height:72,borderTopWidth:1,borderColor:colors.border,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',justifyContent:'space-around'},navItem:{minWidth:72,alignItems:'center',gap:3},navText:{fontFamily:'Jakarta-Medium',fontSize:11,color:colors.muted} });
