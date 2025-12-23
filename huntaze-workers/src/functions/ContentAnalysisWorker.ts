import { app, InvocationContext } from '@azure/functions';
import { ServiceBusClient } from '@azure/service-bus';

app.serviceBusTopic('ContentAnalysisWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-jobs',
  subscriptionName: 'content-analysis',
  handler: async (message: any, context: InvocationContext) => {
    const startTime = Date.now();
    context.log('[ContentAnalysisWorker] Processing job:', message.jobId);
    
    try {
      const { jobId, payload } = message;
      const { contentUrl } = payload;
      
      // TODO: Analyser le contenu
      const analysis = {
        sentiment: 'positive',
        tags: ['lifestyle', 'fashion'],
        score: 0.85
      };
      
      // Publier événement
      const sbClient = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION!);
      const sender = sbClient.createSender(process.env.TOPIC_EVENTS!);
      
      await sender.sendMessages({
        body: {
          eventType: 'job.completed',
          jobId,
          jobType: 'content.analyze',
          result: analysis,
          duration: Date.now() - startTime
        },
        contentType: 'application/json'
      });
      
      await sender.close();
      await sbClient.close();
      
      context.log(`[ContentAnalysisWorker] Job ${jobId} completed`);
      
    } catch (error: any) {
      context.error('[ContentAnalysisWorker] Error:', error);
      throw error;
    }
  }
});
