import React from 'react';
import { Badge } from '../components/ui/Badge';
import { Check, Sparkles, Zap, Shield, Cpu } from 'lucide-react';

export interface ModelOption {
  id: string;
  name: string;
  tag: string;
  tagVariant: 'success' | 'primary' | 'secondary' | 'warning';
  description: string;
  icon: React.ReactNode;
}

export const GEMINI_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    tag: 'Khuyên dùng - Siêu tốc',
    tagVariant: 'success',
    description: 'Độ trễ cực thấp, tiết kiệm quota, phản hồi tức thì cho chat & dịch thuật.',
    icon: <Zap size={16} className="text-emerald-400" />,
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tag: 'Chất lượng cao',
    tagVariant: 'primary',
    description: 'Khả năng suy luận ngữ cảnh sâu sắc, tra cứu từ vựng và diễn đạt chuẩn xác.',
    icon: <Sparkles size={16} className="text-indigo-400" />,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    tag: 'Ổn định',
    tagVariant: 'secondary',
    description: 'Phiên bản gọn nhẹ, ổn định cho nhu cầu viết email và tin nhắn hàng ngày.',
    icon: <Shield size={16} className="text-blue-400" />,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: 'Tiêu chuẩn',
    tagVariant: 'secondary',
    description: 'Thế hệ mô hình tiêu chuẩn với độ tin cậy và sự nhất quán cao.',
    icon: <Cpu size={16} className="text-slate-400" />,
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" /> Mô hình AI (Gemini Model)
        </h2>
        <Badge variant="primary" size="sm">
          {GEMINI_MODELS.find((m) => m.id === selectedModel)?.name || selectedModel}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GEMINI_MODELS.map((m) => {
          const isSelected = selectedModel === m.id;
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectModel(m.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectModel(m.id);
                }
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 text-left flex flex-col justify-between gap-2.5 relative ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-950/70 via-purple-950/40 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50 scale-[1.01]'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {m.icon}
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>
                    {m.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={m.tagVariant} size="sm">
                    {m.tag}
                  </Badge>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {m.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
