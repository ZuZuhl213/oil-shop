# Oil Shop backend

Spring Boot backend for HM Naturals: public catalog, voucher validation, retail orders and quote requests; admin session/CSRF, catalog and order management, plus validated media uploads. Customers do not need an account.

## Requirements

- JDK 21
- Docker with Docker Compose

Pinned foundation versions:

- Spring Boot 4.1.1
- Gradle 9.7.1 (wrapper)
- springdoc-openapi 3.1.1
- Testcontainers 2.0.5
- PostgreSQL 17.10

## Run locally

From the repository root:

```bash
cp backend/.env.example backend/.env
# Set DB_PASSWORD in backend/.env before starting.
docker compose --env-file backend/.env up -d db

set -a
. ./backend/.env
set +a
./backend/gradlew -p backend bootRun
```

If PostgreSQL is already running, skip the Compose command and set its connection values in `backend/.env`. If port 5432 is already in use and Compose should run another database, set `DB_PORT` to a free host port.

Readiness is available at:

```bash
curl http://localhost:8080/actuator/health/readiness
```

The expected public response is `{"status":"UP"}`. Component details are intentionally hidden. The local database contains no seeded administrator account or default password.

Stop PostgreSQL with:

```bash
docker compose down
```

## Bootstrap the first admin

The bootstrap command is available only through the `bootstrap-admin` profile. It creates one active admin, hashes the password with BCrypt, and refuses to overwrite an existing email.

From the repository root, load the database connection and enter the bootstrap credentials without putting the password in a file or command history:

```bash
set -a
. ./backend/.env
set +a
read -r "BOOTSTRAP_ADMIN_EMAIL?Admin email: "
read -rs "BOOTSTRAP_ADMIN_PASSWORD?Admin password: "
echo
export BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
SPRING_PROFILES_ACTIVE=local,bootstrap-admin ./backend/gradlew -p backend bootRun --args='--spring.main.web-application-type=none'
unset BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
```

Normal startup never runs this command and there is no public registration endpoint.

## Tests

Docker must be running because integration tests use PostgreSQL through Testcontainers.

```bash
cd backend
./gradlew test integrationTest
```

`test` excludes classes ending in `IT`; `integrationTest` runs only those classes.

## Configuration

