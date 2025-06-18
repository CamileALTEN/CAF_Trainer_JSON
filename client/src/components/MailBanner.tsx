import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSettings } from '../api/settings';
import './MailBanner.css';

export default function MailBanner() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    getSettings().then(s => setEnabled(s.mailEnabled)).catch(() => setEnabled(true));
  }, []);

  if (!user || user.role !== 'admin') return null;
  if (enabled) return null;

  return (
    <div className="mail-banner">
      <marquee>Système de mailing désactivé</marquee>
    </div>
  );
}
