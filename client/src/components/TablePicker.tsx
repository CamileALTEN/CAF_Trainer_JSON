import React, { useState } from 'react';

interface Props {
  /** callback(rows, cols) */
  onSelect: (r: number, c: number) => void;
}

const MAX = 10;

const TablePicker: React.FC<Props> = ({ onSelect }) => {
  const [hover, setHover] = useState<[number, number] | null>(null);

  return (
    <div className="table-picker shadow p-2 rounded bg-white border">
      {[...Array(MAX)].map((_, r) => (
        <div className="flex" key={r}>
          {[...Array(MAX)].map((_, c) => {
            const active = hover && r <= hover[0] && c <= hover[1];
            return (
              <div
                key={c}
                onMouseEnter={() => setHover([r, c])}
                onClick={() => onSelect(r + 1, c + 1)}
                className={`w-4 h-4 m-0.5 border ${active ? 'bg-indigo-400' : 'bg-gray-100'}`}
              />
            );
          })}
        </div>
      ))}
      <div className="text-xs mt-1 text-center text-gray-600">
        {hover ? `${hover[0] + 1} x ${hover[1] + 1}` : 'Choisir…'}
      </div>
    </div>
  );
};

export default TablePicker;
