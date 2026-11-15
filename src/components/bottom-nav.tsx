import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';
export type Tab = 'Início' | 'Registar' | 'Recompensas' | 'Família';
const items: {label:Tab; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']}[] = [
 {label:'Início',icon:'home-outline'}, {label:'Registar',icon:'plus-circle-outline'},
 {label:'Recompensas',icon:'gift-outline'}, {label:'Família',icon:'account-group-outline'},
];
export function BottomNav({active,onSelect}:{active:string;onSelect:(tab:Tab)=>void}) {
 return <View style={styles.nav}>{items.map(({label,icon})=><TouchableOpacity key={label} accessibilityRole="tab" accessibilityState={{selected:active===label}} accessibilityLabel={label} onPress={()=>onSelect(label)} style={[styles.item,active===label&&styles.active]}><MaterialCommunityIcons name={icon} size={24} color={colors.primaryDark}/><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.label}>{label}</Text></TouchableOpacity>)}</View>;
}
const styles=StyleSheet.create({nav:{flexDirection:'row',backgroundColor:colors.surface,borderTopWidth:1,borderColor:colors.border,paddingHorizontal:8,paddingVertical:6},item:{flex:1,minHeight:52,alignItems:'center',justifyContent:'center',borderRadius:16},active:{backgroundColor:colors.mint},label:{fontSize:11,color:colors.text,fontWeight:'700',marginTop:2}});
