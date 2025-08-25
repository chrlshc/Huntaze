'use client'

import React from 'react'
import { Check, X } from 'lucide-react'

const features = [
  {
    category: 'Fonctionnalités de base',
    items: [
      { name: 'Boutique en ligne', basic: true, grow: true, advanced: true },
      { name: 'Nombre de produits', basic: '10', grow: 'Illimité', advanced: 'Illimité' },
      { name: 'Bande passante', basic: '2 GB', grow: 'Illimitée', advanced: 'Illimitée' },
      { name: 'Stockage', basic: '1 GB', grow: '10 GB', advanced: '100 GB' },
    ]
  },
  {
    category: 'Ventes et paiements',
    items: [
      { name: 'Commission sur les ventes', basic: '5%', grow: '3%', advanced: '1.5%' },
      { name: 'Paiements internationaux', basic: false, grow: true, advanced: true },
      { name: 'Multi-devises', basic: false, grow: false, advanced: true },
      { name: 'Factures personnalisées', basic: false, grow: true, advanced: true },
    ]
  },
  {
    category: 'Marketing et SEO',
    items: [
      { name: 'SEO de base', basic: true, grow: true, advanced: true },
      { name: 'Email marketing', basic: '100/mois', grow: '5000/mois', advanced: 'Illimité' },
      { name: 'Campagnes automatisées', basic: false, grow: true, advanced: true },
      { name: 'A/B Testing', basic: false, grow: false, advanced: true },
    ]
  },
  {
    category: 'Support',
    items: [
      { name: 'Support par email', basic: true, grow: true, advanced: true },
      { name: 'Support téléphonique', basic: false, grow: true, advanced: true },
      { name: 'Manager dédié', basic: false, grow: false, advanced: true },
      { name: 'Formation personnalisée', basic: false, grow: false, advanced: true },
    ]
  },
  {
    category: 'Intégrations',
    items: [
      { name: 'Intégrations de base', basic: true, grow: true, advanced: true },
      { name: 'API personnalisée', basic: false, grow: false, advanced: true },
      { name: 'Webhooks', basic: false, grow: true, advanced: true },
      { name: 'Intégrations premium', basic: false, grow: false, advanced: true },
    ]
  }
]

export default function PricingComparison() {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-300 mx-auto" />
      )
    }
    return <span className="text-sm font-medium">{value}</span>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">
        Comparez nos plans en détail
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-6 text-gray-600 font-medium">
                Fonctionnalités
              </th>
              <th className="text-center py-4 px-6">
                <div className="font-bold text-lg">Basic</div>
                <div className="text-gray-600 text-sm">25€/mois</div>
              </th>
              <th className="text-center py-4 px-6 bg-gradient-to-b from-purple-50 to-transparent">
                <div className="font-bold text-lg text-purple-600">Grow</div>
                <div className="text-gray-600 text-sm">66€/mois</div>
                <div className="text-xs text-purple-600 font-medium mt-1">Recommandé</div>
              </th>
              <th className="text-center py-4 px-6">
                <div className="font-bold text-lg">Advanced</div>
                <div className="text-gray-600 text-sm">289€/mois</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((category, categoryIdx) => (
              <React.Fragment key={categoryIdx}>
                <tr>
                  <td colSpan={4} className="pt-8 pb-4 px-6">
                    <h3 className="font-semibold text-gray-900">{category.category}</h3>
                  </td>
                </tr>
                {category.items.map((feature, featureIdx) => (
                  <tr key={featureIdx} className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">{feature.name}</td>
                    <td className="py-4 px-6 text-center">{renderValue(feature.basic)}</td>
                    <td className="py-4 px-6 text-center bg-gradient-to-b from-purple-50/50 to-transparent">
                      {renderValue(feature.grow)}
                    </td>
                    <td className="py-4 px-6 text-center">{renderValue(feature.advanced)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}