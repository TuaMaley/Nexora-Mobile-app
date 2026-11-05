import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ess } from '@/lib/api';
import { Button, Card, Field, Muted, Notice, Screen, Segmented } from '@/components/ui';
import { colors } from '@/lib/theme';

// Same categories the web form offers (validated server-side).
const categories = [
  { value: 'GENERAL', label: 'General HR inquiry' },
  { value: 'DOCUMENT', label: 'Document request' },
  { value: 'EMPLOYMENT_VERIFICATION', label: 'Employment verification' },
  { value: 'PAYROLL', label: 'Payroll inquiry' },
  { value: 'OTHER', label: 'Other' },
];
const presets: Record<string, { subject: string; details: string }> = {
  DOCUMENT: { subject: 'Introductory letter request', details: 'Please issue an introductory letter addressed to: [organisation name]. Purpose: [e.g. bank account opening / visa application]. Thank you.' },
};

export default function NewRequest() {
  const router = useRouter();
  const [category, setCategory] = useState('GENERAL');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function pick(c: string) { setCategory(c); const p = presets[c]; if (p && !subject && !details) { setSubject(p.subject); setDetails(p.details); } }
  async function submit() {
    setBusy(true); setError('');
    try {
      if (subject.trim().length < 3 || subject.length > 160) throw new Error('Subject must be 3–160 characters');
      if (details.trim().length < 10 || details.length > 4000) throw new Error('Details must be 10–4000 characters');
      await ess.submitRequest({ category, subject: subject.trim(), details: details.trim() });
      router.back();
    } catch (e: any) { setError(e?.message || 'Unable to submit request'); }
    finally { setBusy(false); }
  }
  return (
    <Screen>
      <Notice kind="info" text="For an instant employment verification letter, use the Requests tab — it needs no approval. Use this form for introductory letters, documents and other HR questions." />
      <Notice kind="error" text={error} />
      <Card>
        <Text style={{ fontWeight: '700', color: colors.ink }}>Request type</Text>
        <Segmented value={category} onChange={pick} options={categories} />
        <Field label="Subject" value={subject} onChangeText={setSubject} maxLength={160} placeholder="What do you need?" />
        <Field label="Details" value={details} onChangeText={setDetails} multiline maxLength={4000} placeholder="Give HR everything they need to act on this in one go." />
        <Muted>{details.length}/4000</Muted>
        <Button title="Submit to HR" onPress={submit} loading={busy} disabled={subject.trim().length < 3 || details.trim().length < 10} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}
