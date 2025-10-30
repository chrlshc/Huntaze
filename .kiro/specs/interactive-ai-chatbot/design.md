# Design Document - Interactive AI Chatbot

## Overview

Ce système fournit un chatbot AI interactif avec interface temps réel, gestion de conversations multi-tours, intent recognition, et backend NestJS déployé sur AWS ECS. L'infrastructure AI (AIService) existe déjà, ce design se concentre sur l'interface chat, le backend temps réel, et la gestion des conversations.

### Objectifs

1. **Interface chat moderne** avec streaming temps réel
2. **Backend scalable** avec NestJS sur AWS ECS
3. **Gestion de conversations** avec contexte multi-tours
4. **Intent recognition** pour routage intelligent
5. **Analytics** pour amélioration continue

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                             │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  Chat UI         │────────▶│  WebSocket Client            │  │
│  │  /app/chat/      │         │  - Socket.io client          │  │
│  │                  │         │  - Auto-reconnect            │  │
│  └──────────────────┘         │  - Message streaming         │  │
│                                └──────────┬───────────────────┘  │
└───────────────────────────────────────────┼──────────────────────┘
                                            │ WebSocket
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NestJS Backend (AWS ECS)                        │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  WebSocket       │────────▶│  ChatGateway                 │  │
│  │  Gateway         │         │  - Socket.io server          │  │
│  │  (Socket.io)     │         │  - Connection management     │  │
│  └──────────────────┘         │  - Message routing           │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│  ┌──────────────────┐         ┌──────────▼───────────────────┐  │
│  │  REST API        │────────▶│  ConversationService         │  │
│  │  /api/chat/      │         │  - CRUD conversations        │  │
│  │                  │         │  - Message persistence       │  │
│  └──────────────────┘         │  - History management        │  │
│                                └──────────┬───────────────────┘  │
│                                           │                      │
│                        ┌──────────────────┼──────────────────┐  │
│                        │                  │                  │  │
│              ┌─────────▼────────┐  ┌──────▼──────┐  ┌───────▼──┐│
│              │ IntentService    │  │ ContextMgr  │  │ Sentiment││
│              │ - Classification │  │ - State     │  │ - Analysis││
│              │ - Entity extract │  │ - History   │  │ - Tone   ││
│              └─────────┬────────┘  └──────┬──────┘  └───────┬──┘│
│                        │                  │                  │  │
│                        └──────────────────┼──────────────────┘  │
│                                           │                      │
│                                ┌──────────▼───────────────────┐  │
│                                │  AIService (Existing)        │  │
│                                │  - Multi-provider AI         │  │
│                                │  - Streaming responses       │  │
│                                └──────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                                            │
                                            │ External Services
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Services                              │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │  ECS Fargate     │  │  Redis           │  │  RDS Postgres  ││
│  │  - NestJS app    │  │  - Session state │  │  - Messages    ││
│  │  - Auto-scaling  │  │  - Context cache │  │  - Convos      ││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │  ALB             │  │  CloudWatch      │  │  EventBridge   ││
│  │  - Load balance  │  │  - Metrics       │  │  - Events      ││
│  │  - Health checks │  │  - Logs          │  │  - Triggers    ││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## NestJS Backend Architecture

### Project Structure

