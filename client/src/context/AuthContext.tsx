import React, {
        createContext, useContext, useState, ReactNode, useEffect,
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

        useEffect(() => {
          let reloading = false;
          let hideTime = 0;

          const markReload = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'f5' || ((e.ctrlKey || e.metaKey) && key === 'r')) {
              reloading = true;
            }
          };

          const sendLogout = () => {
            if (!user || reloading) return;
            const data = JSON.stringify({ userId: user.id });
            navigator.sendBeacon(
              '/api/analytics/logout',
              new Blob([data], { type: 'application/json' }),
            );
          };

          const handleVisibility = () => {
            if (document.visibilityState === 'hidden') {
              hideTime = Date.now();
            }
          };

          const handlePageHide = () => {
            if (hideTime && Date.now() - hideTime < 500) {
              reloading = true;
            }
            sendLogout();
          };

          window.addEventListener('keydown', markReload);
          document.addEventListener('visibilitychange', handleVisibility);
          window.addEventListener('pagehide', handlePageHide);

          return () => {
            window.removeEventListener('keydown', markReload);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('pagehide', handlePageHide);
          };
        }, [user]);
    
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