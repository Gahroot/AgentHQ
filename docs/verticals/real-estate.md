# Real Estate Vertical

The real estate vertical is an isolated feature set for managing real estate transactions, agent performance metrics, and third-party integrations (Follow Up Boss, Dotloop, QuickBooks).

All RE routes are mounted under `/api/v1/re/` and `/api/v1/integrations/`. All endpoints require authentication.

---

## Transactions

### `POST /re/transactions`

Create a new transaction.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `property_address` | string | yes | Property address |
| `mls_number` | string | no | MLS listing number |
| `type` | string | yes | `buy`, `sell`, or `lease` |
| `listing_price` | number | no | Listing price |
| `listing_agent_id` | string | no | Listing agent ID |
| `buyers_agent_id` | string | no | Buyer's agent ID |
| `client_name` | string | no | Client name |
| `key_dates` | object | no | Important dates (e.g., `{ "closing": "2026-03-15" }`) |

**Response (201):** Created transaction object

---

### `GET /re/transactions`

List transactions with filters.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `prospecting`, `listed`, `under_contract`, `pending`, `closed`, `cancelled` |
| `type` | string | `buy`, `sell`, `lease` |
| `listing_agent_id` | string | Filter by listing agent |
| `buyers_agent_id` | string | Filter by buyer's agent |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

**Response:** Paginated list of transactions

---

### `GET /re/transactions/:id`

Get a single transaction.

**Response:** Transaction object

**Errors:** `NOT_FOUND`

---

### `PATCH /re/transactions/:id`

Update a transaction.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | New status |
| `sale_price` | number | Final sale price |
| `commission_rate` | number | Commission percentage |
| `commission_amount` | number | Commission dollar amount |
| `key_dates` | object | Updated key dates (merged with existing) |

**Response:** Updated transaction object

---

## Metrics

### `GET /re/metrics`

Get performance metrics for agents.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | string | Filter by agent |
| `period` | string | `daily`, `weekly`, `monthly` |
| `from` | ISO 8601 | Start date |
| `to` | ISO 8601 | End date |

**Response:**
```json
[
  {
    "id": "01HQ...",
    "org_id": "01HQ...",
    "agent_id": "01HQ...",
    "period": "monthly",
    "period_start": "2026-02-01",
    "metrics": {
      "transactions_closed": 5,
      "total_volume": 2500000,
      "avg_days_on_market": 21,
      "commission_earned": 75000
    }
  }
]
```

---

### `GET /re/metrics/leaderboard`

Get agent leaderboard ranked by total volume.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | yes | `daily`, `weekly`, `monthly` |
| `period_start` | string | yes | Period start date (YYYY-MM-DD) |

**Response:** Array of agents sorted by `total_volume` descending

---

## Integrations

### Supported Platforms

| Type | Platform | Description |
|------|----------|-------------|
| `fub` | Follow Up Boss | CRM — contacts, deals, events |
| `dotloop` | Dotloop | Transaction management — loops, participants |
| `quickbooks` | QuickBooks | Accounting — invoices, payments, bills |

### Core Integration Endpoints

#### `POST /integrations/connect`

Connect a new integration.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | `fub`, `dotloop`, or `quickbooks` |
| `credentials` | object | yes | Platform-specific credentials |
| `settings` | object | no | Integration settings |

Credentials are encrypted at rest. The connection is tested before saving.

**Response (201):** Integration object

---

#### `GET /integrations`

List all integrations for the organization.

---

#### `GET /integrations/:id`

Get integration details.

---

#### `POST /integrations/:id/disconnect`

Disconnect an integration (marks as disconnected, does not delete).

---

#### `DELETE /integrations/:id`

Permanently delete an integration.

---

#### `GET /integrations/:id/sync-logs`

Get sync history for an integration (paginated).

**Response:**
```json
{
  "data": [
    {
      "id": "01HQ...",
      "integration_id": "01HQ...",
      "operation": "sync_contacts",
      "status": "completed",
      "records_synced": 42,
      "error": null,
      "started_at": "...",
      "completed_at": "..."
    }
  ],
  "pagination": { ... }
}
```

---

### Follow Up Boss Endpoints

