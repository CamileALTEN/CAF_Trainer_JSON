import React, { useState } from 'react';
import AdvancedEditor from './AdvancedEditor';

export interface AdvancedHelpEditorProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (msg: string) => void;
}

export default function AdvancedHelpEditor({ open, onClose, onSubmit }: AdvancedHelpEditorProps) {
  const [msg, setMsg] = useState('');
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
        <AdvancedEditor value={msg} onChange={setMsg} />
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <button onClick={() => { onSubmit(msg); setMsg(''); }}>Envoyer</button>
          <button style={{ marginLeft: 8 }} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
