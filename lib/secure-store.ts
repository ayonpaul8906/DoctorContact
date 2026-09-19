import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Config } from './config';
import type { AuthUser } from '../types';

/**
 * Storage adapter using Expo SecureStore for iOS/Android
 * and localStorage fallback for web development preview.
 */

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore in SSR or restricted web storage
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn(`[SecureStore] setItem error for key "${key}":`, err);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch {
      return null;
    }
    return null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn(`[SecureStore] getItem error for key "${key}":`, err);
    return null;
  }
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.warn(`[SecureStore] deleteItem error for key "${key}":`, err);
  }
}

export const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return await getItem(Config.TOKEN_KEY);
  },

  async setAccessToken(token: string): Promise<void> {
    await setItem(Config.TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await getItem(Config.REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await setItem(Config.REFRESH_TOKEN_KEY, token);
  },

  async getStoredUser(): Promise<AuthUser | null> {
    const raw = await getItem(Config.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  async setStoredUser(user: AuthUser): Promise<void> {
    await setItem(Config.USER_KEY, JSON.stringify(user));
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      deleteItem(Config.TOKEN_KEY),
      deleteItem(Config.REFRESH_TOKEN_KEY),
      deleteItem(Config.USER_KEY),
    ]);
  },
};

const LANGUAGE_KEY = 'doctorcontact_selected_language';

export const LanguageStorage = {
  async getLanguage(): Promise<string | null> {
    return await getItem(LANGUAGE_KEY);
  },

  async setLanguage(lang: string): Promise<void> {
    await setItem(LANGUAGE_KEY, lang);
  },

  async clearLanguage(): Promise<void> {
    await deleteItem(LANGUAGE_KEY);
  },
};

