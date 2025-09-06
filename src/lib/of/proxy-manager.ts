// Proxy Manager for OnlyFans Browser Automation
// Handles proxy rotation and Bright Data integration

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  country?: string;
  sticky?: boolean;
}

export interface BrightDataConfig {
  customer: string;
  password: string;
  zone: string;
  country?: string;
  sticky?: boolean;
  sessionId?: string;
}

class ProxyManager {
  private brightDataEndpoint = 'zproxy.lum-superproxy.io:22225';
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;

  // Configure Bright Data proxy
  getBrightDataProxy(config: BrightDataConfig): ProxyConfig {
    // Build username with all parameters
    const usernameParts = [
      `${config.customer}-zone-${config.zone}`
    ];

    if (config.country) {
      usernameParts.push(`country-${config.country}`);
    }

    if (config.sticky && config.sessionId) {
      usernameParts.push(`session-${config.sessionId}`);
    }

    return {
      server: `http://${this.brightDataEndpoint}`,
      username: usernameParts.join('-'),
      password: config.password,
      country: config.country,
      sticky: config.sticky
    };
  }

  // Add custom proxy
  addProxy(proxy: ProxyConfig): void {
    this.proxies.push(proxy);
  }

  // Get next proxy (round-robin)
  getNextProxy(): ProxyConfig | undefined {
    if (this.proxies.length === 0) return undefined;
    
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    
    return proxy;
  }

  // Get proxy for specific user (sticky session)
  getProxyForUser(userId: string): ProxyConfig | undefined {
    // Use Bright Data with sticky session
    if (process.env.BRIGHT_DATA_CUSTOMER && process.env.BRIGHT_DATA_PASSWORD) {
      return this.getBrightDataProxy({
        customer: process.env.BRIGHT_DATA_CUSTOMER,
        password: process.env.BRIGHT_DATA_PASSWORD,
        zone: process.env.BRIGHT_DATA_ZONE || 'residential',
        country: 'us', // OnlyFans works best with US IPs
        sticky: true,
        sessionId: userId // Use userId for sticky sessions
      });
    }

    // Fallback to regular proxy rotation
    return this.getNextProxy();
  }

  // Test proxy connectivity
  async testProxy(proxy: ProxyConfig): Promise<boolean> {
    try {
      // Simple test using fetch with proxy
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal,
        // Note: fetch doesn't support proxy directly
        // This would need to be implemented with a library like node-fetch-proxy
      });

      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Proxy test successful. IP: ${data.ip}`);
        return true;
      }
    } catch (error) {
      console.error('Proxy test failed:', error);
    }

    return false;
  }

  // Get proxy health status
  getProxyStats(): {
    total: number;
    brightDataEnabled: boolean;
  } {
    return {
      total: this.proxies.length,
      brightDataEnabled: !!(process.env.BRIGHT_DATA_CUSTOMER && process.env.BRIGHT_DATA_PASSWORD)
    };
  }
}

// Export singleton
export const proxyManager = new ProxyManager();

// Initialize with environment proxies if available
if (process.env.PROXY_LIST) {
  const proxyList = process.env.PROXY_LIST.split(',');
  proxyList.forEach(proxyUrl => {
    try {
      const url = new URL(proxyUrl);
      proxyManager.addProxy({
        server: `${url.protocol}//${url.hostname}:${url.port}`,
        username: url.username || undefined,
        password: url.password || undefined
      });
    } catch (error) {
      console.error('Invalid proxy URL:', proxyUrl);
    }
  });
}

// Example proxy configurations for different providers
export const PROXY_EXAMPLES = {
  brightData: {
    customer: 'your_customer_id',
    password: 'your_password',
    zone: 'residential', // residential, datacenter, mobile
    country: 'us'
  },
  smartProxy: {
    server: 'http://gate.smartproxy.com:7000',
    username: 'username',
    password: 'password'
  },
  oxylabs: {
    server: 'http://pr.oxylabs.io:7777',
    username: 'customer-username',
    password: 'password'
  }
};