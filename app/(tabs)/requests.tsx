import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ess, type RequestRow } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Empty, H2, Loading, Muted, Notice, Pill, Screen } from '@/components/ui';
import { colors, dateLabel, label, radius } from '@/lib/theme';
import { downloadVerificationLetter } from '@/lib/letter';

export default function Requests() {
  const { canEdit } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [letterBusy, setLetterBusy] = useState(false);
  const load = useCallback(async () => {
    try { const d = await ess.requests(); setRows(d.requests); setError(''); }
    catch (e: any) { setError(e?.message || 'Unable to load requests'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  async function letter() {
    setLetterBusy(true); setError(''); setNotice('');
    try { await downloadVerificationLetter(); setNotice('Employment verification letter generated.'); await load(); }
    catch (e: any) { setError(e?.message || 'Unable to generate the letter'); }
    finally { setLetterBusy(false); }
  }
  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <Notice kind="error" text={error} />
      <Notice kind="success" text={notice} />
      <View style={s.letter}>
        <H2 style={{ color: colors.white }}>Employment verification letter</H2>
        <Muted style={{ color: '#ffffffb0' }}>Official PDF with your name, employee ID, joining date and approved basic salary. Generated instantly — no HR approval needed.</Muted>
        <Button title="Generate & download PDF" icon="document" onPress={letter} loading={letterBusy} />
      </View>
      {canEdit ? <Button title="New HR request" icon="add-circle" variant="ghost" onPress={() => router.push('/more/new-request')} /> : <Notice kind="info" text="Your account can view requests but not submit new ones (requires selfservice.edit)." />}
      <H2>My request history</H2>
      {loading ? <Loading /> : rows.length === 0 ? <Empty icon="document-text-outline" text="No requests submitted yet." /> : rows.map((r) => (
        <Card key={r.id}>
          <View style={s.head}><Text style={s.subject} numberOfLines={2}>{r.subject}</Text><Pill status={r.status} /></View>
          <Muted>{label(r.category)} · {dateLabel(r.createdAt)}</Muted>
          <Text style={s.details} numberOfLines={4}>{r.details}</Text>
          <View style={[s.resp, r.response ? { backgroundColor: colors.greenSoft } : null]}>
            <Text style={[s.respLabel, r.response ? { color: colors.greenInk } : null]}>HR response</Text>
            <Text style={[s.respText, r.response ? { color: colors.greenInk } : null]}>{r.response || 'Awaiting HR response'}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
const s = StyleSheet.create({
  letter: { backgroundColor: colors.black, borderRadius: radius.md, padding: 18, gap: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  subject: { fontWeight: '700', fontSize: 15, color: colors.ink, flex: 1 },
  details: { color: colors.greyInk, fontSize: 13, lineHeight: 19 },
  resp: { backgroundColor: colors.soft, borderRadius: radius.sm, padding: 10, gap: 2 },
  respLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: colors.muted },
  respText: { fontSize: 13, color: colors.greyInk },
});
