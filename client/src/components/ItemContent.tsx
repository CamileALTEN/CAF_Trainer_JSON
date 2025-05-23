             /* client/src/components/ItemContent.tsx
                ───────────────────────────────────── */
      
import React, { useState } from 'react';
import FavoriteButton from './FavoriteButton';
import Quiz from './Quiz';
import StatusBadge from './StatusBadge';
import AdvancedEditor from './AdvancedEditor';
import './ItemContent.css';
import { IImage, ILink, IQuiz, ItemStatus } from '../api/modules';
      
export interface ItemContentProps {
  /* ─── contenu ─── */
  title:       string;
  subtitle?:   string;
  description: string;
  links?:      ILink[];
  images?:     (string | IImage)[];
  videos?:     string[];

  quiz?:       IQuiz;
  quizPassed?: boolean;
  onQuizPassed?: () => void;

  status?:      ItemStatus;
  onStatusChange?: (s: ItemStatus) => void;

  moduleId: string;
  itemId: string;
  username?: string;
  validationRequired?: boolean;
  validationType?: 'automatic' | 'manual';
      
                  /* ─── progression ─── */
                  isVisited:        boolean;
                  onToggleVisited:  () => void;
      
                  /* ─── favoris ─── */
                  isFav:       boolean;
                  onToggleFav: () => void;
                }
      
                /* ════════════════════════════════════════════════════════════════════ */
      
                export default function ItemContent(props: ItemContentProps) {
  const {
    title, subtitle, description, links = [], images, videos,
    quiz, quizPassed, onQuizPassed,
    status = 'not_started', onStatusChange,
    isVisited, onToggleVisited,
    isFav,     onToggleFav,
    moduleId, itemId, username,
    validationRequired = false,
    validationType = 'automatic',
  } = props;

  const [helpOpen, setHelpOpen] = useState(false);
  const [helpNotify, setHelpNotify] = useState(true);
  const [helpEmail, setHelpEmail] = useState('');
  const [helpMsg, setHelpMsg] = useState('');
      
                  return (
                    <div className="item-content">
                      {/* -------- entête -------- */}
                      <div className="item-header">
        <div className="item-titles">
          <h1>{title}</h1>
          {subtitle ? <h3>{subtitle}</h3> : null}
        </div>
        <StatusBadge status={status} />
      
                        <div className="item-actions">
                          {/* coche “vu” */}
                          <button
                            type="button"
                            className="check-button"
                            onClick={() => {
                              onToggleVisited();
                              if (isVisited) {
                                onStatusChange?.('not_started');
                              } else if (validationRequired && validationType === 'manual') {
                                onStatusChange?.('to_validate');
                                fetch('/api/validations', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ username, moduleId, itemId, itemTitle: title }),
                                }).catch(console.error);
                              } else if (quiz && quiz.enabled) {
                                onStatusChange?.(quizPassed ? 'validated' : 'to_validate');
                              } else {
                                onStatusChange?.('auto_done');
                              }
                            }}
                            aria-label={isVisited ? 'Marquer non visité' : 'Marquer visité'}
                          >
                            {isVisited ? '✅' : '⭕'}
                          </button>
      
                          {/* étoile favoris */}
                          <FavoriteButton isFav={isFav} onClick={onToggleFav} />

                          {status === 'in_progress' && (
                            <button onClick={() => setHelpOpen(true)}>❗ Besoin d'aide</button>
                          )}
                        </div>
                      </div>
      
                      {/* -------- corps HTML (éditeur) -------- */}
                      <div
                        className="item-body"
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
      
                      {/* -------- liens -------- */}
                      {links.length > 0 && (
                        <div className="item-links">
                          <h3>Lien(s)</h3>
                          <ul>
                            {links.map((l, i) => (
                              <li key={i} className="item-link">
                                <span>{l.label || l.url}</span>{' '}
                                —{' '}
                                <a href={l.url} target="_blank" rel="noopener noreferrer">
                                  {l.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
      
                      {/* -------- images -------- */}
                      {images?.length ? (
                        <div className="item-images">
                          {images.map((im, i) => {
                            const img  = typeof im === 'string' ? { src: im } : im;
                            const w    = img.width ?? 100;
                            const al   = img.align ?? 'left';
                            const style: React.CSSProperties = {
                              width:       `${w}%`,
                              maxWidth:    '100%',
                              display:     'block',
                              marginLeft:  al === 'center' ? 'auto' : al === 'right' ? 'auto' : 0,
                              marginRight: al === 'center' ? 'auto' : al === 'left'  ? 'auto' : 0,
                            };
                            return <img key={i} src={img.src} style={style} alt="" />;
                          })}
                        </div>
                      ) : null}
      
                      {/* -------- vidéos -------- */}
                      {videos?.length ? (
                        <div className="item-videos">
                          {videos.map((url, i) => (
                            <video key={i} controls src={url} />
                          ))}
                        </div>
                      ) : null}

                      {quiz && quiz.enabled && (
                        <Quiz quiz={quiz} onSuccess={onQuizPassed ?? (()=>{})} passed={quizPassed ?? false} />
                      )}

                      {helpOpen && (
                        <form
                          className="help-form"
                          onSubmit={e => {
                            e.preventDefault();
                            fetch('/api/help', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                username,
                                moduleId,
                                itemId,
                                itemTitle: title,
                                message: helpMsg,
                                notifyManager: helpNotify,
                                email: helpEmail || undefined,
                              }),
                            })
                              .then(() => {
                                setHelpOpen(false);
                                setHelpMsg('');
                                onStatusChange?.('need_help');
                              })
                              .catch(console.error);
                          }}
                        >
                          <label className="inline-row">
                            <input type="checkbox" checked={helpNotify} onChange={e => setHelpNotify(e.target.checked)} />{' '}
                            Notifier le manager
                          </label>
                          <input
                            type="email"
                            placeholder="Email tiers"
                            value={helpEmail}
                            onChange={e => setHelpEmail(e.target.value)}
                          />
                          <AdvancedEditor value={helpMsg} onChange={setHelpMsg} />
                          <button type="submit">Envoyer</button>{' '}
                          <button type="button" onClick={() => setHelpOpen(false)}>Annuler</button>
                        </form>
                      )}
                    </div>
                  );
                }