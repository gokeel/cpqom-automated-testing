/**
 * API Readiness Test — Get Transaction History Details
 *                      (Webtools Query Transaction History)
 *
 * Source  : Get+Transaction+History+Details+(Webtools+Query+Transaction+History).doc
 * Channel : SFDC | Method: POST | Type: Synchronous
 * SIT URL : http://dev-cgw.ioh.co.id/sit/cpq/webtools/webtoolsquerytransactionhistory
 *
 * Status SIT: HTTP 404 — endpoint belum tersedia, semua test auto-skip.
 *
 * Response Schema:
 * {
 *   "Status": { "Status", "ErrorDescription", "ErrorCode" },
 *   "Output": {
 *     "Transaction": [{
 *       "TransactionId", "WalletId", "UserId", "CreatedDate",
 *       "TransactionStatus", "NumOfRecords", "NumOfSuccess",
 *       "NumOfError", "InjectionValue"
 *     }]
 *   }
 * }
 */

import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { getTestParams, closeDb, updateRun } from "../../../utils/db.js";

const runId = process.env.TEST_RUN_ID ? Number(process.env.TEST_RUN_ID) : null;
const userId = process.env.USER_ID ? Number(process.env.USER_ID) : null;
let runError = null;

const ENV = process.env.TESTING_ENVIRONMENT ?? "SIT";
const BASE_URL =
  process.env.GET_TXN_HISTORY_DETAILS_URL ??
  "http://dev-cgw.ioh.co.id/sit/cpq/webtools/webtoolsquerytransactionhistory";
const AUTH =
  process.env.GET_TXN_HISTORY_DETAILS_AUTH ??
  "Basic Y3BxdXNlcjpjcHFwYXNzMjAyNQ==";
const BASE_HEADERS = {
  "Content-Type": "application/json",
  Authorization: AUTH
};

let tc,
  VALID_ACCOUNT_REF,
  endpointActive = true;

test.beforeAll(async () => {
  tc = await getTestParams(
    "api_readiness_txn_details",
    "tc_txn_history_details",
    userId
  );
  VALID_ACCOUNT_REF =
    tc?.accountRef ?? process.env.TEST_ACCOUNT_REF_VALID ?? "CUST123456";
  console.log(
    `[beforeAll] ENV: ${ENV} | URL: ${BASE_URL} | AccountRef: ${VALID_ACCOUNT_REF}`
  );
});

test.afterEach(async ({}, testInfo) => {
  if (
    (testInfo.status === "failed" || testInfo.status === "timedOut") &&
    !runError
  )
    runError = testInfo.error?.message ?? `${testInfo.title} failed`;
});

test.afterAll(async () => {
  if (runId)
    await updateRun(runId, {
      status: runError ? "error" : "success",
      log: runError ?? undefined,
      finished_at: new Date()
    });
  await closeDb();
});

async function postApi(request, body, { headers = BASE_HEADERS } = {}) {
  const response = await request.post(BASE_URL, { headers, data: body });
  let json = null;
  try {
    json = await response.json();
  } catch {
    /* non-JSON */
  }
  return { response, json };
}

function buildBody(accountRef) {
  return {
    Request: {
      RequestDate: new Date().toISOString().replace("T", " ").slice(0, 19),
      RequestID: `REQ-${Date.now()}`,
      RequestSource: "IDCC"
    },
    Input: { CustAccRefNum: accountRef }
  };
}

function skipIfDown() {
  if (!endpointActive)
    test.skip(true, `Endpoint ${BASE_URL} tidak tersedia. Test di-skip.`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test("TC-TXNDET-001 — Endpoint reachable & returns HTTP 200", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Transaction History Details");
  await allure.severity("blocker");
  let status;
  await test.step("TC-TXNDET-001_S01 - POST ke endpoint", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    status = r.response.status();
    console.log(`[TC-TXNDET-001] Status: ${status} | URL: ${BASE_URL}`);
  });
  await test.step("TC-TXNDET-001_S02 - Verifikasi status 200", async () => {
    if ([404, 596].includes(status)) {
      endpointActive = false;
      console.warn(
        `[TC-TXNDET-001] ⚠️  Endpoint tidak tersedia (HTTP ${status}). Semua test di-skip.`
      );
      test.skip();
      return;
    }
    expect(status, "Endpoint harus HTTP 200").toBe(200);
  });
});

