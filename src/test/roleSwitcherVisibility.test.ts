import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isDevOrStagingHost } from '@/components/dev/RoleSwitcher';

describe('RoleSwitcher visibility (production must hide)', () => {
  const originalLocation = window.location;

  const setHost = (hostname: string) => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, hostname },
    });
  };

  beforeEach(() => {
    vi.stubEnv('DEV', false as unknown as string);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  });

  // ===== HIDDEN on production =====
  const productionHosts = [
    'tableops.com',
    'www.tableops.com',
    'app.tableops.co.kr',
    'restaurant.example.io',
    'my-project.lovable.app',           // published Lovable app
    'www.my-project.lovable.app',
    'a8777453.lovable.app',
  ];
  productionHosts.forEach((host) => {
    it(`HIDES on production host: ${host}`, () => {
      setHost(host);
      expect(isDevOrStagingHost()).toBe(false);
    });
  });

  // ===== VISIBLE on dev / staging =====
  const stagingHosts = [
    'localhost',
    '127.0.0.1',
    'a8777453-99e0-4544-aa86-f039dd2262db.lovableproject.com',
    'id-preview--a8777453-99e0-4544-aa86-f039dd2262db.lovable.app',
  ];
  stagingHosts.forEach((host) => {
    it(`SHOWS on dev/staging host: ${host}`, () => {
      setHost(host);
      expect(isDevOrStagingHost()).toBe(true);
    });
  });

  it('SHOWS when import.meta.env.DEV is true (local dev)', () => {
    vi.stubEnv('DEV', true as unknown as string);
    setHost('tableops.com'); // even on prod-looking host, dev build wins
    expect(isDevOrStagingHost()).toBe(true);
  });
});
