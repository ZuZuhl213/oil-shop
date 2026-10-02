#!/usr/bin/env python3
"""Disposable release checks. Requires Docker, Python 3 and a built backend image.

Never reads .env or connects to an existing database. All containers/networks
have unique names and are removed in finally. Only synthetic data is created.
"""
import concurrent.futures
import hashlib
import json
import pathlib
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import uuid

ROOT = pathlib.Path(__file__).resolve().parents[1]
IMAGE = 'hm-naturals-backend:plan13-local'
PREFIX = 'hm-release-' + uuid.uuid4().hex[:12]
DB, API, EDGE = [PREFIX + suffix for suffix in ('-db', '-api', '-edge')]
ORIGIN = 'https://rehearsal.example.test'
containers = []
checks = []


def run(*args, data=None):
    return subprocess.run(args, input=data, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, check=True).stdout


def sql(statement, database='release'):
    return run('docker', 'exec', '-i', DB, 'psql', '-v', 'ON_ERROR_STOP=1',
               '-U', 'release', '-d', database, '-At', data=statement.encode()).decode().strip()


def wait_for(operation, timeout=90):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            value = operation()
            if value:
                return value
        except (OSError, subprocess.CalledProcessError, urllib.error.URLError):
            pass
        time.sleep(0.3)
    raise AssertionError('Readiness condition timed out')


def request(base, path, body=None, headers=None):
    req = urllib.request.Request(base + path,
                                 data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'Origin': ORIGIN, **(headers or {})})
    try:
        response = urllib.request.urlopen(req, timeout=8)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        payload = response.read()
        return response.status, json.loads(payload) if payload else None, response.headers


def port(name, internal):
    mapping = run('docker', 'port', name, str(internal)).decode().strip()
    return 'http://' + mapping


def start_api(database='release', sheets=False):
    containers.append(API)
    run('docker', 'run', '-d', '--name', API, '--network', PREFIX,
        '--network-alias', 'backend', '-p', '127.0.0.1::8181',
        '-e', 'SERVER_PORT=8181', '-e', 'DB_HOST=' + DB, '-e', 'DB_DATABASE=' + database,
        '-e', 'DB_USERNAME=release', '-e', 'DB_PASSWORD=disposable-release-password',
        '-e', 'DB_SSL_MODE=disable', '-e', 'APP_SECURITY_ALLOWED_ORIGINS=' + ORIGIN,
        '-e', 'GOOGLE_SHEETS_SYNC_ENABLED=' + str(sheets).lower(),
        '-e', 'GOOGLE_SHEETS_POLL_DELAY_MS=500', IMAGE)
    base = port(API, 8181)
    wait_for(lambda: request(base, '/actuator/health/readiness')[0] == 200)
    return base


def snapshot(database):
    tables = ['categories', 'products', 'product_variants', 'vouchers',
              'orders', 'order_items', 'sheet_sync_jobs', 'admins']
    result = {table: sql(f"SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]') FROM {table} t;", database)
              for table in tables}
    result['sequences'] = sql("SELECT sequencename,last_value FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename;", database)
    result['migrations'] = sql('SELECT version,checksum,success FROM flyway_schema_history ORDER BY installed_rank;', database)
    return result


def passed(label):
    checks.append(label)
    print('PASS ' + label, flush=True)


