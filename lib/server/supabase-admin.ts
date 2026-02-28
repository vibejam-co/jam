type SupabaseClient = any;

let cachedClient: SupabaseClient | null = null;

const getRequiredEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  return { supabaseUrl, supabaseServiceRoleKey };
};

export const getSupabaseAdmin = async (): Promise<SupabaseClient> => {
  if (cachedClient) {
    return cachedClient;
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getRequiredEnv();
  const { createClient } = await import('@supabase/supabase-js');
  cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
};
