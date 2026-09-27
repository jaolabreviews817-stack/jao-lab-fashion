import { createClient, type User } from "@supabase/supabase-js";
import type { Request } from "express";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for the API server.",
  );
}

const configuredSupabaseUrl = supabaseUrl;
const configuredSupabaseAnonKey = supabaseAnonKey;

export function createSupabaseClient(accessToken?: string) {
  return createClient(configuredSupabaseUrl, configuredSupabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

export async function getRequestUser(req: Request): Promise<User | null> {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const accessToken = authorization.slice("Bearer ".length).trim();
  if (!accessToken) return null;

  const { data, error } = await createSupabaseClient(accessToken).auth.getUser(
    accessToken,
  );
  return error ? null : data.user;
}