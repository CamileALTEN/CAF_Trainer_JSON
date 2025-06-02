             /* client/src/components/ModuleEditor.tsx
                ─────────────────────────────────────── */
import React, { useMemo, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import AdvancedEditor                  from './AdvancedEditor';
      
import {
  IModule, IItem, ILink, IImage, IQuiz,
} from '../api/modules';
                import './ModuleEditor.css';
      
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
                  enabled:   it.enabled   ?? true,
                  needValidation: it.needValidation ?? false,
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
  onChange: (m: IModule) => void;
  onDirtyChange?: (dirty: boolean) => void;
  hideSaveButton?: boolean;
}

const ModuleEditor = forwardRef<ModuleEditorHandle, Props>(
({ module, onChange, onDirtyChange, hideSaveButton }, ref) => {
                  /* état local --------------------------------------------- */
  const [edit, setEdit] = useState<IModule>(() => ({
    ...module,
    items: module.items.map(ensureDefaults),
  }));
  const [curId, setCurId] = useState<string>('');
  const [useAdv, setUseAdv] = useState(true);
  const [dirty, setDirty] = useState(false);

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
      
                  const move = (id: string, dir: -1 | 1) => {
                    const reorder = (xs: IItem[]): IItem[] => {
                      const idx = xs.findIndex((x) => x.id === id);
                      if (idx !== -1 && xs[idx + dir])
                        [xs[idx], xs[idx + dir]] = [xs[idx + dir], xs[idx]];
                      return xs.map((x) => ({ ...x, children: reorder(x.children ?? []) }));
                    };
                    setEdit((prev) => ({ ...prev, items: reorder([...prev.items]) }));
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
                  const save = () => onChange(edit);
                  useImperativeHandle(ref, () => ({ save }));
      
                  /* rendu récursif de l’arbre ------------------------------ */
                  const renderTree = (branch: IItem[]) => (
                    <ul>
                      {branch.map((it) => {
                        const p = new Set(it.profiles ?? []);
                        let profClass = '';
                        if (p.has('Nantes') && p.has('Montoir')) profClass = 'prof-both';
                        else if (p.has('Nantes')) profClass = 'prof-nantes';
                        else if (p.has('Montoir')) profClass = 'prof-montoir';
                        return (
                        <li key={it.id} className={`${it.id === curId ? 'sel' : ''} ${profClass}`}>
                          <button
                            className="item-delete"
                            onClick={() => delItem(it.id)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>

                          <span onClick={() => setCurId(it.id)}>{it.title || '∅'}</span>

                          <div className="item-acts">
                            <button onClick={() => addItem(it)} title="Ajouter">＋</button>
                            <button onClick={() => move(it.id, -1)} title="Monter">↑</button>
                            <button onClick={() => move(it.id, +1)} title="Descendre">↓</button>
                          </div>

                          {(it.children?.length ?? 0) > 0 && renderTree(it.children ?? [])}
                        </li>
                      )})}
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
                          <AdvancedEditor
                            value={edit.summary}
                            onChange={(html) => setEdit({ ...edit, summary: html })}
                          />
                          <label className="inline-row">
                            <input
                              type="checkbox"
                              checked={edit.enabled}
                              onChange={(e) => setEdit({ ...edit, enabled: e.target.checked })}
                            />{' '}
                            Module actif
                          </label>
                        </section>
      
                        {/* -------- Formulaire item -------- */}
                        {current ? (
                          <>
                            <h2>Item « {current.title || '∅'} »</h2>
                            <input
                              value={current.title}
                              placeholder="Titre"
                              onChange={(e) => patchItem({ title: e.target.value })}
                            />
      
                            <label className="inline-row" style={{marginBottom:4}}>
                              <input
                                type="checkbox"
                                checked={useAdv}
                                onChange={e => setUseAdv(e.target.checked)}
                              />{' '}
                              Utiliser l'éditeur avancé
                            </label>
                            <label>
                              Description (HTML enrichi)
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
                            </label>
      
                            {/* profils */}
                            <div className="prof-select">
                              {['Nantes', 'Montoir'].map((p) => (
                                <label key={p}>
                                  <input
                                    type="checkbox"
                                    checked={(current.profiles ?? []).includes(p)}
                                    onChange={(e) => {
                                      const set = new Set(current.profiles ?? []);
                                      e.target.checked ? set.add(p) : set.delete(p);
                                      patchItem({ profiles: Array.from(set) });
                                    }}
                                  />{' '}
                                  {p}
                                </label>
                              ))}
                            </div>
      
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
                                    <hr />
                                  </div>
                                ))}
                                <button onClick={() => patchQuiz({ questions: [...(current.quiz?.questions ?? []), { question: '', options: ['',''], correct: [] }] })}>＋ ajouter une question</button>
                              </div>
                          )}
                          </fieldset>
      
                            
                          <label className="inline-row">
                            <input
                              type="checkbox"
                              checked={current.needValidation ?? false}
                              onChange={e => patchItem({ needValidation: e.target.checked })}
                            />{' '}
                            Soumettre à validation
                          </label>

                          <label className="inline-row">
                            <input
                              type="checkbox"
                              checked={current.enabled}
                                onChange={(e) => patchItem({ enabled: e.target.checked })}
                              />{' '}
                              Item actif
                            </label>
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
