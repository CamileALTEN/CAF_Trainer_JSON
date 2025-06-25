import React from 'react';
import { Info } from 'lucide-react';
import './InfoTooltip.css';

interface Props {
  children: React.ReactNode;
  size?: number;
}

const InfoTooltip: React.FC<Props> = ({ children, size = 16 }) => (
  <span className="info-tooltip">
    <Info size={size} />
    <div className="tooltip">{children}</div>
  </span>
);

export default InfoTooltip;
