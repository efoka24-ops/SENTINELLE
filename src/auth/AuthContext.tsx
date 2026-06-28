import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { setToken, getToken } from '../api/client';
import type { ApiUser } from '../api/types';

interface AuthUser {
  name: string;
  role: string;
  initials: string;
  email?: string;
}

interface AuthState {
  user: AuthUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  login: (token: string, user: ApiUser, permissions: string[]) => void;
  loginDemo: () => void;
  logout: () => void;
  hasPerm: (perm: string) => boolean;
}

const PERM_KEY = 'sentinelle.perms';
const USER_KEY = 'sentinelle.user';

// Toutes les permissions (mode démo hors-ligne).
const DEMO_PERMS = [
  'view:dashboard', 'view:carte', 'view:collecte', 'view:analyse', 'view:alertes',
  'view:renseignement', 'view:signalements', 'view:rapports', 'view:audit',
  'view:endpoints', 'view:users', 'scan:launch', 'users:manage', 'audit:read',
];

function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [permissions, setPerms] = useState<string[]>(() => {
    const raw = localStorage.getItem(PERM_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  const persist = (u: AuthUser | null, p: string[]) => {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
    localStorage.setItem(PERM_KEY, JSON.stringify(p));
  };

  // On mount, validate that stored token is still valid by checking localStorage consistency
  // (Optional: in future, could call /auth/me to validate with backend)
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = localStorage.getItem(USER_KEY);
    const storedPerms = localStorage.getItem(PERM_KEY);

    // If token exists but user or perms are missing, clear auth state
    if (storedToken && (!storedUser || !storedPerms)) {
      setToken(null);
      setUser(null);
      setPerms([]);
    }
    // If user exists but token is missing, clear auth state
    else if (storedUser && !storedToken) {
      setUser(null);
      setPerms([]);
    }
  }, []);

  const login = (token: string, apiUser: ApiUser, perms: string[]) => {
    setToken(token);
    const u: AuthUser = { name: apiUser.name, role: apiUser.role, initials: initials(apiUser.name), email: apiUser.email };
    setUser(u);
    setPerms(perms);
    persist(u, perms);
  };

  const loginDemo = () => {
    const u: AuthUser = { name: 'Analyste K.D', role: 'analyst_sr', initials: 'KD' };
    setUser(u);
    setPerms(DEMO_PERMS);
    persist(u, DEMO_PERMS);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPerms([]);
    persist(null, []);
  };

  const hasPerm = (perm: string) => permissions.includes(perm);

  return (
    <AuthContext.Provider
      value={{ user, permissions, isAuthenticated: !!user, login, loginDemo, logout, hasPerm }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
