# ShopEasy

Sample multi-service app for the Docker Fundamentals bootcamp: a React frontend,
a Node/Express backend, PostgreSQL, and Redis — wired together with Docker
Compose and shipped to Docker Hub via GitHub Actions.

```
browser -> frontend (nginx, :3000) -> backend (express, :5000) -> postgres / redis
```

## Project layout

```
shopeasy/
├── backend/            Node/Express API (products, health check)
│   ├── Dockerfile
│   ├── .env.example
│   └── ...
├── frontend/            React + Vite storefront, served by nginx
│   ├── Dockerfile
│   ├── nginx.conf       proxies /api/* to the backend service
│   ├── .env.example
│   └── ...
├── docker-compose.yml
├── .env.example          compose-level values (DB/Redis creds, image naming)
└── .github/workflows/docker-publish.yml
```

## 1. Local setup

```bash
git clone <your-repo-url> shopeasy && cd shopeasy

cp .env.example .env
cp backend/.env.example backend/.env
# edit both .env files - set real DB_PASSWORD / REDIS_PASSWORD (must match
# between the root .env and backend/.env), and your Docker Hub username

docker compose up -d --build
docker compose ps        # all four services should show "healthy"/"Up"
```

- Frontend: http://localhost:3000
- Backend health check: it's proxied, so http://localhost:3000/api/products
- Logs: `docker compose logs -f backend`

## 2. Environment variables

### Root `.env` (read by docker-compose.yml)

| Variable | Purpose |
|---|---|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Postgres credentials, shared with backend |
| `REDIS_PASSWORD` | Redis auth password, shared with backend |
| `DOCKERHUB_USERNAME` | Used to name/tag images locally |
| `IMAGE_TAG` | Defaults to `latest`; CI overrides this with the commit SHA |

### `backend/.env`

| Variable | Purpose |
|---|---|
| `PORT` | Port Express listens on (default `5000`) |
| `NODE_ENV` | `production` in Docker |
| `CORS_ORIGIN` | Allowed frontend origin |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Postgres connection (`DB_HOST=postgres` matches the Compose service name) |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Redis connection (`REDIS_HOST=redis` matches the Compose service name) |

### `frontend/.env` (optional, local `npm run dev` only)

| Variable | Purpose |
|---|---|
| `VITE_DEV_API_TARGET` | Where the Vite dev server proxies `/api` while developing outside Docker |

**Note:** the frontend image itself takes no build-time API URL — `nginx.conf`
proxies `/api/` straight to the `backend` container on the Compose network.
That means the same built image runs unchanged in dev, staging, and prod;
nothing environment-specific gets baked into the JS bundle at build time.

## 3. GitHub Actions secrets

Set these under **Repo → Settings → Secrets and variables → Actions**:

| Secret | Required | Purpose |
|---|---|---|
| `DOCKERHUB_USERNAME` | Yes | Docker Hub username/org the images are pushed to |
| `DOCKERHUB_TOKEN` | Yes | Docker Hub **access token** (Account Settings → Security → New Access Token) — never use your account password |
| `DEPLOY_HOST` | Only for auto-deploy | Production server IP/hostname |
| `DEPLOY_USER` | Only for auto-deploy | SSH user on the production server |
| `DEPLOY_SSH_KEY` | Only for auto-deploy | Private key with access to that server |
| `DEPLOY_PORT` | Only for auto-deploy | SSH port (usually `22`) |

The deploy job only runs if you set the repo **variable** `ENABLE_DEPLOY=true`
(Settings → Secrets and variables → Actions → Variables). Leave it unset until
you actually have a server to deploy to — the build-and-push job runs either way.

On the production server itself, `/opt/shopeasy` needs its own `docker-compose.yml`
and `.env`/`backend/.env` files (same as local setup, step 1) so
`docker compose pull && docker compose up -d` has something to run.

## 4. Manual build & push (without CI)

```bash
docker login
docker build -t oluwademilade/shopeasy-backend:latest ./backend
docker build -t oluwademilade/shopeasy-frontend:latest ./frontend
docker push yourusername/shopeasy-backend:latest
docker push yourusername/shopeasy-frontend:latest
```

## 5. Everyday commands

```bash
docker compose up -d          # start everything
docker compose ps             # check status/health
docker compose logs -f backend
docker compose stop           # stop, keep containers/volumes
docker compose down           # stop and remove containers (volumes persist)
docker compose down -v        # also wipe Postgres/Redis data
```
