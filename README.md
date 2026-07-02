# Snip — URL Shortener

One backend, two clients. A minimal URL shortener built as three independent layers,
each on its own git branch and wired together here as a submodule.

```
┌──────────────────────────────────────────────────────────────┐
│  Browser  ──►  Angular 19 SPA       (frontend/)              │
│                                                │              │
│  Terminal ──►  Node.js CLI          (cli/)     │  HTTP        │
│                                                ▼              │
│                              Bun server  (backend/)           │
│                              In-memory Map · zero deps        │
└──────────────────────────────────────────────────────────────┘
```

---

## API contract

All responses carry open CORS headers; `OPTIONS` preflight is handled on every route.

| Method   | Path           | Request body            | Success response                                         | Error           |
|----------|----------------|-------------------------|----------------------------------------------------------|-----------------|
| `POST`   | `/api/links`   | `{ "url": "https://…" }` | `201 { code, url, shortUrl, hits, createdAt }`          | `400 { error }` |
| `GET`    | `/api/links`   | —                       | `200` array of link objects (same shape)                 | —               |
| `GET`    | `/:code`       | —                       | `302 → originalUrl` (increments `hits`)                  | `404 { error }` |

---

## Repository layout

```
main  ← this superproject branch
├── backend/    git submodule  →  branch: backend   (Bun server)
├── frontend/   git submodule  →  branch: frontend  (Angular 19 SPA)
└── cli/        git submodule  →  branch: cli       (Node.js CLI)
```

Each branch is a fully independent, deployable unit with its own `package.json` and
`README.md`. The `main` branch contains only this README, `.gitmodules`, and the
commit-pointer for each submodule.

---

## Clone

A plain `git clone` leaves the submodule folders **empty**. Always recurse:

```sh
git clone --recurse-submodules \
  https://github.com/kaushikmehta021-pixel/ai-sdlc-sdi.git snip
cd snip
```

Already cloned without the flag?

```sh
git submodule update --init --recursive
```

---

## Run all three pieces

### 1 · Backend  `backend/`

Requires [Bun](https://bun.sh).

```sh
cd backend
bun run server.js
# → Snip listening on port 3000  →  http://localhost:3000
```

| Env variable            | Default                      | Purpose                                  |
|-------------------------|------------------------------|------------------------------------------|
| `PORT`                  | `3000`                       | HTTP port                                |
| `BASE_URL`              | `http://localhost:<PORT>`    | Origin used in every `shortUrl`          |
| `RAILWAY_PUBLIC_DOMAIN` | —                            | Auto-detected on Railway (fallback URL)  |
| `PUBLIC_DIR`            | —                            | Serve a static folder (`/` → index.html) |

### 2 · Frontend  `frontend/`

```sh
cd frontend
npm install
npx ng serve          # dev server → http://localhost:4200
```

Production build (output lands in `dist/snip-frontend/browser/`):

```sh
npx ng build
```

Serve the SPA through the backend (no separate web server needed):

```sh
cd backend
PUBLIC_DIR=../frontend/dist/snip-frontend/browser bun run server.js
```

### 3 · CLI  `cli/`

Requires Node.js ≥ 18.

```sh
cd cli
node cli.js help

# or install globally
npm install -g .
snip help
```

```
snip add https://example.com/very/long/path   # prints the short link
snip ls                                        # code / hits / URL table
snip open <code>                               # opens in default browser
```

Set `SNIP_API` to target a different backend:

```sh
SNIP_API=https://snip.example.com snip ls
```

Platform wrappers (`chmod +x snip` on Unix):

| File        | Shell                     |
|-------------|---------------------------|
| `snip`      | bash / zsh                |
| `snip.cmd`  | Windows Command Prompt    |
| `snip.ps1`  | PowerShell                |

---

## Submodule update workflow

Each submodule folder is a full git repo checked out on its own branch. Work inside it
normally, then bump the superproject pointer.

```sh
# ── 1. Edit and push inside a layer ────────────────────────────────────────
cd backend            # (or frontend/ or cli/)
# ... make changes ...
git add .
git commit -m "feat: ..."
git push              # pushes to origin/backend

# ── 2. Update the superproject pointer ─────────────────────────────────────
cd ..
git submodule update --remote backend   # pull latest commit from tracked branch
git add backend
git commit -m "chore: bump backend submodule"
git push
```

To advance all three at once:

```sh
git submodule update --remote
git add backend frontend cli
git commit -m "chore: bump all submodules"
git push
```

> **Tip:** `git submodule update --remote` fetches the tip of the tracked branch.
> Without `--remote` it resets to the SHA already recorded in the superproject — useful
> when you want to reproduce an exact state.
