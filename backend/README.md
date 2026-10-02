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

Set backend-only `SUPABASE_URL` (HTTPS project origin), `SUPABASE_MEDIA_BUCKET` (an existing public media bucket), and `SUPABASE_SERVICE_ROLE_KEY`. The service key must never enter `NEXT_PUBLIC_*`, browser storage, responses or logs. The adapter sends bytes to Supabase Storage with a 5-second connect / 15-second request timeout and no redirects. Missing configuration, storage errors and timeouts return sanitized 503; there is no fabricated success URL. JPEG/PNG use JDK ImageIO; WebP uses the pinned TwelveMonkeys 3.12.0 reader.

Upload never writes product data. Saving a product separately validates that `thumbnailUrl` belongs to the configured HTTPS public bucket. Existing images are not deleted; unused uploads need a separate operator cleanup policy. No bucket is created or published by the application.

Verification:

```bash
./gradlew integrationTest --tests '*MediaUploadIT'
./gradlew test --tests '*SupabaseMediaClientTest' --tests '*ThumbnailUrlPolicyTest'
./gradlew check
```

Tests use disposable PostgreSQL and a fake Storage adapter, with a mocked HTTP client for the Supabase transport. Real Supabase credentials/bucket access and production upload limits remain unverified. `AdminBrowserFixtureIT` is opt-in and runs only via `frontend/npm run test:admin:e2e`; it never reads `backend/.env` or touches the user's database.
