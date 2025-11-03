# Design Document - AI Agent System

## Overview

The AI Agent System is an integrated, multi-agent architecture that enables users to interact with all Huntaze platform features through natural language. The system uses Azure OpenAI (GPT-4o) for intent analysis and response generation, with specialized agents that execute domain-specific tasks across OnlyFans CRM, Content Creation, Social Media, Analytics, and workflow coordination.

Unlike a floating widget, this system is deeply integrated into the application with a dedicated interface at `/ai/assistant` and context-aware capabilities that understand the user's current location and workflow state.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AI Assistant Page (/ai/assistant)                     │ │
│  │  - Conversation Interface                              │ │
│  │  - Quick Actions Panel                                 │ │
│  │  - Agent Status Display                                │ │
│  │  - Action Results Viewer                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  POST /api/ai/agents - Process natural language requests    │
│  GET  /api/ai/agents - Get available agents & capabilities  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Azure Multi-Agent Service                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Intent Analyzer (GPT-4o)                              │ │
│  │  - Analyze user message                                │ │
│  │  - Extract intent, agents, params, priority            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Execution Planner                                     │ │
│  │  - Create task sequence                                │ │
│  │  - Determine agent actions                             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Task Executor                                         │ │
│  │  - Execute tasks sequentially                          │ │
│  │  - Track status and results                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Response Generator (GPT-4o)                           │ │
│  │  - Generate natural language response                  │ │
│  │  - Format results and suggestions                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Agent Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  OnlyFans    │  │   Content    │  │    Social    │      │
│  │  CRM Agent   │  │ Creation Agt │  │  Media Agent │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Analytics   │  │ Coordinator  │                        │
│  │    Agent     │  │    Agent     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Service & Repository Layer                  │
│  - FansRepository, ContentItemsRepository                    │
│  - TikTokUploadService, InstagramPublishService             │
│  - AIContentService, MediaUploadService                     │
│  - AnalyticsRepository, CampaignsRepository                 │
└─────────────────────────────────────────────────────────────┘
```

### Agent Architecture

Each agent is a self-contained capability unit with:
- **Name**: Human-readable identifier
- **Description**: What the agent does
- **Actions**: List of executable operations
- **Execute Method**: Function that routes actions to implementations

Agents are registered in a Map structure for O(1) lookup and can be dynamically queried for their capabilities.

## Components and Interfaces

### 1. AzureMultiAgentService

**Location**: `lib/services/azureMultiAgentService.ts`

**Purpose**: Core orchestration service that manages all agents and coordinates task execution.

**Key Methods**:

```typescript
class AzureMultiAgentService {
  // Main entry point for natural language requests
  async processUserRequest(
    message: string, 
    userId: string, 
    context?: any
  ): Promise<string>
  
  // Direct action execution (bypass NLP)
  async executeDirectAction(
    agentKey: string, 
    action: string, 
    params: any
  ): Promise<any>
  
  // Get all available agents
  async getAvailableAgents(): Promise<Agent[]>
  
  // Internal: Analyze user intent with GPT-4o
  private async analyzeIntent(
    message: string, 
    context?: any
  ): Promise<Intent>
  
  // Internal: Create execution plan
  private async createExecutionPlan(
    intent: Intent
  ): Promise<AgentTask[]>
  
  // Internal: Execute all tasks
  private async executePlan(
    tasks: AgentTask[], 
    userId: string
  ): Promise<AgentTask[]>
  
