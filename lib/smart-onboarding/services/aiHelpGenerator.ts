import { 
  AIHelpGenerator,
  HelpContent,
  HelpContext,
  HelpLevel
} from '../interfaces/services';
import { logger } from '../../utils/logger';

export class AIHelpGeneratorImpl implements AIHelpGenerator {
  private apiKey: string;
  private endpoint: string;
  private deploymentName: string;

  constructor() {
    this.apiKey = process.env.AZURE_OPENAI_API_KEY || '';
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
  }

  async generateHelp(context: HelpContext, userState: any): Promise<HelpContent> {
    try {
      const prompt = this.buildHelpPrompt(context, userState);
      const response = await this.callAzureOpenAI(prompt);
      
      const helpContent: HelpContent = {
        id: `ai_help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'contextual',
        level: this.determineHelpLevel(context, userState),
        content: response.content,
        format: 'text',
        priority: 'medium',
        createdAt: new Date(),
        context: {
          stepId: context.currentStep,
          userAction: context.userAction,
          difficulty: context.difficulty
        },
        aiGenerated: true,
        confidence: response.confidence || 0.8
      };

      logger.info(`Generated AI help content:`, {
        helpId: helpContent.id,
        stepId: context.currentStep,
        level: helpContent.level
      });

      return helpContent;
    } catch (error) {
      logger.error('Failed to generate AI help:', error);
      throw error;
    }
  }

  async simplifyText(text: string): Promise<string> {
    try {
      const prompt = `
        Simplify the following text to make it easier to understand for beginners. 
        Use simple words, shorter sentences, and clear explanations:
        
        "${text}"
        
        Simplified version:
      `;

      const response = await this.callAzureOpenAI(prompt);
      return response.content;
    } catch (error) {
      logger.error('Failed to simplify text:', error);
      return text; // Return original text as fallback
    }
  }

  async enhanceText(text: string): Promise<string> {
    try {
      const prompt = `
        Enhance the following text with more technical details and comprehensive explanations 
        for advanced users. Add relevant technical context and best practices:
        
        "${text}"
        
        Enhanced version:
      `;

      const response = await this.callAzureOpenAI(prompt);
      return response.content;
    } catch (error) {
      logger.error('Failed to enhance text:', error);
      return text; // Return original text as fallback
    }
  }

  async simplifyLanguage(text: string): Promise<string> {
    try {
      const prompt = `
        Rewrite the following text using simpler language and vocabulary. 
        Replace complex words with simpler alternatives while maintaining the meaning:
        
        "${text}"
        
        Simplified language version:
      `;

      const response = await this.callAzureOpenAI(prompt);
      return response.content;
    } catch (error) {
      logger.error('Failed to simplify language:', error);
      return text; // Return original text as fallback
    }
  }

  async generateExamples(context: any, count: number = 3): Promise<any[]> {
    try {
      const prompt = `
        Generate ${count} practical examples for the following context:
        Step: ${context.stepId || 'Unknown'}
        Topic: ${context.topic || 'General onboarding'}
        User Level: ${context.userLevel || 'Intermediate'}
        
        Each example should be:
        1. Practical and actionable
        2. Relevant to the current step
        3. Easy to understand
        
        Format as JSON array with objects containing 'title', 'description', and 'steps' fields.
      `;

      const response = await this.callAzureOpenAI(prompt);
      
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        logger.warn('Failed to parse AI examples response, returning default examples');
        return this.getDefaultExamples(count);
      }
    } catch (error) {
      logger.error('Failed to generate examples:', error);
      return this.getDefaultExamples(count);
    }
  }

  async generateVisualAids(context: any): Promise<any[]> {
    try {
      const prompt = `
        Suggest visual aids for the following onboarding context:
        Step: ${context.stepId || 'Unknown'}
        Topic: ${context.topic || 'General onboarding'}
        
        Suggest appropriate visual aids such as:
        - Screenshots with annotations
        - Diagrams or flowcharts
        - Highlighted UI elements
        - Video demonstrations
        
        Format as JSON array with objects containing 'type', 'description', and 'purpose' fields.
      `;

      const response = await this.callAzureOpenAI(prompt);
      
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        logger.warn('Failed to parse AI visual aids response, returning default aids');
        return this.getDefaultVisualAids();
      }
    } catch (error) {
      logger.error('Failed to generate visual aids:', error);
      return this.getDefaultVisualAids();
    }
  }

  async generateInteractiveElements(context: any): Promise<any[]> {
    try {
      const prompt = `
        Suggest interactive elements for the following onboarding context:
        Step: ${context.stepId || 'Unknown'}
        Topic: ${context.topic || 'General onboarding'}
        
        Suggest interactive elements such as:
        - Guided tours with clickable hotspots
        - Interactive tutorials
        - Practice exercises
        - Quizzes or knowledge checks
        
        Format as JSON array with objects containing 'type', 'description', 'interaction', and 'outcome' fields.
      `;

      const response = await this.callAzureOpenAI(prompt);
      
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        logger.warn('Failed to parse AI interactive elements response, returning default elements');
        return this.getDefaultInteractiveElements();
      }
    } catch (error) {
      logger.error('Failed to generate interactive elements:', error);
      return this.getDefaultInteractiveElements();
    }
  }

  private buildHelpPrompt(context: HelpContext, userState: any): string {
    return `
      Generate contextual help content for a user onboarding system with the following context:
      
      Current Step: ${context.currentStep}
      User Action: ${context.userAction || 'Unknown'}
      Difficulty Level: ${context.difficulty || 'Medium'}
      User Technical Level: ${userState.technicalProficiency || 'Intermediate'}
      User Learning Style: ${userState.learningStyle || 'Mixed'}
      
      The help should be:
      1. Contextually relevant to the current step
      2. Appropriate for the user's technical level
      3. Clear and actionable
      4. Encouraging and supportive
      5. Concise but comprehensive
      
      Generate help content that includes:
      - A clear explanation of what the user needs to do
      - Step-by-step instructions if needed
      - Tips for success
      - What to expect next
      
      Keep the tone friendly and supportive. Avoid technical jargon unless the user is advanced.
    `;
  }

  private determineHelpLevel(context: HelpContext, userState: any): HelpLevel {
    if (context.difficulty === 'high' || userState.technicalProficiency === 'beginner') {
      return 'detailed';
    } else if (context.difficulty === 'low' || userState.technicalProficiency === 'advanced') {
      return 'brief';
    } else {
      return 'standard';
    }
  }

  private async callAzureOpenAI(prompt: string): Promise<{ content: string; confidence?: number }> {
    try {
      const response = await fetch(`${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant specialized in creating user onboarding help content. Provide clear, actionable, and supportive guidance.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Azure OpenAI');
      }

      return {
        content: data.choices[0].message.content.trim(),
        confidence: 0.8 // Default confidence score
      };
    } catch (error) {
      logger.error('Azure OpenAI API call failed:', error);
      throw error;
    }
  }

  private getDefaultExamples(count: number): any[] {
    const examples = [
      {
        title: 'Connect Your First Platform',
        description: 'Learn how to connect your social media account',
        steps: ['Click on Connect Platform', 'Choose your platform', 'Authorize the connection']
      },
      {
        title: 'Create Your First Post',
        description: 'Create and schedule your first social media post',
        steps: ['Go to Content Creator', 'Add your content', 'Schedule or publish']
      },
      {
        title: 'Set Up Analytics',
        description: 'Configure analytics to track your performance',
        steps: ['Navigate to Analytics', 'Connect your accounts', 'Review your dashboard']
      }
    ];

    return examples.slice(0, count);
  }

  private getDefaultVisualAids(): any[] {
    return [
      {
        type: 'screenshot',
        description: 'Annotated screenshot showing the key interface elements',
        purpose: 'Help users identify where to click'
      },
      {
        type: 'highlight',
        description: 'Highlighted UI elements with pulsing animation',
        purpose: 'Draw attention to important buttons or areas'
      },
      {
        type: 'arrow',
        description: 'Directional arrows pointing to next actions',
        purpose: 'Guide user attention to the correct sequence'
      }
    ];
  }

  private getDefaultInteractiveElements(): any[] {
    return [
      {
        type: 'guided_tour',
        description: 'Interactive tour with clickable hotspots',
        interaction: 'Click to advance through key features',
        outcome: 'User learns interface layout and key functions'
      },
      {
        type: 'practice_exercise',
        description: 'Hands-on exercise in a safe environment',
        interaction: 'Complete real tasks with guidance',
        outcome: 'User gains confidence through practice'
      },
      {
        type: 'knowledge_check',
        description: 'Quick quiz to verify understanding',
        interaction: 'Answer questions about key concepts',
        outcome: 'Reinforces learning and identifies gaps'
      }
    ];
  }
}