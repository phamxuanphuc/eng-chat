import { describe, it, expect } from 'vitest';
import manifest from '../manifest.json';
import pkg from '../package.json';

const publicIcons = Object.keys(import.meta.glob('../public/icons/*', { eager: true, query: '?url' }))
  .map((path) => path.replace('../public/', ''));

describe('release manifest', () => {
  it('keeps manifest and package versions in sync', () => {
    expect(manifest.version).toBe(pkg.version);
  });

  it('uses VinaWrite branding without legacy names', () => {
    const text = JSON.stringify(manifest) + pkg.description;
    expect(manifest.name).toBe('VinaWrite - Trợ lý AI Viết lại & Dịch thuật mọi nơi');
    expect(manifest.action.default_title).toBe('VinaWrite');
    expect(text).not.toMatch(/EngChat|Eng Chat|LingoFlow/i);
  });

  it('keeps store-facing strings in English', () => {
    const descriptions = Object.values(manifest.commands).map((c) => c.description);
    [...descriptions, manifest.description].forEach((d) => {
      expect(d).toMatch(/^[\x20-\x7E]+$/);
    });
  });

  it('references icons that exist in public', () => {
    Object.values(manifest.icons).forEach((path) => {
      expect(publicIcons).toContain(path);
    });
  });

  it('ships only runtime assets from public/icons', () => {
    expect(publicIcons.filter((f) => !/^icons\/(icon\d+\.png|logo\.svg)$/.test(f))).toEqual([]);
  });
});
