import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ess, type Employee, type LeaveBalance, type PayRow, type RequestRow } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, H2, Muted, Notice, Pill, Screen } from '@/components/ui';
import { colors, dateLabel, label, money, radius } from '@/lib/theme';
import { downloadVerificationLetter } from '@/lib/letter';

type Quick = { title: string; sub: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void };

export default function Home() {
  const { me, canEdit } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [lastPay, setLastPay] = useState<PayRow | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [letterBusy, setLetterBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const results = await Promise.allSettled([ess.profile(), ess.leave(), ess.payslips(), ess.requests()]);
    const [p, l, pay, r] = results;
    if (p.status === 'fulfilled') setEmployee(p.value.employee); else setError(p.reason?.message || 'Unable to load your profile');
    if (l.status === 'fulfilled') setBalances(l.value.balances);
    if (pay.status === 'fulfilled') setLastPay(pay.value.payments[0] ?? null);
    if (r.status === 'fulfilled') setRequests(r.value.requests.slice(0, 3));
  }, []);

  useEffect(() => { load(); }, [load]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  async function letter() {
    setLetterBusy(true); setError(''); setNotice('');
    try { await downloadVerificationLetter(); setNotice('Employment verification letter ready — saved and opened for sharing.'); await load(); }
    catch (e: any) { setError(e?.message || 'Unable to generate the letter'); }
    finally { setLetterBusy(false); }
  }

  const annual = balances.find((b) => b.type === 'ANNUAL');
  const pending = requests.filter((r) => r.status === 'PENDING').length;
  const quick: Quick[] = [
    { title: 'Request leave', sub: annual ? `${annual.available} days available` : 'Apply for time off', icon: 'calendar', onPress: () => router.push('/more/new-leave') },
    { title: 'Payslips', sub: lastPay ? `Last: ${lastPay.period}` : 'Payment history', icon: 'cash', onPress: () => router.push('/(tabs)/pay') },
    { title: 'Employment letter', sub: letterBusy ? 'Generating…' : 'Instant PDF, no approval', icon: 'ribbon', onPress: letter },
    { title: 'HR request', sub: 'Letters, documents, payroll', icon: 'chatbox-ellipses', onPress: () => router.push('/more/new-request') },
    { title: 'My training', sub: 'Courses and attendance', icon: 'school', onPress: () => router.push('/more/training') },
    { title: 'My performance', sub: 'Appraisals and cycles', icon: 'trending-up', onPress: () => router.push('/more/performance') },
  ];
  const first = employee?.firstName || me?.name?.split(' ')[0] || 'there';

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={[s.hero, { paddingTop: insets.top + 18 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={s.logo}><Text style={s.logoN}>N</Text></View>
          <Link href="/(tabs)/profile" asChild><Pressable style={s.avatar}><Text style={s.avatarText}>{(employee ? employee.firstName[0] + employee.lastName[0] : 'NE').toUpperCase()}</Text></Pressable></Link>
        </View>
        <Text style={s.hi}>Hi, {first} 👋</Text>
        <Text style={s.hiSub}>{employee ? `${employee.position} · ${employee.branch.name}` : 'What do you need today?'}</Text>
      </View>

      <Notice kind="error" text={error} />
      <Notice kind="success" text={notice} />

      <View style={s.grid}>
        {quick.filter((q) => canEdit || !['Request leave', 'HR request'].includes(q.title)).map((q) => (
          <Pressable key={q.title} onPress={q.onPress} style={({ pressed }) => [s.tile, pressed && { opacity: 0.85 }]}>
            <View style={s.tileIcon}><Ionicons name={q.icon} size={22} color={colors.red} /></View>
            <Text style={s.tileTitle}>{q.title}</Text>
            <Text style={s.tileSub}>{q.sub}</Text>
          </Pressable>
        ))}
      </View>

      <Card>
        <View style={s.cardHead}><H2>Leave balances</H2><Link href="/(tabs)/leave" style={s.more}>View all</Link></View>
        {balances.length === 0 ? <Muted>No leave entitlements recorded yet.</Muted> : balances.filter((b) => b.entitled > 0).slice(0, 4).map((b) => (
          <View key={b.type} style={s.balRow}>
            <Text style={s.balType}>{label(b.type)}</Text>
            <View style={{ flex: 1, height: 8, backgroundColor: colors.line, borderRadius: 4, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, Math.round((b.used / Math.max(1, b.entitled)) * 100))}%`, height: '100%', backgroundColor: colors.red }} /></View>
            <Text style={s.balNum}>{b.available}<Text style={s.balOf}>/{b.entitled}</Text></Text>
          </View>
        ))}
      </Card>

      <Card>
        <View style={s.cardHead}><H2>Recent requests</H2><Link href="/(tabs)/requests" style={s.more}>{pending ? `${pending} pending` : 'View all'}</Link></View>
        {requests.length === 0 ? <Muted>You haven't sent any HR requests yet.</Muted> : requests.map((r) => (
          <View key={r.id} style={s.reqRow}>
            <View style={{ flex: 1 }}><Text style={s.reqSubject} numberOfLines={1}>{r.subject}</Text><Muted>{label(r.category)} · {dateLabel(r.createdAt)}</Muted></View>
            <Pill status={r.status} />
          </View>
        ))}
      </Card>

      {lastPay && <Card>
        <View style={s.cardHead}><H2>Last payment</H2><Pill status={lastPay.status} /></View>
        <Text style={s.payAmt}>{money(lastPay.netAmount, lastPay.currency)}</Text>
        <Muted>{lastPay.period} · {label(lastPay.method)} · confirmed {dateLabel(lastPay.confirmedAt)}</Muted>
      </Card>}
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.black, marginHorizontal: -16, marginTop: -16, paddingHorizontal: 20, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 6 },
  logo: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  logoN: { color: colors.white, fontWeight: '900', fontSize: 20, fontStyle: 'italic' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  hi: { color: colors.white, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 14 },
  hiSub: { color: '#ffffffaa', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 8 },
  tileIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontWeight: '700', fontSize: 15, color: colors.ink },
  tileSub: { fontSize: 12, color: colors.muted },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  more: { color: colors.red, fontWeight: '600', fontSize: 13 },
  balRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  balType: { width: 110, fontSize: 13, color: colors.ink, fontWeight: '600' },
  balNum: { width: 54, textAlign: 'right', fontWeight: '800', color: colors.ink },
  balOf: { fontWeight: '500', color: colors.muted, fontSize: 12 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  reqSubject: { fontWeight: '600', color: colors.ink, fontSize: 14 },
  payAmt: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8 },
});
