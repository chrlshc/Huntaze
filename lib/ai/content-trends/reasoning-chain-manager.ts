/**
 * DeepSeek R1 Reasoning Chain Manager
 * 
 * Manages reasoning token extraction and isolation for DeepSeek R1.
 * Ensures chain-of-thought is captured but NEVER reinjected into conversation history.
 * 
 * Requirements: 2.3, 2.4
 * Property 2: Reasoning Chain Isolation
 * @see .kiro/specs/content-trends-ai-engine/design.md
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ReasoningStep {
  /** Step number in the reasoning chain */
  step: number;
  /** The thought/reasoning content */
  thought: string;
  /** Evidence or data supporting this step */
  evidence: string[];
  /** Intermediate conclusion */
  conclusion: string;
}

export interface ReasoningChain {
  /** Unique chain identifier */
  id: string;
  /** Task ID this chain belongs to */
  taskId: string;
  /** Individual reasoning steps */
  steps: ReasoningStep[];
  /** Final conclusion from reasoning */
  finalConclusion: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Raw reasoning tokens (for storage only) */
  rawTokens: string;
  /** Timestamp */
  createdAt: Date;
  /** Token count for the reasoning */
  tokenCount: number;
}


export interface R1Response {
  /** The final output (without reasoning tokens) */
  output: string;
  /** Extracted reasoning chain */
  reasoning?: ReasoningChain;
  /** Model metadata */
  metadata: {
    model: string;
    totalTokens: number;
    reasoningTokens: number;
    outputTokens: number;
    latencyMs: number;
  };
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** Flag to indicate this is a reasoning-free message */
  reasoningStripped?: boolean;
}

// ============================================================================
// Reasoning Token Patterns
// ============================================================================

/**
 * Patterns to identify reasoning tokens in DeepSeek R1 output
 * R1 uses <think>...</think> tags for chain-of-thought
 */
const REASONING_PATTERNS = {
  /** Primary think tag pattern */
  thinkTags: /<think>([\s\S]*?)<\/think>/gi,
  /** Alternative reasoning markers */
  reasoningMarkers: /\[REASONING\]([\s\S]*?)\[\/REASONING\]/gi,
  /** Step-by-step markers */
  stepMarkers: /(?:Step \d+:|Let me think:|First,|Then,|Finally,|Therefore,)/gi,
};

/**
 * Patterns to identify reasoning steps within the chain
 */
const STEP_PATTERNS = {
  numbered: /(?:Step (\d+)[:\.]?\s*)([\s\S]*?)(?=Step \d+|$)/gi,
  logical: /(First|Then|Next|Finally|Therefore|Thus|Hence)[,:]?\s*([\s\S]*?)(?=First|Then|Next|Finally|Therefore|Thus|Hence|$)/gi,
};


// ============================================================================
// Reasoning Chain Manager Class
// ============================================================================

export class ReasoningChainManager {
  private storedChains: Map<string, ReasoningChain> = new Map();

  /**
   * Extract reasoning tokens from DeepSeek R1 response
   * 
   * Property 2: Reasoning tokens are captured but NEVER reinjected
   * into conversation history.
   */
  extractReasoningChain(
    taskId: string,
    rawResponse: string,
    latencyMs: number
  ): R1Response {
    const chainId = `chain_${taskId}_${Date.now()}`;
    
    // Extract reasoning content from <think> tags
    const reasoningMatches = rawResponse.match(REASONING_PATTERNS.thinkTags);
    let rawReasoningTokens = '';
    let cleanOutput = rawResponse;

    if (reasoningMatches) {
      // Collect all reasoning tokens
      rawReasoningTokens = reasoningMatches
        .map(match => match.replace(/<\/?think>/gi, '').trim())
        .join('\n\n');

      // Remove reasoning from output (CRITICAL: never reinject)
      cleanOutput = rawResponse.replace(REASONING_PATTERNS.thinkTags, '').trim();
    }

    // Parse reasoning into structured steps
    const steps = this.parseReasoningSteps(rawReasoningTokens);
    
    // Calculate token counts (rough estimate)
    const reasoningTokens = Math.ceil(rawReasoningTokens.length / 4);
    const outputTokens = Math.ceil(cleanOutput.length / 4);

    // Build reasoning chain
    const chain: ReasoningChain = {
      id: chainId,
      taskId,
      steps,
      finalConclusion: this.extractFinalConclusion(steps, cleanOutput),
      confidence: this.calculateConfidence(steps),
      rawTokens: rawReasoningTokens,
      createdAt: new Date(),
      tokenCount: reasoningTokens,
    };

    // Store chain for later retrieval (but never for reinjection)
    this.storedChains.set(chainId, chain);

    return {
      output: cleanOutput,
      reasoning: rawReasoningTokens ? chain : undefined,
      metadata: {
        model: 'deepseek-r1',
        totalTokens: reasoningTokens + outputTokens,
        reasoningTokens,
        outputTokens,
        latencyMs,
      },
    };
  }


