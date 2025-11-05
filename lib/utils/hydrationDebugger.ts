'use client';

import { hydrationErrorLogger } from '@/lib/services/hydrationErrorLogger';

export interface HydrationMismatch {
  id: string;
  timestamp: Date;
  serverHTML: string;
  clientHTML: string;
  componentName?: string;
  differences: HtmlDifference[];
  severity: 'low' | 'medium' | 'high';
}

export interface HtmlDifference {
  type: 'text' | 'attribute' | 'structure' | 'style';
  path: string;
  serverValue: string;
  clientValue: string;
  description: string;
}

class HydrationDebugger {
  private mismatches: HydrationMismatch[] = [];
  private isEnabled: boolean = false;
  private observer: MutationObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      this.isEnabled = true;
      this.setupGlobalErrorHandler();
      this.setupMutationObserver();
    }
  }

  // Backwards-compatible logging helpers used by hydration-safe components
  public logHydrationError(contextId: string, error: Error): void {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      hydrationErrorLogger.logHydrationError({
        error,
        errorInfo: { componentStack: `context:${contextId}` } as any,
        isHydrationError: true,
        url,
        userAgent: ua,
        timestamp: new Date(),
      });
    } catch (e) {
      // Ensure this helper never throws
      console.warn('logHydrationError fallback:', e);
    }
  }

  public logHydrationSuccess(contextId: string): void {
    if (process.env.NODE_ENV !== 'production') {
      // Lightweight dev log to help trace hydration flow
      console.debug(`[Hydration] success: ${contextId}`);
    }
  }

  public logSSRDataHydration(hydrationId: string, data: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[SSRData] hydrated: ${hydrationId}`, { keys: Object.keys(data || {}) });
    }
  }

  public logDataMismatch(hydrationId: string, payload: { server: any; client: any }): void {
    try {
      const differences = this.analyzeHtmlDifferences(
        JSON.stringify(payload.server || {}),
        JSON.stringify(payload.client || {})
      );
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[SSRData] mismatch: ${hydrationId}`, { differencesCount: differences.length });
      }
    } catch {
      // No-op if analysis fails
    }
  }

  private setupGlobalErrorHandler() {
    if (typeof window === 'undefined') return;

    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Check for React hydration errors
      if (this.isHydrationError(message)) {
        this.captureHydrationMismatch(message, args);
      }
      
      originalConsoleError.apply(console, args);
    };

    // Capture React error boundary errors
    window.addEventListener('error', (event) => {
      if (this.isHydrationError(event.error?.message || '')) {
        this.captureHydrationMismatch(event.error.message, [event.error]);
      }
    });
  }

  private setupMutationObserver() {
    if (typeof window === 'undefined' || !document) return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          this.checkForHydrationMismatches(mutation.target as Element);
        }
      });
    });

    // Start observing after initial hydration
    setTimeout(() => {
      if (this.observer && document.body) {
        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeOldValue: true,
        });
      }
    }, 100);
  }

  private isHydrationError(message: string): boolean {
    const hydrationErrorPatterns = [
      /hydration/i,
      /server.*client.*mismatch/i,
      /expected server HTML to contain/i,
      /did not match.*server/i,
      /minified react error #130/i,
      /text content does not match/i,
      /prop.*did not match/i,
    ];

    return hydrationErrorPatterns.some(pattern => pattern.test(message));
  }

  private captureHydrationMismatch(errorMessage: string, errorArgs: any[]) {
    const mismatch: HydrationMismatch = {
      id: `mismatch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      serverHTML: this.extractServerHTML(errorArgs),
      clientHTML: this.extractClientHTML(errorArgs),
      componentName: this.extractComponentName(errorMessage),
      differences: [],
      severity: 'high',
    };

    // Analyze the differences
    mismatch.differences = this.analyzeHtmlDifferences(
      mismatch.serverHTML,
      mismatch.clientHTML
    );

    // Determine severity based on differences
    mismatch.severity = this.calculateSeverity(mismatch.differences);

    this.mismatches.push(mismatch);

    // Log detailed information in development
    if (process.env.NODE_ENV === 'development') {
      this.logMismatchDetails(mismatch);
    }

    // Trigger custom event for debugging tools
    this.dispatchMismatchEvent(mismatch);
  }

  private extractServerHTML(errorArgs: any[]): string {
    // Try to extract server HTML from React error details
    const errorString = errorArgs.join(' ');
    const serverMatch = errorString.match(/server.*?html.*?["'`](.*?)["'`]/i);
    return serverMatch ? serverMatch[1] : '';
  }

  private extractClientHTML(errorArgs: any[]): string {
    // Try to extract client HTML from React error details
    const errorString = errorArgs.join(' ');
    const clientMatch = errorString.match(/client.*?html.*?["'`](.*?)["'`]/i);
    return clientMatch ? clientMatch[1] : '';
  }

  private extractComponentName(errorMessage: string): string | undefined {
    // Try to extract component name from error message
    const componentMatch = errorMessage.match(/in (\w+)/);
    return componentMatch ? componentMatch[1] : undefined;
  }

  private analyzeHtmlDifferences(serverHTML: string, clientHTML: string): HtmlDifference[] {
    const differences: HtmlDifference[] = [];

    if (!serverHTML || !clientHTML) {
      return differences;
    }

    try {
      // Create temporary DOM elements for comparison
      const serverDiv = document.createElement('div');
      const clientDiv = document.createElement('div');
      
      serverDiv.innerHTML = serverHTML;
      clientDiv.innerHTML = clientHTML;

      // Compare text content
      if (serverDiv.textContent !== clientDiv.textContent) {
        differences.push({
          type: 'text',
          path: 'textContent',
          serverValue: serverDiv.textContent || '',
          clientValue: clientDiv.textContent || '',
          description: 'Text content differs between server and client',
        });
      }

      // Compare structure
      if (serverDiv.children.length !== clientDiv.children.length) {
        differences.push({
          type: 'structure',
          path: 'children',
          serverValue: `${serverDiv.children.length} children`,
          clientValue: `${clientDiv.children.length} children`,
          description: 'Number of child elements differs',
        });
      }

      // Compare attributes (simplified)
      this.compareAttributes(serverDiv, clientDiv, differences, '');

    } catch (error) {
      console.warn('Failed to analyze HTML differences:', error);
    }

    return differences;
  }

  private compareAttributes(
    serverEl: Element,
    clientEl: Element,
    differences: HtmlDifference[],
    path: string
  ) {
    const serverAttrs = Array.from(serverEl.attributes);
    const clientAttrs = Array.from(clientEl.attributes);

    // Check for missing or different attributes
    serverAttrs.forEach(attr => {
      const clientAttr = clientEl.getAttribute(attr.name);
      if (clientAttr !== attr.value) {
        differences.push({
          type: 'attribute',
          path: `${path}@${attr.name}`,
          serverValue: attr.value,
          clientValue: clientAttr || '(missing)',
          description: `Attribute "${attr.name}" differs`,
        });
      }
    });

    // Check for extra client attributes
    clientAttrs.forEach(attr => {
      if (!serverEl.hasAttribute(attr.name)) {
        differences.push({
          type: 'attribute',
          path: `${path}@${attr.name}`,
          serverValue: '(missing)',
          clientValue: attr.value,
          description: `Extra attribute "${attr.name}" on client`,
        });
      }
    });
  }

  private calculateSeverity(differences: HtmlDifference[]): 'low' | 'medium' | 'high' {
    if (differences.length === 0) return 'low';
    
    const hasStructuralDifferences = differences.some(d => d.type === 'structure');
    const hasTextDifferences = differences.some(d => d.type === 'text');
    const hasMultipleDifferences = differences.length > 3;

    if (hasStructuralDifferences || hasMultipleDifferences) {
      return 'high';
    } else if (hasTextDifferences) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private logMismatchDetails(mismatch: HydrationMismatch) {
    console.group(`🚨 Hydration Mismatch Detected: ${mismatch.id}`);
    console.log('Timestamp:', mismatch.timestamp.toISOString());
    console.log('Component:', mismatch.componentName || 'Unknown');
    console.log('Severity:', mismatch.severity);
    
    if (mismatch.serverHTML) {
      console.log('Server HTML:', mismatch.serverHTML);
    }
    
    if (mismatch.clientHTML) {
      console.log('Client HTML:', mismatch.clientHTML);
    }
    
    if (mismatch.differences.length > 0) {
      console.log('Differences:');
      mismatch.differences.forEach((diff, index) => {
        console.log(`  ${index + 1}. ${diff.description}`);
        console.log(`     Path: ${diff.path}`);
        console.log(`     Server: "${diff.serverValue}"`);
        console.log(`     Client: "${diff.clientValue}"`);
      });
    }
    
    console.groupEnd();
  }

  private dispatchMismatchEvent(mismatch: HydrationMismatch) {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('hydrationMismatch', {
      detail: mismatch,
    });
    
    window.dispatchEvent(event);
  }

  private checkForHydrationMismatches(element: Element) {
    // Check if element has hydration warning attributes
    if (element.hasAttribute && element.hasAttribute('data-reactroot')) {
      // This is a React root, check for mismatches
      this.validateElementHydration(element);
    }
  }

  private validateElementHydration(element: Element) {
    // Check for common hydration issues
    const issues: string[] = [];

    // Check for time-sensitive content
    const textContent = element.textContent || '';
    if (this.containsTimeSensitiveContent(textContent)) {
      issues.push('Contains time-sensitive content that may differ between server and client');
    }

    // Check for client-only attributes
    if (element.hasAttribute && this.hasClientOnlyAttributes(element)) {
      issues.push('Contains client-only attributes');
    }

    if (issues.length > 0) {
      console.warn('Potential hydration issues detected:', {
        element,
        issues,
      });
    }
  }

  private containsTimeSensitiveContent(text: string): boolean {
    const timeSensitivePatterns = [
      /\d{1,2}:\d{2}:\d{2}/,  // Time format
      /\d{4}-\d{2}-\d{2}/,    // Date format
      /\d+ (second|minute|hour|day)s? ago/,  // Relative time
      /just now/i,
      /a moment ago/i,
    ];

    return timeSensitivePatterns.some(pattern => pattern.test(text));
  }

  private hasClientOnlyAttributes(element: Element): boolean {
    const clientOnlyAttrs = [
      'data-client-only',
      'data-hydration-skip',
    ];

    return clientOnlyAttrs.some(attr => element.hasAttribute(attr));
  }

  // Public API
  public getMismatches(): HydrationMismatch[] {
    return [...this.mismatches];
  }

  public clearMismatches(): void {
    this.mismatches = [];
  }

  public getStats() {
    return {
      total: this.mismatches.length,
      high: this.mismatches.filter(m => m.severity === 'high').length,
      medium: this.mismatches.filter(m => m.severity === 'medium').length,
      low: this.mismatches.filter(m => m.severity === 'low').length,
      byComponent: this.groupByComponent(),
    };
  }

  private groupByComponent() {
    const byComponent: Record<string, number> = {};
    
    this.mismatches.forEach(mismatch => {
      const component = mismatch.componentName || 'Unknown';
      byComponent[component] = (byComponent[component] || 0) + 1;
    });
    
    return byComponent;
  }

  public generateReport(): string {
    const stats = this.getStats();
    
    let report = `# Hydration Debug Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- Total Mismatches: ${stats.total}\n`;
    report += `- High Severity: ${stats.high}\n`;
    report += `- Medium Severity: ${stats.medium}\n`;
    report += `- Low Severity: ${stats.low}\n\n`;
    
    if (Object.keys(stats.byComponent).length > 0) {
      report += `## By Component\n\n`;
      Object.entries(stats.byComponent)
        .sort(([,a], [,b]) => b - a)
        .forEach(([component, count]) => {
          report += `- ${component}: ${count}\n`;
        });
      report += `\n`;
    }
    
    if (this.mismatches.length > 0) {
      report += `## Recent Mismatches\n\n`;
      this.mismatches.slice(-5).forEach((mismatch, index) => {
        report += `### ${index + 1}. ${mismatch.componentName || 'Unknown'} (${mismatch.severity})\n\n`;
        report += `- ID: ${mismatch.id}\n`;
        report += `- Time: ${mismatch.timestamp.toISOString()}\n`;
        
        if (mismatch.differences.length > 0) {
          report += `- Differences:\n`;
          mismatch.differences.forEach(diff => {
            report += `  - ${diff.description}\n`;
          });
        }
        
        report += `\n`;
      });
    }
    
    return report;
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export singleton instance
export const hydrationDebugger = new HydrationDebugger();

// Export class for testing
export { HydrationDebugger };
