"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HelpCircle, Shield, Key, AlertCircle, MessageCircle, Phone, Mail, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function HelpSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const helpTopics = [
    {
      id: 'security',
      title: 'Sécurité & Confidentialité',
      iconName: 'Shield',
      items: [
        {
          question: 'Comment mes données sont-elles protégées?',
          answer: 'Vos données sont chiffrées avec AES-256, stockées dans des serveurs sécurisés en Europe, et nous ne partageons jamais vos informations avec des tiers.'
        },
        {
          question: 'Qui peut voir mes conversations?',
          answer: 'Uniquement vous et les destinataires autorisés. Notre équipe n\'a pas accès à vos messages, sauf autorisation explicite pour le support.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Résolution de problèmes',
      iconName: 'AlertCircle',
      items: [
        {
          question: 'Mon compte Instagram ne se connecte pas',
          answer: 'Assurez-vous d\'avoir un compte Business ou Creator sur Instagram. Les comptes personnels ne supportent pas l\'API. Vérifiez aussi que votre token n\'a pas expiré.'
        },
        {
          question: 'Messages bloqués ou rate limited',
          answer: 'Chaque plateforme a ses limites horaires/quotidiennes. Attendez le reset (généralement 1h) ou réduisez temporairement votre activité.'
        }
      ]
    },
    {
      id: 'compliance',
      title: 'Conformité',
      iconName: 'Key',
      items: [
        {
          question: 'Quelles actions déclenchent une supervision?',
          answer: 'Messages > 100$, envois à > 50 destinataires, ou confiance IA < 70%. Ces seuils sont personnalisables dans les paramètres de gouvernance.'
        },
        {
          question: 'Comment retirer mon consentement RGPD?',
          answer: 'Vous pouvez retirer votre consentement à tout moment depuis vos paramètres. Vos données seront supprimées selon la réglementation.'
        },
        {
          question: 'Durée de conservation des données?',
          answer: '90 jours par défaut pour les messages, personnalisable de 30 à 365 jours. Les données analytiques sont anonymisées après 2 ans.'
        }
      ]
    }
  ];

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-5 h-5" />;
      case 'AlertCircle':
        return <AlertCircle className="w-5 h-5" />;
      case 'Key':
        return <Key className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 z-50 p-0"
        >
          <HelpCircle className="h-6 w-6 text-purple-600" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-600" />
            Aide & Support
          </SheetTitle>
          <SheetDescription>
            Trouvez rapidement des réponses à vos questions
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="faq" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq" className="space-y-4 mt-4">
            {helpTopics.map((topic) => (
              <Card key={topic.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {renderIcon(topic.iconName)}
                    {topic.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topic.items.map((item, idx) => (
                    <details key={idx} className="group">
                      <summary className="flex items-start justify-between cursor-pointer list-none">
                        <span className="text-sm font-medium pr-2">{item.question}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="mt-2 text-sm text-gray-600 pl-1">{item.answer}</p>
                    </details>
                  ))}
                </CardContent>
              </Card>
            ))}
            
            <Alert className="bg-purple-50 border-purple-200">
              <AlertDescription>
                <strong>Astuce:</strong> La plupart des problèmes se résolvent en vérifiant vos permissions 
                et en vous assurant que vos comptes sont bien configurés (Business/Creator).
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Support 24/7</CardTitle>
                <CardDescription>
                  Notre équipe est là pour vous aider à chaque étape
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat en direct
                </Button>
                
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  support@huntaze.com
                </Button>
                
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  +33 1 23 45 67 89
                </Button>
              </CardContent>
            </Card>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Heures d'ouverture:</strong><br />
                Lun-Ven: 9h00 - 20h00<br />
                Sam-Dim: 10h00 - 18h00 (CET)
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}