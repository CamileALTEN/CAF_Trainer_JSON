import React from 'react';
import { Link } from 'react-router-dom';
import './ManagerSideMenu.css';

export default function ManagerSideMenu() {
  const items = [
    { to: '/manager/create', icon: '➕', label: 'Créer' },
    { to: '/manager/modules', icon: '📝', label: 'Modules' },
    { to: '/manager/tickets', icon: '📋', label: 'Tickets' },
    { to: '/manager/checklist-url', icon: '🔗', label: 'Checklist' },
    { to: '/manager/alert', icon: '⚠️', label: 'Alerte' },
    { to: '/manager/progress', icon: '📊', label: 'Progress' },
  ];

  return (
    <nav className="manager-side-menu">
      {items.map(it => (
        <Link key={it.to} to={it.to} className="menu-item">
          <span className="icon">{it.icon}</span>
          <span className="label">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
