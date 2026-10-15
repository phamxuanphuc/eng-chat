export const getPopupTheme = (theme: 'light' | 'dark' = 'dark') => {
  return theme === 'light'
    ? {
        card: 'bg-white border-slate-200 text-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.12)]',
        bar: 'bg-slate-300',
        title: 'text-slate-800 hover:text-slate-950',
        pill: 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700',
        iconBtn: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
        origBox: 'bg-slate-50 border-slate-200 text-slate-600',
        subText: 'text-slate-400',
        resText: 'text-slate-900',
        menu: 'bg-white border-slate-200 shadow-xl text-slate-700',
        menuItem: 'text-slate-700 hover:bg-slate-100',
        menuActive: 'bg-indigo-50 text-indigo-700 font-semibold',
      }
    : {
        card: 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10',
        bar: 'bg-slate-600/70',
        title: 'text-slate-200 hover:text-white',
        pill: 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-200',
        iconBtn: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
        origBox: 'bg-slate-950/60 border-slate-800/80 text-slate-400',
        subText: 'text-slate-500',
        resText: 'text-slate-100',
        menu: 'bg-slate-900 border-slate-700 shadow-xl text-slate-300',
        menuItem: 'text-slate-300 hover:bg-slate-800',
        menuActive: 'bg-indigo-600/40 text-indigo-200 font-semibold',
      };
};

export const POPUP_LANGUAGES = [
  'English',
  'Vietnamese',
  'Japanese',
  'Korean',
  'Chinese',
  'French',
  'Spanish',
  'German',
] as const;
