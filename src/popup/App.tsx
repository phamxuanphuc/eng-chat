import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSettingsStore } from '../store/useSettingsStore';
import { executeOptimize } from '../services/gemini';
import { ToneType, TranslateExplainResult } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { ToneCard } from '../components/ui/ToneCard';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Settings, Sparkles, Copy, Check, ExternalLink, KeyRound } from 'lucide-react';

const POPUP_TONES: Array<{ id: ToneType; title: string; icon: string }> = [
  { id: 'polite', title: 'Lịch sự', icon: '🎩' },
  { id: 'professional', title: 'Chuyên nghiệp', icon: '💼' },
  { id: 'friendly', title: 'Thân thiện', icon: '🤝' },
  { id: 'concise', title: 'Ngắn gọn', icon: '⚡' },
  { id: 'translate_explain', title: 'Dịch & Giải thích', icon: '📖' },
];

export const App: React.FC = () => {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const [inputText, setInputText] = useState('');
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional');
  const [copied, setCopied] = useState(false);
  const [quickKey, setQuickKey] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings?.defaultTone) {
      setSelectedTone(settings.defaultTone);
    }
  }, [settings]);

  const handleSaveQuickKey = async () => {
    const trimmed = quickKey.trim();
    if (!trimmed) return;
    setSaveLoading(true);
    await updateSettings({
      geminiApiKey: trimmed,
      apiKeys: [{ id: 'key-1', label: 'Khóa chính', key: trimmed }],
    });
    setQuickKey('');
    setSaveLoading(false);
  };

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

  const isCustom = settings.llmProvider === 'openai_compatible';
  const validKeys = (settings.apiKeys || []).filter((k) => k.key?.trim());
  const keyCount = validKeys.length > 0 ? validKeys.length : settings.geminiApiKey?.trim() ? 1 : 0;
  const isCustomConfigured = Boolean(settings.customModel?.trim());

  const resultData = optimizeMutation.data;
  const isExplain =
    resultData && typeof resultData === 'object' && 'translation' in resultData;
  const displayResult = isExplain
    ? (resultData as TranslateExplainResult).translation
    : (resultData as string) || '';

  return (
    <div className="w-[380px] max-h-[580px] overflow-y-auto p-4 flex flex-col gap-4 font-sans bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/95 -mt-4 -mx-4 px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <span className="font-bold text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            EngChat AI
          </span>
          {isCustom ? (
            <Badge variant={isCustomConfigured ? 'success' : 'warning'} size="sm">
              {isCustomConfigured ? `Custom: ${settings.customModel}` : 'Chưa có Model'}
            </Badge>
          ) : (
            <Badge variant={keyCount > 0 ? 'success' : 'warning'} size="sm">
              {keyCount > 0 ? `${keyCount} Keys` : 'Chưa có Key'}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Settings size={15} />}
          onClick={openOptions}
          aria-label="Cài đặt"
        />
      </div>

      {!isCustom && keyCount === 0 && (
        <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <Alert
            variant="warning"
            message="Chưa cấu hình API Key"
            description="Dán Gemini API Key vào bên dưới để kích hoạt tiện ích ngay."
          />
          <div className="flex gap-2 items-center">
            <div className="flex-1 min-w-0">
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={quickKey}
                onChange={(e) => setQuickKey(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<KeyRound size={13} />}
              disabled={!quickKey.trim()}
              isLoading={saveLoading}
              onClick={handleSaveQuickKey}
            >
              Lưu Key
            </Button>
          </div>
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span>Chưa có Google AI Token?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <span>Lấy token miễn phí</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
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
