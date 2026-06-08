const { createServerClient } = require('@supabase/ssr');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

function createSupabaseClient(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase URL ou Anon Key não encontrados. O login com Google pode não funcionar.');
    return null;
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) {
        return req.cookies ? req.cookies[name] : undefined;
      },
      set(name, value, options) {
        if (res && res.cookie) {
          res.cookie(name, value, options);
        }
      },
      remove(name, options) {
        if (res && res.clearCookie) {
          res.clearCookie(name, options);
        }
      },
    },
  });
}

module.exports = { createSupabaseClient };
