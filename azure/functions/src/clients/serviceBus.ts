import { ServiceBusClient } from "@azure/service-bus";
import { DefaultAzureCredential } from "@azure/identity";
import { env } from "./env.js";

export function sbSender(queue: string) {
  if (!env.SERVICE_BUS_FQNS) return null;
  const credential = new DefaultAzureCredential();
  const client = new ServiceBusClient(env.SERVICE_BUS_FQNS, credential);
  return client.createSender(queue);
}
