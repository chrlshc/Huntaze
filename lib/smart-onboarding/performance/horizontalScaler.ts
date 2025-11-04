import { 
  ScalingMetrics, 
  ServiceInstance, 
  LoadBalancingStrategy,
  AutoScalingConfig,
  PerformanceMetrics 
} from '../types'

export class HorizontalScaler {
  private serviceInstances: Map<string, ServiceInstance[]> = new Map()
  private scalingMetrics: Map<string, ScalingMetrics> = new Map()
  private autoScalingConfigs: Map<string, AutoScalingConfig> = new Map()
  private loadBalancers: Map<string, LoadBalancingStrategy> = new Map()

  constructor() {
    this.initializeScalingConfigs()
    this.initializeLoadBalancers()
  }

  async initialize(): Promise<void> {
    await this.setupServiceDiscovery()
    await this.initializeHealthChecks()
    await this.startAutoScalingMonitoring()
    console.log('Horizontal Scaler initialized successfully')
  }

  private initializeScalingConfigs(): void {
    // ML Personalization Engine Scaling Config
    this.autoScalingConfigs.set('ml-personalization-engine', {
      minInstances: 2,
      maxInstances: 10,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 80,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
      scaleUpCooldown: 300, // 5 minutes
      scaleDownCooldown: 600, // 10 minutes
      metricsWindow: 300, // 5 minutes
      enabled: true
    })

    // Behavioral Analytics Service Scaling Config
    this.autoScalingConfigs.set('behavioral-analytics-service', {
      minInstances: 3,
      maxInstances: 15,
      targetCpuUtilization: 75,
      targetMemoryUtilization: 85,
      scaleUpThreshold: 85,
      scaleDownThreshold: 25,
      scaleUpCooldown: 180, // 3 minutes
      scaleDownCooldown: 900, // 15 minutes
      metricsWindow: 180, // 3 minutes
      enabled: true
    })

    // Intervention Engine Scaling Config
    this.autoScalingConfigs.set('intervention-engine', {
      minInstances: 2,
      maxInstances: 8,
      targetCpuUtilization: 65,
      targetMemoryUtilization: 75,
      scaleUpThreshold: 75,
      scaleDownThreshold: 35,
      scaleUpCooldown: 240, // 4 minutes
      scaleDownCooldown: 720, // 12 minutes
      metricsWindow: 240, // 4 minutes
      enabled: true
    })

    // Smart Onboarding Service Scaling Config
    this.autoScalingConfigs.set('smart-onboarding-service', {
      minInstances: 3,
      maxInstances: 12,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 80,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
      scaleUpCooldown: 300, // 5 minutes
      scaleDownCooldown: 600, // 10 minutes
      metricsWindow: 300, // 5 minutes
      enabled: true
    })
  }

  private initializeLoadBalancers(): void {
    // Round Robin for ML Personalization Engine
    this.loadBalancers.set('ml-personalization-engine', {
      algorithm: 'round-robin',
      healthCheckEnabled: true,
      healthCheckInterval: 30,
      failureThreshold: 3,
      recoveryThreshold: 2,
      sessionAffinity: false
    })

    // Weighted Round Robin for Behavioral Analytics (CPU-intensive)
    this.loadBalancers.set('behavioral-analytics-service', {
      algorithm: 'weighted-round-robin',
      healthCheckEnabled: true,
      healthCheckInterval: 15,
      failureThreshold: 2,
      recoveryThreshold: 1,
      sessionAffinity: false,
      weights: new Map() // Will be dynamically calculated
    })

    // Least Connections for Intervention Engine (stateful operations)
    this.loadBalancers.set('intervention-engine', {
      algorithm: 'least-connections',
      healthCheckEnabled: true,
      healthCheckInterval: 20,
      failureThreshold: 3,
      recoveryThreshold: 2,
      sessionAffinity: true,
      sessionAffinityDuration: 1800 // 30 minutes
    })

    // Consistent Hashing for Smart Onboarding Service (user sessions)
    this.loadBalancers.set('smart-onboarding-service', {
      algorithm: 'consistent-hashing',
      healthCheckEnabled: true,
      healthCheckInterval: 30,
      failureThreshold: 2,
      recoveryThreshold: 1,
      sessionAffinity: true,
      sessionAffinityDuration: 3600, // 1 hour
      hashKey: 'user_id'
    })
  }

