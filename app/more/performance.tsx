import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ess, type CycleRow, type ReviewRow } from '@/lib/api';
import { Card, Empty, H2, Loading, Muted, Notice, Pill, Row, Screen } from '@/components/ui';
import { colors, dateLabel, label } from '@/lib/theme';

export default function Performance() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const d = await ess.performance(); setReviews(d.reviews); setCycles(d.cycles); setError(''); }
    catch (e: any) { setError(e?.message || 'Unable to load performance'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <Notice kind="info" text="Manager feedback and final scores appear only after HR approval — the same privacy rule as the web app." />
      <Notice kind="error" text={error} />
      {loading ? <Loading /> : <>
        <H2>Appraisal reviews</H2>
        {reviews.length === 0 ? <Empty icon="trending-up-outline" text="No appraisal reviews yet." /> : reviews.map((r) => (
          <Card key={r.id}>
            <View style={s.head}><View style={{ flex: 1 }}><Text style={s.title}>{r.template.name}</Text><Muted>{r.template.category} · {r.template.level} · {r.period}</Muted></View><Pill status={r.status} /></View>
            <View style={s.scoreRow}><Text style={s.scoreLabel}>Final score</Text><Text style={s.score}>{r.score === null ? '—' : r.score}</Text></View>
            {r.selfComment ? <><Text style={s.k}>Your self-assessment</Text><Muted>{r.selfComment}</Muted></> : null}
            {r.managerComment ? <><Text style={s.k}>Manager feedback</Text><Muted>{r.managerComment}</Muted></> : <Muted>{r.approvedAt ? 'No manager comment recorded.' : 'Manager feedback is released after HR approval.'}</Muted>}
          </Card>
        ))}
        <H2>Appraisal cycles</H2>
        {cycles.length === 0 ? <Empty icon="repeat-outline" text="No appraisal cycles assigned yet." /> : cycles.map((c) => (
          <Card key={c.id}>
            <View style={s.head}><Text style={s.title}>{c.cycle.name}</Text><Pill status={c.status} /></View>
            <Row label="Period" value={`${c.cycle.period} · closes ${dateLabel(c.cycle.endDate)}`} />
            <Row label="Self-assessment" value={<Pill status={c.selfCompletedAt ? 'COMPLETED' : 'PENDING'} text={c.selfCompletedAt ? 'Submitted' : 'Not submitted'} />} />
            <Row label="Manager evaluation" value={<Pill status={c.managerCompletedAt ? 'COMPLETED' : 'PENDING'} text={c.managerCompletedAt ? 'Completed' : 'Pending'} />} last />
          </Card>
        ))}
      </>}
    </Screen>
  );
}
const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  title: { fontWeight: '700', fontSize: 16, color: colors.ink, flex: 1 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.soft, borderRadius: 10, padding: 12 },
  scoreLabel: { color: colors.muted, fontWeight: '600' }, score: { fontSize: 24, fontWeight: '800', color: colors.red },
  k: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: colors.muted, marginTop: 4 },
});