try:
    run('docker', 'network', 'create', PREFIX)
    containers.append(DB)
    run('docker', 'run', '-d', '--name', DB, '--network', PREFIX,
        '-e', 'POSTGRES_DB=release', '-e', 'POSTGRES_USER=release',
        '-e', 'POSTGRES_PASSWORD=disposable-release-password', 'postgres:17.10-alpine3.24')
    wait_for(lambda: run('docker', 'exec', DB, 'pg_isready', '-U', 'release'))
    base = start_api()
    assert run('docker', 'exec', API, 'id', '-u').strip() == b'10001'
    # Run the same GET readiness probe at the configured, non-default port.
    run('docker', 'exec', API, 'curl', '--fail', '--silent',
        'http://127.0.0.1:8181/actuator/health/readiness')
    for path in ('/v3/api-docs', '/swagger-ui/index.html'):
        assert request(base, path)[0] != 200
    passed('production image: UID 10001, non-default-port GET readiness, Swagger disabled')

    sql("""
        CREATE EXTENSION pgcrypto;
        INSERT INTO admins(email,password_hash) VALUES ('synthetic@example.test',crypt('synthetic-password',gen_salt('bf')));
        INSERT INTO categories(name,slug) VALUES ('Synthetic','synthetic');
        INSERT INTO products(category_id,name,slug,sale_type) VALUES (1,'Synthetic oil','synthetic-oil','FIXED_PRICE');
        INSERT INTO product_variants(product_id,name,price,min_quantity,quantity_step) VALUES (1,'1L',100000,1,1);
        INSERT INTO vouchers(code,discount_type,discount_value,quantity) VALUES ('RELEASE','FIXED',10000,10);
    """)
    status, csrf, headers = request(base, '/api/v1/csrf')
    cookie = headers['Set-Cookie'].split(';')[0]
    status, _, headers = request(base, '/api/v1/admin/auth/login',
                                 {'email': 'synthetic@example.test', 'password': 'synthetic-password'},
                                 {'Cookie': cookie, csrf['headerName']: csrf['token']})
    assert status == 200
    cookie_header = headers['Set-Cookie']
    assert 'Secure' in cookie_header and 'HttpOnly' in cookie_header and 'Path=/api' in cookie_header
    cookie = cookie_header.split(';')[0]
    assert request(base, '/api/v1/admin/auth/me', headers={'Cookie': cookie})[0] == 200
    for path in ('/v3/api-docs', '/swagger-ui/index.html'):
        docs_status, docs_body, _ = request(base, path, headers={'Cookie': cookie})
        assert docs_status == 404, (path, docs_status, docs_body)
    bodies, keys, receipts = [], [], []
    for index in range(4):
        body = {'orderType': 'ORDER', 'customerName': 'Synthetic ' + str(index), 'phone': '0901234567',
                'voucherCode': 'RELEASE', 'items': [{'variantId': '1', 'quantity': 1}]}
        key = str(uuid.uuid4())
        status, receipt, _ = request(base, '/api/v1/orders', body, {'Idempotency-Key': key})
        assert status == 201 and receipt['totalAmount'] == 90000
        bodies.append(body)
        keys.append(key)
        receipts.append(receipt)
    sql("""
        UPDATE sheet_sync_jobs SET status='RETRY',retry_count=2,last_error='SHEETS_UNAVAILABLE' WHERE id=2;
        UPDATE sheet_sync_jobs SET status='PROCESSING',locked_at=now()-interval '6 minutes',locked_by='old-process' WHERE id=3;
        UPDATE sheet_sync_jobs SET status='SUCCEEDED' WHERE id=4;
    """)
    before = snapshot('release')
    run('docker', 'restart', '--time', '25', API)
    # Docker may allocate a different host port when restarting a container
    # published with an ephemeral HostPort. Refresh the client address.
    base = port(API, 8181)
    wait_for(lambda: request(base, '/actuator/health/readiness')[0] == 200)
    assert request(base, '/api/v1/admin/auth/me', headers={'Cookie': cookie})[0] == 401
    assert snapshot('release') == before
    status, replay, _ = request(base, '/api/v1/orders', bodies[0], {'Idempotency-Key': keys[0]})
    assert status == 200 and replay == receipts[0]
    passed('real process restart: session invalidated; orders, snapshots, voucher counts, keys and all outbox states preserved')

    run('docker', 'stop', DB)
    wait_for(lambda: request(base, '/actuator/health/readiness')[0] == 503)
    assert request(base, '/actuator/health/liveness')[0] == 200
    run('docker', 'start', DB)
    wait_for(lambda: request(base, '/actuator/health/readiness')[0] == 200)
    passed('running process: DB down => readiness 503, liveness 200; readiness recovers')

    dump = run('docker', 'exec', DB, 'pg_dump', '-U', 'release', '-d', 'release', '-Fc', '--no-owner')
    sql('CREATE DATABASE restored;', 'postgres')
    run('docker', 'exec', '-i', DB, 'pg_restore', '-U', 'release', '-d', 'restored',
        '--no-owner', '--exit-on-error', data=dump)
    assert snapshot('restored') == before
    run('docker', 'rm', '-f', API)
    containers.remove(API)
    base = start_api('restored')
    status, replay, _ = request(base, '/api/v1/orders', bodies[0], {'Idempotency-Key': keys[0]})
    assert status == 200 and replay == receipts[0]
    status, _, _ = request(base, '/api/v1/orders', bodies[0], {'Idempotency-Key': str(uuid.uuid4())})
    assert status == 201 and sql('SELECT max(id) FROM orders;', 'restored') == '5'
    assert sql('SELECT used_count FROM vouchers WHERE id=1;', 'restored') == '5'
    passed('pg_dump/pg_restore into separate DB: exact table/sequence/migration equality; replay and next ID=5')
    print('Synthetic dump SHA256: ' + hashlib.sha256(dump).hexdigest(), flush=True)

    run('docker', 'rm', '-f', API)
    containers.remove(API)
    base = start_api('restored', sheets=True)
    wait_for(lambda: sql("SELECT count(*) FROM sheet_sync_jobs WHERE status='RETRY' AND last_error='SHEETS_CONFIGURATION';", 'restored') == '4')
    assert sql('SELECT count(*) FROM orders;', 'restored') == '5'
    assert sql("SELECT count(*) FROM sheet_sync_jobs WHERE status='SUCCEEDED';", 'restored') == '1'
    passed('failed Sheets configuration: order commits remain; expired PROCESSING reclaimed; SUCCEEDED job untouched')

    with tempfile.TemporaryDirectory(prefix=PREFIX) as scratch:
        # Exercise the production edge rules with the real backend as the test
        # upstream. Browser/Next integration is exercised by test:release:e2e.
        config = pathlib.Path(scratch) / 'nginx.conf'
        config.write_text((ROOT / 'deploy/nginx.conf').read_text().replace('frontend:3000', 'backend:8181'))
        containers.append(EDGE)
        run('docker', 'run', '-d', '--name', EDGE, '--network', PREFIX,
            '-p', '127.0.0.1::8080', '-v', str(config) + ':/etc/nginx/nginx.conf:ro', 'nginx:1.28-alpine')
        edge = port(EDGE, 8080)
        wait_for(lambda: request(edge, '/actuator/health/readiness')[0] == 200)
        for path, limit in [('/api/v1/admin/auth/login', 10), ('/api/v1/orders', 20), ('/api/v1/vouchers/validate', 60)]:
            with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
                responses = list(pool.map(lambda index: request(edge, path, {}, {
                    'X-Forwarded-For': '192.0.2.' + str(index), 'X-Real-IP': '192.0.2.' + str(index),
                }), range(limit + 1)))
            limited = [response for response in responses if response[0] == 429]
            assert len(limited) == 1, (path, [response[0] for response in responses])
            assert limited[0][1]['code'] == 'RATE_LIMITED' and limited[0][1]['traceId']
            assert limited[0][2]['Retry-After'] == '60'
        time.sleep(6.1)  # login bucket refills at one request per 6 seconds.
        assert request(edge, '/api/v1/admin/auth/login', {})[0] != 429
        passed('real edge 10/20/60 rate limits, JSON 429, refill; spoofed IP headers cannot evade buckets')

    missing = subprocess.run(['docker', 'run', '--rm', '-e', 'DB_HOST=unused',
                              '-e', 'DB_DATABASE=unused', '-e', 'DB_USERNAME=unused',
                              '-e', 'APP_SECURITY_ALLOWED_ORIGINS=' + ORIGIN, IMAGE],
                             capture_output=True, timeout=60)
    assert missing.returncode != 0 and b'DB_PASSWORD' in missing.stdout + missing.stderr
    passed('production startup without DB_PASSWORD fails before database access')
    print(json.dumps({'checks': len(checks), 'status': 'PASS', 'production_deployed': False}))
finally:
    for name in reversed(containers):
        subprocess.run(['docker', 'rm', '-f', '-v', name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(['docker', 'network', 'rm', PREFIX], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
