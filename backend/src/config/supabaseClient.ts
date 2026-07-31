import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const isEnabled = process.env.USE_SUPABASE === 'true';
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!isEnabled || !url || !key) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false },
      });
      logger.info('[SUPABASE] Supabase client initialized successfully');
    } catch (err) {
      logger.error('[SUPABASE] Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

export function isSupabaseEnabled(): boolean {
  return process.env.USE_SUPABASE === 'true' && !!process.env.SUPABASE_URL && !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
}
