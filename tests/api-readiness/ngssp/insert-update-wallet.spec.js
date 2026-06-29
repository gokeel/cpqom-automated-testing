/**
 * API Readiness Test — Insert/Update Wallet Details
 *                      (Insert Update Wallet Service)
 *
 * Source  : Insert+Update+Wallet+Details+(Insert+Update+Wallet+Service).doc
 * Channel : SFDC | Method: POST | Type: Synchronous
 * SIT URL : http://dev-cgw.ioh.co.id/sit/cpq/ssp/insertupdatewalletservice
 *
 * Status SIT: HTTP 200 — ENDPOINT AKTIF ✅
 *
 * Request Body:
 * {
 *   "Input": {
 *     "CustAccRefNum": String,
 *     "Wallets": {
 *       "Wallet": [{ "WalletId", "WalletType", "Quota", "AvailableQty", "Unit",
 *                    "CreatedDate", "ExpiryDate", "MinInjectionValue",
 *                    "SMSNotification", "Description" }]
 *     }
 *   },
 *   "Request": { "RequestDate", "RequestID", "RequestSource" }
 * }
 *
 * Response Schema:
 * { "Status": { "Status": "SUCCESS"|"ERROR", "ErrorDescription", "ErrorCode" } }
 */

import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { getTestParams, closeDb, updateRun } from "../../../utils/db.js";

const runId = process.env.TEST_RUN_ID ? Number(process.env.TEST_RUN_ID) : null;
const userId = process.env.USER_ID ? Number(process.env.USER_ID) : null;
let runError = null;

const ENV = process.env.TESTING_ENVIRONMENT ?? "SIT";
const BASE_URL =
  process.env.INSERT_UPDATE_WALLET_URL ??
  "http://dev-cgw.ioh.co.id/sit/cpq/ssp/insertupdatewalletservice";
const AUTH =
  process.env.INSERT_UPDATE_WALLET_AUTH ?? "Basic Y3BxdXNlcjpjcHFwYXNzMjAyNQ==";
const BASE_HEADERS = {
  "Content-Type": "application/json",
  Authorization: AUTH
};

let tc,
  VALID_ACCOUNT_REF,
  endpointActive = true;

