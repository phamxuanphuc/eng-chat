import React, { useState } from 'react';
import { App as OptionsApp } from '../options/App';
import { App as PopupApp } from '../popup/App';
import { TranslatePopup } from '../content/ui/TranslatePopup';
import { FloatingToolbar } from '../content/ui/FloatingToolbar';
import { extractChatContext } from '../content/chat-extractor';
import { replaceTextInElement } from '../content/dom-utils';
import { executeOptimize } from '../services/gemini';
import { loadSettings } from '../services/storage';
import { ToneType } from '../types';
import { Button } from '../components/ui/Button';
import { Sparkles, Settings, Monitor, MessageSquare } from 'lucide-react';

export const StandaloneApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playground' | 'options' | 'popup'>('playground');
  const [chatInput, setChatInput] = useState('Tôi đồng ý với phương án này, hãy triển khai sớm nhé');
  const [toolbar, setToolbar] = useState<{
    visible: boolean;
    x: number;
    y: number;
    isLoading: boolean;
  }>({ visible: false, x: 0, y: 0, isLoading: false });
  const [tooltipState, setTooltipState] = useState<{
    isOpen: boolean;
    mode?: 'translate' | 'rewrite';
    isLoading: boolean;
    result?: any;
    error?: string | null;
  }>({ isOpen: false, mode: 'translate', isLoading: false });

  const runOptimize = async (tone: ToneType, forcedMode?: 'translate' | 'rewrite') => {
    const isModal = forcedMode === 'rewrite' || forcedMode === 'translate' || tone === 'translate_explain';
    const mode = forcedMode || (tone === 'translate_explain' ? 'translate' : 'rewrite');

    if (isModal) {
      setTooltipState({ isOpen: true, mode, isLoading: true });
    }
    try {
      const inputEl = document.getElementById('standalone-chat-input') as HTMLElement;
      const context = extractChatContext(inputEl, 4);
      const settings = await loadSettings();

      const response = await executeOptimize(
        { text: chatInput, tone, contextMessages: context },
        settings
      );

      if (response.success && response.data) {
        if (!isModal && inputEl) {
          const textToInsert =
            typeof response.data === 'string'
              ? response.data
              : response.data.translation;
          replaceTextInElement(inputEl, textToInsert);
          setChatInput(textToInsert);
        } else {
          setTooltipState({ isOpen: true, mode, isLoading: false, result: response.data });
        }
      } else {
        setTooltipState({
          isOpen: true,
          mode,
          isLoading: false,
          error: response.error || 'Lỗi xử lý',
        });
      }
    } catch (err: any) {
      setTooltipState({
        isOpen: true,
        mode,
        isLoading: false,
        error: err?.message || 'Có lỗi xảy ra',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <h1 className="font-bold text-base bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              EngChat AI - Standalone Testbed
            </h1>
            <p className="text-xs text-slate-400">Môi trường thử nghiệm trực tiếp & kiểm thử E2E</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <Button
            variant={activeTab === 'playground' ? 'primary' : 'ghost'}
            size="sm"
            icon={<Monitor size={14} />}
            onClick={() => setActiveTab('playground')}
          >
            Trang Thử Nghiệm
          </Button>
          <Button
            variant={activeTab === 'options' ? 'primary' : 'ghost'}
            size="sm"
            icon={<Settings size={14} />}
            onClick={() => setActiveTab('options')}
          >
            Cài Đặt (Options)
          </Button>
          <Button
            variant={activeTab === 'popup' ? 'primary' : 'ghost'}
            size="sm"
            icon={<MessageSquare size={14} />}
            onClick={() => setActiveTab('popup')}
          >
            Cửa Sổ Popup
          </Button>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {activeTab === 'options' && <OptionsApp />}

        {activeTab === 'popup' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="border border-slate-800 rounded-2xl shadow-2xl overflow-hidden bg-slate-950 ring-1 ring-slate-800">
              <PopupApp />
            </div>
          </div>
        )}

        {activeTab === 'playground' && (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between">
              <span>💡 Thử nghiệm tính năng trích xuất đoạn chat (Slack/Discord) và ghi đè tự động.</span>
              <span className="font-semibold">Mẹo: Cấu hình API Key trong tab Cài đặt để gọi AI trực tiếp!</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-slate-200">Kênh Trao Đổi Dự Án (#general-chat)</h2>
              <div role="log" className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800/80 max-h-64 overflow-y-auto">
                <div className="c-message__body flex flex-col text-xs">
                  <span className="font-semibold text-indigo-400">Sarah (Product Manager):</span>
                  <span className="text-slate-300 mt-0.5">Hi team, please review the PRD for the upcoming release.</span>
                </div>
                <div className="c-message__body flex flex-col text-xs">
                  <span className="font-semibold text-purple-400">David (Tech Lead):</span>
                  <span className="text-slate-300 mt-0.5">The architecture proposal is ready. Are there any blockers?</span>
                </div>
                <div className="c-message__body flex flex-col text-xs">
                  <span className="font-semibold text-pink-400">Alex (Designer):</span>
                  <span className="text-slate-300 mt-0.5">The Uiverse Galaxy components look clean. Please proceed.</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="text-xs font-medium text-slate-300" htmlFor="standalone-chat-input">
                  Soạn tin nhắn phản hồi:
                </label>
                <input
                  id="standalone-chat-input"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onFocus={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setToolbar({
                      visible: true,
                      x: Math.round(rect.left + rect.width / 2 - 90),
                      y: Math.round(rect.bottom + 8),
                      isLoading: false,
                    });
                  }}
                  className="w-full rounded-xl bg-slate-950 text-slate-100 px-4 py-3 text-sm border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400 mr-2">Thao tác nhanh:</span>
                <Button variant="secondary" size="sm" onClick={() => runOptimize('polite')}>
                  🎩 Lịch sự
                </Button>
                <Button variant="secondary" size="sm" onClick={() => runOptimize('professional')}>
                  💼 Chuyên nghiệp
                </Button>
                <Button variant="secondary" size="sm" onClick={() => runOptimize('concise')}>
                  ⚡ Ngắn gọn
                </Button>
                <Button variant="primary" size="sm" icon={<Sparkles size={14} />} onClick={() => runOptimize('translate_explain')}>
                  📖 Dịch & Giải thích
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <FloatingToolbar
        visible={toolbar.visible}
        x={toolbar.x}
        y={toolbar.y}
        isLoading={toolbar.isLoading}
        onSelectTone={async (tone, mode) => {
          setToolbar((prev) => ({ ...prev, isLoading: true }));
          await runOptimize(tone, mode);
          setToolbar((prev) => ({ ...prev, isLoading: false, visible: false }));
        }}
        onClose={() => setToolbar((prev) => ({ ...prev, visible: false }))}
      />

      {tooltipState.isOpen && (
        <TranslatePopup
          mode={tooltipState.mode}
          originalText={chatInput}
          isLoading={tooltipState.isLoading}
          error={tooltipState.error}
          result={tooltipState.result}
          hasEditableTarget={true}
          onModeChange={(m) => runOptimize(m === 'rewrite' ? 'professional' : 'translate_explain', m)}
          onFollowUp={async (query) => {
            setTooltipState((p) => ({ ...p, isLoading: true }));
            const prompt = `Văn bản gốc: "${chatInput}"\n\nYêu cầu: ${query}`;
            const settings = await loadSettings();
            const tone: ToneType = tooltipState.mode === 'rewrite' ? 'professional' : 'translate_explain';
            const res = await executeOptimize({ text: prompt, tone }, settings);
            setTooltipState({ isOpen: true, mode: tooltipState.mode, isLoading: false, result: res.data, error: res.error });
          }}
          onRegenerate={() => runOptimize(tooltipState.mode === 'rewrite' ? 'professional' : 'translate_explain', tooltipState.mode)}
          onInsert={(text) => {
            setChatInput(text);
            setTooltipState({ isOpen: false, isLoading: false });
          }}
          onClose={() => setTooltipState({ isOpen: false, isLoading: false })}
        />
      )}
    </div>
  );
};
