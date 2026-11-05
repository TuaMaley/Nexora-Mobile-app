import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ess, type Employee } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, H2, Loading, Muted, Notice, Pill, Row, Screen, Segmented } from '@/components/ui';
import { colors, dateLabel, label } from '@/lib/theme';
import Constants from 'expo-constants';

export default function Profile() {
  const { me, canEdit, signOut, companies, chooseCompany } = useAuth();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState('');
  const load = useCallback(async () => {
    try { const d = await ess.profile(); setEmployee(d.employee); setError(''); }
    catch (e: any) { setError(e?.message || 'Unable to load your profile'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const show = (v: string | null | undefined) => v?.trim() || 'Not provided';
  const confirmOut = () => Alert.alert('Sign out', 'Sign out of Nexora Employee on this device?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => signOut() }]);
  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <Notice kind="error" text={error} />
      {companies.length > 1 && <Card><H2>Company</H2><Muted>Your account belongs to more than one company. Choose which one to view.</Muted>
        <Segmented value={company} options={companies.map((c) => ({ value: c.id, label: c.name }))} onChange={async (id) => { setCompany(id); await chooseCompany(id); setLoading(true); load(); }} /></Card>}
      {loading ? <Loading /> : employee && <>
        <View style={s.hero}>
          <View style={s.avatar}><Text style={s.avatarText}>{employee.firstName[0]}{employee.lastName[0]}</Text></View>
          <Text style={s.name}>{employee.firstName} {employee.lastName}</Text>
          <Text style={s.pos}>{employee.position} · {employee.branch.name}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}><Pill status={employee.status} /><Pill status="INFO" text={employee.employeeNo} /></View>
        </View>
        <Card>
          <H2>Contact</H2>
          <Row label="Email" value={employee.email} />
          <Row label="Phone" value={show(employee.phone)} />
          <Row label="Emergency contact" value={show(employee.emergencyContact)} last />
          {canEdit && <Button title="Update contact details" variant="ghost" icon="create-outline" onPress={() => router.push('/more/edit-contact')} />}
        </Card>
        <Card>
          <H2>Employment</H2>
          <Row label="Employee ID" value={employee.employeeNo} />
          <Row label="Department" value={employee.department} />
          <Row label="Position" value={employee.position} />
          <Row label="Branch" value={employee.branch.name} />
          <Row label="Employment type" value={label(employee.employmentType)} />
          <Row label="Hire date" value={dateLabel(employee.hireDate)} last />
          <Muted>To change employment details, send HR a request from the Requests tab.</Muted>
        </Card>
      </>}
      <Card>
        <H2>Account</H2>
        <Row label="Signed in as" value={me?.email || ''} />
        <Row label="Roles" value={me?.roles.join(', ') || '—'} last />
        <Button title="Sign out" variant="danger" icon="log-out-outline" onPress={confirmOut} />
      </Card>
      <Muted style={{ textAlign: 'center' }}>Nexora Employee v{Constants.expoConfig?.version} · People · Performance · Growth</Muted>
    </Screen>
  );
}
const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 4, paddingVertical: 10 },
  avatar: { width: 84, height: 84, borderRadius: 24, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 30 },
  name: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  pos: { color: colors.muted },
});
