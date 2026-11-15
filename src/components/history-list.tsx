import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Child, Entry } from '../domain';
import { groupHistory } from '../history';
import { colors } from '../theme';

type Props = { childrenList: Child[]; entries: Entry[]; onCorrect: (entry: Entry) => void; disabled?: boolean };
export function HistoryList({childrenList,entries,onCorrect,disabled=false}:Props) {
 const [filter,setFilter]=useState('');
 const groups=useMemo(()=>groupHistory(filter ? entries.filter(e=>e.childId===filter) : entries),[entries,filter]);
 return <><Text style={s.intro}>Consulta os movimentos e corrige enganos sem apagar o registo original.</Text>
 <View style={s.filters}><TouchableOpacity accessibilityRole="button" accessibilityState={{selected:!filter}} style={[s.filter,!filter&&s.selected]} onPress={()=>setFilter('')}><Text>Todos</Text></TouchableOpacity>{childrenList.map(c=><TouchableOpacity key={c.id} accessibilityRole="button" accessibilityState={{selected:filter===c.id}} style={[s.filter,filter===c.id&&s.selected]} onPress={()=>setFilter(c.id)}><Text>{c.avatar} {c.name}</Text></TouchableOpacity>)}</View>
 {groups.length===0 && <Text style={s.empty}>Ainda não há movimentos para mostrar.</Text>}
 {groups.map(group=><View key={group.date}><Text style={s.date}>▣  {group.date}</Text>{group.entries.map(entry=>{const corrected=entries.some(e=>e.corrects===entry.id);const canCorrect=!disabled && entry.id!=='initial' && !entry.corrects && !corrected;return <View key={entry.id} style={s.entry}><View style={s.entryText}><Text style={s.name}>{entry.description}</Text><Text style={s.meta}>{childrenList.find(c=>c.id===entry.childId)?.name ?? 'Criança'} · {entry.actor}</Text>{(corrected||entry.corrects) && <Text style={s.meta}>{corrected?'Registo corrigido':'Correção'}</Text>}</View><Text style={[s.amount,entry.points<0?s.negative:s.positive]}>{entry.points>0?'+':''}{entry.points} pts</Text>{canCorrect&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={`Corrigir ${entry.description}`} onPress={()=>onCorrect(entry)} style={s.correct}><Text style={s.correctText}>Corrigir</Text></TouchableOpacity>}</View>;})}</View>)}
 </>;
}
const s=StyleSheet.create({intro:{color:colors.body,fontSize:16,lineHeight:23,marginVertical:14},filters:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},filter:{paddingHorizontal:14,paddingVertical:10,borderRadius:20,backgroundColor:colors.soft},selected:{backgroundColor:colors.selected},empty:{color:colors.muted,marginVertical:18},date:{fontSize:16,fontWeight:'800',color:colors.text,marginTop:20,marginBottom:8},entry:{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:18,padding:14,marginBottom:8,flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:10},entryText:{flex:1,minWidth:140},name:{fontSize:16,fontWeight:'800',color:colors.text},meta:{fontSize:13,color:colors.secondaryText,marginTop:4},amount:{overflow:'hidden',borderRadius:16,paddingHorizontal:10,paddingVertical:7,fontWeight:'800'},positive:{color:colors.success,backgroundColor:colors.mint},negative:{color:'#a92e27',backgroundColor:'#ffdfd9'},correct:{padding:10},correctText:{color:colors.primaryDark,fontWeight:'800'}});
