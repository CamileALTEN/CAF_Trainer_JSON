             /* client/src/components/ItemContent.tsx
                ───────────────────────────────────── */
      
import React from 'react';
import FavoriteButton from './FavoriteButton';
import Quiz from './Quiz';
import './ItemContent.css';
import { IImage, ILink, IQuiz } from '../api/modules';

export type ItemStatus = 'new' | 'in-progress' | 'done';
      
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

  /* ─── progression ─── */
  status:        ItemStatus;
  onStatusChange: (s: ItemStatus) => void;
      
                  /* ─── favoris ─── */
                  isFav:       boolean;
                  onToggleFav: () => void;
                }
      
                /* ════════════════════════════════════════════════════════════════════ */
      
                export default function ItemContent(props: ItemContentProps) {
  const {
    title, subtitle, description, links = [], images, videos,
    quiz, quizPassed, onQuizPassed,
    status, onStatusChange,
    isFav,     onToggleFav,
  } = props;
      
  const cls = `item-content ${status}`;
  const launchConfetti = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    const colors = ['#00c6ff', '#0072ff', '#fce566', '#f98ec5'];
    for (let i = 0; i < 150; i++) {
      const div = document.createElement('div');
      div.className = 'confetti-piece';
      div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      div.style.left = `${x * 100}%`;
      div.style.top = `${y * 100}%`;
      div.style.transform = `translate(${(Math.random() - 0.5) * 200}px, ${(-Math.random()) * 200}px) rotate(${Math.random() * 720}deg)`;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 1000);
    }
  };

  return (
    <div className={cls}>
      {status === 'new' && (
        <div className="start-overlay">
          <button onClick={() => onStatusChange('in-progress')}>Démarrer</button>
        </div>
      )}
      <div className="item-inner">
                      {/* -------- entête -------- */}
                      <div className="item-header">
        <div className="item-titles">
          <h1>{title}</h1>
          {subtitle ? <h3>{subtitle}</h3> : null}
        </div>
      
                        <div className="item-actions">
                          <span className="status-label">
                            {status === 'new' && 'À faire ⏳'}
                            {status === 'in-progress' && 'En cours 🚧'}
                            {status === 'done' && 'Validé ✅'}
                          </span>
                          {status === 'in-progress' && (
                            <button
                              type="button"
                              className="check-button"
                              onClick={(e) => { launchConfetti(e); onStatusChange('done'); }}
                              disabled={quiz?.enabled && !quizPassed}
                            >
                              Valider l'item ?
                            </button>
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

                      {quiz && quiz.enabled && (
                        <Quiz quiz={quiz} onSuccess={onQuizPassed ?? (()=>{})} passed={quizPassed ?? false} />
                      )}
      </div>
    </div>
  );
}
