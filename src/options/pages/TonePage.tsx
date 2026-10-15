import React from 'react';
import { useOptions } from '../OptionsContext';
import { ToneCard } from '../../components/ui/ToneCard';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Sparkles } from 'lucide-react';
import { TONES_LIST } from '../../constants/tones';

export const TonePage: React.FC = () => {
  const { tone, setTone, tonePrompts, setTonePrompt } = useOptions();
  const selectedTone = TONES_LIST.find((item) => item.id === tone);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-400" /> Default writing style
        </h2>
        <Badge variant="primary" size="sm">
          {selectedTone?.title || tone}
        </Badge>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Choose the default writing style used when optimizing selected text or using the quick shortcut. You can still switch styles from the popup menu at any time.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {TONES_LIST.map((item) => (
          <ToneCard
            key={item.id}
            tone={item.id}
            title={item.title}
            description={item.desc}
            icon={item.icon}
            selected={tone === item.id}
            onClick={setTone}
          />
        ))}
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
        <Textarea
          label={`Custom prompt for ${selectedTone?.title || tone}`}
          value={tonePrompts[tone] || ''}
          onChange={(event) => setTonePrompt(event.target.value)}
          placeholder="Add instructions for this writing style, such as audience, voice, or terminology preferences."
          rows={5}
        />
        <p className="text-xs text-slate-500">
          This instruction is appended only for the selected style and is saved with the other settings.
        </p>
      </div>
    </div>
  );
};