  // Internal: Generate response with GPT-4o
  private async generateResponse(
    intent: Intent, 
    results: AgentTask[]
  ): Promise<string>
}
```

**Agent Registration**:
```typescript
private initializeAgents() {
  this.agents.set('onlyfans-crm', {
    name: 'OnlyFans CRM Agent',
    description: 'Manages OnlyFans fans, messages, and campaigns',
    actions: ['get_fans', 'send_message', 'create_campaign', ...],
    execute: this.executeOnlyFansAction.bind(this)
  });
  // ... other agents
}
```

### 2. API Endpoints

**Location**: `app/api/ai/agents/route.ts`

**POST /api/ai/agents**

Processes user requests (natural language or direct actions).

Request Body:
```typescript
{
  // Natural language mode
  message?: string;
  context?: {
    currentPage: string;
    userRole: string;
    previousMessages?: Message[];
  };
  
  // OR Direct action mode
  directAction?: {
    agentKey: string;
    action: string;
    params: Record<string, any>;
  };
}
```

Response:
```typescript
{
  type: 'natural_language' | 'direct_action';
  message?: string;  // For natural language
  result?: any;      // For direct action
  agentKey?: string;
  action?: string;
  timestamp: string;
}
```

**GET /api/ai/agents**

Returns all available agents and their capabilities.

Response:
```typescript
{
  agents: Array<{
    key: string;
    name: string;
    description: string;
    actions: string[];
  }>;
  totalAgents: number;
  capabilities: number;
}
```

### 3. AI Assistant Page

**Location**: `app/ai/assistant/page.tsx`

**Purpose**: Main user interface for interacting with the AI agent system.

**Components**:

```typescript
// Main page component
export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  
  // Load available agents on mount
  useEffect(() => {
    loadAgents();
  }, []);
  
  // Send message to AI
  const handleSend = async () => {
    // Add user message to conversation
    // Call POST /api/ai/agents
    // Add assistant response to conversation
  };
  
  // Execute quick action
  const executeQuickAction = async (
    agentKey: string, 
    action: string, 
    params: any
  ) => {
    // Call POST /api/ai/agents with directAction
  };
  
  return (
    <div className="ai-assistant-container">
      <AgentPanel agents={agents} />
      <ConversationArea messages={messages} />
      <QuickActionsPanel onAction={executeQuickAction} />
      <InputArea onSend={handleSend} />
    </div>
  );
}
```

**UI Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  AI Assistant                                    [Help] │
├──────────────┬──────────────────────────────────────────┤
│              │  Conversation Area                       │
│  Agent Panel │  ┌────────────────────────────────────┐  │
│              │  │ User: Get my fan stats             │  │
│  ● OnlyFans  │  └────────────────────────────────────┘  │
│  ● Content   │  ┌────────────────────────────────────┐  │
│  ● Social    │  │ AI: You have 234 fans, 70 active   │  │
│  ● Analytics │  │     today. Top spender: @user123   │  │
│  ● Workflow  │  │     [View Details]                 │  │
│              │  └────────────────────────────────────┘  │
│              │                                          │
│  Quick       │  ┌────────────────────────────────────┐  │
│  Actions:    │  │ User: Create a TikTok post         │  │
│  • Fan Stats │  └────────────────────────────────────┘  │
│  • Caption   │  ┌────────────────────────────────────┐  │
│  • Publish   │  │ AI: I'll help you create content.  │  │
│  • Report    │  │     What's the topic?              │  │
│              │  └────────────────────────────────────┘  │
├──────────────┴──────────────────────────────────────────┤
│  [Type your message...]                    [Send] [🎤] │
└─────────────────────────────────────────────────────────┘
```

### 4. Agent Components

**Location**: `components/ai/` directory

**AgentPanel.tsx**:
```typescript
interface AgentPanelProps {
  agents: Agent[];
  selectedAgent?: string;
  onSelectAgent?: (agentKey: string) => void;
}

export function AgentPanel({ agents, selectedAgent, onSelectAgent }: AgentPanelProps) {
  return (
    <div className="agent-panel">
      <h3>Available Agents</h3>
      {agents.map(agent => (
        <AgentCard 
          key={agent.key}
          agent={agent}
          isSelected={selectedAgent === agent.key}
          onClick={() => onSelectAgent?.(agent.key)}
        />
      ))}
    </div>
  );
}
```

**ConversationArea.tsx**:
```typescript
interface ConversationAreaProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ConversationArea({ messages, isLoading }: ConversationAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="conversation-area">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
}
```

