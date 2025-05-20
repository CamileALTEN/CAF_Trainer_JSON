import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const rawPct = total > 0 ? Math.round((current / total) * 100) : 0;
  const pct = Math.min(100, Math.max(0, rawPct));

  // change text color for better contrast
  const textColor = pct > 50 ? '#fff' : '#043962';

  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      <span className="progress-bar-text" style={{ color: textColor }}>{pct}%</span>
    </div>
  );
}