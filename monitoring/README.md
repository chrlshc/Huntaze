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
