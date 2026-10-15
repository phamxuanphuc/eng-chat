import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { ApiKeyItem, ToneType, LLMProvider } from '../types';
import { ApiKeyManager } from './ApiKeyManager';
import { CustomProviderManager } from './CustomProviderManager';
import { ProviderSelector } from './ProviderSelector';
import { ModelSelector } from './ModelSelector';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { ToneCard } from '../components/ui/ToneCard';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Check, Save, MessageSquare, Palette, Cpu, Sparkles } from 'lucide-react';

import { TONES_LIST } from '../constants/tones';

export const App: React.FC = () => {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();

  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [autoRotate, setAutoRotate] = useState(true);
  const [model, setModel] = useState('gemini-3.5-flash-lite');
  const [customBaseUrl, setCustomBaseUrl] = useState('https://api.openai.com/v1');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModel, setCustomModel] = useState('gpt-4o-mini');
  const [tone, setTone] = useState<ToneType>('professional');
  const [chatContext, setChatContext] = useState(true);
  const [maxContext, setMaxContext] = useState(4);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setProvider(settings.llmProvider || 'gemini');
      const keys = settings.apiKeys && settings.apiKeys.length > 0
        ? settings.apiKeys
        : settings.geminiApiKey
        ? [{ id: 'key-1', label: 'Khóa chính', key: settings.geminiApiKey }]
        : [];
      setApiKeys(keys);
      setAutoRotate(settings.autoRotateKeys ?? true);
      setModel(settings.selectedModel || 'gemini-3.5-flash-lite');
      setCustomBaseUrl(settings.customBaseUrl || 'https://api.openai.com/v1');
      setCustomApiKey(settings.customApiKey || '');
      setCustomModel(settings.customModel || 'gpt-4o-mini');
      setTone(settings.defaultTone || 'professional');
      setChatContext(settings.enableChatContext ?? true);
      setMaxContext(settings.maxContextMessages ?? 4);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({
      llmProvider: provider,
      geminiApiKey: apiKeys[0]?.key || '',
      apiKeys,
      autoRotateKeys: autoRotate,
      selectedModel: model,
      customBaseUrl,
      customApiKey,
      customModel,
      defaultTone: tone,
      enableChatContext: chatContext,
      maxContextMessages: Number(maxContext) || 4,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-lg shadow-md shadow-indigo-500/25">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                EngChat AI
              </h1>
              <Badge variant="primary" size="sm">Cài Đặt</Badge>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Trung tâm cấu hình AI & Tối ưu hoá tiếng Anh</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <Button variant="ghost" size="sm" icon={<Cpu size={13} />} onClick={() => scrollToSection('sec-ai')}>
              AI Provider
            </Button>
            <Button variant="ghost" size="sm" icon={<Palette size={13} />} onClick={() => scrollToSection('sec-tone')}>
              Văn phong
            </Button>
            <Button variant="ghost" size="sm" icon={<MessageSquare size={13} />} onClick={() => scrollToSection('sec-context')}>
              Ngữ cảnh
            </Button>
          </div>
          {saveSuccess && (
            <Badge variant="success" size="sm" icon={<Check size={12} />}>
              Đã lưu
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-6 flex flex-col gap-8">
        {saveSuccess && (
          <Alert variant="success" message="Cài đặt đã được lưu thành công vào trình duyệt!" />
        )}

        <section id="sec-ai" className="flex flex-col gap-6">
          <ProviderSelector provider={provider} onSelectProvider={setProvider} />

          {provider === 'gemini' ? (
            <>
              <ApiKeyManager
                apiKeys={apiKeys}
                onUpdateKeys={setApiKeys}
                autoRotate={autoRotate}
                onToggleAutoRotate={setAutoRotate}
                selectedModel={model}
                onSave={handleSave}
              />
              <ModelSelector selectedModel={model} onSelectModel={setModel} />
            </>
          ) : (
            <CustomProviderManager
              baseUrl={customBaseUrl}
              onUpdateBaseUrl={setCustomBaseUrl}
              apiKey={customApiKey}
              onUpdateApiKey={setCustomApiKey}
              model={customModel}
              onUpdateModel={setCustomModel}
              onSave={handleSave}
            />
          )}
        </section>

        <section id="sec-tone" className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> Văn phong mặc định
            </h2>
            <Badge variant="primary" size="sm">
              {TONES_LIST.find((t) => t.id === tone)?.title || tone}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Chọn văn phong mặc định áp dụng khi bôi đen text hoặc nhấn phím tắt tối ưu nhanh.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </section>

        <section id="sec-context" className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-400" /> Bối cảnh hội thoại (Chat Context)
            </h2>
            <Badge variant={chatContext ? 'success' : 'secondary'} size="sm">
              {chatContext ? 'Đang bật' : 'Đã tắt'}
            </Badge>
          </div>

          <Switch
            label="Trích xuất ngữ cảnh chat (Chat Context Awareness)"
            description="Tự động đọc tin nhắn liền trước trên Slack, Discord, MS Teams để dịch chuẩn xưng hô (anh/chị/em, bạn/tôi) theo vai trò công việc."
            checked={chatContext}
            onChange={setChatContext}
          />

          {chatContext && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-3">
              <Input
                label="Số lượng tin nhắn ngữ cảnh tối đa (1 - 10)"
                type="number"
                min={1}
                max={10}
                value={maxContext}
                onChange={(e) => setMaxContext(Math.max(1, Math.min(10, Number(e.target.value))))}
              />

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400">Chọn nhanh:</span>
                {[2, 4, 6, 8].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={maxContext === num ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setMaxContext(num)}
                  >
                    {num} tin
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-slate-800/80">
          <div className="flex flex-col text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Hoàn tất cấu hình</span>
            <span>Mọi thay đổi sẽ có hiệu lực ngay lập tức sau khi lưu.</span>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={saveSuccess ? <Check size={16} /> : <Save size={16} />}
            onClick={handleSave}
          >
            {saveSuccess ? 'Đã lưu' : 'Lưu Cài Đặt'}
          </Button>
        </div>
      </main>
    </div>
  );
};
