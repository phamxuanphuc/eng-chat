export type ThemeMode = 'light' | 'dark';

export const detectPageTheme = (): ThemeMode => {
  try {
    const html = document.documentElement;
    const body = document.body;

    const htmlClasses = (html.className || '').toLowerCase();
    const bodyClasses = (body?.className || '').toLowerCase();
    const dataTheme = (
      html.getAttribute('data-theme') ||
      body?.getAttribute('data-theme') ||
      html.getAttribute('data-color-mode') ||
      body?.getAttribute('data-color-mode') ||
      ''
    ).toLowerCase();

    if (dataTheme === 'dark' || htmlClasses.includes('dark') || bodyClasses.includes('dark')) {
      return 'dark';
    }
    if (dataTheme === 'light' || htmlClasses.includes('light') || bodyClasses.includes('light')) {
      return 'light';
    }

    const parseRgb = (str: string) => {
      const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return null;
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1,
      };
    };

    const getBgColor = (el: HTMLElement | null) => (el ? window.getComputedStyle(el).backgroundColor : '');

    const bodyBg = parseRgb(getBgColor(body));
    const htmlBg = parseRgb(getBgColor(html));
    const effectiveBg = bodyBg && bodyBg.a > 0.1 ? bodyBg : htmlBg && htmlBg.a > 0.1 ? htmlBg : null;

    if (effectiveBg) {
      const brightness = (effectiveBg.r * 299 + effectiveBg.g * 587 + effectiveBg.b * 114) / 1000;
      return brightness < 128 ? 'dark' : 'light';
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    return 'light';
  }
  return 'light';
};

export const observePageTheme = (onChange: (theme: ThemeMode) => void): (() => void) => {
  const handler = () => onChange(detectPageTheme());

  const observer = new MutationObserver(handler);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme', 'data-color-mode', 'style'],
  });
  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-color-mode', 'style'],
    });
  }

  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  media?.addEventListener('change', handler);

  return () => {
    observer.disconnect();
    media?.removeEventListener('change', handler);
  };
};
