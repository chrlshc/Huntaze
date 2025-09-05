"use client";

import { useEffect, useState } from "react";
import { useOnboarding, OnboardingStep } from "@/src/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ComplianceTrainingStep } from "./steps/ComplianceTrainingStep";
import { DataCollectionStep } from "./steps/DataCollectionStep";
import { GDPRConsentStep } from "./steps/GDPRConsentStep";
import { PlatformConnectionsStep } from "./steps/PlatformConnectionsStep";
import { AIPersonalityStep } from "./steps/AIPersonalityStep";
import { GovernanceSettingsStep } from "./steps/GovernanceSettingsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { CompletedStep } from "./steps/CompletedStep";
import { ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { useLanguage } from "@/src/hooks/useLanguage";
import { Language } from "@/src/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpSidebar } from "./HelpSidebar";

const STEPS: { id: OnboardingStep; title: string; description: string }[] = [
  { id: "welcome", title: "Bienvenue", description: "Introduction à Huntaze" },
  { id: "compliance-training", title: "Formation", description: "Règles et conformité" },
  { id: "data-collection", title: "Informations", description: "Données de base" },
  { id: "gdpr-consent", title: "Consentement", description: "Protection des données" },
  { id: "platform-connections", title: "Connexions", description: "Lier vos plateformes" },
  { id: "ai-personality", title: "Personnalité IA", description: "Configurer votre assistant" },
  { id: "governance-settings", title: "Gouvernance", description: "Paramètres de supervision" },
  { id: "review", title: "Vérification", description: "Confirmer vos choix" },
  { id: "completed", title: "Terminé", description: "Onboarding complété" },
];

export function OnboardingFlow() {
  const {
    currentStep,
    setCurrentStep,
    markStepCompleted,
    isStepCompleted,
    canProceedToStep,
    completeOnboarding,
  } = useOnboarding();
  const { currentLanguage, setLanguage, t } = useLanguage();

  const [isValidating, setIsValidating] = useState(false);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentStepIndex + 1].id;
      
      setIsValidating(true);
      try {
        markStepCompleted(currentStep);
        
        if (nextStep === 'completed') {
          await completeOnboarding();
        } else {
          setCurrentStep(nextStep);
        }
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const canGoNext = () => {
    if (currentStep === 'welcome') return true;
    if (currentStep === 'compliance-training') {
      const { complianceQuizScore } = useOnboarding.getState();
      return complianceQuizScore !== undefined && complianceQuizScore >= 80;
    }
    if (currentStep === 'data-collection') {
      const { userData } = useOnboarding.getState();
      return !!(userData.pseudonym && userData.email && userData.country);
    }
    if (currentStep === 'gdpr-consent') {
      const { userData } = useOnboarding.getState();
      return userData.acceptedTerms && userData.dataProcessingConsent;
    }
    if (currentStep === 'platform-connections') {
      const { platformConnections } = useOnboarding.getState();
      return platformConnections.length > 0;
    }
    if (currentStep === 'ai-personality') {
      const { selectedPersonality } = useOnboarding.getState();
      return !!selectedPersonality;
    }
    return true;
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />;
      case 'compliance-training':
        return <ComplianceTrainingStep />;
      case 'data-collection':
        return <DataCollectionStep />;
      case 'gdpr-consent':
        return <GDPRConsentStep />;
      case 'platform-connections':
        return <PlatformConnectionsStep />;
      case 'ai-personality':
        return <AIPersonalityStep />;
      case 'governance-settings':
        return <GovernanceSettingsStep />;
      case 'review':
        return <ReviewStep />;
      case 'completed':
        return <CompletedStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <HelpSidebar />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t('onboarding.welcome.title')}
          </h1>
          <div className="flex items-center gap-4">
            <Select value={currentLanguage} onValueChange={(value: Language) => setLanguage(value)}>
              <SelectTrigger className="w-36 h-9">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600">
              Étape {currentStepIndex + 1} sur {STEPS.length}
            </div>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = isStepCompleted(step.id);
            const isAccessible = canProceedToStep(step.id);

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && setCurrentStep(step.id)}
                disabled={!isAccessible}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive ? 'bg-purple-600 text-white' : ''}
                  ${isCompleted && !isActive ? 'bg-green-100 text-green-700' : ''}
                  ${!isActive && !isCompleted && isAccessible ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : ''}
                  ${!isAccessible ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
                `}
              >
                {step.title}
              </button>
            );
          })}
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{STEPS[currentStepIndex].title}</CardTitle>
            <CardDescription>{STEPS[currentStepIndex].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || isValidating || currentStep === 'completed'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isValidating ? (
              "Validation..."
            ) : currentStep === 'review' ? (
              "Terminer"
            ) : currentStep === 'completed' ? (
              "Commencer"
            ) : (
              <>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}