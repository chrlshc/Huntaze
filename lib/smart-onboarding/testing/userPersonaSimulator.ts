import { BehaviorEvent, BehaviorEventType, InteractionEvent, PersonaType } from '../types';
import { logger } from '../../utils/logger';

export interface SimulationScenario {
  persona: PersonaType;
  duration: number; // milliseconds
  steps: string[];
  expectedBehaviors: string[];
  customParameters?: Record<string, any>;
}

export interface SimulationResult {
  userId: string;
  scenario: SimulationScenario;
  completed: boolean;
  totalTime: number;
  stepsCompleted: number;
  behaviorEvents: BehaviorEvent[];
  metrics: SimulationMetrics;
}

export interface SimulationMetrics {
  averageEngagement: number;
  hesitationCount: number;
  helpRequestCount: number;
  backtrackingCount: number;
  errorCount: number;
  completionRate: number;
  efficiency: number;
}

export interface PersonaCharacteristics {
  baseSpeed: number; // multiplier for interaction speed
  explorationTendency: number; // 0-1, how much they explore
  helpSeekingTendency: number; // 0-1, how often they seek help
  errorProneness: number; // 0-1, likelihood of making errors
  attentionSpan: number; // milliseconds before attention drops
  technicalProficiency: number; // 0-1, technical skill level
  patience: number; // 0-1, how patient they are with slow processes
}

export class UserPersonaSimulator {
  private activeSimulations = new Map<string, SimulationState>();
  private personaProfiles: Record<PersonaType, PersonaCharacteristics>;

  constructor() {
    this.personaProfiles = this.initializePersonaProfiles();
  }

  async runSimulation(userId: string, scenario: SimulationScenario): Promise<SimulationResult> {
    const startTime = Date.now();
    const persona = this.personaProfiles[scenario.persona];
    
    logger.info(`Starting simulation for ${scenario.persona}`, { userId, scenario });

    const simulationState: SimulationState = {
      userId,
      scenario,
      persona,
      startTime,
      currentStep: 0,
      behaviorEvents: [],
      isActive: true,
      lastInteractionTime: startTime
    };

    this.activeSimulations.set(userId, simulationState);

    try {
      await this.executeSimulation(simulationState);
      
      const result = this.generateSimulationResult(simulationState);
      logger.info(`Simulation completed for ${scenario.persona}`, { 
        userId, 
        duration: result.totalTime,
        stepsCompleted: result.stepsCompleted 
      });
      
      return result;
    } finally {
      this.activeSimulations.delete(userId);
    }
  }

  private async executeSimulation(state: SimulationState): Promise<void> {
    const { scenario, persona } = state;
    const endTime = state.startTime + scenario.duration;

    while (state.isActive && Date.now() < endTime && state.currentStep < scenario.steps.length) {
      const currentStepName = scenario.steps[state.currentStep];
      await this.simulateStep(state, currentStepName);
      
      // Check if user would abandon (based on persona characteristics)
      if (this.shouldAbandon(state)) {
        logger.debug(`User ${state.userId} abandoned simulation at step ${state.currentStep}`);
        break;
      }
      
      state.currentStep++;
    }

    state.isActive = false;
  }

  private async simulateStep(state: SimulationState, stepName: string): Promise<void> {
    const { persona, scenario } = state;
    const stepStartTime = Date.now();
    
    // Calculate step duration based on persona
    const baseStepDuration = this.getBaseStepDuration(stepName);
    const personalizedDuration = baseStepDuration / persona.baseSpeed;
    
    // Add some randomness
    const actualDuration = personalizedDuration * (0.7 + Math.random() * 0.6);
    
    // Generate interactions during this step
    await this.generateStepInteractions(state, stepName, actualDuration);
    
    // Update state
    state.lastInteractionTime = Date.now();
  }

