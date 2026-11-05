import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ess } from '@/lib/api';
import { Button, Card, Field, Loading, Notice, Screen } from '@/components/ui';

export default function EditContact() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergency] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { ess.profile().then((d) => { setPhone(d.employee.phone || ''); setEmergency(d.employee.emergencyContact || ''); }).catch((e) => setError(e?.message || 'Unable to load')).finally(() => setLoading(false)); }, []);
  async function save() {
    setBusy(true); setError('');
    try { await ess.updateProfile({ phone, emergencyContact }); router.back(); }
    catch (e: any) { setError(e?.message || 'Unable to save changes'); }
    finally { setBusy(false); }
  }
  return (
    <Screen>
      <Notice kind="info" text="Only your phone and emergency contact can be changed here — the same rule as the web app. Changes are logged." />
      <Notice kind="error" text={error} />
      {loading ? <Loading /> : <Card>
        <Field label="Phone" value={phone} onChangeText={setPhone} maxLength={150} keyboardType="phone-pad" placeholder="+233 24 000 0000" />
        <Field label="Emergency contact" value={emergencyContact} onChangeText={setEmergency} maxLength={150} placeholder="Name · relationship · phone" />
        <Button title="Save contact details" onPress={save} loading={busy} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </Card>}
    </Screen>
  );
}
