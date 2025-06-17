import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAlertConfig, saveAlertConfig, IAlertConfig } from '../api/alert';
import { getModules } from '../api/modules';
import { flatten } from '../utils/items';
import './AlertBanner.css';

export default function AlertBanner() {
  const { user } = useAuth();
  const location = useLocation();
  const [conf, setConf] = useState<IAlertConfig | null>(null);
  const [outCount, setOutCount] = useState(0);

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

  useEffect(() => {
    getModules()
      .then(ms => {
        let c = 0;
        ms.forEach(m => {
          flatten(m.items).forEach(it => { if (it.outdatedInfo) c++; });
        });
        setOutCount(c);
      })
      .catch(() => setOutCount(0));
  }, [location, conf]);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;
  if (!conf) return null;

  const banners: {key:string; text:string; url?:string; className?:string}[] = [];
  if (conf.active) banners.push({ key:'time', text: conf.text, url: conf.url });
  if (outCount >= (conf.maxOutdated ?? 5)) banners.push({ key:'out', text: 'Trop d\'items ne sont pas à jour', className:'violet' });

  if (!banners.length) return null;

  return (
    <>
      {banners.map((b,i)=>(
        <div key={b.key} className={`alert-banner ${b.className||''}`} style={{ top: 75 + i*40 }}>
          {b.url ? (
            <a href={b.url} target="_blank" rel="noopener noreferrer">
              <marquee>{b.text}</marquee>
            </a>
          ) : (
            <marquee>{b.text}</marquee>
          )}
        </div>
      ))}
    </>
  );
}
