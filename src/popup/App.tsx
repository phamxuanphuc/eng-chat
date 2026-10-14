import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSettingsStore } from '../store/useSettingsStore';
import { executeOptimize } from '../services/gemini';
import { ToneType, TranslateExplainResult } from '../types';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { ToneCard } from '../components/ui/ToneCard';
import { Alert } from '../components/ui/Alert';
import { Settings, Sparkles, Copy, Check, ArrowRight } from 'lucide-react';

const POPUP_TONES: Array<{ id: ToneType; title: string; icon: string }> = [
  { id: 'polite', title: 'Lịch sự', icon: '🎩' },
  { id: 'professional', title: 'Chuyên nghiệp', icon: '💼' },
  { id: 'friendly', title: 'Thân thiện', icon: '🤝' },
  { id: 'concise', title: 'Ngắn gọn', icon: '⚡' },
  { id: 'translate_explain', title: 'Dịch & Giải thích', icon: '📖' },
];

export const App: React.FC = () => {
  const { settings, fetchSettings } = useSettingsStore();
  const [inputText, setInputText] = useState('');
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings?.defaultTone) {
      setSelectedTone(settings.defaultTone);
    }
  }, [settings]);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      if (!inputText.trim()) throw new Error('Vui lòng nhập văn bản cần xử lý.');
      const res = await executeOptimize(
        { text: inputText, tone: selectedTone },
        settings
      );
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openOptions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  const resultData = optimizeMutation.data;
  const isExplain =
    resultData && typeof resultData === 'object' && 'translation' in resultData;
  const displayResult = isExplain
    ? (resultData as TranslateExplainResult).translation
    : (resultData as string) || '';

  return (
    <div className="w-[380px] p-4 flex flex-col gap-4 font-sans bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <span className="font-bold text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            EngChat AI
          </span>
        </div>
        <button
          type="button"
          onClick={openOptions}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Cài đặt"
        >
          <Settings size={16} />
        </button>
      </div>

      {!settings.geminiApiKey && (
        <Alert
          variant="warning"
          message="Chưa cấu hình API Key"
          description="Vui lòng bấm vào icon Cài đặt ở trên để thêm Gemini API Key."
        />
      )}

      <Textarea
        label="Nhập nội dung cần xử lý"
        placeholder="Gõ hoặc dán văn bản tiếng Việt/Anh..."
        rows={3}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-300">Chọn văn phong</span>
        <div className="grid grid-cols-2 gap-2">
          {POPUP_TONES.map((t) => (
            <ToneCard
              key={t.id}
              tone={t.id}
              title={t.title}
              description=""
              icon={t.icon}
              selected={selectedTone === t.id}
              onClick={setSelectedTone}
            />
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        icon={<Sparkles size={16} />}
        isLoading={optimizeMutation.isPending}
        disabled={!inputText.trim()}
        onClick={() => optimizeMutation.mutate()}
      >
        Tối Ưu Ngay
      </Button>

      {optimizeMutation.isError && (
        <Alert variant="error" message="Lỗi" description={optimizeMutation.error?.message} />
      )}

      {displayResult && (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
            <span>Kết quả:</span>
            <Button
              variant="ghost"
              size="sm"
              icon={copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              onClick={() => handleCopy(displayResult)}
            >
              {copied ? 'Đã sao chép' : 'Sao chép'}
            </Button>
          </div>
          <p className="text-slate-200 leading-relaxed max-h-36 overflow-y-auto selection:bg-indigo-500/30">
            {displayResult}
          </p>
        </div>
      )}
    </div>
  );
};
