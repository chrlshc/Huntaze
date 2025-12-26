import { ServiceBusClient } from '@azure/service-bus';

let client: ServiceBusClient | null = null;

export function getServiceBusClient() {
  const conn = process.env.SERVICEBUS_CONNECTION_SEND;
  if (!conn || !conn.trim()) {
    throw Object.assign(new Error('SERVICEBUS_CONNECTION_SEND missing'), {
      code: 'MISSING_ENV',
      retryable: false,
      service: 'servicebus',
    });
  }

  if (!client) {
    client = new ServiceBusClient(conn);
  }

  return client;
}
