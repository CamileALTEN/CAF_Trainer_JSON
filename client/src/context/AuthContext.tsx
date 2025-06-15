import React, {
        createContext, useContext, useState, ReactNode,
      } from 'react';
      import axios from 'axios';
    
      /* ────────────── types ────────────── */
      export interface IUser {
        id:         string;
        username:   string;
        role:       'admin' | 'manager' | 'caf' | 'user';  // ← manager
        site?:      string;
        cafTypeId?: string;
        managerId?: string;
      }
    
    
      interface AuthContextType {
        user:   IUser | null;
        login:  (u: string, p: string) => Promise<{ ok:boolean; msg?:string }>;
        logout: () => void;
      }
    
      /* ────────────── contexte ────────────── */
      const AuthContext = createContext<AuthContextType | null>(null);
    
      export function AuthProvider({ children }: { children: ReactNode }) {
        const [user, setUser] = useState<IUser | null>(() => {
          const saved = sessionStorage.getItem('caf-user');
          return saved ? JSON.parse(saved) : null;
        });
    
        const login = async (username: string, password: string) => {
          try {
            const res = await axios.post<IUser>('/api/auth/login', { username, password });
            setUser(res.data);
            sessionStorage.setItem('caf-user', JSON.stringify(res.data));
            sessionStorage.setItem('login-time', Date.now().toString());
            return { ok: true } as const;
          } catch (err: any) {
            return { ok: false, msg: err.response?.data?.error || 'Erreur réseau' } as const;
          }
        };
    
        const logout = async () => {
          const current = user;
          setUser(null);
          sessionStorage.removeItem('caf-user');
          sessionStorage.removeItem('login-time');
          if (current) {
            try {
              await axios.post('/api/analytics/logout', { userId: current.id });
            } catch {
              /* ignore */
            }
          }
        };
    
        return (
          <AuthContext.Provider value={{ user, login, logout }}>
            {children}
          </AuthContext.Provider>
        );
      }
    
      /**
       * Hook protégé : lève une erreur claire si utilisé hors provider
       */
      export function useAuth() {
        const ctx = useContext(AuthContext);
        if (!ctx) {
          throw new Error('useAuth() doit être appelé à l’intérieur de <AuthProvider>');
        }
        return ctx;
      }