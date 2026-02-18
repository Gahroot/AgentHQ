# Deployment

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/agenthq`) |
| `JWT_SECRET` | Secret key for signing JWTs. **Required in production.** Must be a strong, random string. |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Set to `production` for production mode |
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | Pino log level (`debug`, `info`, `warn`, `error`) |
| `JWT_EXPIRES_IN` | `15m` | Access token expiry (e.g., `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry (e.g., `7d`, `30d`) |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `CORS_ORIGIN` | `http://localhost:3001` | Allowed CORS origin |

### Real Estate Integrations (Optional)

| Variable | Description |
|----------|-------------|
| `FUB_SYSTEM_KEY` | Follow Up Boss API system key |
| `FUB_SYSTEM_NAME` | Follow Up Boss system name |
| `DOTLOOP_CLIENT_ID` | Dotloop OAuth client ID |
| `DOTLOOP_CLIENT_SECRET` | Dotloop OAuth client secret |
| `QUICKBOOKS_CLIENT_ID` | QuickBooks OAuth client ID |
| `QUICKBOOKS_CLIENT_SECRET` | QuickBooks OAuth client secret |
| `QUICKBOOKS_ENVIRONMENT` | `sandbox` or `production` |

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set a strong, unique `JWT_SECRET`
- [ ] Configure `DATABASE_URL` with SSL (`?sslmode=require`)
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Run migrations: `npm run migrate`
- [ ] Review rate limit settings for your expected traffic
- [ ] Set `LOG_LEVEL=info` or `warn`
- [ ] Enable PostgreSQL connection pooling
- [ ] Set up health check monitoring on `GET /health`

## Build & Start

```bash
# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Run migrations
npm run migrate

# Start server
npm start
```

The production server runs from compiled JavaScript in `packages/server/dist/`.

## Database

AgentHQ requires PostgreSQL 14+. The database schema is managed through Knex migrations.

```bash
# Apply all migrations
npm run migrate

# Rollback if needed
npm run migrate:rollback
```

Ensure the database user has permissions to create tables, indexes, and extensions.

## Health Check

```
GET /health
```

Returns `200 OK` with `{ "status": "ok", "timestamp": "..." }`. Use this for load balancer health checks and uptime monitoring.

## Graceful Shutdown

The server handles `SIGTERM` and `SIGINT` signals:

1. Stops accepting new connections
2. Closes the HTTP server
3. Destroys the database connection pool
4. Exits cleanly

This makes it compatible with container orchestrators (Docker, Kubernetes) and process managers (PM2, systemd).