  // Service Instance Management
  async registerServiceInstance(
    serviceName: string, 
    instance: ServiceInstance
  ): Promise<void> {
    try {
      const instances = this.serviceInstances.get(serviceName) || []
      
      // Check if instance already exists
      const existingIndex = instances.findIndex(i => i.id === instance.id)
      
      if (existingIndex >= 0) {
        instances[existingIndex] = instance
      } else {
        instances.push(instance)
      }
      
      this.serviceInstances.set(serviceName, instances)
      
      // Initialize health check for new instance
      await this.initializeInstanceHealthCheck(serviceName, instance)
      
      console.log(`Registered instance ${instance.id} for service ${serviceName}`)
      
    } catch (error) {
      console.error(`Error registering service instance:`, error)
      throw error
    }
  }

  async deregisterServiceInstance(serviceName: string, instanceId: string): Promise<void> {
    try {
      const instances = this.serviceInstances.get(serviceName) || []
      const filteredInstances = instances.filter(i => i.id !== instanceId)
      
      this.serviceInstances.set(serviceName, filteredInstances)
      
      console.log(`Deregistered instance ${instanceId} from service ${serviceName}`)
      
    } catch (error) {
      console.error(`Error deregistering service instance:`, error)
      throw error
    }
  }

  // Load Balancing
  async getServiceInstance(serviceName: string, context?: any): Promise<ServiceInstance | null> {
    const instances = this.getHealthyInstances(serviceName)
    
    if (instances.length === 0) {
      console.warn(`No healthy instances available for service ${serviceName}`)
      return null
    }

    const strategy = this.loadBalancers.get(serviceName)
    if (!strategy) {
      console.warn(`No load balancing strategy found for service ${serviceName}`)
      return instances[0] // Fallback to first instance
    }

    return this.selectInstance(instances, strategy, context)
  }

  private getHealthyInstances(serviceName: string): ServiceInstance[] {
    const instances = this.serviceInstances.get(serviceName) || []
    return instances.filter(instance => instance.status === 'healthy')
  }

  private selectInstance(
    instances: ServiceInstance[], 
    strategy: LoadBalancingStrategy, 
    context?: any
  ): ServiceInstance {
    switch (strategy.algorithm) {
      case 'round-robin':
        return this.roundRobinSelection(instances)
      
      case 'weighted-round-robin':
        return this.weightedRoundRobinSelection(instances, strategy.weights)
      
      case 'least-connections':
        return this.leastConnectionsSelection(instances)
      
      case 'consistent-hashing':
        return this.consistentHashingSelection(instances, context, strategy.hashKey)
      
      default:
        return instances[0]
    }
  }

  private roundRobinSelection(instances: ServiceInstance[]): ServiceInstance {
    // Simple round-robin implementation
    const now = Date.now()
    const index = Math.floor(now / 1000) % instances.length
    return instances[index]
  }

  private weightedRoundRobinSelection(
    instances: ServiceInstance[], 
    weights?: Map<string, number>
  ): ServiceInstance {
    if (!weights || weights.size === 0) {
      return this.roundRobinSelection(instances)
    }

    // Calculate weighted selection based on instance performance
    let totalWeight = 0
    const weightedInstances: { instance: ServiceInstance, weight: number }[] = []

    for (const instance of instances) {
      const weight = weights.get(instance.id) || 1
      totalWeight += weight
      weightedInstances.push({ instance, weight })
    }

    const random = Math.random() * totalWeight
    let currentWeight = 0

    for (const { instance, weight } of weightedInstances) {
      currentWeight += weight
      if (random <= currentWeight) {
        return instance
      }
    }

    return instances[0] // Fallback
  }

  private leastConnectionsSelection(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((least, current) => 
      (current.activeConnections || 0) < (least.activeConnections || 0) ? current : least
    )
  }

