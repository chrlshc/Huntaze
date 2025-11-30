/**
 * Outils de développement pour le débogage d'hydratation
 * 
 * Ce module fournit des outils avancés pour aider les développeurs
 * à déboguer et résoudre les problèmes d'hydratation React.
 */

import { hydrationDebugger } from '@/lib/utils/hydrationDebugger';
import { hydrationMonitoringService } from '@/lib/services/hydrationMonitoringService';
import { Button } from "@/components/ui/button";

export interface HydrationDevtoolsConfig {
  enabled: boolean;
  showVisualIndicators: boolean;
  logToConsole: boolean;
  highlightMismatches: boolean;
  trackPerformance: boolean;
  autoSuggestFixes: boolean;
}

export interface ComponentHydrationInfo {
  componentName: string;
  hydrationId: string;
  status: 'pending' | 'success' | 'error' | 'recovered';
  startTime: number;
  endTime?: number;
  duration?: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  domNode?: HTMLElement;
}

export interface HydrationMismatch {
  type: 'text' | 'attribute' | 'structure' | 'style';
  path: string;
  serverValue: any;
  clientValue: any;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export class HydrationDevtools {
  private config: HydrationDevtoolsConfig;
  private components: Map<string, ComponentHydrationInfo> = new Map();
  private mismatches: HydrationMismatch[] = [];
  private observers: MutationObserver[] = [];
  private performanceEntries: PerformanceEntry[] = [];

  constructor(config: Partial<HydrationDevtoolsConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      showVisualIndicators: true,
      logToConsole: true,
      highlightMismatches: true,
      trackPerformance: true,
      autoSuggestFixes: true,
      ...config
    };

    if (this.config.enabled && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialise les outils de développement
   */
  private initialize(): void {
    // Ajouter les styles CSS pour les indicateurs visuels
    this.injectStyles();

    // Configurer les observateurs DOM
    this.setupDOMObservers();

    // Ajouter les raccourcis clavier
    this.setupKeyboardShortcuts();

    // Exposer l'API globale pour la console
    this.exposeGlobalAPI();

    // Démarrer le monitoring de performance
    if (this.config.trackPerformance) {
      this.startPerformanceMonitoring();
    }

    console.log('🔧 Hydration Devtools initialized');
  }

  /**
   * Injecte les styles CSS pour les indicateurs visuels
   */
  private injectStyles(): void {
    const styles = `
      .hydration-devtools-indicator {
        position: relative;
      }
      
      .hydration-devtools-indicator::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid transparent;
        border-radius: 4px;
        pointer-events: none;
        z-index: 10000;
      }
      
      .hydration-devtools-pending::before {
        border-color: var(--accent-warning);
        animation: hydration-pulse 1s infinite;
      }
      
      .hydration-devtools-success::before {
        border-color: var(--accent-success);
      }
      
      .hydration-devtools-error::before {
        border-color: var(--accent-error);
        animation: hydration-error-pulse 0.5s infinite;
      }
      
      .hydration-devtools-recovered::before {
        border-color: #8b5cf6;
      }
      
      .hydration-devtools-mismatch {
        background-color: rgba(239, 68, 68, 0.1) !important;
        outline: 2px dashed var(--accent-error) !important;
      }
      
      .hydration-devtools-tooltip {
        position: absolute;
        background: var(--text-primary);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: var(--text-xs);
        font-family: var(--font-mono);
        z-index: 10001;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        pointer-events: none;
      }
      
      @keyframes hydration-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes hydration-error-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      
      .hydration-devtools-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        max-height: 500px;
        background: white;
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 10002;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      }
      
      .hydration-devtools-panel-header {
        background: var(--bg-glass);
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-subtle);
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .hydration-devtools-panel-content {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .hydration-devtools-component {
        margin-bottom: 12px;
        padding: 8px;
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        font-size: var(--text-xs);
      }
      
      .hydration-devtools-component.success {
        border-color: var(--accent-success);
        background-color: rgba(16, 185, 129, 0.1);
      }
      
      .hydration-devtools-component.error {
        border-color: var(--accent-error);
        background-color: rgba(239, 68, 68, 0.1);
      }
      
      .hydration-devtools-component.pending {
        border-color: var(--accent-warning);
        background-color: rgba(245, 158, 11, 0.1);
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Configure les observateurs DOM pour détecter les changements
   */
  private setupDOMObservers(): void {
    // Observer les mutations DOM pour détecter les mismatches
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.checkForMismatches(mutation.target as Element);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });

    this.observers.push(observer);
  }

  /**
   * Configure les raccourcis clavier
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + H : Toggle panel
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        this.togglePanel();
      }

      // Ctrl/Cmd + Shift + R : Refresh hydration info
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        this.refreshHydrationInfo();
      }

      // Ctrl/Cmd + Shift + C : Clear all indicators
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        this.clearAllIndicators();
      }
    });
  }

  /**
   * Expose l'API globale pour la console
   */
  private exposeGlobalAPI(): void {
    (window as any).__HYDRATION_DEVTOOLS__ = {
      getComponents: () => Array.from(this.components.values()),
      getMismatches: () => this.mismatches,
      getPerformanceData: () => this.performanceEntries,
      highlightComponent: (id: string) => this.highlightComponent(id),
      showPanel: () => this.showPanel(),
      hidePanel: () => this.hidePanel(),
      generateReport: () => this.generateReport(),
      config: this.config
    };

    console.log('🔧 Hydration Devtools API available at window.__HYDRATION_DEVTOOLS__');
  }

  /**
   * Démarre le monitoring de performance
   */
  private startPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('hydration') || entry.name.includes('react')) {
            this.performanceEntries.push(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'mark'] });
    }
  }

  /**
   * Enregistre un composant pour le monitoring
   */
  registerComponent(
    componentName: string,
    hydrationId: string,
    domNode?: HTMLElement
  ): void {
    if (!this.config.enabled) return;

    const info: ComponentHydrationInfo = {
      componentName,
      hydrationId,
      status: 'pending',
      startTime: performance.now(),
      errors: [],
      warnings: [],
      suggestions: [],
      domNode
    };

    this.components.set(hydrationId, info);

    if (this.config.showVisualIndicators && domNode) {
      this.addVisualIndicator(domNode, 'pending');
    }

    if (this.config.logToConsole) {
      console.log(`🔄 Hydration started: ${componentName} (${hydrationId})`);
    }
  }

  /**
   * Marque un composant comme hydraté avec succès
   */
  markComponentSuccess(hydrationId: string): void {
    if (!this.config.enabled) return;

    const info = this.components.get(hydrationId);
    if (!info) return;

    info.status = 'success';
    info.endTime = performance.now();
    info.duration = info.endTime - info.startTime;

    if (this.config.showVisualIndicators && info.domNode) {
      this.addVisualIndicator(info.domNode, 'success');
    }

    if (this.config.logToConsole) {
      console.log(`✅ Hydration success: ${info.componentName} (${info.duration?.toFixed(2)}ms)`);
    }

    // Auto-remove success indicators after 3 seconds
    setTimeout(() => {
      if (info.domNode) {
        this.removeVisualIndicator(info.domNode);
      }
    }, 3000);
  }

  /**
   * Marque un composant comme ayant une erreur d'hydratation
   */
  markComponentError(hydrationId: string, error: string, suggestion?: string): void {
    if (!this.config.enabled) return;

    const info = this.components.get(hydrationId);
    if (!info) return;

    info.status = 'error';
    info.endTime = performance.now();
    info.duration = info.endTime - info.startTime;
    info.errors.push(error);

    if (suggestion) {
      info.suggestions.push(suggestion);
    }

    if (this.config.showVisualIndicators && info.domNode) {
      this.addVisualIndicator(info.domNode, 'error');
      this.addTooltip(info.domNode, error, suggestion);
    }

    if (this.config.logToConsole) {
      console.error(`❌ Hydration error: ${info.componentName}`, error);
      if (suggestion) {
        console.log(`💡 Suggestion: ${suggestion}`);
      }
    }

    // Auto-suggest fixes
    if (this.config.autoSuggestFixes) {
      this.suggestFix(info, error);
    }
  }

  /**
   * Marque un composant comme récupéré après une erreur
   */
  markComponentRecovered(hydrationId: string): void {
    if (!this.config.enabled) return;

    const info = this.components.get(hydrationId);
    if (!info) return;

    info.status = 'recovered';

    if (this.config.showVisualIndicators && info.domNode) {
      this.addVisualIndicator(info.domNode, 'recovered');
    }

    if (this.config.logToConsole) {
      console.log(`🔄 Hydration recovered: ${info.componentName}`);
    }
  }

  /**
   * Ajoute un indicateur visuel à un élément DOM
   */
  private addVisualIndicator(element: HTMLElement, status: string): void {
    element.classList.remove(
      'hydration-devtools-pending',
      'hydration-devtools-success',
      'hydration-devtools-error',
      'hydration-devtools-recovered'
    );
    
    element.classList.add('hydration-devtools-indicator', `hydration-devtools-${status}`);
  }

  /**
   * Supprime les indicateurs visuels d'un élément
   */
  private removeVisualIndicator(element: HTMLElement): void {
    element.classList.remove(
      'hydration-devtools-indicator',
      'hydration-devtools-pending',
      'hydration-devtools-success',
      'hydration-devtools-error',
      'hydration-devtools-recovered'
    );
  }

  /**
   * Ajoute une tooltip avec des informations détaillées
   */
  private addTooltip(element: HTMLElement, error: string, suggestion?: string): void {
    const tooltip = document.createElement('div');
    tooltip.className = 'hydration-devtools-tooltip';
    tooltip.innerHTML = `
      <div><strong>Hydration Error:</strong></div>
      <div>${error}</div>
      ${suggestion ? `<div><strong>Suggestion:</strong></div><div>${suggestion}</div>` : ''}
    `;

    element.addEventListener('mouseenter', () => {
      document.body.appendChild(tooltip);
      
      const rect = element.getBoundingClientRect();
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom + 5}px`;
    });

    element.addEventListener('mouseleave', () => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
  }

  /**
   * Vérifie les mismatches dans un élément
   */
  private checkForMismatches(element: Element): void {
    if (!this.config.highlightMismatches) return;

    // Vérifier les mismatches de texte
    if (element.nodeType === Node.TEXT_NODE) {
      const textContent = element.textContent || '';
      
      // Détecter les patterns suspects
      if (textContent.includes('NaN') || textContent.includes('undefined')) {
        this.addMismatch({
          type: 'text',
          path: this.getElementPath(element),
          serverValue: 'expected value',
          clientValue: textContent,
          severity: 'high',
          suggestion: 'Vérifiez que les données sont correctement initialisées côté serveur'
        });
      }
    }

    // Vérifier les mismatches d'attributs
    if (element instanceof HTMLElement) {
      const suspiciousAttributes = ['style', 'class', 'data-*'];
      
      suspiciousAttributes.forEach(attr => {
        if (attr === 'style' && element.style.length > 0) {
          // Vérifier les styles dynamiques
          const computedStyle = window.getComputedStyle(element);
          if (computedStyle.display === 'none' && !element.hasAttribute('hidden')) {
            this.addMismatch({
              type: 'style',
              path: this.getElementPath(element),
              serverValue: 'visible',
              clientValue: 'hidden',
              severity: 'medium',
              suggestion: 'Utilisez SafeBrowserAPI pour les styles dépendants du client'
            });
          }
        }
      });
    }
  }

  /**
   * Ajoute un mismatch détecté
   */
  private addMismatch(mismatch: HydrationMismatch): void {
    this.mismatches.push(mismatch);

    if (this.config.logToConsole) {
      console.warn('🔍 Hydration mismatch detected:', mismatch);
    }
  }

  /**
   * Obtient le chemin CSS d'un élément
   */
  private getElementPath(element: Node): string {
    const path: string[] = [];
    let current = element;

    while (current && current !== document.body) {
      if (current instanceof Element) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
          selector += `#${current.id}`;
        } else if (current.className) {
          selector += `.${current.className.split(' ').join('.')}`;
        }
        
        path.unshift(selector);
      }
      current = current.parentNode!;
    }

