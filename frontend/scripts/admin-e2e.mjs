import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.dirname(frontend);
const scratch = await mkdtemp(path.join(tmpdir(), 'hm-admin-e2e-'));
const ready = path.join(scratch, 'backend-ready.json');
const baseURL = `http://127.0.0.1:${process.env.PLAN10_FRONTEND_PORT ?? '3200'}`;
const processes = [];
function run(command, args, cwd, env, log) {
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const output = log ? createWriteStream(log) : process.stdout;
  child.stdout.pipe(output, { end: false }); child.stderr.pipe(output, { end: false });
  const done = new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', (code) => resolve(code)); });
  const item = { child, done, exited: false }; child.on('exit', () => { item.exited = true; });
  processes.push(item); return item;
}
async function until(operation, description, timeout = 120000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { const result = await operation(); if (result) return result; } catch { /* wait for readiness */ }
    if (processes.some((item) => item.exited)) throw new Error(`${description}: child exited; logs: ${scratch}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${description} timed out; logs: ${scratch}`);
}
let successful = false;
try {
  await writeFile(ready, '', { mode: 0o600 });
  console.log('Building frontend and starting a disposable PostgreSQL/Spring test backend.');
  const build = run('npm', ['run', 'build'], frontend, {});
  if (await build.done !== 0) throw new Error('Frontend build failed');
  processes.splice(processes.indexOf(build), 1);
  const backend = run(path.join(repo, 'backend/gradlew'), ['integrationTest', '--tests', '*AdminBrowserFixtureIT', '--rerun-tasks', '--console=plain'], path.join(repo, 'backend'), {
    PLAN10_BROWSER_FIXTURE: '1', PLAN10_BROWSER_READY_FILE: ready, PLAN10_FRONTEND_ORIGIN: baseURL,
  }, path.join(scratch, 'backend.log'));
  const fixture = await until(async () => JSON.parse(await readFile(ready, 'utf8')), 'Backend');
  run('npm', ['run', 'start', '--', '--hostname', '127.0.0.1', '--port', new URL(baseURL).port], frontend, {
    BACKEND_API_ORIGIN: `http://127.0.0.1:${fixture.port}`,
  }, path.join(scratch, 'frontend.log'));
  await until(async () => (await fetch(baseURL + '/admin/login')).ok, 'Frontend');
  console.log('Running admin browser tests through the real Next proxy and Spring session cookies; Storage is a fake adapter.');
  const tests = run('npm', ['run', 'test:e2e', '--', 'e2e/admin-auth.spec.ts', 'e2e/admin-catalog.spec.ts', '--workers=1'], frontend, {
    PLAYWRIGHT_BASE_URL: baseURL, PLAN10_REAL_BACKEND: '1', PLAN10_ADMIN_EMAIL: fixture.email, PLAN10_ADMIN_PASSWORD: fixture.password,
  });
  const code = await tests.done;
  processes.splice(processes.indexOf(tests), 1);
  await writeFile(ready + '.stop', 'stop');
  const backendCode = await backend.done;
  if (code !== 0 || backendCode !== 0) throw new Error(`Admin tests failed (browser=${code}, backend=${backendCode}); logs: ${scratch}`);
  successful = true;
} finally {
  await writeFile(ready + '.stop', 'stop').catch(() => {});
  for (const item of processes) if (!item.exited) {
    try { process.kill(-item.child.pid, 'SIGTERM'); } catch { /* already exited */ }
  }
  if (successful) await rm(scratch, { recursive: true, force: true });
  else console.log(`Failure logs retained at ${scratch}`);
}
