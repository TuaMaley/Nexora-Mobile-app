import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ess, type LeaveBalance } from '@/lib/api';
import { Button, Card, Field, Muted, Notice, Screen, Segmented } from '@/components/ui';
import DateField from '@/components/DateField';
import { colors, label } from '@/lib/theme';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
function businessDays(a: string, b: string) {
  if (!isoDate.test(a) || !isoDate.test(b)) return 0;
  const s = new Date(a + 'T12:00:00Z'), e = new Date(b + 'T12:00:00Z');
  if (isNaN(+s) || isNaN(+e) || s > e) return 0;
  let n = 0;
  for (let t = s.getTime(); t <= e.getTime(); t += 86400000) { const d = new Date(t).getUTCDay(); if (d !== 0 && d !== 6) n++; }
  return n;
}

export default function NewLeave() {
  const router = useRouter();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [type, setType] = useState('ANNUAL');
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { ess.leave().then((d) => setBalances(d.balances)).catch(() => {}); }, []);
  const bal = balances.find((b) => b.type === type);
  const days = useMemo(() => businessDays(startDate, endDate), [startDate, endDate]);
  const over = bal ? days > bal.available : false;

  async function submit() {
    setBusy(true); setError('');
    try {
      // Same validation rules as the web form; the server re-validates (overlap, balance, same year).
      if (!isoDate.test(startDate) || !isoDate.test(endDate)) throw new Error('Pick a start and end date');
      if (days < 1) throw new Error('Select at least one weekday');
      await ess.submitLeave({ type, startDate, endDate, reason });
      router.back();
    } catch (e: any) { setError(e?.message || 'Unable to submit leave'); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Notice kind="info" text="Your request goes through the same HR approval workflow as the web app. Weekends are not counted." />
      <Notice kind="error" text={error} />
      <Card>
        <Text style={{ fontWeight: '700', color: colors.ink }}>Leave type</Text>
        <Segmented value={type} onChange={setType} options={(balances.filter((b) => b.entitled > 0 || b.type === type).length ? balances.filter((b) => b.entitled > 0 || b.type === type) : [{ type: 'ANNUAL' } as LeaveBalance]).map((b) => ({ value: b.type, label: label(b.type) }))} />
        {bal && <Muted>{bal.available} day{bal.available === 1 ? '' : 's'} available · {bal.pending} pending</Muted>}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><DateField label="Start date" value={startDate} onChange={(d) => { setStart(d); if (endDate && endDate < d) setEnd(d); }} minimumDate={new Date()} /></View>
          <View style={{ flex: 1 }}><DateField label="End date" value={endDate} onChange={setEnd} minimumDate={startDate ? new Date(startDate + 'T12:00:00') : new Date()} /></View>
                </View>
        {days > 0 && <Text style={{ color: over ? colors.redInk : colors.greenInk, fontWeight: '600' }}>{days} working day{days === 1 ? '' : 's'}{over ? ' — exceeds your available balance' : ''}</Text>}
        <Field label="Reason (optional)" value={reason} onChangeText={setReason} multiline maxLength={1000} placeholder="Add a short note for your approver" />
        <Button title="Submit leave request" onPress={submit} loading={busy} disabled={!startDate || !endDate || days < 1} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}
