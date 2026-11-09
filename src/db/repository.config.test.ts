import { beforeEach, describe, expect, it, vi } from 'vitest';
import { upsertConfig } from './repository';

const database = vi.hoisted(() => ({
  stored: null as Record<string, unknown> | null,
}));

vi.mock('./service', () => ({
  HotUKDealsService: {
    entities: {
      searchTermConfig: {
        query: {
          byChannel: () => ({ go: async () => ({ data: database.stored ? [database.stored] : [] }) }),
        },
        put: (values: Record<string, unknown>) => ({
          go: async () => { database.stored = { ...values }; },
        }),
        patch: () => ({
          set: (values: Record<string, unknown>) => ({
            go: async () => { database.stored = { ...database.stored, ...values }; },
          }),
        }),
      },
    },
  },
}));

const config = { userId: 'user-1', channelId: 'channel-1', searchTerm: 'running shoes' };

describe('config fuzzy matching persistence', () => {
  beforeEach(() => { database.stored = null; });

  it('saves fuzzy matching when creating a config', async () => {
    expect((await upsertConfig({ ...config, fuzzyMatch: true })).fuzzyMatch).toBe(true);
  });

  it('can turn fuzzy matching off on an existing config', async () => {
    await upsertConfig({ ...config, fuzzyMatch: true });
    expect((await upsertConfig({ ...config, fuzzyMatch: false })).fuzzyMatch).toBe(false);
  });

  it('preserves fuzzy matching when changing only enabled state', async () => {
    await upsertConfig({ ...config, fuzzyMatch: true });
    const updated = await upsertConfig({ ...config, enabled: false });
    expect(updated.fuzzyMatch).toBe(true);
    expect(updated.enabled).toBe(false);
  });
});
