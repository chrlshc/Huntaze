"use client";

import { useOnboarding } from "@/src/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, DollarSign, Users, Brain, Calendar, MessageSquare } from "lucide-react";

export function GovernanceSettingsStep() {
  const { complianceSettings, updateComplianceSettings } = useOnboarding();

  const handleSliderChange = (field: keyof typeof complianceSettings, value: number[]) => {
    updateComplianceSettings({ [field]: value[0] });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
          <Eye className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold">Paramètres de gouvernance</h3>
        <p className="text-gray-600">
          Configurez les seuils de supervision pour garder le contrôle
        </p>
      </div>

      <Alert className="bg-indigo-50 border-indigo-200">
        <AlertDescription>
          Ces paramètres garantissent une supervision humaine sur les actions sensibles. 
          Vous pourrez les ajuster à tout moment selon vos besoins.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Supervision des prix
            </CardTitle>
            <CardDescription>
              Les messages avec des prix élevés nécessitent une validation manuelle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Seuil de prix pour approbation</Label>
                <Badge variant="outline">${complianceSettings.requireApprovalAbovePrice}</Badge>
              </div>
              <Slider
                value={[complianceSettings.requireApprovalAbovePrice]}
                onValueChange={(value) => handleSliderChange('requireApprovalAbovePrice', value)}
                min={50}
                max={500}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$50</span>
                <span>$500</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Tout contenu PPV ou offre supérieure à ce montant sera placé en file d'attente 
              pour validation manuelle.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Envois de masse
            </CardTitle>
            <CardDescription>
              Les messages à plusieurs destinataires sont supervisés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Seuil de destinataires</Label>
                <Badge variant="outline">{complianceSettings.requireApprovalAboveRecipients} fans</Badge>
              </div>
              <Slider
                value={[complianceSettings.requireApprovalAboveRecipients]}
                onValueChange={(value) => handleSliderChange('requireApprovalAboveRecipients', value)}
                min={10}
                max={200}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10 fans</span>
                <span>200 fans</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Les messages envoyés à plus de destinataires que ce seuil nécessiteront 
              une approbation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Confiance IA
            </CardTitle>
            <CardDescription>
              Niveau de confiance minimum pour les actions automatiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <Label>Seuil de confiance IA</Label>
                <Badge variant="outline">{Math.round(complianceSettings.aiConfidenceThreshold * 100)}%</Badge>
              </div>
              <Slider
                value={[complianceSettings.aiConfidenceThreshold * 100]}
                onValueChange={(value) => handleSliderChange('aiConfidenceThreshold', [value[0] / 100])}
                min={50}
                max={95}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50% (Plus de supervision)</span>
                <span>95% (Plus d'autonomie)</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Si l'IA est moins confiante que ce seuil, l'action sera placée en file 
              d'attente pour révision.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                Rétention des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <Label>Durée de conservation</Label>
                <Badge variant="outline">{complianceSettings.dataRetentionDays} jours</Badge>
              </div>
              <Slider
                value={[complianceSettings.dataRetentionDays]}
                onValueChange={(value) => handleSliderChange('dataRetentionDays', value)}
                min={30}
                max={365}
                step={30}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-2">
                Les messages plus anciens seront automatiquement supprimés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-4 h-4" />
                Volume quotidien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <Label>Messages max/jour</Label>
                <Badge variant="outline">{complianceSettings.maxMessagesPerDay}</Badge>
              </div>
              <Slider
                value={[complianceSettings.maxMessagesPerDay]}
                onValueChange={(value) => handleSliderChange('maxMessagesPerDay', value)}
                min={100}
                max={1000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-2">
                Limite de sécurité pour éviter le spam
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">💡 Recommandations</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Commencez avec des seuils stricts, puis assouplissez progressivement</li>
            <li>• Revoyez vos paramètres chaque semaine les premiers temps</li>
            <li>• Les limites par plateforme sont appliquées automatiquement</li>
            <li>• Un rapport hebdomadaire vous montrera l'activité de supervision</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}