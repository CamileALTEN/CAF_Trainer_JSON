             /* client/src/components/ItemContent.tsx
                ───────────────────────────────────── */
      
import React from 'react';
import FavoriteButton from './FavoriteButton';
import Quiz from './Quiz';
import './ItemContent.css';
import { IImage, ILink, IQuiz } from '../api/modules';
import { ItemStatus } from '../api/userProgress';
      
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

  requiresValidation?: boolean;
  validationMode?: 'quiz' | 'manual';

  /* ─── statut ─── */
  status: ItemStatus;
  onStatusChange: (st: ItemStatus) => void;
  onHelpRequest: () => void;

      
                  /* ─── favoris ─── */
                  isFav:       boolean;
                  onToggleFav: () => void;
                }
      
                /* ════════════════════════════════════════════════════════════════════ */
      
                export default function ItemContent(props: ItemContentProps) {
  const {
    title, subtitle, description, links = [], images, videos,
    quiz, quizPassed, onQuizPassed,
    requiresValidation = false, validationMode = 'manual',
    isFav,     onToggleFav,
    status, onStatusChange, onHelpRequest,
  } = props;

  const icons: Record<ItemStatus, string> = {
    non_commencé: '▶️',
    en_cours: '🕓',
    besoin_aide: '🆘',
    terminé: '🎉',
    soumis_validation: '📤',
    en_attente: '⏱️',
    validé: '✅',
  };

  const handleStatusClick = () => {
    if (status === 'non_commencé') {
      onStatusChange('en_cours');
    } else if (status === 'en_cours') {
      if (requiresValidation && validationMode === 'manual') {
        onStatusChange('en_attente');
      } else if (!requiresValidation) {
        onStatusChange('terminé');
      }
    }
  };
      
                  return (
                    <div className="item-content">
                      {/* -------- entête -------- */}
                      <div className="item-header">
        <div className="item-titles">
          <h1>{title}</h1>
          {subtitle ? <h3>{subtitle}</h3> : null}
        </div>
      
                        <div className="item-actions">
                          {/* étoile favoris */}
                          <FavoriteButton isFav={isFav} onClick={onToggleFav} />
                          <button
                            type="button"
                            className="status-button"
                            onClick={handleStatusClick}
                            aria-label="Changer le statut"
                          >
                            {icons[status]} {status}
                          </button>
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
                        <Quiz
                          quiz={quiz}
                          onSuccess={() => {
                            onQuizPassed?.();
                            if (requiresValidation && validationMode === 'quiz') {
                              onStatusChange('validé');
                            }
                          }}
                          passed={quizPassed ?? false}
                        />
                      )}

                      {/* -------- actions statut -------- */}
                      <div style={{ marginTop: 16 }}>
                        {status === 'en_cours' && (
                          <button onClick={onHelpRequest}>🆘 Besoin d'aide</button>
                        )}
                      </div>
                    </div>
                  );
                }