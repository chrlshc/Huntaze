#!/usr/bin/env node
// Update ECS task definition env vars for a given container, then update the service
// Usage:
//   node scripts/ecs-set-env.mjs --cluster <CLUSTER> --service <SERVICE> --container <CONTAINER> --env-file <FILE> [--region us-east-1]

import { readFileSync } from 'node:fs';
import { ECSClient, DescribeServicesCommand, DescribeTaskDefinitionCommand, RegisterTaskDefinitionCommand, UpdateServiceCommand } from '@aws-sdk/client-ecs';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { region: process.env.AWS_REGION || 'us-east-1' };
  for (let i = 0; i < args.length; i++) {
    const k = args[i];
    const v = args[i + 1];
    switch (k) {
      case '--cluster': out.cluster = v; i++; break;
      case '--service': out.service = v; i++; break;
      case '--container': out.container = v; i++; break;
      case '--env-file': out.envFile = v; i++; break;
      case '--region': out.region = v; i++; break;
      default: throw new Error(`Unknown arg: ${k}`);
    }
  }
  const req = ['cluster','service','container','envFile'];
  for (const r of req) if (!out[r]) throw new Error(`Missing required --${r}`);
  return out;
}

function parseDotEnv(filePath) {
  const src = readFileSync(filePath, 'utf8');
  const map = new Map();
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function mergeEnv(existing = [], updatesMap) {
  const merged = [];
  const seen = new Set();
  for (const env of existing) {
    const key = env.name;
    if (updatesMap.has(key)) {
      merged.push({ name: key, value: updatesMap.get(key) });
      seen.add(key);
    } else {
      merged.push(env);
    }
  }
  for (const [k, v] of updatesMap.entries()) {
    if (!seen.has(k)) merged.push({ name: k, value: v });
  }
  return merged;
}

async function main() {
  const { cluster, service, container, envFile, region } = parseArgs();
  const envMap = parseDotEnv(envFile);
  const client = new ECSClient({ region });

  // Get current task definition
  const svc = await client.send(new DescribeServicesCommand({ cluster, services: [service] }));
  const svcDesc = svc.services?.[0];
  if (!svcDesc?.taskDefinition) throw new Error('Service not found or missing taskDefinition');
  const tdArn = svcDesc.taskDefinition;

  const td = await client.send(new DescribeTaskDefinitionCommand({ taskDefinition: tdArn, include: ['TAGS'] }));
  const def = td.taskDefinition;
  if (!def) throw new Error('Task definition not found');

  const containerDefs = def.containerDefinitions || [];
  const target = containerDefs.find(c => c.name === container);
  if (!target) {
    const names = containerDefs.map(c => c.name).join(', ');
    throw new Error(`Container '${container}' not found. Existing: ${names}`);
  }

  const updatedContainerDefs = containerDefs.map(c => {
    if (c.name !== container) return c;
    return { ...c, environment: mergeEnv(c.environment, envMap) };
  });

  const input = {
    family: def.family,
    taskRoleArn: def.taskRoleArn,
    executionRoleArn: def.executionRoleArn,
    networkMode: def.networkMode,
    containerDefinitions: updatedContainerDefs,
    volumes: def.volumes,
    placementConstraints: def.placementConstraints,
    requiresCompatibilities: def.requiresCompatibilities,
    cpu: def.cpu,
    memory: def.memory,
    runtimePlatform: def.runtimePlatform,
    proxyConfiguration: def.proxyConfiguration,
    inferenceAccelerators: def.inferenceAccelerators,
    ephemeralStorage: def.ephemeralStorage,
    tags: td.tags,
  };

  const reg = await client.send(new RegisterTaskDefinitionCommand(input));
  const newArn = reg.taskDefinition?.taskDefinitionArn;
  if (!newArn) throw new Error('Failed to register new task definition');

  await client.send(new UpdateServiceCommand({ cluster, service, taskDefinition: newArn }));

  console.log(`[ecs] Updated ${container} env (${envMap.size} vars). Service now uses: ${newArn}`);
}

main().catch((err) => {
  console.error('[ecs] Error:', err.message);
  process.exit(1);
});

