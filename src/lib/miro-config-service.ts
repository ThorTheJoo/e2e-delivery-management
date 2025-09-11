export interface MiroConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface MiroDebugInfo {
  isConfigured: boolean;
  config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
  } | null;
  localStorage: {
    miroConfig: string | null;
    allKeys: string[];
  } | 'Not available (server-side)';
}

class MiroConfigService {
  private static instance: MiroConfigService;
  private config: MiroConfig | null = null;

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): MiroConfigService {
    if (!MiroConfigService.instance) {
      MiroConfigService.instance = new MiroConfigService();
    }
    return MiroConfigService.instance;
  }

  private loadConfig(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('miroConfig');
        if (saved) {
          const parsedConfig = JSON.parse(saved);
          if (this.validateConfig(parsedConfig)) {
            this.config = parsedConfig;
          } else {
            console.warn('MiroConfigService: Invalid configuration structure in localStorage');
            this.config = null;
          }
        }
      } catch (error) {
        console.error('MiroConfigService: Error loading configuration from localStorage:', error);
        this.config = null;
      }
    }
  }

  private validateConfig(config: unknown): config is MiroConfig {
    return (
      config &&
      typeof config === 'object' &&
      typeof config.clientId === 'string' &&
      config.clientId.trim() !== '' &&
      typeof config.clientSecret === 'string' &&
      config.clientSecret.trim() !== '' &&
      typeof config.redirectUri === 'string' &&
      config.redirectUri.trim() !== '' &&
      Array.isArray(config.scopes) &&
      config.scopes.length > 0
    );
  }

  public getConfig(): MiroConfig | null {
    // Reload config in case it was updated
    this.loadConfig();
    return this.config;
  }

  public isConfigured(): boolean {
    return this.config !== null;
  }

  public getClientId(): string | null {
    return this.config?.clientId || null;
  }

  public getClientSecret(): string | null {
    return this.config?.clientSecret || null;
  }

  public getRedirectUri(): string | null {
    return this.config?.redirectUri || null;
  }

  public getScopes(): string[] {
    return this.config?.scopes || [];
  }

  public updateConfig(newConfig: Partial<MiroConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...newConfig };
      this.saveConfig();
    }
  }

  private saveConfig(): void {
    if (typeof window !== 'undefined' && this.config) {
      try {
        localStorage.setItem('miroConfig', JSON.stringify(this.config));
      } catch (error) {
        console.error('MiroConfigService: Error saving configuration to localStorage:', error);
      }
    }
  }

  public clearConfig(): void {
    this.config = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('miroConfig');
    }
  }

  public getDebugInfo(): MiroDebugInfo {
    return {
      isConfigured: this.isConfigured(),
      config: this.config
        ? {
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret ? '***SET***' : 'NOT SET',
            redirectUri: this.config.redirectUri,
            scopes: this.config.scopes,
          }
        : null,
      localStorage:
        typeof window !== 'undefined'
          ? {
              miroConfig: localStorage.getItem('miroConfig'),
              allKeys: Object.keys(localStorage),
            }
          : 'Not available (server-side)',
    };
  }
}

export const miroConfigService = MiroConfigService.getInstance();
