const SUPABASE_URL = 'https://gtmjjqlbgtruyilgzggl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kfdFRvYwW_4cIeV2Nm-gKw_J7sw0WHX';
const supabaseHeaders = { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, 'Content-Type': 'application/json' };
async function supabaseFetch(path, options = {}) {
 const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...supabaseHeaders, ...(options.headers || {}) } });
 const text = await response.text();
 if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
 return text.trim() ? JSON.parse(text) : null;
}
