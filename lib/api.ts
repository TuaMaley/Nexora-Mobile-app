import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as ExpoSecureStore from 'expo-secure-store';

/** Keychain / Keystore on iOS and Android; localStorage only when running in a browser via `expo start --web`. */
const SecureStore = Platform.OS === 'web'
  ? {
      getItemAsync: async (k: string) => { try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; } },
      setItemAsync: async (k: string, v: string) => { try { globalThis.localStorage?.setItem(k, v); } catch { /* ignore */ } },
      deleteItemAsync: async (k: string) => { try { globalThis.localStorage?.removeItem(k); } catch { /* ignore */ } },
    }
  : ExpoSecureStore;

/**
 * Thin client for the Nexora HRMS API. The mobile app never talks to the database directly:
 * every call goes through the same Next.js routes the web app uses, so permissions,
 * company scoping, validation and audit logging are enforced server-side exactly as on the web.
 */
export const BASE_URL: string = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined)?.replace(/\/$/, '') || 'https://nexora-hrms.up.railway.app';

const TOKEN_KEY = 'nexora.session.token';
const EXP_KEY = 'nexora.session.exp';
const COMPANY_KEY = 'nexora.company.id';

export const session = {
  async get() {
    const [token, exp] = await Promise.all([SecureStore.getItemAsync(TOKEN_KEY), SecureStore.getItemAsync(EXP_KEY)]);
    if (!token) return null;
    if (exp && Number(exp) < Date.now()) { await this.clear(); return null; }
    return token;
  },
  async set(token: string, expiresAt: number) {
    await Promise.all([SecureStore.setItemAsync(TOKEN_KEY, token), SecureStore.setItemAsync(EXP_KEY, String(expiresAt))]);
  },
  async clear() {
    await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(EXP_KEY), SecureStore.deleteItemAsync(COMPANY_KEY)]);
  },
  getCompany: () => SecureStore.getItemAsync(COMPANY_KEY),
  setCompany: (id: string) => SecureStore.setItemAsync(COMPANY_KEY, id),
};

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'ApiError'; }
}

export const setUnauthorizedHandlerRef: { current: (() => void) | null } = { current: null };
export const setUnauthorizedHandler = (fn: (() => void) | null) => { setUnauthorizedHandlerRef.current = fn; };

export async function authHeaders(): Promise<Record<string, string>> {
  const [token, company] = await Promise.all([session.get(), session.getCompany()]);
  const h: Record<string, string> = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  if (company) h['x-nexora-company'] = company;
  return h;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = { ...(await authHeaders()), ...(init.headers as Record<string, string> | undefined) };
  let res: Response;
  try { res = await fetch(`${BASE_URL}${path}`, { ...init, headers }); }
  catch { throw new ApiError('No connection. Check your internet and try again.', 0); }
  if (res.status === 401) { await session.clear(); setUnauthorizedHandlerRef.current?.(); throw new ApiError('Your session has expired. Please sign in again.', 401); }
  return res;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) throw new ApiError((data && data.error) || `Request failed (${res.status})`, res.status);
  return data as T;
}

export const json = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const patch = (body: unknown): RequestInit => ({ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// ---------- Types mirrored from app/self-service/page.tsx ----------
export type Employee = { id: string; employeeNo: string; firstName: string; lastName: string; email: string; phone: string | null; position: string; department: string; status: string; employmentType: string; hireDate: string; emergencyContact: string | null; branch: { id: string; name: string } };
export type LeaveRow = { id: string; type: string; startDate: string; endDate: string; days: number; status: string; reason: string | null; createdAt: string; reviewStage: number; decisionNote: string | null };
export type LeaveBalance = { type: string; year: number; entitled: number; used: number; remaining: number; pending: number; available: number };
export type PayRow = { id: string; period: string; netAmount: string; currency: string; method: string; status: string; confirmedAt: string | null; reference: string | null };
export type ReviewRow = { id: string; period: string; status: string; score: number | null; selfComment: string | null; managerComment: string | null; approvedAt: string | null; template: { name: string; category: string; level: string } };
export type CycleRow = { id: string; status: string; selfCompletedAt: string | null; managerCompletedAt: string | null; cycle: { name: string; period: string; endDate: string } };
export type TrainingRow = { id: string; status: string; enrolledAt: string; training: { id: string; title: string; code: string | null; category: string | null; description: string | null; status: string; startDate: string | null; endDate: string | null; durationHours: number | null; location: string | null; trainer: string | null }; attendance: { status: string; session: { sessionDate: string } }[]; evaluations: { submittedAt: string }[] };
export type RequestRow = { id: string; category: string; subject: string; details: string; status: string; response: string | null; createdAt: string; updatedAt: string };
export type Me = { name: string; email: string; employeeId: string | null; permissions: string[]; roles: string[]; platformAdmin: boolean };
export type Company = { id: string; name: string; code: string };
export type LoginResponse = { token: string; expiresAt: number; user: { name: string; email: string }; companies: Company[] };

export const ess = {
  me: () => api<Me>('/api/me'),
  profile: () => api<{ employee: Employee }>('/api/self-service/profile'),
  updateProfile: (b: { phone: string; emergencyContact: string }) => api<{ employee: Employee }>('/api/self-service/profile', patch(b)),
  leave: () => api<{ requests: LeaveRow[]; balances: LeaveBalance[] }>('/api/self-service/leave'),
  submitLeave: (b: { type: string; startDate: string; endDate: string; reason: string }) => api<{ request: LeaveRow }>('/api/self-service/leave', json(b)),
  payslips: () => api<{ payments: PayRow[] }>('/api/self-service/payslips'),
  performance: () => api<{ reviews: ReviewRow[]; cycles: CycleRow[] }>('/api/self-service/performance'),
  training: () => api<{ enrollments: TrainingRow[] }>('/api/self-service/training'),
  requests: () => api<{ requests: RequestRow[] }>('/api/self-service/requests'),
  submitRequest: (b: { category: string; subject: string; details: string }) => api<{ request: { id: string; status: string } }>('/api/self-service/requests', json(b)),
};
