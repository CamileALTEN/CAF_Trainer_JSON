import React, { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { IModule, IProgress, IItem } from '../api/modules';
import { flatten } from '../utils/items';
import './RadarTracker.css';

interface RadarTrackerProps {
  modules: IModule[];
  progress: IProgress[];
  username: string;
  site?: string;
}

export default function RadarTracker({ modules, progress, username, site  }: RadarTrackerProps) {
  const [idx, setIdx] = useState(0);

  const userProg = progress.filter(p => p.username === username);

  const prev = () => setIdx(i => (i - 1 + modules.length) % modules.length);
  const next = () => setIdx(i => (i + 1) % modules.length);

  const buildData = (mod: IModule) => {
    const p = userProg.find(x => x.moduleId === mod.id);
    return mod.items.flatMap(item => {
      const nodes = flatten([item]).filter(n => !site || n.profiles?.includes(site));
      const total = nodes.length;
      if (total === 0) return [];
      const visited = nodes.filter(ch => p?.visited.includes(ch.id)).length;
      const percent = Math.round(total ? (visited / total) * 100 : 0);
      return { subject: item.title, percent, item, progress: p };
    });
  };

  const TooltipContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { item, progress: pr } = payload[0].payload as { item: IItem; progress?: IProgress };
      const children = item.children ?? [];
      return (
        <div className="radar-tip">
          <ul>
            {children.map(ch => {
              const status = pr?.visited.includes(ch.id)
                ? '✅'
                : pr?.needValidation?.includes(ch.id)
                ? '⌛'
                : pr?.started.includes(ch.id)
                ? '🚧'
                : '📍';
              return <li key={ch.id}>{ch.title} {status}</li>;
            })}
          </ul>
        </div>
      );
    }
    return null;
  };

  

  return (
    <div className="radar-wrapper">
      <h4>{modules[idx]?.title}</h4>
      <div className="radar-carousel">
        <div className="radar-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {modules.map(m => (
            <div className="radar-item" key={m.id}>
              <RadarChart width={500} height={500} outerRadius={80} data={buildData(m)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar dataKey="percent" fill='#ff5252' stroke='#ff5252' fillOpacity={0.6} dot />
                <Tooltip content={<TooltipContent />} />
              </RadarChart>
            </div>
          ))}
        </div>
      </div>
      {modules.length > 1 && (
        <div className="radar-navs">
          <button className="radar-nav" onClick={prev}>←</button>
          <button className="radar-nav" onClick={next}>→</button>
        </div>
      )}
    </div>
  );
}