  private consistentHashingSelection(
    instances: ServiceInstance[], 
    context: any, 
    hashKey?: string
  ): ServiceInstance {
    if (!context || !hashKey) {
      return this.roundRobinSelection(instances)
    }

    const key = context[hashKey] || context.userId || context.sessionId
    if (!key) {
      return this.roundRobinSelection(instances)
    }

    // Simple hash function for consistent hashing
    const hash = this.simpleHash(key.toString())
    const index = hash % instances.length
    return instances[index]
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // Auto Scaling
  async checkAutoScaling(): Promise<void> {
    try {
      for (const [serviceName, config] of this.autoScalingConfigs.entries()) {
        if (!config.enabled) continue

        const metrics = await this.collectServiceMetrics(serviceName)
        const instances = this.serviceInstances.get(serviceName) || []
        
        await this.evaluateScaling(serviceName, config, metrics, instances)
      }
    } catch (error) {
      console.error('Error in auto scaling check:', error)
    }
  }

  private async evaluateScaling(
    serviceName: string,
    config: AutoScalingConfig,
    metrics: ScalingMetrics,
    instances: ServiceInstance[]
  ): Promise<void> {
    const currentInstanceCount = instances.length
    const avgCpuUtilization = metrics.avgCpuUtilization
    const avgMemoryUtilization = metrics.avgMemoryUtilization
    const avgResponseTime = metrics.avgResponseTime

    // Check if scaling up is needed
    if (this.shouldScaleUp(config, avgCpuUtilization, avgMemoryUtilization, avgResponseTime)) {
      if (currentInstanceCount < config.maxInstances) {
        await this.scaleUp(serviceName, config)
      } else {
        console.warn(`Service ${serviceName} at maximum instances (${config.maxInstances})`)
      }
    }
    // Check if scaling down is possible
    else if (this.shouldScaleDown(config, avgCpuUtilization, avgMemoryUtilization, avgResponseTime)) {
      if (currentInstanceCount > config.minInstances) {
        await this.scaleDown(serviceName, config)
      }
    }
  }

  private shouldScaleUp(
    config: AutoScalingConfig,
    cpuUtilization: number,
    memoryUtilization: number,
    responseTime: number
  ): boolean {
    return cpuUtilization > config.scaleUpThreshold ||
           memoryUtilization > config.scaleUpThreshold ||
           responseTime > 2000 // 2 seconds response time threshold
  }

  private shouldScaleDown(
    config: AutoScalingConfig,
    cpuUtilization: number,
    memoryUtilization: number,
    responseTime: number
  ): boolean {
    return cpuUtilization < config.scaleDownThreshold &&
           memoryUtilization < config.scaleDownThreshold &&
           responseTime < 500 // 500ms response time threshold
  }

  private async scaleUp(serviceName: string, config: AutoScalingConfig): Promise<void> {
    try {
      console.log(`Scaling up service ${serviceName}`)
      
      // Check cooldown period
      const lastScaleUp = this.scalingMetrics.get(serviceName)?.lastScaleUpTime
      if (lastScaleUp && Date.now() - lastScaleUp < config.scaleUpCooldown * 1000) {
        console.log(`Scale up cooldown active for ${serviceName}`)
        return
      }

      // Create new instance
      const newInstance = await this.createServiceInstance(serviceName)
      await this.registerServiceInstance(serviceName, newInstance)
      
      // Update scaling metrics
      this.updateScalingMetrics(serviceName, 'scale-up')
      
      console.log(`Successfully scaled up ${serviceName}, new instance: ${newInstance.id}`)
      
    } catch (error) {
      console.error(`Error scaling up service ${serviceName}:`, error)
    }
  }

  private async scaleDown(serviceName: string, config: AutoScalingConfig): Promise<void> {
    try {
      console.log(`Scaling down service ${serviceName}`)
      
      // Check cooldown period
      const lastScaleDown = this.scalingMetrics.get(serviceName)?.lastScaleDownTime
      if (lastScaleDown && Date.now() - lastScaleDown < config.scaleDownCooldown * 1000) {
        console.log(`Scale down cooldown active for ${serviceName}`)
        return
      }

      // Find instance with least connections to remove
      const instances = this.serviceInstances.get(serviceName) || []
      const instanceToRemove = instances.reduce((least, current) => 
        (current.activeConnections || 0) < (least.activeConnections || 0) ? current : least
      )

      // Gracefully drain connections before removing
      await this.drainInstance(serviceName, instanceToRemove.id)
      await this.deregisterServiceInstance(serviceName, instanceToRemove.id)
      await this.terminateServiceInstance(instanceToRemove.id)
      
      // Update scaling metrics
      this.updateScalingMetrics(serviceName, 'scale-down')
      
      console.log(`Successfully scaled down ${serviceName}, removed instance: ${instanceToRemove.id}`)
      
    } catch (error) {
      console.error(`Error scaling down service ${serviceName}:`, error)
    }
  }

  // Service Instance Lifecycle
  private async createServiceInstance(serviceName: string): Promise<ServiceInstance> {
    const instanceId = `${serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // This would typically involve container orchestration (Docker, Kubernetes)
    // For this implementation, we'll simulate instance creation
    
    const instance: ServiceInstance = {
      id: instanceId,
      serviceName,
      host: `${serviceName}-${instanceId}.internal`,
      port: this.getServicePort(serviceName),
      status: 'starting',
      createdAt: new Date(),
      lastHealthCheck: new Date(),
      activeConnections: 0,
      cpuUtilization: 0,
      memoryUtilization: 0,
      responseTime: 0
    }

    // Simulate instance startup time
    setTimeout(() => {
      instance.status = 'healthy'
      console.log(`Instance ${instanceId} is now healthy`)
    }, 30000) // 30 seconds startup time

    return instance
  }

  private async terminateServiceInstance(instanceId: string): Promise<void> {
    // This would typically involve container orchestration
    console.log(`Terminating instance ${instanceId}`)
    
    // Simulate instance termination
    setTimeout(() => {
      console.log(`Instance ${instanceId} terminated successfully`)
    }, 5000) // 5 seconds termination time
  }

  private async drainInstance(serviceName: string, instanceId: string): Promise<void> {
    console.log(`Draining connections from instance ${instanceId}`)
    
    // Mark instance as draining
    const instances = this.serviceInstances.get(serviceName) || []
    const instance = instances.find(i => i.id === instanceId)
    
    if (instance) {
      instance.status = 'draining'
      
      // Wait for connections to drain (simplified)
      const drainTimeout = 60000 // 1 minute
      const startTime = Date.now()
      
      while (Date.now() - startTime < drainTimeout && (instance.activeConnections || 0) > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      console.log(`Instance ${instanceId} drained successfully`)
    }
  }

  // Health Checks
  private async initializeInstanceHealthCheck(
    serviceName: string, 
    instance: ServiceInstance
  ): Promise<void> {
    const strategy = this.loadBalancers.get(serviceName)
    if (!strategy?.healthCheckEnabled) return

    const healthCheckInterval = (strategy.healthCheckInterval || 30) * 1000

    const healthCheckTimer = setInterval(async () => {
      try {
        const isHealthy = await this.performHealthCheck(instance)
        
        if (isHealthy) {
          instance.status = 'healthy'
          instance.consecutiveFailures = 0
        } else {
          instance.consecutiveFailures = (instance.consecutiveFailures || 0) + 1
          
          if (instance.consecutiveFailures >= (strategy.failureThreshold || 3)) {
            instance.status = 'unhealthy'
            console.warn(`Instance ${instance.id} marked as unhealthy`)
          }
        }
        
        instance.lastHealthCheck = new Date()
        
      } catch (error) {
        console.error(`Health check failed for instance ${instance.id}:`, error)
        instance.consecutiveFailures = (instance.consecutiveFailures || 0) + 1
      }
    }, healthCheckInterval)

    // Store timer reference for cleanup
    instance.healthCheckTimer = healthCheckTimer
  }

  private async performHealthCheck(instance: ServiceInstance): Promise<boolean> {
    try {
      // Simulate health check HTTP request
      const healthCheckUrl = `http://${instance.host}:${instance.port}/health`
      
      // In a real implementation, this would be an actual HTTP request
      // For simulation, we'll randomly determine health status
      const isHealthy = Math.random() > 0.05 // 95% success rate
      
      return isHealthy
      
    } catch (error) {
      console.error(`Health check error for ${instance.id}:`, error)
      return false
    }
  }

