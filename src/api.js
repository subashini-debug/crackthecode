// IMPORTANT: this participant app and the backend server are deployed as two
// SEPARATE apps (this one on Vercel, the backend on Render/etc). They do NOT
// share an origin, so we can never safely assume "the API is wherever this
// page is hosted" — that guess causes every request to silently hit Vercel
// itself (404/405 on a static site) instead of the real backend.
//
// VITE_API_BASE must be set as an Environment Variable in your Vercel
// project settings (not just in a local .env file, which is never uploaded)
// and pointed at your Render backend, e.g.:
//     VITE_API_BASE=https://your-app-name.onrender.com
// Because Vite inlines env vars at BUILD time, you must trigger a new
// deploy after adding/changing this variable for it to take effect.

function resolveApiBase() {
  const configured = import.meta.env.VITE_API_BASE;
  if (configured && configured.trim()) {
    return configured.trim().replace(/\/+$/, ''); // strip trailing slash(es)
  }

  // Only ever fall back automatically when we're pretty clearly in local dev
  // (localhost/127.0.0.1). In any deployed environment, guessing is worse
  // than failing loudly, so we deliberately do NOT fall back to
  // window.location.origin here.
  if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
    return 'http://localhost:4000';
  }

  return null; // signals "not configured" — surfaced to the user, not guessed
}

export const API_BASE = resolveApiBase();

export async function api(path, opts = {}, teamToken = null) {
  if (!API_BASE) {
    throw new Error(
      'Backend URL is not configured. Set VITE_API_BASE in your Vercel project\'s ' +
      'Environment Variables to your Render backend URL (e.g. https://your-app.onrender.com), ' +
      'then redeploy.'
    );
  }

  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (teamToken) headers['x-team-token'] = teamToken;

  const url = API_BASE + path;
  let res;
  try {
    res = await fetch(url, Object.assign({}, opts, { headers }));
  } catch (networkErr) {
    // fetch() itself throws for DNS failures, CORS rejections, the backend
    // being asleep/unreachable, mixed-content blocks, etc. Surface the URL
    // so it's obvious what to check.
    throw new Error(
      `Could not reach the backend at ${url}. This usually means the server is down, ` +
      `still starting up (free-tier cold start can take ~30-60s), or VITE_API_BASE is wrong. ` +
      `(${networkErr.message})`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  const rawText = await res.text();
  let data = {};
  if (contentType.includes('application/json')) {
    try { data = JSON.parse(rawText); } catch { /* fall through with data = {} */ }
  }

  if (!res.ok) {
    if (!contentType.includes('application/json')) {
      throw new Error(
        `Got an unexpected ${res.status} response from ${url} (not JSON). ` +
        `This usually means VITE_API_BASE points at the wrong server — double check it's your ` +
        `Render backend URL, not this Vercel app's own URL.`
      );
    }
    throw new Error(data.error || `Request failed (HTTP ${res.status})`);
  }
  return data;
}