All FUB endpoints are under `/integrations/fub/`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/integrations/fub/test` | Test FUB connection |
| GET | `/integrations/fub/people` | List people (paginated) |
| GET | `/integrations/fub/people/:id` | Get person details |
| GET | `/integrations/fub/deals` | List deals (paginated) |
| GET | `/integrations/fub/deals/:id` | Get deal details |
| GET | `/integrations/fub/events` | List events (paginated) |
| POST | `/integrations/fub/events` | Create event |
| GET | `/integrations/fub/users` | List FUB users (paginated) |

---

### Dotloop Endpoints

All Dotloop endpoints are under `/integrations/dotloop/`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/integrations/dotloop/test` | Test Dotloop connection |
| GET | `/integrations/dotloop/profiles` | Get profiles |
| GET | `/integrations/dotloop/profiles/:pid/loops` | List transaction loops |
| GET | `/integrations/dotloop/profiles/:pid/loops/:lid` | Get loop details |
| GET | `/integrations/dotloop/profiles/:pid/loops/:lid/detail` | Get loop detail record |
| GET | `/integrations/dotloop/profiles/:pid/loops/:lid/participants` | List participants |

---

### QuickBooks Endpoints

All QuickBooks endpoints are under `/integrations/quickbooks/`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/integrations/quickbooks/test` | Test QuickBooks connection |
| GET | `/integrations/quickbooks/accounts` | Query accounts |
| GET | `/integrations/quickbooks/accounts/:id` | Get account |
| GET | `/integrations/quickbooks/invoices` | Query invoices |
| GET | `/integrations/quickbooks/invoices/:id` | Get invoice |
| GET | `/integrations/quickbooks/payments` | Query payments |
| GET | `/integrations/quickbooks/payments/:id` | Get payment |
| GET | `/integrations/quickbooks/bills` | Query bills |
| GET | `/integrations/quickbooks/bills/:id` | Get bill |

---

## Database Tables

### re_agent_profiles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `agent_id` | TEXT | PK, FK → agents | Agent reference |
| `role` | TEXT | | Agent's RE role |
| `license_number` | TEXT | | Real estate license |
| `specializations` | JSONB | | Areas of specialty |
| `territories` | JSONB | | Geographic territories |

### re_transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | ULID |
| `org_id` | TEXT | FK → orgs | Tenant scope |
| `property_address` | TEXT | NOT NULL | Property address |
| `mls_number` | TEXT | | MLS listing number |
| `status` | TEXT | | prospecting, listed, under_contract, pending, closed, cancelled |
| `type` | TEXT | NOT NULL | buy, sell, lease |
| `listing_price` | NUMERIC | | Listing price |
| `sale_price` | NUMERIC | | Final sale price |
| `commission_rate` | NUMERIC | | Commission percentage |
| `commission_amount` | NUMERIC | | Commission amount |
| `listing_agent_id` | TEXT | FK → agents | Listing agent |
| `buyers_agent_id` | TEXT | FK → agents | Buyer's agent |
| `client_name` | TEXT | | Client name |
| `key_dates` | JSONB | | Important dates |
| `created_at` | TIMESTAMP | | |
| `updated_at` | TIMESTAMP | | |

### re_metrics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | ULID |
| `org_id` | TEXT | FK → orgs | Tenant scope |
| `agent_id` | TEXT | FK → agents | Agent reference |
| `period` | TEXT | | daily, weekly, monthly |
| `period_start` | DATE | | Period start date |
| `metrics` | JSONB | | Metrics data |

### integrations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | ULID |
| `org_id` | TEXT | FK → orgs | Tenant scope |
| `type` | TEXT | NOT NULL | fub, dotloop, quickbooks |
| `status` | TEXT | | connected, disconnected, error |
| `credentials_encrypted` | TEXT | | Encrypted credentials |
| `settings` | JSONB | | Integration settings |
| `last_error` | TEXT | | Last error message |
| `last_synced_at` | TIMESTAMP | | Last successful sync |

### integration_sync_log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | ULID |
| `integration_id` | TEXT | FK → integrations | Parent integration |
| `org_id` | TEXT | FK → orgs | Tenant scope |
| `operation` | TEXT | | Sync operation name |
| `status` | TEXT | | completed, failed, in_progress |
| `records_synced` | INTEGER | | Number of records synced |
| `error` | TEXT | | Error message if failed |
| `metadata` | JSONB | | Additional sync metadata |
| `started_at` | TIMESTAMP | | |
| `completed_at` | TIMESTAMP | | |
