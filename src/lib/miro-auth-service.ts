export interface MiroTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  expiresAt?: number;
}

class MiroAuthService {
  private static instance: MiroAuthService;
  private tokenData: MiroTokenData | null = null;

  private constructor() {
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('miro_access_token');
      if (storedToken) {
        this.tokenData = { accessToken: storedToken };
      }
    }
  }

  public static getInstance(): MiroAuthService {
    if (!MiroAuthService.instance) {
      MiroAuthService.instance = new MiroAuthService();
    }
    return MiroAuthService.instance;
  }

  public async initiateOAuth(): Promise<string> {
    try {
      const response = await fetch('/api/auth/miro');
      const data = await response.json();
      
      if (data.authUrl) {
        return data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
      throw error;
    }
  }

  public async exchangeCodeForToken(code: string): Promise<MiroTokenData> {
    try {
      const response = await fetch('/api/auth/miro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        this.tokenData = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          tokenType: data.tokenType,
          expiresAt: data.expiresIn ? Date.now() + (data.expiresIn * 1000) : undefined,
        };

        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('miro_access_token', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('miro_refresh_token', data.refreshToken);
          }
          if (this.tokenData.expiresAt) {
            localStorage.setItem('miro_token_expires_at', this.tokenData.expiresAt.toString());
          }
        }

        return this.tokenData;
      } else {
        throw new Error(data.error || 'Failed to exchange code for token');
      }
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  public getAccessToken(): string | null {
    if (this.tokenData?.accessToken) {
      // Check if token is expired
      if (this.tokenData.expiresAt && Date.now() > this.tokenData.expiresAt) {
        // Token is expired, try to refresh
        this.refreshToken();
        return null;
      }
      return this.tokenData.accessToken;
    }
    return null;
  }

  public async refreshToken(): Promise<string | null> {
    if (!this.tokenData?.refreshToken) {
      return null;
    }

    try {
      // Implement refresh token logic here
      // For now, we'll just clear the token and require re-authentication
      this.clearToken();
      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.clearToken();
      return null;
    }
  }

  public clearToken(): void {
    this.tokenData = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('miro_access_token');
      localStorage.removeItem('miro_refresh_token');
      localStorage.removeItem('miro_token_expires_at');
    }
  }

  public isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null;
  }

  public setTokenFromUrl(token: string): void {
    this.tokenData = { accessToken: token };
    if (typeof window !== 'undefined') {
      localStorage.setItem('miro_access_token', token);
    }
  }
}

export const miroAuthService = MiroAuthService.getInstance();
