import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserPersonaSimulator, PersonaType, SimulationScenario } from '../../../lib/smart-onboarding/testing/userPersonaSimulator';
import { BehaviorEvent } from '../../../lib/smart-onboarding/types';

describe('UserPersonaSimulator', () => {
  let simulator: UserPersonaSimulator;

  beforeEach(() => {
    simulator = new UserPersonaSimulator();
  });

  afterEach(() => {
    simulator.cleanup();
  });

  describe('Technical Expert Persona', () => {
    it('should simulate fast navigation and skip basic steps', async () => {
      const scenario: SimulationScenario = {
        persona: 'technical_expert',
        duration: 300000, // 5 minutes
        steps: ['profile_setup', 'platform_connection', 'advanced_features'],
        expectedBehaviors: ['fast_navigation', 'skip_tutorials', 'explore_advanced']
      };

      const simulation = await simulator.runSimulation('test-user-tech', scenario);

      expect(simulation.completed).toBe(true);
      expect(simulation.totalTime).toBeLessThan(scenario.duration);
      expect(simulation.behaviorEvents.length).toBeGreaterThan(0);
      
      // Technical experts should have fast interactions
      const avgTimePerStep = simulation.totalTime / simulation.stepsCompleted;
      expect(avgTimePerStep).toBeLessThan(60000); // Less than 1 minute per step
      
      // Should have minimal hesitation
      const hesitationEvents = simulation.behaviorEvents.filter(e => 
        e.eventType === 'hesitation' || e.interactionData.hesitationIndicators?.length > 0
      );
      expect(hesitationEvents.length).toBeLessThan(simulation.behaviorEvents.length * 0.1);
    });

    it('should generate appropriate mouse movement patterns', async () => {
      const scenario: SimulationScenario = {
        persona: 'technical_expert',
        duration: 60000,
        steps: ['profile_setup'],
        expectedBehaviors: ['direct_clicks', 'minimal_exploration']
      };

      const simulation = await simulator.runSimulation('test-user-tech-2', scenario);
      
      const mouseEvents = simulation.behaviorEvents.filter(e => 
        e.interactionData.mouseMovements && e.interactionData.mouseMovements.length > 0
      );

      expect(mouseEvents.length).toBeGreaterThan(0);
      
      // Technical users should have direct, purposeful movements
      mouseEvents.forEach(event => {
        const movements = event.interactionData.mouseMovements;
        if (movements && movements.length > 1) {
          // Calculate movement efficiency (straight lines vs wandering)
          const totalDistance = movements.reduce((sum, movement, index) => {
            if (index === 0) return sum;
            const prev = movements[index - 1];
            return sum + Math.sqrt(
              Math.pow(movement.x - prev.x, 2) + Math.pow(movement.y - prev.y, 2)
            );
          }, 0);
          
          const directDistance = Math.sqrt(
            Math.pow(movements[movements.length - 1].x - movements[0].x, 2) +
            Math.pow(movements[movements.length - 1].y - movements[0].y, 2)
          );
          
          const efficiency = directDistance / totalDistance;
          expect(efficiency).toBeGreaterThan(0.7); // Should be fairly direct
        }
      });
    });
  });

  describe('Business User Persona', () => {
    it('should simulate moderate pace with some exploration', async () => {
      const scenario: SimulationScenario = {
        persona: 'business_user',
        duration: 600000, // 10 minutes
        steps: ['profile_setup', 'platform_connection', 'content_creation'],
        expectedBehaviors: ['moderate_pace', 'some_backtracking', 'help_seeking']
      };

      const simulation = await simulator.runSimulation('test-user-business', scenario);

      expect(simulation.completed).toBe(true);
      
      // Business users should take moderate time
      const avgTimePerStep = simulation.totalTime / simulation.stepsCompleted;
      expect(avgTimePerStep).toBeGreaterThan(60000); // More than 1 minute per step
      expect(avgTimePerStep).toBeLessThan(300000); // Less than 5 minutes per step
      
      // Should have some help-seeking behavior
      const helpEvents = simulation.behaviorEvents.filter(e => 
        e.eventType === 'help_request' || e.eventType === 'tooltip_view'
      );
      expect(helpEvents.length).toBeGreaterThan(0);
    });

    it('should show appropriate engagement patterns', async () => {
      const scenario: SimulationScenario = {
        persona: 'business_user',
        duration: 300000,
        steps: ['platform_connection'],
        expectedBehaviors: ['read_instructions', 'moderate_exploration']
      };

      const simulation = await simulator.runSimulation('test-user-business-2', scenario);
      
      // Business users should have moderate engagement scores
      const avgEngagement = simulation.behaviorEvents.reduce((sum, event) => 
        sum + event.engagementScore, 0) / simulation.behaviorEvents.length;
      
      expect(avgEngagement).toBeGreaterThan(60);
      expect(avgEngagement).toBeLessThan(85);
      
      // Should have some reading time (longer dwell times)
      const dwellTimes = simulation.behaviorEvents.map(e => e.interactionData.timeSpent);
      const avgDwellTime = dwellTimes.reduce((sum, time) => sum + time, 0) / dwellTimes.length;
      expect(avgDwellTime).toBeGreaterThan(3000); // At least 3 seconds average
    });
  });

  describe('Novice User Persona', () => {
    it('should simulate slow, cautious behavior with frequent help-seeking', async () => {
      const scenario: SimulationScenario = {
        persona: 'novice_user',
        duration: 900000, // 15 minutes
        steps: ['profile_setup', 'platform_connection'],
        expectedBehaviors: ['slow_pace', 'frequent_hesitation', 'help_seeking', 'backtracking']
      };

      const simulation = await simulator.runSimulation('test-user-novice', scenario);

      // Novice users might not complete all steps in time
      expect(simulation.stepsCompleted).toBeGreaterThan(0);
      
      // Should have slow pace
      const avgTimePerStep = simulation.totalTime / Math.max(simulation.stepsCompleted, 1);
      expect(avgTimePerStep).toBeGreaterThan(180000); // More than 3 minutes per step
      
      // Should have many hesitation indicators
      const hesitationEvents = simulation.behaviorEvents.filter(e => 
        e.eventType === 'hesitation' || 
        (e.interactionData.hesitationIndicators && e.interactionData.hesitationIndicators.length > 0)
      );
      expect(hesitationEvents.length).toBeGreaterThan(simulation.behaviorEvents.length * 0.3);
      
      // Should seek help frequently
      const helpEvents = simulation.behaviorEvents.filter(e => 
        e.eventType === 'help_request' || e.eventType === 'tooltip_view'
      );
      expect(helpEvents.length).toBeGreaterThan(3);
    });

    it('should generate erratic mouse movement patterns', async () => {
      const scenario: SimulationScenario = {
        persona: 'novice_user',
        duration: 120000,
        steps: ['profile_setup'],
        expectedBehaviors: ['exploration', 'uncertainty']
      };

      const simulation = await simulator.runSimulation('test-user-novice-2', scenario);
      
      const mouseEvents = simulation.behaviorEvents.filter(e => 
        e.interactionData.mouseMovements && e.interactionData.mouseMovements.length > 0
      );

      expect(mouseEvents.length).toBeGreaterThan(0);
      
      // Novice users should have less efficient movements
      mouseEvents.forEach(event => {
        const movements = event.interactionData.mouseMovements;
        if (movements && movements.length > 2) {
          // Should have more wandering behavior
          const totalDistance = movements.reduce((sum, movement, index) => {
            if (index === 0) return sum;
            const prev = movements[index - 1];
            return sum + Math.sqrt(
              Math.pow(movement.x - prev.x, 2) + Math.pow(movement.y - prev.y, 2)
            );
          }, 0);
          
          const directDistance = Math.sqrt(
            Math.pow(movements[movements.length - 1].x - movements[0].x, 2) +
            Math.pow(movements[movements.length - 1].y - movements[0].y, 2)
          );
          
          const efficiency = directDistance / totalDistance;
          expect(efficiency).toBeLessThan(0.6); // Should be less direct
        }
      });
    });
  });

  describe('Creative Professional Persona', () => {
    it('should simulate exploration-focused behavior', async () => {
      const scenario: SimulationScenario = {
        persona: 'creative_professional',
        duration: 450000, // 7.5 minutes
        steps: ['profile_setup', 'platform_connection', 'content_creation', 'design_tools'],
        expectedBehaviors: ['exploration', 'feature_discovery', 'creative_focus']
      };

      const simulation = await simulator.runSimulation('test-user-creative', scenario);

      expect(simulation.completed).toBe(true);
      
      // Creative users should explore features
      const explorationEvents = simulation.behaviorEvents.filter(e => 
        e.eventType === 'feature_exploration' || e.eventType === 'ui_exploration'
      );
      expect(explorationEvents.length).toBeGreaterThan(5);
      
      // Should spend time on creative features
      const creativeStepEvents = simulation.behaviorEvents.filter(e => 
        e.stepId.includes('content_creation') || e.stepId.includes('design')
      );
      expect(creativeStepEvents.length).toBeGreaterThan(0);
      
      const avgCreativeTime = creativeStepEvents.reduce((sum, event) => 
        sum + event.interactionData.timeSpent, 0) / creativeStepEvents.length;
      expect(avgCreativeTime).toBeGreaterThan(5000); // Should spend time exploring
    });
  });

  describe('Simulation Validation', () => {
    it('should generate realistic behavioral patterns', async () => {
      const scenario: SimulationScenario = {
        persona: 'business_user',
        duration: 300000,
        steps: ['profile_setup', 'platform_connection'],
        expectedBehaviors: ['realistic_timing', 'human_patterns']
      };

      const simulation = await simulator.runSimulation('test-validation', scenario);
      
      // Validate realistic timing patterns
      expect(simulation.behaviorEvents.length).toBeGreaterThan(10);
      expect(simulation.behaviorEvents.length).toBeLessThan(1000);
      
      // Events should be chronologically ordered
      for (let i = 1; i < simulation.behaviorEvents.length; i++) {
        expect(simulation.behaviorEvents[i].timestamp.getTime())
          .toBeGreaterThanOrEqual(simulation.behaviorEvents[i - 1].timestamp.getTime());
      }
      
      // Should have varied interaction types
      const eventTypes = new Set(simulation.behaviorEvents.map(e => e.eventType));
      expect(eventTypes.size).toBeGreaterThan(3);
      
      // Engagement scores should be realistic (0-100)
      simulation.behaviorEvents.forEach(event => {
        expect(event.engagementScore).toBeGreaterThanOrEqual(0);
        expect(event.engagementScore).toBeLessThanOrEqual(100);
      });
    });

    it('should handle edge cases gracefully', async () => {
      // Test with very short duration
      const shortScenario: SimulationScenario = {
        persona: 'technical_expert',
        duration: 1000, // 1 second
        steps: ['profile_setup'],
        expectedBehaviors: ['fast_completion']
      };

      const shortSimulation = await simulator.runSimulation('test-short', shortScenario);
      expect(shortSimulation.behaviorEvents.length).toBeGreaterThan(0);
      
      // Test with empty steps
      const emptyScenario: SimulationScenario = {
        persona: 'business_user',
        duration: 60000,
        steps: [],
        expectedBehaviors: []
      };

      const emptySimulation = await simulator.runSimulation('test-empty', emptyScenario);
      expect(emptySimulation.stepsCompleted).toBe(0);
      expect(emptySimulation.completed).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle multiple concurrent simulations', async () => {
      const scenarios = [
        {
          persona: 'technical_expert' as PersonaType,
          duration: 60000,
          steps: ['profile_setup'],
          expectedBehaviors: ['fast_completion']
        },
        {
          persona: 'business_user' as PersonaType,
          duration: 120000,
          steps: ['profile_setup', 'platform_connection'],
          expectedBehaviors: ['moderate_pace']
        },
        {
          persona: 'novice_user' as PersonaType,
          duration: 180000,
          steps: ['profile_setup'],
          expectedBehaviors: ['slow_pace']
        }
      ];

      const promises = scenarios.map((scenario, index) => 
        simulator.runSimulation(`test-concurrent-${index}`, scenario)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.behaviorEvents.length).toBeGreaterThan(0);
      });
    });

    it('should clean up resources properly', async () => {
      const scenario: SimulationScenario = {
        persona: 'business_user',
        duration: 30000,
        steps: ['profile_setup'],
        expectedBehaviors: ['cleanup_test']
      };

      // Run multiple simulations
      for (let i = 0; i < 5; i++) {
        await simulator.runSimulation(`test-cleanup-${i}`, scenario);
      }

      // Cleanup should not throw errors
      expect(() => simulator.cleanup()).not.toThrow();
      
      // Should be able to run new simulations after cleanup
      const newSimulator = new UserPersonaSimulator();
      const result = await newSimulator.runSimulation('test-after-cleanup', scenario);
      expect(result.behaviorEvents.length).toBeGreaterThan(0);
      
      newSimulator.cleanup();
    });
  });
});