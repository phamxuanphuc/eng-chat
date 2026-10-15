import React from 'react';
import { useOptions } from '../OptionsContext';
import { ToneCard } from '../../components/ui/ToneCard';
import { Badge } from '../../components/ui/Badge';
import { Sparkles } from 'lucide-react';
import { TONES_LIST } from '../../constants/tones';

export const TonePage: React.FC = () => {
  const { tone, setTone } = useOptions();

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-400" /> Văn phong mặc định
        </h2>
        <Badge variant="primary" size="sm">
          {TONES_LIST.find((t) => t.id === tone)?.title || tone}
        </Badge>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Chọn phong cách viết mặc định áp dụng khi bôi đen văn bản hoặc nhấn phím tắt tối ưu nhanh. Bạn vẫn có thể linh hoạt chuyển đổi phong cách trực tiếp từ menu popup bất cứ lúc nào.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {TONES_LIST.map((t) => (
          <ToneCard
            key={t.id}
            tone={t.id}
            title={t.title}
            description={t.desc}
            icon={t.icon}
            selected={tone === t.id}
            onClick={setTone}
          />
        ))}
      </div>
    </div>
  );
};
