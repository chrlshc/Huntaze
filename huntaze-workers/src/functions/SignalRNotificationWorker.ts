import { app, InvocationContext } from '@azure/functions';

app.serviceBusTopic('SignalRNotificationWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-events',
  subscriptionName: 'notify-signalr',
  handler: async (message: any, context: InvocationContext) => {
    context.log('[SignalRNotificationWorker] Processing event:', message.eventType);
    
    try {
      const { eventType, jobId, result } = message;
      
      // TODO: Envoyer notification SignalR
      context.log(`[SignalRNotificationWorker] Notifying client for job ${jobId}`);
      
      // Simuler envoi notification
      context.log(`[SignalRNotificationWorker] Event ${eventType} processed`);
      
    } catch (error: any) {
      context.error('[SignalRNotificationWorker] Error:', error);
      // Ne pas throw pour éviter retry sur notifications
    }
  }
});
