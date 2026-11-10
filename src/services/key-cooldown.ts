export type KeyFailure = 'quota' | 'invalid';

export const COOLDOWN_MS: Record<KeyFailure, number> = {
  quota: 5 * 60 * 1000,
  invalid: 30 * 60 * 1000,
};

export const COOLDOWN_STORAGE_KEY = 'engchat_key_cooldowns';
const STORAGE_KEY = COOLDOWN_STORAGE_KEY;

export interface KeyCooldown {
  until: number;
  reason: KeyFailure;
}

type CooldownMap = Record<string, KeyCooldown>;

const fingerprint = (key: string): string => {
  let hash = 5381;
  for (let i = 0; i < key.length; i++) hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0;
  return `k${(hash >>> 0).toString(36)}${key.length}`;
};

const readMap = async (now: number): Promise<CooldownMap> => {
  let raw: unknown;
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      raw = (await chrome.storage.local.get(STORAGE_KEY))?.[STORAGE_KEY];
    } else if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      raw = stored ? JSON.parse(stored) : undefined;
    }
  } catch {
    return {};
  }
  const map: CooldownMap = {};
  if (raw && typeof raw === 'object') {
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      const entry = typeof value === 'number' ? { until: value, reason: 'quota' as KeyFailure } : (value as Partial<KeyCooldown>);
      if (entry && typeof entry.until === 'number' && entry.until > now) {
        map[id] = { until: entry.until, reason: entry.reason === 'invalid' ? 'invalid' : 'quota' };
      }
    }
  }
  return map;
};

const writeMap = async (map: CooldownMap): Promise<void> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [STORAGE_KEY]: map });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    }
  } catch {}
};

export const classifyKeyFailure = (message: string): KeyFailure | null => {
  if (/api key[^.]*(invalid|not valid)|unauthorized|\b40[13]\b/i.test(message)) return 'invalid';
  if (/quota|429/i.test(message)) return 'quota';
  return null;
};

export const markKeyCooldown = async (key: string, reason: KeyFailure, now = Date.now()): Promise<void> => {
  const map = await readMap(now);
  map[fingerprint(key)] = { until: now + COOLDOWN_MS[reason], reason };
  await writeMap(map);
};

export const clearKeyCooldown = async (key: string, now = Date.now()): Promise<void> => {
  const map = await readMap(now);
  const id = fingerprint(key);
  if (!(id in map)) return;
  delete map[id];
  await writeMap(map);
};

export const orderKeysByAvailability = async (keys: string[], now = Date.now()): Promise<string[]> => {
  const map = await readMap(now);
  const available = keys.filter((key) => !(fingerprint(key) in map));
  const cooling = keys
    .filter((key) => fingerprint(key) in map)
    .sort((a, b) => map[fingerprint(a)].until - map[fingerprint(b)].until);
  return [...available, ...cooling];
};

export const getKeyCooldowns = async (keys: string[], now = Date.now()): Promise<Record<string, KeyCooldown>> => {
  const map = await readMap(now);
  const result: Record<string, KeyCooldown> = {};
  for (const key of keys) {
    const entry = map[fingerprint(key)];
    if (entry) result[key] = entry;
  }
  return result;
};

export const resetKeyCooldowns = async (): Promise<void> => {
  await writeMap({});
};
