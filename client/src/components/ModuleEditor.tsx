             /* client/src/components/ModuleEditor.tsx
                ─────────────────────────────────────── */
import React, { useMemo, useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdvancedEditor                  from './AdvancedEditor';
      
import {
  IModule, IItem, ILink, IImage, IQuiz, getItem, setItemOutdated,
} from '../api/modules';
import './ModuleEditor.css';

import { ISite, getSites } from '../api/sites';
import { ICafType, getCafTypes } from '../api/cafTypes';
import { createAlertAction } from '../api/alert';
import { useAuth } from '../context/AuthContext';
      
                /* ═════════════════════════ HELPERS GÉNÉRIAUX ═════════════════════════ */
      
                const defaultImg = (i: Partial<IImage>): IImage => ({
                  src:   i.src   ?? '',
                  width: i.width ?? 100,
                  align: i.align ?? 'left',
                });
      
                const ensureDefaults = (it: Partial<IItem>): IItem => ({
                  id:        it.id        ?? crypto.randomUUID(),
                  title:     it.title     ?? '',
                  subtitle:  it.subtitle  ?? '',
                  content:   it.content   ?? '',
                  links:     it.links     ?? [],
                  images:    (it.images   ?? []).map((img: any) =>
                               typeof img === 'string' ? defaultImg({ src: img }) : defaultImg(img)),
                  videos:    it.videos    ?? [],
                  profiles:  it.profiles  ?? [],
                  cafTypes: it.cafTypes ?? [],
                  enabled:   it.enabled   ?? true,
                  needValidation: it.needValidation ?? false,
                  outdatedInfo: it.outdatedInfo ?? null,
                  quiz:      it.quiz      ?? { enabled: false, questions: [] },
                  children:  (it.children ?? []).map(ensureDefaults),
                });
      
// parcours récursif de l'arbre en appliquant fn sur chaque item
// (prend en compte les éventuelles modifications de `children` retournées
// par fn avant de descendre d'un niveau)
const mapItems = (arr: IItem[], fn: (x: IItem) => IItem): IItem[] =>
  arr.map((x) => {
    const mapped = fn(x);                       // résultat de fn(x)
    return {
      ...mapped,
      children: mapItems(mapped.children ?? [], fn),
    };
  });
      
                const filterTree = (arr: IItem[], pred: (x: IItem) => boolean): IItem[] =>
                  arr
                    .filter(pred)
                    .map((x) => ({ ...x, children: filterTree(x.children ?? [], pred) }));
      
                /* ═════════════════════════ COMPONENT ════════════════════════════════ */
      
export interface ModuleEditorHandle { save: () => void; }

interface Props {
  module:   IModule;
  onChange: (m: IModule, auto?: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
  hideSaveButton?: boolean;
}

const ModuleEditor = forwardRef<ModuleEditorHandle, Props>(
({ module, onChange, onDirtyChange, hideSaveButton }, ref) => {
  const { user } = useAuth();
                  /* état local --------------------------------------------- */
  const [edit, setEdit] = useState<IModule>(() => ({
    ...module,
    items: module.items.map(ensureDefaults),
  }));
  const [curId, setCurId] = useState<string>('');
  const [useAdv, setUseAdv] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [sites, setSites] = useState<ISite[]>([]);
  const [cafTypes, setCafTypes] = useState<ICafType[]>([]);

  const editRef = useRef(edit);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => { editRef.current = edit; }, [edit]);
  const autoSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onChange(editRef.current, true), 300);
  }, [onChange]);

  useEffect(() => { getSites().then(setSites); }, []);
  useEffect(() => { getCafTypes().then(setCafTypes); }, []);

  const PROFILE_COLORS = useMemo(() => {
    const map: Record<string, string> = {};
    sites.forEach(s => { map[s.name] = s.color; });
    return map;
  }, [sites]);

  useEffect(() => {
    setDirty(JSON.stringify(edit) !== JSON.stringify(module));
    onDirtyChange?.(JSON.stringify(edit) !== JSON.stringify(module));
  }, [edit, module, onDirtyChange]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  useEffect(() => {
    setEdit({ ...module, items: module.items.map(ensureDefaults) });
  }, [module]);

  useEffect(() => {
    if (!curId || module.id === 'new') return;
    getItem(module.id, curId)
      .then(it =>
        setEdit(prev => ({
          ...prev,
          items: mapItems(prev.items, x =>
            x.id === curId ? ensureDefaults(it) : x,
          ),
        })))
      .catch(console.error);
  }, [curId, module.id]);
      
                  /* MAJ ciblée d’un item ----------------------------------- */
                  const patchItem = (patch: Partial<IItem>) =>
                    setEdit((prev) => ({
                      ...prev,
                      items: mapItems(prev.items, (it) =>
                        it.id === curId ? { ...it, ...patch } : it),
                    }));

  const patchQuiz = (quizPatch: Partial<IQuiz>) => {
    const q = { enabled: false, questions: [], ...(current?.quiz ?? {}) };
    patchItem({ quiz: { ...q, ...quizPatch } });
    autoSave();
  };

  const parseName = (u: string) => {
    const m = u.match(/^(\w+)\.(\w+)@/);
    return m ? `${m[1]} ${m[2]}` : u;
  };

  const toggleOutdated = async () => {
    if (!current || !module) return;
    if (!current.outdatedInfo) {
      const reason = prompt("Pourquoi l'item n'est-il pas à jour ?")?.trim();
      if (!reason) return;
      const time = await fetch('https://worldtimeapi.org/api/timezone/Europe/Paris')
        .then(r => r.json())
        .then(d => d.datetime)
        .catch(() => new Date().toISOString());
      const info = { reason, date: time, user: parseName(user?.username || ''), site: user?.site };
      await setItemOutdated(module.id, current.id, info);
      patchItem({ outdatedInfo: info });
    } else {
      const comment = prompt('Que avez-vous modifié ?')?.trim();
      if (!comment) return;
      await setItemOutdated(module.id, current.id, null);
      patchItem({ outdatedInfo: null });
      createAlertAction([current.id], parseName(user?.username || ''), comment).catch(() => null);
    }
  };
      
                  /* CRUD items --------------------------------------------- */
                  const addItem = (parent?: IItem) => {
                    const title = prompt('Titre du nouvel item :')?.trim();
                    if (!title) return;
      
                    const child: IItem = ensureDefaults({ title });
                    setEdit((prev) => ({
                      ...prev,
                      items: parent
                        ? mapItems(prev.items, (it) =>
                            it.id === parent.id
                              ? { ...it, children: [...(it.children ?? []), child] }
                              : it,
                          )
                        : [...prev.items, child],
                    }));
                  };
      
                  const delItem = (id: string) => {
                    if (
                      !window.confirm(
                        'Supprimer cet item ? Cette action est irréversible.'
                      )
                    )
                      return;
                    setEdit((prev) => ({
                      ...prev,
                      items: filterTree(prev.items, (it) => it.id !== id),
                    }));
                  };
      
                  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
                  const [dragId, setDragId] = useState<string | null>(null);
                  const [overId, setOverId] = useState<string | null>(null);

                  const toggleCollapse = (id: string) =>
                    setCollapsed(prev => {
                      const s = new Set(prev);
                      s.has(id) ? s.delete(id) : s.add(id);
                      return s;
                    });

                  const findParent = (xs: IItem[], id: string): { arr: IItem[]; index: number } | null => {
                    const idx = xs.findIndex(x => x.id === id);
                    if (idx !== -1) return { arr: xs, index: idx };
                    for (const x of xs) {
                      const res = findParent(x.children ?? [], id);
                      if (res) return res;
                    }
                    return null;
                  };

                  const moveDrag = (fromId: string, toId: string) => {
                    setEdit(prev => {
                      const items = JSON.parse(JSON.stringify(prev.items)) as IItem[];
                      const from = findParent(items, fromId);
                      const to = findParent(items, toId);
                      if (!from || !to || from.arr !== to.arr) return prev;
                      const [it] = from.arr.splice(from.index, 1);
                      let idx = to.index;
                      if (from.index < to.index) idx--;
                      from.arr.splice(idx, 0, it);
                      return { ...prev, items };
                    });
                  };

                  const handleDragStart = (id: string) => (e: React.DragEvent) => {
                    setDragId(id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.stopPropagation();
                  };
                  const handleDragOver = (id: string) => (e: React.DragEvent) => {
                    if (dragId && dragId !== id) {
                      e.preventDefault();
                      e.stopPropagation();
                      setOverId(id);
                    }
                  };
                  const handleDrop = (id: string) => (e: React.DragEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragId && dragId !== id) moveDrag(dragId, id);
                    setDragId(null);
                    setOverId(null);
                  };
                  const handleDragLeave = (id: string) => (e: React.DragEvent) => {
                    e.stopPropagation();
                    if (overId === id) setOverId(null);
                  };
                  const handleDragEnd = () => {
                    setDragId(null);
                    setOverId(null);
                  };
      
                  /* item courant ------------------------------------------- */
const find = (xs: IItem[], id: string): IItem | null => {
                    for (const x of xs) {
                      if (x.id === id) return x;
                      const sub = find(x.children ?? [], id);
                      if (sub) return sub;
                    }
                    return null;
};
const current = useMemo(() => find(edit.items, curId), [edit.items, curId]);
const originalCurrent = useMemo(
  () => find(module.items, curId),
  [module.items, curId],
);
const currentDirty = useMemo(
  () => JSON.stringify(current) !== JSON.stringify(originalCurrent),
  [current, originalCurrent],
);
const selectItem = (id: string) => {
  if (id === curId) return;
  if (currentDirty && !window.confirm('Quitter sans sauvegarder ?')) return;
  setCurId(id);
};
      
                  /* liens -------------------------------------------------- */
                  const addLink = () =>
                    patchItem({
                      links: [...(current?.links ?? []), { label: 'Titre', url: 'https://' }],
                    });
                  const setLink = (i: number, l: Partial<ILink>) =>
                    patchItem({
                      links: (current?.links ?? []).map((x, k) => (k === i ? { ...x, ...l } : x)),
                    });
                  const delLink = (i: number) =>
                    patchItem({
                      links: (current?.links ?? []).filter((_x, k) => k !== i),
                    });
      
                  /* images ------------------------------------------------- */
                  const addImage = () =>
                    patchItem({
                      images: [...(current?.images ?? []), defaultImg({})],
                    });
      
                  const setImage = (i: number, patch: Partial<IImage>) =>
                    patchItem({
                      images: (current?.images ?? []).map((img, k) =>
                        k === i ? { ...img, ...patch } : img),
                    });
      
                  const delImage = (i: number) =>
                    patchItem({
                      images: (current?.images ?? []).filter((_x, k) => k !== i),
                    });
      
                  /* push au parent ----------------------------------------- */
                  const save = () => onChange(edit, false);
                  useImperativeHandle(ref, () => ({ save }));
      
                  /* rendu récursif de l’arbre ------------------------------ */
                  const renderTree = (branch: IItem[]) => (
                    <ul>
                      {branch.map((it) => (
                        <li
                          key={it.id}
                          className={`${it.id === curId ? 'sel' : ''}${it.outdatedInfo ? ' outdated' : ''}${overId === it.id ? ' drag-over' : ''}${dragId === it.id ? ' dragging' : ''}`}
                          draggable
                          onDragStart={handleDragStart(it.id)}
                          onDragOver={handleDragOver(it.id)}
                          onDragLeave={handleDragLeave(it.id)}
                          onDrop={handleDrop(it.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <button
                            className="item-delete"
                            onClick={() => delItem(it.id)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>

                          {(it.children?.length ?? 0) > 0 && (
                            <button
                              className="collapse-toggle"
                              onClick={() => toggleCollapse(it.id)}
                              title={collapsed.has(it.id) ? 'Déplier' : 'Replier'}
                            >
                              {collapsed.has(it.id) ? '▶' : '▼'}
                            </button>
                          )}

                          <span onClick={() => selectItem(it.id)}>
                            {it.title || '∅'}
                            {(it.profiles ?? []).map((p) => (
                              <span
                                key={p}
                                className="profile-dot"
                                style={{ background: PROFILE_COLORS[p] || '#ccc' }}
                                title={p}
                              />
                            ))}
                          </span>

                          <div className="item-acts">
                            <button onClick={() => addItem(it)} title="Ajouter">＋</button>
                          </div>

                          {!collapsed.has(it.id) && (it.children?.length ?? 0) > 0 && renderTree(it.children ?? [])}
                        </li>
                      ))}
                    </ul>
                  );
      
                  /* UI ----------------------------------------------------- */
                  return (
                    <div className="module-editor">
                      {/* -------- panneau arbre -------- */}
                      <aside className="tree-pane">
                        <header>
                          <strong>Items du module</strong>
                          <button onClick={() => addItem()}>＋ racine</button>
                        </header>
                        <nav className="tree-scroll">{renderTree(edit.items)}</nav>
                        <div className="color-legend">
                          {sites.map(s => (
                            <span key={s.id} className="legend-item">
                              <span className="profile-dot" style={{ background: s.color }} /> {s.name}
                            </span>
                          ))}
                        </div>
                      </aside>
      
                      {/* -------- panneau formulaire -------- */}
                      <main className="editor">
                        {/* -------- Métadonnées module -------- */}
                        <section className="meta">
                          <h2>Module</h2>
                        
                          <input
                            value={edit.title}
                            placeholder="Titre du module"
                            onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                          />
                           <label className="inline-row">
                            <input
                              type="checkbox"
                              checked={edit.enabled}
                              onChange={(e) => setEdit({ ...edit, enabled: e.target.checked })}
                            />{' '}
                            Module actif
                          </label>
                          <AdvancedEditor
                            value={edit.summary}
                            onChange={(html) => setEdit({ ...edit, summary: html })}
                          />
                         
                        </section>

                        
                        <hr style={{ margin: "40px 0", borderColor: "#ccc" }} />
      
                        {/* -------- Formulaire item -------- */}
                        {current ? (
                          <>
                            <h2>Item « {current.title || '∅'} »</h2>



                            <input
                              value={current.title}
                              placeholder="Titre"
                              onChange={(e) => patchItem({ title: e.target.value })}
                            />

                            <fieldset>
                            <legend>Paramètres</legend>
                            <label className="inline-row">
                            <input
                              type="checkbox"
                              checked={current.enabled}
                                onChange={(e) => patchItem({ enabled: e.target.checked })}
                              />{' '}
                              Item actif
                            </label>

                            {/* sites */}
                            <div className="prof-select">
                              <h4>Sites :</h4>
                              {sites.map(s => (
                                <label key={s.id}>
                                  <input
                                    type="checkbox"
                                    value={s.name}
                                    checked={(current.profiles ?? []).includes(s.name)}
                                    onChange={(e) => {
                                      const set = new Set(current.profiles ?? []);
                                      e.target.checked ? set.add(s.name) : set.delete(s.name);
                                      patchItem({ profiles: Array.from(set) });
                                    }}
                                  />{' '}
                                  {s.name}
                                </label>
                              ))}
                            </div>

                            {/* types CAF */}
                            <div className="prof-select">
                              <h4>Typologie de métier :</h4>
                              {cafTypes
                                .filter(t => t.id !== '1')
                                .map(t => (
                                  <label key={t.id}>
                                    <input
                                      type="checkbox"
                                      value={t.id}
                                      checked={(current.cafTypes ?? []).includes(t.id)}
                                      onChange={e => {
                                        const set = new Set(current.cafTypes ?? []);
                                        e.target.checked ? set.add(t.id) : set.delete(t.id);
                                        patchItem({ cafTypes: Array.from(set) });
                                      }}
                                    />{' '}
                                    {t.name}
                                  </label>
                                ))}
                              
                            </div>

                            <label className="inline-row">
                            <input
                              type="checkbox"
                              checked={current.needValidation ?? false}
                              onChange={e => patchItem({ needValidation: e.target.checked })}
                            />{' '}
                            Soumettre à validation <span style={{ fontStyle: 'italic' , fontSize:"10pt" }}>(ne pas cocher si Quiz activé)</span>
                          </label>
                            </fieldset>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                marginTop: "35px",
                                marginBottom: "15px",
                                gap : "5vh"
                              }}
                            >
                              <Link
                                to={`/preview/${module.id}/${current.id}`}
                                className="btn-secondary"
                              >
                                Prévisualiser
                              </Link>


                              <button
                                type="button"
                                onClick={toggleOutdated}
                                style={{ marginLeft: 8 }}
                                className={current.outdatedInfo ? 'btn-updated' : 'btn-outdated'}
                              >
                                {current.outdatedInfo ? 'Item mis à jour' : 'Item non à jour'}
                              </button>
                            </div>


                            <fieldset>
                            <legend>Description</legend>
                            <label className="inline-row" style={{marginBottom:4}}>
                              <input
                                type="checkbox"
                                checked={useAdv}
                                onChange={e => setUseAdv(e.target.checked)}
                              />{' '}
                              Utiliser l'éditeur avancé
                            </label>



                            <div style={{ marginBottom: 12 }}>
                              <div style={{ marginBottom: 10 }}></div>
                              {useAdv ? (
                                <AdvancedEditor
                                   value={current.content}
                                   onChange={html => patchItem({ content: html })}
                                 />
                              ) : (
                                <textarea
                                  value={current.content}
                                  placeholder="Collez ici le code HTML"
                                  onChange={e => patchItem({ content: e.target.value })}
                                  style={{ minHeight: 200 }}
                                />
                              )}
                             </div>
                            </fieldset>

      
                            

      
                            {/* liens --------------------------------------------------- */}
                            <fieldset>
                              <legend>Liens</legend>
                              {current.links.map((l, i) => (
                                <div key={i} className="inline-row">
                                  <input
                                    value={l.label}
                                    placeholder="Titre"
                                    onChange={(e) => setLink(i, { label: e.target.value })}
                                  />
                                  <input
                                    value={l.url}
                                    placeholder="https://…"
                                    onChange={(e) => setLink(i, { url: e.target.value })}
                                  />
                                  <button onClick={() => delLink(i)}>🗑️</button>
                                </div>
                              ))}
                              <button onClick={addLink}>＋ ajouter un lien</button>
                            </fieldset>
      



                            {/* images -------------------------------------------------- */}
                            <fieldset>
                              <legend>Images</legend>
                              {current.images.map((img, i) => (
                                <div key={i} className="inline-row" style={{ alignItems: 'flex-end' }}>
                                  <img
                                    src={img.src}
                                    alt=""
                                    style={{
                                      width: 40,
                                      height: 40,
                                      objectFit: 'cover',
                                      borderRadius: 4,
                                    }}
                                  />
      
                                  <input
                                    value={img.src}
                                    placeholder="URL https://…"
                                    onChange={(e) => setImage(i, { src: e.target.value })}
                                    style={{ flex: 2 }}
                                  />
      
                                  <input
                                    type="number"
                                    value={img.width}
                                    min={10}
                                    max={100}
                                    title="Largeur en pourcentage"
                                    onChange={(e) => setImage(i, { width: +e.target.value })}
                                    style={{ width: 70 }}
                                  />
                                  %
      
                                  <select
                                    value={img.align}
                                    onChange={(e) => setImage(i, { align: e.target.value as any })}
                                  >
                                    <option value="left">Gauche</option>
                                    <option value="center">Centre</option>
                                    <option value="right">Droite</option>
                                  </select>
      
                                  <button onClick={() => delImage(i)}>🗑️</button>
                                </div>
                              ))}
                            <button onClick={addImage}>＋ ajouter une image</button>
                          </fieldset>





                          {/* quiz ------------------------------------------- */}
                          <fieldset>
                            <legend>Quiz</legend>
                            <label className="inline-row">
                              <input
                                type="checkbox"
                                checked={current.quiz?.enabled ?? false}
                                onChange={e => patchQuiz({ enabled: e.target.checked })}
                              />{' '}
                              Activer le quiz
                            </label>

                            {current.quiz?.enabled && (
                              <div style={{ marginTop: 8 }}>
                                {current.quiz.questions.map((q, qi) => (
                                  <div key={qi} style={{ marginBottom: 12 }}>
                                    <input
                                      value={q.question}
                                      placeholder={`Question ${qi + 1}`}
                                      onChange={e => {
                                        const qs = [...current.quiz!.questions];
                                        qs[qi] = { ...qs[qi], question: e.target.value };
                                        patchQuiz({ questions: qs });
                                      }}
                                      style={{ width: '100%', marginBottom: 4 }}
                                    />
                                    {q.options.map((opt, oi) => (
                                      <div key={oi} className="inline-row">
                                        <input
                                          value={opt}
                                          placeholder={`Réponse ${oi + 1}`}
                                          onChange={e => {
                                            const qs = [...current.quiz!.questions];
                                            const opts = [...qs[qi].options];
                                            opts[oi] = e.target.value;
                                            qs[qi] = { ...qs[qi], options: opts };
                                            patchQuiz({ questions: qs });
                                          }}
                                          style={{ flex: 1 }}
                                        />
                                        <label>
                                          <input
                                            type="checkbox"
                                            checked={q.correct.includes(oi)}
                                            onChange={e => {
                                              const qs = [...current.quiz!.questions];
                                              const set = new Set(qs[qi].correct);
                                              e.target.checked ? set.add(oi) : set.delete(oi);
                                              qs[qi] = { ...qs[qi], correct: Array.from(set) };
                                              patchQuiz({ questions: qs });
                                            }}
                                          />{' '}
                                          Bonne réponse
                                        </label>
                                        <button onClick={() => {
                                          const qs = [...current.quiz!.questions];
                                          qs[qi].options.splice(oi,1);
                                          qs[qi].correct = qs[qi].correct.filter(x => x !== oi).map(x => x > oi ? x-1 : x);
                                          patchQuiz({ questions: qs });
                                        }}>🗑️</button>
                                      </div>
                                    ))}
                                    <button onClick={() => {
                                      const qs = [...current.quiz!.questions];
                                      qs[qi].options.push('');
                                      patchQuiz({ questions: qs });
                                    }}>＋ réponse</button>
                                    <button style={{ marginLeft: 8 }} onClick={() => {
                                      const qs = [...current.quiz!.questions];
                                      qs.splice(qi, 1);
                                      patchQuiz({ questions: qs });
                                    }}>🗑️ question</button>
                                    <hr />
                                  </div>
                                ))}
                                <button onClick={() => patchQuiz({ questions: [...(current.quiz?.questions ?? []), { question: '', options: ['',''], correct: [] }] })}>＋ ajouter une question</button>
                              </div>
                          )}
                          </fieldset>
      






                            


                            
                          </>


                        ) : (
                          <p>Sélectionnez un item dans l’arborescence…</p>
                        )}
      
                        {!hideSaveButton && (
                          <>
                            <hr style={{ margin: '10px 0' }} />
                            <button className="primary" onClick={save} style={{ margin:'2px auto 60px 0px' }}>
                              💾 Sauvegarder tout le module
                            </button>
                          </>
                        )}
                      </main>
                    </div>
                  );
                });

export default ModuleEditor;
