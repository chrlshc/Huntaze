"use client";

import { useState } from "react";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, FileText, Download, Trash2, Clock, Lock } from "lucide-react";

export function GDPRConsentStep() {
  const { userData, updateUserData } = useOnboarding();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const handleConsentChange = (field: keyof typeof userData, checked: boolean) => {
    updateUserData({ 
      [field]: checked,
      ...(checked && field === 'dataProcessingConsent' ? { consentDate: new Date() } : {})
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold">Protection de vos données</h3>
        <p className="text-gray-600">
          Conformément au RGPD, nous vous expliquons comment vos données sont utilisées
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos droits RGPD</CardTitle>
          <CardDescription>
            Vous disposez de droits étendus sur vos données personnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Droit d'accès</h4>
                <p className="text-sm text-gray-600">
                  Demandez une copie de toutes vos données à tout moment
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Droit à l'effacement</h4>
                <p className="text-sm text-gray-600">
                  Supprimez définitivement votre compte et vos données
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Durée de conservation</h4>
                <p className="text-sm text-gray-600">
                  90 jours par défaut, personnalisable dans vos paramètres
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Sécurité renforcée</h4>
                <p className="text-sm text-gray-600">
                  Chiffrement AES-256 et accès strictement contrôlé
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utilisation de vos données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Nous utilisons vos données pour:</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Personnaliser les interactions de votre IA</li>
              <li>• Analyser les performances de vos contenus</li>
              <li>• Respecter les limites de chaque plateforme</li>
              <li>• Assurer la conformité réglementaire</li>
              <li>• Améliorer nos services (données anonymisées)</li>
            </ul>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Nous ne faisons JAMAIS:</h4>
            <ul className="space-y-1 text-sm text-red-800">
              <li>• Vendre vos données à des tiers</li>
              <li>• Partager vos contenus sans autorisation</li>
              <li>• Utiliser vos données à des fins publicitaires</li>
              <li>• Conserver vos données au-delà de la période définie</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Durées de conservation par type:</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Messages et conversations:</span>
                <span className="font-medium">90 jours (personnalisable)</span>
              </div>
              <div className="flex justify-between">
                <span>Données analytiques:</span>
                <span className="font-medium">2 ans (puis anonymisées)</span>
              </div>
              <div className="flex justify-between">
                <span>Logs de sécurité:</span>
                <span className="font-medium">30 jours</span>
              </div>
              <div className="flex justify-between">
                <span>Données de facturation:</span>
                <span className="font-medium">10 ans (obligation légale)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consentements requis</CardTitle>
          <CardDescription>
            Veuillez lire et accepter nos conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={userData.acceptedTerms}
              onCheckedChange={(checked) => handleConsentChange('acceptedTerms', checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="terms" className="cursor-pointer">
                J'accepte les conditions d'utilisation*
              </Label>
              <p className="text-sm text-gray-600">
                Incluant les règles de conformité des plateformes
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox
              id="data-processing"
              checked={userData.dataProcessingConsent}
              onCheckedChange={(checked) => handleConsentChange('dataProcessingConsent', checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="data-processing" className="cursor-pointer">
                J'accepte le traitement de mes données personnelles*
              </Label>
              <p className="text-sm text-gray-600">
                Conformément à la politique de confidentialité
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox
              id="marketing"
              checked={userData.marketingConsent}
              onCheckedChange={(checked) => handleConsentChange('marketingConsent', checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="marketing" className="cursor-pointer">
                J'accepte de recevoir des communications marketing (optionnel)
              </Label>
              <p className="text-sm text-gray-600">
                Nouveautés, conseils et offres exclusives
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
            className="p-0 h-auto text-purple-600 hover:text-purple-700 hover:bg-transparent"
          >
            <FileText className="w-4 h-4 mr-2" />
            {showPrivacyPolicy ? "Masquer" : "Lire"} la politique de confidentialité complète
          </Button>
          
          {showPrivacyPolicy && (
            <ScrollArea className="h-48 rounded-lg border p-4">
              <div className="space-y-4 text-sm">
                <h4 className="font-semibold">1. Collecte des données</h4>
                <p>Nous collectons uniquement les données nécessaires au fonctionnement du service...</p>
                
                <h4 className="font-semibold">2. Utilisation des données</h4>
                <p>Vos données sont utilisées exclusivement pour fournir et améliorer nos services...</p>
                
                <h4 className="font-semibold">3. Conservation</h4>
                <p>Les données sont conservées pendant la durée définie dans vos paramètres...</p>
                
                <h4 className="font-semibold">4. Vos droits</h4>
                <p>Vous disposez d'un droit d'accès, de rectification et de suppression...</p>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {(!userData.acceptedTerms || !userData.dataProcessingConsent) && (
        <Alert>
          <AlertDescription>
            Les champs marqués d'un * sont obligatoires pour continuer
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}