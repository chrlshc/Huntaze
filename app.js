/*
  app.js – SaaS application skeleton
  - SaaSApp class: navigation, charts, sliders, modals, notifications
  - Centralized data (easy to replace with an API)
  - Listeners: page change, page title update, link generation, OnlyFans connection
*/

class SaaSApp {
  constructor() {
    // Key DOM refs
    this.el = {
      navLinks: document.querySelectorAll('.nav-link'),
      pages: document.querySelectorAll('.page'),
      pageTitle: document.getElementById('page-title'),
      notifyDemo: document.getElementById('notify-demo'),
      skeletonToggle: document.getElementById('btn-skeleton'),
      // Modal
      modalOverlay: document.getElementById('modal-overlay'),
      modalTitle: document.getElementById('modal-title'),
      modalBody: document.getElementById('modal-body'),
      modalClose: document.getElementById('modal-close'),
      modalCancel: document.getElementById('modal-cancel'),
      // Notifications
      notifications: document.getElementById('notifications'),
      // Pricing
      pricingSlider: document.getElementById('pricing-slider'),
      pricingValue: document.getElementById('pricing-value'),
      pricingAnnual: document.getElementById('pricing-annual'),
      // Funnels
      btnGenerateLink: document.getElementById('btn-generate-link'),
      instaHandle: document.getElementById('instagram-handle'),
      ofHandle: document.getElementById('onlyfans-handle'),
      // Inbox
      connectBtn: document.getElementById('connect-onlyfans'),
      connectStatus: document.getElementById('connect-status')
    };

    // Central data (replaceable via API later)
    this.data = {
      charts: {
        performance: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          values: [12, 14, 10, 15, 18, 21, 19, 23, 25, 22, 26, 30]
        },
        platforms: {
          labels: ['Instagram', 'TikTok', 'OnlyFans'],
          values: [46, 32, 22]
        },
        campaigns: {
          labels: ['C1', 'C2', 'C3', 'C4', 'C5'],
          values: [120, 180, 140, 200, 160]
        }
      },
      pricing: { monthly: 49, annualDiscountMonths: 2 }, // e.g. 2 months free
    };

    // Instances Chart.js
    this.charts = {
      performance: null,
      platforms: null,
      campaigns: null
    };

