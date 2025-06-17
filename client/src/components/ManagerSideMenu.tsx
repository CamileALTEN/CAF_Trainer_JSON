import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  FileText,
  ClipboardList,
  Link as LinkIcon,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';
import './ManagerSideMenu.css';

interface Item {
  to: string;
  icon: JSX.Element;
  label: string;
}

export default function ManagerSideMenu() {
  const items: Item[] = [
    { to: '/manager/create', icon: <Plus size={18} />, label: 'Créer' },
    { to: '/manager/modules', icon: <FileText size={18} />, label: 'Modules' },
    { to: '/manager/tickets', icon: <ClipboardList size={18} />, label: 'Tickets' },
    { to: '/manager/checklist-url', icon: <LinkIcon size={18} />, label: 'Checklist' },
    { to: '/manager/alert', icon: <AlertTriangle size={18} />, label: 'Alerte' },
    { to: '/manager/progress', icon: <BarChart2 size={18} />, label: 'Progress' },
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
