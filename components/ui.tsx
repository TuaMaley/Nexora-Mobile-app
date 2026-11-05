import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, statusTone } from '@/lib/theme';

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <View style={[s.card, style]}>{children}</View>;

export const Title = ({ children }: { children: React.ReactNode }) => <Text style={s.title}>{children}</Text>;
export const Sub = ({ children }: { children: React.ReactNode }) => <Text style={s.sub}>{children}</Text>;
export const H2 = ({ children, style }: { children: React.ReactNode; style?: any }) => <Text style={[s.h2, style]}>{children}</Text>;
export const Muted = ({ children, style }: { children: React.ReactNode; style?: any }) => <Text style={[s.muted, style]}>{children}</Text>;

export const Pill = ({ status, text }: { status: string; text?: string }) => {
  const t = statusTone(status);
  return <View style={[s.pill, { backgroundColor: t.bg }]}><Text style={[s.pillText, { color: t.fg }]}>{text ?? status.replaceAll('_', ' ')}</Text></View>;
};

export const Row = ({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) => (
  <View style={[s.row, last && { borderBottomWidth: 0 }]}>
    <Text style={s.rowLabel}>{label}</Text>
    {typeof value === 'string' || typeof value === 'number' ? <Text style={s.rowValue}>{value}</Text> : value}
  </View>
);

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger'; icon?: keyof typeof Ionicons.glyphMap }) {
  const off = disabled || loading;
  const bg = variant === 'primary' ? colors.red : variant === 'danger' ? colors.ink : colors.white;
  const fg = variant === 'ghost' ? colors.ink : colors.white;
  return (
    <Pressable onPress={onPress} disabled={off} style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: off ? 0.55 : pressed ? 0.85 : 1 }, variant === 'ghost' && s.btnGhost]}>
      {loading ? <ActivityIndicator color={fg} /> : <>
        {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} />}
        <Text style={[s.btnText, { color: fg }]}>{title}</Text>
      </>}
    </Pressable>
  );
}

export const Field = ({ label, ...p }: TextInputProps & { label: string }) => (
  <View style={{ gap: 6 }}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput placeholderTextColor={colors.muted} {...p} style={[s.input, p.multiline && { minHeight: 96, textAlignVertical: 'top' }, p.style]} />
  </View>
);

export const Notice = ({ kind, text }: { kind: 'error' | 'success' | 'info'; text: string }) => {
  if (!text) return null;
  const bg = kind === 'error' ? colors.redSoft : kind === 'success' ? colors.greenSoft : colors.soft;
  const fg = kind === 'error' ? colors.redInk : kind === 'success' ? colors.greenInk : colors.greyInk;
  const icon = kind === 'error' ? 'alert-circle' : kind === 'success' ? 'checkmark-circle' : 'information-circle';
  return <View style={[s.notice, { backgroundColor: bg }]}><Ionicons name={icon} size={18} color={fg} /><Text style={{ color: fg, flex: 1, fontSize: 14, lineHeight: 20 }}>{text}</Text></View>;
};

export const Empty = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={s.empty}><Ionicons name={icon} size={36} color={colors.line} /><Muted style={{ textAlign: 'center' }}>{text}</Muted></View>
);

export const Loading = () => <View style={s.empty}><ActivityIndicator color={colors.red} size="large" /></View>;

/** Scrollable screen with pull-to-refresh. */
export const Screen = ({ children, refreshing, onRefresh }: { children: React.ReactNode; refreshing?: boolean; onRefresh?: () => void }) => (
  <ScrollView style={{ flex: 1, backgroundColor: colors.soft }} contentContainerStyle={{ padding: space.md, gap: space.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled"
    refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.red} colors={[colors.red]} /> : undefined}>
    {children}
  </ScrollView>
);

/** Segmented choice (used instead of <select>). */
export function Segmented({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.seg, on && { backgroundColor: colors.red, borderColor: colors.red }]}><Text style={[s.segText, on && { color: colors.white }]}>{o.label}</Text></Pressable>;
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line, gap: 10 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  h2: { fontSize: 17, fontWeight: '700', color: colors.ink },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'capitalize' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.ink, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 18, borderRadius: radius.sm },
  btnGhost: { borderWidth: 1, borderColor: colors.line },
  btnText: { fontSize: 15, fontWeight: '700' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: { borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, backgroundColor: colors.white },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: radius.sm },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  seg: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  segText: { fontSize: 13, fontWeight: '600', color: colors.ink },
});
