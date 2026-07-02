#!/usr/bin/env node
'use strict';

// ── Config ─────────────────────────────────────────────────────────────────
const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/$/, '');

// ── Helpers ────────────────────────────────────────────────────────────────
function die(msg) {
  process.stderr.write(`snip: ${msg}\n`);
  process.exit(1);
}

async function apiFetch(path, opts = {}) {
  try {
    return await fetch(BASE + path, opts);
  } catch (err) {
    die(`Cannot reach backend at ${BASE} — ${err.message}`);
  }
}

// ── snip add <url> ─────────────────────────────────────────────────────────
async function cmdAdd(url) {
  if (!url) die('Usage: snip add <url>');
  if (!/^https?:\/\/.+/i.test(url)) die('URL must start with http:// or https://');

  const res = await apiFetch('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  let body;
  try { body = await res.json(); } catch { body = {}; }
  if (!res.ok) die(body.error || `Server responded ${res.status}`);

  console.log(body.shortUrl);
}

// ── snip ls ────────────────────────────────────────────────────────────────
async function cmdLs() {
  const res = await apiFetch('/api/links');
  let body;
  try { body = await res.json(); } catch { body = []; }
  if (!res.ok) die(`Server responded ${res.status}`);

  if (!Array.isArray(body) || body.length === 0) {
    console.log('No links yet.');
    return;
  }

  const codeW = Math.max('CODE'.length, ...body.map(l => l.code.length));
  const hitsW = Math.max('HITS'.length, ...body.map(l => String(l.hits).length));

  const row = (code, hits, url) =>
    `${String(code).padEnd(codeW)}  ${String(hits).padStart(hitsW)}  ${url}`;

  console.log(row('CODE', 'HITS', 'URL'));
  console.log(`${'-'.repeat(codeW)}  ${'-'.repeat(hitsW)}  ${'-'.repeat(50)}`);
  for (const link of body) {
    console.log(row(link.code, link.hits, link.url));
  }
}

// ── snip open <code> ───────────────────────────────────────────────────────
// We use fetch with redirect:'manual' so we read the Location ourselves.
// Node 21+ (undici ≥ 6): status and headers are fully accessible.
// Node 18-20 (undici 5): response is opaque (status 0, empty headers);
//   we fall back to node:http / node:https for those runtimes.
async function resolveRedirect(code) {
  let res;
  try {
    res = await fetch(`${BASE}/${code}`, { redirect: 'manual' });
  } catch (err) {
    die(`Cannot reach backend at ${BASE} — ${err.message}`);
  }

  // Node 21+ path — status and Location readable
  if (res.status !== 0) {
    if (res.status === 404) die(`Unknown code: ${code}`);
    if (res.status < 300 || res.status >= 400)
      die(`Unexpected status ${res.status} for code "${code}"`);
    const loc = res.headers.get('location');
    if (loc) return loc;
  }

  // Node 18-20 fallback — opaque redirect, use built-in http/https
  return new Promise((resolve) => {
    const target = `${BASE}/${code}`;
    const mod = target.startsWith('https:') ? require('https') : require('http');
    const req = mod.get(target, (incoming) => {
      incoming.resume();
      if (incoming.statusCode === 404) die(`Unknown code: ${code}`);
      const loc = incoming.headers.location;
      if (!loc) die(`No redirect location returned for code "${code}"`);
      resolve(loc);
    });
    req.on('error', (err) => die(`Cannot reach backend — ${err.message}`));
  });
}

async function cmdOpen(code) {
  if (!code) die('Usage: snip open <code>');

  const location = await resolveRedirect(code);

  // Open in the OS default browser without shell injection risk
  const { spawnSync } = require('child_process');
  const [cmd, args] =
    process.platform === 'win32'  ? ['cmd',      ['/c', 'start', '', location]] :
    process.platform === 'darwin' ? ['open',     [location]] :
                                    ['xdg-open', [location]];

  const result = spawnSync(cmd, args, { stdio: 'ignore' });
  if (result.error) die(`Could not open browser: ${result.error.message}`);

  console.log(`Opening: ${location}`);
}

// ── Usage ──────────────────────────────────────────────────────────────────
function usage() {
  const api = process.env.SNIP_API || 'http://localhost:3000';
  process.stdout.write(
`snip — URL shortener CLI  (backend: ${api})

  snip add <url>     Shorten a URL and print the short link
  snip ls            List all short links (code / hits / URL)
  snip open <code>   Open a short link in the default browser
  snip help          Show this message

Environment:
  SNIP_API   Backend base URL  (default: http://localhost:3000)
`);
}

// ── Dispatch ───────────────────────────────────────────────────────────────
const [,, cmd, arg] = process.argv;

(async () => {
  switch (cmd) {
    case 'add':      await cmdAdd(arg);   break;
    case 'ls':       await cmdLs();       break;
    case 'open':     await cmdOpen(arg);  break;
    case 'help':
    case undefined:  usage();             break;
    default:
      usage();
      process.stderr.write(`\nsnip: unknown command "${cmd}"\n`);
      process.exit(1);
  }
})().catch(err => die(err.message));