```
chat-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── chat/
│   │   ├── chat.module.ts
│   │   ├── chat.gateway.ts          # WebSocket gateway
│   │   ├── chat.controller.ts       # REST API
│   │   ├── chat.service.ts
│   │   ├── conversation.service.ts
│   │   ├── message.service.ts
│   │   └── dto/
│   ├── intent/
│   │   ├── intent.module.ts
│   │   ├── intent.service.ts
│   │   ├── entity-extractor.service.ts
│   │   └── intent-classifier.ts
│   ├── context/
│   │   ├── context.module.ts
│   │   ├── context.service.ts
│   │   └── context-manager.ts
│   ├── sentiment/
│   │   ├── sentiment.module.ts
│   │   └── sentiment.service.ts
│   ├── ai/
│   │   ├── ai.module.ts
│   │   └── ai-integration.service.ts  # Wrapper for existing AIService
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   └── analytics.service.ts
│   └── common/
│       ├── guards/
│       ├── interceptors/
│       └── filters/
├── test/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Components and Interfaces

### 1. ChatGateway (WebSocket)

```typescript
// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private conversationService: ConversationService,
    private intentService: IntentService,
    private contextService: ContextService,
    private aiService: AIIntegrationService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    console.log(`Client connected: ${client.id}, User: ${userId}`);
    
    // Load user's active conversations
    const conversations = await this.conversationService.getActiveConversations(userId);
    client.emit('conversations:list', conversations);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Save any pending context
    await this.contextService.saveContext(client.id);
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = this.extractUserId(client);
    
    // Save user message
    const userMessage = await this.conversationService.addMessage({
      conversationId: data.conversationId,
      role: 'user',
      content: data.content,
      userId,
    });
    
    // Emit message saved
    client.emit('message:saved', userMessage);
    
    // Analyze intent
    const intent = await this.intentService.classify(data.content);
    
    // Get conversation context
    const context = await this.contextService.getContext(data.conversationId);
    
    // Generate AI response with streaming
    const stream = await this.aiService.generateStreamingResponse({
      message: data.content,
      intent,
      context,
      conversationId: data.conversationId,
    });
    
    // Stream response to client
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
      client.emit('message:stream', {
        conversationId: data.conversationId,
        chunk,
        fullResponse,
      });
    }
    
    // Save AI response
    const aiMessage = await this.conversationService.addMessage({
      conversationId: data.conversationId,
      role: 'assistant',
      content: fullResponse,
      intent: intent.name,
      confidence: intent.confidence,
    });
    
    // Emit completion
    client.emit('message:complete', aiMessage);
    
    // Update context
    await this.contextService.updateContext(data.conversationId, {
      userMessage: data.content,
      aiResponse: fullResponse,
      intent,
    });
  }

  @SubscribeMessage('conversation:create')
  async handleCreateConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { title?: string },
  ) {
    const userId = this.extractUserId(client);
    const conversation = await this.conversationService.create({
      userId,
      title: data.title || 'New Conversation',
    });
    
    client.emit('conversation:created', conversation);
    return conversation;
  }

  @SubscribeMessage('conversation:load')
  async handleLoadConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const messages = await this.conversationService.getMessages(data.conversationId);
    client.emit('conversation:loaded', { conversationId: data.conversationId, messages });
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    // Broadcast to other users in conversation (for multi-user support)
    client.to(data.conversationId).emit('typing:user', { userId: this.extractUserId(client) });
  }

  private extractUserId(client: Socket): string {
    // Extract from JWT token in handshake
    return client.handshake.auth.userId;
  }
}
```

### 2. ConversationService

```typescript
// src/chat/conversation.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async create(data: { userId: string; title: string }) {
    return this.prisma.conversation.create({
      data: {
        userId: data.userId,
        title: data.title,
        status: 'active',
      },
    });
  }

  async getActiveConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        userId,
        status: 'active',
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, limit = 50) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async addMessage(data: {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    userId?: string;
    intent?: string;
    confidence?: number;
  }) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        userId: data.userId,
        intent: data.intent,
        confidence: data.confidence,
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async deleteConversation(conversationId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'deleted', deletedAt: new Date() },
    });
  }

  async archiveOldConversations() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return this.prisma.conversation.updateMany({
      where: {
        updatedAt: { lt: ninetyDaysAgo },
        status: 'active',
      },
      data: { status: 'archived' },
    });
  }
}
```

### 3. IntentService

```typescript
// src/intent/intent.service.ts
import { Injectable } from '@nestjs/common';

export interface Intent {
  name: string;
  confidence: number;
  entities: Record<string, any>;
}

@Injectable()
export class IntentService {
  private intentPatterns = {
    campaign_help: /campaign|marketing|promote|advertise/i,
    analytics_query: /analytics|stats|metrics|performance|revenue/i,
    content_idea: /content|idea|post|create|generate/i,
    technical_support: /help|error|problem|issue|bug/i,
    greeting: /^(hi|hello|hey|good morning|good afternoon)/i,
    farewell: /^(bye|goodbye|see you|thanks|thank you)/i,
  };

  async classify(message: string): Promise<Intent> {
    // Check pattern matching first
    for (const [intentName, pattern] of Object.entries(this.intentPatterns)) {
      if (pattern.test(message)) {
        return {
          name: intentName,
          confidence: 0.85,
          entities: await this.extractEntities(message, intentName),
        };
      }
    }

    // Use AI for complex intent classification
    const aiIntent = await this.classifyWithAI(message);
    return aiIntent;
  }

