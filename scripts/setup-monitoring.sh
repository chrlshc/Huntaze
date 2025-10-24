#!/bin/bash

# Setup Monitoring Stack (Grafana + Prometheus)
# Script pour déployer rapidement le monitoring en développement

set -e

echo "🚀 Setting up Huntaze Monitoring Stack..."

# Créer les répertoires nécessaires
mkdir -p monitoring/{prometheus,grafana,alertmanager}
mkdir -p monitoring/grafana/{dashboards,provisioning/{dashboards,datasources}}

# Configuration Prometheus
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'huntaze-api'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: /api/metrics
    scrape_interval: 10s
    
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

# Règles d'alerte Prometheus
cat > monitoring/prometheus/alerts.yml << 'EOF'
groups:
  - name: huntaze_slo
    interval: 30s
    rules:
      # Availability SLO
      - alert: HighErrorRate
        expr: |
          (
            rate(http_requests_total{status=~"5.."}[5m]) /
            rate(http_requests_total[5m])
          ) * 100 > 1
        for: 2m
        labels:
          severity: critical
          service: huntaze-api
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% for the last 5 minutes"
          runbook_url: "https://docs.huntaze.com/runbooks/high-error-rate"

      # Latency SLO
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) * 1000 > 500
        for: 5m
        labels:
          severity: warning
          service: huntaze-api
        annotations:
          summary: "High P95 latency detected"
          description: "P95 latency is {{ $value }}ms"
          runbook_url: "https://docs.huntaze.com/runbooks/high-latency"

      # Circuit Breaker Open
      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state{state="open"} == 1
        for: 1m
        labels:
          severity: warning
          service: "{{ $labels.service }}"
        annotations:
          summary: "Circuit breaker {{ $labels.service }} is OPEN"
          description: "Circuit breaker for {{ $labels.service }} has been open for more than 1 minute"

      # Low Throughput
      - alert: LowThroughput
        expr: rate(http_requests_total[5m]) < 10
        for: 10m
        labels:
          severity: warning
          service: huntaze-api
        annotations:
          summary: "Low request throughput"
          description: "Request rate is {{ $value }} RPS"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: |
          (
            process_resident_memory_bytes / 
            (1024 * 1024 * 1024)
          ) > 1
        for: 5m
        labels:
          severity: warning
          service: huntaze-api
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}GB"

      # Dependency Down
      - alert: DependencyDown
        expr: dependency_health{status="down"} == 1
        for: 1m
        labels:
          severity: critical
          dependency: "{{ $labels.dependency }}"
        annotations:
          summary: "Dependency {{ $labels.dependency }} is down"
          description: "Critical dependency {{ $labels.dependency }} has been down for more than 1 minute"
EOF

# Configuration Alertmanager
cat > monitoring/alertmanager/alertmanager.yml << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@huntaze.com'

