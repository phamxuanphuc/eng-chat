import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSettingsStore } from '../store/useSettingsStore';
import { callGeminiApi } from '../services/gemini';
import { ToneType } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { ToneCard } from '../components/ui/ToneCard';
import { Alert } from '../components/ui/Alert';
import { KeyRound, Sparkles, Check, Save } from 'lucide-react';

const TONES_LIST: Array<{ id: ToneType; title: string; desc: string; icon: string }> = [
  { id: 'polite', title: 'Lịch sự & Trang trọng', desc: 'Email đối tác, thư từ trang trọng', icon: '🎩' },
  { id: 'professional', title: 'Chuyên nghiệp & Công sở', desc: 'Báo cáo kỹ thuật, trao đổi công việc', icon: '💼' },
  { id: 'friendly', title: 'Thân thiện & Tự nhiên', desc: 'Trò chuyện đồng nghiệp, chat nhóm', icon: '🤝' },
  { id: 'concise', title: 'Ngắn gọn & Trực diện', desc: 'Rút ngắn câu từ, loại bỏ từ thừa', icon: '⚡' },
  { id: 'translate_explain', title: 'Dịch & Giải thích chi tiết', desc: 'Dịch 2 chiều kèm ngữ pháp & từ vựng', icon: '📖' },
];

const MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Khuyên dùng - Nhanh & Chuẩn)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Sâu sắc & Chi tiết)' },
];

export const App: React.FC = () => {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [tone, setTone] = useState<ToneType>('professional');
  const [chatContext, setChatContext] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.geminiApiKey || '');
      setModel(settings.selectedModel || 'gemini-2.0-flash');
      setTone(settings.defaultTone || 'professional');
      setChatContext(settings.enableChatContext ?? true);
    }
  }, [settings]);

  const testMutation = useMutation({
    mutationFn: async () => {
      return await callGeminiApi({
        apiKey,
        model,
        systemInstruction: 'You are a test helper. Reply with single word "OK".',
        prompt: 'Ping',
      });
    },
  });

  const handleSave = async () => {
    await updateSettings({
      geminiApiKey: apiKey,
      selectedModel: model,
      defaultTone: tone,
      enableChatContext: chatContext,
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
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <KeyRound size={16} className="text-indigo-400" /> Cấu hình Gemini API Key
          </h2>
          <Input
            label="Google Gemini API Key"
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles size={14} className="text-indigo-400" />}
              isLoading={testMutation.isPending}
              onClick={() => testMutation.mutate()}
            >
              Kiểm tra kết nối
            </Button>
          </div>
          {testMutation.isSuccess && (
            <Alert variant="success" message="Kết nối thành công! API Key hoạt động bình thường." />
          )}
          {testMutation.isError && (
            <Alert variant="error" message="Kiểm tra kết nối thất bại" description={testMutation.error?.message} />
          )}
        </div>

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
            description="Tự động thu thập 3-5 tin nhắn liền trước trong khung chat (Slack, Discord, Teams) để dịch chuẩn xưng hô và bối cảnh."
            checked={chatContext}
            onChange={setChatContext}
          />
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
