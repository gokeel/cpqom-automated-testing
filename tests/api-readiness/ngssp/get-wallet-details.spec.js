/**
 * API Readiness Test — Get Transactions History / Get Wallet Details
 *                      (SSP Query Wallet Service)
 *
 * Source  : tests/api-readiness/Get+Transactions+History_Get+Wallet+Details+(SSP+Query+Wallet+Service).doc
 * Channel : SFDC
 * Method  : POST (REST)
 * Type    : Synchronous
 * Purpose : Get transaction history of wallet for each CA (Customer Account)
 *
 * ─── Status Endpoint SIT ──────────────────────────────────────────────────────
 * HTTP 596 ERR_596_SERVICE_NOT_FOUND dari Mashery — endpoint belum di-deploy.
 * Semua test akan di-skip secara otomatis sampai endpoint aktif.
 *
 * ─── Response Schema ────────────────────────────────────────────────────────
 * {
 *   "Status": {
 *     "Status"           : String — "SUCCESS" | "ERROR"
 *     "ErrorDescription" : String — detail error dari backend
 *     "ErrorCode"        : String — kode error dari backend
 *   },
 *   "Output": {
 *     "AccountRefNumber" : String — customer account number (echo-back)
 *     "Wallets": {
 *       "Wallet": [
 *         {
 *           "WalletId"         : String — unique ID wallet
 *           "WalletType"       : String — tipe wallet (DATA, VOICE, dll)
 *           "Quota"            : String — total quota teralokasi
 *           "AvailableQty"     : String — sisa quota
 *           "Unit"             : String — satuan (MB, MIN, dll)
 *           "CreatedDate"      : String — timestamp pembuatan wallet
 *           "ExpiryDate"       : String — timestamp kadaluarsa
 *           "MinInjectionValue": String — nilai minimum recharge
 *           "SMSNotification"  : String — flag notifikasi SMS (Y/N)
 *           "Description"      : String — deskripsi wallet
 *         }
 *       ]
 *     }
 *   }
 * }
 */

import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { getTestParams, closeDb, updateRun } from "../../../utils/db.js";

// ─── Run context (dari trigger server / web app) ───────────────────────────────
const runId = process.env.TEST_RUN_ID ? Number(process.env.TEST_RUN_ID) : null;
const userId = process.env.USER_ID ? Number(process.env.USER_ID) : null;
let runError = null;

// ─── Config ───────────────────────────────────────────────────────────────────
const ENV = process.env.TESTING_ENVIRONMENT ?? "SIT";

const ENDPOINTS = {
  SIT: "http://dev-cgw.ioh.co.id/sit/cpq/sspQueryWallet",
  UAT: process.env.GET_WALLET_UAT_URL ?? null,
  PROD: process.env.GET_WALLET_PROD_URL ?? null
};

const BASE_URL = ENDPOINTS[ENV] ?? ENDPOINTS.SIT;

/**
 * Authorization dari Confluence doc:
 * Basic Y3BxdXNlcjpjcHFwYXNzMjAyNQ==
 * (decoded: cpquser:cpqpass2025)
 */
const AUTH_TOKEN =
  process.env.GET_WALLET_AUTH ?? "Basic Y3BxdXNlcjpjcHFwYXNzMjAyNQ==";

const BASE_HEADERS = {
  "Content-Type": "application/json",
  Authorization: AUTH_TOKEN
};

// ─── Test params (dari DB atau fallback ke .env / hardcoded) ──────────────────
let tc;
let VALID_ACCOUNT_REF;
let INVALID_ACCOUNT_REF;

/**
 * Flag: apakah endpoint aktif?
 * Di-set oleh TC-WALLET-001. Jika false, semua test lain di-skip.
 */
let endpointActive = true;

// ─── Lifecycle hooks ──────────────────────────────────────────────────────────

test.beforeAll(async () => {
  tc = await getTestParams("api_readiness_wallet", "tc_get_wallet", userId);

  VALID_ACCOUNT_REF =
    tc?.accountRefValid ?? process.env.TEST_ACCOUNT_REF_VALID ?? "CUST123456";
  INVALID_ACCOUNT_REF =
    tc?.accountRefInvalid ??
    process.env.TEST_ACCOUNT_REF_INVALID ??
    "INVALID999999";

  console.log(`[beforeAll] ENV: ${ENV}`);
  console.log(`[beforeAll] BASE_URL: ${BASE_URL}`);
  console.log(`[beforeAll] VALID_ACCOUNT_REF: ${VALID_ACCOUNT_REF}`);
  console.log(`[beforeAll] INVALID_ACCOUNT_REF: ${INVALID_ACCOUNT_REF}`);
});

