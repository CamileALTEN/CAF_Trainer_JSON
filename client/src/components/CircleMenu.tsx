import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CircleMenu.css';

export default function CircleMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`menu menu--circle${open ? ' open' : ''}`}>\
      <button className="menu__toggle" onClick={() => setOpen(o => !o)} aria-label="Menu">
        <div className="icon"><div className="hamburger"/></div>
      </button>
      <div className="menu__listings">
        <ul className="circle">
          <li><Link to="/manager/create" className="button"><span>➕</span><span className="label">Créer</span></Link></li>
          <li><Link to="/manager/modules" className="button"><span>📝</span><span className="label">Modules</span></Link></li>
          <li><Link to="/manager/tickets" className="button"><span>📋</span><span className="label">Tickets</span></Link></li>
          <li><Link to="/manager/checklist-url" className="button"><span>🔗</span><span className="label">Checklist</span></Link></li>
          <li><Link to="/manager/progress" className="button"><span>📊</span><span className="label">Progress</span></Link></li>
        </ul>
      </div>
    </div>
  );
}
