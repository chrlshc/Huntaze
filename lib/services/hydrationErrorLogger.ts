import { ErrorInfo } from 'react';

export interface HydrationError {
  id: string;
  timestamp: Date;
  errorType: 'mismatch' | 'timeout' | 'component_error';
  componentStack: string;
  serverHTML: string;
  clientHTML: string;
  userAgent: string;
  url: string;
  resolved: boolean;
  error: Error;
  errorInfo: ErrorInfo;
}

export interface HydrationErrorLogData {
  error: Error;
  errorInfo: ErrorInfo;
  isHydrationError: boolean;
  url: string;
  userAgent: string;
  timestamp: Date;
}

class HydrationErrorLogger {
  private errors: HydrationError[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  generateErrorId(): string {
    return `hydration-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  determineErrorType(error: Error): 'mismatch' | 'timeout' | 'component_error' {
    const message = error.message.toLowerCase();
    
    if (message.includes('mismatch') || message.includes('130')) {
      return 'mismatch';
    }
    
    if (message.includes('timeout')) {
      return 'timeout';
    }
    
    return 'component_error';
  }

  captureHTMLSnapshot(): { serverHTML: string; clientHTML: string } {
    let serverHTML = '';
    let clientHTML = '';

    try {
      // Try to capture current DOM state
      if (typeof document !== 'undefined') {
        clientHTML = document.documentElement.outerHTML;
      }

      // For server HTML, we'll try to get it from SSR data or initial state
      // This is a simplified approach - in a real implementation, you might
      // store the server HTML in a data attribute or global variable
      const ssrDataElement = document.querySelector('[data-ssr-html]');
      if (ssrDataElement) {
        serverHTML = ssrDataElement.getAttribute('data-ssr-html') || '';
      }
    } catch (e) {
      console.warn('Failed to capture HTML snapshot:', e);
    }

    return { serverHTML, clientHTML };
  }

  logHydrationError(data: HydrationErrorLogData): void {
    const { serverHTML, clientHTML } = this.captureHTMLSnapshot();
    
    const hydrationError: HydrationError = {
      id: this.generateErrorId(),
      timestamp: data.timestamp,
      errorType: this.determineErrorType(data.error),
      componentStack: data.errorInfo.componentStack || '',
      serverHTML,
      clientHTML,
      userAgent: data.userAgent,
      url: data.url,
      resolved: false,
      error: data.error,
      errorInfo: data.errorInfo,
    };

    // Add to in-memory storage
    this.errors.unshift(hydrationError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(hydrationError);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(hydrationError);
    }

    // Store in localStorage for debugging
    this.storeInLocalStorage(hydrationError);
  }

  private logToConsole(error: HydrationError): void {
    console.group(`🔍 Hydration Error #${error.id}`);
    console.log('Type:', error.errorType);
    console.log('Timestamp:', error.timestamp.toISOString());
    console.log('URL:', error.url);
    console.log('User Agent:', error.userAgent);
    console.log('Component Stack:', error.componentStack);
    console.log('Original Error:', error.error);
    console.log('Error Info:', error.errorInfo);
    
    if (error.serverHTML && error.clientHTML) {
      console.log('Server HTML length:', error.serverHTML.length);
      console.log('Client HTML length:', error.clientHTML.length);
      
      // Simple diff indication
      if (error.serverHTML !== error.clientHTML) {
        console.warn('⚠️ Server and Client HTML differ!');
      }
    }
    
    console.groupEnd();
  }

  private async sendToMonitoring(error: HydrationError): Promise<void> {
    try {
      // Send to your monitoring service (e.g., Sentry, LogRocket, etc.)
      await fetch('/api/monitoring/hydration-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: error.id,
          timestamp: error.timestamp.toISOString(),
          errorType: error.errorType,
          componentStack: error.componentStack,
          url: error.url,
          userAgent: error.userAgent,
          message: error.error.message,
          stack: error.error.stack,
          // Don't send full HTML to avoid large payloads
          htmlDiffers: error.serverHTML !== error.clientHTML,
          serverHTMLLength: error.serverHTML.length,
          clientHTMLLength: error.clientHTML.length,
        }),
      });
    } catch (e) {
      console.warn('Failed to send hydration error to monitoring:', e);
    }
  }

  private storeInLocalStorage(error: HydrationError): void {
    try {
      const storageKey = 'hydration-errors';
      const existingErrors = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Store simplified version to avoid localStorage size limits
      const simplifiedError = {
        id: error.id,
        timestamp: error.timestamp.toISOString(),
        errorType: error.errorType,
        url: error.url,
        message: error.error.message,
        componentStack: error.componentStack.substring(0, 500), // Truncate long stacks
      };
      
      existingErrors.unshift(simplifiedError);
      
      // Keep only last 10 errors in localStorage
      const trimmedErrors = existingErrors.slice(0, 10);
      
      localStorage.setItem(storageKey, JSON.stringify(trimmedErrors));
    } catch (e) {
      console.warn('Failed to store hydration error in localStorage:', e);
    }
  }

  getErrors(): HydrationError[] {
    return [...this.errors];
  }

  getErrorById(id: string): HydrationError | undefined {
    return this.errors.find(error => error.id === id);
  }

  markErrorAsResolved(id: string): void {
    const error = this.getErrorById(id);
    if (error) {
      error.resolved = true;
    }
  }

  clearErrors(): void {
    this.errors = [];
    try {
      localStorage.removeItem('hydration-errors');
    } catch (e) {
      console.warn('Failed to clear hydration errors from localStorage:', e);
    }
  }

  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    resolved: number;
    unresolved: number;
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      resolved: 0,
      unresolved: 0,
    };

    this.errors.forEach(error => {
      // Count by type
      stats.byType[error.errorType] = (stats.byType[error.errorType] || 0) + 1;
      
      // Count resolved/unresolved
      if (error.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    });

    return stats;
  }
}

// Export singleton instance
export const hydrationErrorLogger = new HydrationErrorLogger();

// Export for testing
export { HydrationErrorLogger };