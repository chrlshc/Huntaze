'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, DollarSign, Calendar, Users, Brain, Target, Zap, 
  ChevronRight, ArrowRight, Check, Sparkles, Shield, Clock,
  MessageSquare, BarChart3, Bell, Heart
} from 'lucide-react';

export default function WhyHuntazePage() {
  const [activeWidget, setActiveWidget] = useState(0);

  const widgets = [
    {
      title: 'Revenue Goal Widget',
      icon: DollarSign,
      color: 'purple',
      problem: 'Tu perds 50% de tes revenus avec une agence',
      solution: 'Garde 100% de tes gains avec des insights AI personnalisés',
      features: [
        'Suivi en temps réel de tes objectifs mensuels',
        'Suggestions AI pour augmenter tes revenus selon ta niche',
        'Alertes quand tu es proche d\'un milestone',
        'Prédictions basées sur tes performances passées'
      ],
      impact: '+73% de revenus en moyenne après 3 mois'
    },
    {
      title: 'Content Calendar Widget',
      icon: Calendar,
      color: 'blue',
      problem: 'Tu oublies de poster et perds des fans',
      solution: 'Ne rate plus jamais les heures optimales de posting',
      features: [
        'Horaires optimaux selon ta niche (fitness = matin, gaming = soir)',
        'Rappels automatiques avant les peak hours',
        'Planning visuel de tout ton contenu',
        'Suggestions de contenu basées sur ce qui marche'
      ],
      impact: '3x plus d\'engagement aux bonnes heures'
    },
    {
      title: 'Fan Engagement Widget',
      icon: Users,
      color: 'pink',
      problem: 'Tu ne sais pas qui sont tes meilleurs fans',
      solution: 'Segmentation AI pour maximiser chaque relation',
      features: [
        'Identification automatique des VIP (5% qui génèrent 80% des revenus)',
        'Alertes pour les fans à risque de partir',
        'Suggestions personnalisées par segment',
        'Tracking du potentiel d\'upgrade de chaque fan'
      ],
      impact: '+45% de rétention des top fans'
    },
    {
      title: 'AI Performance Widget',
      icon: Brain,
      color: 'green',
      problem: 'Répondre à tous tes messages prend des heures',
      solution: 'L\'AI répond comme toi pendant que tu dors',
      features: [
        'Réponses instantanées 24/7 dans ton style',
        'Détection des opportunités de vente',
        'Apprentissage continu de tes préférences',
        'Alertes pour les conversations importantes'
      ],
      impact: '87% d\'automatisation, 2h économisées/jour'
    }
  ];

  const currentWidget = widgets[activeWidget];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-12">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Retour au dashboard
          </Link>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Pourquoi Huntaze est un <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Must-Have</span> 💜
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl">
            Arrête de donner 50% à une agence. Avec Huntaze, tu payes seulement 15% 
            et tu multiplies tes revenus avec une AI qui apprend ton style.
          </p>

          {/* Key Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <p className="text-3xl font-bold text-purple-600 mb-2">15%</p>
              <p className="text-gray-600">Commission Huntaze</p>
              <p className="text-xs text-gray-500">vs 50% agence</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <p className="text-3xl font-bold text-pink-600 mb-2">87%</p>
              <p className="text-gray-600">Messages automatisés</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <p className="text-3xl font-bold text-purple-600 mb-2">2h/jour</p>
              <p className="text-gray-600">Temps économisé</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <p className="text-3xl font-bold text-pink-600 mb-2">+73%</p>
              <p className="text-gray-600">Revenus moyens</p>
            </div>
          </div>
        </div>
      </div>

      {/* How Widgets Help Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Comment les Widgets Révolutionnent Ton Business
          </h2>
          <p className="text-xl text-gray-600">
            Chaque widget est conçu pour résoudre un problème spécifique des créatrices
          </p>
        </div>

        {/* Widget Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Widget Selector */}
          <div className="space-y-4">
            {widgets.map((widget, index) => (
              <button
                key={index}
                onClick={() => setActiveWidget(index)}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                  activeWidget === index 
                    ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-${widget.color}-100`}>
                    <widget.icon className={`w-6 h-6 text-${widget.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">{widget.title}</h3>
                    <p className="text-sm text-red-600 mb-1">❌ {widget.problem}</p>
                    <p className="text-sm text-green-600">✅ {widget.solution}</p>
                  </div>
                  {activeWidget === index && (
                    <ChevronRight className="w-5 h-5 text-purple-600 mt-1" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Active Widget Details */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${currentWidget.color}-100 rounded-lg mb-6`}>
              <currentWidget.icon className={`w-5 h-5 text-${currentWidget.color}-600`} />
              <span className={`font-semibold text-${currentWidget.color}-700`}>{currentWidget.title}</span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ce que ça fait pour toi :
            </h3>

            <ul className="space-y-3 mb-6">
              {currentWidget.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
              <p className="text-sm font-semibold text-purple-900 mb-1">Impact moyen :</p>
              <p className="text-lg font-bold text-purple-900">{currentWidget.impact}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Huntaze vs. Agence Traditionnelle
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Agence */}
            <div className="bg-gray-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-red-400 mb-6">Agence Traditionnelle 👎</hントjson>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>50% de commission sur TES revenus</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Réponses génériques qui sonnent faux</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Tu perds le contrôle de ta relation fans</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Chatteurs qui connaissent pas ta personnalité</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Pas de données sur ce qui marche vraiment</span>
                </li>
              </ul>
            </div>

            {/* Huntaze */}
            <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-green-400 mb-6">Huntaze 💜</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>85% de TES revenus restent à TOI (vs 50% agence)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>AI qui apprend TON style unique</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Tu gardes le contrôle total</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Réponses personnalisées qui convertissent</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Analytics détaillées pour optimiser</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Ce que disent les créatrices qui utilisent Huntaze
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://ui-avatars.com/api/?name=Sophie+M&background=gradient" className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">Sophie M.</p>
                <p className="text-sm text-gray-500">Fitness Creator</p>
              </div>
            </div>
            <p className="text-gray-700 mb-3">
              "J'ai triplé mes revenus en 2 mois! L'AI répond exactement comme moi, 
              mes fans voient pas la différence. Je me concentre sur mon contenu maintenant."
            </p>
            <p className="text-sm font-semibold text-purple-600">+12K$/mois depuis Huntaze</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://ui-avatars.com/api/?name=Luna+R&background=gradient" className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">Luna R.</p>
                <p className="text-sm text-gray-500">Gaming Creator</p>
              </div>
            </div>
            <p className="text-gray-700 mb-3">
              "Les widgets me montrent exactement quand poster et à qui parler. 
              J'ai enfin compris qui sont mes vrais VIP fans!"
            </p>
            <p className="text-sm font-semibold text-purple-600">87% d'automatisation</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://ui-avatars.com/api/?name=Mia+K&background=gradient" className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">Mia K.</p>
                <p className="text-sm text-gray-500">Lifestyle Creator</p>
              </div>
            </div>
            <p className="text-gray-700 mb-3">
              "Avant je payais 50% à une agence pour des réponses nulles. 
              Maintenant je paie seulement 15% et l'AI est 10x meilleure!"
            </p>
            <p className="text-sm font-semibold text-purple-600">35% de commission économisée</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Prête à garder 85% de tes revenus au lieu de 50% ? 💰
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoins les créatrices qui ont repris le contrôle de leur business
            <br />
            <span className="text-sm opacity-75">Commission Huntaze: 15% seulement vs 50% agence traditionnelle</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transition-all">
              <Sparkles className="w-5 h-5" />
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-all">
              <BarChart3 className="w-5 h-5" />
              Voir le dashboard
            </Link>
          </div>
          <p className="mt-4 text-sm opacity-75">
            Pas de carte requise • Setup en 5 minutes • Annule quand tu veux
          </p>
        </div>
      </div>
    </div>
  );
}