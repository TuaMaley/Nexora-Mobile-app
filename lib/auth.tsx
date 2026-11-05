import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ess, json, session, setUnauthorizedHandler, type Company, type LoginResponse, type Me } from './api';

type AuthState = {
  ready: boolean;
  signedIn: boolean;
  me: Me | null;
  companies: Company[];
  canEdit: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  chooseCompany: (id: string) => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  const refreshMe = useCallback(async () => {
    const m = await ess.me();
    setMe(m);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { setSignedIn(false); setMe(null); });
    (async () => {
      try {
        const token = await session.get();
        if (token) { await refreshMe(); setSignedIn(true); }
      } catch { await session.clear(); }
      finally { setReady(true); }
    })();
    return () => setUnauthorizedHandler(null);
  }, [refreshMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    const r = await api<LoginResponse>('/api/auth/mobile-login', json({ email, password }));
    await session.set(r.token, r.expiresAt);
    setCompanies(r.companies);
    if (r.companies.length === 1) await session.setCompany(r.companies[0].id);
    await refreshMe();
    setSignedIn(true);
  }, [refreshMe]);

  const signOut = useCallback(async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* local sign-out still proceeds */ }
    await session.clear();
    setSignedIn(false); setMe(null); setCompanies([]);
  }, []);

  const chooseCompany = useCallback(async (id: string) => { await session.setCompany(id); await refreshMe(); }, [refreshMe]);

  const value = useMemo<AuthState>(() => ({
    ready, signedIn, me, companies,
    canEdit: !!me?.permissions.includes('selfservice.edit'),
    signIn, signOut, refreshMe, chooseCompany,
  }), [ready, signedIn, me, companies, signIn, signOut, refreshMe, chooseCompany]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