The example environment is in `.env.example`. Spring builds its JDBC connection from `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, and `DB_DATABASE`, then authenticates with `DB_USERNAME` and `DB_PASSWORD`. `DB_CONNECTION` must be `postgresql`, the PostgreSQL JDBC subprotocol. The default profile requires `DB_PASSWORD`; only the `local` and `test` profiles provide non-production fallback values. Hibernate validates the schema and Flyway owns schema changes.

## Database boundary

- Internal identifiers are `Long`; REST DTOs added by later plans must encode them as decimal strings.
- Money is nullable `Long` where quote requests require it; quantities are `BigDecimal` and the database rejects values outside 0.01–99999999.99 or with more than two decimal places.
- `Instant` maps to PostgreSQL `TIMESTAMPTZ`. Database triggers own `updated_at` for both JPA and direct SQL updates.
- Entities are not HTTP response models. They intentionally have no recursive `equals`, `hashCode`, or `toString` implementations.
- Cross-table rules such as FIXED_PRICE requiring a price and order items matching the product sale type belong to services in plans 04–06; PostgreSQL enforces all local row invariants.
- Do not edit an applied migration. Add a new versioned migration for later schema changes.

## Admin media (plan 10)

`POST /api/v1/admin/media` accepts one multipart `file` and requires the existing admin session, allowed Origin and CSRF token. It returns `201 {url, objectKey}`. JPEG, PNG and WebP must match their declared MIME and decode successfully, at most 5 MiB / 40 million pixels. SVG, traversal filenames and invalid images return 422; size violations return 413. Object keys are generated UUIDs under `products/`; client filenames never become storage paths.

For the default Supabase provider, set backend-only `SUPABASE_URL` (HTTPS project origin), `SUPABASE_MEDIA_BUCKET` (an existing public media bucket), and `SUPABASE_SERVICE_ROLE_KEY`. The service key must never enter `NEXT_PUBLIC_*`, browser storage, responses or logs. The adapter sends bytes to Supabase Storage with a 5-second connect / 15-second request timeout and no redirects. Missing configuration, storage errors and timeouts return sanitized 503; there is no fabricated success URL. JPEG/PNG use JDK ImageIO; WebP uses the pinned TwelveMonkeys 3.12.0 reader.

Upload never writes product data. Saving a product separately validates image URLs against configured Supabase bucket / R2 public origins and the gallery contract below. Existing images are not deleted; unused uploads need a separate operator cleanup policy. No bucket is created or published by the application.

Verification:

```bash
./gradlew integrationTest --tests '*MediaUploadIT'
./gradlew test --tests '*SupabaseMediaClientTest' --tests '*ThumbnailUrlPolicyTest'
./gradlew check
```

Tests use disposable PostgreSQL and a fake Storage adapter, with a mocked HTTP client for the Supabase transport. Real Supabase credentials/bucket access and production upload limits remain unverified. `AdminBrowserFixtureIT` is opt-in and runs only via `frontend/npm run test:admin:e2e`; it never reads `backend/.env` or touches the user's database.

## Conditional admin notes (Plan 11.1)

`PATCH /api/v1/admin/orders/{id}/note` accepts `{adminNote, expectedAdminNote}`. Both values are nullable strings (max 2000 characters); `expectedAdminNote` must be present, otherwise 400. Blank normalizes to null, other values are trimmed. Within the existing transaction and pessimistic order row lock, compare the expected and stored note before writing. A mismatch returns 409 `NOTE_CONFLICT` and preserves the stored note. Status changes do not invalidate this comparison; no schema migration or shared updatedAt token is used. Value comparison is the V1 contract and cannot detect A → B → A changes. Existing auth, CSRF, order transitions and cancellation/voucher transactions remain in effect.

## Google Sheets mirror (Plan 12)

V4 adds a persistent `sheet_sync_jobs` outbox and backfills one pending job per existing order. Order creation and actual status/admin-note changes enqueue within the business transaction; replay and no-op writes do not enqueue. Sync failure cannot roll back a committed order. The worker loads the current snapshot, overwrites `Orders_Raw` at `order.id + 1` with `valueInputOption=RAW`, and ensures grid capacity first. It never writes Orders_Working or reads Sheets to update the database.

Set backend-only `GOOGLE_SHEETS_SPREADSHEET_ID` and `GOOGLE_SHEETS_CREDENTIALS_PATH` (a trusted mounted service-account JSON), share the spreadsheet with that service account, then enable `GOOGLE_SHEETS_SYNC_ENABLED=true`. Default is disabled; mutations still record jobs. `GOOGLE_SHEETS_POLL_DELAY_MS` defaults to 5000. Prepare/protect the raw header and column order before enabling. Credentials stay outside Git and browser code. Google auth library is pinned to 1.50.0 and disables automatic token retries; Sheets requests use 5-second connect / 15-second request timeouts with no redirects.

One synchronized worker in the single-instance V1 backend claims up to 20 jobs per tick, one just before each send. Earlier unsucceeded jobs block successors of the same order. Claims use short transactions, skip locked rows and a 5-minute lease; network calls run outside database transactions. Retry delays are 5s, 30s, 2m, 10m, then 1h indefinitely. Errors persist as controlled diagnostic codes. A timeout after a remote write retries the same row. Stop the old process fully before starting its replacement: lease tokens protect database acknowledgements, but cannot fence an HTTP call already dispatched to Google.

The versionable runbook and three-tab templates are in [google-sheets.md](../docs/operations/google-sheets.md) and [sheets/README.md](../docs/operations/sheets/README.md). Working rows carry manually entered order-code values, with lookups keyed by code and manual notes moved together on whole-row sorting. Statistics aggregates raw snapshots, separates expected revenue from completed order value (not payment received), excludes quote money and finds new customers using full phone-normalized history. Deploy the Apps Script and configure its reporting period separately; no live spreadsheet is created automatically. Use [sheet-sync-monitor.sql](../docs/operations/sheet-sync-monitor.sql) to inspect RETRY, expired leases and blocked jobs; these are manual checks, not configured automatic alerts. Deployment requires one backend process with no overlap between old and new processes. See [verification evidence](../docs/operations/plan-12-verification.md) for local tests and the separate synthetic spreadsheet smoke.

```bash
./gradlew integrationTest --tests '*SheetSyncIT' --tests '*SheetSyncMigrationIT'
./gradlew test --tests '*GoogleSheetsAdapterTest'
./gradlew check
# From repository root:
node --test docs/operations/sheets/statistics.test.cjs
```

Transport tests and disposable PostgreSQL tests do not verify live Google permissions, quotas, three-tab setup or Apps Script triggers. Those need a dedicated test spreadsheet and the runbook smoke before enabling production sync.

## Release verification

The [Dockerfile](Dockerfile) pins Java 21 image digests, runs UID 10001 and defaults to the prod profile. Supply DB_HOST/DB_DATABASE/DB_USERNAME/DB_PASSWORD and explicit APP_SECURITY_ALLOWED_ORIGINS. Production defaults to PostgreSQL sslmode=verify-full; mount the database CA. DB_POOL_MAX_SIZE/DB_POOL_MIN_IDLE default to 10/2. Keep one backend process and one Sheets worker, with no overlap during replacement.

```bash
docker build -t hm-naturals-backend:plan13-local .
python3 scripts/release-rehearsal.py
./gradlew test integrationTest bootJar
```

The [rehearsal](scripts/release-rehearsal.py) never reads .env and provisions only disposable synthetic PostgreSQL containers/databases. It verifies process restart/session loss, database readiness failure/recovery, exact pg_dump/restore equality including sequences/idempotency/outbox, Sheets failure recovery, production startup secrets and real edge rate limits. The [Nginx reference](deploy/nginx.conf) belongs before the Next frontend; putting it behind Next would group customers under the proxy IP. Real domain/TLS and Vercel edge policies still require deployment configuration.

From frontend use `npm run test:release:e2e` for the real Next/Spring/PostgreSQL browser suite, and `npm run test:e2e -- --workers=2` for general UI checks. Storage in the browser fixture is a fake adapter. A separate sentinel build can be scanned with `PUBLIC_SECRET_SENTINELS=... node scripts/check-public-secrets.mjs`.

Local evidence and open gates are in [release-results.md](../docs/operations/release-results.md); docs stay local/ignored by repository policy. HTTPS browser/provider smoke, backup retention and Vercel's media payload mismatch remain launch checks. Full lint currently has an existing protected HeroSection error; no production deployment is claimed.

## Cloudflare R2 product images

The upload endpoint remains `POST /api/v1/admin/media` with an authenticated admin session, valid Origin and CSRF token. Files are decoded/validated by the backend before upload (JPEG/PNG/WebP, up to 5 MiB and 40 million pixels). R2 stores bytes; PostgreSQL stores public URLs. Default `MEDIA_PROVIDER=supabase` preserves existing deployments.

### Set up R2

1. In Cloudflare Dashboard, enable R2 and create a bucket dedicated to public product images, for example `hm-naturals-products`.
2. Under the bucket's Settings, attach a custom domain you control, for example `media.your-domain.vn`. Wait for it to become active with HTTPS. Public access is configured at the bucket domain, not with object ACLs. `r2.dev` may be used for local rehearsal, but is not intended for production.
3. Create R2 S3 credentials with **Object Read & Write** scoped to this bucket. Store Access Key ID and Secret Access Key in backend secrets. Copy the exact S3 endpoint from Dashboard, including a jurisdiction hostname if applicable.
4. Set these backend variables (replace examples locally; do not send secrets to chat or Git):

```dotenv
MEDIA_PROVIDER=r2
R2_ENDPOINT=https://<32-character-account-id>.r2.cloudflarestorage.com
R2_BUCKET=hm-naturals-products
R2_ACCESS_KEY_ID=<backend-secret>
R2_SECRET_ACCESS_KEY=<backend-secret>
R2_PUBLIC_BASE_URL=https://media.your-domain.vn
```

Keep `SUPABASE_URL` and `SUPABASE_MEDIA_BUCKET` configured while old Supabase URLs are still referenced. Selecting R2 does not migrate or delete old objects. R2 public URLs use `R2_PUBLIC_BASE_URL/products/{uuid}.{ext}`, not the authenticated S3 endpoint.

5. Restart the backend. Invalid provider, missing R2 credentials, unsafe endpoints or malformed public origin fail startup. Flyway V5 adds ordered product images and backfills existing thumbnails without changing URLs; back up the DB before applying migrations to a deployed environment.
6. In admin, upload multiple images, choose a cover, reorder and save. Verify the public product API returns `images`, then open product detail and check arrows/swipe/autoplay. Reload to verify persistence; product cards still use `thumbnailUrl`.
7. With the real bucket, verify PNG/JPEG/WebP upload, a valid image near 5 MiB, rejection above 5 MiB, and anonymous HTTPS image GET from the public domain. Check reverse-proxy/hosting upload limits; R2 does not bypass the existing 6 MiB Next proxy limit or a lower hosting limit.

No browser-to-R2 upload is used, so bucket upload CORS is unnecessary. Ordinary public `<img>` display is supported; canvas/WebGL use needs separate CORS review. Upload uses AWS SDK v2, region `auto`, bounded timeouts/retries, path-style access and disabled chunked encoding as required by Cloudflare's Java example.

### Optional live R2 smoke test

After configuring the six R2/provider variables in `backend/.env`, run from `backend/`:

```bash
HM_R2_LIVE_SMOKE=1 JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew integrationTest --tests '*R2LiveSmokeIT' --rerun-tasks
```

This opt-in test uses real R2 credentials with a disposable PostgreSQL Testcontainer. It uploads PNG/JPEG/WebP and a valid 5 MiB image through the authenticated admin API, checks anonymous public GET bytes/content type, saves and reloads gallery order/cover, and checks upload size/Origin rejection. It deletes only its newly generated objects in cleanup and verifies they are absent. Existing bucket objects and the configured application database are untouched. Without `HM_R2_LIVE_SMOKE=1`, the test is skipped. Docker and public bucket access are required; this does not verify the deployed host/proxy or browser with live R2.

### Gallery contract and recovery

Read `ProductDto` now includes `images: [{id, url, sortOrder}]` and `imagesRevision`. Product create/update accepts ordered `imageUrls` (maximum 10, no duplicates); `thumbnailUrl` must be in that list, or null when the list is empty. Update sends `expectedImagesRevision`; stale media edits return `409 IMAGE_CONFLICT` and roll back the whole edit. Identical media data does not increment the revision. List reads batch images for the page.

Legacy creates with only thumbnail create one image. Legacy updates that keep thumbnail preserve images; changing the cover of an existing gallery requires the new contract. Read fields `images`, `imagesRevision` and `variants` are not accepted as write fields.

Uploads belong to a form draft until Save. Failed uploads preserve successes; failed saves preserve draft URLs/order/cover. Conflict or an unknown save result requires an explicit GET/review before retry, including create reconciliation by the attempted slug. Review compares saved data without automatically overwriting or replaying the draft.

Removing an image removes its DB association only after Save; it does not delete the R2 file. Abandoned uploads remain orphaned. Automatic object deletion/retry cleanup and migration of existing provider objects are separate work. Do not mark application storage deletion complete in the deploy checklist.

References: [Cloudflare Java SDK](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-java/), [public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/), [R2 credentials](https://developers.cloudflare.com/r2/api/tokens/).
