import assert from 'node:assert/strict';

// Read-only check against a running Next.js server and real Spring Boot backend.
const base = (process.env.SMOKE_FRONTEND_ORIGIN ?? 'http://127.0.0.1:3100') + '/api/v1';
const csrfResponse = await fetch(base + '/csrf');
assert.equal(csrfResponse.status, 200);
const csrf = await csrfResponse.json();
assert.ok(csrf.token);
assert.equal(csrf.headerName, 'X-CSRF-TOKEN');
assert.equal(csrfResponse.headers.get('cache-control'), 'no-store');
const cookies = csrfResponse.headers.getSetCookie();
assert.ok(cookies.some((cookie) => cookie.startsWith('JSESSIONID=')));
const cookie = cookies.map((value) => value.split(';')[0]).join('; ');
const repeated = await fetch(base + '/csrf', { headers: { cookie } });
assert.equal(repeated.status, 200);
assert.ok((await repeated.json()).token);
assert.ok(!repeated.headers.getSetCookie().some((value) => value.startsWith('JSESSIONID=')), 'Session should be reused');
const me = await fetch(base + '/admin/auth/me', { headers: { cookie } });
assert.equal(me.status, 401);
assert.equal(me.headers.get('cache-control'), 'no-store');
assert.equal((await me.json()).code, 'UNAUTHENTICATED');
const categories = await fetch(base + '/categories');
assert.equal(categories.status, 200);
assert.ok(Array.isArray(await categories.json()));
const products = await fetch(base + '/products?page=0&size=12');
assert.equal(products.status, 200);
assert.ok(Array.isArray((await products.json()).content));
console.log('PASS: CSRF, session cookie reuse, admin 401/no-store, categories/products 200. No business data written.');
