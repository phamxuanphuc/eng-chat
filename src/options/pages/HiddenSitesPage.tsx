import React from 'react';
import { EyeOff, Globe, Eye } from 'lucide-react';
import { useOptions } from '../OptionsContext';
import { useHiddenSites } from '../useHiddenSites';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Switch } from '../../components/ui/Switch';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Alert } from '../../components/ui/Alert';
import { getTranslator } from '../../i18n';
import { PageHeader } from '../PageHeader';

export const HiddenSitesPage: React.FC = () => {
  const { language } = useOptions();
  const { sites, remove, removeAll } = useHiddenSites();
  const { settings, updateSettings } = useSettingsStore();
  const t = getTranslator(language);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <PageHeader
        icon={<EyeOff size={19} />}
        title={t('sites.title')}
        description={t('sites.description')}
        aside={
          <Badge variant={sites.length > 0 ? 'warning' : 'secondary'} size="sm">
            {sites.length === 1 ? t('sites.countOne') : t('sites.count', { count: sites.length })}
          </Badge>
        }
      />

      <Switch
        checked={settings.showToolbarOnFocus ?? true}
        onChange={(showToolbarOnFocus) => void updateSettings({ showToolbarOnFocus })}
        label={t('sites.showOnFocus')}
        description={t('sites.showOnFocusDescription')}
      />

      {sites.length === 0 ? (
        <Alert variant="info" message={t('sites.empty')} />
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {sites.map((origin) => (
              <li
                key={origin}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 pl-3.5"
              >
                <span className="flex min-w-0 items-center gap-2.5 text-sm text-slate-200">
                  <Globe size={15} className="shrink-0 text-indigo-400" />
                  <span className="truncate text-xs">{origin}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Eye size={12} className="text-indigo-400" />}
                  aria-label={`${t('sites.show')} ${origin}`}
                  onClick={() => void remove(origin)}
                >
                  {t('sites.show')}
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => void removeAll()}>
              {t('sites.showAll')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
