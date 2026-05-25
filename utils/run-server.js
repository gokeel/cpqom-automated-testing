import http from 'http';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.TRIGGER_PORT ?? 3333;

const MODULE_FILES = {
    account_mgmt:      'tests/non-ida/01-account-mgmt.spec.js',
    account_mgmt_v2:   'tests/non-ida/01-account-mgmt-api.spec.js',
    lead_mgmt:         'tests/non-ida/02-lead-mgmt.spec.js',
    oppty_mgmt_sales:  'tests/non-ida/03-oppty-mgmt-sales.spec.js',
    oppty_mgmt_es:     'tests/non-ida/04-oppty-mgmt-es.spec.js',
    quote_mgmt_es:     'tests/non-ida/05-quote-mgmt-es.spec.js',
    contract_order_sd:     'tests/non-ida/06-contract-mgmt-sales.spec.js',
};

// In-memory run store: runId → { runId, status, output, exitCode, startedAt, modules }
const runs = new Map();
let activeRunId = null;

// ─── helpers ───────────────────────────────────────────────────────────────

function sendJson(res, statusCode, body) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(body));
}

function parseBody(req) {
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(raw)); } catch { resolve({}); }
        });
    });
}

// ─── run management ────────────────────────────────────────────────────────

function startRun(modules = [], productRunId = null, productCode = null) {
    const runId = randomUUID();
    const relativeFiles = modules.length > 0
        ? modules.map(m => MODULE_FILES[m]).filter(Boolean)
        : Object.values(MODULE_FILES);
    const specFiles = relativeFiles.map(f => path.resolve(ROOT_DIR, f));

    const run = {
        runId,
        productRunId,
        status:    'running',
        output:    '',
        exitCode:  null,
        startedAt: new Date().toISOString(),
        modules:   modules.length > 0 ? modules : Object.keys(MODULE_FILES),
    };
    runs.set(runId, run);
    activeRunId = runId;

    const env = { ...process.env };
    if (productRunId != null) env.TEST_RUN_ID    = String(productRunId);
    if (productCode  != null) env.PRODUCT_CODE   = String(productCode);

    const child = spawn('npx', ['playwright', 'test', ...specFiles], {
        cwd: ROOT_DIR,
        env,
    });

    child.stdout.on('data', d => { run.output += d.toString(); });
    child.stderr.on('data', d => { run.output += d.toString(); });

    child.on('close', code => {
        run.exitCode = code;
        run.status   = code === 0 ? 'passed' : 'failed';
        run.finishedAt = new Date().toISOString();
        if (activeRunId === runId) activeRunId = null;
        console.log(`[run:${runId}] finished — exit code ${code}`);
    });

    console.log(`[run:${runId}] started — specs: ${specFiles.join(', ')}`);
    return runId;
}

// ─── request router ────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin':  '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    // POST /run  — start a new test run
    // Body (optional): { "modules": ["account_mgmt", "lead_mgmt"] }
    // Omit modules (or send []) to run all specs in sequence
    if (req.method === 'POST' && url.pathname === '/run') {
        if (activeRunId) {
            sendJson(res, 409, {
                error: 'A test run is already in progress',
                runId: activeRunId,
            });
            return;
        }
        const body = await parseBody(req);
        const modules     = Array.isArray(body.modules) ? body.modules : [];
        const productRunId = body.run_id       ?? null;
        const productCode  = body.product_code ?? null;
        const runId = startRun(modules, productRunId, productCode);
        sendJson(res, 202, { runId, productRunId, productCode, status: 'running' });
        return;
    }

    // GET /status/:runId  — poll a specific run's status + output
    const statusMatch = url.pathname.match(/^\/status\/([^/]+)$/);
    if (req.method === 'GET' && statusMatch) {
        const run = runs.get(statusMatch[1]);
        if (!run) { sendJson(res, 404, { error: 'Run not found' }); return; }
        sendJson(res, 200, run);
        return;
    }

    // GET /runs  — list all runs (newest first), without full output
    if (req.method === 'GET' && url.pathname === '/runs') {
        const list = [...runs.values()].reverse().map(({ output: _, ...r }) => r);
        sendJson(res, 200, list);
        return;
    }

    // GET /modules  — list valid module keys the caller can pass to /run
    if (req.method === 'GET' && url.pathname === '/modules') {
        sendJson(res, 200, Object.keys(MODULE_FILES));
        return;
    }

    sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
    console.log(`Playwright trigger server listening on http://localhost:${PORT}`);
    console.log('Available modules:', Object.keys(MODULE_FILES).join(', '));
});
