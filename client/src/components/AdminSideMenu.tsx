import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  FileText,
  Building,
  Coffee,
  Bell,
  ClipboardList,
  Link as LinkIcon,
  AlertTriangle,
} from 'lucide-react';
import './AdminSideMenu.css';

interface Item {
  to: string;
  icon: JSX.Element;
  label: string;
}

export default function AdminSideMenu() {
  const items: Item[] = [
    { to: '/admin/create', icon: <Plus size={18} />, label: 'Créer' },
    { to: '/admin/modules', icon: <FileText size={18} />, label: 'Modules' },
    { to: '/admin/sites', icon: <Building size={18} />, label: 'Sites' },
    { to: '/admin/caf-types', icon: <Coffee size={18} />, label: 'Type CAF' },
    { to: '/admin/notifications', icon: <Bell size={18} />, label: 'Notifs' },
    { to: '/admin/tickets', icon: <ClipboardList size={18} />, label: 'Tickets' },
    { to: '/admin/checklist-url', icon: <LinkIcon size={18} />, label: 'Checklist' },
    { to: '/admin/alert', icon: <AlertTriangle size={18} />, label: 'MàJ' },
  ]; 

  return (
    <nav className="admin-side-menu">
      {items.map(it => (
        <Link key={it.to} to={it.to} className="menu-item">
          <span className="icon">{it.icon}</span>
          <span className="label">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
