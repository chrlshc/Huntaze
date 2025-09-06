"use client";

import { useState } from "react";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Globe, Info } from "lucide-react";

const COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "OTHER", name: "Other" }
];

export function DataCollectionStep() {
  const { userData, updateUserData } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!userData.pseudonym || userData.pseudonym.length < 3) {
      newErrors.pseudonym = "Handle must be at least 3 characters";
    }
    
    if (!userData.email || !userData.email.includes('@')) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!userData.country) {
      newErrors.country = "Please select your country";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateForm();
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          In line with GDPR, we collect only essential information. 
          This data is needed to personalize your experience and meet local regulations.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic information</CardTitle>
            <CardDescription>
              This information helps us personalize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pseudonym">
                <User className="w-4 h-4 inline mr-2" />
                Creator handle
              </Label>
              <Input
                id="pseudonym"
                placeholder="e.g., BellaStar, FitQueen, etc."
                value={userData.pseudonym || ""}
                onChange={(e) => updateUserData({ pseudonym: e.target.value })}
                className={errors.pseudonym ? "border-red-500" : ""}
              />
              {errors.pseudonym && (
                <p className="text-sm text-red-500">{errors.pseudonym}</p>
              )}
              <p className="text-xs text-gray-500">
                This name will be used to personalize your interactions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-2" />
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={userData.email || ""}
                onChange={(e) => updateUserData({ email: e.target.value })}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
              <p className="text-xs text-gray-500">
                For important notifications and account recovery
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                <Globe className="w-4 h-4 inline mr-2" />
                Country of residence
              </Label>
              <Select
                value={userData.country || ""}
                onValueChange={(value) => updateUserData({ country: value })}
              >
                <SelectTrigger className={errors.country ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-red-500">{errors.country}</p>
              )}
              <p className="text-xs text-gray-500">
                Needed to apply local regulations
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">🔒 Your data is protected</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• End‑to‑end encryption</li>
              <li>• No selling of data to third parties</li>
              <li>• Right to access and delete at any time</li>
              <li>• Limited retention based on your preferences</li>
            </ul>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
