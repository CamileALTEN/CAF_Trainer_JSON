             /* client/src/components/PageHeader.tsx
                ──────────────────────────────────── */
import React, { useEffect, useState } from 'react';
                import { Link, useNavigate } from 'react-router-dom';
                import { useAuth }           from '../context/AuthContext';
                import './PageHeader.css';
      
export default function PageHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [checklistUrl, setChecklistUrl] = useState('');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetch('/api/checklist-url')
      .then(r => r.json())
      .then(d => setChecklistUrl(d.url || ''))
      .catch(() => setChecklistUrl(''));
  }, []);

  useEffect(() => {
    if (!user) return;
    const loginStr = sessionStorage.getItem('login-time');
    if (!loginStr) return;
    const login = parseInt(loginStr, 10);
    const tick = () => setDuration(Math.floor((Date.now() - login) / 60000));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [user]);
      
                  const goHome = () => {
                    if (!user) return navigate('/login');
                    switch (user.role) {
                      case 'admin':   navigate('/admin');   break;
                      case 'manager': navigate('/manager'); break;
                      default:        navigate('/');        break;
                    }
                  };
      
                  return (
                    <header className="page-header">
      <div className="header-left" onClick={goHome}>
        <img
          src="https://upload.wikimedia.org/wikipedia/fr/8/82/Logo_ALTEN.jpg"
          alt="Alten"
          className="header-logo"
        />
        <img
          src="/images/caf-trainer.png"
          alt="CAF Trainer"
          className="header-logo"
        />
        <span className="header-title">CAF‑Trainer</span>
      </div>
      
                      {user && (
                        <div className="header-right">
                          {(user.role === 'caf' || user.role === 'user') && (
                            <Link className="header-favs" to="/favoris">
                              ⭐ Favoris
                            </Link>
                          )}
                          {(user.role === 'caf' || user.role === 'user'|| user.role === 'admin'|| user.role === 'manager') && (
                            <a
                              className="header-favs"
                              href={checklistUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              📋 Plan d'intégration
                            </a>
                          )}
                          <Link
                            className="header-favs"
                            to={
                              user.role === 'admin'
                                ? '/admin/tickets'
                                : user.role === 'manager'
                                ? '/manager/tickets'
                                : '/tickets'
                            }
                          >
                            📋 Tickets
                          </Link>
      
                          <span className="header-user">{user.username}</span>
                          {user.role === 'caf' && (
                            <span className="header-duration">{duration} min</span>
                          )}
                          <button
                            className="header-logout"
                            onClick={() => { logout(); navigate('/logged-out'); }}
                          >
                            🔐 Se déconnecter
                          </button>
                        </div>
                      )}
                    </header>
                  );
                }