# ACME Pay

Web application for ACME’s HR manager to maintain annual base salaries for 10,000 employees across countries, and to answer how the organization pays.

The product decisions are in [docs/requirements.md](docs/requirements.md) and [docs/design-notes.md](docs/design-notes.md). A recording click-path is in [docs/demo-script.md](docs/demo-script.md).

## Run locally

```bash
npm install
npm run db:setup
npm run dev
```

Open http://localhost:5173 and sign in:

- Email: `hr@acme.test`
- Password: `acme-hr-demo` (override with `HR_PASSWORD` before seeding)

`npm run db:setup` creates the SQLite file at `data/acme.db` and loads 10,000 employees. `npm run seed` replaces that data, including any salary edits.

## Tests

```bash
npm test
```

The suite covers money math, the stable seed, sessions, salary revisions, payroll totals, and CSV export. It uses temporary SQLite files and does not call the network.

## Docker

```bash
docker build -t acme-pay .
docker run --rm -p 3000:3000 -v acme-pay-data:/data acme-pay
```

The first start loads 10,000 employees when the database is empty. Later starts keep salary edits. Open http://localhost:3000.

Set `COOKIE_SECURE=true` when the site is served over HTTPS. Leave it unset for plain HTTP, or the browser will not keep the sign-in cookie.

## Deploy

One container and a persistent disk at `/data` are enough. There is no separate database to host.

On [Render](https://render.com):

1. New Web Service, environment Docker, branch `main`.
2. Add a disk mounted at `/data`.
3. Set `DATABASE_URL=file:/data/acme.db` and `COOKIE_SECURE=true`.
4. Set `HR_PASSWORD` before the first boot if the demo password should not be used.

On Fly.io, `fly launch` with this Dockerfile, then `fly volumes create acme_data --size 1` and mount it at `/data` in `fly.toml`. Use the same environment variables.

A public URL was not published from this workspace because no Render or Fly account was signed in here. The container itself is the deployable app.

## What the home screen answers

Active headcount by country, payroll in each local currency, the same payroll in USD using the 15 January 2026 rate snapshot, median pay by level, department cost, and the highest and lowest paid people in a chosen country. USD figures are labeled as a comparison, not an amount to pay.
