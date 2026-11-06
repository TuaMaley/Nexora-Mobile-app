import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/lib/theme';

/** YYYY-MM-DD in local time (what the leave API expects). */
export const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromISO = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null; };
const pretty = (s: string) => { const d = fromISO(s); return d ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''; };

type Props = { label: string; value: string; onChange: (iso: string) => void; minimumDate?: Date; maximumDate?: Date; placeholder?: string };

/**
 * Tap-to-pick date field. Android opens the system date dialog; iOS shows an inline calendar in a sheet;
 * web falls back to a plain text input.
 */
export default function DateField({ label, value, onChange, minimumDate, maximumDate, placeholder = 'Select a date' }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(fromISO(value) || new Date());
  const current = fromISO(value) || new Date();

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current, mode: 'date', minimumDate, maximumDate,
        onChange: (e: DateTimePickerEvent, d?: Date) => { if (e.type === 'set' && d) onChange(toISODate(d)); },
      });
    } else { setDraft(current); setOpen(true); }
  }

  if (Platform.OS === 'web') {
    // Browser-native calendar input (Safari/Chrome show a date picker on phones).
    const WebInput: any = 'input';
    return (
      <View style={{ gap: 6 }}>
        <Text style={s.label}>{label}</Text>
        <WebInput type="date" value={value} min={minimumDate ? toISODate(minimumDate) : undefined} max={maximumDate ? toISODate(maximumDate) : undefined}
          onChange={(e: any) => onChange(e.target.value)}
          style={{ border: `1.5px solid ${value ? colors.red : colors.line}`, borderRadius: radius.sm, padding: '11px 14px', fontSize: 15, color: colors.ink, background: colors.white, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', minHeight: 44 }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable onPress={openPicker} style={({ pressed }) => [s.input, s.row, pressed && { opacity: 0.8 }, value ? { borderColor: colors.red } : null]}>
        <Text style={[s.value, !value && { color: colors.muted }]}>{value ? pretty(value) : placeholder}</Text>
        <Ionicons name="calendar-outline" size={20} color={colors.red} />
      </Pressable>
      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={s.backdrop} onPress={() => setOpen(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Pressable onPress={() => setOpen(false)}><Text style={s.cancel}>Cancel</Text></Pressable>
              <Text style={s.sheetTitle}>{label}</Text>
              <Pressable onPress={() => { onChange(toISODate(draft)); setOpen(false); }}><Text style={s.done}>Done</Text></Pressable>
            </View>
            <DateTimePicker value={draft} mode="date" display="inline" minimumDate={minimumDate} maximumDate={maximumDate} accentColor={colors.red} themeVariant="light"
              onChange={(_e: DateTimePickerEvent, d?: Date) => { if (d) setDraft(d); }} />
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: { borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, backgroundColor: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  value: { fontSize: 15, color: colors.ink, flex: 1 },
  backdrop: { flex: 1, backgroundColor: '#0008' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 30, paddingHorizontal: 12 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  sheetTitle: { fontWeight: '700', color: colors.ink },
  cancel: { color: colors.muted, fontSize: 16 },
  done: { color: colors.red, fontSize: 16, fontWeight: '700' },
});
