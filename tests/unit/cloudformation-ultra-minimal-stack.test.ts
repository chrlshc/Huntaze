/**
 * Tests for Ultra Minimal CloudFormation Stack
 * Tests the infrastructure template validation and resource configuration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Ultra Minimal Stack', () => {
  let stackTemplate: any;
  const templatePath = path.join(process.cwd(), 'infra/ultra-minimal-stack.yaml');

  beforeEach(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    stackTemplate = yaml.parse(templateContent);
  });

  describe('Template Structure', () => {
    it('should have valid CloudFormation format version', () => {
      expect(stackTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have proper description', () => {
      expect(stackTemplate.Description).toBe('Huntaze OnlyFans - Ultra Minimal Infrastructure');
    });

    it('should contain required resources', () => {
      const expectedResources = [
        'HuntazeOfSessions',
        'HuntazeOfThreads', 
        'HuntazeOfMessages',
        'HuntazeEcsCluster'
      ];
      
      expectedResources.forEach(resource => {
        expect(stackTemplate.Resources).toHaveProperty(resource);
      });
    });

    it('should have proper outputs section', () => {
      const expectedOutputs = [
        'ClusterName',
        'SessionsTableName',
        'ThreadsTableName',
        'MessagesTableName'
      ];
      
      expectedOutputs.forEach(output => {
        expect(stackTemplate.Outputs).toHaveProperty(output);
      });
    });
  });

  describe('DynamoDB Tables Configuration', () => {
    it('should configure HuntazeOfSessions table correctly', () => {
      const sessionsTable = stackTemplate.Resources.HuntazeOfSessions;
      
      expect(sessionsTable.Type).toBe('AWS::DynamoDB::Table');
      expect(sessionsTable.Properties.TableName).toBe('huntaze-of-sessions');
      expect(sessionsTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(sessionsTable.Properties.TimeToLiveSpecification.Enabled).toBe(true);
      expect(sessionsTable.Properties.TimeToLiveSpecification.AttributeName).toBe('expiresAt');
      
      // Key schema validation
      expect(sessionsTable.Properties.KeySchema).toHaveLength(1);
      expect(sessionsTable.Properties.KeySchema[0]).toEqual({
        AttributeName: 'userId',
        KeyType: 'HASH'
      });
    });

    it('should configure HuntazeOfThreads table correctly', () => {
      const threadsTable = stackTemplate.Resources.HuntazeOfThreads;
      
      expect(threadsTable.Type).toBe('AWS::DynamoDB::Table');
      expect(threadsTable.Properties.TableName).toBe('huntaze-of-threads');
      expect(threadsTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      
      // Key schema validation - composite key
      expect(threadsTable.Properties.KeySchema).toHaveLength(2);
      expect(threadsTable.Properties.KeySchema).toContainEqual({
        AttributeName: 'userId',
        KeyType: 'HASH'
      });
      expect(threadsTable.Properties.KeySchema).toContainEqual({
        AttributeName: 'fanId',
        KeyType: 'RANGE'
      });
    });

    it('should configure HuntazeOfMessages table correctly', () => {
      const messagesTable = stackTemplate.Resources.HuntazeOfMessages;
      
      expect(messagesTable.Type).toBe('AWS::DynamoDB::Table');
      expect(messagesTable.Properties.TableName).toBe('huntaze-of-messages');
      expect(messagesTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(messagesTable.Properties.TimeToLiveSpecification.Enabled).toBe(true);
      expect(messagesTable.Properties.TimeToLiveSpecification.AttributeName).toBe('expiresAt');
      
      // Key schema validation
      expect(messagesTable.Properties.KeySchema).toHaveLength(1);
      expect(messagesTable.Properties.KeySchema[0]).toEqual({
        AttributeName: 'taskId',
        KeyType: 'HASH'
      });
    });

    it('should not include KMS encryption (ultra minimal)', () => {
      const tables = ['HuntazeOfSessions', 'HuntazeOfThreads', 'HuntazeOfMessages'];
      
      tables.forEach(tableName => {
        const table = stackTemplate.Resources[tableName];
        expect(table.Properties).not.toHaveProperty('SSESpecification');
      });
    });

    it('should not include point-in-time recovery (ultra minimal)', () => {
      const tables = ['HuntazeOfSessions', 'HuntazeOfThreads', 'HuntazeOfMessages'];
      
      tables.forEach(tableName => {
        const table = stackTemplate.Resources[tableName];
        expect(table.Properties).not.toHaveProperty('PointInTimeRecoverySpecification');
      });
    });
  });

  describe('ECS Cluster Configuration', () => {
    it('should configure ECS cluster correctly', () => {
      const ecsCluster = stackTemplate.Resources.HuntazeEcsCluster;
      
      expect(ecsCluster.Type).toBe('AWS::ECS::Cluster');
      expect(ecsCluster.Properties.ClusterName).toBe('huntaze-of-fargate');
    });

    it('should not include container insights (ultra minimal)', () => {
      const ecsCluster = stackTemplate.Resources.HuntazeEcsCluster;
      expect(ecsCluster.Properties).not.toHaveProperty('ClusterSettings');
    });
  });

  describe('Outputs Configuration', () => {
    it('should export cluster name correctly', () => {
      const clusterOutput = stackTemplate.Outputs.ClusterName;
      
      expect(clusterOutput.Description).toBe('ECS Cluster Name');
      expect(clusterOutput.Value).toEqual({ Ref: 'HuntazeEcsCluster' });
      expect(clusterOutput.Export.Name).toBe('HuntazeEcsClusterName');
    });

    it('should export all table names correctly', () => {
      const tableOutputs = [
        { key: 'SessionsTableName', resource: 'HuntazeOfSessions', exportName: 'HuntazeOfSessionsTable' },
        { key: 'ThreadsTableName', resource: 'HuntazeOfThreads', exportName: 'HuntazeOfThreadsTable' },
        { key: 'MessagesTableName', resource: 'HuntazeOfMessages', exportName: 'HuntazeOfMessagesTable' }
      ];
      
      tableOutputs.forEach(({ key, resource, exportName }) => {
        const output = stackTemplate.Outputs[key];
        expect(output.Value).toEqual({ Ref: resource });
        expect(output.Export.Name).toBe(exportName);
      });
    });
  });

  describe('Resource Dependencies', () => {
    it('should have no explicit dependencies (minimal setup)', () => {
      Object.values(stackTemplate.Resources).forEach((resource: any) => {
        expect(resource).not.toHaveProperty('DependsOn');
      });
    });
  });

  describe('Cost Optimization', () => {
    it('should use PAY_PER_REQUEST billing for all tables', () => {
      const tables = ['HuntazeOfSessions', 'HuntazeOfThreads', 'HuntazeOfMessages'];
      
      tables.forEach(tableName => {
        const table = stackTemplate.Resources[tableName];
        expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
        expect(table.Properties).not.toHaveProperty('ProvisionedThroughput');
      });
    });

    it('should not include expensive features', () => {
      // No KMS keys
      expect(stackTemplate.Resources).not.toHaveProperty('HuntazeKmsKey');
      
      // No Secrets Manager
      expect(stackTemplate.Resources).not.toHaveProperty('OfCredentials');
      
      // No CloudWatch Log Groups
      expect(stackTemplate.Resources).not.toHaveProperty('BrowserWorkerLogs');
    });
  });

  describe('Template Validation', () => {
    it('should be valid YAML', () => {
      expect(() => {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        yaml.parse(templateContent);
      }).not.toThrow();
    });

    it('should have consistent naming convention', () => {
      const resourceNames = Object.keys(stackTemplate.Resources);
      
      resourceNames.forEach(name => {
        // Should start with 'Huntaze'
        expect(name).toMatch(/^Huntaze/);
        // Should be PascalCase
        expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    it('should have all required attribute definitions', () => {
      const sessionsTable = stackTemplate.Resources.HuntazeOfSessions;
      expect(sessionsTable.Properties.AttributeDefinitions).toContainEqual({
        AttributeName: 'userId',
        AttributeType: 'S'
      });

      const threadsTable = stackTemplate.Resources.HuntazeOfThreads;
      expect(threadsTable.Properties.AttributeDefinitions).toHaveLength(2);
      expect(threadsTable.Properties.AttributeDefinitions).toContainEqual({
        AttributeName: 'userId',
        AttributeType: 'S'
      });
      expect(threadsTable.Properties.AttributeDefinitions).toContainEqual({
        AttributeName: 'fanId',
        AttributeType: 'S'
      });

      const messagesTable = stackTemplate.Resources.HuntazeOfMessages;
      expect(messagesTable.Properties.AttributeDefinitions).toContainEqual({
        AttributeName: 'taskId',
        AttributeType: 'S'
      });
    });
  });
});