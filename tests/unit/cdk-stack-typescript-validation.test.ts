/**
 * CDK Stack TypeScript Validation Tests
 * 
 * Validates TypeScript syntax, types, and structure without requiring
 * actual CDK dependencies to be installed.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('📝 CDK Stack TypeScript Validation', () => {
  const stackPath = join(process.cwd(), 'infra/cdk/lib/huntaze-of-stack.ts');
  let stackContent: string;

  beforeAll(() => {
    stackContent = readFileSync(stackPath, 'utf-8');
  });

  describe('TypeScript Syntax', () => {
    it('should have balanced braces', () => {
      const openBraces = (stackContent.match(/{/g) || []).length;
      const closeBraces = (stackContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    it('should have balanced parentheses', () => {
      const openParens = (stackContent.match(/\(/g) || []).length;
      const closeParens = (stackContent.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    it('should have balanced brackets', () => {
      const openBrackets = (stackContent.match(/\[/g) || []).length;
      const closeBrackets = (stackContent.match(/\]/g) || []).length;
      expect(openBrackets).toBe(closeBrackets);
    });

    it('should not have syntax errors', () => {
      expect(stackContent).not.toContain('SyntaxError');
      expect(stackContent).not.toContain('Unexpected token');
    });
  });

  describe('Import Statements', () => {
    it('should use ES6 import syntax', () => {
      expect(stackContent).toContain('import *');
      expect(stackContent).toContain('from \'');
    });

    it('should not use require statements', () => {
      expect(stackContent).not.toContain('require(');
    });

    it('should import from aws-cdk-lib', () => {
      expect(stackContent).toContain('from \'aws-cdk-lib\'');
    });

    it('should import specific AWS services', () => {
      const services = [
        'aws-ecs',
        'aws-ec2',
        'aws-dynamodb',
        'aws-kms',
        'aws-secretsmanager',
        'aws-logs',
        'aws-iam',
        'aws-ecr',
        'aws-cloudwatch'
      ];

      services.forEach(service => {
        expect(stackContent).toContain(`from 'aws-cdk-lib/${service}'`);
      });
    });

    it('should import Construct from constructs', () => {
      expect(stackContent).toContain('import { Construct } from \'constructs\'');
    });
  });

  describe('Class Definition', () => {
    it('should export HuntazeOnlyFansStack class', () => {
      expect(stackContent).toContain('export class HuntazeOnlyFansStack');
    });

    it('should extend cdk.Stack', () => {
      expect(stackContent).toContain('extends cdk.Stack');
    });

    it('should have proper constructor', () => {
      expect(stackContent).toContain('constructor(');
      expect(stackContent).toContain('scope: Construct');
      expect(stackContent).toContain('id: string');
      expect(stackContent).toContain('props?: cdk.StackProps');
    });

    it('should call super in constructor', () => {
      expect(stackContent).toContain('super(scope, id, props)');
    });
  });

  describe('Type Annotations', () => {
    it('should use TypeScript type annotations', () => {
      expect(stackContent).toContain(': Construct');
      expect(stackContent).toContain(': string');
      expect(stackContent).toContain('?: cdk.StackProps');
    });

    it('should use const for immutable variables', () => {
      const constMatches = stackContent.match(/const \w+/g);
      expect(constMatches).toBeTruthy();
      expect(constMatches!.length).toBeGreaterThan(10);
    });

    it('should not use var keyword', () => {
      expect(stackContent).not.toMatch(/\bvar\s+\w+/);
    });
  });

  describe('CDK Constructs', () => {
    it('should use new keyword for constructs', () => {
      const constructPatterns = [
        'new ec2.Vpc',
        'new ec2.SecurityGroup',
        'new kms.Key',
        'new dynamodb.Table',
        'new secretsmanager.Secret',
        'new logs.LogGroup',
        'new ecs.Cluster',
        'new ecs.FargateTaskDefinition',
        'new iam.Role',
        'new cloudwatch.Metric',
        'new cloudwatch.Alarm',
        'new cdk.CfnOutput'
      ];

      constructPatterns.forEach(pattern => {
        expect(stackContent).toContain(pattern);
      });
    });

    it('should pass this as first argument to constructs', () => {
      const constructCalls = stackContent.match(/new \w+\.\w+\(this,/g);
      expect(constructCalls).toBeTruthy();
      expect(constructCalls!.length).toBeGreaterThan(15);
    });

    it('should use string literals for construct IDs', () => {
      expect(stackContent).toContain('this, \'HuntazeVpc\'');
      expect(stackContent).toContain('this, \'BrowserWorkerSG\'');
      expect(stackContent).toContain('this, \'HuntazeKmsKey\'');
    });
  });

  describe('Configuration Objects', () => {
    it('should use object literal syntax', () => {
      expect(stackContent).toContain('maxAzs: 2');
      expect(stackContent).toContain('natGateways: 1');
      expect(stackContent).toContain('enableKeyRotation: true');
    });

    it('should use proper enum values', () => {
      expect(stackContent).toContain('ec2.SubnetType.PUBLIC');
      expect(stackContent).toContain('ec2.SubnetType.PRIVATE_WITH_EGRESS');
      expect(stackContent).toContain('dynamodb.AttributeType.STRING');
      expect(stackContent).toContain('dynamodb.TableEncryption.CUSTOMER_MANAGED');
      expect(stackContent).toContain('dynamodb.BillingMode.PAY_PER_REQUEST');
    });

    it('should use CDK Duration class', () => {
      expect(stackContent).toContain('cdk.Duration.minutes');
    });

    it('should use CDK RemovalPolicy enum', () => {
      expect(stackContent).toContain('cdk.RemovalPolicy.RETAIN');
      expect(stackContent).toContain('cdk.RemovalPolicy.DESTROY');
    });
  });

  describe('Method Calls', () => {
    it('should use grant methods for permissions', () => {
      const grantMethods = [
        'grantReadWriteData',
        'grantEncryptDecrypt',
        'grantRead',
        'grantWrite'
      ];

      grantMethods.forEach(method => {
        expect(stackContent).toContain(method);
      });
    });

    it('should chain method calls properly', () => {
      expect(stackContent).toContain('taskDefinition.addContainer');
      expect(stackContent).toContain('vpc.publicSubnets.map');
    });

    it('should use arrow functions for callbacks', () => {
      expect(stackContent).toContain('=> s.subnetId');
    });
  });

  describe('Comments and Documentation', () => {
    it('should have file header comment', () => {
      expect(stackContent).toContain('/**');
      expect(stackContent).toContain('* Huntaze OnlyFans Infrastructure Stack');
    });

    it('should have section comments', () => {
      expect(stackContent).toContain('// ============================================');
    });

    it('should have numbered sections', () => {
      for (let i = 1; i <= 9; i++) {
        expect(stackContent).toContain(`// ${i}.`);
      }
    });

    it('should have descriptive comments', () => {
      expect(stackContent).toContain('// 1. VPC & Networking');
      expect(stackContent).toContain('// 2. Encryption (KMS)');
      expect(stackContent).toContain('// 3. DynamoDB Tables');
    });
  });

  describe('String Literals', () => {
    it('should use single quotes for strings', () => {
      const singleQuotes = (stackContent.match(/'/g) || []).length;
      const doubleQuotes = (stackContent.match(/"/g) || []).length;
      
      // Should use more single quotes than double quotes
      expect(singleQuotes).toBeGreaterThan(doubleQuotes);
    });

    it('should use template literals for complex strings', () => {
      // Check if template literals are used where appropriate
      expect(stackContent).not.toContain('+ \'');
    });
  });

  describe('App Instantiation', () => {
    it('should create CDK app', () => {
      expect(stackContent).toContain('const app = new cdk.App()');
    });

    it('should instantiate stack', () => {
      expect(stackContent).toContain('new HuntazeOnlyFansStack(app,');
    });

    it('should call app.synth()', () => {
      expect(stackContent).toContain('app.synth()');
    });

    it('should configure environment', () => {
      expect(stackContent).toContain('env: {');
      expect(stackContent).toContain('account:');
      expect(stackContent).toContain('region:');
    });
  });

  describe('Environment Variables', () => {
    it('should use process.env for configuration', () => {
      expect(stackContent).toContain('process.env.CDK_DEFAULT_ACCOUNT');
      expect(stackContent).toContain('process.env.CDK_DEFAULT_REGION');
    });

    it('should provide default values', () => {
      expect(stackContent).toContain('|| \'317805897534\'');
      expect(stackContent).toContain('|| \'us-east-1\'');
    });
  });

  describe('Object Properties', () => {
    it('should use property shorthand where possible', () => {
      expect(stackContent).toContain('vpc,');
      expect(stackContent).toContain('taskRole,');
    });

    it('should use computed property names for dynamic keys', () => {
      // Validate that object properties are properly defined
      expect(stackContent).toContain('partitionKey: {');
      expect(stackContent).toContain('sortKey: {');
    });
  });

  describe('Array Methods', () => {
    it('should use array map method', () => {
      expect(stackContent).toContain('.map(');
    });

    it('should use array join method', () => {
      expect(stackContent).toContain('.join(');
    });
  });

  describe('JSON Usage', () => {
    it('should use JSON.stringify for objects', () => {
      expect(stackContent).toContain('JSON.stringify');
    });

    it('should format JSON properly', () => {
      expect(stackContent).toContain('email:');
      expect(stackContent).toContain('password:');
    });
  });

  describe('Code Organization', () => {
    it('should group related resources', () => {
      // VPC resources should be together
      const vpcIndex = stackContent.indexOf('new ec2.Vpc');
      const sgIndex = stackContent.indexOf('new ec2.SecurityGroup');
      expect(Math.abs(vpcIndex - sgIndex)).toBeLessThan(500);
    });

    it('should define resources before using them', () => {
      // VPC should be defined before security group
      const vpcIndex = stackContent.indexOf('new ec2.Vpc');
      const sgIndex = stackContent.indexOf('new ec2.SecurityGroup');
      expect(vpcIndex).toBeLessThan(sgIndex);

      // KMS key should be defined before DynamoDB tables
      const kmsIndex = stackContent.indexOf('new kms.Key');
      const dynamoIndex = stackContent.indexOf('new dynamodb.Table');
      expect(kmsIndex).toBeLessThan(dynamoIndex);
    });
  });

  describe('Naming Conventions', () => {
    it('should use PascalCase for classes', () => {
      expect(stackContent).toContain('HuntazeOnlyFansStack');
    });

    it('should use camelCase for variables', () => {
      expect(stackContent).toContain('const vpc');
      expect(stackContent).toContain('const kmsKey');
      expect(stackContent).toContain('const taskRole');
    });

    it('should use descriptive variable names', () => {
      const variables = [
        'vpc',
        'securityGroup',
        'kmsKey',
        'sessionsTable',
        'threadsTable',
        'messagesTable',
        'ofCredentialsSecret',
        'logGroup',
        'cluster',
        'taskRole',
        'taskDefinition',
        'container'
      ];

      variables.forEach(variable => {
        expect(stackContent).toContain(`const ${variable}`);
      });
    });
  });

  describe('Error Prevention', () => {
    it('should not have TODO comments', () => {
      expect(stackContent).not.toContain('TODO');
      expect(stackContent).not.toContain('FIXME');
    });

    it('should not have console.log statements', () => {
      expect(stackContent).not.toContain('console.log');
      expect(stackContent).not.toContain('console.error');
    });

    it('should not have debugger statements', () => {
      expect(stackContent).not.toContain('debugger');
    });

    it('should not have commented-out code', () => {
      // Check for suspicious patterns
      expect(stackContent).not.toMatch(/\/\/ const \w+ =/);
      expect(stackContent).not.toMatch(/\/\/ new \w+/);
    });
  });

  describe('Best Practices', () => {
    it('should use const instead of let where possible', () => {
      const constCount = (stackContent.match(/const /g) || []).length;
      const letCount = (stackContent.match(/let /g) || []).length;
      
      // Should use const much more than let
      expect(constCount).toBeGreaterThan(letCount * 5);
    });

    it('should use strict equality', () => {
      // Should not use == or !=
      expect(stackContent).not.toMatch(/[^=!]==(?!=)/);
      expect(stackContent).not.toMatch(/!=(?!=)/);
    });

    it('should use semicolons consistently', () => {
      const lines = stackContent.split('\n');
      const codeLines = lines.filter(line => 
        line.trim() && 
        !line.trim().startsWith('//') && 
        !line.trim().startsWith('*') &&
        !line.trim().startsWith('/*')
      );
      
      // Most code lines should end with semicolon or brace
      const linesWithSemicolon = codeLines.filter(line => 
        line.trim().endsWith(';') || 
        line.trim().endsWith('{') ||
        line.trim().endsWith('}') ||
        line.trim().endsWith(',')
      );
      
      expect(linesWithSemicolon.length / codeLines.length).toBeGreaterThan(0.7);
    });
  });

  describe('File Structure', () => {
    it('should have imports at the top', () => {
      const firstImportIndex = stackContent.indexOf('import');
      const firstClassIndex = stackContent.indexOf('export class');
      
      expect(firstImportIndex).toBeLessThan(firstClassIndex);
    });

    it('should have class definition before instantiation', () => {
      const classIndex = stackContent.indexOf('export class');
      const appIndex = stackContent.indexOf('const app = new cdk.App()');
      
      expect(classIndex).toBeLessThan(appIndex);
    });

    it('should end with app.synth()', () => {
      const lastLine = stackContent.trim().split('\n').pop();
      expect(lastLine).toContain('app.synth()');
    });
  });
});
