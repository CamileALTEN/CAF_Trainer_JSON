import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAlertConfig, saveAlertConfig, IAlertConfig } from '../api/alert';

export default function AlertBanner() {
  const { user } = useAuth();
  const location = useLocation();
  const [conf, setConf] = useState<IAlertConfig | null>(null);

  useEffect(() => {
    getAlertConfig().then(setConf).catch(() => null);
  }, []);

  // check on page change
  useEffect(() => {
    if (!conf || conf.active) return;
    if (!conf.frequency || !conf.lastAck) return;
    fetch('https://worldtimeapi.org/api/ip')
      .then(r => r.json())
      .then(d => {
        const now = new Date(d.utc_datetime).getTime();
        const last = new Date(conf.lastAck!).getTime();
        if (now - last >= conf.frequency * 1000) {
          saveAlertConfig({ active: true }).then(setConf);
        }
      })
      .catch(() => { /* ignore */ });
  }, [location, conf]);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;
  if (!conf || !conf.active) return null;

  return (
    <div style={{background:'#c00',color:'#fff',padding:'4px 0',textAlign:'center'}}>
      <a href={conf.url} style={{color:'#fff'}}>
        <marquee>{conf.text}</marquee>
      </a>
    </div>
  );
}