    // Init
    this.initNavigation();
    this.initModals();
    this.initNotifications();
    this.initPricingSlider();
    this.initFunnels();
    this.initInbox();
    this.initCharts();
    this.initSparklines();
    this.initToolbar();
    this.initMarketingFilters();
    // Aligner les graphiques sur la période par défaut (7 j)
    this.applyTimeframe(7);
  }

  /* ======================
   * Utils
   * ====================== */
  cssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  /* ======================
   * Navigation / Pages
   * ====================== */
  initNavigation() {
    const handle = (link) => {
      const target = link.getAttribute('data-target');
      if (!target) return;
      this.showPage(target);
      const text = link.textContent.trim();
      if (text) this.updateTitle(text);
      // Activer lien dans le menu si concerné
      this.el.navLinks.forEach((l) => l.classList.remove('active'));
      if (link.classList.contains('nav-link')) link.classList.add('active');
    };

    this.el.navLinks.forEach((link) => {
      link.addEventListener('click', (e) => { e.preventDefault(); handle(link); });
    });

    // Liens data-target hors menu (ex: fil d’ariane)
    document.querySelectorAll('[data-target]:not(.nav-link)').forEach((link) => {
      link.addEventListener('click', (e) => { e.preventDefault(); handle(link); });
    });
  }

  showPage(id) {
    this.el.pages.forEach((sec) => sec.classList.remove('active'));
    const page = document.getElementById(id);
    if (page) page.classList.add('active');
  }

  updateTitle(text) {
    if (this.el.pageTitle) this.el.pageTitle.textContent = text;
    const trail = document.querySelector('.breadcrumbs li[aria-current="page"] .crumb');
    if (trail) trail.textContent = text;
  }

  /* ======================
   * Modals
   * ====================== */
  initModals() {
    // Fermer le modal
    const close = () => this.hideModal();
    this.el.modalClose?.addEventListener('click', close);
    this.el.modalCancel?.addEventListener('click', close);
    this.el.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.el.modalOverlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  showModal(title, contentHTML) {
    if (!this.el.modalOverlay) return;
    this.el.modalTitle.textContent = title;
    this.el.modalBody.innerHTML = contentHTML;
    this.el.modalOverlay.classList.add('show');
    this.el.modalOverlay.setAttribute('aria-hidden', 'false');
  }

  hideModal() {
    if (!this.el.modalOverlay) return;
    this.el.modalOverlay.classList.remove('show');
    this.el.modalOverlay.setAttribute('aria-hidden', 'true');
  }

  /* ======================
   * Notifications
   * ====================== */
  initNotifications() {
    this.el.notifyDemo?.addEventListener('click', () => {
      this.notify('success', 'This is a demo notification.');
    });
    this.el.skeletonToggle?.addEventListener('click', () => {
      document.body.classList.toggle('is-skeleton');
    });
  }

  notify(type = 'info', message = '') {
    if (!this.el.notifications) return;
    const container = this.el.notifications;
    const item = document.createElement('div');
    item.className = `notification ${type}`;

    const icon = document.createElement('i');
    icon.setAttribute('aria-hidden', 'true');
    icon.className = {
      success: 'fa-solid fa-circle-check',
      warning: 'fa-solid fa-triangle-exclamation',
      error: 'fa-solid fa-circle-exclamation',
      info: 'fa-solid fa-circle-info'
    }[type] || 'fa-solid fa-circle-info';

    const text = document.createElement('div');
    text.textContent = message;

    const close = document.createElement('button');
    close.className = 'close';
    close.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    close.addEventListener('click', () => item.remove());

    item.append(icon, text, close);
    container.appendChild(item);

    window.setTimeout(() => {
      item?.remove();
    }, 4200);
  }

  /* ======================
   * Pricing Slider
   * ====================== */
  initPricingSlider() {
    const s = this.el.pricingSlider;
    const v = this.el.pricingValue;
    const a = this.el.pricingAnnual;
    if (!s || !v || !a) return;

    const update = (value) => {
      v.textContent = String(value);
      // Annual with 2 months off
      const annual = Math.round((value * (12 - this.data.pricing.annualDiscountMonths)));
      a.textContent = String(annual);
    };
    update(Number(s.value || this.data.pricing.monthly));
    s.addEventListener('input', (e) => update(Number(e.target.value)));
  }

  /* ======================
   * Funnels
   * ====================== */
  initFunnels() {
    const btn = this.el.btnGenerateLink;
    if (!btn) return;
    btn.addEventListener('click', () => {
      const ig = (this.el.instaHandle?.value || '').replace(/^@/, '');
      const of = (this.el.ofHandle?.value || '').replace(/^@/, '');

      // Simple token (placeholder)
      const token = Math.random().toString(36).slice(2, 10);
      const date = new Date();
      const campaign = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;

      const url = new URL('https://huntaze.link/to/onlyfans');
      if (ig) url.searchParams.set('ig', ig);
      if (of) url.searchParams.set('of', of);
      url.searchParams.set('utm_source', 'tiktok');
      url.searchParams.set('utm_medium', 'funnel');
      url.searchParams.set('utm_campaign', campaign);
      url.searchParams.set('token', token);

      const content = `
        <p>Your tracked link has been generated:</p>
        <div style="display:grid;gap:8px;margin-top:8px">
          <code style="white-space: break-spaces; word-break: break-all; background:#f3f4f6; padding:8px; border-radius:6px; border:1px solid var(--color-border);">${url.toString()}</code>
          <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button id="modal-copy" class="btn"><i class="fa-solid fa-clipboard"></i> Copy</button>
          </div>
        </div>
      `;
      this.showModal('Tracked link', content);

      // Gestion du bouton Copier
      setTimeout(() => {
        const copyBtn = document.getElementById('modal-copy');
        copyBtn?.addEventListener('click', async () => {
          try {
            await navigator.clipboard?.writeText(url.toString());
            this.notify('success', 'Link copied to clipboard.');
          } catch (e) {
            this.notify('error', 'Could not copy the link.');
          }
        });
      });
    });
  }

  /* ======================
   * Inbox / OnlyFans connection
   * ====================== */
  initInbox() {
    const btn = this.el.connectBtn;
    const status = this.el.connectStatus;
    if (!btn || !status) return;

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting…';
      status.textContent = 'Connecting…';

      // Simulate a connection
      await new Promise((res) => setTimeout(res, 1200));

      btn.innerHTML = '<i class="fa-solid fa-plug"></i> Connected';
      status.textContent = 'Connected';
      status.classList.remove('muted');
      status.style.color = this.cssVar('--color-success');
      this.notify('success', 'Your account is connected.');
    });
  }

  /* ======================
   * Charts (Chart.js)
   * ====================== */
  initCharts() {
    // Récupération des couleurs depuis le CSS
    const colorAccent = this.cssVar('--color-accent') || '#2563eb';
    const colorSuccess = this.cssVar('--color-success') || '#16a34a';
    const colorWarning = this.cssVar('--color-warning') || '#f59e0b';
    const colorError = this.cssVar('--color-error') || '#dc2626';
    const gridColor = '#e5e7eb';
    const textColor = '#111827';

    // Line – Monthly performance
    const perfCanvas = document.getElementById('chart-performance');
    if (perfCanvas && window.Chart) {
      this.charts.performance = new Chart(perfCanvas, {
        type: 'line',
        data: {
          labels: this.data.charts.performance.labels,
          datasets: [
            {
              label: 'Performance',
              data: this.data.charts.performance.values,
              borderColor: colorAccent,
              backgroundColor: colorAccent + '22',
              borderWidth: 2,
              tension: 0.35,
              fill: true,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor } },
            y: { grid: { color: gridColor } }
          }
        }
      });
    }

    // Doughnut – Platform distribution
    const platCanvas = document.getElementById('chart-platforms');
    if (platCanvas && window.Chart) {
      this.charts.platforms = new Chart(platCanvas, {
        type: 'doughnut',
        data: {
          labels: this.data.charts.platforms.labels,
          datasets: [
            {
              data: this.data.charts.platforms.values,
              backgroundColor: [colorAccent, colorSuccess, colorWarning],
              borderColor: '#ffffff',
              borderWidth: 2
            }
          ]
        },
        options: {
          plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
          cutout: '60%'
        }
      });
    }

    // Bar – Campaign performance (Marketing Q3)
    const barCanvas = document.getElementById('chart-campaigns');
    if (barCanvas && window.Chart) {
      this.charts.campaigns = new Chart(barCanvas, {
        type: 'bar',
        data: {
          labels: this.data.charts.campaigns.labels,
          datasets: [
            {
              label: 'Conversions',
              data: this.data.charts.campaigns.values,
              backgroundColor: colorAccent + 'bb',
              borderColor: colorAccent,
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: gridColor } }
          }
        }
      });
    }
  }

  /* ======================
   * KPI Sparklines
   * ====================== */
  initSparklines() {
    const accent = this.cssVar('--color-accent') || '#2563eb';
    const muted = '#9ca3af';
    const makeSpark = (id, data) => {
      const el = document.getElementById(id);
      if (!el || !window.Chart) return null;
      return new Chart(el, {
        type: 'line',
        data: { labels: data.map((_, i) => i + 1), datasets: [{ data, borderColor: accent, backgroundColor: accent + '22', borderWidth: 2, tension: 0.35, fill: true, pointRadius: 0 }] },
        options: { plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } }, elements: { line: { borderJoinStyle: 'round' } } }
      });
    };
    this.charts.sparkCreators = makeSpark('spark-creators', [3,4,3,5,6,7,8,7]);
    this.charts.sparkMessages = makeSpark('spark-messages', [10,9,12,11,14,16,15,18]);
    this.charts.sparkConv = makeSpark('spark-conv', [4.2,4.4,4.3,4.8,4.7,4.6,4.7,4.7]);
    this.charts.sparkRevenue = makeSpark('spark-revenue', [40,42,41,44,47,48,52,58]);
  }

  /* ======================
   * Toolbar (timeframe)
   * ====================== */
  initToolbar() {
    const radios = document.querySelectorAll('input[name="timeframe"]');
    radios.forEach(r => r.addEventListener('change', () => this.applyTimeframe(Number(r.value))));
  }

  applyTimeframe(days) {
    // Generate synthetic data for the demo
    const gen = (n, base = 20, noise = 8) => Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i/3)*noise + (Math.random()*noise*0.5)));
    const labels = Array.from({ length: days }, (_, i) => `D-${days-1-i}`);

    if (this.charts.performance) {
      this.charts.performance.data.labels = labels;
      this.charts.performance.data.datasets[0].data = gen(days, 20, 10);
      this.charts.performance.update();
    }
    if (this.charts.campaigns) {
      this.charts.campaigns.data.labels = ['C1','C2','C3','C4','C5'];
      this.charts.campaigns.data.datasets[0].data = gen(5, 150, 60);
      this.charts.campaigns.update();
    }
    // Pas de mise à jour nécessaire pour le donut
  }

  /* ======================
   * Marketing filters (segmented)
   * ====================== */
  initMarketingFilters() {
    const scopes = ['q2', 'q3'];
    scopes.forEach(scope => {
      const group = document.querySelector(`.segmented[data-scope="${scope}"]`);
      if (!group) return;
      group.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener('change', () => {
          const value = input.value; // all | active | planned | in-progress
          const page = document.getElementById(`page-marketing-${scope}`);
          const cards = page?.querySelectorAll('.feature-card') || [];
          cards.forEach(card => {
            const status = card.getAttribute('data-status');
            card.style.display = (value === 'all' || status === value) ? '' : 'none';
          });
        });
      });
    });
  }
}

// Bootstrap de l’application
window.addEventListener('DOMContentLoaded', () => {
  new SaaSApp();
});
