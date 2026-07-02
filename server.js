const PORT = parseInt(process.env.PORT ?? "3000", 10);
const BASE_URL =
  process.env.BASE_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`);
const PUBLIC_DIR = process.env.PUBLIC_DIR ?? null;

// ── In-memory store ────────────────────────────────────────────────────────
const links = new Map();

// ── Code generation (6 random base62 chars) ───────────────────────────────
const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += BASE62[Math.floor(Math.random() * 62)];
  }
  return code;
}

function generateUniqueCode() {
  let code;
  do {
    code = randomCode();
  } while (links.has(code));
  return code;
}

// ── CORS ──────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Helpers ───────────────────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function tryStatic(pathname) {
  if (!PUBLIC_DIR) return null;
  const rel = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = Bun.file(`${PUBLIC_DIR}/${rel}`);
  try {
    if (await file.exists()) return new Response(file);
  } catch {}
  return null;
}

// ── Server ────────────────────────────────────────────────────────────────
Bun.serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    const method = req.method.toUpperCase();

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
    }

    // POST /api/links — create a short URL
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      const rawUrl = body?.url;
      if (typeof rawUrl !== "string" || !/^https?:\/\/.+/i.test(rawUrl)) {
        return json({ error: "URL must start with http:// or https://" }, 400);
      }
      try {
        new URL(rawUrl);
      } catch {
        return json({ error: "Malformed URL" }, 400);
      }

      const code = generateUniqueCode();
      const link = {
        code,
        url: rawUrl,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    // GET /api/links — list all short URLs
    if (method === "GET" && pathname === "/api/links") {
      return json([...links.values()]);
    }

    // All other GETs: static file first, then short-code redirect
    if (method === "GET") {
      // Static file wins over a same-named short code
      const staticRes = await tryStatic(pathname);
      if (staticRes) return staticRes;

      // Short-code redirect
      if (pathname.length > 1) {
        const code = pathname.slice(1);
        const link = links.get(code);
        if (link) {
          link.hits++;
          return new Response(null, {
            status: 302,
            headers: { Location: link.url, ...CORS_HEADERS },
          });
        }
      }

      return json({ error: "Not found" }, 404);
    }

    return json({ error: "Method not allowed" }, 405);
  },
});

console.log(`Snip listening on port ${PORT}  →  ${BASE_URL}`);
