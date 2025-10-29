import { getChatChannelId } from '@/common/utils/helpers';

describe('Non-module functions', () => {
  describe('WebSocket chat channel ID', () => {
    it(`should stay 'chatchannel:<id>'`, () => {
      expect(getChatChannelId(1)).toBe('chatchannel:1');
    });
  });
});