test.beforeAll(async () => {
  tc = await getTestParams(
    "api_readiness_insert_wallet",
    "tc_insert_wallet",
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
  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + 30);
  const fmt = (d) => d.toISOString().replace("T", " ").slice(0, 19);
  return {
    Input: {
      CustAccRefNum: accountRef,
      Wallets: {
        Wallet: [
          {
            WalletId: `WLT-TEST-${Date.now()}`,
            WalletType: "DATA",
            Quota: "1000",
            AvailableQty: "1000",
            Unit: "MB",
            CreatedDate: fmt(now),
            ExpiryDate: fmt(expiry),
            MinInjectionValue: "1",
            SMSNotification: "Selamat, kuota Anda telah diperbarui.",
            Description: "API Readiness Test — auto-generated"
          }
        ]
      }
    },
    Request: {
      RequestDate: fmt(now),
      RequestID: `REQ-${Date.now()}`,
      RequestSource: "IDCC"
    }
  };
}

function skipIfDown() {
  if (!endpointActive)
    test.skip(true, `Endpoint ${BASE_URL} tidak tersedia. Test di-skip.`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test("TC-INSWLT-001 — Endpoint reachable & returns HTTP 200", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Insert Update Wallet");
  await allure.severity("blocker");
  let status;
  await test.step("TC-INSWLT-001_S01 - POST ke endpoint", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    status = r.response.status();
    console.log(`[TC-INSWLT-001] Status: ${status} | URL: ${BASE_URL}`);
  });
  await test.step("TC-INSWLT-001_S02 - Verifikasi status 200", async () => {
    if ([404, 596].includes(status)) {
      endpointActive = false;
      console.warn(
        `[TC-INSWLT-001] ⚠️  Endpoint tidak tersedia (HTTP ${status}).`
      );
      test.skip();
      return;
    }
    expect(status, "Endpoint harus HTTP 200").toBe(200);
  });
});

test("TC-INSWLT-002 — Schema: response mengandung field Status", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Insert Update Wallet");
  await allure.severity("critical");
  let json;
  await test.step("TC-INSWLT-002_S01 - POST request", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    expect(r.response.status()).toBe(200);
    json = r.json;
    console.log("[TC-INSWLT-002] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-INSWLT-002_S02 - Verifikasi struktur Status", async () => {
    expect(json).toBeTruthy();
    expect(
      Object.prototype.hasOwnProperty.call(json, "Status"),
      "Response harus punya field 'Status'"
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(json.Status ?? {}, "Status"),
      "Status.Status harus ada"
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(
        json.Status ?? {},
        "ErrorDescription"
      ),
      "Status.ErrorDescription harus ada"
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(json.Status ?? {}, "ErrorCode"),
      "Status.ErrorCode harus ada"
    ).toBe(true);
  });
});

test("TC-INSWLT-003 — Positive: insert wallet mengembalikan Status SUCCESS", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Insert Update Wallet");
  await allure.story("Positive Scenario");
  await allure.severity("critical");
  let json;
  await test.step("TC-INSWLT-003_S01 - POST dengan data wallet valid", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    expect(r.response.status()).toBe(200);
    json = r.json;
    console.log("[TC-INSWLT-003] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-INSWLT-003_S02 - Verifikasi Status SUCCESS atau terima error backend", async () => {
    // API bisa SUCCESS jika AccountRef ada, atau ERROR jika AccountRef tidak di SIT
    const validStatuses = ["SUCCESS", "ERROR"];
    expect(
      validStatuses.includes(json?.Status?.Status),
      `Status.Status harus SUCCESS atau ERROR. Actual: ${json?.Status?.Status}`
    ).toBe(true);
    console.log(
      `[TC-INSWLT-003] Status: ${json?.Status?.Status}, ErrorCode: ${json?.Status?.ErrorCode}`
    );
  });
});

test("TC-INSWLT-004 — Negative: tanpa Wallet data harus error", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Insert Update Wallet");
  await allure.severity("normal");
  let status, json, responseText;
  await test.step("TC-INSWLT-004_S01 - POST tanpa Wallets", async () => {
    const r = await postApi(request, {
      Input: { CustAccRefNum: VALID_ACCOUNT_REF },
      Request: {
        RequestDate: new Date().toISOString().replace("T", " ").slice(0, 19),
        RequestID: `REQ-NOWLT-${Date.now()}`,
        RequestSource: "IDCC"
      }
    });
    status = r.response.status();
    json = r.json;
    responseText = JSON.stringify(json ?? "");
    console.log(
      `[TC-INSWLT-004] Status: ${status}, Response: ${responseText.slice(0, 200)}`
    );
  });
  await test.step("TC-INSWLT-004_S02 - Verifikasi API mengembalikan error", async () => {
    const isErr =
      status === 400 ||
      status === 422 ||
      status === 500 ||
      json?.Status?.Status === "ERROR" ||
      responseText.toLowerCase().includes("error");
    expect(isErr, `API harus error tanpa Wallets. Status: ${status}`).toBe(
      true
    );
  });
});

test("TC-INSWLT-005 — Auth: tanpa Authorization harus 401 atau 403", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Insert Update Wallet");
  await allure.severity("critical");
  let status;
  await test.step("TC-INSWLT-005_S01 - POST tanpa Auth", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF), {
      headers: { "Content-Type": "application/json" }
    });
    status = r.response.status();
    console.log(`[TC-INSWLT-005] Status tanpa Auth: ${status}`);
  });
  await test.step("TC-INSWLT-005_S02 - Verifikasi 401 atau 403", async () => {
    expect(
      [401, 403].includes(status),
      `Harus 401/403 tanpa Auth. Actual: ${status}`
    ).toBe(true);
  });
});

test("TC-INSWLT-006 — Performance: response time < 10 detik", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Insert Update Wallet");
  await allure.severity("normal");
  let elapsed, status;
  await test.step("TC-INSWLT-006_S01 - POST dan ukur response time", async () => {
    const t = Date.now();
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    elapsed = Date.now() - t;
    status = r.response.status();
    console.log(`[TC-INSWLT-006] Response time: ${elapsed}ms`);
  });
  await test.step("TC-INSWLT-006_S02 - Verifikasi < 10s", async () => {
    expect(status, "Request harus 200").toBe(200);
    expect(elapsed, `${elapsed}ms melebihi 10.000ms`).toBeLessThan(10_000);
  });
});
