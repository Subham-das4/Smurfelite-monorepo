# Deploy SmurfElite on a VPS with another Docker stack

Use this when **host ports 80/443 are already used** by another project (e.g. `7-wings-monorepo-nginx`).

## Principles

- SmurfElite uses compose project name **`smurfelite`** (container prefix `smurfelite-*`).
- **Own Postgres** — do not reuse another stack's `db` container.
- SmurfElite nginx listens on **`127.0.0.1:8001`** only (not host `:80`).
- Your **existing edge nginx** routes `*.smurfelite.store` → `http://172.17.0.1:8001`.

## 1. Clone and configure

```bash
mkdir -p /var/www/smurfelite && cd /var/www/smurfelite
git clone <repo-url> .
cp docker/.env.example docker/.env
nano docker/.env
```

Set production values (HTTPS recommended):

- `POSTGRES_PASSWORD`, `JWT_SECRET`, `VITE_PERSIST_SECRET`
- `ENCRYPTION_KEY` — **exactly 32 characters** (required; API crashes without it)
- `FRONTEND_URL`, `ADMIN_FRONTEND_URL`, `SELLER_FRONTEND_URL` → `https://www|admin|seller.smurfelite.store`
- `ALLOWED_CORS_ORIGINS` / `FRONTEND_URLS` — same three origins
- `PUBLIC_API_BASE_URL` → `https://api.smurfelite.store`
- `NEXT_PUBLIC_EXPRESS_SERVER_API` / `VITE_EXPRESS_SERVER_API` → `https://api.smurfelite.store/api`

DNS: A records for `www`, `api`, `admin`, `seller` → VPS IP.

## 2. Build and start SmurfElite

```bash
docker compose -p smurfelite --env-file docker/.env build
# On low RAM (~4GB), build one service at a time:
# docker compose -p smurfelite --env-file docker/.env build express-server

docker compose -p smurfelite --env-file docker/.env up -d
docker compose -p smurfelite logs -f express-server
```

Verify internal stack:

```bash
curl -s -o /dev/null -w "%{http_code}" -H "Host: api.smurfelite.store" http://127.0.0.1:8001/
```

## 3. Wire the existing edge nginx

Copy [`nginx/host-edge-snippet.conf`](nginx/host-edge-snippet.conf) into the **other** project's nginx `conf.d` (e.g. `/root/live/7-wings-monorepo/docker/nginx/conf.d/smurfelite.conf`).

Reload that nginx only:

```bash
docker compose -f /root/live/7-wings-monorepo/docker-compose.yaml exec nginx nginx -t
docker compose -f /root/live/7-wings-monorepo/docker-compose.yaml exec nginx nginx -s reload
```

**Do not** run `docker compose down` in the other project's directory.

## 4. TLS

Add `*.smurfelite.store` certificates on the **edge** nginx (same Certbot flow as the other project). Then ensure `docker/.env` uses `https://` URLs and rebuild frontends:

```bash
docker compose -p smurfelite --env-file docker/.env build nextjs-app admin-app seller-app
docker compose -p smurfelite --env-file docker/.env up -d
```

## 5. Checklist

| Check | Command |
|-------|---------|
| SmurfElite containers up | `docker ps \| grep smurfelite` |
| Port 8001 listening locally | `ss -tlnp \| grep 8001` |
| Other stack still up | `docker ps \| grep 7-wings` |
| API via domain | `curl -I https://api.smurfelite.store/api` |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `address already in use` on `:80` | Remove `80:80` override; use default `127.0.0.1:8001` |
| Edge nginx 502 | SmurfElite not running or wrong upstream IP; test `curl 127.0.0.1:8001` |
| CORS errors | Match `ALLOWED_CORS_ORIGINS` to exact browser origins (scheme + host) |
| Stale frontend API URL | Rebuild `nextjs-app`, `admin-app`, `seller-app` after `.env` change |
