import React from 'react';
import { ItemStatus } from '../api/modules';
import './StatusBadge.css';

const icons: Record<ItemStatus, string> = {
  not_started: '🕒',
  in_progress: '🚧',
  need_help: '❗',
  to_validate: '📤',
  validated: '✅',
  auto_done: '✔️',
};

export default function StatusBadge({ status }: { status: ItemStatus }) {
  return <span className="status-badge">{icons[status]}</span>;
}
