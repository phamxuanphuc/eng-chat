import { AppSettings, OptimizeRequest, OptimizeResponse, RewriteOptions, ToneType } from '../types';
import { getRuntimeErrorMessage, sendRuntimeMessage } from '../services/extension-messaging';
import { extractChatContext } from './chat-extractor';
import { getSelectedText, getSelectionRect, isSensitiveField } from './dom-utils';
import { applyEdit, captureEditSnapshot, resolveEditTarget } from './edit-target';
import type { PopupAnchor } from './ui/popup-position';
import { PopupMode, saveTargetLanguages } from './target-languages';
import { patchToolbar, patchTooltip, render, resultText, state, toneForMode, translator } from './content-state';

const execute = (payload: OptimizeRequest): Promise<OptimizeResponse> =>
  sendRuntimeMessage<OptimizeResponse>({ action: 'EXECUTE_GEMINI', payload });

const connectionError = (error: unknown): string =>
  getRuntimeErrorMessage(error, translator()('content.connectionError'), state.language);

const rewriteOptionsFor = (mode: PopupMode): RewriteOptions | undefined =>
  mode === 'translate' || mode === 'summary' ? undefined : state.tooltip.rewriteOptions;

export const closeTooltip = (): void => {
  state.requestId += 1;
  patchTooltip({ visible: false, isLoading: false });
  render();
};

export const translateToVietnamese = async (text: string): Promise<string> => {
  const response = await execute({ text, tone: 'translate_explain', targetLanguage: 'Vietnamese', translateOnly: true });
  return response.success ? resultText(response.data) : '';
};

const computeAnchor = (): PopupAnchor | null => {
  let rect = getSelectionRect();
  const editable = state.editableEl?.getBoundingClientRect();
  if (!rect && editable && editable.width > 0 && editable.height > 0) rect = editable;
  return rect ? { x: rect.left, y: rect.bottom + 8, top: rect.top } : null;
};

const showNotice = (message: string): void => {
  state.requestId += 1;
  state.editSnapshot = null;
  patchToolbar({ visible: false, isLoading: false });
  patchTooltip({ visible: true, isLoading: false, error: message, result: null, originalText: '', hasEditableTarget: false, anchor: null });
  render();
};

export const triggerOptimize = async (
  tone: ToneType,
  settings?: AppSettings,
  customText?: string,
  forcedMode?: PopupMode
): Promise<void> => {
  if (!customText) {
    if (isSensitiveField(document.activeElement)) {
      showNotice(translator()('content.sensitiveField'));
      return;
    }
    state.editableEl = resolveEditTarget(state.editableEl);
    state.editSnapshot = state.editableEl ? captureEditSnapshot(state.editableEl) : null;
  }
  const activeEl = state.editSnapshot?.element ?? null;
  const targetText = customText || getSelectedText();

  if (!targetText) {
    showNotice(translator()('content.selectText'));
    return;
  }

  const showsResult = !!forcedMode || tone === 'translate_explain' || tone === 'summarize';
  const mode: PopupMode = forcedMode || (tone === 'translate_explain' ? 'translate' : tone === 'summarize' ? 'summary' : 'rewrite');
  const targetLanguage = state.targetLanguages[mode];
  const shown = { visible: true, mode, originalText: targetText, isLoading: false, hasEditableTarget: !!activeEl };
  const anchor = customText ? state.tooltip.anchor ?? null : computeAnchor();

  patchTooltip({ ...shown, targetLanguage, anchor, isLoading: true, error: null });
  patchToolbar({ visible: false });
  render();
  const requestId = ++state.requestId;

  const effectiveSettings = settings || state.settings;
  const contextMessages = effectiveSettings?.enableChatContext === false
    ? []
    : extractChatContext(activeEl, effectiveSettings?.maxContextMessages || 4);

  try {
    const response = await execute({ text: targetText, tone, mode, contextMessages, rewriteOptions: rewriteOptionsFor(mode), targetLanguage });
    if (requestId !== state.requestId) return;
    patchToolbar({ isLoading: false, visible: false });

    if (!response.success || !response.data) {
      patchTooltip({ ...shown, error: response.error || translator()('content.genericError'), result: null });
    } else if (showsResult || !state.editSnapshot || !applyEdit(state.editSnapshot, resultText(response.data))) {
      patchTooltip({ ...shown, result: response.data, error: null });
    } else {
      patchTooltip({ visible: false, isLoading: false });
    }
    render();
  } catch (error) {
    if (requestId !== state.requestId) return;
    patchToolbar({ isLoading: false, visible: false });
    patchTooltip({ ...shown, error: connectionError(error), result: null });
    render();
  }
};

export const regenerate = (): void => {
  const { originalText, mode } = state.tooltip;
  if (originalText) void triggerOptimize(toneForMode(mode), undefined, originalText, mode);
};

export const changeMode = (mode: PopupMode): void => {
  if (!state.tooltip.originalText) {
    patchTooltip({ mode });
    render();
    return;
  }
  void triggerOptimize(toneForMode(mode), undefined, state.tooltip.originalText, mode);
};

export const followUp = async (query: string, refine = false): Promise<void> => {
  const { originalText, mode, result } = state.tooltip;
  if (!originalText) return;
  patchTooltip({ isLoading: true, error: null });
  render();
  const requestId = ++state.requestId;

  try {
    const response = await execute({
      text: originalText,
      tone: toneForMode(mode),
      mode,
      rewriteOptions: rewriteOptionsFor(mode),
      taskInstruction: query,
      previousResult: refine ? resultText(result) || undefined : undefined,
      targetLanguage: state.targetLanguages[mode],
    });
    if (requestId !== state.requestId) return;
    patchTooltip(response.success
      ? { isLoading: false, result: response.data, error: null }
      : { isLoading: false, result: null, error: response.error || translator()('content.genericError') });
    render();
  } catch (error) {
    if (requestId !== state.requestId) return;
    patchTooltip({ isLoading: false, error: connectionError(error) });
    render();
  }
};

export const changeTargetLanguage = (language: string): void => {
  state.targetLanguages = { ...state.targetLanguages, [state.tooltip.mode]: language };
  void saveTargetLanguages(state.targetLanguages);
  patchTooltip({ targetLanguage: language });
  render();
  regenerate();
};

export const changeRewriteOptions = async (options: RewriteOptions): Promise<void> => {
  patchTooltip({ rewriteOptions: options });
  render();
  if (!state.tooltip.originalText) return;
  const parts = [
    options.length !== 'Auto' && `Length: ${options.length}`,
    options.formality !== 'Auto' && `Formality: ${options.formality}`,
    options.format !== 'Auto' && `Format: ${options.format}`,
    options.tone !== 'Auto' && `Tone: ${options.tone}`,
  ].filter(Boolean).join(', ');
  await followUp(parts ? `Apply these selected options while rewriting the text: ${parts}.` : 'Rewrite naturally.');
};
