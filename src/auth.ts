/// <reference types="node" />

import 'fast-text-encoding';
import { AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const storage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};
export const supabase = url && key ? createClient(url, key, { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: 'pkce' } }) : null;
if (supabase) AppState.addEventListener('change', state => { if (state === 'active') supabase.auth.startAutoRefresh(); else supabase.auth.stopAutoRefresh(); });
WebBrowser.maybeCompleteAuthSession();
async function ensurePkceCrypto() {
  // Supabase otherwise falls back to a plain challenge or Math.random on some RN runtimes.
  if (typeof globalThis.crypto === 'undefined') Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });
  const nativeCrypto = globalThis.crypto;
  if (typeof nativeCrypto.getRandomValues !== 'function') Object.defineProperty(nativeCrypto, 'getRandomValues', { value: Crypto.getRandomValues, configurable: true });
  if (!nativeCrypto.subtle) Object.defineProperty(nativeCrypto, 'subtle', { value: { digest: (algorithm: string, bytes: BufferSource) => {
    if (algorithm !== 'SHA-256') throw new Error('Algoritmo não suportado.');
    return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  } }, configurable: true });
  if (typeof TextEncoder === 'undefined' || typeof btoa === 'undefined') throw new Error('A autenticação segura não está disponível neste dispositivo.');
  const sample = await nativeCrypto.subtle.digest('SHA-256',new TextEncoder().encode('abc'));
  const hex = Array.from(new Uint8Array(sample), byte => byte.toString(16).padStart(2,'0')).join('');
  if (hex !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') throw new Error('A verificação criptográfica falhou.');
}
export async function signInWithGoogle() {
  if (!supabase) throw new Error('Configura primeiro o Supabase.');
  await ensurePkceCrypto();
  const redirectTo = 'familiaempontos://auth/callback';
  const {data,error} = await supabase.auth.signInWithOAuth({provider:'google', options:{redirectTo,skipBrowserRedirect:true}});
  if (error) throw error;
  if (!data.url) throw new Error('Não foi possível iniciar sessão.');
  const result = await WebBrowser.openAuthSessionAsync(data.url,redirectTo);
  if (result.type !== 'success') throw new Error('Início de sessão cancelado.');
  const callback = new URL(result.url);
  if (callback.protocol !== 'familiaempontos:' || callback.host !== 'auth' || callback.pathname !== '/callback') throw new Error('Endereço de retorno inválido.');
  const code = callback.searchParams.get('code');
  if (!code) throw new Error('O fornecedor não devolveu um código de autenticação.');
  const {error:exchangeError} = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}