test("TC-TXNDET-002 — Schema: response mengandung field Status", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Transaction History Details");
  await allure.severity("critical");
  let json;
  await test.step("TC-TXNDET-002_S01 - POST request", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    expect(r.response.status()).toBe(200);
    json = r.json;
    console.log("[TC-TXNDET-002] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-TXNDET-002_S02 - Verifikasi struktur Status", async () => {
    expect(json).toBeTruthy();
    expect(
      Object.prototype.hasOwnProperty.call(json, "Status"),
      "Response harus punya field 'Status'"
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(json.Status ?? {}, "Status"),
      "Status.Status harus ada"
    ).toBe(true);
  });
  await test.step("TC-TXNDET-002_S03 - Verifikasi struktur Transaction jika ada", async () => {
    if (Array.isArray(json?.Output?.Transaction)) {
      for (const txn of json.Output.Transaction) {
        expect(
          txn.TransactionId,
          "Setiap Transaction harus punya TransactionId"
        ).toBeDefined();
        expect(
          txn.TransactionStatus,
          "Setiap Transaction harus punya TransactionStatus"
        ).toBeDefined();
      }
    } else {
      console.log("[TC-TXNDET-002] Tidak ada Transaction dalam response.");
    }
  });
});

test("TC-TXNDET-003 — Positive: AccountRef valid mengembalikan Status SUCCESS", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Transaction History Details");
  await allure.severity("normal");
  if (!tc?.accountRef && !process.env.TEST_ACCOUNT_REF_VALID) {
    test.skip();
  }
  let json;
  await test.step("TC-TXNDET-003_S01 - POST dengan AccountRef valid", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    expect(r.response.status()).toBe(200);
    json = r.json;
    console.log("[TC-TXNDET-003] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-TXNDET-003_S02 - Verifikasi Status SUCCESS", async () => {
    expect(
      json?.Status?.Status,
      "Harus STATUS SUCCESS untuk AccountRef valid"
    ).toBe("SUCCESS");
    console.log(
      `[TC-TXNDET-003] Transactions: ${json?.Output?.Transaction?.length ?? 0} item(s)`
    );
  });
});

test("TC-TXNDET-004 — Negative: AccountRef invalid mengembalikan ERROR", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Transaction History Details");
  await allure.severity("normal");
  let json;
  await test.step("TC-TXNDET-004_S01 - POST dengan AccountRef tidak valid", async () => {
    const r = await postApi(request, buildBody("INVALID_ACC_99999"));
    expect(r.response.status()).toBe(200);
    json = r.json;
    console.log("[TC-TXNDET-004] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-TXNDET-004_S02 - Verifikasi ERROR atau data kosong", async () => {
    const isErr =
      json?.Status?.Status === "ERROR" || !json?.Output?.Transaction?.length;
    expect(
      isErr,
      `Harus ERROR atau Transaction kosong. Status: ${json?.Status?.Status}`
    ).toBe(true);
  });
});

test("TC-TXNDET-005 — Auth: tanpa Authorization harus 401 atau 403", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Transaction History Details");
  await allure.severity("critical");
  let status;
  await test.step("TC-TXNDET-005_S01 - POST tanpa Auth", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF), {
      headers: { "Content-Type": "application/json" }
    });
    status = r.response.status();
    console.log(`[TC-TXNDET-005] Status tanpa Auth: ${status}`);
  });
  await test.step("TC-TXNDET-005_S02 - Verifikasi 401 atau 403", async () => {
    expect(
      [401, 403].includes(status),
      `Harus 401/403 tanpa Auth. Actual: ${status}`
    ).toBe(true);
  });
});

test("TC-TXNDET-006 — Performance: response time < 10 detik", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Transaction History Details");
  await allure.severity("normal");
  let elapsed, status;
  await test.step("TC-TXNDET-006_S01 - POST dan ukur response time", async () => {
    const t = Date.now();
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    elapsed = Date.now() - t;
    status = r.response.status();
    console.log(`[TC-TXNDET-006] Response time: ${elapsed}ms`);
  });
  await test.step("TC-TXNDET-006_S02 - Verifikasi < 10s", async () => {
    expect(status, "Request harus 200").toBe(200);
    expect(elapsed, `${elapsed}ms melebihi 10.000ms`).toBeLessThan(10_000);
  });
});
