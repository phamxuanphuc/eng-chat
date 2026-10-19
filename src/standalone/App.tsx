import React, { useState, useEffect, useRef } from 'react';
import { App as OptionsApp } from '../options/App';
import { App as PopupApp } from '../popup/App';
import { TranslatePopup } from '../content/ui/TranslatePopup';
import { FloatingToolbar } from '../content/ui/FloatingToolbar';
import { extractChatContext } from '../content/chat-extractor';
import { replaceTextInElement } from '../content/dom-utils';
import { executeOptimize } from '../services/gemini';
import { loadSettings } from '../services/storage';
import { useSettingsStore } from '../store/useSettingsStore';
import { getTranslator } from '../i18n';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { Settings, Monitor, MessageSquare, Sun, Moon, Sparkles } from 'lucide-react';
import { ToneType, RewriteOptions, DEFAULT_REWRITE_OPTIONS } from '../types';

export const StandaloneApp: React.FC = () => {
  const language = useSettingsStore((state) => state.settings.language);
  const t = getTranslator(language);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<'playground' | 'options' | 'popup'>('playground');
  const [chatInput, setChatInput] = useState('I agree with this approach; please implement it soon.');
  const [selectedSnippet, setSelectedSnippet] = useState('');
  const [rewriteOptions, setRewriteOptions] = useState<RewriteOptions>(DEFAULT_REWRITE_OPTIONS);
  const [toolbar, setToolbar] = useState({ visible: false, x: 0, y: 0, isLoading: false });
  const [tooltipState, setTooltipState] = useState<{
    isOpen: boolean; mode?: 'translate' | 'rewrite' | 'improve' | 'summary'; isLoading: boolean; result?: any; error?: string | null;
  }>({ isOpen: false, mode: 'translate', isLoading: false });
  const tooltipRef = useRef(tooltipState);
  tooltipRef.current = tooltipState;

  const activeText = selectedSnippet || chatInput;

  useEffect(() => { useSettingsStore.getState().fetchSettings(); }, []);

  const checkSelection = () => {
    if (tooltipRef.current.isOpen) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim()) {
      setSelectedSnippet(sel.toString().trim());
      let rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        const rects = sel.getRangeAt(0).getClientRects();
        if (rects.length > 0) rect = rects[0];
      }
      if (rect.width > 0 && rect.height > 0) {
        setToolbar({ visible: true, x: Math.round(rect.left + rect.width / 2 - 100), y: Math.round(rect.bottom + 8), isLoading: false });
        return;
      }
    }
    const inputEl = document.getElementById('standalone-chat-input') as HTMLInputElement | null;
    if (inputEl && inputEl.selectionStart !== inputEl.selectionEnd) {
      const s = inputEl.value.slice(inputEl.selectionStart || 0, inputEl.selectionEnd || 0).trim();
      if (s) {
        setSelectedSnippet(s);
        const rect = inputEl.getBoundingClientRect();
        setToolbar({ visible: true, x: Math.round(rect.left + rect.width / 2 - 100), y: Math.round(rect.bottom + 8), isLoading: false });
      }
    }
  };

  useEffect(() => {
    const isInsideOverlay = (e: MouseEvent): boolean => {
      const path = e.composedPath ? e.composedPath() : [];
      return path.some((el) => {
        if (!(el instanceof HTMLElement)) return false;
        const role = el.getAttribute('role');
        return role === 'toolbar' || role === 'dialog' || !!el.closest?.('[role="toolbar"], [role="dialog"]');
      });
    };
    const onMouseDown = (e: MouseEvent) => {
      if (isInsideOverlay(e)) return;
      setToolbar((p) => ({ ...p, visible: false }));
      if (tooltipRef.current.isOpen) setTooltipState((p) => ({ ...p, isOpen: false }));
    };
    const onMouseUp = (e: MouseEvent) => { if (!isInsideOverlay(e)) setTimeout(checkSelection, 15); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    return () => { document.removeEventListener('mousedown', onMouseDown); document.removeEventListener('mouseup', onMouseUp); };
  }, []);

  const runOptimize = async (tone: ToneType, forcedMode?: 'translate' | 'rewrite' | 'improve' | 'summary') => {
    const isModal = forcedMode === 'improve' || forcedMode === 'rewrite' || forcedMode === 'translate' || forcedMode === 'summary' || tone === 'translate_explain' || tone === 'summarize';
    const mode = forcedMode || (tone === 'translate_explain' ? 'translate' : tone === 'summarize' ? 'summary' : 'rewrite');

    if (isModal) {
      setToolbar((prev) => ({ ...prev, visible: false }));
      setTooltipState({ isOpen: true, mode, isLoading: true });
    }
    try {
      const inputEl = document.getElementById('standalone-chat-input') as HTMLInputElement | null;
      const context = extractChatContext(inputEl, 4);
      const settings = await loadSettings();
      const response = await executeOptimize({ text: activeText, tone, contextMessages: context }, settings);

      if (response.success && response.data) {
        if (!isModal && inputEl) {
          const textToInsert = typeof response.data === 'string' ? response.data : response.data.translation;
          replaceTextInElement(inputEl, textToInsert);
          setChatInput(inputEl.value);
        } else {
          setTooltipState({ isOpen: true, mode, isLoading: false, result: response.data });
        }
      } else {
        setTooltipState({ isOpen: true, mode, isLoading: false, error: response.error || t('standalone.processingError') });
      }
    } catch (err: any) {
      setTooltipState({ isOpen: true, mode, isLoading: false, error: err?.message || t('standalone.unexpectedError') });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="font-bold text-base bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">{t('standalone.title')}</h1>
            <p className="text-xs text-slate-400">{t('standalone.subtitle')}</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <Button variant={activeTab === 'playground' ? 'primary' : 'ghost'} size="sm" icon={<Monitor size={14} />} onClick={() => setActiveTab('playground')}>{t('standalone.playground')}</Button>
          <Button variant={activeTab === 'options' ? 'primary' : 'ghost'} size="sm" icon={<Settings size={14} />} onClick={() => setActiveTab('options')}>{t('standalone.settings')}</Button>
          <Button variant={activeTab === 'popup' ? 'primary' : 'ghost'} size="sm" icon={<MessageSquare size={14} />} onClick={() => setActiveTab('popup')}>{t('standalone.popup')}</Button>
          <Button variant="ghost" size="sm" icon={theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? t('standalone.light') : t('standalone.dark')}</Button>
        </nav>
      </header>

      <main className={`flex-1 ${activeTab === 'options' ? 'p-0 w-full' : 'p-6 max-w-5xl mx-auto w-full'}`}>
        {activeTab === 'options' && <OptionsApp />}
        {activeTab === 'popup' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="border border-slate-800 rounded-2xl shadow-2xl overflow-hidden bg-slate-950 ring-1 ring-slate-800"><PopupApp /></div>
          </div>
        )}
        {activeTab === 'playground' && (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between">
              <span>{t('standalone.tryExtraction')}</span><span className="font-semibold">{t('standalone.tip')}</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-slate-200">{t('standalone.channel')}</h2>
              <div role="log" className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800/80 max-h-64 overflow-y-auto">
                {[
                  { sender: t('standalone.sarah'), color: 'text-indigo-400', text: t('standalone.sarahMessage') },
                  { sender: t('standalone.david'), color: 'text-purple-400', text: t('standalone.davidMessage') },
                  { sender: t('standalone.alex'), color: 'text-pink-400', text: t('standalone.alexMessage') },
                ].map((m, i) => (
                  <div key={i} className="c-message__body flex flex-col text-xs"><span className={`font-semibold ${m.color}`}>{m.sender}:</span><span className="text-slate-300 mt-0.5">{m.text}</span></div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="text-xs font-medium text-slate-300" htmlFor="standalone-chat-input">{t('standalone.compose')}</label>
                <input
                  id="standalone-chat-input"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onSelect={checkSelection}
                  onFocus={(e) => {
                    if (tooltipRef.current.isOpen) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setToolbar({ visible: true, x: Math.round(rect.left + rect.width / 2 - 90), y: Math.round(rect.bottom + 8), isLoading: false });
                  }}
                  className="w-full rounded-xl bg-slate-950 text-slate-100 px-4 py-3 text-sm border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400 mr-2">{t('standalone.quickActions')}</span>
                <Button variant="secondary" size="sm" onClick={() => runOptimize('polite')}>🎩 {t('standalone.polite')}</Button>
                <Button variant="secondary" size="sm" onClick={() => runOptimize('professional')}>💼 {t('standalone.professional')}</Button>
                <Button variant="secondary" size="sm" onClick={() => runOptimize('concise')}>⚡ {t('standalone.concise')}</Button>
                <Button variant="primary" size="sm" icon={<Sparkles size={14} />} onClick={() => runOptimize('translate_explain')}>📖 {t('standalone.translateExplain')}</Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <FloatingToolbar
        language={language}
        theme={theme}
        visible={toolbar.visible && !tooltipState.isOpen}
        x={toolbar.x}
        y={toolbar.y}
        isLoading={toolbar.isLoading}
        isEditable={true}
        onSelectTone={async (tone, mode) => {
          setToolbar((prev) => ({ ...prev, isLoading: true, visible: false }));
          await runOptimize(tone, mode);
          setToolbar((prev) => ({ ...prev, isLoading: false, visible: false }));
        }}
        onClose={() => setToolbar((prev) => ({ ...prev, visible: false }))}
      />

      {tooltipState.isOpen && (
        <TranslatePopup
          language={language}
          theme={theme}
          mode={tooltipState.mode}
          originalText={activeText}
          isLoading={tooltipState.isLoading}
          error={tooltipState.error}
          result={tooltipState.result}
          hasEditableTarget={true}
          rewriteOptions={rewriteOptions}
          onRewriteOptionsChange={async (opts) => {
            setRewriteOptions(opts);
            setTooltipState((p) => ({ ...p, isLoading: true }));
            const parts = [opts.length !== 'Auto' && `Length: ${opts.length}`, opts.formality !== 'Auto' && `Formality: ${opts.formality}`, opts.format !== 'Auto' && `Format: ${opts.format}`, opts.tone !== 'Auto' && `Tone: ${opts.tone}`].filter(Boolean).join(', ');
            const res = await executeOptimize({ text: parts ? `Original text: "${activeText}"\nRewrite requirements: ${parts}.` : activeText, tone: 'professional' }, await loadSettings());
            setTooltipState((p) => ({ ...p, isLoading: false, result: res.data, error: res.error }));
          }}
          onModeChange={(m) => runOptimize(m === 'translate' ? 'translate_explain' : m === 'summary' ? 'summarize' : 'professional', m)}
          onFollowUp={async (query) => {
            setTooltipState((p) => ({ ...p, isLoading: true }));
            const res = await executeOptimize({ text: activeText, tone: tooltipState.mode === 'translate' ? 'translate_explain' : tooltipState.mode === 'summary' ? 'summarize' : 'professional', taskInstruction: query }, await loadSettings());
            setTooltipState({ isOpen: true, mode: tooltipState.mode, isLoading: false, result: res.data, error: res.error });
          }}
          onRegenerate={() => runOptimize(tooltipState.mode === 'translate' ? 'translate_explain' : tooltipState.mode === 'summary' ? 'summarize' : 'professional', tooltipState.mode)}
          onLanguageChange={async (lang) => {
            setTooltipState((p) => ({ ...p, isLoading: true }));
            const res = await executeOptimize({ text: activeText, targetLanguage: lang, tone: tooltipState.mode === 'translate' ? 'translate_explain' : tooltipState.mode === 'summary' ? 'summarize' : 'professional' }, await loadSettings());
            setTooltipState((p) => ({ ...p, isLoading: false, result: res.data, error: res.error }));
          }}
          onInsert={(text) => {
            const inputEl = document.getElementById('standalone-chat-input') as HTMLInputElement | null;
            if (inputEl) { replaceTextInElement(inputEl, text); setChatInput(inputEl.value); } else setChatInput(text);
            setTooltipState({ isOpen: false, isLoading: false });
          }}
          onClose={() => setTooltipState({ isOpen: false, isLoading: false })}
          onTranslateVi={async (text) => {
            const res = await executeOptimize({ text: `Translate into natural Vietnamese:\n"${text}"`, tone: 'concise' }, await loadSettings());
            return res.success && res.data ? (typeof res.data === 'string' ? res.data : res.data.translation) : '';
          }}
        />
      )}
    </div>
  );
};
