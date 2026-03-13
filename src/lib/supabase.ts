import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wqexzldtcymuxqcihwnv.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_9WGYtOvAir-Gnw7FMnk57A_oMXpWUB1';

// SecureStore has a ~2KB value size limit on iOS.
// Supabase session tokens (JWTs) can exceed this, so we chunk large values
// into multiple SecureStore entries to prevent silent storage failures.
const CHUNK_SIZE = 1800; // Stay under the 2KB limit with some margin

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Try reading as a single value first (handles existing non-chunked data)
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) return value;

      // If null, check if data was stored in chunks
      const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);
      if (!chunkCountStr) return null;

      const chunkCount = parseInt(chunkCountStr, 10);
      if (isNaN(chunkCount) || chunkCount <= 0) return null;

      const chunks: string[] = [];
      for (let i = 0; i < chunkCount; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
        if (chunk === null) return null; // Corrupted chunked data
        chunks.push(chunk);
      }
      return chunks.join('');
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Clean up any previous chunks before writing
      await ExpoSecureStoreAdapter._clearChunks(key);

      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
      } else {
        // Split into chunks for large values (e.g., Supabase JWTs on iOS)
        const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < chunkCount; i++) {
          const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
        }
        await SecureStore.setItemAsync(`${key}_chunks`, String(chunkCount));
        // Remove the single-value key if it existed
        try { await SecureStore.deleteItemAsync(key); } catch {}
      }
    } catch (error) {
      console.warn('SecureStore setItem failed:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    await ExpoSecureStoreAdapter._clearChunks(key);
  },
  _clearChunks: async (key: string): Promise<void> => {
    try {
      const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);
      if (chunkCountStr) {
        const chunkCount = parseInt(chunkCountStr, 10);
        for (let i = 0; i < chunkCount; i++) {
          try { await SecureStore.deleteItemAsync(`${key}_chunk_${i}`); } catch {}
        }
        try { await SecureStore.deleteItemAsync(`${key}_chunks`); } catch {}
      }
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
