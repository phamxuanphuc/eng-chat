import React from 'react';
import { Timer } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { getTranslator } from '../i18n';
import { Language } from '../types';
import { KeyCooldownStatus, formatCountdown } from './useKeyCooldowns';

interface KeyCooldownBadgeProps {
  language: Language;
  status?: KeyCooldownStatus;
}

export const KeyCooldownBadge: React.FC<KeyCooldownBadgeProps> = ({ language, status }) => {
  if (!status) return null;
  const t = getTranslator(language);
  const time = formatCountdown(status.remainingMs);
  return (
    <Badge
      variant={status.reason === 'invalid' ? 'danger' : 'warning'}
      size="sm"
      icon={<Timer size={11} />}
    >
      {status.reason === 'invalid' ? t('api.cooldownInvalid', { time }) : t('api.cooldownQuota', { time })}
    </Badge>
  );
};
