import { useCallback, useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomNav, Brand, GradientButton } from '../components/ui';
import { colors, radius, shadow } from '../theme';
import { getQuickCards, QuickCard, saveQuickCards } from '../services/storage';
import { useAppSettings } from '../context/app-settings';

const quickItems: QuickCard[] = [
  { icon: 'water', label: 'Water', text: 'I would like some water.' },
  { icon: 'restaurant', label: 'Food', text: 'I would like something to eat.' },
  { icon: 'business', label: 'Bathroom', text: 'I need to use the bathroom.' },
  { icon: 'flash', label: 'Pain', text: "I'm in pain." },
  { icon: 'bed', label: 'Rest', text: 'I need to rest.' },
  { icon: 'person', label: 'Call someone', text: 'Please call someone for me.' },
];

export default function Home() {
  const router = useRouter();
  const { settings } = useAppSettings();
  const dark = settings.darkMode;
  const [items, setItems] = useState<QuickCard[]>(quickItems);
  const [customizing, setCustomizing] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [cardLabel, setCardLabel] = useState('');
  const [cardPhrase, setCardPhrase] = useState('');
  useFocusEffect(useCallback(() => { getQuickCards(quickItems).then(setItems); }, []));

  const persist = async (next: QuickCard[]) => { setItems(next); await saveQuickCards(next); };
  const openSpeak = (text: string) => router.push({ pathname: '/speak', params: { text } });
  const removeCard = (label: string) => persist(items.filter(item => item.label !== label));
  const beginEdit = (item: QuickCard) => { setEditingLabel(item.label); setCardLabel(item.label); setCardPhrase(item.text); };
  const clearForm = () => { setEditingLabel(null); setCardLabel(''); setCardPhrase(''); };
  const saveCard = async () => {
    const label = cardLabel.trim(); const text = cardPhrase.trim();
    if (!label || !text) return;
    const next = editingLabel ? items.map(item => item.label === editingLabel ? { ...item, label, text } : item) : [...items, { icon: 'chatbubble', label, text }];
    await persist(next); clearForm();
  };
  const moveCard = async (from: number, columnDelta: number, rowDelta: number) => {
    const target = Math.max(0, Math.min(items.length - 1, from + columnDelta + rowDelta * 3));
    if (target === from) return;
    const next = [...items]; const [moved] = next.splice(from, 1); next.splice(target, 0, moved); await persist(next);
  };

  return <SafeAreaView style={[styles.safe, dark && styles.safeDark]}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Brand dark={dark}/><Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} hitSlop={12} style={[styles.settingsButton,dark&&styles.cardDark]}><Ionicons name="settings-outline" size={26} color={colors.muted}/></Pressable></View>
    <Text style={[styles.title,dark&&styles.textDark]}>What do you{`\n`}want to say?</Text><Text style={styles.copy}>Tap, type, show a moment, or use quick buttons.{`\n`}We'll suggest phrases you can speak.</Text>
    <GradientButton title="Help me say something" onPress={() => router.push('/intent')} />
    <Pressable onPress={()=>router.push('/voice')} style={[styles.voiceButton,dark&&styles.cardDark]}><Ionicons name="mic" size={22} color={colors.purple}/><View style={{flex:1}}><Text style={[styles.voiceTitle,dark&&styles.textDark]}>Use my voice</Text><Text style={styles.voiceCopy}>Say a word or an incomplete thought</Text></View><Ionicons name="chevron-forward" size={20} color={colors.purple}/></Pressable>
    <View style={styles.sectionRow}><Text style={[styles.section,dark&&styles.textDark]}>Quick Speak</Text><Pressable onPress={() => { setCustomizing(!customizing); clearForm(); }}><Text style={styles.customize}>{customizing ? 'Done' : 'Customize'}</Text></Pressable></View>
    {customizing && <Text style={styles.editHint}>Drag cards to reorder. Tap the pencil to edit.</Text>}
    <View style={styles.quickArea}>{items.length ? <View style={styles.grid}>{items.map((item,index)=><DraggableCard key={item.label} item={item} index={index} customizing={customizing} dark={dark} onSpeak={openSpeak} onRemove={removeCard} onEdit={beginEdit} onMove={moveCard}/>)}</View>:<View style={styles.emptyQuick}><Ionicons name="grid-outline" size={28} color={colors.muted}/><Text style={[styles.emptyQuickTitle,dark&&styles.textDark]}>No Quick Speak cards</Text><Text style={styles.emptyQuickCopy}>Use Customize to add the phrases you use most.</Text></View>}</View>
    {customizing&&<View style={[styles.addCard,dark&&styles.cardDark]}><Text style={[styles.addTitle,dark&&styles.textDark]}>{editingLabel?'Edit Quick Speak card':'Add a Quick Speak card'}</Text><TextInput value={cardLabel} onChangeText={setCardLabel} placeholder="Button name" placeholderTextColor="#94A3B8" maxLength={24} style={[styles.editInput,dark&&styles.inputDark]}/><TextInput value={cardPhrase} onChangeText={setCardPhrase} placeholder="Phrase it will speak" placeholderTextColor="#94A3B8" maxLength={140} style={[styles.editInput,dark&&styles.inputDark]}/><View style={styles.formActions}>{editingLabel&&<Pressable onPress={clearForm} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>}<Pressable onPress={saveCard} disabled={!cardLabel.trim()||!cardPhrase.trim()} style={styles.addButton}><Ionicons name={editingLabel?'checkmark':'add'} size={19} color="white"/><Text style={styles.addButtonText}>{editingLabel?'Save changes':'Add card'}</Text></Pressable></View></View>}
    <View style={styles.binary}><Pressable onPress={()=>openSpeak('Yes.')} style={[styles.binaryCard,styles.yes,dark&&styles.binaryDark]}><Ionicons name="checkmark-circle" size={38} color={colors.mint}/><Text style={[styles.binaryText,dark&&styles.textDark]}>Yes</Text></Pressable><Pressable onPress={()=>openSpeak('No.')} style={[styles.binaryCard,styles.no,dark&&styles.binaryDark]}><Ionicons name="close-circle" size={38} color={colors.danger}/><Text style={[styles.binaryText,dark&&styles.textDark]}>No</Text></Pressable></View>
    <Pressable onPress={()=>router.push('/camera')} style={styles.live}><Ionicons name="videocam" size={25} color="white"/><View style={{flex:1}}><Text style={styles.liveTitle}>Live Camera Assist</Text><Text style={styles.liveCopy}>Show a moment and get possible phrases</Text></View><Ionicons name="arrow-forward" size={22} color="white"/></Pressable>
  </ScrollView><BottomNav active="Home"/></SafeAreaView>;
}

