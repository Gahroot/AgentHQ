declare module 'intuit-oauth' {
  interface Token {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
    realmId?: string;
    createdAt?: number;
  }

  interface TokenResponse {
    token: Token;
    getJson(): Token;
  }

  interface OAuthClientConfig {
    clientId: string;
    clientSecret: string;
    environment: 'sandbox' | 'production';
    redirectUri?: string;
    token?: Token;
  }

  class OAuthClient {
    constructor(config: OAuthClientConfig);
    setToken(token: Partial<Token>): this;
    getToken(): Token;
    refreshUsingToken(refreshToken: string): Promise<TokenResponse>;
    static environment: {
      sandbox: 'sandbox';
      production: 'production';
    };
  }

  export = OAuthClient;
}
