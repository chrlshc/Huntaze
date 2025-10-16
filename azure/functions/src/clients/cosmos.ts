import { CosmosClient } from "@azure/cosmos";
import { env } from "./env.js";

const client = new CosmosClient({
  endpoint: env.COSMOS_ENDPOINT,
  key: env.COSMOS_KEY,
});

const database = client.database(env.COSMOS_DB);

export const containers = {
  fans: database.container(env.COSMOS_CONTAINERS.fans),
  transactions: database.container(env.COSMOS_CONTAINERS.transactions),
  messages: database.container(env.COSMOS_CONTAINERS.messages),
  segments: database.container(env.COSMOS_CONTAINERS.segments),
};
