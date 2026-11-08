import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateChannel } from './repository';

const database = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('./service', async () => {
  const { Service } = await import('electrodb');
  const { ChannelEntity } = await import('./entities/channel');
  const { fromPartial } = await import('@total-typescript/shoehorn');
  return {
    HotUKDealsService: new Service({ channel: ChannelEntity }, {
      table: 'test-channels',
      client: fromPartial<import('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient>({
        send: database.send,
      }),
    }),
  };
});

const channel = {
  channelId: 'channel-1',
  userId: 'user-1',
  name: 'Gaming Deals',
  webhookUrl: 'https://discord.com/api/webhooks/123/new-token',
  createdAt: '2026-11-01T12:00:00.000Z',
  updatedAt: '2026-11-08T12:00:00.000Z',
};

describe('channel updates', () => {
  beforeEach(() => {
    database.send.mockReset();
    database.send.mockImplementation(async (command) => (
      command.input.ReturnValues === 'ALL_NEW'
        ? { Attributes: { ...channel, __edb_e__: 'Channel', __edb_v__: '2' } }
        : {}
    ));
  });

  it('returns the complete channel after replacing its webhook URL', async () => {
    const result = await updateChannel({
      id: channel.channelId,
      name: channel.name,
      webhookUrl: channel.webhookUrl,
    });

    expect(result).toEqual(channel);
    const command = database.send.mock.calls[0][0];
    expect(command.input.Key).toEqual({
      pk: 'channel#channel-1',
      sk: 'channel#channel-1',
    });
    expect(Object.values(command.input.ExpressionAttributeValues)).toContain(channel.webhookUrl);
  });

  it('preserves existing channel fields when changing only the webhook URL', async () => {
    expect(await updateChannel({
      id: channel.channelId,
      webhookUrl: channel.webhookUrl,
    })).toEqual(channel);

    const command = database.send.mock.calls[0][0];
    expect(Object.values(command.input.ExpressionAttributeNames)).not.toContain('name');
  });

  it('propagates database failures', async () => {
    database.send.mockRejectedValue(new Error('Database unavailable'));

    await expect(updateChannel({
      id: channel.channelId,
      webhookUrl: channel.webhookUrl,
    })).rejects.toThrow('Database unavailable');
  });
});
