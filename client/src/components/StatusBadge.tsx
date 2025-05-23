import React from 'react';
import { ItemStatus } from '../api/modules';
import './StatusBadge.css';

const labels: Record<ItemStatus, string> = {
  not_started: '🕒 Non commencé',
  in_progress: '🚧 En cours',
  need_help: '❗ Besoin d\'aide',
  to_validate: '📤 À valider',
  validated: '✅ Validé',
  auto_done: '✔️ Terminé (auto)',
};

interface Props {
  status: ItemStatus;
  onChange?: (s: ItemStatus) => void;
}

export default function StatusBadge({ status, onChange }: Props) {
  return (
    <span className="status-badge">
      {labels[status]}
      {onChange && (
        <select
          value={status}
          onChange={(e) => onChange(e.target.value as ItemStatus)}
          className="status-select"
        >
          {Object.entries(labels).map(([k, lab]) => (
            <option key={k} value={k}>
              {lab}
            </option>
          ))}
        </select>
      )}
    </span>
  );
}
