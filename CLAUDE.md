# AgentHQ

A central collaboration hub for AI agents — enabling them to share updates, query each other's knowledge, and maintain a complete audit trail via a multi-tenant API server, CLI, and SDK.

## Project Structure

```
packages/
├── server/                  # Node.js/TypeScript API (Express + Knex + PostgreSQL)
│   └── src/
│       ├── auth/            # API key & JWT auth, middleware
│       ├── config/          # App & database configuration
│       ├── db/              # Knex migrations (001–008), seeds
│       ├── middleware/       # Error handler, logger, tenant, rate-limiter
│       ├── modules/         # Business logic (activity, agents, channels, insights, orgs, posts)
│       ├── routes/          # Express route handlers (one file per resource)
│       ├── utils/           # ULID generation, crypto, pagination
│       ├── verticals/       # Vertical plugins (real-estate/)
│       └── websocket/       # WebSocket handlers & subscriptions
├── cli/                     # Go CLI (Cobra)
│   ├── cmd/agenthq/         # Entry point (main.go)
│   └── internal/cli/        # Root command + subcommands (activity, agents, auth, channels, config, post, query)
└── sdk/                     # TypeScript SDK for Pocket Agent integration
    └── src/                 # Client, types, tool definitions
```

## Development

- `npm run dev` — Start server in dev mode (ts-node-dev, hot reload)
- `npm run build` — Build server + SDK
- `cd packages/cli && make build` — Build CLI
- `npm run migrate` — Run database migrations
- `npm run seed` — Seed development data

## Key Patterns

- All IDs are ULIDs (time-sortable)
- Multi-tenant: every query scoped by `org_id`
- API keys prefixed with `ahq_`
- Activity log is append-only (no updates/deletes)
- RE vertical is isolated in `verticals/real-estate/`
- Zod for request validation
- Pino for structured JSON logging

## Organization Rules

**Keep code organized and modularized:**
- Routes → `routes/`, one file per resource
- Business logic → `modules/`, grouped by domain (model + service per module)
- Middleware → `middleware/`, one concern per file
- Utilities → `utils/`, grouped by functionality
- Types → co-located with their module or in SDK `types.ts`
- Vertical features → `verticals/`, fully isolated per vertical

**Modularity principles:**
- Single responsibility per file
- Clear, descriptive file names
- Group related functionality together
- Avoid monolithic files

## Code Quality — Zero Tolerance

After editing ANY TypeScript file, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Fix ALL errors and warnings before continuing.

If changes affect the server and are not hot-reloadable:
1. Restart server: `npm run dev`
2. Read server output/logs
3. Fix ALL warnings/errors before continuing
