# Real Estate Listing Platform

A scalable real-estate listing platform in TypeScript, inspired by 99acres and NoBroker.

| Part | Technology | Status |
| --- | --- | --- |
| Backend | Node.js, Express 5, TypeScript | Complete |
| Database | PostgreSQL 16 | Complete, with 50,000 seed listings |
| API documentation | OpenAPI 3.1, Swagger UI at `/api-docs` | Complete |
| Frontend | Next.js, Tailwind CSS | Not started |

## Run the backend

You need Node.js 22 or later and PostgreSQL 16.

1. Create the database and load the tables and test data:

   ```bash
   createdb property
   psql -d property -f db/schema.sql
   psql -d property -f db/seed.sql
   ```

2. Install the API and create its settings file:

   ```bash
   cd api
   npm install
   cp .env.example .env
   ```

3. In `.env`, set `DATABASE_URL` and `JWT_SECRET`. The file shows how to generate a secret.

4. Start the API:

   ```bash
   npm run dev
   ```

The API runs at `http://localhost:4000`, and its documentation is at [`http://localhost:4000/api-docs`](http://localhost:4000/api-docs). The raw OpenAPI file is at `/api-docs.json`.

For production, run `npm run build`, then `npm start`.

## API overview

All routes start with `/api/v1`. The Swagger page has full request and response details, and you can try each route there.

| Method | Route | Login | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Create an account |
| POST | `/auth/login` | No | Log in |
| POST | `/auth/refresh` | Cookie | Get a new access token |
| POST | `/auth/logout` | Cookie | Log out |
| GET | `/auth/me` | Yes | Get the current user |
| GET | `/properties` | No | Search, filter, sort and paginate listings |
| POST | `/properties` | Yes | Create a listing |
| GET | `/properties/mine` | Yes | List your listings |
| GET | `/properties/{slug}` | No | Get a listing |
| GET | `/properties/{slug}/similar` | No | Get similar listings |
| PATCH | `/properties/{id}` | Owner | Edit a listing |
| DELETE | `/properties/{id}` | Owner | Delete a listing |
| POST | `/properties/{id}/images` | Owner | Upload an image |
| DELETE | `/properties/{id}/images/{imageId}` | Owner | Delete an image |
| POST | `/properties/{id}/inquiries` | Yes | Contact the owner |
| GET | `/inquiries/received` | Yes | List inquiries on your listings |
| GET | `/inquiries/sent` | Yes | List inquiries you sent |

`GET /health` confirms that the API can reach the database.

## Project structure

```
api/src/
  server.ts        Starts the server, the cleanup job and graceful shutdown
  app.ts           Middleware order and routes
  config.ts        Settings, checked at startup
  db.ts            Connection pool and transaction helper
  docs/            OpenAPI document
  lib/             Shared errors, pagination and cleanup
  middleware/      Login check, validation, rate limits and error handling
  modules/
    auth/          Accounts and tokens
    properties/    Listings, search, similar properties and images
    inquiries/     Contacting owners
db/
  schema.sql       Tables, rules and indexes
  seed.sql         One test user and 50,000 listings
```

Each module separates routes (HTTP), schemas (validation) and services (logic and queries).

## Design decisions

### Authentication

- **Two tokens:** a 15-minute JWT access token needs no database lookup, and a 30-day refresh token can be revoked.
- **Refresh token storage:** it travels in an `httpOnly`, `SameSite=Lax` cookie limited to the auth routes, and is `Secure` in production. Only its SHA-256 hash is stored.
- **Rotation and reuse detection:** each refresh token works once. If an old one is used again, every token from that login is cancelled, while other devices stay logged in.
- **Passwords:** hashed with bcrypt at 12 rounds. Failed logins return the same message and take similar time, whether or not the email exists.
- **Known limitation:** registering with a taken email returns 409, which reveals that it exists. Closing this needs an email verification flow.

### Listings and ownership

- **Reads are public:** the brief lists viewing under authenticated users, but detail pages must be crawlable for SEO. Changes require login.
- **Ownership:** it's enforced in the database write, with `WHERE id = $1 AND owner_id = $2`, so the check and the write can't be separated. Non-owners get 403.
- **Validation:** zod checks each request and removes unknown fields, so a client can't set `owner_id`. Database constraints catch anything else.
- **Slugs:** a readable title plus a random ending. They don't change on edit, which keeps links and search rankings intact.

### Search, indexing and pagination

Pagination uses cursors instead of `OFFSET`, because deep offset pages have to read and discard every earlier row. The trade-off is that users can't jump to a page number, which suits "load more".

| Index | Serves |
| --- | --- |
| `idx_newest (created_at DESC, id DESC)` | All listings, newest first |
| `idx_price (price, id)` | All listings by price |
| `idx_city_newest (city, created_at DESC, id DESC)` | A city, newest first |
| `idx_city_price (city, price, id)` | A city by price or budget |
| `idx_similar (city, type, price)` | Similar properties |
| `idx_locality_trgm` (GIN trigram) | Partial locality search |
| `idx_owner (owner_id, id DESC)` | Listings by owner |

The first five are partial indexes covering active listings only. Search results leave out descriptions and are gzip-compressed, to keep responses small.

### Performance

These query times were measured with `EXPLAIN ANALYZE` on 50,000 listings on a laptop. They vary between runs and exclude network and API time.

| Query | Plan | Time |
| --- | --- | --- |
| All listings, newest first | Index scan on `idx_newest` | 0.42 ms |
| City and budget, sorted by price | Index-only scan on `idx_city_price` | 0.19 ms |
| Deep page with a cursor | Index-only scan on `idx_price` | 0.09 ms |
| Same depth with `OFFSET 40000` | Reads 40,021 rows | 17.6 ms |
| Locality search, newest first | Index scan on `idx_newest` | 2.9 ms |
| Similar properties, first tier | Bitmap scan on `idx_similar` | 2.8 ms |

Through the full API on the same laptop, these requests took a median of about 6 to 11 ms.

### Similar properties

The API looks for the same city and type within 20% on price, and ranks by closest bedrooms, then price. If that finds fewer than 6, it widens to any price, then any type in the city. This is explainable and needs no behaviour data, which a new platform doesn't have. Responses can be cached for 5 minutes.

### Inquiries and spam protection

- **Duplicates:** `UNIQUE (property_id, sender_id)` is the final authority, so simultaneous requests can't create two.
- **Rate limits:** 10 inquiries per hour per user, and 30 per hour per IP.
- **Other checks:** a hidden honeypot field, a limit of one link per message, and message length rules. Owners can't send inquiries to their own listings.
- **Login and writes:** failed logins are limited per IP and email, and writes are limited to 60 a minute per user.

Rate limit counts live in PostgreSQL, so several API servers share them with no extra service to run. At high traffic, moving them to Redis would take this load off the database.

Read requests aren't rate limited here, because counting them would add a database write to each one. That belongs in a CDN or reverse proxy.

### Images

Images are uploaded through the API and stored on disk with random names, and the database holds only their location. Each upload is limited to 5 MB and 10 per listing, and is checked by its actual file contents rather than its name. In production, I'd move these to object storage such as S3, because disk files aren't shared between servers.

### Security

Helmet headers, a CORS allow-list, parameterised SQL throughout, generic 500 messages, a JSON body limit of 100 KB, and a startup check that rejects a short JWT secret.

## Known limitations

- There's no email verification or password reset.
- There's no automated test suite in this repository.
- `schema.sql` builds a fresh database. A live system would need versioned migrations.
- Logs go to the console, rather than a structured logging service.
- Graceful shutdown is implemented, but hasn't been exercised on Windows, where these signals behave differently.
