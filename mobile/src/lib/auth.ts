import * as SecureStore from 'expo-secure-store';

/**
 * Session token storage. On device this lives in the OS keychain / keystore via
 * expo-secure-store — the native equivalent of the web app's localStorage token,
 * but encrypted at rest.
 */
const TOKEN_KEY = 'wingman_token';

let cached: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cached !== null) return cached;
  try {
    cached = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    cached = null;
  }
  return cached;
}

export async function setToken(token: string | null): Promise<void> {
  cached = token;
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
