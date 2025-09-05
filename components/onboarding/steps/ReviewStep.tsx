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
      title: 'Formation conformité',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="flex items-center justify-between">
          <span>Quiz complété avec {complianceQuizScore}%</span>
          <Badge className="bg-green-100 text-green-700">Réussi</Badge>
        </div>
      ),
    },
    {
      id: 'data-collection',
      title: 'Informations personnelles',
      icon: <User className="w-4 h-4" />,
      content: (
        <div className="space-y-1 text-sm">
          <p>Pseudonyme: <span className="font-medium">{userData.pseudonym}</span></p>
          <p>Email: <span className="font-medium">{userData.email}</span></p>
          <p>Pays: <span className="font-medium">{userData.country}</span></p>
        </div>
      ),
    },
    {
      id: 'gdpr-consent',
      title: 'Consentements RGPD',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            Conditions d'utilisation acceptées
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            Traitement des données accepté
          </div>
          {userData.marketingConsent && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              Communications marketing acceptées
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'platform-connections',
      title: 'Plateformes connectées',
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
      title: 'Personnalité IA',
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
      title: 'Paramètres de gouvernance',
      icon: <Settings className="w-4 h-4" />,
      content: (
        <div className="space-y-1 text-sm">
          <p>Approbation prix: <span className="font-medium">&gt; ${complianceSettings.requireApprovalAbovePrice}</span></p>
          <p>Approbation destinataires: <span className="font-medium">&gt; {complianceSettings.requireApprovalAboveRecipients}</span></p>
          <p>Confiance IA minimum: <span className="font-medium">{Math.round(complianceSettings.aiConfidenceThreshold * 100)}%</span></p>
          <p>Rétention données: <span className="font-medium">{complianceSettings.dataRetentionDays} jours</span></p>
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
        <h3 className="text-xl font-semibold">Vérifiez vos paramètres</h3>
        <p className="text-gray-600">
          Un dernier coup d'œil avant de finaliser votre configuration
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Après validation, vous pourrez toujours modifier ces paramètres depuis votre tableau de bord.
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
            <h4 className="font-semibold text-lg">🎉 Tout est prêt!</h4>
            <p className="text-gray-700">
              Votre compte Huntaze est configuré et prêt à révolutionner votre présence en ligne.
            </p>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>✓ Votre IA est configurée et prête à interagir</p>
            <p>✓ Les plateformes sont connectées en toute sécurité</p>
            <p>✓ La conformité est garantie automatiquement</p>
            <p>✓ La supervision humaine est en place</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}