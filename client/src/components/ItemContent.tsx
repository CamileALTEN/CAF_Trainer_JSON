             /* client/src/components/ItemContent.tsx
                ───────────────────────────────────── */
      
import React from 'react';
import FavoriteButton from './FavoriteButton';
import Quiz from './Quiz';
import StatusBadge from './StatusBadge';
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

  validationRequired?: boolean;
  validationType?: 'auto' | 'manual';
  onRequestValidation?: () => void;
  onRequestHelp?: () => void;

  /* ─── progression ─── */
  status:          ItemStatus;
  onStatusChange:  (s: ItemStatus) => void;
      
                  /* ─── favoris ─── */
                  isFav:       boolean;
                  onToggleFav: () => void;
                }
      
                /* ════════════════════════════════════════════════════════════════════ */
      
                export default function ItemContent(props: ItemContentProps) {
  const {
    title, subtitle, description, links = [], images, videos,
    quiz, quizPassed, onQuizPassed,
    validationRequired, validationType,
    onRequestValidation, onRequestHelp,
    status, onStatusChange,
    isFav, onToggleFav,
  } = props;

  const done = status === 'validated' || status === 'auto_done';
      
                  return (
                    <div className="item-content">
                      {/* -------- entête -------- */}
                      <div className="item-header">
        <div className="item-titles">
          <h1>{title}</h1>
          {subtitle ? <h3>{subtitle}</h3> : null}
        </div>
      
        <div className="item-actions">
          <StatusBadge status={status} />
          <FavoriteButton isFav={isFav} onClick={onToggleFav} />
        </div>

        <div className="item-buttons">
          {status === 'not_started' && (
            <button onClick={() => onStatusChange('in_progress')}>Démarrer</button>
          )}
          {status === 'in_progress' && (
            <>
              {!validationRequired && (
                <button onClick={() => onStatusChange('auto_done')}>
                  Marquer comme terminé
                </button>
              )}
              {validationRequired && validationType === 'manual' && (
                <button onClick={onRequestValidation}>Soumettre à validation</button>
              )}
              <button onClick={onRequestHelp}>❗ Besoin d'aide</button>
            </>
          )}
          {status === 'to_validate' && <em>En attente de validation…</em>}
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
                    </div>
                  );
                }