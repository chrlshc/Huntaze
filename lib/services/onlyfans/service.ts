// OnlyFans Service with rate limiting and monitoring

import { OnlyFansGateway } from './types';
import { RateLimiter } from '../../utils/rate-limiter';
import {
  ofCampaignsSent,
  ofMessageDuration,
  ofRateLimitHits,
  tracedOnlyFansCall
} from '../../monitoring/onlyfans-metrics';

export class OnlyFansService {
  constructor(
    private gateway: OnlyFansGateway,
    private limiter = new RateLimiter({ maxPerMinute: 60 })
  ) {}

  async listConversations() {
    return tracedOnlyFansCall('getConversations', () =>
      this.gateway.getConversations()
    );
  }

  async sendMessageWithLimit(userId: string, content: string) {
    if (!this.limiter.take('dm')) {
      ofRateLimitHits.inc({ type: 'dm' });
      throw new Error('Rate limit exceeded');
    }

    const end = ofMessageDuration.startTimer();
    try {
      const res = await tracedOnlyFansCall('sendMessage', () =>
        this.gateway.sendMessage(userId, content)
      );

      ofCampaignsSent.inc({
        status: res.ok ? 'success' : 'failed',
        audience_segment: 'dm'
      });

      if (!res.ok) throw new Error(res.error ?? 'send failed');
      return res;
    } finally {
      end();
    }
  }
}
