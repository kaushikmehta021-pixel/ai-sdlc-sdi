#!/usr/bin/env node
// scripts/build-bundle.mjs
//
// Assembles the Snip release bundle. Zero npm dependencies.
// Works on Windows, macOS, Linux, and in CI.
//
// Usage:
//   node scripts/build-bundle.mjs          # assemble only
//   node scripts/build-bundle.mjs --push   # assemble + push bundle + main

import { execSync }                                   from 'node:child_process';
import { cpSync, existsSync, rmSync, writeFileSync }  from 'node:fs';
import { dirname, join }                              from 'node:path';
import { fileURLToPath }                              from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BD   = join(ROOT, 'bundle');   // bundle/ is a submodule — dir already exists
const PUSH = process.argv.includes('--push');

// ── helpers ────────────────────────────────────────────────────────────────

function sh(cmd, cwd = ROOT) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

/** Run git commit with an identity that works in bare CI environments. */
function gitCommit(message, cwd = ROOT) {
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME:     process.env.GIT_AUTHOR_NAME     || 'Snip CI',
    GIT_AUTHOR_EMAIL:    process.env.GIT_AUTHOR_EMAIL    || 'ci@snip.local',
    GIT_COMMITTER_NAME:  process.env.GIT_COMMITTER_NAME  || 'Snip CI',
    GIT_COMMITTER_EMAIL: process.env.GIT_COMMITTER_EMAIL || 'ci@snip.local',
  };
  console.log(`  $ git commit -m "${message}"`);
  execSync(`git commit -m ${JSON.stringify(message)}`, { stdio: 'inherit', cwd, env });
}

/** Returns true when there are staged changes in cwd. */
function hasStagedChanges(cwd = ROOT) {
  try   { execSync('git diff --cached --quiet', { cwd, stdio: 'ignore' }); return false; }
  catch { return true; }
}

function write(relPath, content) {
  writeFileSync(join(BD, relPath), content, 'utf8');
  console.log(`  ✓ bundle/${relPath}`);
}

function section(n, title) {
  const bar = '─'.repeat(Math.max(0, 50 - title.length));
  console.log(`\n── ${n} / ${title} ${bar}`);
}

// ── 1. Pull submodules to their branch tips ────────────────────────────────

section(1, 'Updating submodules');
sh('git submodule update --init --remote backend frontend cli');

// ── 2. Build the Angular frontend ──────────────────────────────────────────

section(2, 'Building frontend');
const frontendDir = join(ROOT, 'frontend');
sh('npm install --prefer-offline --no-audit --no-fund', frontendDir);
sh('npx ng build', frontendDir);

const browserDir = join(frontendDir, 'dist', 'snip-frontend', 'browser');
const indexHtml  = join(browserDir, 'index.html');
if (!existsSync(indexHtml)) {
  process.stderr.write(`\nFATAL: build output missing — ${indexHtml}\n`);
  process.exit(1);
}
console.log(`  ✓ index.html present`);

// ── 3. Assemble bundle/ ────────────────────────────────────────────────────

section(3, 'Assembling bundle/');

// 3a — server and CLI scripts (copy as-is)
cpSync(join(ROOT, 'backend', 'server.js'), join(BD, 'server.js'), { force: true });
console.log('  ✓ bundle/server.js');

cpSync(join(ROOT, 'cli', 'cli.js'), join(BD, 'cli.js'), { force: true });
console.log('  ✓ bundle/cli.js');

// 3b — SPA static output → bundle/public/
const publicDst = join(BD, 'public');
if (existsSync(publicDst)) rmSync(publicDst, { recursive: true, force: true });
cpSync(browserDir, publicDst, { recursive: true });
console.log('  ✓ bundle/public/');

// 3c — deployment configs
write('.env',
`PUBLIC_DIR=./public
`);

write('package.json', JSON.stringify({
  name: 'snip-bundle',
  version: '1.0.0',
  scripts: { start: 'bun server.js' },
}, null, 2) + '\n');

write('Dockerfile', [
  'FROM oven/bun:1-alpine',
  'WORKDIR /app',
  'COPY . .',
  'ENV PORT=3000',
  'ENV PUBLIC_DIR=./public',
  'EXPOSE 3000',
  'CMD ["bun", "server.js"]',
  '',
].join('\n'));

write('.dockerignore', [
  '.env',
  'node_modules/',
  '*.log',
  '',
].join('\n'));

write('railway.json', JSON.stringify({
  build: { builder: 'DOCKERFILE' },
}, null, 2) + '\n');

// ── 4. Commit inside bundle/ submodule ─────────────────────────────────────

section(4, 'Committing bundle/');
sh('git add -A', BD);

if (!hasStagedChanges(BD)) {
  console.log('  ─ nothing to commit in bundle/ (no changes)');
} else {
  gitCommit('chore: automated bundle [skip ci]', BD);
  if (PUSH) {
    // Submodule checkouts are often detached HEAD — use HEAD:bundle explicitly.
    sh('git push origin HEAD:bundle', BD);
    console.log('  ✓ pushed to origin/bundle');
  }
}

// ── 5. Bump superproject pointers ─────────────────────────────────────────

section(5, 'Bumping superproject pointers');
sh('git add backend frontend cli bundle', ROOT);

if (!hasStagedChanges(ROOT)) {
  console.log('  ─ nothing to commit in superproject (no changes)');
} else {
  gitCommit('chore: bump submodule pointers', ROOT);
  if (PUSH) {
    sh('git push', ROOT);
    console.log('  ✓ pushed main branch');
  }
}

console.log('\n✓  build-bundle complete.\n');
