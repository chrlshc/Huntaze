"use client";

import { useOnboarding } from "@/src/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Edit2, User, Shield, Link2, Sparkles, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ReviewStep() {
  const {
    userData,
    platformConnections,
    selectedPersonality,
    complianceSettings,
    complianceQuizScore,
    setCurrentStep,
  } = useOnboarding();

  const sections = [
    {
      id: 'compliance-training',
      title: 'Compliance training',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="flex items-center justify-between">
          <span>Quiz completed with {complianceQuizScore}%</span>
          <Badge className="bg-green-100 text-green-700">Passed</Badge>
        </div>
      ),
    },
    {
      id: 'data-collection',
      title: 'Personal information',
      icon: <User className="w-4 h-4" />,
      content: (
        <div className="space-y-1 text-sm">
          <p>Handle: <span className="font-medium">{userData.pseudonym}</span></p>
          <p>Email: <span className="font-medium">{userData.email}</span></p>
          <p>Country: <span className="font-medium">{userData.country}</span></p>
        </div>
      ),
    },
    {
      id: 'gdpr-consent',
      title: 'GDPR consents',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            Terms of Service accepted
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            Data processing accepted
          </div>
          {userData.marketingConsent && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              Marketing communications accepted
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'platform-connections',
      title: 'Connected platforms',
      icon: <Link2 className="w-4 h-4" />,
      content: (
        <div className="flex flex-wrap gap-2">
          {platformConnections.map((connection) => (
            <Badge key={connection.platform} variant="secondary">
              {connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'ai-personality',
      title: 'AI personality',
      icon: <Sparkles className="w-4 h-4" />,
      content: selectedPersonality ? (
        <div className="space-y-2">
          <p className="font-medium">{selectedPersonality.name}</p>
          <p className="text-sm text-gray-600">{selectedPersonality.description}</p>
          <div className="flex gap-1 text-lg">
            {selectedPersonality.emojiPalette.slice(0, 4).map((emoji, idx) => (
              <span key={idx}>{emoji}</span>
            ))}
          </div>
        </div>
      ) : null,
    },
    {
      id: 'governance-settings',
      title: 'Governance settings',
      icon: <Settings className="w-4 h-4" />,
      content: (
        <div className="space-y-1 text-sm">
          <p>Price approval: <span className="font-medium">&gt; ${complianceSettings.requireApprovalAbovePrice}</span></p>
          <p>Recipients approval: <span className="font-medium">&gt; {complianceSettings.requireApprovalAboveRecipients}</span></p>
          <p>Minimum AI confidence: <span className="font-medium">{Math.round(complianceSettings.aiConfidenceThreshold * 100)}%</span></p>
          <p>Data retention: <span className="font-medium">{complianceSettings.dataRetentionDays} days</span></p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold">Review your settings</h3>
        <p className="text-gray-600">
          One last look before finalizing your setup
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          After validation, you can always change these settings from your dashboard.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(section.id as any)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>{section.content}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">🎉 You’re all set!</h4>
            <p className="text-gray-700">
              Your Huntaze account is configured and ready to elevate your online presence.
            </p>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>✓ Your AI is set up and ready to engage</p>
            <p>✓ Platforms are securely connected</p>
            <p>✓ Compliance is automatically handled</p>
            <p>✓ Human oversight is in place</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