    return path.join(' > ');
  }

  /**
   * Suggère une correction automatique
   */
  private suggestFix(info: ComponentHydrationInfo, error: string): void {
    let suggestion = '';

    if (error.includes('Text content does not match')) {
      suggestion = 'Utilisez SafeDateRenderer pour les dates ou SafeRandomContent pour le contenu aléatoire';
    } else if (error.includes('window') || error.includes('document')) {
      suggestion = 'Utilisez SafeBrowserAPI ou SafeWindowAccess pour accéder aux APIs du navigateur';
    } else if (error.includes('style') || error.includes('className')) {
      suggestion = 'Utilisez HydrationSafeWrapper avec suppressHydrationWarning pour les styles dynamiques';
    } else {
      suggestion = 'Consultez la documentation des composants hydration-safe';
    }

    info.suggestions.push(suggestion);

    if (this.config.logToConsole) {
      console.log(`💡 Auto-suggestion for ${info.componentName}: ${suggestion}`);
    }
  }

  /**
   * Met en évidence un composant spécifique
   */
  private highlightComponent(hydrationId: string): void {
    const info = this.components.get(hydrationId);
    if (!info || !info.domNode) return;

    info.domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Flash effect
    const originalBorder = info.domNode.style.border;
    info.domNode.style.border = '3px solid var(--accent-info)';
    
    setTimeout(() => {
      info.domNode!.style.border = originalBorder;
    }, 2000);
  }

  /**
   * Toggle le panel de développement
   */
  private togglePanel(): void {
    const existingPanel = document.querySelector('.hydration-devtools-panel');
    if (existingPanel) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  /**
   * Affiche le panel de développement
   */
  private showPanel(): void {
    const panel = this.createPanel();
    document.body.appendChild(panel);
  }

  /**
   * Cache le panel de développement
   */
  private hidePanel(): void {
    const panel = document.querySelector('.hydration-devtools-panel');
    if (panel) {
      panel.remove();
    }
  }

  /**
   * Crée le panel de développement
   */
  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'hydration-devtools-panel';

    const header = document.createElement('div');
    header.className = 'hydration-devtools-panel-header';
    header.innerHTML = `
      <span>🔧 Hydration Devtools</span>
      <Button variant="primary">×</Button>
    `;

    const content = document.createElement('div');
    content.className = 'hydration-devtools-panel-content';

    // Statistiques générales
    const stats = document.createElement('div');
    stats.innerHTML = `
      <h4>Statistiques</h4>
      <p>Composants: ${this.components.size}</p>
      <p>Erreurs: ${Array.from(this.components.values()).filter(c => c.status === 'error').length}</p>
      <p>Succès: ${Array.from(this.components.values()).filter(c => c.status === 'success').length}</p>
      <p>Mismatches: ${this.mismatches.length}</p>
    `;

    // Liste des composants
    const componentsList = document.createElement('div');
    componentsList.innerHTML = '<h4>Composants</h4>';

    Array.from(this.components.values()).forEach(info => {
      const componentDiv = document.createElement('div');
      componentDiv.className = `hydration-devtools-component ${info.status}`;
      componentDiv.innerHTML = `
        <div><strong>${info.componentName}</strong></div>
        <div>Status: ${info.status}</div>
        ${info.duration ? `<div>Duration: ${info.duration.toFixed(2)}ms</div>` : ''}
        ${info.errors.length > 0 ? `<div>Errors: ${info.errors.join(', ')}</div>` : ''}
        ${info.suggestions.length > 0 ? `<div>Suggestions: ${info.suggestions.join(', ')}</div>` : ''}
      `;
      
      if (info.domNode) {
        componentDiv.style.cursor = 'pointer';
        componentDiv.onclick = () => this.highlightComponent(info.hydrationId);
      }
      
      componentsList.appendChild(componentDiv);
    });

    content.appendChild(stats);
    content.appendChild(componentsList);
    panel.appendChild(header);
    panel.appendChild(content);

    return panel;
  }

  /**
   * Rafraîchit les informations d'hydratation
   */
  private refreshHydrationInfo(): void {
    this.components.clear();
    this.mismatches = [];
    this.clearAllIndicators();
    
    if (this.config.logToConsole) {
      console.log('🔄 Hydration info refreshed');
    }
  }

  /**
   * Supprime tous les indicateurs visuels
   */
  private clearAllIndicators(): void {
    document.querySelectorAll('.hydration-devtools-indicator').forEach(element => {
      this.removeVisualIndicator(element as HTMLElement);
    });

    document.querySelectorAll('.hydration-devtools-tooltip').forEach(tooltip => {
      tooltip.remove();
    });
  }

  /**
   * Génère un rapport détaillé
   */
  generateReport(): string {
    const components = Array.from(this.components.values());
    const errorComponents = components.filter(c => c.status === 'error');
    const successComponents = components.filter(c => c.status === 'success');
    
    const avgDuration = components
      .filter(c => c.duration)
      .reduce((sum, c) => sum + c.duration!, 0) / components.length;

    return `
# Rapport d'Hydratation - ${new Date().toLocaleString()}

## Résumé
- **Composants totaux**: ${components.length}
- **Succès**: ${successComponents.length}
- **Erreurs**: ${errorComponents.length}
- **Durée moyenne**: ${avgDuration.toFixed(2)}ms
- **Mismatches détectés**: ${this.mismatches.length}

## Composants avec erreurs
${errorComponents.map(c => `
### ${c.componentName}
- **Erreurs**: ${c.errors.join(', ')}
- **Suggestions**: ${c.suggestions.join(', ')}
- **Durée**: ${c.duration?.toFixed(2)}ms
`).join('\n')}

## Mismatches détectés
${this.mismatches.map(m => `
### ${m.type.toUpperCase()} - ${m.severity}
- **Chemin**: ${m.path}
- **Serveur**: ${m.serverValue}
- **Client**: ${m.clientValue}
- **Suggestion**: ${m.suggestion}
`).join('\n')}

## Recommandations
${this.generateRecommendations()}
    `.trim();
  }

  /**
   * Génère des recommandations basées sur les données collectées
   */
  private generateRecommendations(): string {
    const recommendations: string[] = [];
    
    if (this.mismatches.length > 0) {
      recommendations.push('- Réduire les mismatches en utilisant les composants hydration-safe');
    }
    
    const errorComponents = Array.from(this.components.values()).filter(c => c.status === 'error');
    if (errorComponents.length > 0) {
      recommendations.push('- Corriger les erreurs d\'hydratation identifiées');
    }
    
    const slowComponents = Array.from(this.components.values()).filter(c => c.duration && c.duration > 100);
    if (slowComponents.length > 0) {
      recommendations.push('- Optimiser les composants avec une hydratation lente (>100ms)');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- Excellent travail ! Aucun problème d\'hydratation détecté');
    }
    
    return recommendations.join('\n');
  }

  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearAllIndicators();
    this.hidePanel();
    
    delete (window as any).__HYDRATION_DEVTOOLS__;
  }
}

// Instance singleton pour le développement
export const hydrationDevtools = new HydrationDevtools();