import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ItemContent from '../components/ItemContent';
import { getItem, getModule, IItem, IModule } from '../api/modules';
import './PreviewItemPage.css';

export default function PreviewItemPage() {
  const { moduleId, itemId } = useParams<{ moduleId: string; itemId: string }>();
  const navigate = useNavigate();
  const [mod, setMod] = useState<IModule | null>(null);
  const [item, setItem] = useState<IItem | null>(null);

  useEffect(() => {
    if (!moduleId || !itemId) return;
    getModule(moduleId).then(setMod).catch(() => setMod(null));
    getItem(moduleId, itemId).then(setItem).catch(() => setItem(null));
  }, [moduleId, itemId]);

  if (!mod || !item) return <p style={{ padding: '2rem' }}>Chargement…</p>;

  return (
    <div className="preview-page">
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour éditeur</button>
      <h2>{mod.title} – aperçu de « {item.title} »</h2>
      <ItemContent
        title={item.title}
        subtitle={item.subtitle}
        description={item.content}
        links={item.links}
        images={item.images}
        videos={item.videos}
        quiz={item.quiz}
        moduleId={mod.id}
        itemId={item.id}
        needValidation={item.needValidation}
        status="new"
        onStatusChange={() => undefined}
        isFav={false}
        onToggleFav={() => undefined}
        readOnly
      />
    </div>
  );
}
