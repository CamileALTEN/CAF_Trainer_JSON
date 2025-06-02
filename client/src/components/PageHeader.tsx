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

  useEffect(() => {
    fetch('/api/checklist-url')
      .then(r => r.json())
      .then(d => setChecklistUrl(d.url || ''))
      .catch(() => setChecklistUrl(''));
  }, []);
      
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
                          <button
                            className="header-logout"
                            onClick={() => { logout(); navigate('/logged-out'); }}
                          >
                            Se déconnecter
                          </button>
                        </div>
                      )}
                    </header>
                  );
                }