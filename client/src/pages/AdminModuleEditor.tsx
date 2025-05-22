/*  AdminModuleEditor – conserve le header et intègre ModuleEditor v2 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getModule, updateModule, IModule } from '../api/modules';
import ModuleEditor, { ModuleEditorHandle } from '../components/ModuleEditor';

export default function AdminModuleEditor() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [mod, setMod] = useState<IModule | null>(null);
  const [dirty, setDirty] = useState(false);
  const editorRef = useRef<ModuleEditorHandle>(null);

  /* chargement */
  useEffect(() => {
    if (!moduleId) return;
    if (moduleId === 'new') {
      setMod({
        id: Date.now().toString(),
        title: '',
        summary: '',
        enabled: true,
        items: [],
      });
    } else {
      getModule(moduleId)
        .then(setMod)
        .catch(() => navigate('/admin/modules'));
    }
  }, [moduleId, navigate]);

  if (!mod) return <p style={{ padding: '2rem' }}>Chargement…</p>;

  const save = async (m: IModule) => {
    if (moduleId === 'new') {                       // 1ʳᵉ sauvegarde => POST
      const created = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m),
      }).then(r => r.json());

      navigate(`/admin/modules/${created.id}`, { replace: true });  // redirige vers l’URL “normale”
    } else {
      updateModule(m).then(setMod);                 // mises‑à‑jour suivantes => PUT
    }
  };
  return (
    <div style={{
      position:      'sticky',    // ← on fixe la racine à tout l’écran
      top:            '68px',
      left:           200,
      right:          200,
      bottom:         0,
      display:       'flex',
      flexDirection: 'column',
      overflow:      'hidden',   // ← plus de scroll sur la page
    }}>
      <header
        className="page-header"
        style={{ position : 'sticky', justifyContent: 'space-between', padding: '8px 24px'}}
      >
        <h2>Admin › Modules › {mod.title || '(nouveau)'}</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={() => {
              if (!dirty || window.confirm('Quitter sans sauvegarder ?')) {
                navigate('/admin/modules');
              }
            }}
          >
            ← Retour modules
          </button>
          <button onClick={() => editorRef.current?.save()}>💾 Sauvegarder</button>
        </div>
      </header>

      <ModuleEditor ref={editorRef} module={mod} onChange={save} onDirtyChange={setDirty} hideSaveButton />
    </div>
  );
}