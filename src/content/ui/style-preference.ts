const STYLE_PREFERENCE_KEY = 'engchat_selected_style';

export const loadSelectedStyle = (): string => {
  try {
    return window.localStorage.getItem(STYLE_PREFERENCE_KEY) || 'Auto';
  } catch {
    return 'Auto';
  }
};

export const saveSelectedStyle = (style: string): void => {
  try {
    window.localStorage.setItem(STYLE_PREFERENCE_KEY, style);
    window.dispatchEvent(new CustomEvent('engchat-style-preference-changed', { detail: style }));
  } catch {}
};
