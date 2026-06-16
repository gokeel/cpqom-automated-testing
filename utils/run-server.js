import http from "http";
import fs from "fs";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { getUserIdForRun } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = process.env.TRIGGER_PORT ?? 3333;
const PW_REPORT_PORT = process.env.PW_REPORT_PORT ?? 9323;
const ALLURE_PORT = process.env.ALLURE_REPORT_PORT ?? 8100;

const MODULE_FILES = {
  account_mgmt: "tests/non-ida/01-account-mgmt.spec.js",
  account_mgmt_v2: "tests/non-ida/01-account-mgmt-api.spec.js",
  lead_mgmt: "tests/non-ida/02-lead-mgmt.spec.js",
  oppty_mgmt_sales: "tests/non-ida/03-oppty-mgmt-sales.spec.js",
  oppty_mgmt_es: "tests/non-ida/04-oppty-mgmt-es.spec.js",
  quote_mgmt_es: "tests/non-ida/05-quote-mgmt-es.spec.js",
  contract_order_sd: "tests/non-ida/06-contract-mgmt-sales.spec.js"
};

// In-memory run store: runId → { runId, status, output, exitCode, startedAt, modules }
const runs = new Map();
let activeRunId = null;

// ─── helpers ───────────────────────────────────────────────────────────────

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

// ─── run management ────────────────────────────────────────────────────────

function startRun(
  modules = [],
  productRunId = null,
  productCode = null,
  userId = null
) {
  const runId = randomUUID();
  const relativeFiles =
    modules.length > 0
      ? modules.map((m) => MODULE_FILES[m]).filter(Boolean)
      : Object.values(MODULE_FILES);
  const specFiles = relativeFiles.map((f) => path.resolve(ROOT_DIR, f));

  const run = {
    runId,
    productRunId,
    status: "running",
    output: "",
    exitCode: null,
    startedAt: new Date().toISOString(),
    modules: modules.length > 0 ? modules : Object.keys(MODULE_FILES)
  };
  runs.set(runId, run);
  activeRunId = runId;

  const env = { ...process.env };
  if (productRunId != null) env.TEST_RUN_ID = String(productRunId);
  if (productCode != null) env.PRODUCT_CODE = String(productCode);
  if (userId != null) env.USER_ID = String(userId);

  const child = spawn("npx", ["playwright", "test", ...specFiles], {
    cwd: ROOT_DIR,
    env
  });

  child.stdout.on("data", (d) => {
    run.output += d.toString();
  });
  child.stderr.on("data", (d) => {
    run.output += d.toString();
  });

  child.on("close", (code) => {
    run.exitCode = code;
    run.status = code === 0 ? "passed" : "failed";
    run.finishedAt = new Date().toISOString();
    run.reportUrl = `http://localhost:${PW_REPORT_PORT}`;
    run.allureUrl = `http://localhost:${ALLURE_PORT}`;
    if (activeRunId === runId) activeRunId = null;
    console.log(`[run:${runId}] finished — exit code ${code}`);
    console.log(`[run:${runId}] playwright report: ${run.reportUrl}`);

    // Regenerate Allure HTML report from the latest results
    const allure = spawn(
      "npx",
      [
        "allure",
        "generate",
        "allure-results",
        "--clean",
        "-o",
        "allure-report"
      ],
      { cwd: ROOT_DIR }
    );
    allure.on("close", (allureCode) => {
      console.log(
        `[run:${runId}] allure generate finished — exit code ${allureCode}`
      );
      console.log(`[run:${runId}] allure report: ${run.allureUrl}`);
    });
  });

  console.log(`[run:${runId}] started — specs: ${specFiles.join(", ")}`);
  return runId;
}

