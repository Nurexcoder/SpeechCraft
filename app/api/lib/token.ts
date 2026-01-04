// Shared token store for authentication
interface TokenData {
  token: string;
  expiresAt: number;
}

const tokenStore = new Map<string, TokenData>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (data.expiresAt < now) {
      tokenStore.delete(token);
    }
  }
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

