import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CircleMenu.css';

export default function CircleMenu() {
  const [open, setOpen] = useState(false);
  const [rotation, setRotation] = useState(0);

  const items = [
    { to: '/manager/create', icon: '➕', label: 'Créer' },
    { to: '/manager/modules', icon: '📝', label: 'Modules' },
    { to: '/manager/tickets', icon: '📋', label: 'Tickets' },
    { to: '/manager/checklist-url', icon: '🔗', label: 'Checklist' },
    { to: '/manager/alert', icon: '⚠️', label: 'Alerte' },
    { to: '/manager/progress', icon: '📊', label: 'Progress' },
  ];

  const angleStep = 360 / items.length;

  return (
    <div className={`menu menu--circle${open ? ' open' : ''}`}>
      <button
        className="menu__toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Menu"
      >
        <div className="icon">{open ? '✕' : <div className="hamburger"/>}</div>
      </button>
      <div className="menu__listings">
        <ul
          className="circle"
          style={{ ['--rotation' as any]: `${rotation}deg` }}
        >
          {items.map((it, i) => (
            <li key={i} style={{ ['--angle' as any]: `${i * angleStep}deg` }}>
              <Link to={it.to} className="button">
                <span>{it.icon}</span>
                <span className="label">{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <button
          className="rotate"
          aria-label="Tourner"
          onClick={() => setRotation(r => r - angleStep)}
        >🔄​</button>
      </div>
    </div>
  );
}
