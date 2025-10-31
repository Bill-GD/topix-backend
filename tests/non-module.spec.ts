import { getChatChannelId, getReadableSize } from '@/common/utils/helpers';

describe('Non-module functions', () => {
  it(`WebSocket chat channel ID should be 'chatchannel:<id>'`, () => {
    expect(getChatChannelId(1)).toBe('chatchannel:1');
  });

  it(`Formatted size string correctly`, () => {
    expect(getReadableSize(10)).toBe('10 B');
    expect(getReadableSize(1024)).toBe('1 KB');
    expect(getReadableSize(1024 ^ 2)).toBe('1 MB');
    expect(getReadableSize(1024 ^ 3)).toBe('1 GB');
  });
});