**QuickActionsPanel.tsx**:
```typescript
interface QuickAction {
  label: string;
  agentKey: string;
  action: string;
  params?: any;
  icon: React.ReactNode;
}

interface QuickActionsPanelProps {
  onAction: (agentKey: string, action: string, params: any) => void;
}

export function QuickActionsPanel({ onAction }: QuickActionsPanelProps) {
  const quickActions: QuickAction[] = [
    { 
      label: 'Get Fan Stats', 
      agentKey: 'onlyfans-crm', 
      action: 'get_fan_stats',
      icon: <Users />
    },
    { 
      label: 'Generate Caption', 
      agentKey: 'content-creator', 
      action: 'generate_caption',
      params: { prompt: 'beach sunset', platform: 'instagram' },
      icon: <Sparkles />
    },
    // ... more actions
  ];
  
  return (
    <div className="quick-actions-panel">
      <h4>Quick Actions</h4>
      <div className="actions-grid">
        {quickActions.map(action => (
          <QuickActionButton 
            key={action.label}
            action={action}
            onClick={() => onAction(action.agentKey, action.action, action.params || {})}
          />
        ))}
      </div>
    </div>
  );
}
```

**ActionResultViewer.tsx**:
```typescript
interface ActionResultViewerProps {
  result: any;
  type: 'natural_language' | 'direct_action';
}

export function ActionResultViewer({ result, type }: ActionResultViewerProps) {
  if (!result) return null;
  
  // Format different result types
  if (Array.isArray(result)) {
    return <ResultTable data={result} />;
  }
  
  if (typeof result === 'object') {
    return <ResultCard data={result} />;
  }
  
  return <pre className="result-json">{JSON.stringify(result, null, 2)}</pre>;
}
```

## Data Models

### Intent

```typescript
interface Intent {
  intent: string;           // Primary user intent (e.g., "get_fan_statistics")
  agents: string[];         // Required agent keys
  parameters: Record<string, any>;  // Extracted parameters
  priority: 'urgent' | 'normal' | 'low';
  confidence: number;       // 0-1 confidence score
}
```

### AgentTask

```typescript
interface AgentTask {
  id: string;              // Unique task ID
  type: 'onlyfans' | 'content' | 'social' | 'analytics' | 'general';
  action: string;          // Action name (e.g., "get_fans")
  params: Record<string, any>;  // Action parameters
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;            // Action result (if completed)
  error?: string;          // Error message (if failed)
}
```

### Agent

```typescript
interface Agent {
  key: string;             // Unique agent identifier
  name: string;            // Display name
  description: string;     // What the agent does
  actions: string[];       // Available actions
}
```

### AgentCapability

```typescript
interface AgentCapability {
  name: string;
  description: string;
  actions: string[];
  execute: (action: string, params: any) => Promise<any>;
}
```

### Message

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'natural_language' | 'direct_action';
  actionResult?: any;
  metadata?: {
    agentKey?: string;
    action?: string;
    confidence?: number;
  };
}
```

## Error Handling

### Error Types

1. **Authentication Errors** (401)
   - User not authenticated
   - Invalid session
   - Response: `{ error: 'Authentication required' }`

2. **Validation Errors** (400)
   - Missing required parameters
   - Invalid agent key
   - Invalid action name
   - Response: `{ error: 'Message or direct action is required' }`

3. **Agent Errors** (500)
   - Agent not found
   - Action not available
   - Execution failure
   - Response: `{ error: 'Failed to process request', details: string }`

4. **Service Errors** (500)
   - OpenAI API failure
   - Database connection error
   - External service timeout
   - Response: `{ error: 'Service temporarily unavailable' }`

### Error Handling Strategy

```typescript
// In AzureMultiAgentService
async processUserRequest(message: string, userId: string, context?: any): Promise<string> {
  try {
    const intent = await this.analyzeIntent(message, context);
    const plan = await this.createExecutionPlan(intent);
    const results = await this.executePlan(plan, userId);
    return await this.generateResponse(intent, results);
  } catch (error) {
    console.error('Multi-agent processing error:', error);
    
    // Return user-friendly error message
    if (error instanceof AuthenticationError) {
      return 'Please log in to use the AI assistant.';
    }
    
    if (error instanceof ValidationError) {
      return `I couldn't understand that request. ${error.message}`;
    }
    
    return 'I encountered an error processing your request. Please try again or be more specific.';
  }
}

