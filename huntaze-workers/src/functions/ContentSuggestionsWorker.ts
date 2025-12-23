import { app, InvocationContext } from '@azure/functions';
import { ServiceBusClient } from '@azure/service-bus';

app.serviceBusTopic('ContentSuggestionsWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-jobs',
  subscriptionName: 'content-suggestions',
  handler: async (message: any, context: InvocationContext) => {
    const startTime = Date.now();
    context.log('[ContentSuggestionsWorker] Processing job:', message.jobId);
    
    try {
      const { jobId, payload } = message;
      
      // TODO: Générer suggestions de contenu
      const suggestions = [
        { type: 'photo', caption: 'Feeling cute today 💕' },
        { type: 'video', caption: 'Behind the scenes 🎬' }
      ];
      
      // Publier événement
      const sbClient = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION!);
      const sender = sbClient.createSender(process.env.TOPIC_EVENTS!);
      
      await sender.sendMessages({
        body: {
          eventType: 'job.completed',
          jobId,
          jobType: 'content.suggest',
          result: { suggestions },
          duration: Date.now() - startTime
        },
        contentType: 'application/json'
      });
      
      await sender.close();
      await sbClient.close();
      
      context.log(`[ContentSuggestionsWorker] Job ${jobId} completed`);
      
    } catch (error: any) {
      context.error('[ContentSuggestionsWorker] Error:', error);
      throw error;
    }
  }
});