  // Metrics Collection
  private async collectServiceMetrics(serviceName: string): Promise<ScalingMetrics> {
    const instances = this.serviceInstances.get(serviceName) || []
    const healthyInstances = instances.filter(i => i.status === 'healthy')

    if (healthyInstances.length === 0) {
      return {
        serviceName,
        instanceCount: 0,
        avgCpuUtilization: 0,
        avgMemoryUtilization: 0,
        avgResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        timestamp: new Date()
      }
    }

    // Collect metrics from all healthy instances
    const cpuUtilizations = healthyInstances.map(i => i.cpuUtilization || 0)
    const memoryUtilizations = healthyInstances.map(i => i.memoryUtilization || 0)
    const responseTimes = healthyInstances.map(i => i.responseTime || 0)

    const metrics: ScalingMetrics = {
      serviceName,
      instanceCount: healthyInstances.length,
      avgCpuUtilization: cpuUtilizations.reduce((a, b) => a + b, 0) / cpuUtilizations.length,
      avgMemoryUtilization: memoryUtilizations.reduce((a, b) => a + b, 0) / memoryUtilizations.length,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      totalRequests: healthyInstances.reduce((sum, i) => sum + (i.requestCount || 0), 0),
      errorRate: this.calculateErrorRate(healthyInstances),
      timestamp: new Date()
    }

    this.scalingMetrics.set(serviceName, metrics)
    return metrics
  }

