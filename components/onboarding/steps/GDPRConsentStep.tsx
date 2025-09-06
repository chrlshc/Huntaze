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
        <h3 className="text-xl font-semibold">Protecting your data</h3>
        <p className="text-gray-600">
          In line with GDPR, here’s how your data is used
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your GDPR rights</CardTitle>
          <CardDescription>
            You have extensive rights over your personal data
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Right of access</h4>
                <p className="text-sm text-gray-600">
                  Request a copy of all your data anytime
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Right to erasure</h4>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and data
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Retention</h4>
                <p className="text-sm text-gray-600">
                  90 days by default, customizable in settings
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Hardened security</h4>
                <p className="text-sm text-gray-600">
                  AES‑256 encryption and strictly controlled access
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How we use your data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">We use your data to:</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Personalize your AI’s interactions</li>
              <li>• Analyze your content performance</li>
              <li>• Respect each platform’s limits</li>
              <li>• Ensure regulatory compliance</li>
              <li>• Improve our services (anonymized data)</li>
            </ul>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">We NEVER:</h4>
            <ul className="space-y-1 text-sm text-red-800">
              <li>• Sell your data to third parties</li>
              <li>• Share your content without permission</li>
              <li>• Use your data for advertising</li>
              <li>• Keep data beyond defined retention</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Retention by data type:</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Messages and conversations:</span>
                <span className="font-medium">90 days (customizable)</span>
              </div>
              <div className="flex justify-between">
                <span>Analytics data:</span>
                <span className="font-medium">2 years (then anonymized)</span>
              </div>
              <div className="flex justify-between">
                <span>Security logs:</span>
                <span className="font-medium">30 days</span>
              </div>
              <div className="flex justify-between">
                <span>Billing data:</span>
                <span className="font-medium">10 years (legal requirement)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required consents</CardTitle>
          <CardDescription>
            Please read and accept our terms
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
                I accept the Terms of Service*
              </Label>
              <p className="text-sm text-gray-600">
                Including platform compliance rules
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
                I consent to personal data processing*
              </Label>
              <p className="text-sm text-gray-600">
                As described in the Privacy Policy
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
                I agree to receive marketing communications (optional)
              </Label>
              <p className="text-sm text-gray-600">
                Product updates, tips, and exclusive offers
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
            className="p-0 h-auto text-purple-600 hover:text-purple-700 hover:bg-transparent"
          >
            <FileText className="w-4 h-4 mr-2" />
            {showPrivacyPolicy ? "Hide" : "Read"} the full privacy policy
          </Button>
          
          {showPrivacyPolicy && (
            <ScrollArea className="h-48 rounded-lg border p-4">
              <div className="space-y-4 text-sm">
                <h4 className="font-semibold">1. Data collection</h4>
                <p>We collect only the data necessary to provide the service...</p>
                
                <h4 className="font-semibold">2. Data usage</h4>
                <p>Your data is used exclusively to provide and improve our services...</p>
                
                <h4 className="font-semibold">3. Retention</h4>
                <p>Data is retained for the duration defined in your settings...</p>
                
                <h4 className="font-semibold">4. Your rights</h4>
                <p>You have rights to access, rectify, and delete your data...</p>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {(!userData.acceptedTerms || !userData.dataProcessingConsent) && (
        <Alert>
          <AlertDescription>
            Fields marked with * are required to continue
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
