             /* client/src/components/ItemContent.tsx
                ───────────────────────────────────── */
      
                import React from 'react';
                import FavoriteButton from './FavoriteButton';
                import './ItemContent.css';
import { IImage, ILink } from '../api/modules';
import { ProgressState } from '../api/progress';
      
export interface ItemContentProps {
  /* ─── contenu ─── */
  title:       string;
  subtitle?:   string;
  description: string;
  links?:      ILink[];
  images?:     (string | IImage)[];
  videos?:     string[];

  /* ─── progression ─── */
  state:          ProgressState;
  onChangeState:  (st: ProgressState) => void;
  hasQuiz?:       boolean;
      
                  /* ─── favoris ─── */
                  isFav:       boolean;
                  onToggleFav: () => void;
                }
      
                /* ════════════════════════════════════════════════════════════════════ */
      
                export default function ItemContent(props: ItemContentProps) {
  const {
    title, subtitle, description, links = [], images, videos,
    state, onChangeState, hasQuiz,
    isFav, onToggleFav,
  } = props;
      
                  return (
                    <div className="item-content">
                      {/* -------- entête -------- */}
                      <div className="item-header">
        <div className="item-titles">
          <h1>{title}</h1>
          {subtitle ? <h3>{subtitle}</h3> : null}
        </div>
      
                        <div className="item-actions">
                          {/* état de progression */}
                          {state === 'not-started' && (
                            <button
                              type="button"
                              className="check-button"
                              onClick={() => onChangeState('in-progress')}
                            >
                              ▶ Démarrer
                            </button>
                          )}
                          {state !== 'not-started' && (
                            <select
                              value={state}
                              onChange={e => onChangeState(e.target.value as any)}
                            >
                              <option value="not-started">⭕ Non commencé</option>
                              <option value="in-progress">🚧 En cours</option>
                              <option value="struggling">❗ En difficulté</option>
                              <option value="checking">🔎 Vérification</option>
                              {hasQuiz && (
                                <option value="validated">✅ Validé</option>
                              )}
                              <option value="finished">🏁 Fini</option>
                            </select>
                          )}
      
                          {/* étoile favoris */}
                          <FavoriteButton isFav={isFav} onClick={onToggleFav} />
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
                    </div>
                  );
                }

