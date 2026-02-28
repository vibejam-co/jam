import { getSupabaseAdmin } from './supabase-admin.js';

export const getAuthHeader = (req: any): string => {
  if (req?.headers) {
    if (typeof req.headers.get === 'function') {
      return req.headers.get('authorization') || '';
    }

    const direct = req.headers.authorization;
    if (typeof direct === 'string') {
      return direct;
    }

    if (Array.isArray(direct) && typeof direct[0] === 'string') {
      return direct[0];
    }
  }

  return '';
};

export const getBearerToken = (req: any): string | null => {
  const authHeader = getAuthHeader(req);
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token || null;
};

export const getAuthenticatedUser = async (req: any) => {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return null;
  }

  return data.user;
};

export const isMemberUser = (user: any): boolean => {
  const appMetadata = user?.app_metadata;
  if (appMetadata && typeof appMetadata === 'object') {
    if (appMetadata.is_member === true) {
      return true;
    }
    if (appMetadata.membership === 'active') {
      return true;
    }
  }

  return false;
};
