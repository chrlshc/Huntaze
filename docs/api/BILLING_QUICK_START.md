# 🚀 Billing Checkout - Quick Start Guide

**5 minutes pour intégrer le checkout billing optimisé**

---

## 📦 Installation

Aucune dépendance supplémentaire requise ! Tout est déjà configuré.

---

## ⚡ Quick Start (3 étapes)

### Étape 1: Importer le Hook

```typescript
import { useCheckoutWithRedirect } from '@/hooks/billing/useCheckout';
```

### Étape 2: Utiliser dans votre Composant

```typescript
function BillingPage() {
  const { purchasePack, loading, error } = useCheckoutWithRedirect();

  return (
    <div>
      <button 
        onClick={() => purchasePack('25k')} 
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Buy 25k Pack'}
      </button>
      
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Étape 3: C'est tout ! 🎉

Le hook gère automatiquement:
- ✅ Création de la session Stripe
- ✅ Redirection vers le checkout
- ✅ Gestion des erreurs
- ✅ États de chargement
- ✅ Retry automatique

---

## 🎨 Utiliser le Composant UI Prêt à l'Emploi

```typescript
import { MessagePacksCheckout } from '@/components/billing/MessagePacksCheckout';

function BillingPage() {
  return <MessagePacksCheckout />;
}
```

**Inclut**:
- ✅ Design premium responsive
- ✅ 3 packs (25k, 100k, 500k)
- ✅ Loading states
- ✅ Error handling
- ✅ Trust indicators

---

## 📝 Packs Disponibles

| Pack | Messages | Nom |
|------|----------|-----|
| `'25k'` | 25,000 | Starter Pack |
| `'100k'` | 100,000 | Pro Pack |
| `'500k'` | 500,000 | Enterprise Pack |

---

## 🔧 Options Avancées

### Avec Customer ID Custom

```typescript
const { purchasePack } = useCheckoutWithRedirect();

purchasePack('100k', 'cus_custom_id');
```

### Avec Metadata

```typescript
purchasePack('100k', 'cus_custom_id', {
  userId: 'user_456',
  campaign: 'summer_sale',
});
```

### Hook Sans Auto-Redirect

```typescript
import { useCheckout } from '@/hooks/billing/useCheckout';

const { createCheckout, loading, error } = useCheckout();

const handlePurchase = async () => {
  const result = await createCheckout({ pack: '25k' });
  
  if (result.success && result.url) {
    // Faire quelque chose avant la redirection
    console.log('Session ID:', result.sessionId);
    window.location.href = result.url;
  }
};
```

---

## 🎯 Exemples Complets

### Exemple 1: Bouton Simple

```typescript
'use client';

import { useCheckoutWithRedirect } from '@/hooks/billing/useCheckout';

export function BuyButton() {
  const { purchasePack, loading } = useCheckoutWithRedirect();

  return (
    <button 
      onClick={() => purchasePack('25k')}
      disabled={loading}
      className="px-6 py-3 bg-purple-600 text-white rounded-lg"
    >
      {loading ? 'Processing...' : 'Buy Now'}
    </button>
  );
}
```

### Exemple 2: Sélection de Pack

```typescript
'use client';

import { useState } from 'react';
import { useCheckoutWithRedirect, PackType } from '@/hooks/billing/useCheckout';

export function PackSelector() {
  const [selectedPack, setSelectedPack] = useState<PackType>('100k');
  const { purchasePack, loading, error } = useCheckoutWithRedirect();

  return (
    <div>
      <select 
        value={selectedPack} 
        onChange={(e) => setSelectedPack(e.target.value as PackType)}
      >
        <option value="25k">25k Messages</option>
        <option value="100k">100k Messages</option>
        <option value="500k">500k Messages</option>
      </select>

      <button 
        onClick={() => purchasePack(selectedPack)}
        disabled={loading}
      >
        Purchase
      </button>

      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

### Exemple 3: Avec Confirmation

```typescript
'use client';

import { useState } from 'react';
import { useCheckoutWithRedirect, PACK_INFO } from '@/hooks/billing/useCheckout';

export function PackPurchase() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { purchasePack, loading } = useCheckoutWithRedirect();

  const handleConfirm = () => {
    purchasePack('100k');
    setShowConfirm(false);
  };

  return (
    <div>
      <button onClick={() => setShowConfirm(true)}>
        Buy Pro Pack
      </button>

      {showConfirm && (
        <div className="modal">
          <h3>Confirm Purchase</h3>
          <p>You are about to purchase:</p>
          <p><strong>{PACK_INFO['100k'].name}</strong></p>
          <p>{PACK_INFO['100k'].messages.toLocaleString()} messages</p>
          
          <button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm'}
          </button>
          <button onClick={() => setShowConfirm(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🔍 Debugging

### Obtenir le Correlation ID

```typescript
const { createCheckout, correlationId } = useCheckout();

const result = await createCheckout({ pack: '25k' });
console.log('Correlation ID:', result.correlationId);
// Utiliser cet ID pour chercher dans les logs
```

### Logs Backend

```bash
# Chercher par correlation ID
grep "billing-1736159823400-abc123" logs/*.log

# Voir les erreurs
grep "[ERROR]" logs/billing.log
```

---

## ⚠️ Troubleshooting

### Erreur: "Missing Stripe price id"

**Solution**: Vérifier les variables d'environnement

```bash
STRIPE_PRICE_MSGPACK_25K=price_...
STRIPE_PRICE_MSGPACK_100K=price_...
STRIPE_PRICE_MSGPACK_500K=price_...
```

### Erreur: "Missing demo customer"

**Solution**: Définir le customer ID

```bash
DEMO_STRIPE_CUSTOMER_ID=cus_...
```

Ou passer un customerId:

```typescript
purchasePack('25k', 'cus_custom_id');
```

### Erreur: "Payment processing error"

**Solution**: Vérifier Stripe dashboard et API key

```bash
STRIPE_SECRET_KEY=sk_live_...
```

---

## 📚 Documentation Complète

Pour plus de détails, voir:
- [API Documentation](./billing-checkout.md) - Documentation complète
- [Optimization Report](../../BILLING_CHECKOUT_OPTIMIZATION_COMPLETE.md) - Détails techniques

---

## 🎉 C'est Tout !

Vous êtes prêt à accepter des paiements ! 🚀

**Questions ?** Consultez la [documentation complète](./billing-checkout.md)

---

**Version**: 2.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: 2025-11-14
