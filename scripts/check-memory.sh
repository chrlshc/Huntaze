#!/bin/bash

# Script pour vérifier l'utilisation mémoire

echo "🔍 Vérification de l'utilisation mémoire..."
echo ""

# Mémoire totale du système
echo "📊 Mémoire système:"
vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages\s+([^:]+)[^\d]+(\d+)/ and printf("%-16s % 16.2f MB\n", "$1:", $2 * $size / 1048576);'
echo ""

# Processus Node les plus gourmands
echo "🔥 Top 5 processus Node (par RAM):"
ps aux | grep -i node | grep -v grep | sort -k4 -r | head -5 | awk '{printf "%-8s %6s%% %10s KB  %s\n", $2, $4, $6, substr($0, index($0,$11))}'
echo ""

# Processus Vitest
VITEST_COUNT=$(ps aux | grep -i vitest | grep -v grep | wc -l | tr -d ' ')
if [ "$VITEST_COUNT" -gt 0 ]; then
    echo "⚠️  ATTENTION: $VITEST_COUNT processus Vitest détectés!"
    ps aux | grep -i vitest | grep -v grep
else
    echo "✅ Aucun processus Vitest en cours"
fi
echo ""

# Espace disque
echo "💾 Espace disque disponible:"
df -h . | tail -1 | awk '{printf "Utilisé: %s / %s (%s)\n", $3, $2, $5}'
