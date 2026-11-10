import React from 'react';
import { DiffPart } from '../../services/text-diff';

const STYLES: Record<DiffPart['type'], string> = {
  same: '',
  added: 'rounded-sm bg-emerald-500/15 text-emerald-200',
  removed: 'text-rose-400 line-through',
};

export const DiffView: React.FC<{ parts: DiffPart[] }> = ({ parts }) => (
  <>
    {parts.map((part, index) => (
      <span key={index} data-diff={part.type} className={STYLES[part.type]}>
        {part.text}
      </span>
    ))}
  </>
);
