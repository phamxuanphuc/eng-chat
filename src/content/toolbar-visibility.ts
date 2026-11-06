import { getCurrentOrigin, hideForSession, hideSite, isHiddenForSession, isSiteHidden, loadHiddenSites } from '../services/hidden-sites';

export type HideScope = 'session' | 'site';

let sessionHidden = isHiddenForSession();
let siteHidden = false;

export const isToolbarSuppressed = (): boolean => sessionHidden || siteHidden;

export const getSiteLabel = (): string => {
  const origin = getCurrentOrigin();
  return origin ? new URL(origin).host : '';
};

export const refreshSiteHidden = async (): Promise<boolean> => {
  siteHidden = isSiteHidden(await loadHiddenSites());
  return siteHidden;
};

export const hideToolbar = async (scope: HideScope): Promise<void> => {
  const origin = getCurrentOrigin();
  if (scope === 'site' && origin && (await hideSite(origin).catch(() => false))) {
    siteHidden = true;
    return;
  }
  hideForSession();
  sessionHidden = true;
};
