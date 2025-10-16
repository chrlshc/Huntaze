import { z } from 'zod';
import type { EventBus } from '@/src/lib/agents/event-bus';
import type { Correlation } from '@/src/lib/agents/events';
import { EVENT_PPV_CAMPAIGN_REQUEST, EVENT_PPV_CAMPAIGNS_READY } from '@/src/lib/agents/content-pipeline';

const PPVCampaignRequest = z.object({
  correlation: z.object({ traceId: z.string().uuid(), modelId: z.string(), runId: z.string().uuid() }),
  userId: z.string(),
  targets: z.array(z.object({ conversationId: z.string(), fanValue: z.number().nonnegative(), segment: z.enum(['whale','vip','regular','cold']) })),
  content: z.object({ media: z.string().url(), caption: z.string().min(1).max(1000) }),
});

export class PPVCampaignAgent {
  constructor(private bus: EventBus) {
    bus.subscribe(EVENT_PPV_CAMPAIGN_REQUEST, this.handle.bind(this));
  }

  private async handle(evt?: any) {
    const req = PPVCampaignRequest.parse(evt);
    const { correlation, targets, content, userId } = req;

    const campaigns = targets.map((t, i) => ({
      conversationId: t.conversationId,
      price: this.calcPrice(t.fanValue, t.segment),
      variant: (i % 2 === 0 ? 'A' : 'B') as 'A'|'B',
      content,
    }));

    await this.bus.publish(EVENT_PPV_CAMPAIGNS_READY, { correlation, userId, campaigns });
  }

  private calcPrice(ltv: number, segment: 'whale'|'vip'|'regular'|'cold'): number {
    const base = 25;
    const mult = { whale: 2.5, vip: 1.8, regular: 1.0, cold: 0.7 }[segment] ?? 1.0;
    const ltvAdj = Math.max(0.8, Math.min(ltv / 50, 3));
    return Math.round(base * mult * ltvAdj);
  }
}

