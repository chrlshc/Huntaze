"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function CompletedStep() {
  const router = useRouter();
  const { userData, platformConnections, selectedPersonality } = useOnboarding();

  const handleStart = () => {
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-purple-200 animate-ping" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Congrats {userData.pseudonym}! 🎉
        </h2>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your Huntaze account is now configured. You’re ready to automate 
          your presence and maximize your revenue!
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {platformConnections.length}
            </div>
            <p className="text-sm text-gray-600 mt-1">Connected platforms</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-pink-600">
              {selectedPersonality?.name}
            </div>
            <p className="text-sm text-gray-600 mt-1">Active AI personality</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">
              100%
            </div>
            <p className="text-sm text-gray-600 mt-1">Compliance guaranteed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg text-center">Next steps</h3>
          
          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Explore your dashboard</p>
                <p className="text-sm text-gray-600">
                  Discover all the features at your disposal
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Import your existing content</p>
                <p className="text-sm text-gray-600">
                  The AI will learn from your style and past interactions
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Launch your first campaign</p>
                <p className="text-sm text-gray-600">
                  Let the AI start engaging your audience
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={handleStart}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Go to dashboard
        </Button>
        
        <p className="text-sm text-gray-500">
          Need help? Our support team is available 24/7
        </p>
      </div>
    </div>
  );
}
