/**
 * Unit Tests for VPC Endpoints Cost Optimization
 * Tests VPC endpoint creation and configuration for S3 and DynamoDB
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock AWS SDK clients
const mockEC2Client = {
  send: vi.fn()
};

const mockCloudWatchClient = {
  send: vi.fn()
};

vi.mock('@aws-sdk/client-ec2', () => ({
  EC2Client: vi.fn(() => mockEC2Client),
  CreateVpcEndpointCommand: vi.fn((params) => params),
  DescribeVpcEndpointsCommand: vi.fn((params) => params),
  ModifyVpcEndpointCommand: vi.fn((params) => params),
  DeleteVpcEndpointCommand: vi.fn((params) => params),
  DescribeRouteTablesCommand: vi.fn((params) => params)
}));

vi.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: vi.fn(() => mockCloudWatchClient),
  PutMetricDataCommand: vi.fn((params) => params)
}));

// Types
interface VPCEndpointConfig {
  vpcId: string;
  serviceName: string;
  endpointType: 'Gateway' | 'Interface';
  routeTableIds?: string[];
  subnetIds?: string[];
  securityGroupIds?: string[];
  policy?: string;
}

interface VPCEndpoint {
  vpcEndpointId: string;
  vpcId: string;
  serviceName: string;
  state: 'pending' | 'available' | 'deleting' | 'deleted';
  endpointType: string;
  routeTableIds?: string[];
  prefixListId?: string;
  creationTimestamp: Date;
}

interface CostSavings {
  natGatewaySavings: number;
  dataTransferSavings: number;
  totalMonthlySavings: number;
  estimatedAnnualSavings: number;
}

// Mock implementation of VPCEndpointManager
class VPCEndpointManager {
  constructor(
    private ec2Client = mockEC2Client,
    private cloudWatchClient = mockCloudWatchClient,
    private region: string = 'us-east-1'
  ) {}

  async createS3GatewayEndpoint(config: VPCEndpointConfig): Promise<VPCEndpoint> {
    if (!config.vpcId) {
      throw new Error('VPC ID is required');
    }

    if (!config.routeTableIds || config.routeTableIds.length === 0) {
      throw new Error('At least one route table ID is required for gateway endpoints');
    }

    const serviceName = `com.amazonaws.${this.region}.s3`;

    const response = await this.ec2Client.send({
      VpcId: config.vpcId,
      ServiceName: serviceName,
      VpcEndpointType: 'Gateway',
      RouteTableIds: config.routeTableIds,
      PolicyDocument: config.policy
    });

    return {
      vpcEndpointId: response.VpcEndpoint?.VpcEndpointId || 'vpce-s3-test',
      vpcId: config.vpcId,
      serviceName,
      state: 'available',
      endpointType: 'Gateway',
      routeTableIds: config.routeTableIds,
      prefixListId: 'pl-s3-test',
      creationTimestamp: new Date()
    };
  }

  async createDynamoDBGatewayEndpoint(config: VPCEndpointConfig): Promise<VPCEndpoint> {
    if (!config.vpcId) {
      throw new Error('VPC ID is required');
    }

    if (!config.routeTableIds || config.routeTableIds.length === 0) {
      throw new Error('At least one route table ID is required for gateway endpoints');
    }

    const serviceName = `com.amazonaws.${this.region}.dynamodb`;

    const response = await this.ec2Client.send({
      VpcId: config.vpcId,
      ServiceName: serviceName,
      VpcEndpointType: 'Gateway',
      RouteTableIds: config.routeTableIds,
      PolicyDocument: config.policy
    });

    return {
      vpcEndpointId: response.VpcEndpoint?.VpcEndpointId || 'vpce-dynamodb-test',
      vpcId: config.vpcId,
      serviceName,
      state: 'available',
      endpointType: 'Gateway',
      routeTableIds: config.routeTableIds,
      prefixListId: 'pl-dynamodb-test',
      creationTimestamp: new Date()
    };
  }

  async describeVpcEndpoints(vpcId: string): Promise<VPCEndpoint[]> {
    const response = await this.ec2Client.send({
      Filters: [
        { Name: 'vpc-id', Values: [vpcId] }
      ]
    });

    return response.VpcEndpoints || [];
  }

  async deleteVpcEndpoint(vpcEndpointId: string): Promise<void> {
    await this.ec2Client.send({
      VpcEndpointIds: [vpcEndpointId]
    });
  }

  async validateEndpointConnectivity(vpcEndpointId: string): Promise<boolean> {
    const endpoints = await this.describeVpcEndpoints('vpc-test');
    const endpoint = endpoints.find(e => e.vpcEndpointId === vpcEndpointId);
    
    return endpoint?.state === 'available';
  }

  async calculateCostSavings(
    dataTransferGB: number,
    natGatewayHours: number
  ): Promise<CostSavings> {
    // NAT Gateway pricing: $0.045/hour + $0.045/GB processed
    const natGatewayCost = (natGatewayHours * 0.045) + (dataTransferGB * 0.045);
    
    // VPC Endpoint pricing: Free for gateway endpoints
    const vpcEndpointCost = 0;
    
    const monthlySavings = natGatewayCost - vpcEndpointCost;
    
    return {
      natGatewaySavings: Math.round(natGatewayCost * 100) / 100,
      dataTransferSavings: Math.round(dataTransferGB * 0.045 * 100) / 100,
      totalMonthlySavings: Math.round(monthlySavings * 100) / 100,
      estimatedAnnualSavings: Math.round(monthlySavings * 12 * 100) / 100
    };
  }

  async trackCostMetrics(savings: CostSavings): Promise<void> {
    await this.cloudWatchClient.send({
      Namespace: 'Huntaze/CostOptimization',
      MetricData: [
        {
          MetricName: 'VPCEndpointSavings',
          Value: savings.totalMonthlySavings,
          Unit: 'None',
          Timestamp: new Date()
        },
        {
          MetricName: 'NATGatewaySavings',
          Value: savings.natGatewaySavings,
          Unit: 'None',
          Timestamp: new Date()
        }
      ]
    });
  }

  generateEndpointPolicy(resourceArns: string[]): string {
    return JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:ListBucket',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:Query'
          ],
          Resource: resourceArns
        }
      ]
    });
  }
}

describe('VPCEndpointManager', () => {
  let manager: VPCEndpointManager;

  beforeEach(() => {
    manager = new VPCEndpointManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createS3GatewayEndpoint', () => {
    it('should create S3 gateway endpoint successfully', async () => {
      mockEC2Client.send.mockResolvedValue({
        VpcEndpoint: {
          VpcEndpointId: 'vpce-s3-12345',
          VpcId: 'vpc-test',
          ServiceName: 'com.amazonaws.us-east-1.s3',
          State: 'available',
          VpcEndpointType: 'Gateway',
          RouteTableIds: ['rtb-private-1', 'rtb-private-2']
        }
      });

      const config: VPCEndpointConfig = {
        vpcId: 'vpc-test',
        serviceName: 'com.amazonaws.us-east-1.s3',
        endpointType: 'Gateway',
        routeTableIds: ['rtb-private-1', 'rtb-private-2']
      };

      const endpoint = await manager.createS3GatewayEndpoint(config);

      expect(endpoint.vpcEndpointId).toBe('vpce-s3-12345');
      expect(endpoint.serviceName).toBe('com.amazonaws.us-east-1.s3');
      expect(endpoint.endpointType).toBe('Gateway');
      expect(endpoint.routeTableIds).toEqual(['rtb-private-1', 'rtb-private-2']);
      expect(endpoint.state).toBe('available');

      expect(mockEC2Client.send).toHaveBeenCalledWith({
        VpcId: 'vpc-test',
        ServiceName: 'com.amazonaws.us-east-1.s3',
        VpcEndpointType: 'Gateway',
        RouteTableIds: ['rtb-private-1', 'rtb-private-2'],
        PolicyDocument: undefined
      });
    });

    it('should throw error if VPC ID is missing', async () => {
      const config: VPCEndpointConfig = {
        vpcId: '',
        serviceName: 'com.amazonaws.us-east-1.s3',
        endpointType: 'Gateway',
        routeTableIds: ['rtb-private-1']
      };

      await expect(manager.createS3GatewayEndpoint(config)).rejects.toThrow('VPC ID is required');
    });

    it('should throw error if route table IDs are missing', async () => {
      const config: VPCEndpointConfig = {
        vpcId: 'vpc-test',
        serviceName: 'com.amazonaws.us-east-1.s3',
        endpointType: 'Gateway',
        routeTableIds: []
      };

      await expect(manager.createS3GatewayEndpoint(config)).rejects.toThrow(
        'At least one route table ID is required for gateway endpoints'
      );
    });

    it('should create endpoint with custom policy', async () => {
      mockEC2Client.send.mockResolvedValue({
        VpcEndpoint: {
          VpcEndpointId: 'vpce-s3-policy',
          VpcId: 'vpc-test',
          ServiceName: 'com.amazonaws.us-east-1.s3',
          State: 'available'
        }
      });

      const policy = manager.generateEndpointPolicy(['arn:aws:s3:::huntaze-*']);

      const config: VPCEndpointConfig = {
        vpcId: 'vpc-test',
        serviceName: 'com.amazonaws.us-east-1.s3',
        endpointType: 'Gateway',
        routeTableIds: ['rtb-private-1'],
        policy
      };

      await manager.createS3GatewayEndpoint(config);

      expect(mockEC2Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          PolicyDocument: expect.stringContaining('huntaze-*')
        })
      );
    });
  });

  describe('createDynamoDBGatewayEndpoint', () => {
    it('should create DynamoDB gateway endpoint successfully', async () => {
      mockEC2Client.send.mockResolvedValue({
        VpcEndpoint: {
          VpcEndpointId: 'vpce-dynamodb-12345',
          VpcId: 'vpc-test',
          ServiceName: 'com.amazonaws.us-east-1.dynamodb',
          State: 'available',
          VpcEndpointType: 'Gateway',
          RouteTableIds: ['rtb-private-1']
        }
      });

      const config: VPCEndpointConfig = {
        vpcId: 'vpc-test',
        serviceName: 'com.amazonaws.us-east-1.dynamodb',
        endpointType: 'Gateway',
        routeTableIds: ['rtb-private-1']
      };

      const endpoint = await manager.createDynamoDBGatewayEndpoint(config);

      expect(endpoint.vpcEndpointId).toBe('vpce-dynamodb-12345');
      expect(endpoint.serviceName).toBe('com.amazonaws.us-east-1.dynamodb');
      expect(endpoint.endpointType).toBe('Gateway');
      expect(endpoint.state).toBe('available');
    });

    it('should handle multiple route tables', async () => {
      mockEC2Client.send.mockResolvedValue({
        VpcEndpoint: {
          VpcEndpointId: 'vpce-dynamodb-multi',
          RouteTableIds: ['rtb-1', 'rtb-2', 'rtb-3']
        }
      });

      const config: VPCEndpointConfig = {
        vpcId: 'vpc-test',
        serviceName: 'com.amazonaws.us-east-1.dynamodb',
        endpointType: 'Gateway',
        routeTableIds: ['rtb-1', 'rtb-2', 'rtb-3']
      };

      const endpoint = await manager.createDynamoDBGatewayEndpoint(config);

      expect(endpoint.routeTableIds).toHaveLength(3);
      expect(mockEC2Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          RouteTableIds: ['rtb-1', 'rtb-2', 'rtb-3']
        })
      );
    });
  });

  describe('describeVpcEndpoints', () => {
    it('should list all VPC endpoints in a VPC', async () => {
      mockEC2Client.send.mockResolvedValue({
        VpcEndpoints: [
          {
            VpcEndpointId: 'vpce-s3-1',
            ServiceName: 'com.amazonaws.us-east-1.s3',
            State: 'available'
          },
          {
            VpcEndpointId: 'vpce-dynamodb-1',
            ServiceName: 'com.amazonaws.us-east-1.dynamodb',
            State: 'available'
          }
        ]
      });

      const endpoints = await manager.describeVpcEndpoints('vpc-test');

      expect(endpoints).toHaveLength(2);
      expect(endpoints[0].VpcEndpointId).toBe('vpce-s3-1');
      expect(endpoints[1].VpcEndpointId).toBe('vpce-dynamodb-1');

      expect(mockEC2Client.send).toHaveBeenCalledWith({
        Filters: [
          { Name: 'vpc-id', Values: ['vpc-test'] }
        ]
      });
    });

    it('should return empty array if no endpoints exist', async () => {
      mockEC2Client.send.mockResolvedValue({
        VpcEndpoints: []
      });

      const endpoints = await manager.describeVpcEndpoints('vpc-empty');

      expect(endpoints).toHaveLength(0);
    });
  });

  describe('validateEndpointConnectivity', () => {
    it('should validate endpoint is available', async () => {
      mockEC2Client.send.mockResolvedValue({
        VpcEndpoints: [
          {
            vpcEndpointId: 'vpce-test',
            state: 'available'
          }
        ]
      });

      const isValid = await manager.validateEndpointConnectivity('vpce-test');

      expect(isValid).toBe(true);
    });

    it('should return false if endpoint is not available', async () => {
      mockEC2Client.send.mockResolvedValue({
        VpcEndpoints: [
          {
            vpcEndpointId: 'vpce-test',
            state: 'pending'
          }
        ]
      });

      const isValid = await manager.validateEndpointConnectivity('vpce-test');

      expect(isValid).toBe(false);
    });
  });

  describe('calculateCostSavings', () => {
    it('should calculate cost savings correctly', async () => {
      // Scenario: 1000 GB data transfer, 730 hours NAT Gateway (1 month)
      const savings = await manager.calculateCostSavings(1000, 730);

      // NAT Gateway: (730 * $0.045) + (1000 * $0.045) = $32.85 + $45 = $77.85
      expect(savings.natGatewaySavings).toBe(77.85);
      expect(savings.dataTransferSavings).toBe(45);
      expect(savings.totalMonthlySavings).toBe(77.85);
      expect(savings.estimatedAnnualSavings).toBe(934.2);
    });

    it('should calculate savings for minimal usage', async () => {
      // Scenario: 100 GB data transfer, 730 hours NAT Gateway
      const savings = await manager.calculateCostSavings(100, 730);

      expect(savings.natGatewaySavings).toBe(37.35);
      expect(savings.dataTransferSavings).toBe(4.5);
      expect(savings.totalMonthlySavings).toBe(37.35);
    });

    it('should calculate savings for high usage', async () => {
      // Scenario: 5000 GB data transfer, 730 hours NAT Gateway
      const savings = await manager.calculateCostSavings(5000, 730);

      expect(savings.natGatewaySavings).toBe(257.85);
      expect(savings.dataTransferSavings).toBe(225);
      expect(savings.totalMonthlySavings).toBe(257.85);
      expect(savings.estimatedAnnualSavings).toBe(3094.2);
    });
  });

  describe('trackCostMetrics', () => {
    it('should send cost metrics to CloudWatch', async () => {
      mockCloudWatchClient.send.mockResolvedValue({});

      const savings: CostSavings = {
        natGatewaySavings: 77.85,
        dataTransferSavings: 45,
        totalMonthlySavings: 77.85,
        estimatedAnnualSavings: 934.2
      };

      await manager.trackCostMetrics(savings);

      expect(mockCloudWatchClient.send).toHaveBeenCalledWith({
        Namespace: 'Huntaze/CostOptimization',
        MetricData: expect.arrayContaining([
          expect.objectContaining({
            MetricName: 'VPCEndpointSavings',
            Value: 77.85
          }),
          expect.objectContaining({
            MetricName: 'NATGatewaySavings',
            Value: 77.85
          })
        ])
      });
    });

    it('should handle CloudWatch errors gracefully', async () => {
      mockCloudWatchClient.send.mockRejectedValue(new Error('CloudWatch unavailable'));

      const savings: CostSavings = {
        natGatewaySavings: 50,
        dataTransferSavings: 30,
        totalMonthlySavings: 50,
        estimatedAnnualSavings: 600
      };

      await expect(manager.trackCostMetrics(savings)).rejects.toThrow('CloudWatch unavailable');
    });
  });

  describe('generateEndpointPolicy', () => {
    it('should generate valid endpoint policy', () => {
      const resourceArns = [
        'arn:aws:s3:::huntaze-production/*',
        'arn:aws:dynamodb:us-east-1:123456789012:table/huntaze-*'
      ];

      const policy = manager.generateEndpointPolicy(resourceArns);
      const parsed = JSON.parse(policy);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(1);
      expect(parsed.Statement[0].Effect).toBe('Allow');
      expect(parsed.Statement[0].Resource).toEqual(resourceArns);
    });

    it('should include required actions in policy', () => {
      const policy = manager.generateEndpointPolicy(['arn:aws:s3:::test']);
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[0].Action).toContain('s3:GetObject');
      expect(parsed.Statement[0].Action).toContain('s3:PutObject');
      expect(parsed.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(parsed.Statement[0].Action).toContain('dynamodb:PutItem');
    });
  });

  describe('Error Handling', () => {
    it('should handle AWS API errors', async () => {
      mockEC2Client.send.mockRejectedValue(new Error('InvalidVpcID.NotFound'));

      const config: VPCEndpointConfig = {
        vpcId: 'vpc-invalid',
        serviceName: 'com.amazonaws.us-east-1.s3',
        endpointType: 'Gateway',
        routeTableIds: ['rtb-1']
      };

      await expect(manager.createS3GatewayEndpoint(config)).rejects.toThrow('InvalidVpcID.NotFound');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockEC2Client.send.mockRejectedValue(timeoutError);

      const config: VPCEndpointConfig = {
        vpcId: 'vpc-test',
        serviceName: 'com.amazonaws.us-east-1.s3',
        endpointType: 'Gateway',
        routeTableIds: ['rtb-1']
      };

      await expect(manager.createS3GatewayEndpoint(config)).rejects.toThrow('Network timeout');
    });
  });

  describe('Integration Scenarios', () => {
    it('should create both S3 and DynamoDB endpoints', async () => {
      mockEC2Client.send
        .mockResolvedValueOnce({
          VpcEndpoint: {
            VpcEndpointId: 'vpce-s3-integration',
            ServiceName: 'com.amazonaws.us-east-1.s3'
          }
        })
        .mockResolvedValueOnce({
          VpcEndpoint: {
            VpcEndpointId: 'vpce-dynamodb-integration',
            ServiceName: 'com.amazonaws.us-east-1.dynamodb'
          }
        });

      const config: VPCEndpointConfig = {
        vpcId: 'vpc-test',
        serviceName: '',
        endpointType: 'Gateway',
        routeTableIds: ['rtb-private-1', 'rtb-private-2']
      };

      const s3Endpoint = await manager.createS3GatewayEndpoint(config);
      const dynamoEndpoint = await manager.createDynamoDBGatewayEndpoint(config);

      expect(s3Endpoint.vpcEndpointId).toBe('vpce-s3-integration');
      expect(dynamoEndpoint.vpcEndpointId).toBe('vpce-dynamodb-integration');
      expect(mockEC2Client.send).toHaveBeenCalledTimes(2);
    });

    it('should calculate total savings for both endpoints', async () => {
      // S3 traffic: 800 GB/month
      // DynamoDB traffic: 200 GB/month
      // Total: 1000 GB/month
      const savings = await manager.calculateCostSavings(1000, 730);

      // Expected savings: ~$77.85/month
      expect(savings.totalMonthlySavings).toBeGreaterThan(70);
      expect(savings.estimatedAnnualSavings).toBeGreaterThan(900);
    });
  });
});
