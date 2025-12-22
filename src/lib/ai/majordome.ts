// src/lib/ai/majordome.ts
//
// 🎩 The Majordome Orchestrator - Full Azure AI Integration
// - Uses Azure AI Foundry models (DeepSeek, Phi-4, Llama)
// - Integrates with Knowledge Base for smart strategies
// - Orchestrates all OnlyFans systems
// - Returns crisp, human-facing replies

import { callAzureAI, cleanDeepSeekOutput } from './providers/azure-ai';
import { prisma } from '@/lib/prisma';

type MajordomeResult =
  | { type: "REPLY"; message: string }
  | { type: "ACTION_STARTED"; message: string; jobs?: Array<{ name: string; jobId: string }> }
  | {
      type: "NEEDS_CONFIRMATION";
      message: string;
      pending: Array<{ name: string; arguments: Record<string, unknown> }>;
    }
  | { type: "ERROR"; message: string; details?: unknown };

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content?: string | null; tool_calls?: any[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type AskMajordomeOptions = {
  userId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  pending?: Array<{ name: string; arguments: Record<string, unknown> }>;
};

// Enhanced tools with full Azure AI integration
const MAJORDOME_TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_content",
      description: "Générer du contenu OnlyFans avec Azure AI (DeepSeek/Phi-4)",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["post", "message", "ppv", "story"] },
          tone: { type: "string", enum: ["seductive", "playful", "romantic", "bold", "mysterious"] },
          topic: { type: "string", description: "Sujet du contenu" },
          model: { type: "string", enum: ["deepseek", "phi4", "llama"], description: "Modèle IA à utiliser" },
        },
        required: ["type", "tone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_fans",
      description: "Analyser les données fans avec Azure AI et Knowledge Base",
      parameters: {
        type: "object",
        properties: {
          timeframe: { type: "string", enum: ["7d", "30d", "90d"] },
          segment: { type: "string", enum: ["all", "vip", "new", "at_risk"] },
          deepAnalysis: { type: "boolean", description: "Utiliser DeepSeek pour analyse profonde" },
        },
        required: ["timeframe"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_smart_replies",
      description: "Obtenir des réponses intelligentes depuis la Knowledge Base",
      parameters: {
        type: "object",
        properties: {
          fanMessage: { type: "string", description: "Message du fan" },
          context: { type: "string", description: "Contexte de la conversation" },
        },
        required: ["fanMessage"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_post",
      description: "Programmer la publication de contenu multi-plateforme",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "Contenu du post" },
          scheduleTime: { type: "string", description: "Date et heure (ISO)" },
          platforms: { type: "array", items: { type: "string" }, description: "Plateformes" },
          optimize: { type: "boolean", description: "Optimiser avec Azure AI" },
        },
        required: ["content", "scheduleTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "track_performance",
      description: "Suivre les performances et générer des rapports Azure AI",
      parameters: {
        type: "object",
        properties: {
          metric: { type: "string", enum: ["revenue", "engagement", "growth", "retention"] },
          period: { type: "string", enum: ["daily", "weekly", "monthly"] },
          insights: { type: "boolean", description: "Générer insights avec DeepSeek" },
        },
        required: ["metric", "period"],
      },
    },
  },
];

function systemPrompt(opts: AskMajordomeOptions): string {
  return [
    `Tu es "Le Majordome", l'assistant IA personnel d'une créatrice OnlyFans.`,
    `Tu utilises le système Azure AI Foundry complet:`,
    `- DeepSeek R1 pour analyses profondes et stratégies complexes`,
    `- Phi-4 Mini pour réponses rapides et génération de contenu`,
    `- Llama 3-70B comme modèle alternatif`,
    `- Knowledge Base avec stratégies validées`,
    `- Feedback loop pour optimiser les conversions`,
    ``,
    `Règles:`,
    `- Réponds en français, de manière élégante et professionnelle`,
    `- Choisis le modèle approprié: DeepSeek pour la stratégie, Phi-4 pour la vitesse`,
    `- Utilise la Knowledge Base pour les réponses éprouvées`,
    `- Si la demande nécessite une action, utilise un outil.`,
    `- Pour les analyses complexes, utilise DeepSeek`,
    `- Pour le contenu et réponses rapides, utilise Phi-4`,
    `- Demande confirmation avec "CONFIRME" pour les actions critiques.`,
    `- Sois concis mais complet dans tes réponses.`,
    opts.userId ? `Contexte: userId=${opts.userId}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function isExplicitConfirmation(text: string): boolean {
  const t = text.trim().toUpperCase();
  return t === "CONFIRME" || t === "CONFIRMÉ" || t === "CONFIRMEE" || t === "CONFIRMÉE";
}

function safeJsonParse(input: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Invalid JSON" };
  }
}

async function executeTool(name: string, args: any, opts: AskMajordomeOptions): Promise<any> {
  switch (name) {
    case "generate_content":
      const model = args.model || (args.type === 'ppv' ? 'deepseek' : 'phi4');
      const contentResponse = await callAzureAI({
        model,
        messages: [
          { 
            role: 'system', 
            content: `Tu es un expert en création de contenu OnlyFans. Génère du contenu ${args.tone} et engageant.` 
          },
          { 
            role: 'user', 
            content: `Type: ${args.type}\nTon: ${args.tone}\nSujet: ${args.topic || 'général'}\n\nGénère le contenu parfait.` 
          }
        ],
        temperature: model === 'deepseek' ? 0.7 : 0.8,
        maxTokens: model === 'deepseek' ? 400 : 300,
      });
      
      return { 
        ok: true, 
        content: model === 'deepseek' ? cleanDeepSeekOutput(contentResponse.content) : contentResponse.content,
        model 
      };

    case "analyze_fans":
      const analysisModel = args.deepAnalysis ? 'deepseek' : 'phi4';
      const analysisResponse = await callAzureAI({
        model: analysisModel,
        messages: [
          { role: 'system', content: 'Analyse les données fans OnlyFans et fournis des insights actionnables.' },
          { role: 'user', content: `Analyse les fans ${args.segment} sur ${args.timeframe}` }
        ],
        temperature: 0.3,
        maxTokens: 500,
      });

      // Get real data from database
      const fanStats = await prisma.fan.findMany({
        where: {
          creatorId: opts.userId ? parseInt(opts.userId) : undefined,
        },
        take: 100,
        orderBy: { totalSpent: 'desc' }
      });

      return {
        ok: true,
        analysis: analysisModel === 'deepseek' ? cleanDeepSeekOutput(analysisResponse.content) : analysisResponse.content,
        stats: {
          totalFans: fanStats.length,
          vipFans: fanStats.filter(f => f.totalSpent > 100).length,
          totalRevenue: fanStats.reduce((sum, f) => sum + f.totalSpent, 0),
        },
        model: analysisModel,
      };

    case "get_smart_replies":
      // Query knowledge base for smart replies
      const kbResults = await prisma.knowledgeBaseItem.findMany({
        where: {
          kind: 'CHAT_CLOSER_PLAY',
          status: 'ACTIVE',
          OR: [
            { creatorId: opts.userId ? parseInt(opts.userId) : undefined },
            { creatorId: null },
          ],
        },
        orderBy: { score: 'desc' },
        take: 5,
      });

      // Use Phi-4 to select and personalize best reply
      const replyResponse = await callAzureAI({
        model: 'phi4',
        messages: [
          { role: 'system', content: 'Sélectionne et adapte la meilleure réponse depuis la Knowledge Base.' },
          { 
            role: 'user', 
            content: `Message fan: ${args.fanMessage}\nContexte: ${args.context || ''}\n\nRéponses disponibles:\n${kbResults.map(k => `- ${k.inputText} -> ${k.outputText}`).join('\n')}\n\nChoisis et adapte la meilleure.` 
          }
        ],
        temperature: 0.6,
        maxTokens: 200,
      });

      return { 
        ok: true, 
        replies: kbResults.map(k => ({
          id: k.id,
          input: k.inputText,
          output: k.outputText,
          score: k.score,
        })),
        suggestedReply: replyResponse.content,
        model: 'phi4',
      };

    case "schedule_post":
      // Optimize content if requested
      let optimizedContent = args.content;
      if (args.optimize) {
        const optimizeResponse = await callAzureAI({
          model: 'phi4',
          messages: [
            { role: 'system', content: 'Optimise le contenu pour maximiser l\'engagement.' },
            { role: 'user', content: `Optimise: ${args.content}` }
          ],
          temperature: 0.5,
          maxTokens: 300,
        });
        optimizedContent = optimizeResponse.content;
      }

      // Schedule the post (mock implementation)
      const jobId = `job_${Date.now()}`;
      
      return {
        ok: true,
        scheduled: true,
        postId: `post_${Date.now()}`,
        scheduledTime: args.scheduleTime,
        platforms: args.platforms,
        optimizedContent,
        jobId,
      };

    case "track_performance":
      const insightsModel = args.insights ? 'deepseek' : 'phi4';
      
      // Get real performance data
      const performanceData = await prisma.message.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - (args.period === 'daily' ? 1 : args.period === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000)
          }
        },
        _count: true,
      });

      const insightsResponse = await callAzureAI({
        model: insightsModel,
        messages: [
          { role: 'system', content: 'Analyse les performances et génère des insights stratégiques.' },
          { 
            role: 'user', 
            content: `Analyse ${args.metric} sur ${args.period}\n\nDonnées: ${JSON.stringify(performanceData)}` 
          }
        ],
        temperature: 0.4,
        maxTokens: 400,
      });

      return {
        ok: true,
        insights: insightsModel === 'deepseek' ? cleanDeepSeekOutput(insightsResponse.content) : insightsResponse.content,
        data: performanceData,
        model: insightsModel,
      };

    default:
      return { ok: false, error: `Unknown tool: ${name}` };
  }
}

/**
 * Main entrypoint - Full Azure AI Integration
 */
export async function askMajordome(userRequest: string, opts: AskMajordomeOptions = {}): Promise<MajordomeResult> {
  // Handle confirmations
  if (opts.pending?.length && isExplicitConfirmation(userRequest)) {
    const results = await Promise.all(
      opts.pending.map(async (p) => ({ name: p.name, result: await executeTool(p.name, p.arguments, opts) })),
    );
    
    const jobs = results.filter(r => r.result.jobId).map(r => ({ name: r.name, jobId: r.result.jobId }));
    
    return {
      type: jobs.length > 0 ? "ACTION_STARTED" : "REPLY",
      message: jobs.length > 0 
        ? `🎩 Entendu Madame. J'ai lancé ${jobs.length} action(s) avec Azure AI.`
        : `🎩 Entendu Madame. C'est fait avec Azure AI.`,
      jobs,
    };
  }

  // Build conversation
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(opts) },
    ...(opts.history?.map((m) => ({ role: m.role, content: m.content } as any)) ?? []),
    { role: "user", content: userRequest },
  ];

  // Multi-turn execution with Azure AI
  let safetyLoop = 0;
  while (safetyLoop < 3) {
    safetyLoop += 1;

    try {
      // Use Phi-4 for orchestration (fast tool selection)
      const response = await callAzureAI({
        model: 'phi4',
        messages,
        temperature: 0.2,
        maxTokens: 500,
        tools: MAJORDOME_TOOLS,
        toolChoice: 'auto',
      });

      const toolCalls = response.tool_calls;

      // No tools needed - direct reply
      if (!toolCalls?.length) {
        return { type: "REPLY", message: response.content };
      }

      // Add assistant message with tool calls
      messages.push({ 
        role: "assistant", 
        content: response.content, 
        tool_calls: toolCalls 
      });

      // Check for confirmations
      const pending: Array<{ name: string; arguments: Record<string, unknown> }> = [];
      for (const call of toolCalls) {
        if (call.function?.name === 'schedule_post') {
          const parsed = safeJsonParse(call.function.arguments);
          pending.push({ name: call.function.name, arguments: parsed.ok ? parsed.value : {} });
        }
      }

      if (pending.length) {
        return {
          type: "NEEDS_CONFIRMATION",
          message: `🎩 Madame, cette action utilise Azure AI. Dites "CONFIRME" pour exécuter.`,
          pending,
        };
      }

      // Execute tools in parallel
      const executed = await Promise.all(
        toolCalls.map(async (call) => {
          const parsed = safeJsonParse(call.function.arguments);
          const result = parsed.ok
            ? await executeTool(call.function.name, parsed.value, opts)
            : { ok: false, error: "Invalid arguments" };

          return {
            tool_call_id: call.id,
            content: JSON.stringify(result),
          };
        }),
      );

      // Add tool results
      for (const toolResult of executed) {
        messages.push({
          role: "tool",
          tool_call_id: toolResult.tool_call_id,
          content: toolResult.content,
        });
      }

      // Continue if more tools needed
    } catch (error) {
      console.error("Majordome Azure AI error:", error);
      return {
        type: "ERROR",
        message: "Erreur Azure AI. Vérifiez votre configuration.",
        details: error,
      };
    }
  }

  return {
    type: "ERROR",
    message: "Trop d'actions. Simplifiez votre demande SVP.",
  };
}
