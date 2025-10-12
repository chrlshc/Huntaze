import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as cpactions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class HuntazeOfCiStack extends Stack {
  constructor(scope: cdk.App, id: string, props?: StackProps) {
    super(scope, id, props);

    // CodeCommit repo for the worker + infra code
    const repoName = process.env.OF_CC_REPO || 'huntaze-of-worker';
    const existingRepoName = process.env.OF_CC_REPO_EXISTING;
    const srcType = (process.env.OF_PIPELINE_SOURCE || 'CodeCommit').toLowerCase();
    let repo: codecommit.IRepository | undefined;
    let srcBucket: s3.Bucket | undefined;
    let srcKey: string | undefined;
    if (srcType === 'codecommit') {
      repo = existingRepoName
        ? codecommit.Repository.fromRepositoryName(this, 'OfRepoImported', existingRepoName)
        : new codecommit.Repository(this, 'OfRepo', {
            repositoryName: repoName,
            description: 'OF worker + infra (CDK) + scripts',
          });
    } else {
      // S3 fallback source
      srcBucket = new s3.Bucket(this, 'OfSourceBucket', {
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
      srcKey = process.env.OF_S3_SOURCE_KEY || 'source.zip';
      new cdk.CfnOutput(this, 'SourceBucketName', { value: srcBucket.bucketName });
      new cdk.CfnOutput(this, 'SourceObjectKey', { value: srcKey });
    }

    // CodeBuild: synthesize infra (CDK) and export template to dist/
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: 'HuntazeOfWorker-Build',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      environmentVariables: {
        USE_ECR_IMAGE: { value: '1' },
        ECR_REPOSITORY: { value: 'huntaze/of-browser-worker' },
        ECR_IMAGE_TAG: { value: 'main' },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: 20 },
            commands: [
              'npm ci --prefix infra/cdk',
            ],
          },
          build: {
            commands: [
              'npm run build --prefix infra/cdk',
              'echo "USE_ECR_IMAGE=$USE_ECR_IMAGE ECR_REPOSITORY=$ECR_REPOSITORY ECR_IMAGE_TAG=$ECR_IMAGE_TAG"',
              'export PATH="$PATH:$(pwd)/infra/cdk/node_modules/.bin"',
              'npm exec --prefix infra/cdk -- cdk -a "node ./infra/cdk/dist/bin/huntaze-of.js" synth -o dist',
            ],
          },
        },
        artifacts: {
          files: [ 'dist/**/*', 'scripts/of-load-test.js' ],
        },
      }),
      timeout: Duration.minutes(30),
    });

    // CodeBuild for load testing stage
    const loadEnv = {
      CLUSTER_ARN: { type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE, value: '/huntaze/of/clusterArn' },
      TASK_DEF_ARN: { type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE, value: '/huntaze/of/taskDefArn' },
      SUBNETS: { type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE, value: '/huntaze/of/subnets' },
      SECURITY_GROUP: { type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE, value: '/huntaze/of/securityGroup' },
      USER_IDS: { type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE, value: '/huntaze/of/userIds' },
      ACTION: { value: 'login' },
      COUNT: { value: '20' },
      CONCURRENCY: { value: '5' },
    } as Record<string, codebuild.BuildEnvironmentVariable>;

    const loadTestProject = new codebuild.Project(this, 'LoadTestProject', {
      projectName: 'HuntazeOfLoadTest',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: loadEnv,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: 20 },
            commands: [ 'npm install --no-audit --no-fund' ],
          },
          build: {
            commands: [
              'node scripts/of-load-test.js --action ${ACTION} --count ${COUNT} --concurrency ${CONCURRENCY} --cluster ${CLUSTER_ARN} --task-def ${TASK_DEF_ARN} --subnets ${SUBNETS} --security-group ${SECURITY_GROUP} --user-ids ${USER_IDS} || true'
            ],
          },
        },
        reports: {
          LoadTestReport: {
            'base-directory': 'reports',
            files: [ '**/*' ],
          },
        },
      }),
      timeout: Duration.minutes(60),
    });

    // Permissions for load test CodeBuild to launch ECS tasks and read SSM params
    loadTestProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecs:RunTask', 'ecs:DescribeTasks', 'iam:PassRole'],
      resources: ['*'],
    }));
    loadTestProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters'],
      resources: ['*'],
    }));

    // Pipeline artifacts
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Pipeline definition
    const pipeline = new codepipeline.Pipeline(this, 'OfPipeline', {
      pipelineName: 'HuntazeOfWorker-Pipeline',
      restartExecutionOnUpdate: true,
    });

    if (srcType === 'codecommit') {
      pipeline.addStage({
        stageName: 'Source',
        actions: [
          new cpactions.CodeCommitSourceAction({
            actionName: 'CodeCommit',
            repository: repo as codecommit.IRepository,
            branch: 'main',
            output: sourceOutput,
          }),
        ],
      });
    } else {
      pipeline.addStage({
        stageName: 'Source',
        actions: [
          new cpactions.S3SourceAction({
            actionName: 'S3Source',
            bucket: srcBucket!,
            bucketKey: srcKey!,
            output: sourceOutput,
            trigger: cpactions.S3Trigger.NONE,
          }),
        ],
      });
    }

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new cpactions.CodeBuildAction({
          actionName: 'Synth',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // CloudFormation deploy using synthesized template from dist/
    pipeline.addStage({
      stageName: 'DeployInfra',
      actions: [
        new cpactions.CloudFormationCreateUpdateStackAction({
          actionName: 'CFN_Deploy',
          stackName: 'HuntazeOfStack',
          adminPermissions: true,
          templatePath: buildOutput.atPath('dist/HuntazeOfStack.template.json'),
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'LoadTest',
      actions: [
        new cpactions.CodeBuildAction({
          actionName: 'RunLoadTest',
          project: loadTestProject,
          input: sourceOutput,
        }),
      ],
    });
  }
}
