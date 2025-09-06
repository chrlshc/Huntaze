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
      title: 'Security & Privacy',
      iconName: 'Shield',
      items: [
        {
          question: 'How is my data protected?',
          answer: 'Your data is encrypted with AES-256, stored on secure servers, and we never share your information with third parties.'
        },
        {
          question: 'Who can see my conversations?',
          answer: 'Only you and authorized recipients. Our team has no access unless you explicitly grant it for support.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      iconName: 'AlertCircle',
      items: [
        {
          question: 'My Instagram account won’t connect',
          answer: 'Make sure you have a Business or Creator account on Instagram. Personal accounts do not support the API. Also check that your token hasn’t expired.'
        },
        {
          question: 'Messages blocked or rate‑limited',
          answer: 'Each platform has hourly/daily limits. Wait for reset (usually 1h) or reduce your activity temporarily.'
        }
      ]
    },
    {
      id: 'compliance',
      title: 'Compliance',
      iconName: 'Key',
      items: [
        {
          question: 'What actions trigger supervision?',
          answer: 'Messages > $100, sending to > 50 recipients, or AI confidence < 70%. Thresholds are configurable in governance settings.'
        },
        {
          question: 'How do I withdraw GDPR consent?',
          answer: 'You can withdraw consent anytime in your settings. Your data will be removed per regulation.'
        },
        {
          question: 'Data retention periods?',
          answer: '90 days by default for messages, customizable from 30 to 365 days. Analytics data is anonymized after 2 years.'
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
            Help & Support
          </SheetTitle>
          <SheetDescription>
            Quickly find answers to common questions
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
              <strong>Tip:</strong> Most issues resolve by checking permissions 
              and ensuring accounts are correctly set up (Business/Creator).
            </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>24/7 Support</CardTitle>
                <CardDescription>
                  Our team is here to help every step of the way
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Live chat
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
                <strong>Opening hours:</strong><br />
                Mon–Fri: 9:00 – 20:00<br />
                Sat–Sun: 10:00 – 18:00 (CET)
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
