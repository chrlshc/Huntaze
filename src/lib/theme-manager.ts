// Robust theme management with persistence and synchronization
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

class ThemeManager {
  private listeners: Set<(theme: ResolvedTheme) => void> = new Set();
  private currentTheme: Theme = 'system';
  private resolvedTheme: ResolvedTheme = 'dark';

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Load saved preference
    this.currentTheme = this.getSavedTheme();
    this.resolvedTheme = this.resolveTheme(this.currentTheme);
    
    // Apply theme
    this.applyTheme(this.resolvedTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'system') {
        this.resolvedTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(this.resolvedTheme);
        this.notifyListeners();
      }
    });
    
    // Listen for cross-tab synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme' && e.newValue) {
        this.currentTheme = e.newValue as Theme;
        this.resolvedTheme = this.resolveTheme(this.currentTheme);
        this.applyTheme(this.resolvedTheme);
        this.notifyListeners();
      }
    });
  }

  private getSavedTheme(): Theme {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // Check cookie fallback
      const match = document.cookie.match(/(?:^|;\s*)theme=([^;]*)/);
      if (match) {
        const theme = match[1];
        if (theme === 'light' || theme === 'dark' || theme === 'system') {
          return theme;
        }
      }
    }
    return 'system';
  }

  private saveTheme(theme: Theme) {
    try {
      localStorage.setItem('theme', theme);
      // Trigger cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'theme',
        newValue: theme,
        url: window.location.href,
        storageArea: localStorage
      }));
    } catch {
      // Cookie fallback for private browsing
      document.cookie = `theme=${theme};max-age=31536000;path=/;SameSite=Strict`;
    }
  }

  private resolveTheme(theme: Theme): ResolvedTheme {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  private applyTheme(theme: ResolvedTheme) {
    const html = document.documentElement;
    
    // Add transition class to prevent jarring changes
    html.classList.add('theme-transitioning');
    
    // Remove existing theme classes
    html.classList.remove('theme-light', 'theme-dark', 'dark-mode');
    
    // Apply new theme
    html.classList.add(`theme-${theme}`);
    if (theme === 'dark') {
      html.classList.add('dark-mode');
    }
    
    // Update meta theme-color for mobile status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1e1e1e' : '#ffffff');
    }
    
    // Remove transition class after animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        html.classList.remove('theme-transitioning');
      });
    });
  }

  public setTheme(theme: Theme) {
    this.currentTheme = theme;
    this.resolvedTheme = this.resolveTheme(theme);
    this.saveTheme(theme);
    this.applyTheme(this.resolvedTheme);
    this.notifyListeners();
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }

  public getResolvedTheme(): ResolvedTheme {
    return this.resolvedTheme;
  }

  public subscribe(listener: (theme: ResolvedTheme) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.resolvedTheme));
  }
}

// Singleton instance
export const themeManager = new ThemeManager();