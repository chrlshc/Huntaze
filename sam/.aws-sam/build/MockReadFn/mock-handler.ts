import { AppConfigDataClient, StartConfigurationSessionCommand, GetLatestConfigurationCommand } from '@aws-sdk/client-appconfigdata';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const appConfigClient = new AppConfigDataClient({});
const lambdaClient = new LambdaClient({});

let configToken: string | undefined;

// Simple in-memory mock data
const mockUsers = new Map([
  ['user-1', { id: 'user-1', email: 'test@huntaze.com', name: 'Test User', subscription: 'FREE' }],
  ['user-2', { id: 'user-2', email: 'beta@huntaze.com', name: 'Beta User', subscription: 'PRO' }],
]);

async function getFeatureFlags() {
  try {
    if (!configToken) {
      const session = await appConfigClient.send(
        new StartConfigurationSessionCommand({
          ApplicationIdentifier: process.env.APP_ID!,
          EnvironmentIdentifier: process.env.ENV_ID!,
          ConfigurationProfileIdentifier: process.env.FEATURES_PROFILE_ID!,
        })
      );
      configToken = session.InitialConfigurationToken;
    }

    const config = await appConfigClient.send(
      new GetLatestConfigurationCommand({ ConfigurationToken: configToken! })
    );
    
    configToken = config.NextPollConfigurationToken;
    
    if (!config.Configuration) {
      console.log('[FLAGS] No configuration found, using defaults');
      return { prismaAdapter: { enabled: false } };
    }

    const flags = JSON.parse(new TextDecoder().decode(config.Configuration));
    console.log('[FLAGS] Retrieved:', JSON.stringify(flags));
    return flags;
  } catch (error: any) {
    console.error('[FLAGS-ERROR]', error.message);
    return { prismaAdapter: { enabled: false } };
  }
}

export async function handler(event: any) {
  const userId = event.pathParameters?.userId || event.userId || 'user-1';
  const startTime = Date.now();
  
  console.log('[REQUEST]', { userId, event: JSON.stringify(event) });

  try {
    // Check feature flag
    const flags = await getFeatureFlags();
    const prismaEnabled = flags.values?.prismaAdapter?.enabled === true || 
                          flags.prismaAdapter?.enabled === true;

    console.log('[FLAG-CHECK]', { prismaEnabled, userId });

    if (prismaEnabled) {
      // Canary: use Prisma directly
      console.log('[CANARY] Routing to Prisma for userId:', userId);
      const result = await invokePrismaHandler(event);
      const duration = Date.now() - startTime;
      console.log('[CANARY-SUCCESS]', { userId, duration });
      return result;
    }

    // Control path: Mock
    const controlResult = mockUsers.get(userId);
    
    if (!controlResult) {
      console.log('[MOCK-NOT-FOUND]', { userId });
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Shadow traffic (fire-and-forget)
    void shadowCompare(event, controlResult, userId);

    const duration = Date.now() - startTime;
    console.log('[MOCK-SUCCESS]', { userId, duration });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(controlResult),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[ERROR]', { userId, error: error.message, duration });
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function invokePrismaHandler(event: any) {
  const startTime = Date.now();
  
  try {
    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: process.env.CANDIDATE_FN_ARN!,
        InvocationType: 'RequestResponse',
        Payload: new TextEncoder().encode(JSON.stringify(event)),
      })
    );

    const duration = Date.now() - startTime;
    
    if (response.FunctionError) {
      console.error('[PRISMA-INVOKE-ERROR]', { 
        error: response.FunctionError,
        duration 
      });
      throw new Error(`Prisma function error: ${response.FunctionError}`);
    }

    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    console.log('[PRISMA-INVOKE-SUCCESS]', { duration });
    
    return payload;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[PRISMA-INVOKE-FAILED]', { 
      error: error.message,
      duration 
    });
    throw error;
  }
}

async function shadowCompare(event: any, controlResult: any, userId: string) {
  const startTime = Date.now();
  const timeout = setTimeout(() => {
    console.warn('[SHADOW-TIMEOUT]', { userId, duration: 500 });
  }, 500);

  try {
    const candidateResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: process.env.CANDIDATE_FN_ARN!,
        InvocationType: 'RequestResponse',
        Payload: new TextEncoder().encode(JSON.stringify(event)),
      })
    );

    clearTimeout(timeout);
    const duration = Date.now() - startTime;

    if (candidateResponse.FunctionError) {
      console.warn('[SHADOW-FUNCTION-ERROR]', { 
        userId,
        error: candidateResponse.FunctionError,
        duration 
      });
      return;
    }

    const candidatePayload = JSON.parse(new TextDecoder().decode(candidateResponse.Payload));
    const candidateResult = candidatePayload.body ? 
      JSON.parse(candidatePayload.body) : 
      candidatePayload;
    
    // Compare results
    const controlStr = JSON.stringify(controlResult);
    const candidateStr = JSON.stringify(candidateResult);

    if (controlStr !== candidateStr) {
      console.warn('[SHADOW-DIFF]', {
        userId,
        duration,
        control: controlStr.substring(0, 200),
        candidate: candidateStr.substring(0, 200),
        match: false
      });
    } else {
      console.log('[SHADOW-OK]', { userId, duration, match: true });
    }
  } catch (error: any) {
    clearTimeout(timeout);
    const duration = Date.now() - startTime;
    console.warn('[SHADOW-FAILED]', { 
      userId,
      error: error.message,
      duration 
    });
  }
}
