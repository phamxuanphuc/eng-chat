import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getTranslator } from '../../i18n';
import { IconButton } from './IconButton';

export interface AlertProps {
  variant?: 'success' | 'error' | 'info' | 'warning';
  message: string;
  description?: string;
  className?: string;
  onClose?: () => void;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  message,
  description,
  className = '',
  onClose,
  action,
}) => {
  const language = useSettingsStore((state) => state.settings.language);
  const t = getTranslator(language);
  const styles = {
    success: {
      container: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    },
    error: {
      container: 'bg-rose-950/40 border-rose-500/50 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    },
    info: {
      container: 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200',
      icon: <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />,
    },
    warning: {
      container: 'bg-amber-950/40 border-amber-500/50 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    },
  }[variant];

  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={`relative flex items-start gap-3 p-3.5 rounded-xl border text-left ${styles.container} ${className}`}
    >
      {styles.icon}
      <div className="flex flex-col flex-1 min-w-0 pr-2">
        <span className="text-sm font-semibold">{message}</span>
        {description && <span className="text-xs opacity-90 mt-0.5 leading-relaxed break-words">{description}</span>}
        {action && <div className="mt-2.5 flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {onClose && (
        <IconButton label={t('common.closeAlert')} onClick={onClose}>
          <X size={14} />
        </IconButton>
      )}
    </div>
  );
};
