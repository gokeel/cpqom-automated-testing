# Salesforce CPQ/OM Automated Testing

End-to-end test suite for the Salesforce CPQ & Opportunity Management flows, built with [Playwright](https://playwright.dev). Test parameters are managed centrally in a PostgreSQL database via a companion web app.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Trigger Server](#trigger-server)
- [Test Modules](#test-modules)
- [Reporting](#reporting)

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | v18+ |
| Playwright | 1.59.1 |
| PostgreSQL | 14+ |

---

## Project Structure

```
├── tests/
│   └── non-ida/
│       ├── 01-account-mgmt.spec.js      # CCA & CA creation
│       ├── 02-lead-mgmt.spec.js         # Lead creation & conversion
│       ├── 03-oppty-mgmt-sales.spec.js  # Opportunity mgmt (Sales role)
│       ├── 04-oppty-mgmt-es.spec.js     # Opportunity mgmt (ES role)
│       └── 05-quote-mgmt-es.spec.js     # Quote management (ES role)
├── utils/
│   ├── db.js                            # PostgreSQL helper
│   └── run-server.js               # HTTP server for remote test triggering
├── test-data/
│   └── auth.json                        # Salesforce login credentials
├── reporters/
│   └── jira-reporter.js                # Custom Allure + Jira reporter
└── playwright.config.js
```

---

## Setup

**1. Install dependencies**
```bash
npm install
npx playwright install chromium
```

**2. Install Playwright OS dependencies** (first time / VPS only)
```bash
npx playwright install-deps chromium
```

---

## Configuration

### Authentication — `test-data/auth.json`

Stores Salesforce login credentials for each user role used across the test suites.

```json
{
  "sysadmin":           { "url": "...", "afterLoginUrl": "...", "username": "...", "password": "...", "clientId": "...", "clientSecret": "..." },
  "marketing":          { "url": "...", "afterLoginUrl": "...", "username": "...", "password": "..." },
  "salesOperation":     { "url": "...", "afterLoginUrl": "...", "username": "...", "password": "..." },
  "enterpriseSolution": { "url": "...", "afterLoginUrl": "...", "username": "...", "password": "..." }
}
```

### Test Parameters — PostgreSQL

All test case parameters (form values, expected outputs, dynamic IDs) are stored in a PostgreSQL database managed by the companion web app.

| Table | Purpose |
|---|---|
| `test_modules` | One row per spec file; holds the `counter` used to uniquify record names each run |
| `test_parameters` | JSONB parameters per test case (`tc001`, `tc002`, `tc010`, …) per module |
| `runtime_state` | Dynamic values written back during runs (e.g. `opportunityId` after lead conversion) |
| `salesforce_users` | Salesforce OAuth tokens managed by the web app |

Configure the database connection in `utils/db.js`:

```js
const pool = new Pool({
    host:     '127.0.0.1',
    port:     5432,
    database: 'sfdc_test_manager',
    user:     'postgres',
    password: 'your_password',
});
```

---

## Running Tests

### Run all specs in sequence
```bash
npm run test:non-ida
```

### Run a specific spec
```bash
npx playwright test tests/non-ida/01-account-mgmt.spec.js
```

### Run all specs (any folder)
```bash
npm run test:e2e
```

### Headless mode (VPS / CI)

Set `headless: true` in `playwright.config.js`, or use `xvfb-run` to keep headed mode on a display-less server:
```bash
xvfb-run npm run test:non-ida
```

---

## Trigger Server

A lightweight HTTP server that lets the companion web app start test runs via a button click.

### Start the server
```bash
npm run run-server
# Listening on http://localhost:3333
```

The port can be overridden with the `TRIGGER_PORT` environment variable.

### API

#### `POST /run`
Start a new test run. Optionally pass specific modules; omit to run all.

```bash
# Run all modules
curl -X POST http://localhost:3333/run

# Run specific modules
curl -X POST http://localhost:3333/run \
  -H "Content-Type: application/json" \
  -d '{"modules": ["account_mgmt", "lead_mgmt"]}'
```

Response `202`:
```json
{ "runId": "550e8400-...", "status": "running" }
```

Returns `409` if a run is already in progress.

---

#### `GET /status/:runId`
Poll a run for its current status and output.

```bash
curl http://localhost:3333/status/550e8400-...
```

Response:
```json
{
  "runId": "550e8400-...",
  "status": "passed",
  "exitCode": 0,
  "output": "...",
  "startedAt": "2026-04-16T10:00:00.000Z",
  "finishedAt": "2026-04-16T10:12:34.000Z",
  "modules": ["account_mgmt", "lead_mgmt"]
}
```

`status` values: `running` → `passed` or `failed`

---

#### `GET /runs`
List all runs (newest first), without output.

```bash
curl http://localhost:3333/runs
```

---

#### `GET /modules`
List valid module keys accepted by `POST /run`.

```bash
curl http://localhost:3333/modules
# ["account_mgmt","lead_mgmt","oppty_mgmt_sales","oppty_mgmt_es","quote_mgmt_es"]
```

### Wiring up the Laravel button

```php
// Start a run
$response = Http::post('http://localhost:3333/run', [
    'modules' => $request->input('modules', []),
]);
$runId = $response->json('runId');

// Poll status
$status = Http::get("http://localhost:3333/status/{$runId}")->json();
```

---

## Test Modules

| Module key | Spec file | User role | Description |
|---|---|---|---|
| `account_mgmt` | `01-account-mgmt.spec.js` | Marketing | Creates CCA and CA records; propagates account name to lead module |
| `lead_mgmt` | `02-lead-mgmt.spec.js` | Sales Operation | Creates a lead, updates status, converts to opportunity; propagates `opportunityId` |
| `oppty_mgmt_sales` | `03-oppty-mgmt-sales.spec.js` | Sales Operation | Manages opportunity products, pricing, score card (Sales fields) |
| `oppty_mgmt_es` | `04-oppty-mgmt-es.spec.js` | Enterprise Solution | Score card (ES fields), stage progression to Quoting |
| `quote_mgmt_es` | `05-quote-mgmt-es.spec.js` | Enterprise Solution | Quote creation and CPQ configuration |

The modules are designed to run **in order** — each one depends on data produced by the previous (account name → lead, lead conversion → `opportunityId`).

---

## Reporting

### Generate and open Allure report
```bash
npm run allure:generate
npm run allure:open
```

### Serve report locally
```bash
npm run allure:serve
```

Reports are written to `allure-results/` after each run and compiled into `allure-report/`.
