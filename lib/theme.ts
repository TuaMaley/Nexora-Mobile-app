export const colors = {
  red: '#E3141B',
  redDark: '#B30E13',
  redSoft: '#FDE8E9',
  black: '#0A0C10',
  ink: '#111318',
  muted: '#6B7280',
  line: '#E5E7EB',
  soft: '#F4F6F9',
  white: '#FFFFFF',
  green: '#16A34A',
  greenSoft: '#DCFCE7',
  greenInk: '#166534',
  amber: '#F59E0B',
  amberSoft: '#FEF3C7',
  amberInk: '#92400E',
  greySoft: '#E5E7EB',
  greyInk: '#374151',
  redInk: '#991B1B',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const space = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 };

/** Map an HRMS status string to a pill colour pair. */
export function statusTone(status: string): { bg: string; fg: string } {
  const s = status.toUpperCase();
  if (['APPROVED', 'CONFIRMED', 'COMPLETED', 'HR_APPROVED', 'PRESENT', 'ACTIVE'].includes(s)) return { bg: colors.greenSoft, fg: colors.greenInk };
  if (['PENDING', 'IN_REVIEW', 'SUBMITTED', 'ENROLLED', 'IN_PROGRESS', 'SCHEDULED'].includes(s)) return { bg: colors.amberSoft, fg: colors.amberInk };
  if (['REJECTED', 'CANCELLED', 'DECLINED', 'ABSENT', 'EXITED'].includes(s)) return { bg: colors.redSoft, fg: colors.redInk };
  return { bg: colors.greySoft, fg: colors.greyInk };
}

export const label = (s: string | null | undefined) => (s ?? '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
export const dateLabel = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString('en-GB', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }) : '—');
export const money = (n: string | number, c = 'GHS') => {
  try { return new Intl.NumberFormat('en-GH', { style: 'currency', currency: c || 'GHS' }).format(Number(n)); }
  catch { return `${c} ${Number(n).toFixed(2)}`; }
};
