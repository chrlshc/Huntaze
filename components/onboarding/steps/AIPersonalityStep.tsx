"use client";

import { useState } from "react";
import { useOnboarding, AIPersonality, availablePersonalities } from "@/src/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TestTube, CheckCircle2, RefreshCw, Upload, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AIPersonalityStep() {
  const { selectedPersonality, setAIPersonality } = useOnboarding();
  const [testMode, setTestMode] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleSelectPersonality = (personality: AIPersonality) => {
    setAIPersonality(personality);
  };

  const generateTestResponse = async () => {
    if (!selectedPersonality || !testInput.trim()) return;
    
    setGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const emojiSample = selectedPersonality.emojiPalette.slice(0, 2).join(' ');
      const boldness = selectedPersonality.boldnessLevel;
      
      let response = "";
      if (selectedPersonality.tone === 'flirty-premium') {
        response = `Hey babe ${emojiSample} ${testInput}? I love when you ask me that... Want to chat in private? I could show you something special just for you ${selectedPersonality.emojiPalette[2]}`;
      } else if (selectedPersonality.tone === 'friendly-girl-next-door') {
        response = `Hey you! ${emojiSample} ${testInput}? That’s a great question! I’d love to chat about it. You know what? I have something you might like ${selectedPersonality.emojiPalette[3]}`;
      } else if (selectedPersonality.tone === 'playful-tease') {
        response = `Ohhh ${testInput}? ${emojiSample} You’re making me blush! But I kinda like it hehe... If you want to see what I’ve prepared just for you, you know where to find me ${selectedPersonality.emojiPalette[4]}`;
      }
      
      setTestOutput(response);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold">Configure your AI personality</h3>
        <p className="text-gray-600">
          Choose how your assistant will interact with your audience
        </p>
      </div>

      <Tabs defaultValue="presets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">Preset personalities</TabsTrigger>
          <TabsTrigger value="test">Test & fine‑tune</TabsTrigger>
        </TabsList>
        
        <TabsContent value="presets" className="space-y-4">
          <div className="grid gap-4">
            {availablePersonalities.map((personality) => {
              const isSelected = selectedPersonality?.id === personality.id;
              
              return (
                <Card 
                  key={personality.id} 
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'border-purple-500 shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectPersonality(personality)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {personality.name}
                          {isSelected && (
                            <Badge className="bg-purple-600">Selected</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{personality.description}</CardDescription>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Emoji palette:</p>
                      <div className="flex gap-2 text-2xl">
                        {personality.emojiPalette.map((emoji, idx) => (
                          <span key={idx}>{emoji}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Boldness level: {Math.round(personality.boldnessLevel * 100)}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                          style={{ width: `${personality.boldnessLevel * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Custom personality
              </CardTitle>
              <CardDescription>
                Train a unique AI based on your existing conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload a corpus of past conversations so the AI can learn your unique style. The more examples you provide, the more accurate the AI becomes.
              </p>
              
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="corpus-upload"
                  className="hidden"
                  accept=".txt,.csv,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Traiter le fichier
                      console.log('Uploaded file:', file.name);
                    }
                  }}
                />
                <label htmlFor="corpus-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium">Click to upload your conversations</p>
                    <p className="text-xs text-gray-500">Accepted: TXT, CSV, JSON (max 10MB)</p>
                  </div>
                </label>
              </div>

              <Alert className="border-purple-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> The AI must never violate platform rules. 
                  Messages with explicit solicitations or banned words will be automatically filtered.
                </AlertDescription>
              </Alert>

              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                <h5 className="font-medium text-sm">Recommended format:</h5>
                <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`Fan: Comment tu vas aujourd'hui?
Vous: Super bien merci! 😊 Et toi?

Fan: Tu fais quoi ce soir?
Vous: J'ai prévu une séance photo exclusive...`}</pre>
              </div>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={!selectedPersonality}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Analyze corpus and create personality
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4">
          {selectedPersonality ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Test: {selectedPersonality.name}
                  </CardTitle>
                  <CardDescription>
                    Send a test message to see how the AI would reply
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="test-input">Fan message (example)</Label>
                    <Textarea
                      id="test-input"
                      placeholder="e.g., You look amazing! What are you up to tonight?"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <Button 
                    onClick={generateTestResponse}
                    disabled={!testInput.trim() || generating}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate a reply"
                    )}
                  </Button>
                  
                  {testOutput && (
                    <div>
                      <Label>AI response:</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-800">{testOutput}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fine adjustments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Boldness level</Label>
                      <span className="text-sm text-gray-600">
                        {Math.round(selectedPersonality.boldnessLevel * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[selectedPersonality.boldnessLevel * 100]}
                      onValueChange={(value) => {
                        const updatedPersonality = {
                          ...selectedPersonality,
                          boldnessLevel: value[0] / 100
                        };
                        setAIPersonality(updatedPersonality);
                      }}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Tame</span>
                      <span>Bold</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    These adjustments apply to all interactions. 
                    You can change them anytime in your settings.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Select a personality first to test it
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