// ─── request router ────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // POST /run  — start a new test run
  // Body (optional): { "modules": ["account_mgmt", "lead_mgmt"] }
  // Omit modules (or send []) to run all specs in sequence
  if (req.method === "POST" && url.pathname === "/run") {
    if (activeRunId) {
      sendJson(res, 409, {
        error: "A test run is already in progress",
        runId: activeRunId
      });
      return;
    }
    const body = await parseBody(req);
    const modules = Array.isArray(body.modules) ? body.modules : [];
    const productRunId = body.run_id ?? null;
    const productCode = body.product_code ?? null;
    let userId = body.user_id ?? null;
    if (userId == null && productRunId != null) {
      userId = await getUserIdForRun(productRunId);
    }
    const runId = startRun(modules, productRunId, productCode, userId);
    sendJson(res, 202, {
      runId,
      productRunId,
      productCode,
      userId,
      status: "running"
    });
    return;
  }

  // GET /status/:runId  — poll a specific run's status + output
  const statusMatch = url.pathname.match(/^\/status\/([^/]+)$/);
  if (req.method === "GET" && statusMatch) {
    const run = runs.get(statusMatch[1]);
    if (!run) {
      sendJson(res, 404, { error: "Run not found" });
      return;
    }
    sendJson(res, 200, run);
    return;
  }

  // GET /runs  — list all runs (newest first), without full output
  if (req.method === "GET" && url.pathname === "/runs") {
    const list = [...runs.values()].reverse().map(({ output: _, ...r }) => r);
    sendJson(res, 200, list);
    return;
  }

  // GET /modules  — list valid module keys the caller can pass to /run
  if (req.method === "GET" && url.pathname === "/modules") {
    sendJson(res, 200, Object.keys(MODULE_FILES));
    return;
  }

  // GET /report or GET /report/* — serve the latest Playwright HTML report
  if (req.method === "GET" && url.pathname.startsWith("/report")) {
    const reportDir = path.resolve(ROOT_DIR, "playwright-report");
    const relativePath =
      url.pathname.replace(/^\/report\/?/, "") || "index.html";
    const filePath = path.resolve(reportDir, relativePath);

    // Prevent path traversal outside reportDir
    if (!filePath.startsWith(reportDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          res.writeHead(404);
          res.end("Report not found — run the tests first");
        } else {
          res.writeHead(500);
          res.end("Error reading report");
        }
        return;
      }
      const ext = path.extname(filePath).slice(1);
      const mime =
        {
          html: "text/html",
          js: "application/javascript",
          css: "text/css",
          png: "image/png",
          svg: "image/svg+xml",
          json: "application/json",
          woff2: "font/woff2",
          woff: "font/woff"
        }[ext] ?? "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": mime,
        "Access-Control-Allow-Origin": "*"
      });
      res.end(data);
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(
    `Playwright trigger server listening on http://localhost:${PORT}`
  );
  console.log("Available modules:", Object.keys(MODULE_FILES).join(", "));
});

// ─── static report servers ─────────────────────────────────────────────────

function createStaticServer(dir, label) {
  return http.createServer((req, res) => {
    const safePath = req.url === "/" ? "/index.html" : req.url;
    const filePath = path.resolve(dir, "." + safePath);

    if (!filePath.startsWith(dir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          res.writeHead(404);
          res.end(`${label} report not found — run the tests first`);
        } else {
          res.writeHead(500);
          res.end("Server error");
        }
        return;
      }
      const ext = path.extname(filePath).slice(1);
      const mime =
        {
          html: "text/html",
          js: "application/javascript",
          css: "text/css",
          png: "image/png",
          svg: "image/svg+xml",
          json: "application/json",
          woff2: "font/woff2",
          woff: "font/woff",
          txt: "text/plain",
          xml: "application/xml"
        }[ext] ?? "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": mime,
        "Access-Control-Allow-Origin": "*"
      });
      res.end(data);
    });
  });
}

const pwReportDir = path.resolve(ROOT_DIR, "playwright-report");
const allureReportDir = path.resolve(ROOT_DIR, "allure-report");

createStaticServer(pwReportDir, "Playwright").listen(PW_REPORT_PORT, () => {
  console.log(
    `Playwright report server listening on http://localhost:${PW_REPORT_PORT}`
  );
});

createStaticServer(allureReportDir, "Allure").listen(ALLURE_PORT, () => {
  console.log(
    `Allure report server listening on http://localhost:${ALLURE_PORT}`
  );
});