  private async generateStepInteractions(
    state: SimulationState, 
    stepName: string, 
    duration: number
  ): Promise<void> {
    const { persona, userId } = state;
    const stepStartTime = Date.now();
    const interactionCount = Math.floor(duration / 2000) + Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < interactionCount; i++) {
      const interactionTime = stepStartTime + (duration * i / interactionCount) + Math.random() * 1000;
      
      // Wait until it's time for this interaction
      const waitTime = interactionTime - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 100)));
      }
      
      const behaviorEvent = this.generateBehaviorEvent(state, stepName, interactionTime);
      state.behaviorEvents.push(behaviorEvent);
    }
  }

  private generateBehaviorEvent(state: SimulationState, stepName: string, timestamp: number): BehaviorEvent {
    const { persona, userId } = state;
    
    // Determine event type based on persona and step
    const eventType = this.selectEventType(persona, stepName);
    
    // Generate interaction data
    const interactionData = this.generateInteractionData(persona, eventType, stepName);
    
    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(persona, state.currentStep, state.behaviorEvents.length);
    
    return {
      id: `sim_${userId}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: new Date(timestamp),
      eventType,
      stepId: stepName,
      interactionData,
      engagementScore,
      contextualData: {
        currentUrl: '/',
        userAgent: 'simulator',
        screenResolution: { width: 1920, height: 1080 },
        viewportSize: { width: 1280, height: 720 },
        deviceType: 'desktop',
        browserInfo: { name: 'sim', version: '1.0', language: 'en', timezone: 'UTC' },
        simulationStep: state.currentStep,
        persona: state.scenario.persona,
        isSimulated: true
      }
    };
  }

  private selectEventType(persona: PersonaCharacteristics, stepName: string): BehaviorEventType {
    const random = Math.random();
    
    // Technical experts
    if (persona.technicalProficiency > 0.8) {
      if (random < 0.4) return 'click';
      if (random < 0.7) return 'keypress';
      if (random < 0.85) return 'focus';
      return 'mouse_movement';
    }
    
    // Novice users
    if (persona.technicalProficiency < 0.3) {
      if (random < 0.2) return 'hesitation';
      if (random < 0.4) return 'help_request';
      if (random < 0.6) return 'hover';
      if (random < 0.8) return 'click';
      return 'backtrack';
    }
    
    // Business users and others
    if (random < 0.3) return 'click';
    if (random < 0.5) return 'scroll';
    if (random < 0.7) return 'focus';
    if (random < 0.85) return 'blur';
    return 'keypress';
  }

  private generateInteractionData(persona: PersonaCharacteristics, eventType: string, stepName: string): any {
    const baseData = {
      timeSpent: this.generateTimeSpent(persona, eventType),
      mouseMovements: this.generateMouseMovements(persona, eventType),
      clickPatterns: this.generateClickPatterns(persona, eventType),
      scrollBehavior: this.generateScrollBehavior(persona),
      hesitationIndicators: this.generateHesitationIndicators(persona, eventType)
    };

    // Add event-specific data
    switch (eventType) {
      case 'help_request':
        return {
          ...baseData,
          helpType: 'tooltip',
          helpContent: `Help for ${stepName}`,
          helpDuration: 3000 + Math.random() * 5000
        };
      
      case 'form_input':
        return {
          ...baseData,
          inputType: 'text',
          inputLength: Math.floor(Math.random() * 50) + 5,
          corrections: Math.floor(Math.random() * 3)
        };
      
      case 'feature_exploration':
        return {
          ...baseData,
          featuresExplored: Math.floor(Math.random() * 3) + 1,
          explorationDepth: persona.explorationTendency
        };
      
      default:
        return baseData;
    }
  }

  private generateTimeSpent(persona: PersonaCharacteristics, eventType: string): number {
    let baseTime = 2000; // 2 seconds base
    
    // Adjust based on event type
    switch (eventType) {
      case 'read':
        baseTime = 5000;
        break;
      case 'help_request':
        baseTime = 8000;
        break;
      case 'hesitation':
        baseTime = 3000;
        break;
      case 'click':
        baseTime = 500;
        break;
    }
    
    // Adjust based on persona
    const speedMultiplier = persona.baseSpeed;
    const proficiencyMultiplier = 0.5 + persona.technicalProficiency * 0.5;
    
    return Math.floor(baseTime / speedMultiplier / proficiencyMultiplier * (0.8 + Math.random() * 0.4));
  }

  private generateMouseMovements(persona: PersonaCharacteristics, eventType: string): any[] {
    const movementCount = Math.floor(Math.random() * 10) + 2;
    const movements = [];
    
    let currentX = Math.random() * 1200;
    let currentY = Math.random() * 800;
    
    for (let i = 0; i < movementCount; i++) {
      // Technical users have more direct movements
      const directness = persona.technicalProficiency;
      const maxJump = directness > 0.7 ? 100 : 200;
      
      currentX += (Math.random() - 0.5) * maxJump;
      currentY += (Math.random() - 0.5) * maxJump;
      
      // Keep within bounds
      currentX = Math.max(0, Math.min(1200, currentX));
      currentY = Math.max(0, Math.min(800, currentY));
      
      movements.push({
        x: Math.floor(currentX),
        y: Math.floor(currentY),
        timestamp: Date.now() + i * 100
      });
    }
    
    return movements;
  }

  private generateClickPatterns(persona: PersonaCharacteristics, eventType: string): string[] {
    if (eventType !== 'click') return [];
    
    const patterns = ['single_click'];
    
    // Novice users might double-click more
    if (persona.technicalProficiency < 0.4 && Math.random() < 0.3) {
      patterns.push('double_click');
    }
    
    // Technical users might use right-click
    if (persona.technicalProficiency > 0.7 && Math.random() < 0.2) {
      patterns.push('right_click');
    }
    
    return patterns;
  }

  private generateScrollBehavior(persona: PersonaCharacteristics): any {
    return {
      direction: Math.random() < 0.8 ? 'down' : 'up',
      speed: persona.baseSpeed * (0.5 + Math.random() * 0.5),
      distance: Math.floor(Math.random() * 500) + 100
    };
  }

  private generateHesitationIndicators(persona: PersonaCharacteristics, eventType: string): string[] {
    const indicators = [];
    
    // More hesitation for novice users
    const hesitationProbability = (1 - persona.technicalProficiency) * 0.5;
    
    if (Math.random() < hesitationProbability) {
      indicators.push('mouse_pause');
    }
    
    if (Math.random() < hesitationProbability * 0.5) {
      indicators.push('cursor_hovering');
    }
    
    if (eventType === 'hesitation') {
      indicators.push('extended_pause', 'backtracking');
    }
    
    return indicators;
  }

  private calculateEngagementScore(persona: PersonaCharacteristics, stepIndex: number, eventCount: number): number {
    let baseScore = 70;
    
    // Adjust based on persona
    baseScore += persona.technicalProficiency * 20;
    baseScore += persona.patience * 10;
    
    // Decrease engagement over time (attention span)
    const timeDecay = Math.max(0, 1 - (eventCount * 2000) / persona.attentionSpan);
    baseScore *= timeDecay;
    
    // Add some randomness
    baseScore += (Math.random() - 0.5) * 20;
    
    return Math.max(0, Math.min(100, Math.floor(baseScore)));
  }

  private shouldAbandon(state: SimulationState): boolean {
    const { persona, behaviorEvents, scenario } = state;
    
    // Calculate abandonment probability based on various factors
    let abandonmentProbability = 0;
    
    // Low patience increases abandonment
    abandonmentProbability += (1 - persona.patience) * 0.1;
    
    // Low engagement increases abandonment
    const recentEvents = behaviorEvents.slice(-5);
    if (recentEvents.length > 0) {
      const avgEngagement = recentEvents.reduce((sum, e) => sum + e.engagementScore, 0) / recentEvents.length;
      if (avgEngagement < 40) {
        abandonmentProbability += 0.2;
      }
    }
    
    // Too many errors or hesitations
    const errorCount = behaviorEvents.filter(e => e.eventType === 'error').length;
    const hesitationCount = behaviorEvents.filter(e => e.eventType === 'hesitation').length;
    
    if (errorCount > 3) abandonmentProbability += 0.15;
    if (hesitationCount > 5) abandonmentProbability += 0.1;
    
    return Math.random() < abandonmentProbability;
  }

  private getBaseStepDuration(stepName: string): number {
    const durations: Record<string, number> = {
      'profile_setup': 60000,
      'platform_connection': 90000,
      'content_creation': 120000,
      'advanced_features': 180000,
      'design_tools': 150000,
      'analytics_setup': 100000
    };
    
    return durations[stepName] || 60000;
  }

  private generateSimulationResult(state: SimulationState): SimulationResult {
    const totalTime = Date.now() - state.startTime;
    const completed = state.currentStep >= state.scenario.steps.length;
    
    return {
      userId: state.userId,
      scenario: state.scenario,
      completed,
      totalTime,
      stepsCompleted: state.currentStep,
      behaviorEvents: state.behaviorEvents,
      metrics: this.calculateMetrics(state.behaviorEvents, completed)
    };
  }

  private calculateMetrics(events: BehaviorEvent[], completed: boolean): SimulationMetrics {
    const totalEvents = events.length;
    
    return {
      averageEngagement: totalEvents > 0 
        ? events.reduce((sum, e) => sum + e.engagementScore, 0) / totalEvents 
        : 0,
      hesitationCount: events.filter(e => e.eventType === 'hesitation').length,
      helpRequestCount: events.filter(e => e.eventType === 'help_request').length,
      backtrackingCount: events.filter(e => e.eventType === 'backtrack').length,
      errorCount: events.filter(e => e.eventType === 'error').length,
      completionRate: completed ? 1 : 0,
      efficiency: this.calculateEfficiency(events)
    };
  }

  private calculateEfficiency(events: BehaviorEvent[]): number {
    if (events.length === 0) return 0;
    
    const productiveEvents = events.filter(e => 
      !['hesitation', 'error', 'backtrack'].includes(e.eventType)
    ).length;
    
    return productiveEvents / events.length;
  }

  private initializePersonaProfiles(): Record<PersonaType, PersonaCharacteristics> {
    return {
      content_creator: {
        baseSpeed: 1.2,
        explorationTendency: 0.9,
        helpSeekingTendency: 0.3,
        errorProneness: 0.2,
        attentionSpan: 900000, // 15 minutes
        technicalProficiency: 0.7,
        patience: 0.8
      },
      business_user: {
        baseSpeed: 1.0,
        explorationTendency: 0.5,
        helpSeekingTendency: 0.4,
        errorProneness: 0.3,
        attentionSpan: 480000, // 8 minutes
        technicalProficiency: 0.6,
        patience: 0.7
      },
      influencer: {
        baseSpeed: 1.5,
        explorationTendency: 0.8,
        helpSeekingTendency: 0.2,
        errorProneness: 0.2,
        attentionSpan: 420000, // 7 minutes
        technicalProficiency: 0.8,
        patience: 0.6
      },
      agency: {
        baseSpeed: 1.5,
        explorationTendency: 0.8,
        helpSeekingTendency: 0.1,
        errorProneness: 0.1,
        attentionSpan: 600000, // 10 minutes
        technicalProficiency: 0.9,
        patience: 0.6
      },
      casual_user: {
        baseSpeed: 0.6,
        explorationTendency: 0.3,
        helpSeekingTendency: 0.8,
        errorProneness: 0.6,
        attentionSpan: 300000, // 5 minutes
        technicalProficiency: 0.2,
        patience: 0.4
      }
    };
  }

  cleanup(): void {
    this.activeSimulations.clear();
  }
}

interface SimulationState {
  userId: string;
  scenario: SimulationScenario;
  persona: PersonaCharacteristics;
  startTime: number;
  currentStep: number;
  behaviorEvents: BehaviorEvent[];
  isActive: boolean;
  lastInteractionTime: number;
}
