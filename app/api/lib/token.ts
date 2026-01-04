// Shared token store for authentication
interface TokenData {
  token: string;
  expiresAt: number;
}

const tokenStore = new Map<string, TokenData>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  const tokensToDelete: string[] = [];
  
  // Collect expired tokens
  tokenStore.forEach((data, token) => {
    if (data.expiresAt < now) {
      tokensToDelete.push(token);
    }
  });
  
  // Delete expired tokens
  tokensToDelete.forEach(token => {
    tokenStore.delete(token);
  });
}, 60000); // Clean up every minute

export function storeToken(token: string, expiresAt: number): void {
  tokenStore.set(token, { token, expiresAt });
}

export function verifyToken(token: string | null): boolean {
  if (!token) return false;

  const tokenData = tokenStore.get(token);
  if (!tokenData) return false;

  if (tokenData.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return false;
  }

  return true;
}