  /**
   * Parse raw reasoning text into structured steps
   */
  private parseReasoningSteps(rawReasoning: string): ReasoningStep[] {
    if (!rawReasoning) return [];

    const steps: ReasoningStep[] = [];
    let stepNumber = 1;

    // Try numbered step pattern first
    const numberedMatches = [...rawReasoning.matchAll(STEP_PATTERNS.numbered)];
    
    if (numberedMatches.length > 0) {
      for (const match of numberedMatches) {
        steps.push({
          step: parseInt(match[1], 10) || stepNumber++,
          thought: match[2].trim(),
          evidence: this.extractEvidence(match[2]),
          conclusion: this.extractStepConclusion(match[2]),
        });
      }
    } else {
      // Fall back to logical markers
      const logicalMatches = [...rawReasoning.matchAll(STEP_PATTERNS.logical)];
      
      if (logicalMatches.length > 0) {
        for (const match of logicalMatches) {
          steps.push({
            step: stepNumber++,
            thought: `${match[1]}: ${match[2].trim()}`,
            evidence: this.extractEvidence(match[2]),
            conclusion: this.extractStepConclusion(match[2]),
          });
        }
      } else {
        // Single step for unstructured reasoning
        steps.push({
          step: 1,
          thought: rawReasoning.trim(),
          evidence: this.extractEvidence(rawReasoning),
          conclusion: this.extractStepConclusion(rawReasoning),
        });
      }
    }

    return steps;
  }

  /**
   * Extract evidence/data points from reasoning text
   */
  private extractEvidence(text: string): string[] {
    const evidence: string[] = [];
    
    // Look for quoted content
    const quotes = text.match(/"([^"]+)"/g);
    if (quotes) {
      evidence.push(...quotes.map(q => q.replace(/"/g, '')));
    }

    // Look for numerical data
    const numbers = text.match(/\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?|\d+(?:,\d+)+/g);
    if (numbers) {
      evidence.push(...numbers);
    }

    return evidence;
  }


  /**
   * Extract conclusion from a reasoning step
   */
  private extractStepConclusion(text: string): string {
    // Look for conclusion markers
    const conclusionPatterns = [
      /(?:therefore|thus|hence|so|consequently)[,:]?\s*(.+?)(?:\.|$)/i,
      /(?:this means|this shows|this indicates)[,:]?\s*(.+?)(?:\.|$)/i,
    ];

    for (const pattern of conclusionPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Return last sentence as conclusion
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return sentences[sentences.length - 1]?.trim() || '';
  }

  /**
   * Extract final conclusion from reasoning chain
   */
  private extractFinalConclusion(steps: ReasoningStep[], output: string): string {
    // If we have steps, use the last step's conclusion
    if (steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      if (lastStep.conclusion) {
        return lastStep.conclusion;
      }
    }

    // Otherwise, extract from output
    const firstParagraph = output.split('\n\n')[0];
    return firstParagraph?.substring(0, 500) || output.substring(0, 500);
  }

  /**
   * Calculate confidence score based on reasoning quality
   */
  private calculateConfidence(steps: ReasoningStep[]): number {
    if (steps.length === 0) return 0.5;

    let score = 0.5; // Base score

    // More steps = more thorough reasoning
    score += Math.min(steps.length * 0.05, 0.2);

    // Evidence increases confidence
    const totalEvidence = steps.reduce((sum, s) => sum + s.evidence.length, 0);
    score += Math.min(totalEvidence * 0.02, 0.15);

    // Clear conclusions increase confidence
    const conclusionCount = steps.filter(s => s.conclusion.length > 10).length;
    score += Math.min(conclusionCount * 0.05, 0.15);

    return Math.min(score, 1.0);
  }


  /**
   * Prepare conversation history for R1 WITHOUT reasoning tokens
   * 
   * CRITICAL: This ensures reasoning chains are NEVER reinjected
   * into the conversation, preserving R1's reasoning capabilities.
   */
  prepareConversationHistory(
    messages: ConversationMessage[]
  ): ConversationMessage[] {
    return messages.map(msg => {
      if (msg.role === 'assistant' && !msg.reasoningStripped) {
        // Strip any reasoning tokens from assistant messages
        const cleanContent = msg.content
          .replace(REASONING_PATTERNS.thinkTags, '')
          .replace(REASONING_PATTERNS.reasoningMarkers, '')
          .trim();

        return {
          ...msg,
          content: cleanContent,
          reasoningStripped: true,
        };
      }
      return msg;
    });
  }

  /**
   * Build minimal system prompt for R1
   * 
   * Requirement 2.3: Minimal or null system instructions
   * to preserve reinforcement learning pathways
   */
  buildMinimalSystemPrompt(taskContext?: string): string | null {
    // R1 works best with minimal system prompts
    // Only provide essential context, no personality or style instructions
    if (!taskContext) {
      return null; // No system prompt is often best for R1
    }

    // Keep it extremely minimal
    return `Context: ${taskContext}`;
  }

  /**
   * Force R1 into Chain-of-Thought mode
   * 
   * Requirement 2.7: Pre-fill injection of <think> tags
   * when reasoning is being skipped
   */
  buildThinkingPrompt(userPrompt: string): string {
    return `${userPrompt}\n\n<think>`;
  }

  /**
   * Retrieve a stored reasoning chain
   */
  getReasoningChain(chainId: string): ReasoningChain | undefined {
    return this.storedChains.get(chainId);
  }

  /**
   * Get all reasoning chains for a task
   */
  getTaskReasoningChains(taskId: string): ReasoningChain[] {
    return Array.from(this.storedChains.values())
      .filter(chain => chain.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Clear old reasoning chains (memory management)
   */
  clearOldChains(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAgeMs;
    let cleared = 0;

    for (const [id, chain] of this.storedChains) {
      if (chain.createdAt.getTime() < cutoff) {
        this.storedChains.delete(id);
        cleared++;
      }
    }

    return cleared;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let managerInstance: ReasoningChainManager | null = null;

export function getReasoningChainManager(): ReasoningChainManager {
  if (!managerInstance) {
    managerInstance = new ReasoningChainManager();
  }
  return managerInstance;
}
