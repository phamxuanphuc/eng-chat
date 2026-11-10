import React from 'react';
import { Chip } from '../components/ui/Chip';
import { CUSTOM_PROVIDER_PRESETS, ProviderPreset } from '../services/openai';

interface ProviderPresetsProps {
  label: string;
  baseUrl: string;
  onPick: (preset: ProviderPreset) => void;
}

const normalizeUrl = (url: string): string => url.trim().replace(/\/+$/, '');

export const ProviderPresets: React.FC<ProviderPresetsProps> = ({ label, baseUrl, onPick }) => (
  <div className="flex flex-col gap-1.5" role="group" aria-label={label}>
    <span className="text-xs font-medium text-slate-300">{label}</span>
    <div className="flex flex-wrap gap-1.5">
      {CUSTOM_PROVIDER_PRESETS.map((preset) => (
        <Chip
          key={preset.id}
          selected={normalizeUrl(baseUrl) === normalizeUrl(preset.baseUrl)}
          onClick={() => onPick(preset)}
        >
          {preset.name}
        </Chip>
      ))}
    </div>
  </div>
);
