import { EventBus, buildExternalPublisher } from '@/src/lib/agents/event-bus';
import { FileOutbox } from '@/src/lib/agents/outbox';
  import { withConsoleLog, withOutbox, withSseFanout } from '@/src/lib/agents/middlewares';
  import {
    ContentPlannerAgent,
    ContentGeneratorAgent,
    PostSchedulerAgent,
    EngagementTrackerAgent,
    TrendSpotterAgent,
    PromoManagerAgent,
  } from '@/src/lib/agents/content-pipeline';
  import { PPVCampaignAgent } from '@/src/lib/agents/ppv-campaign-agent';

type RuntimeContainer = { bus: EventBus; started: boolean };

declare global {
  // eslint-disable-next-line no-var
  var __ai_runtime: RuntimeContainer | undefined;
}

function createRuntime(): RuntimeContainer {
  const external = buildExternalPublisher('ai-team');
  const bus = new EventBus({ external, source: 'ai-team' });
  bus.use(withConsoleLog());
  bus.use(withOutbox(new FileOutbox()));
  bus.use(withSseFanout());

  // Attach agents once
  // Instances subscribe to bus in their constructors
  // Keep references to avoid GC
  const planner = new ContentPlannerAgent(bus);
  const generator = new ContentGeneratorAgent(bus);
  const scheduler = new PostSchedulerAgent(bus);
  const tracker = new EngagementTrackerAgent(bus);
  const trendspotter = new TrendSpotterAgent(bus);
  const promomanager = new PromoManagerAgent(bus);
  const ppv = new PPVCampaignAgent(bus);
  void planner; void generator; void scheduler; void tracker; void trendspotter; void promomanager; void ppv;

  return { bus, started: true };
}

export function getRuntime(): RuntimeContainer {
  if (!global.__ai_runtime) {
    global.__ai_runtime = createRuntime();
  }
  return global.__ai_runtime;
}

export function getBus(): EventBus {
  return getRuntime().bus;
}
