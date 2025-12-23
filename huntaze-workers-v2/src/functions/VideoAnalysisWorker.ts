import { app, InvocationContext } from '@azure/functions';
import { ServiceBusClient } from '@azure/service-bus';

app.serviceBusTopic('VideoAnalysisWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-jobs',
  subscriptionName: 'video-analysis',
  handler: async (message: any, context: InvocationContext) => {
    const startTime = Date.now();
    context.log('[VideoAnalysisWorker] Processing job:', message.jobId);
    
    try {
      const { jobId, payload } = message;
      const { videoUrl } = payload;
      
      // TODO: Appeler Azure AI pour analyse vidéo
      context.log(`[VideoAnalysisWorker] Analyzing video: ${videoUrl}`);
      
      // Simuler traitement (remplacer par vraie logique)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = {
        scenes: ['scene1', 'scene2'],
        objects: ['object1', 'object2'],
        transcript: 'Sample transcript'
      };
      
      // Publier événement de complétion
      const sbClient = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION!);
      const sender = sbClient.createSender(process.env.TOPIC_EVENTS!);
      
      await sender.sendMessages({
        body: {
          eventType: 'job.completed',
          jobId,
          jobType: 'video.analysis',
          result,
          duration: Date.now() - startTime
        },
        contentType: 'application/json'
      });
      
      await sender.close();
      await sbClient.close();
      
      context.log(`[VideoAnalysisWorker] Job ${jobId} completed in ${Date.now() - startTime}ms`);
      
    } catch (error: any) {
      context.error('[VideoAnalysisWorker] Error:', error);
      throw error; // Trigger retry
    }
  }
});