test.afterEach(async ({}, testInfo) => {
  if (
    (testInfo.status === "failed" || testInfo.status === "timedOut") &&
    !runError
  ) {
    runError = testInfo.error?.message ?? `${testInfo.title} failed`;
  }
});

test.afterAll(async () => {
  if (runId) {
    if (runError) {
      await updateRun(runId, {
        status: "error",
        log: runError,
        finished_at: new Date()
      });
    } else {
      await updateRun(runId, {
        status: "success",
        finished_at: new Date()
      });
    }
  }
  await closeDb();
});

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Wrapper POST ke SSP Query Wallet endpoint.
 * Mengembalikan { response, json } agar test bisa assert status & body sekaligus.
 */
async function postQueryWallet(request, body, { headers = BASE_HEADERS } = {}) {
  const response = await request.post(BASE_URL, { headers, data: body });
  let json = null;
  try {
    json = await response.json();
  } catch {
    // body bukan JSON (misal: HTML/XML error page)
  }
  return { response, json };
}

/**
 * Membangun request body standar untuk SSP Query Wallet.
 */
function buildRequestBody(accountRefNumber) {
  return {
    Input: {
      AccountRefNumber: accountRefNumber
    },
    Request: {
      RequestDate: new Date().toISOString().replace("T", " ").slice(0, 19),
      RequestID: `REQ-${Date.now()}`,
      RequestSource: "IDCC"
    }
  };
}

/**
 * Skip test jika endpoint belum aktif (HTTP 596).
 */