  private calculateErrorRate(instances: ServiceInstance[]): number {
    const totalRequests = instances.reduce((sum, i) => sum + (i.requestCount || 0), 0)
    const totalErrors = instances.reduce((sum, i) => sum + (i.errorCount || 0), 0)
    
    return totalRequests > 0 ? totalErrors / totalRequests : 0
  }

  private updateScalingMetrics(serviceName: string, action: 'scale-up' | 'scale-down'): void {
    const metrics = this.scalingMetrics.get(serviceName) || {
      serviceName,
      instanceCount: 0,
      avgCpuUtilization: 0,
      avgMemoryUtilization: 0,
      avgResponseTime: 0,
      totalRequests: 0,
      errorRate: 0,
      timestamp: new Date()
    }

    if (action === 'scale-up') {
      metrics.lastScaleUpTime = Date.now()
      metrics.scaleUpCount = (metrics.scaleUpCount || 0) + 1
    } else {
      metrics.lastScaleDownTime = Date.now()
      metrics.scaleDownCount = (metrics.scaleDownCount || 0) + 1
    }

    this.scalingMetrics.set(serviceName, metrics)
  }

  // Utility Methods
  private getServicePort(serviceName: string): number {
    const portMap: { [key: string]: number } = {
      'ml-personalization-engine': 8001,
      'behavioral-analytics-service': 8002,
      'intervention-engine': 8003,
      'smart-onboarding-service': 8004
    }
    
    return portMap[serviceName] || 8000
  }

  private async setupServiceDiscovery(): Promise<void> {
    console.log('Setting up service discovery...')
    // Implementation would integrate with service discovery systems like Consul, etcd, etc.
  }

  private async initializeHealthChecks(): Promise<void> {
    console.log('Initializing health checks for all services...')
    
    for (const [serviceName, instances] of this.serviceInstances.entries()) {
      for (const instance of instances) {
        await this.initializeInstanceHealthCheck(serviceName, instance)
      }
    }
  }

  private async startAutoScalingMonitoring(): Promise<void> {
    console.log('Starting auto-scaling monitoring...')
    
    // Check auto-scaling every 30 seconds
    setInterval(async () => {
      await this.checkAutoScaling()
    }, 30000)
  }

  // Public API
  getServiceInstances(serviceName: string): ServiceInstance[] {
    return this.serviceInstances.get(serviceName) || []
  }

  getScalingMetrics(serviceName: string): ScalingMetrics | undefined {
    return this.scalingMetrics.get(serviceName)
  }

  getAllScalingMetrics(): Map<string, ScalingMetrics> {
    return new Map(this.scalingMetrics)
  }

  async updateAutoScalingConfig(
    serviceName: string, 
    config: Partial<AutoScalingConfig>
  ): Promise<void> {
    const existingConfig = this.autoScalingConfigs.get(serviceName)
    if (!existingConfig) {
      throw new Error(`No auto-scaling config found for service: ${serviceName}`)
    }

    const updatedConfig = { ...existingConfig, ...config }
    this.autoScalingConfigs.set(serviceName, updatedConfig)
    
    console.log(`Updated auto-scaling config for ${serviceName}`)
  }

  async generateScalingReport(): Promise<string> {
    let report = '# Smart Onboarding Horizontal Scaling Report\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`
    
    for (const [serviceName, metrics] of this.scalingMetrics.entries()) {
      const instances = this.serviceInstances.get(serviceName) || []
      const config = this.autoScalingConfigs.get(serviceName)
      
      report += `## ${serviceName.toUpperCase()}\n\n`
      report += `- **Current Instances**: ${instances.length}\n`
      report += `- **Healthy Instances**: ${instances.filter(i => i.status === 'healthy').length}\n`
      report += `- **Average CPU**: ${metrics.avgCpuUtilization.toFixed(2)}%\n`
      report += `- **Average Memory**: ${metrics.avgMemoryUtilization.toFixed(2)}%\n`
      report += `- **Average Response Time**: ${metrics.avgResponseTime.toFixed(2)}ms\n`
      report += `- **Error Rate**: ${(metrics.errorRate * 100).toFixed(2)}%\n`
      
      if (config) {
        report += `- **Min/Max Instances**: ${config.minInstances}/${config.maxInstances}\n`
        report += `- **Scale Up Threshold**: ${config.scaleUpThreshold}%\n`
        report += `- **Scale Down Threshold**: ${config.scaleDownThreshold}%\n`
      }
      
      report += `- **Scale Up Count**: ${metrics.scaleUpCount || 0}\n`
      report += `- **Scale Down Count**: ${metrics.scaleDownCount || 0}\n\n`
    }
    
    return report
  }
}