import React, { useState } from 'react';
import AdvancedEditor from './AdvancedEditor';

export interface AdvancedHelpEditorProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (msg: string, email?: string) => void;
}

export default function AdvancedHelpEditor({ open, onClose, onSubmit }: AdvancedHelpEditorProps) {
  const [msg, setMsg] = useState('');
  const [mode, setMode] = useState<'manager' | 'email'>('manager');
  const [email, setEmail] = useState('');

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, width: '90%', maxWidth: 600 }}>
        <h3>Demande d'aide</h3>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block' }}>
            <input
              type="radio"
              checked={mode === 'manager'}
              onChange={() => setMode('manager')}
            />{' '}
            Notifier le manager
          </label>
          <label style={{ display: 'block', marginTop: 4 }}>
            <input
              type="radio"
              checked={mode === 'email'}
              onChange={() => setMode('email')}
            />{' '}
            Entrer une adresse email
          </label>
          {mode === 'email' && (
            <input
              type="email"
              placeholder="adresse@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', marginTop: 4 }}
            />
          )}
        </div>

        <AdvancedEditor value={msg} onChange={setMsg} />

        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <button
            onClick={() => {
              onSubmit(msg, mode === 'email' ? email : undefined);
              setMsg('');
              setEmail('');
              setMode('manager');
            }}
          >
            Envoyer l'aide
          </button>
          <button style={{ marginLeft: 8 }} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
