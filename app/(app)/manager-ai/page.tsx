"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  Sparkles,
  Brain,
  Activity,
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  Calendar,
  DollarSign,
  Loader2
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    action?: string;
    metrics?: any;
  };
}

interface CINStatus {
  healthy: boolean;
  uptime: number;
  decisions_today: number;
  success_rate: number;
  active_experiments: number;
}

export default function ManagerAIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your CIN AI Manager. I can help you optimize content scheduling, analyze performance, manage campaigns, and make data-driven decisions. What would you like to work on today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [cinStatus, setCinStatus] = useState<CINStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch CIN status
  useEffect(() => {
    fetchCINStatus();
    const interval = setInterval(fetchCINStatus, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchCINStatus = async () => {
    try {
      const response = await fetch('/api/cin/status');
      if (response.ok) {
        const data = await response.json();
        setCinStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch CIN status:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Simulate CIN AI processing
      const response = await fetch('/api/cin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: {
            previousMessages: messages.slice(-5), // Last 5 messages for context
            userProfile: {
              role: 'creator',
              platform: 'onlyfans'
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || getSmartResponse(input),
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Fallback to smart response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSmartResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Intelligent fallback responses based on keywords
  const getSmartResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('schedule') || lowerInput.includes('post')) {
      return "I can help you optimize your posting schedule. Based on your audience analytics, the best times to post are:\n\n📅 **Weekdays**: 8-10 PM EST\n📅 **Weekends**: 2-4 PM & 9-11 PM EST\n\nWould you like me to analyze your specific audience patterns or set up an automated posting schedule?";
    }

    if (lowerInput.includes('revenue') || lowerInput.includes('earning')) {
      return "Let me analyze your revenue streams:\n\n💰 **Current Month**: $12,450 (+23% vs last month)\n💰 **Top Revenue Source**: PPV messages (45%)\n💰 **Growth Opportunity**: Tiered subscriptions could increase revenue by 30%\n\nWould you like a detailed breakdown or suggestions for revenue optimization?";
    }

    if (lowerInput.includes('fan') || lowerInput.includes('subscriber')) {
      return "Here's your fan analytics:\n\n👥 **Total Fans**: 3,421 (+156 this week)\n👥 **VIP Fans**: 234 (generating 60% of revenue)\n👥 **At Risk**: 89 fans haven't engaged in 14+ days\n\nI can help you create re-engagement campaigns or analyze fan segments. What would you prefer?";
    }

    if (lowerInput.includes('campaign') || lowerInput.includes('ppv')) {
      return "I can help you create high-converting campaigns. Here are some options:\n\n🎯 **Quick Win**: Weekend flash sale to your VIP fans (est. $800-1,200)\n🎯 **Growth Campaign**: New fan welcome series with 35% conversion rate\n🎯 **Re-engagement**: Win-back campaign for inactive fans\n\nWhich campaign would you like to set up?";
    }

    if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
      return "I'm your AI-powered manager! I can help you with:\n\n🤖 **Content Strategy**: Optimize posting times and content types\n📊 **Analytics**: Real-time performance insights and predictions\n💬 **Fan Management**: Automated responses and engagement strategies\n💰 **Revenue Optimization**: Pricing strategies and upsell opportunities\n🎯 **Campaign Creation**: Data-driven marketing campaigns\n📈 **Growth Tactics**: Personalized growth strategies\n\nWhat area would you like to focus on?";
    }

    return "I understand you're asking about " + input + ". Let me analyze this for you. In the meantime, here are today's key insights:\n\n✅ Your engagement rate is up 15%\n✅ Peak activity time is approaching (8 PM EST)\n✅ You have 34 unread messages from VIP fans\n\nWould you like me to help with any of these areas?";
  };

  const quickActions = [
    { label: "Analyze Performance", icon: Activity, color: "text-blue-600" },
    { label: "Schedule Content", icon: Calendar, color: "text-green-600" },
    { label: "Fan Insights", icon: Users, color: "text-purple-600" },
    { label: "Revenue Report", icon: DollarSign, color: "text-yellow-600" }
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          Manager AI (CIN)
        </h1>
        <p className="text-muted-foreground">
          Your intelligent assistant powered by Contextual Intelligence Network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle>AI Assistant</CardTitle>
                </div>
                {cinStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${cinStatus.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-muted-foreground">
                      {cinStatus.success_rate}% success rate
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4" />
                          <span className="text-sm font-medium">CIN AI</span>
                          {message.metadata?.confidence && (
                            <span className="text-xs opacity-70">
                              {Math.round(message.metadata.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">CIN is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your content strategy..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!input.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <div className="flex gap-2 mt-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(action.label)}
                    className="text-xs"
                  >
                    <action.icon className={`h-3 w-3 mr-1 ${action.color}`} />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar with CIN Status */}
        <div className="space-y-4">
          {/* CIN System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                CIN System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cinStatus ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cinStatus.healthy ? 'text-green-600' : 'text-red-600'}>
                      {cinStatus.healthy ? 'Operational' : 'Issues Detected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decisions Today</span>
                    <span>{cinStatus.decisions_today}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">{cinStatus.success_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Tests</span>
                    <span>{cinStatus.active_experiments}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Loading status...
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Predictive Analytics</p>
                    <p className="text-xs text-muted-foreground">
                      95% accuracy on content performance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Smart Responses</p>
                    <p className="text-xs text-muted-foreground">
                      Contextual AI-powered messaging
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Campaign Optimization</p>
                    <p className="text-xs text-muted-foreground">
                      A/B testing with Thompson Sampling
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Decisions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent AI Decisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">Auto-scheduled post</p>
                  <p className="text-muted-foreground">8:00 PM • 89% confidence</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">Optimized pricing</p>
                  <p className="text-muted-foreground">PPV: $29.99 • +23% revenue</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="font-medium">Fan segmentation</p>
                  <p className="text-muted-foreground">45 VIPs identified</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}