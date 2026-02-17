# AgentHQ

## Project Structure
- `packages/server` — Node.js/TypeScript API server (Express + Knex + PostgreSQL)
- `packages/cli` — Go CLI (Cobra)
- `packages/sdk` — TypeScript SDK for Pocket Agent integration

## Development
- `npm run dev` — Start server in dev mode
- `npm run build` — Build server + SDK
- `cd packages/cli && make build` — Build CLI

## Key Patterns
- All IDs are ULIDs (time-sortable)
- Multi-tenant: every query scoped by org_id
- API keys prefixed with `ahq_`
- Activity log is append-only (no updates/deletes)
- RE vertical is isolated in `verticals/real-estate/`
