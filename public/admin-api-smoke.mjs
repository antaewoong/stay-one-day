/**
 * Admin API Smoke Runner
 * - Logs into Supabase (GoTrue) with email/password
 * - Calls key admin endpoints on your Next.js app
 *
 * Env:
 *   BASE_URL=http://localhost:3000
 *   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
 *   SUPABASE_ANON_KEY=YOUR_ANON_KEY
 *   ADMIN_EMAIL=admin@example.com
 *   ADMIN_PASSWORD=your_password
 *   DO_WRITE=true            # optional, do write tests
 *   HERO_IMAGE_URL=https://...  # required only if testing POST /hero-slides
 */
const fetchFn = global.fetch || (await import('node-fetch')).default;

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const DO_WRITE = String(process.env.DO_WRITE || 'false').toLowerCase() === 'true';
const HERO_IMAGE_URL = process.env.HERO_IMAGE_URL;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Missing env. Set SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

const ok = (label) => console.log(`✅ ${label}`);
const fail = (label, err) => console.error(`❌ ${label}
   -> ${err?.message || err}`);

async function login() {
  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  if (!res.ok) {
    throw new Error(`Login failed ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  if (!json.access_token) throw new Error('No access_token in response');
  ok('Supabase login');
  return json.access_token;
}

async function call(path, method='GET', body=null, token) {
  const url = `${BASE_URL}${path}`;
  const res = await fetchFn(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(body ? {'Content-Type':'application/json'} : {})
    },
    body: body ? JSON.stringify(body) : null
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

(async () => {
  try {
    const token = await login();

    // Read-only checks
    await call('/api/admin/hosts?limit=5', 'GET', null, token);            ok('GET /api/admin/hosts');
    await call('/api/admin/influencers?page=1&limit=5&status=all&category=all', 'GET', null, token); ok('GET /api/admin/influencers');
    await call('/api/admin/influencer-notices', 'GET', null, token);       ok('GET /api/admin/influencer-notices');
    await call('/api/admin/telegram/register', 'GET', null, token);        ok('GET /api/admin/telegram/register');
    await call('/api/admin/hero-slides', 'GET', null, token);              ok('GET /api/admin/hero-slides');

    // Optional write tests
    if (DO_WRITE) {
      if (!HERO_IMAGE_URL) {
        console.warn('ℹ️ DO_WRITE=true but HERO_IMAGE_URL not set. Skipping POST /hero-slides');
      } else {
        await call('/api/admin/hero-slides', 'POST', {
          image_url: HERO_IMAGE_URL,
          title: '자동 테스트 슬라이드',
          subtitle: '스모크 러너 생성',
          order: 999,
          target_url: '/'
        }, token);
        ok('POST /api/admin/hero-slides');
      }
    }

    console.log('\nAll smoke checks completed.');
  } catch (err) {
    fail('Smoke run failed', err);
    process.exit(1);
  }
})();
