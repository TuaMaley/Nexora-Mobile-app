import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ess, type LeaveBalance, type LeaveRow } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, Empty, H2, Loading, Muted, Notice, Pill, Screen } from '@/components/ui';
import { colors, dateLabel, label, radius } from '@/lib/theme';

export default function Leave() {
  const { canEdit } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { const d = await ess.leave(); setRows(d.requests); setBalances(d.balances); setError(''); }
    catch (e: any) { setError(e?.message || 'Unable to load leave'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <Notice kind="error" text={error} />
      {loading ? <Loading /> : <>
        <View style={s.balGrid}>
          {balances.filter((b) => b.entitled > 0 || b.used > 0 || b.pending > 0).map((b) => (
            <View key={b.type} style={s.bal}>
              <Text style={s.balType}>{label(b.type)}</Text>
              <Text style={s.balBig}>{b.available}<Text style={s.balSmall}> available</Text></Text>
              <Muted>Entitled {b.entitled} · Used {b.used} · Pending {b.pending}</Muted>
            </View>
          ))}
          {balances.every((b) => b.entitled === 0 && b.used === 0 && b.pending === 0) && <Muted>No leave entitlements recorded for this year yet. Contact HR if this looks wrong.</Muted>}
        </View>
        {canEdit && <Button title="Request leave" icon="add-circle" onPress={() => router.push('/more/new-leave')} />}
        <H2>My leave requests</H2>
        {rows.length === 0 ? <Empty icon="calendar-outline" text="No leave requests yet." /> : rows.map((r) => (
          <Card key={r.id}>
            <View style={s.head}><Text style={s.type}>{label(r.type)}</Text><Pill status={r.status} /></View>
            <Text style={s.dates}>{dateLabel(r.startDate)} – {dateLabel(r.endDate)} · {r.days} day{r.days === 1 ? '' : 's'}</Text>
            {r.reason ? <Muted>"{r.reason}"</Muted> : null}
            <Muted>Submitted {dateLabel(r.createdAt)}{r.status === 'PENDING' ? ` · at approval stage ${r.reviewStage || 1}` : ''}</Muted>
            {r.decisionNote ? <View style={s.note}><Text style={s.noteText}>{r.decisionNote}</Text></View> : null}
          </Card>
        ))}
      </>}
    </Screen>
  );
}

const s = StyleSheet.create({
  balGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bal: { width: '48%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 },
  balType: { fontWeight: '700', color: colors.ink, fontSize: 13 },
  balBig: { fontSize: 28, fontWeight: '800', color: colors.red, letterSpacing: -0.8 },
  balSmall: { fontSize: 12, color: colors.muted, fontWeight: '500', letterSpacing: 0 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontWeight: '700', fontSize: 16, color: colors.ink },
  dates: { color: colors.ink, fontSize: 14 },
  note: { backgroundColor: colors.soft, borderRadius: radius.sm, padding: 10 },
  noteText: { color: colors.greyInk, fontSize: 13 },
});
