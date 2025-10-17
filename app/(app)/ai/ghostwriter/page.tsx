"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Download,
  RefreshCw,
  MessageSquare,
  Heart,
  DollarSign,
  Zap
} from "lucide-react";

export default function GhostwriterPage() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("flirty");
  const [messageType, setMessageType] = useState("welcome");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  const messageTypes = [
    { value: "welcome", label: "Welcome Message", icon: MessageSquare },
    { value: "ppv", label: "PPV Promotion", icon: DollarSign },
    { value: "tip", label: "Tip Request", icon: Heart },
    { value: "custom", label: "Custom Content", icon: Sparkles },
    { value: "mass", label: "Mass Message", icon: Zap }
  ];

  const tones = [
    { value: "flirty", label: "Flirty & Playful" },
    { value: "romantic", label: "Romantic & Sweet" },
    { value: "casual", label: "Casual & Friendly" },
    { value: "dominant", label: "Dominant & Bold" },
    { value: "submissive", label: "Submissive & Shy" }
  ];

  const templates = {
    welcome: "Hey babe! 😘 Welcome to my exclusive world! I'm so excited to have you here...",
    ppv: "I just created something special just for you! 🔥 You're going to love this exclusive content...",
    tip: "Hey love! If you're enjoying our chats, I'd really appreciate a little tip 💕...",
    custom: "",
    mass: "Happy Friday my loves! 🎉 I have something amazing to share with all of you..."
  };

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate API call
    setTimeout(() => {
      const template = templates[messageType as keyof typeof templates];
      setGeneratedContent(template || "Generated content based on your prompt will appear here...");
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ghostwriter Pro</h1>
        <p className="text-muted-foreground">
          AI-powered message generation for authentic fan engagement
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Message Configuration</CardTitle>
            <CardDescription>Customize your message parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Message Type</label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {messageTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tone & Style</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional Context (Optional)
              </label>
              <Textarea
                placeholder="Add any specific details, fan names, or context..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Message
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Message</CardTitle>
            <CardDescription>AI-crafted content ready to send</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[200px] p-4 bg-muted rounded-lg">
                {generatedContent ? (
                  <p className="whitespace-pre-wrap">{generatedContent}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Your generated message will appear here...
                  </p>
                )}
              </div>

              {generatedContent && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Templates */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>Popular message templates to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <MessageSquare className="h-6 w-6 mb-2 text-primary" />
              <h4 className="font-semibold mb-1">Welcome Series</h4>
              <p className="text-sm text-muted-foreground">
                Engaging welcome messages for new subscribers
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <DollarSign className="h-6 w-6 mb-2 text-green-600" />
              <h4 className="font-semibold mb-1">PPV Templates</h4>
              <p className="text-sm text-muted-foreground">
                High-converting pay-per-view promotions
              </p>
            </div>
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <Heart className="h-6 w-6 mb-2 text-red-500" />
              <h4 className="font-semibold mb-1">Relationship Building</h4>
              <p className="text-sm text-muted-foreground">
                Deepen connections with personalized messages
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}