/**
 * QuickBooks Online OAuth 2.0 utilities
 */

import axios from 'axios';

const QB_BASE_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QB_API_BASE = 'https://sandbox-quickbooks.api.intuit.com'; // Use 'https://quickbooks.api.intuit.com' for production

export interface QuickBooksAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export class QuickBooksOAuth {
  private config: QuickBooksAuthConfig;
  private apiBase: string;

  constructor(config: QuickBooksAuthConfig) {
    this.config = config;
    this.apiBase =
      config.environment === 'sandbox'
        ? 'https://sandbox-quickbooks.api.intuit.com'
        : 'https://quickbooks.api.intuit.com';
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      redirect_uri: this.config.redirectUri,
      ...(state && { state }),
    });

    return `${QB_BASE_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    realmId: string;
  }> {
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        auth: {
          username: this.config.clientId,
          password: this.config.clientSecret,
        },
      }
    );

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      token_type: response.data.token_type,
      realmId: response.data.realmId,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        auth: {
          username: this.config.clientId,
          password: this.config.clientSecret,
        },
      }
    );

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || refreshToken, // May not be returned
      expires_in: response.data.expires_in,
      token_type: response.data.token_type,
    };
  }

  /**
   * Revoke access token
   */
  async revokeToken(token: string): Promise<void> {
    const revokeUrl = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

    await axios.post(
      revokeUrl,
      new URLSearchParams({
        token,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        auth: {
          username: this.config.clientId,
          password: this.config.clientSecret,
        },
      }
    );
  }
}
