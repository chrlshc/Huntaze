import { app, InvocationContext } from '@azure/functions';
import { ServiceBusClient } from '@azure/service-bus';

app.serviceBusTopic('ChatSuggestionsWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-jobs',
  subscriptionName: 'chat-suggestions',
  handler: async (message: any, context: InvocationContext) => {
    const startTime = Date.now();
    context.log('[ChatSuggestionsWorker] Processing job:', message.jobId);
    
    try {
      const { jobId, payload } = message;
      const { fanMessage, context: chatContext } = payload;
      
      // TODO: Appeler Azure AI pour suggestions
      context.log(`[ChatSuggestionsWorker] Generating suggestions for: ${fanMessage}`);
      
      const suggestions = [
        'Hey! Thanks for your message 😊',
        'I appreciate you reaching out!',
        'That\'s so sweet of you to say!'
      ];
      
      // Publier événement
      const sbClient = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION!);
      const sender = sbClient.createSender(process.env.TOPIC_EVENTS!);
      
      await sender.sendMessages({
        body: {
          eventType: 'job.completed',
          jobId,
          jobType: 'chat.suggest',
          result: { suggestions },
          duration: Date.now() - startTime
        },
        contentType: 'application/json'
      });
      
      await sender.close();
      await sbClient.close();
      
      context.log(`[ChatSuggestionsWorker] Job ${jobId} completed`);
      
    } catch (error: any) {
      context.error('[ChatSuggestionsWorker] Error:', error);
      throw error;
    }
  }
});