function DraggableCard({item,index,customizing,dark,onSpeak,onRemove,onEdit,onMove}:{item:QuickCard;index:number;customizing:boolean;dark:boolean;onSpeak:(text:string)=>void;onRemove:(label:string)=>void;onEdit:(item:QuickCard)=>void;onMove:(from:number,columnDelta:number,rowDelta:number)=>void}) {
  const drag = useMemo(() => new Animated.ValueXY(), []);
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder:(_,gesture)=>customizing&&(Math.abs(gesture.dx)>5||Math.abs(gesture.dy)>5),
    onPanResponderMove:Animated.event([null,{dx:drag.x,dy:drag.y}],{useNativeDriver:false}),
    onPanResponderRelease:(_,gesture)=>{onMove(index,Math.round(gesture.dx/112),Math.round(gesture.dy/98));Animated.spring(drag,{toValue:{x:0,y:0},useNativeDriver:true}).start();},
    onPanResponderTerminate:()=>Animated.spring(drag,{toValue:{x:0,y:0},useNativeDriver:true}).start(),
  }),[customizing,drag,index,onMove]);
  return <Animated.View {...responder.panHandlers} style={[styles.quick,dark&&styles.cardDark,customizing&&styles.customizingCard,{transform:drag.getTranslateTransform()}]}><Pressable onPress={()=>!customizing&&onSpeak(item.text)} style={styles.cardPress}><Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={29} color={item.label==='Pain'?'#FF9E2C':item.label==='Rest'?colors.purple:colors.primary}/><Text style={[styles.quickText,dark&&styles.textDark]}>{item.label}</Text>{customizing&&<Ionicons name="move" size={15} color={colors.muted}/>}</Pressable>{customizing&&<><Pressable onPress={()=>onRemove(item.label)} hitSlop={8} style={styles.remove}><Ionicons name="close-circle" size={20} color={colors.danger}/></Pressable><Pressable onPress={()=>onEdit(item)} hitSlop={8} style={styles.edit}><Ionicons name="pencil" size={16} color={colors.primary}/></Pressable></>}</Animated.View>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},safeDark:{backgroundColor:'#071022'},textDark:{color:'#F8FAFF'},cardDark:{backgroundColor:'#111C33',borderColor:'#263653'},inputDark:{backgroundColor:'#0B1528',borderColor:'#263653',color:'#F8FAFF'},content:{padding:22,paddingBottom:22},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:22},settingsButton:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},title:{fontFamily:'Jakarta-ExtraBold',fontSize:34,lineHeight:40,color:colors.text,letterSpacing:-1.2},copy:{fontFamily:'Jakarta-Regular',fontSize:14,lineHeight:21,color:colors.muted,marginTop:8,marginBottom:20},voiceButton:{minHeight:62,marginTop:10,borderRadius:radius.md,borderWidth:1,borderColor:'#DDC9FF',backgroundColor:'#F8F4FF',padding:12,flexDirection:'row',alignItems:'center',gap:10},voiceTitle:{fontFamily:'Jakarta-SemiBold',fontSize:13,color:colors.text},voiceCopy:{fontFamily:'Jakarta-Regular',fontSize:10,color:colors.muted,marginTop:2},sectionRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:25,marginBottom:12},section:{fontFamily:'Jakarta-Bold',fontSize:17,color:colors.text},customize:{fontFamily:'Jakarta-SemiBold',fontSize:13,color:colors.primary},editHint:{fontFamily:'Jakarta-Regular',fontSize:11,color:colors.muted,marginTop:-6,marginBottom:10},quickArea:{minHeight:96,justifyContent:'center'},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:10},emptyQuick:{minHeight:96,alignItems:'center',justifyContent:'center',paddingHorizontal:28},emptyQuickTitle:{fontFamily:'Jakarta-SemiBold',fontSize:14,color:colors.text,marginTop:8},emptyQuickCopy:{fontFamily:'Jakarta-Regular',fontSize:11,lineHeight:17,color:colors.muted,textAlign:'center',marginTop:3},quick:{width:'31%',minHeight:88,backgroundColor:colors.surface,borderRadius:radius.md,borderWidth:1,borderColor:'#EEF1F6',...shadow},customizingCard:{zIndex:2},cardPress:{flex:1,alignItems:'center',justifyContent:'center',gap:5},remove:{position:'absolute',top:5,right:5,zIndex:3},edit:{position:'absolute',top:7,left:7,zIndex:3},quickText:{fontFamily:'Jakarta-SemiBold',fontSize:12,color:colors.text,textAlign:'center'},addCard:{marginTop:12,padding:14,borderRadius:radius.md,backgroundColor:'#F1F5FF',gap:8},addTitle:{fontFamily:'Jakarta-Bold',fontSize:13,color:colors.text},editInput:{minHeight:44,borderRadius:radius.sm,backgroundColor:'white',borderWidth:1,borderColor:colors.border,paddingHorizontal:12,fontFamily:'Jakarta-Regular',fontSize:12,color:colors.text},formActions:{flexDirection:'row',gap:8},cancelButton:{minHeight:44,paddingHorizontal:18,borderRadius:radius.sm,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},cancelText:{fontFamily:'Jakarta-SemiBold',fontSize:12,color:colors.muted},addButton:{flex:1,minHeight:44,borderRadius:radius.sm,backgroundColor:colors.purple,flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center'},addButtonText:{fontFamily:'Jakarta-SemiBold',fontSize:12,color:'white'},binary:{flexDirection:'row',gap:12,marginTop:12},binaryCard:{flex:1,minHeight:90,borderRadius:radius.md,alignItems:'center',justifyContent:'center',gap:5},yes:{backgroundColor:'#EAFBF7'},no:{backgroundColor:'#FFF0F3'},binaryDark:{backgroundColor:'#111C33',borderWidth:1,borderColor:'#263653'},binaryText:{fontFamily:'Jakarta-SemiBold',fontSize:14,color:colors.text},live:{minHeight:72,marginTop:12,borderRadius:radius.md,backgroundColor:colors.navy,padding:14,flexDirection:'row',alignItems:'center',gap:12},liveTitle:{fontFamily:'Jakarta-Bold',fontSize:14,color:'white'},liveCopy:{fontFamily:'Jakarta-Regular',fontSize:10,color:'rgba(255,255,255,.72)',marginTop:3}});