// In task execution
private async executePlan(tasks: AgentTask[], userId: string): Promise<AgentTask[]> {
  const results: AgentTask[] = [];
  
  for (const task of tasks) {
    try {
      task.status = 'executing';
      const agent = this.agents.get(this.getAgentKeyFromTaskType(task.type));
      
      if (agent) {
        task.result = await agent.execute(task.action, { ...task.params, userId });
        task.status = 'completed';
      } else {
        task.status = 'failed';
        task.error = 'Agent not found';
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      // Continue with next task instead of failing entire plan
    }
    
    results.push(task);
  }
  
  return results;
}
```

## Testing Strategy

### Unit Tests

1. **Agent Registration Tests**
   - Test: All 5 agents are registered
   - Test: Each agent has correct actions
   - Test: Agent execute methods are bound correctly

2. **Intent Analysis Tests**
   - Test: Simple requests are analyzed correctly
   - Test: Complex multi-agent requests are identified
   - Test: Low confidence returns appropriate response
   - Test: Context is considered in analysis

3. **Execution Planning Tests**
   - Test: Single-agent plans are created correctly
   - Test: Multi-agent plans have correct sequence
   - Test: Task IDs are unique
   - Test: Parameters are extracted correctly

4. **Task Execution Tests**
   - Test: Tasks execute in order
   - Test: Failed tasks don't stop execution
   - Test: Results are captured correctly
   - Test: User ID is passed to all actions

5. **Agent Action Tests**
   - Test each agent's actions individually
   - Test: OnlyFans CRM actions (get_fans, send_message, etc.)
   - Test: Content Creation actions (create_content, generate_caption, etc.)
   - Test: Social Media actions (publish_tiktok, get_social_stats, etc.)
   - Test: Analytics actions (get_overview, generate_report, etc.)
   - Test: Coordinator actions (plan_campaign, execute_workflow, etc.)

### Integration Tests

1. **End-to-End Request Flow**
   - Test: Natural language request → response
   - Test: Direct action execution
   - Test: Multi-step workflow execution

2. **API Endpoint Tests**
   - Test: POST /api/ai/agents with natural language
   - Test: POST /api/ai/agents with direct action
   - Test: GET /api/ai/agents returns all agents
   - Test: Authentication is enforced

3. **UI Component Tests**
   - Test: Message sending and display
   - Test: Quick action execution
   - Test: Agent panel interaction
   - Test: Result rendering

### Performance Tests

1. **Response Time Tests**
   - Test: Simple queries complete within 3 seconds
   - Test: Complex queries complete within 10 seconds
   - Test: Parallel task execution improves performance

2. **Load Tests**
   - Test: System handles 10 concurrent users
   - Test: System handles 100 requests per minute
   - Test: Memory usage remains stable

## Security Considerations

1. **Authentication**
   - All requests must include valid session
   - User ID is extracted from session, not request body
   - Unauthorized requests return 401

2. **Authorization**
   - Agents respect existing RBAC
   - Users can only access their own data
   - Admin-only actions are protected

3. **Input Validation**
   - All user inputs are sanitized
   - SQL injection prevention via parameterized queries
   - XSS prevention via React's built-in escaping

4. **Rate Limiting**
   - Implement rate limiting on /api/ai/agents
   - Limit: 60 requests per minute per user
   - Prevent abuse of OpenAI API

5. **Data Privacy**
   - User messages are not logged permanently
   - Sensitive data is not sent to OpenAI
   - Results are filtered for PII

## Performance Optimization

1. **Caching**
   - Cache agent capabilities (no need to re-initialize)
   - Cache frequently used data (fan counts, stats)
   - Use Redis for distributed caching

2. **Parallel Execution**
   - Execute independent tasks in parallel
   - Use Promise.all() for concurrent operations
   - Reduce total execution time

3. **Connection Pooling**
   - Reuse database connections
   - Reuse OpenAI client instance
   - Reduce connection overhead

4. **Response Streaming**
   - Stream GPT-4o responses for faster perceived performance
   - Show typing indicators during processing
   - Update UI progressively

## Deployment Considerations

1. **Environment Variables**
   ```
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o
   AI_AGENT_RATE_LIMIT=60
   AI_AGENT_TIMEOUT=30000
   ```

2. **Monitoring**
   - Track request volume
   - Monitor response times
   - Alert on high error rates
   - Track OpenAI API usage and costs

3. **Scaling**
   - Service is stateless (can scale horizontally)
   - Use load balancer for multiple instances
   - Consider serverless deployment for cost efficiency

4. **Fallback Strategy**
   - If OpenAI API is down, provide manual action buttons
   - Cache common responses
   - Graceful degradation to direct actions only
