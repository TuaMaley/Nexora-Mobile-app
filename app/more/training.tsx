import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ess, type TrainingRow } from '@/lib/api';
import { Card, Empty, Loading, Muted, Notice, Pill, Row, Screen } from '@/components/ui';
import { colors, dateLabel, label } from '@/lib/theme';

export default function Training() {
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const d = await ess.training(); setRows(d.enrollments); setError(''); }
    catch (e: any) { setError(e?.message || 'Unable to load training'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <Notice kind="info" text="Courses HR has enrolled you in, with attendance and evaluation status. Enrollment is managed by HR." />
      <Notice kind="error" text={error} />
      {loading ? <Loading /> : rows.length === 0 ? <Empty icon="school-outline" text="No training assigned yet." /> : rows.map((r) => {
        const present = r.attendance.filter((a) => a.status === 'PRESENT').length;
        return (
          <Card key={r.id}>
            <View style={s.head}><Text style={s.title}>{r.training.title}</Text><Pill status={r.status} /></View>
            {r.training.description ? <Muted>{r.training.description}</Muted> : null}
            <Row label="Category" value={r.training.category || '—'} />
            <Row label="Schedule" value={r.training.startDate ? `${dateLabel(r.training.startDate)}${r.training.endDate ? ' – ' + dateLabel(r.training.endDate) : ''}` : 'Not scheduled'} />
            <Row label="Location" value={r.training.location || '—'} />
            <Row label="Trainer" value={r.training.trainer || '—'} />
            <Row label="Attendance" value={r.attendance.length ? `${present}/${r.attendance.length} sessions present` : 'Not recorded'} />
            <Row label="Evaluation" value={<Pill status={r.evaluations.length ? 'COMPLETED' : 'PENDING'} text={r.evaluations.length ? 'Submitted' : 'Not submitted'} />} last />
          </Card>
        );
      })}
    </Screen>
  );
}
const s = StyleSheet.create({ head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }, title: { fontWeight: '700', fontSize: 16, color: colors.ink, flex: 1 } });
