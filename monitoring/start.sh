#!/bin/bash

echo "🚀 Starting Huntaze Monitoring Stack..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Démarrer les services
docker-compose up -d

echo "✅ Monitoring stack started!"
echo ""
echo "📊 Access your monitoring tools:"
echo "   Grafana:      http://localhost:3001 (admin/admin123)"
echo "   Prometheus:   http://localhost:9090"
echo "   Alertmanager: http://localhost:9093"
echo ""
echo "🔧 Next steps:"
echo "   1. Configure Slack webhook in alertmanager.yml"
echo "   2. Add /api/metrics endpoint to your API"
echo "   3. Import additional dashboards from grafana.com"
echo ""
echo "📖 Documentation: https://docs.huntaze.com/monitoring"
