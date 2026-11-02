# Real Estate Listing Platform

A scalable real-estate listing platform in TypeScript, inspired by 99acres and NoBroker.

| Part | Technology | Status |
| --- | --- | --- |
| Backend | Node.js, Express 5, TypeScript | Complete |
| Database | PostgreSQL 16 | Complete, with 50,000 seed listings |
| API documentation | OpenAPI 3.1, Swagger UI at `/api-docs` | Complete |
| Frontend | Next.js 16, Tailwind CSS | Complete |

## Run the backend

You need Node.js 22 or later and PostgreSQL 16.

1. Create the database and load the tables and test data:

   ```bash
   createdb property
   psql -d property -f db/schema.sql
   psql -d property -f db/seed.sql
   ```

2. Install the API:

   ```bash
   cd api
   npm install
   ```

3. Create a file called `.env` in the `api` folder, with your database details and a secret of at least 32 characters. It's ignored by git, so your secrets stay private.

   ```
   PORT=4000
   DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/property
   JWT_SECRET=replace-with-a-long-random-value
   ```

   You can generate a secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

4. Start the API:

   ```bash
   npm run dev
   ```

The API runs at `http://localhost:4000`, and its documentation is at [`http://localhost:4000/api-docs`](http://localhost:4000/api-docs). The raw OpenAPI file is at `/api-docs.json`.

For production, run `npm run build`, then `npm start`.

## Run the frontend

With the API running, open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The site runs at `http://localhost:3000`, and it works with the default settings.

To make edits refresh public pages straight away, add the same `REVALIDATE_SECRET=` line, with a long random value, to `api/.env` and `frontend/.env`. Without it, pages still refresh within 5 minutes.

To point the site somewhere else, set `API_URL`, `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` in `frontend/.env`. The API also reads these optional settings from `api/.env`: `FRONTEND_URL`, `PUBLIC_URL`, `UPLOAD_DIR` and `TRUST_PROXY`.

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
| GET | `/properties/mine/{id}` | Owner | Get one of your listings to edit |
| GET | `/properties/sitemap` | No | List slugs for the sitemap |
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
frontend/
  app/             Pages, plus the sitemap, robots file and cache refresh route
  components/      Reusable pieces, such as the listing card and forms
  lib/             API calls, login state and shared helpers
```

Each backend module separates routes (HTTP), schemas (validation) and services (logic and queries).

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

Pagination uses cursors instead of `OFFSET`, because deep offset pages have to read and discard every earlier row. The trade-off is that users can't jump to a page number, so the site has Next page and First page links. The page number it shows comes from the URL and is only for display.

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

Rate limit counts are kept in memory, which is simple and needs no extra service. The trade-off is that each API server counts separately and the counts reset on restart, so running several servers would need a shared store such as Redis.

Public read requests aren't rate limited here. In production, that belongs in a CDN or reverse proxy.

### Images

Images are uploaded through the API and stored on disk with random names, and the database holds only their location. Each upload is limited to 5 MB and 10 per listing, and is checked by its actual file contents rather than its name. In production, I'd move these to object storage such as S3, because disk files aren't shared between servers.

### Frontend and SEO

| Page | Rendering | Why |
| --- | --- | --- |
| Listing detail | ISR, cached for 5 minutes and refreshed straight after an edit | Read far more than changed, and must be crawlable |
| Search | Server-rendered per request | Too many filter combinations to cache usefully |
| Login, my listings, inquiries, forms | Client Components, for interaction | Private, and kept out of search results |

- **ISR setup:** detail pages use `revalidate` with an empty `generateStaticParams`, so each is built on its first visit rather than building 50,000 at once. `cacheComponents` is off, to use standard ISR.
- **Refreshing after an edit:** the API calls a protected Next.js route, which runs `revalidatePath`. The API doesn't wait for it, so a stopped frontend can't fail an edit.
- **SEO:** per-listing titles and descriptions from `generateMetadata`, canonical URLs, Open Graph tags, `RealEstateListing` JSON-LD, a sitemap and a robots file. Missing listings return a real 404.
- **Performance:** `next/image` serves optimised photos in fixed-shape boxes, so the page doesn't jump as they load. Search filters live in the URL, so results can be shared and bookmarked.
- **Login in the browser:** the access token stays in memory rather than `localStorage`, and a page reload gets a new one using the `httpOnly` cookie. When a token expires, requests renew it and retry automatically. A browser lock stops tabs refreshing at once, which would look like token theft.
- **Design:** a full-width photo banner with a floating search card, black and lime pill buttons, and prices in lakh and crore, as Indian buyers expect. The stats describe the test data, and there are no made-up reviews.
- **Sample photos:** listings without a photo show one from `frontend/public/samples`, chosen by type and id and labelled "Sample photo". The photos are from [Unsplash](https://unsplash.com/license), and a live site would remove them.
- **Sitemap limit:** it lists the newest 5,000 listings. A larger site would split it with `generateSitemaps`.

### Security

Helmet headers, a CORS allow-list, parameterised SQL throughout, generic 500 messages, a JSON body limit of 100 KB, and a startup check that rejects a short JWT secret.

## Known limitations

- There's no email verification or password reset.
- There's no automated test suite in this repository.
- `schema.sql` builds a fresh database. A live system would need versioned migrations.
- Logs go to the console, rather than a structured logging service.
- Graceful shutdown is implemented, but hasn't been exercised on Windows, where these signals behave differently.