route:
  group_by: ['alertname', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://host.docker.internal:3000/api/webhooks/alerts'
        send_resolved: true

  - name: 'critical-alerts'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#alerts-critical'
        title: '🚨 CRITICAL Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        actions:
          - type: button
            text: 'View Dashboard'
            url: '${GRAFANA_URL}/d/huntaze-overview'
          - type: button
            text: 'Runbook'
            url: '{{ .CommonAnnotations.runbook_url }}'

  - name: 'warning-alerts'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#alerts-warning'
        title: '⚠️ Warning Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
EOF

# Configuration Grafana datasource
cat > monitoring/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

# Configuration Grafana dashboards
cat > monitoring/grafana/provisioning/dashboards/dashboards.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Dashboard Grafana principal
cat > monitoring/grafana/dashboards/huntaze-overview.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Huntaze API Overview",
    "tags": ["huntaze", "api", "slo"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "RPS"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 50},
                {"color": "green", "value": 100}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 5}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "P95 Latency",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000",
            "legendFormat": "P95 ms"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "ms",
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 500},
                {"color": "red", "value": 1000}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "Availability",
        "type": "stat",
        "targets": [
          {
            "expr": "(1 - rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])) * 100",
            "legendFormat": "Availability %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 99.5},
                {"color": "green", "value": 99.9}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      },
      {
        "id": 5,
        "title": "Request Rate Over Time",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 6,
        "title": "Response Time Heatmap",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_bucket[5m])",
            "format": "heatmap",
            "legendFormat": "{{le}}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      },
      {
        "id": 7,
        "title": "Circuit Breaker Status",
        "type": "table",
        "targets": [
          {
            "expr": "circuit_breaker_state",
            "format": "table",
            "instant": true
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16}
      },
      {
        "id": 8,
        "title": "Cache Hit Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "cache_hit_rate",
            "legendFormat": "Hit Rate %"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "10s"
  }
}
EOF

# Docker Compose pour le stack monitoring
cat > monitoring/docker-compose.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: huntaze-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: huntaze-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    container_name: huntaze-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager:/etc/alertmanager
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: huntaze-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:

networks:
  default:
    name: huntaze-monitoring
EOF

# Script de démarrage
cat > monitoring/start.sh << 'EOF'
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
EOF

chmod +x monitoring/start.sh

# Script d'arrêt
cat > monitoring/stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Huntaze Monitoring Stack..."

docker-compose down

echo "✅ Monitoring stack stopped!"
EOF

chmod +x monitoring/stop.sh

# README pour le monitoring
cat > monitoring/README.md << 'EOF'
# Huntaze Monitoring Stack

Stack de monitoring complet avec Prometheus, Grafana et Alertmanager.

## Quick Start

```bash
# Démarrer le stack
./start.sh

# Arrêter le stack
./stop.sh
```

## Services

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Node Exporter**: http://localhost:9100

## Configuration

### 1. API Metrics Endpoint

Ajoutez un endpoint `/api/metrics` à votre API qui expose les métriques Prometheus :

```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { sloMonitoring } from '@/lib/services/slo-monitoring-service';

export async function GET() {
  const metrics = generatePrometheusMetrics();
  
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}

function generatePrometheusMetrics(): string {
  const slis = sloMonitoring.getSLIs();
  const healthScore = sloMonitoring.getHealthScore();
  
  let metrics = '';
  
  // SLI metrics
  slis.forEach(sli => {
    metrics += `sli_current_value{name="${sli.name}"} ${sli.currentValue}\n`;
    metrics += `sli_target{name="${sli.name}"} ${sli.target}\n`;
    metrics += `sli_error_budget{name="${sli.name}"} ${sli.errorBudget}\n`;
  });
  
  // Health score
  metrics += `health_score_overall ${healthScore.overall}\n`;
  Object.entries(healthScore.breakdown).forEach(([key, value]) => {
    metrics += `health_score_${key} ${value}\n`;
  });
  
  return metrics;
}
```

### 2. Slack Alerts

1. Créer un webhook Slack : https://api.slack.com/messaging/webhooks
2. Modifier `alertmanager/alertmanager.yml` :
   ```yaml
   slack_configs:
     - api_url: 'YOUR_SLACK_WEBHOOK_URL'
   ```

### 3. Custom Dashboards

Ajouter des dashboards dans `grafana/dashboards/` au format JSON.

## SLO Monitoring

Le stack inclut des alertes pour les SLOs :

- **Availability**: 99.9% (alerte si < 99.5%)
- **Latency**: P95 < 500ms (alerte si > 500ms)
- **Error Rate**: < 0.1% (alerte si > 1%)
- **Throughput**: > 100 RPS (alerte si < 10 RPS)

## Troubleshooting

### Prometheus ne scrape pas l'API

1. Vérifier que l'API est accessible : `curl http://localhost:3000/api/metrics`
2. Vérifier la config Prometheus : `docker logs huntaze-prometheus`
3. Vérifier les targets : http://localhost:9090/targets

### Grafana ne se connecte pas à Prometheus

1. Vérifier les logs : `docker logs huntaze-grafana`
2. Tester la connexion : http://localhost:3001/datasources
3. Vérifier le réseau Docker : `docker network ls`

### Alertes ne fonctionnent pas

1. Vérifier Alertmanager : http://localhost:9093
2. Tester les règles : http://localhost:9090/rules
3. Vérifier les logs : `docker logs huntaze-alertmanager`

## Production Deployment

Pour la production, considérer :

1. **Sécurité** : HTTPS, authentification, firewall
2. **Persistance** : Volumes externes, backups
3. **Scaling** : Prometheus federation, Grafana clustering
4. **Monitoring** : Monitoring du monitoring (meta-monitoring)

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [SLO Best Practices](https://sre.google/sre-book/service-level-objectives/)
EOF

echo "✅ Monitoring stack setup completed!"
echo ""
echo "📁 Files created in ./monitoring/"
echo "   ├── docker-compose.yml"
echo "   ├── start.sh"
echo "   ├── stop.sh"
echo "   ├── README.md"
echo "   ├── prometheus/"
echo "   │   ├── prometheus.yml"
echo "   │   └── alerts.yml"
echo "   ├── grafana/"
echo "   │   ├── dashboards/"
echo "   │   └── provisioning/"
echo "   └── alertmanager/"
echo "       └── alertmanager.yml"
echo ""
echo "🚀 To start monitoring:"
echo "   cd monitoring && ./start.sh"
echo ""
echo "📊 Then access:"
echo "   Grafana:    http://localhost:3001"
echo "   Prometheus: http://localhost:9090"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Add /api/metrics endpoint to your API"
echo "   2. Configure Slack webhook for alerts"
echo "   3. Set environment variables for production"