import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ess, type PayRow } from '@/lib/api';
import { Card, Empty, Loading, Muted, Notice, Pill, Screen } from '@/components/ui';
import { colors, dateLabel, label, money } from '@/lib/theme';

export default function Pay() {
  const [rows, setRows] = useState<PayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const d = await ess.payslips(); setRows(d.payments); setError(''); }
    catch (e: any) { setError(e?.message || 'Unable to load payslips'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const total = rows.reduce((n, r) => n + Number(r.netAmount), 0);
  const cur = rows[0]?.currency || 'GHS';
  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <Notice kind="info" text="Only confirmed payroll payments are shown — never drafts or unverified runs. This is your net-pay register; itemised statutory payslips are issued by HR." />
      <Notice kind="error" text={error} />
      {loading ? <Loading /> : rows.length === 0 ? <Empty icon="cash-outline" text="No confirmed payments yet." /> : <>
        <View style={s.summary}>
          <View><Muted style={{ color: '#ffffff99' }}>Latest net pay</Muted><Text style={s.big}>{money(rows[0].netAmount, rows[0].currency)}</Text><Muted style={{ color: '#ffffff99' }}>{rows[0].period}</Muted></View>
          <View style={{ alignItems: 'flex-end' }}><Muted style={{ color: '#ffffff99' }}>{rows.length} payment{rows.length === 1 ? '' : 's'}</Muted><Text style={s.mid}>{money(total, cur)}</Text><Muted style={{ color: '#ffffff99' }}>total received</Muted></View>
        </View>
        {rows.map((p) => (
          <Card key={p.id}>
            <View style={s.head}><Text style={s.period}>{p.period}</Text><Pill status={p.status} /></View>
            <Text style={s.amt}>{money(p.netAmount, p.currency)}</Text>
            <Muted>{label(p.method)} · confirmed {dateLabel(p.confirmedAt)}{p.reference ? ` · ref ${p.reference}` : ''}</Muted>
          </Card>
        ))}
      </>}
    </Screen>
  );
}
const s = StyleSheet.create({
  summary: { backgroundColor: colors.black, borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  big: { color: colors.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  mid: { color: colors.white, fontSize: 18, fontWeight: '700' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  period: { fontWeight: '700', fontSize: 16, color: colors.ink },
  amt: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
});
