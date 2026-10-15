import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { ApiKeyItem, ToneType, LLMProvider } from '../types';
import { ApiKeyManager } from './ApiKeyManager';
import { CustomProviderManager } from './CustomProviderManager';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { ToneCard } from '../components/ui/ToneCard';
import { Alert } from '../components/ui/Alert';
import { Check, Save } from 'lucide-react';

const TONES_LIST: Array<{ id: ToneType; title: string; desc: string; icon: string }> = [
  { id: 'polite', title: 'Lịch sự & Trang trọng', desc: 'Email đối tác, thư từ trang trọng', icon: '🎩' },
  { id: 'professional', title: 'Chuyên nghiệp & Công sở', desc: 'Báo cáo kỹ thuật, trao đổi công việc', icon: '💼' },
  { id: 'friendly', title: 'Thân thiện & Tự nhiên', desc: 'Trò chuyện đồng nghiệp, chat nhóm', icon: '🤝' },
  { id: 'concise', title: 'Ngắn gọn & Trực diện', desc: 'Rút ngắn câu từ, loại bỏ từ thừa', icon: '⚡' },
  { id: 'translate_explain', title: 'Dịch & Giải thích chi tiết', desc: 'Dịch 2 chiều kèm ngữ pháp & từ vựng', icon: '📖' },
];

const MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (Khuyên dùng - Nhanh & Tiết kiệm)' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Chất lượng cao)' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
];

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

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 font-sans">
      <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
          ✨
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Cấu hình EngChat AI</h1>
          <p className="text-xs text-slate-400 mt-0.5">Tối ưu hóa và dịch thuật tiếng Anh thông minh với Google Gemini</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-200">Nhà cung cấp AI (LLM Provider)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                provider === 'gemini'
                  ? 'bg-indigo-950/40 border-indigo-500/80 text-indigo-200 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="text-xl">✨</span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Google Gemini</span>
                <span className="text-[11px] text-slate-400">Gemini 3.5 Flash-Lite, Flash...</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProvider('openai_compatible')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                provider === 'openai_compatible'
                  ? 'bg-indigo-950/40 border-indigo-500/80 text-indigo-200 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="text-xl">🌐</span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Custom LLM (OpenAI Compatible)</span>
                <span className="text-[11px] text-slate-400">OpenAI, DeepSeek, Groq, Ollama...</span>
              </div>
            </button>
          </div>
        </div>

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

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-slate-200">Mô hình AI (Model)</h2>
              <div className="flex flex-col gap-2">
                {MODELS.map((m) => (
                  <label
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      model === m.id
                        ? 'bg-indigo-950/40 border-indigo-500/80 text-indigo-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={m.id}
                      checked={model === m.id}
                      onChange={() => setModel(m.id)}
                      className="accent-indigo-500"
                    />
                    <span className="text-xs font-medium">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
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

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-200">Văn phong mặc định</h2>
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
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
          <Switch
            label="Trích xuất ngữ cảnh chat (Chat Context Awareness)"
            description="Tự động thu thập các tin nhắn liền trước trong khung chat (Slack, Discord, Teams) để dịch chuẩn xưng hô và bối cảnh."
            checked={chatContext}
            onChange={setChatContext}
          />
          {chatContext && (
            <div className="pt-2 border-t border-slate-800/80">
              <Input
                label="Số lượng tin nhắn ngữ cảnh tối đa (1 - 10)"
                type="number"
                min={1}
                max={10}
                value={maxContext}
                onChange={(e) => setMaxContext(Math.max(1, Math.min(10, Number(e.target.value))))}
              />
            </div>
          )}
        </div>

        {saveSuccess && (
          <Alert variant="success" message="Cài đặt đã được lưu thành công vào trình duyệt!" />
        )}

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="lg"
            icon={saveSuccess ? <Check size={18} /> : <Save size={18} />}
            onClick={handleSave}
          >
            {saveSuccess ? 'Đã lưu' : 'Lưu Cài Đặt'}
          </Button>
        </div>
      </div>
    </div>
  );
};