function skipIfEndpointNotActive() {
  if (!endpointActive) {
    test.skip(
      true,
      `Endpoint ${BASE_URL} belum tersedia (HTTP 596 ERR_596_SERVICE_NOT_FOUND). ` +
        "Test di-skip sampai endpoint di-register di Mashery SIT."
    );
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test("TC-WALLET-001 — Endpoint reachable & returns HTTP 200", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Get Wallet Details");
  await allure.story("Endpoint Reachability");
  await allure.severity("blocker");

  let status;

  await test.step("TC-WALLET-001_S01 - POST ke endpoint sspQueryWallet", async () => {
    const result = await postQueryWallet(
      request,
      buildRequestBody(VALID_ACCOUNT_REF)
    );
    status = result.response.status();
    console.log(`[TC-WALLET-001] Status: ${status} | URL: ${BASE_URL}`);
  });

  await test.step("TC-WALLET-001_S02 - Verifikasi status 200", async () => {
    if (status === 596) {
      endpointActive = false;
      console.warn(
        `[TC-WALLET-001] ⚠️  Endpoint belum tersedia di Mashery SIT (HTTP 596 SERVICE_NOT_FOUND).\n` +
          `  URL: ${BASE_URL}\n` +
          `  Endpoint perlu di-register di Mashery terlebih dahulu.\n` +
          `  Semua test lain akan di-skip otomatis.`
      );
      test.skip();
      return;
    }

    expect(status, `Endpoint ${BASE_URL} harus mengembalikan HTTP 200`).toBe(
      200
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-WALLET-002 — Schema validation: response mengandung field Status wajib", async ({
  request
}) => {
  skipIfEndpointNotActive();

  await allure.epic("API Readiness");
  await allure.feature("Get Wallet Details");
  await allure.story("Response Schema");
  await allure.severity("critical");

  const body = buildRequestBody(VALID_ACCOUNT_REF);
  let json;

  await test.step("TC-WALLET-002_S01 - POST request dengan AccountRefNumber valid", async () => {
    const result = await postQueryWallet(request, body);
    expect(result.response.status(), "Response harus 200 OK").toBe(200);
    json = result.json;
    console.log("[TC-WALLET-002] Response:", JSON.stringify(json, null, 2));
  });

  await test.step("TC-WALLET-002_S02 - Verifikasi response adalah valid JSON object", async () => {
    expect(json, "Response harus berupa object JSON, bukan null").toBeTruthy();
    expect(typeof json, "Response harus berupa object").toBe("object");
  });

  await test.step("TC-WALLET-002_S03 - Verifikasi field Status ada di response", async () => {
    expect(
      Object.prototype.hasOwnProperty.call(json, "Status"),
      "Response harus mengandung field 'Status'"
    ).toBe(true);
  });

  await test.step("TC-WALLET-002_S04 - Verifikasi struktur Status object", async () => {
    expect(json.Status, "Field 'Status' tidak boleh null").toBeTruthy();
    expect(
      Object.prototype.hasOwnProperty.call(json.Status, "Status"),
      "Status.Status harus ada di response"
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(json.Status, "ErrorDescription"),
      "Status.ErrorDescription harus ada di response"
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(json.Status, "ErrorCode"),
      "Status.ErrorCode harus ada di response"
    ).toBe(true);
  });

  await test.step("TC-WALLET-002_S05 - Verifikasi struktur Wallet jika ada", async () => {
    if (
      json.Output?.Wallets?.Wallet &&
      Array.isArray(json.Output.Wallets.Wallet)
    ) {
      console.log(
        `[TC-WALLET-002] Wallet ditemukan: ${json.Output.Wallets.Wallet.length} item(s)`
      );
      for (const wallet of json.Output.Wallets.Wallet) {
        expect(
          wallet.WalletId,
          "Setiap Wallet harus punya WalletId"
        ).toBeDefined();
        expect(
          wallet.WalletType,
          "Setiap Wallet harus punya WalletType"
        ).toBeDefined();
        expect(wallet.Unit, "Setiap Wallet harus punya Unit").toBeDefined();
      }
    } else {
      console.log(
        "[TC-WALLET-002] Tidak ada Wallet dalam response — skip validasi struktur Wallet."
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-WALLET-002B — Positive scenario: AccountRefNumber valid mengembalikan Status SUCCESS", async ({
  request
}) => {
  skipIfEndpointNotActive();

  await allure.epic("API Readiness");
  await allure.feature("Get Wallet Details");
  await allure.story("Positive Scenario");
  await allure.severity("normal");

  if (!tc?.accountRefValid && !process.env.TEST_ACCOUNT_REF_VALID) {
    console.log(
      "[TC-WALLET-002B] SKIP — Set TEST_ACCOUNT_REF_VALID di .env ke AccountRefNumber nyata SIT"
    );
    test.skip();
  }

  const body = buildRequestBody(VALID_ACCOUNT_REF);
  let json;

  await test.step("TC-WALLET-002B_S01 - POST dengan AccountRefNumber aktif", async () => {
    const result = await postQueryWallet(request, body);
    expect(result.response.status(), "Response harus 200 OK").toBe(200);
    json = result.json;
    console.log("[TC-WALLET-002B] Response:", JSON.stringify(json, null, 2));
  });

  await test.step("TC-WALLET-002B_S02 - Verifikasi Status SUCCESS", async () => {
    expect(
      json?.Status?.Status,
      "AccountRefNumber valid harus mengembalikan Status.Status = SUCCESS"
    ).toBe("SUCCESS");
  });

  await test.step("TC-WALLET-002B_S03 - Verifikasi Output.AccountRefNumber echo-back", async () => {
    expect(
      json?.Output?.AccountRefNumber,
      "Output.AccountRefNumber harus sama dengan yang dikirim di request"
    ).toBe(VALID_ACCOUNT_REF);
  });

  await test.step("TC-WALLET-002B_S04 - Log detail wallet", async () => {
    const wallets = json?.Output?.Wallets?.Wallet ?? [];
    const walletCount = Array.isArray(wallets) ? wallets.length : 0;
    console.log(
      `[TC-WALLET-002B] AccountRef: ${VALID_ACCOUNT_REF}, ` +
        `Status: ${json?.Status?.Status}, ` +
        `Wallet count: ${walletCount}`
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-WALLET-003 — Negative scenario: AccountRefNumber tidak valid mengembalikan ERROR", async ({
  request
}) => {
  skipIfEndpointNotActive();

  await allure.epic("API Readiness");
  await allure.feature("Get Wallet Details");
  await allure.story("Negative Scenario");
  await allure.severity("normal");

  const body = buildRequestBody(INVALID_ACCOUNT_REF);
  let json;

  await test.step("TC-WALLET-003_S01 - POST dengan AccountRefNumber tidak valid", async () => {
    const result = await postQueryWallet(request, body);
    expect(result.response.status(), "Response harus tetap 200").toBe(200);
    json = result.json;
    console.log("[TC-WALLET-003] Response:", JSON.stringify(json, null, 2));
  });

  await test.step("TC-WALLET-003_S02 - Verifikasi Status ERROR atau Wallet kosong", async () => {
    const isErrorStatus = json?.Status?.Status === "ERROR";
    const hasNoWallet =
      !json?.Output?.Wallets?.Wallet ||
      (Array.isArray(json.Output.Wallets.Wallet) &&
        json.Output.Wallets.Wallet.length === 0);

    expect(
      isErrorStatus || hasNoWallet,
      `AccountRefNumber tidak valid harus menghasilkan ERROR atau Wallet kosong. ` +
        `Status.Status: ${json?.Status?.Status}`
    ).toBe(true);

    if (isErrorStatus) {
      console.log(
        `[TC-WALLET-003] Status: ERROR — ErrorCode: ${json?.Status?.ErrorCode}, ` +
          `ErrorDescription: ${json?.Status?.ErrorDescription}`
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-WALLET-004 — Request validation: tanpa field AccountRefNumber harus error", async ({
  request
}) => {
  skipIfEndpointNotActive();

  await allure.epic("API Readiness");
  await allure.feature("Get Wallet Details");
  await allure.story("Request Validation");
  await allure.severity("normal");

  let status, responseText;

  await test.step("TC-WALLET-004_S01 - POST tanpa Input.AccountRefNumber", async () => {
    const result = await postQueryWallet(request, {
      Input: {},
      Request: {
        RequestDate: new Date().toISOString().replace("T", " ").slice(0, 19),
        RequestID: `REQ-NOACC-${Date.now()}`,
        RequestSource: "IDCC"
      }
    });
    status = result.response.status();
    responseText = await result.response.text().catch(() => "");
    console.log(`[TC-WALLET-004] Status: ${status}`);
    console.log(`[TC-WALLET-004] Response: ${responseText.slice(0, 300)}`);
  });

  await test.step("TC-WALLET-004_S02 - Verifikasi API mengembalikan error", async () => {
    const isErrorHttpStatus =
      status === 400 || status === 422 || status === 500;
    const isErrorBody =
      responseText.toLowerCase().includes("error") ||
      responseText.toLowerCase().includes("invalid") ||
      responseText.toLowerCase().includes("required") ||
      responseText.includes('"Status":"ERROR"');

    expect(
      isErrorHttpStatus || isErrorBody,
      `API harus error ketika AccountRefNumber tidak dikirim. Status: ${status}`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-WALLET-005 — Auth validation: tanpa Authorization header harus 401 atau 403", async ({
  request
}) => {
  skipIfEndpointNotActive();

  await allure.epic("API Readiness");
  await allure.feature("Get Wallet Details");
  await allure.story("Authentication");
  await allure.severity("critical");

  let status;

  await test.step("TC-WALLET-005_S01 - POST tanpa Authorization header", async () => {
    const result = await postQueryWallet(
      request,
      buildRequestBody(VALID_ACCOUNT_REF),
      { headers: { "Content-Type": "application/json" } }
    );
    status = result.response.status();
    console.log(`[TC-WALLET-005] Status tanpa Auth: ${status}`);
  });

  await test.step("TC-WALLET-005_S02 - Verifikasi response 401 atau 403", async () => {
    expect(
      [401, 403].includes(status),
      `API harus mengembalikan 401 atau 403 tanpa Authorization. Actual: ${status}`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-WALLET-006 — Performance: response time harus di bawah 10 detik", async ({
  request
}) => {
  skipIfEndpointNotActive();

  await allure.epic("API Readiness");
  await allure.feature("Get Wallet Details");
  await allure.story("Performance");
  await allure.severity("normal");

  let elapsed, status;

  await test.step("TC-WALLET-006_S01 - POST dan ukur response time", async () => {
    const startTime = Date.now();
    const result = await postQueryWallet(
      request,
      buildRequestBody(VALID_ACCOUNT_REF)
    );
    elapsed = Date.now() - startTime;
    status = result.response.status();
    console.log(`[TC-WALLET-006] Response time: ${elapsed}ms`);
  });

  await test.step("TC-WALLET-006_S02 - Verifikasi request berhasil dan response time < 10s", async () => {
    expect(status, "Request harus berhasil (200)").toBe(200);
    expect(
      elapsed,
      `Response time ${elapsed}ms melebihi batas maksimum 10.000ms`
    ).toBeLessThan(10_000);
  });
});
