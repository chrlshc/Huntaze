"use client";

import { useEffect } from "react";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import { Sparkles, Shield, Users, TrendingUp } from "lucide-react";

export function WelcomeStep() {
  const { updateUserData } = useOnboarding();

  useEffect(() => {
    updateUserData({ ...useOnboarding.getState().userData, onboardingStartDate: new Date() });
  }, [updateUserData]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold">Bienvenue sur Huntaze! 🎉</h2>
        
        <p className="text-gray-600 max-w-2xl mx-auto">
          Nous sommes ravis de vous accueillir. Huntaze est votre plateforme tout-en-un pour automatiser 
          et optimiser votre présence sur les réseaux sociaux grâce à l'intelligence artificielle.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-lg p-6 space-y-3">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold">Conformité garantie</h3>
          <p className="text-sm text-gray-600">
            Respectez automatiquement les règles de chaque plateforme
          </p>
        </div>

        <div className="bg-pink-50 rounded-lg p-6 space-y-3">
          <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold">IA personnalisée</h3>
          <p className="text-sm text-gray-600">
            Une équipe virtuelle qui comprend votre style et votre audience
          </p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-6 space-y-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold">Croissance optimisée</h3>
          <p className="text-sm text-gray-600">
            Maximisez vos revenus avec des stratégies intelligentes
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Ce processus d'onboarding comprend:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Formation sur la conformité et les bonnes pratiques
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Configuration de vos préférences de confidentialité RGPD
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Connexion sécurisée à vos plateformes sociales
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Personnalisation de votre assistant IA
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            Configuration des paramètres de gouvernance
          </li>
        </ul>
      </div>

      <p className="text-center text-sm text-gray-500">
        Durée estimée: 15-20 minutes • Vos données sont sécurisées et chiffrées
      </p>
    </div>
  );
}