  private async extractEntities(message: string, intent: string): Promise<Record<string, any>> {
    const entities: Record<string, any> = {};

    // Extract dates
    const dateMatch = message.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|today|yesterday|tomorrow)/i);
    if (dateMatch) {
      entities.date = dateMatch[0];
    }

    // Extract amounts
    const amountMatch = message.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (amountMatch) {
      entities.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract platforms
    const platformMatch = message.match(/(instagram|tiktok|reddit|onlyfans)/i);
    if (platformMatch) {
      entities.platform = platformMatch[1].toLowerCase();
    }

    return entities;
  }

  private async classifyWithAI(message: string): Promise<Intent> {
    // Fallback to general intent
    return {
      name: 'general_query',
      confidence: 0.5,
      entities: {},
    };
  }
}
```

### 4. ContextService

```typescript
// src/context/context.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

interface ConversationContext {
  messages: Array<{ role: string; content: string }>;
  entities: Record<string, any>;
  topic: string;
  lastIntent: string;
}

@Injectable()
export class ContextService {
  private readonly CONTEXT_TTL = 3600; // 1 hour
  private readonly MAX_MESSAGES = 10;

  constructor(private redis: RedisService) {}

  async getContext(conversationId: string): Promise<ConversationContext> {
    const cached = await this.redis.get(`context:${conversationId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    return {
      messages: [],
      entities: {},
      topic: '',
      lastIntent: '',
    };
  }

  async updateContext(
    conversationId: string,
    update: {
      userMessage: string;
      aiResponse: string;
      intent: Intent;
    },
  ) {
    const context = await this.getContext(conversationId);

    // Add messages
    context.messages.push(
      { role: 'user', content: update.userMessage },
      { role: 'assistant', content: update.aiResponse },
    );

    // Keep only last N messages
    if (context.messages.length > this.MAX_MESSAGES) {
      context.messages = context.messages.slice(-this.MAX_MESSAGES);
    }

    // Merge entities
    context.entities = { ...context.entities, ...update.intent.entities };

    // Update intent
    context.lastIntent = update.intent.name;

    // Save to Redis
    await this.redis.setex(
      `context:${conversationId}`,
      this.CONTEXT_TTL,
      JSON.stringify(context),
    );
  }

  async saveContext(clientId: string) {
    // Persist any pending context changes
  }

  async clearContext(conversationId: string) {
    await this.redis.del(`context:${conversationId}`);
  }
}
```



## Data Models

### Prisma Schema Extensions

```prisma
// Conversation
model Conversation {
  id              String   @id @default(cuid())
  userId          String
  title           String
  status          String   @default("active") // active, archived, deleted
  
  // Metadata
  lastMessageAt   DateTime?
  messageCount    Int      @default(0)
  deletedAt       DateTime?
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  messages        Message[]
  
  @@index([userId])
  @@index([status])
  @@index([updatedAt])
  @@map("conversations")
}

// Message
model Message {
  id              String   @id @default(cuid())
  conversationId  String
  role            String   // user, assistant, system
  content         String   @db.Text
  
  // User info (for user messages)
  userId          String?
  
  // AI info (for assistant messages)
  intent          String?
  confidence      Float?
  model           String?  // gpt-4, claude, etc.
  
  // Metadata
  tokens          Int?
  processingTime  Int?     // milliseconds
  sentiment       String?  // positive, neutral, negative
  
  // Status
  status          String   @default("sent") // sending, sent, error
  error           String?
  
  // Timestamps
  createdAt       DateTime @default(now())
  
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  
  @@index([conversationId])
  @@index([createdAt])
  @@map("messages")
}

// Intent Log
model IntentLog {
  id              String   @id @default(cuid())
  conversationId  String
  messageId       String
  
  // Intent info
  intent          String
  confidence      Float
  entities        Json
  
  // Classification
  method          String   // pattern, ai, fallback
  
  // Timestamp
  createdAt       DateTime @default(now())
  
  @@index([conversationId])
  @@index([intent])
  @@map("intent_logs")
}

// Conversation Analytics
model ConversationAnalytics {
  id              String   @id @default(cuid())
  conversationId  String   @unique
  userId          String
  
  // Metrics
  duration        Int      // seconds
  messageCount    Int
  avgResponseTime Int      // milliseconds
  
  // Sentiment
  sentimentScore  Float    // -1 to 1
  frustrationCount Int     @default(0)
  
  // Intents
  topIntents      Json     // { intent: count }
  
  // Satisfaction
  rating          Int?     // 1-5
  feedback        String?
  
  // Status
  abandoned       Boolean  @default(false)
  escalated       Boolean  @default(false)
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId])
  @@map("conversation_analytics")
}
```

## AWS ECS Infrastructure

### Dockerfile

```dockerfile
# chat-backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built app
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start app
CMD ["node", "dist/main.js"]
```

### ECS Task Definition

```json
{
  "family": "huntaze-chat-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "chat-backend",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/huntaze-chat-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3001" },
        { "name": "FRONTEND_URL", "value": "https://huntaze.com" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:..." },
        { "name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..." }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/huntaze-chat-backend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### ECS Service with Auto-Scaling

```typescript
// infra/terraform/ecs-chat-backend.tf
resource "aws_ecs_service" "chat_backend" {
  name            = "huntaze-chat-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.chat_backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.chat_backend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.chat_backend.arn
    container_name   = "chat-backend"
    container_port   = 3001
  }

  depends_on = [aws_lb_listener.chat_backend]
}

# Auto-scaling
resource "aws_appautoscaling_target" "chat_backend" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.chat_backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "chat_backend_cpu" {
  name               = "chat-backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.chat_backend.resource_id
  scalable_dimension = aws_appautoscaling_target.chat_backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.chat_backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

### Application Load Balancer

```typescript
resource "aws_lb" "chat_backend" {
  name               = "huntaze-chat-backend-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true
  enable_http2              = true
}

resource "aws_lb_target_group" "chat_backend" {
  name        = "huntaze-chat-backend-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  # Sticky sessions for WebSocket
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
}

resource "aws_lb_listener" "chat_backend" {
  load_balancer_arn = aws_lb.chat_backend.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.chat.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.chat_backend.arn
  }
}
```

## Frontend Components

### Chat Interface

```typescript
// app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Paperclip, Smile } from 'lucide-react';

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io(process.env.NEXT_PUBLIC_CHAT_WS_URL!, {
      auth: {
        userId: getUserId(),
        token: getAuthToken(),
      },
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('message:saved', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('message:stream', ({ chunk, fullResponse }) => {
      setIsStreaming(true);
      setStreamingMessage(fullResponse);
    });

    newSocket.on('message:complete', (message) => {
      setIsStreaming(false);
      setStreamingMessage('');
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('typing:user', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;

    socket.emit('message:send', {
      conversationId: getCurrentConversationId(),
      content: input,
    });

    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold">AI Assistant</h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isStreaming && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingMessage,
              createdAt: new Date(),
            }}
            isStreaming
          />
        )}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
            <span className="text-sm">AI is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Smile className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Message Bubble Component

```typescript
// components/MessageBubble.tsx
interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
  };
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-purple-600 text-white'
            : 'bg-white border border-gray-200'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
        )}
        <p className="text-xs mt-1 opacity-70">
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
```

## Monitoring and Observability

### CloudWatch Metrics

```typescript
// src/common/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

