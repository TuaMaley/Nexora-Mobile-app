import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { BASE_URL } from '@/lib/api';
import { Button, Field, Notice } from '@/components/ui';
import { colors, radius } from '@/lib/theme';

export default function Login() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setError('');
    try { await signIn(email.trim(), password); }
    catch (e: any) { setError(e?.message || 'Sign in failed'); }
    finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.black }}>
      <ScrollView contentContainerStyle={[s.wrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">
        <View style={s.ribbon} />
        <View style={s.card}>
          <Image source={require('../../assets/brand.png')} style={s.brand} resizeMode="contain" />
          <Text style={s.h1}>Welcome back</Text>
          <Text style={s.sub}>Sign in to Nexora Employee Self-Service</Text>
          <Notice kind="error" text={error} />
          <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" placeholder="you@company.com" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" placeholder="••••••••" onSubmitEditing={submit} />
          <Button title="Sign in" onPress={submit} loading={busy} disabled={!email || !password} />
          <Text style={s.link} onPress={() => WebBrowser.openBrowserAsync(`${BASE_URL}/forgot-password`)}>Forgot your password?</Text>
        </View>
        <Text style={s.foot}>People · Performance · Growth</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  ribbon: { position: 'absolute', left: -200, bottom: -300, width: 600, height: 600, borderRadius: 300, borderWidth: 90, borderColor: '#E3141B22', transform: [{ rotate: '-20deg' }] },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 24, gap: 14 },
  brand: { width: '100%', height: 110, marginBottom: 4 },
  h1: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  sub: { color: colors.muted, marginTop: -8, marginBottom: 4 },
  link: { color: colors.red, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  foot: { color: '#ffffff80', textAlign: 'center', marginTop: 26, letterSpacing: 2, fontSize: 12, textTransform: 'uppercase' },
});
