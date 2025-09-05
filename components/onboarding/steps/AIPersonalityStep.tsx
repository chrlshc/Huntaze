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
        response = `Hey babe ${emojiSample} ${testInput}? J'adore quand tu me poses ce genre de questions... Tu veux qu'on en discute en privé? Je pourrais te montrer quelque chose de spécial rien que pour toi ${selectedPersonality.emojiPalette[2]}`;
      } else if (selectedPersonality.tone === 'friendly-girl-next-door') {
        response = `Salut toi! ${emojiSample} ${testInput}? C'est une super question! J'adorerais en parler avec toi. Tu sais quoi? J'ai justement quelque chose qui pourrait t'intéresser ${selectedPersonality.emojiPalette[3]}`;
      } else if (selectedPersonality.tone === 'playful-tease') {
        response = `Ohhh ${testInput}? ${emojiSample} Tu me fais rougir là! Mais j'aime ça hehe... Si tu veux voir ce que j'ai préparé juste pour toi, tu sais où me trouver ${selectedPersonality.emojiPalette[4]}`;
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
        <h3 className="text-xl font-semibold">Configurez votre personnalité AI</h3>
        <p className="text-gray-600">
          Choisissez comment votre assistant interagira avec votre audience
        </p>
      </div>

      <Tabs defaultValue="presets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">Personnalités prédéfinies</TabsTrigger>
          <TabsTrigger value="test">Tester & ajuster</TabsTrigger>
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
                            <Badge className="bg-purple-600">Sélectionnée</Badge>
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
                      <p className="text-sm font-medium mb-2">Palette d'emojis:</p>
                      <div className="flex gap-2 text-2xl">
                        {personality.emojiPalette.map((emoji, idx) => (
                          <span key={idx}>{emoji}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Niveau d'audace: {Math.round(personality.boldnessLevel * 100)}%
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
                Personnalité sur mesure
              </CardTitle>
              <CardDescription>
                Entraînez une IA unique basée sur vos conversations existantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Téléversez un corpus de vos conversations passées pour que l'IA apprenne votre style 
                unique. Plus vous fournissez d'exemples, plus l'IA sera précise.
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
                      console.log('Fichier uploadé:', file.name);
                    }
                  }}
                />
                <label htmlFor="corpus-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium">Cliquez pour téléverser vos conversations</p>
                    <p className="text-xs text-gray-500">Formats acceptés: TXT, CSV, JSON (max 10MB)</p>
                  </div>
                </label>
              </div>

              <Alert className="border-purple-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Rappel important:</strong> L'IA ne doit jamais enfreindre les règles des plateformes. 
                  Les messages avec sollicitations explicites ou mots interdits seront automatiquement filtrés.
                </AlertDescription>
              </Alert>

              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                <h5 className="font-medium text-sm">Format recommandé:</h5>
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
                Analyser le corpus et créer la personnalité
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
                    Tester: {selectedPersonality.name}
                  </CardTitle>
                  <CardDescription>
                    Envoyez un message test pour voir comment l'IA répondrait
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="test-input">Message d'un fan (exemple)</Label>
                    <Textarea
                      id="test-input"
                      placeholder="Ex: Tu es magnifique! Tu fais quoi ce soir?"
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
                        Génération...
                      </>
                    ) : (
                      "Générer une réponse"
                    )}
                  </Button>
                  
                  {testOutput && (
                    <div>
                      <Label>Réponse de l'IA:</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-800">{testOutput}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ajustements fins</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Niveau d'audace</Label>
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
                      <span>Sage</span>
                      <span>Audacieux</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Ces ajustements seront appliqués à toutes vos interactions. 
                    Vous pourrez les modifier à tout moment depuis vos paramètres.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Sélectionnez d'abord une personnalité pour la tester
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}