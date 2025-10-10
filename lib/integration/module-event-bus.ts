import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

import type { HuntazeModule } from '@/contexts/AppStateContext';

const eventBridgeRegion = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-west-1';

const eventBridgeClient = new EventBridgeClient({
  region: eventBridgeRegion,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }
    : undefined,
});

interface PublishModuleEventParams {
  source: HuntazeModule;
  type: string;
  payload: Record<string, unknown>;
  onError?: (error: unknown) => void;
}

export async function publishModuleEvent({ source, type, payload, onError }: PublishModuleEventParams) {
  const detail = JSON.stringify(payload);

  try {
    await eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: `huntaze.${source}`,
            DetailType: type,
            Detail: detail,
            EventBusName: process.env.HUNTAZE_EVENT_BUS || process.env.EVENTBRIDGE_EVENT_BUS,
          },
        ],
      }),
    );
  } catch (error) {
    if (onError) onError(error);
    else throw error;
  }
}
