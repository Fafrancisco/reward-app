import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

export function ActionButton({label,onPress,secondary=false,disabled=false}:{label:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}) {
 return <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[styles.button,secondary&&styles.secondary,disabled&&styles.disabled]}><Text style={[styles.buttonText,secondary&&styles.secondaryText]}>{label}</Text></TouchableOpacity>;
}
export function FormField({label,...props}:{label:string}&TextInputProps) {
 return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.placeholder} style={styles.input}/></View>;
}
export function InfoCard({title,subtitle,onPress,disabled=false}:{title:string;subtitle:string;onPress?:()=>void;disabled?:boolean}) {
 return <TouchableOpacity accessibilityRole={onPress?'button':undefined} accessibilityState={onPress?{disabled}:undefined} disabled={!onPress||disabled} onPress={onPress} style={styles.card}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.sub}>{subtitle}</Text></TouchableOpacity>;
}
const styles=StyleSheet.create({field:{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:18,padding:14,marginTop:10},fieldLabel:{color:colors.text,fontSize:14,fontWeight:'800',marginBottom:8},input:{borderColor:colors.inputBorder,borderWidth:1,borderRadius:12,paddingHorizontal:12,paddingVertical:10,fontSize:16,color:colors.text,backgroundColor:colors.surface},button:{backgroundColor:colors.accent,padding:16,borderRadius:30,alignItems:'center',marginTop:12},secondary:{backgroundColor:colors.mint},disabled:{opacity:0.5},buttonText:{color:colors.white,fontWeight:'800',fontSize:16},secondaryText:{color:colors.primaryDark},card:{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:20,padding:18,marginVertical:5},cardTitle:{color:colors.text,fontSize:18,fontWeight:'800'},sub:{color:colors.secondaryText,fontSize:15,marginTop:6}});
