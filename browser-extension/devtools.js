/**
 * Script principal pour le panel DevTools d'hydratation
 */

class HydrationDevtoolsPanel {
  constructor() {
    this.components = new Map();
    this.currentFilter = 'all';
    this.port = null;
    
    this.initializeUI();
    this.connectToBackground();
    this.startPolling();
  }

  /**
   * Initialise l'interface utilisateur
   */
  initializeUI() {
    // Boutons de la toolbar
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.refreshData();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearData();
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettings();
    });

    // Onglets de filtrage
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.setFilter(e.target.dataset.filter);
      });
    });
  }

  /**
   * Se connecte au script de background
   */
  connectToBackground() {
    this.port = chrome.runtime.connect({ name: 'devtools' });
    
    this.port.onMessage.addListener((message) => {
      switch (message.type) {
        case 'hydration-data':
          this.updateData(message.data);
          break;
        case 'component-update':
          this.updateComponent(message.component);
          break;
      }
    });

    // Demander les données initiales
    this.port.postMessage({ type: 'get-hydration-data' });
  }

  /**
   * Démarre le polling pour les mises à jour
   */
  startPolling() {
    setInterval(() => {
      if (this.port) {
        this.port.postMessage({ type: 'get-hydration-data' });
      }
    }, 1000);
  }

  /**
   * Met à jour les données d'hydratation
   */
  updateData(data) {
    if (!data) return;

    // Mettre à jour les composants
    if (data.components) {
      data.components.forEach(component => {
        this.components.set(component.hydrationId, component);
      });
    }

    this.updateStats();
    this.updateComponentList();
  }

  /**
   * Met à jour un composant spécifique
   */
  updateComponent(component) {
    this.components.set(component.hydrationId, component);
    this.updateStats();
    this.updateComponentList();
  }

  /**
   * Met à jour les statistiques
   */
  updateStats() {
    const components = Array.from(this.components.values());
    
    const successCount = components.filter(c => c.status === 'success').length;
    const errorCount = components.filter(c => c.status === 'error').length;
    const pendingCount = components.filter(c => c.status === 'pending').length;
    
    const durations = components.filter(c => c.duration).map(c => c.duration);
    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;

    document.getElementById('successCount').textContent = successCount;
    document.getElementById('errorCount').textContent = errorCount;
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('avgDuration').textContent = `${avgDuration.toFixed(1)}ms`;
  }

  /**
   * Met à jour la liste des composants
   */
  updateComponentList() {
    const container = document.getElementById('componentList');
    const components = Array.from(this.components.values());
    
    // Filtrer les composants
    const filteredComponents = this.currentFilter === 'all' 
      ? components 
      : components.filter(c => c.status === this.currentFilter);

    if (filteredComponents.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div>Aucun composant ${this.currentFilter === 'all' ? '' : this.currentFilter}</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredComponents
      .sort((a, b) => b.startTime - a.startTime)
      .map(component => this.createComponentElement(component))
      .join('');

    // Ajouter les event listeners
    container.querySelectorAll('.component-item').forEach(item => {
      item.addEventListener('click', () => {
        const hydrationId = item.dataset.hydrationId;
        this.highlightComponent(hydrationId);
      });
    });
  }

  /**
   * Crée l'élément HTML pour un composant
   */
  createComponentElement(component) {
    const duration = component.duration ? `${component.duration.toFixed(2)}ms` : 'En cours...';
    const timestamp = new Date(component.startTime).toLocaleTimeString();
    
    return `
      <div class="component-item ${component.status}" data-hydration-id="${component.hydrationId}">
        <div class="component-name">${component.componentName}</div>
        <div class="component-details">
          <div>Status: ${component.status}</div>
          <div>Durée: ${duration}</div>
          <div>Heure: ${timestamp}</div>
          <div>ID: ${component.hydrationId}</div>
        </div>
        ${component.errors.length > 0 ? `
          <div class="component-errors">
            <strong>Erreurs:</strong><br>
            ${component.errors.join('<br>')}
          </div>
        ` : ''}
        ${component.suggestions.length > 0 ? `
          <div class="component-suggestions">
            <strong>Suggestions:</strong><br>
            ${component.suggestions.join('<br>')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Définit le filtre actuel
   */
  setFilter(filter) {
    this.currentFilter = filter;
    
    // Mettre à jour l'UI des onglets
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    
    this.updateComponentList();
  }

  /**
   * Met en évidence un composant dans la page
   */
  highlightComponent(hydrationId) {
    if (this.port) {
      this.port.postMessage({
        type: 'highlight-component',
        hydrationId: hydrationId
      });
    }
  }

  /**
   * Actualise les données
   */
  refreshData() {
    if (this.port) {
      this.port.postMessage({ type: 'refresh-data' });
    }
    
    // Vider les données locales
    this.components.clear();
    this.updateStats();
    this.updateComponentList();
    
    // Redemander les données
    setTimeout(() => {
      if (this.port) {
        this.port.postMessage({ type: 'get-hydration-data' });
      }
    }, 100);
  }

  /**
   * Efface toutes les données
   */
  clearData() {
    if (this.port) {
      this.port.postMessage({ type: 'clear-data' });
    }
    
    this.components.clear();
    this.updateStats();
    this.updateComponentList();
  }

  /**
   * Exporte les données
   */
  exportData() {
    const components = Array.from(this.components.values());
    const data = {
      timestamp: new Date().toISOString(),
      components: components,
      stats: {
        total: components.length,
        success: components.filter(c => c.status === 'success').length,
        error: components.filter(c => c.status === 'error').length,
        pending: components.filter(c => c.status === 'pending').length
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydration-report-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Ouvre les paramètres
   */
  openSettings() {
    // Pour l'instant, juste un alert
    alert('Paramètres à venir dans une future version');
  }
}

// Initialiser le panel quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new HydrationDevtoolsPanel();
  });
} else {
  new HydrationDevtoolsPanel();
}

// Créer le panel DevTools
chrome.devtools.panels.create(
  'Hydration',
  'icons/icon32.png',
  'devtools.html',
  (panel) => {
    console.log('Hydration DevTools panel created');
  }
);