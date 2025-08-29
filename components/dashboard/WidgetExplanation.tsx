'use client';

import { useState } from 'react';
import { X, Info, DollarSign, Calendar, Users, Brain } from 'lucide-react';

interface WidgetExplanationProps {
  widgetName: string;
  onClose?: () => void;
}

export function WidgetExplanation({ widgetName, onClose }: WidgetExplanationProps) {
  const explanations: Record<string, {
    title: string;
    icon: any;
    problem: string;
    solution: string;
    benefits: string[];
    example: string;
  }> = {
    'revenue': {
      title: 'Revenue Goal Widget',
      icon: DollarSign,
      problem: 'Tu ne sais pas si tu es sur la bonne voie pour atteindre tes objectifs financiers',
      solution: 'Suivi en temps réel avec prédictions AI et suggestions personnalisées',
      benefits: [
        'Voir exactement combien gagner par jour pour atteindre ton goal',
        'Suggestions AI basées sur ta niche (fitness, gaming, etc.)',
        'Alertes quand tu approches un milestone important',
        'Comparaison avec les meilleures périodes passées'
      ],
      example: 'Si tu es dans le fitness, l\'AI te suggérera de lancer une offre "Summer Body" en mai car c\'est là que tes fans dépensent le plus.'
    },
    'calendar': {
      title: 'Content Calendar Widget',
      icon: Calendar,
      problem: 'Tu postes au mauvais moment et rates 70% de ton audience',
      solution: 'Planning intelligent qui s\'adapte à ta niche et timezone',
      benefits: [
        'Horaires optimaux selon ta niche (ex: fitness = 6h-8h, gaming = 20h-23h)',
        'Rappels avant les peak hours de tes fans',
        'Vue d\'ensemble de ton contenu planifié',
        'Suggestions de contenu basées sur les tendances'
      ],
      example: 'Pour une gameuse, l\'AI détecte que ses fans sont 3x plus actifs le vendredi soir et suggère un stream à 21h.'
    },
    'fans': {
      title: 'Fan Engagement Widget',
      icon: Users,
      problem: 'Tu traites tous tes fans pareil alors que 5% génèrent 80% des revenus',
      solution: 'Segmentation AI automatique avec stratégies personnalisées',
      benefits: [
        'Identifier tes VIP fans instantanément',
        'Voir qui est sur le point de se désabonner',
        'Suggestions de messages personnalisés par segment',
        'Tracker le potentiel de chaque fan'
      ],
      example: 'L\'AI identifie que "John" dépense 300$/mois et te suggère de lui envoyer du contenu exclusif pour le garder engagé.'
    },
    'performance': {
      title: 'AI Performance Widget',
      icon: Brain,
      problem: 'Tu passes 4h/jour à répondre aux messages répétitifs',
      solution: 'AI qui répond dans ton style pendant que tu crées du contenu',
      benefits: [
        'Réponses 24/7 même quand tu dors',
        'Apprentissage continu de ton style unique',
        'Détection automatique des opportunités de vente',
        'Métriques détaillées sur ce qui convertit'
      ],
      example: 'Un fan demande "Tu fais des customs?" à 3h du matin. L\'AI répond dans ton style, propose tes tarifs, et tu te réveilles avec une vente!'
    }
  };

  const widget = explanations[widgetName];
  if (!widget) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <widget.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{widget.title}</h2>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Problem */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              ❌ Le Problème
            </h3>
            <p className="text-red-700">{widget.problem}</p>
          </div>

          {/* Solution */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              ✅ La Solution Huntaze
            </h3>
            <p className="text-green-700">{widget.solution}</p>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Ce que ça t\'apporte :</h3>
            <ul className="space-y-2">
              {widget.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Real Example */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              💡 Exemple Concret
            </h3>
            <p className="text-purple-700">{widget.example}</p>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600 mb-2">
              C\'est ça la différence entre gagner 5K et 25K par mois
            </p>
            {onClose && (
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                J\'ai compris, montrez-moi mes stats!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}