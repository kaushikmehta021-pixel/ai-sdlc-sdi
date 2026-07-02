# Snip — URL Shortener Backend

Minimal URL shortener API built with [Bun](https://bun.sh). Zero dependencies, single file.

## Quick start

```sh
bun run server.js
# or
bun start
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `BASE_URL` | `http://localhost:<PORT>` | Origin used in `shortUrl` values |
| `RAILWAY_PUBLIC_DOMAIN` | — | Auto-detected on Railway; used as fallback origin |
| `PUBLIC_DIR` | — | Folder to serve as static files (`/` → `index.html`) |

> When `PUBLIC_DIR` is set, a matching static file always wins over a short-code redirect.

## API

### `POST /api/links`

Create a short URL.

```
POST /api/links
Content-Type: application/json

{ "url": "https://example.com" }
```

**201 Created**
```json
{
  "code": "aB3xYz",
  "url": "https://example.com",
  "shortUrl": "http://localhost:3000/aB3xYz",
  "hits": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Returns **400** for invalid JSON or a non-http(s) URL.

---

### `GET /api/links`

Return all stored links as a JSON array (same shape as above).

---

### `GET /:code`

Redirect (**302**) to the original URL and increment `hits`.  
Returns **404** if the code is unknown.
