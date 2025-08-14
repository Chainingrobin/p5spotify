declare global {
  namespace Spotify {
    interface Player {
      connect(): Promise<boolean>;
      disconnect(): void;
      // Add more methods as needed
    }

    interface PlayerInit {
      name: string;
      getOAuthToken(cb: (token: string) => void): void;
      volume?: number;
    }
  }
}

export {};
