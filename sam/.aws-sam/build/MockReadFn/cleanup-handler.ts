import { AppConfigClient, CreateHostedConfigurationVersionCommand, StartDeploymentCommand } from '@aws-sdk/client-appconfig';

const client = new AppConfigClient({});

export async function handler() {
  console.log('[CLEANUP] Starting flag cleanup after 7 days of stability');

  try {
    const appId = process.env.APP_ID!;
    const envId = process.env.ENV_ID!;
    const profileId = process.env.FEATURES_PROFILE_ID!;

    // Create new configuration with prismaAdapter disabled
    const disabledConfig = {
      version: '1',
      flags: {
        prismaAdapter: {
          name: 'prismaAdapter',
          _description: 'Enable Prisma database adapter (disabled after 7 days)',
          attributes: {
            enabled: {
              constraints: {
                type: 'boolean'
              }
            }
          }
        }
      },
      values: {
        prismaAdapter: {
          enabled: false
        }
      }
    };

    // Create new hosted configuration version
    const createResponse = await client.send(
      new CreateHostedConfigurationVersionCommand({
        ApplicationId: appId,
        ConfigurationProfileId: profileId,
        Content: new TextEncoder().encode(JSON.stringify(disabledConfig)),
        ContentType: 'application/json',
        Description: 'Automatic cleanup - disable prismaAdapter after 7 days'
      })
    );

    console.log('[CLEANUP] Created configuration version:', createResponse.VersionNumber);

    // Deploy the new configuration
    const deployResponse = await client.send(
      new StartDeploymentCommand({
        ApplicationId: appId,
        EnvironmentId: envId,
        ConfigurationProfileId: profileId,
        ConfigurationVersion: String(createResponse.VersionNumber),
        DeploymentStrategyId: '4', // Immediate deployment
        Description: 'Automatic cleanup deployment'
      })
    );

    console.log('[CLEANUP] Deployment started:', deployResponse.DeploymentNumber);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Flag cleanup completed successfully',
        versionNumber: createResponse.VersionNumber,
        deploymentNumber: deployResponse.DeploymentNumber
      }),
    };
  } catch (error: any) {
    console.error('[CLEANUP-ERROR]', {
      error: error.message,
      code: error.code
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Cleanup failed',
        message: error.message
      }),
    };
  }
}
