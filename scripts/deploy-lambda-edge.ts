#!/usr/bin/env tsx

/**
 * Deploy Lambda@Edge Functions
 * 
 * This script deploys viewer-request and origin-response functions to AWS Lambda
 * and provides the ARNs needed to attach them to CloudFront.
 */

import { 
  LambdaClient, 
  CreateFunctionCommand, 
  UpdateFunctionCodeCommand,
  GetFunctionCommand,
  PublishVersionCommand,
  ResourceNotFoundException
} from '@aws-sdk/client-lambda';
import { 
  IAMClient, 
  GetRoleCommand, 
  CreateRoleCommand,
  AttachRolePolicyCommand 
} from '@aws-sdk/client-iam';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const REGION = 'us-east-1'; // Lambda@Edge must be in us-east-1
const VIEWER_REQUEST_FUNCTION = 'huntaze-viewer-request';
const ORIGIN_RESPONSE_FUNCTION = 'huntaze-origin-response';
const ROLE_NAME = 'huntaze-lambda-edge-role';

const lambda = new LambdaClient({ region: REGION });
const iam = new IAMClient({ region: REGION });

async function ensureRole(): Promise<string> {
  console.log('🔐 Ensuring IAM role exists...');
  
  try {
    const { Role } = await iam.send(new GetRoleCommand({ RoleName: ROLE_NAME }));
    console.log(`✅ Role exists: ${Role?.Arn}`);
    return Role!.Arn!;
  } catch (error: any) {
    if (error.name === 'NoSuchEntityException' || error.name === 'NoSuchEntity') {
      console.log('Creating new role...');
      
      const assumeRolePolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com']
            },
            Action: 'sts:AssumeRole'
          }
        ]
      };
      
      const { Role } = await iam.send(new CreateRoleCommand({
        RoleName: ROLE_NAME,
        AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy),
        Description: 'Role for Lambda@Edge functions'
      }));
      
      // Attach basic execution policy
      await iam.send(new AttachRolePolicyCommand({
        RoleName: ROLE_NAME,
        PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      }));
      
      console.log(`✅ Role created: ${Role?.Arn}`);
      
      // Wait for role to propagate
      console.log('⏳ Waiting 10 seconds for role to propagate...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      return Role!.Arn!;
    }
    throw error;
  }
}

async function buildFunction(name: string): Promise<Buffer> {
  console.log(`📦 Building ${name}...`);
  
  const sourceFile = join(process.cwd(), 'lambda', 'edge', `${name}.ts`);
  const distDir = join(process.cwd(), 'lambda', 'edge', 'dist');
  
  // Create dist directory
  execSync(`mkdir -p ${distDir}`, { stdio: 'inherit' });
  
  // Compile TypeScript with esbuild (handles types better)
  execSync(
    `npx esbuild ${sourceFile} --bundle --platform=node --target=node18 --outfile=${distDir}/${name}.js --external:aws-sdk`,
    { stdio: 'inherit' }
  );
  
  // Create ZIP
  const zipPath = join(distDir, `${name}.zip`);
  execSync(`zip -j ${zipPath} ${distDir}/${name}.js`, { stdio: 'inherit' });
  
  const zipBuffer = readFileSync(zipPath);
  console.log(`✅ Built ${name} (${(zipBuffer.length / 1024).toFixed(2)} KB)`);
  
  return zipBuffer;
}

async function deployFunction(
  functionName: string,
  roleArn: string,
  zipBuffer: Buffer
): Promise<string> {
  console.log(`🚀 Deploying ${functionName}...`);
  
  try {
    // Try to get existing function
    await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));
    
    // Update existing function
    console.log(`Updating existing function...`);
    await lambda.send(new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: zipBuffer
    }));
    
    // Wait for update to complete
    console.log(`⏳ Waiting for update to complete...`);
    let attempts = 0;
    while (attempts < 30) {
      try {
        const { Configuration } = await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));
        if (Configuration?.State === 'Active' && Configuration?.LastUpdateStatus === 'Successful') {
          console.log(`✅ Update complete`);
          break;
        }
        console.log(`   State: ${Configuration?.State}, UpdateStatus: ${Configuration?.LastUpdateStatus}, waiting...`);
      } catch (e) {
        // Ignore errors during wait
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
    
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      // Create new function
      console.log(`Creating new function...`);
      await lambda.send(new CreateFunctionCommand({
        FunctionName: functionName,
        Runtime: 'nodejs18.x',
        Role: roleArn,
        Handler: `${functionName.replace('huntaze-', '')}.handler`,
        Code: { ZipFile: zipBuffer },
        Timeout: 5,
        MemorySize: 128,
        Publish: false
      }));
      
      // Wait for function to be ready
      console.log(`⏳ Waiting for function to be ready...`);
      let attempts = 0;
      while (attempts < 30) {
        try {
          const { Configuration } = await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));
          if (Configuration?.State === 'Active') {
            console.log(`✅ Function is active`);
            break;
          }
          console.log(`   State: ${Configuration?.State}, waiting...`);
        } catch (e) {
          // Ignore errors during wait
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    } else {
      throw error;
    }
  }
  
  // Publish version
  console.log(`Publishing version...`);
  const { Version, FunctionArn } = await lambda.send(new PublishVersionCommand({
    FunctionName: functionName
  }));
  
  console.log(`✅ Published version ${Version}: ${FunctionArn}`);
  return FunctionArn!;
}

async function main() {
  console.log('🚀 Deploying Lambda@Edge Functions\n');
  
  try {
    // 1. Ensure IAM role exists
    const roleArn = await ensureRole();
    
    // 2. Build functions
    const viewerRequestZip = await buildFunction('viewer-request');
    const originResponseZip = await buildFunction('origin-response');
    
    // 3. Deploy functions
    const viewerRequestArn = await deployFunction(
      VIEWER_REQUEST_FUNCTION,
      roleArn,
      viewerRequestZip
    );
    
    const originResponseArn = await deployFunction(
      ORIGIN_RESPONSE_FUNCTION,
      roleArn,
      originResponseZip
    );
    
    // 4. Save ARNs to file
    const arns = {
      viewerRequest: viewerRequestArn,
      originResponse: originResponseArn,
      distributionId: 'E21VMD5A9KDBOO',
      timestamp: new Date().toISOString()
    };
    
    const arnsPath = join(process.cwd(), '.kiro', 'specs', 'performance-optimization-aws', 'lambda-edge-arns.json');
    writeFileSync(arnsPath, JSON.stringify(arns, null, 2));
    
    console.log('\n✅ Deployment Complete!\n');
    console.log('📋 Function ARNs:');
    console.log(`   Viewer Request:  ${viewerRequestArn}`);
    console.log(`   Origin Response: ${originResponseArn}`);
    console.log(`\n💾 ARNs saved to: ${arnsPath}`);
    console.log('\n📝 Next Steps:');
    console.log('1. Attach these functions to CloudFront distribution E21VMD5A9KDBOO');
    console.log('2. Wait 15-20 minutes for CloudFront to deploy');
    console.log('3. Test the functions with real traffic');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

main();
