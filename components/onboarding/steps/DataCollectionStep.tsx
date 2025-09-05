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
  { code: "US", name: "États-Unis" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "BE", name: "Belgique" },
  { code: "CH", name: "Suisse" },
  { code: "OTHER", name: "Autre" }
];

export function DataCollectionStep() {
  const { userData, updateUserData } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!userData.pseudonym || userData.pseudonym.length < 3) {
      newErrors.pseudonym = "Le pseudonyme doit contenir au moins 3 caractères";
    }
    
    if (!userData.email || !userData.email.includes('@')) {
      newErrors.email = "Veuillez entrer une adresse email valide";
    }
    
    if (!userData.country) {
      newErrors.country = "Veuillez sélectionner votre pays";
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
          Conformément au RGPD, nous collectons uniquement les informations essentielles. 
          Ces données sont nécessaires pour personnaliser votre expérience et respecter les 
          réglementations locales.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
            <CardDescription>
              Ces informations nous permettent de personnaliser votre expérience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pseudonym">
                <User className="w-4 h-4 inline mr-2" />
                Pseudonyme créateur
              </Label>
              <Input
                id="pseudonym"
                placeholder="ex: BellaStar, FitQueen, etc."
                value={userData.pseudonym || ""}
                onChange={(e) => updateUserData({ pseudonym: e.target.value })}
                className={errors.pseudonym ? "border-red-500" : ""}
              />
              {errors.pseudonym && (
                <p className="text-sm text-red-500">{errors.pseudonym}</p>
              )}
              <p className="text-xs text-gray-500">
                Ce nom sera utilisé pour personnaliser vos interactions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-2" />
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={userData.email || ""}
                onChange={(e) => updateUserData({ email: e.target.value })}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
              <p className="text-xs text-gray-500">
                Pour les notifications importantes et la récupération de compte
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                <Globe className="w-4 h-4 inline mr-2" />
                Pays de résidence
              </Label>
              <Select
                value={userData.country || ""}
                onValueChange={(value) => updateUserData({ country: value })}
              >
                <SelectTrigger className={errors.country ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionnez votre pays" />
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
                Nécessaire pour appliquer les réglementations locales
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">🔒 Vos données sont protégées</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Chiffrement de bout en bout</li>
              <li>• Aucune vente de données à des tiers</li>
              <li>• Droit d'accès et de suppression à tout moment</li>
              <li>• Conservation limitée selon vos préférences</li>
            </ul>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}