@Injectable()
export class MetricsService {
  private cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

  async trackConversation(metrics: {
    duration: number;
    messageCount: number;
    avgResponseTime: number;
  }) {
    await this.cloudwatch.send(
      new PutMetricDataCommand({
        Namespace: 'Huntaze/Chat',
        MetricData: [
          {
            MetricName: 'ConversationDuration',
            Value: metrics.duration,
            Unit: 'Seconds',
          },
          {
            MetricName: 'MessageCount',
            Value: metrics.messageCount,
            Unit: 'Count',
          },
          {
            MetricName: 'AvgResponseTime',
            Value: metrics.avgResponseTime,
            Unit: 'Milliseconds',
          },
        ],
      }),
    );
  }
}
```

### CloudWatch Alarms

- High response time (>2s)
- High error rate (>5%)
- WebSocket connection failures (>10/min)
- ECS task failures (>2/hour)

## Testing Strategy

### Unit Tests
- ConversationService CRUD
- IntentService classification
- ContextService state management
- SentimentService analysis

### Integration Tests
- WebSocket connection and messaging
- Message persistence
- Context management
- Intent routing

### E2E Tests
- Complete conversation flow
- Streaming responses
- Multi-turn conversations
- Error handling

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-29  
**Status:** Ready for Tasks
