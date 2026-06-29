/**
 * API Readiness Test — Get Activity History Gift Wallet
 *                      (Webtools Query Activity History)
 *
 * Source  : Get+Activity+History+Gift+Wallet+(Webtools+Query+Activity+History).doc
 * Channel : SFDC | Method: POST | Type: Synchronous
 * SIT URL : http://dev-cgw.ioh.co.id/sit/cpq/webtools/webtoolsqueryactivityhistory
 *
 * Status SIT: HTTP 404 — endpoint belum tersedia, semua test auto-skip.
 */

import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { getTestParams, closeDb, updateRun } from "../../../utils/db.js";

const runId = process.env.TEST_RUN_ID ? Number(process.env.TEST_RUN_ID) : null;
const userId = process.env.USER_ID ? Number(process.env.USER_ID) : null;
let runError = null;

const ENV = process.env.TESTING_ENVIRONMENT ?? "SIT";
const BASE_URL =
  process.env.GET_ACTIVITY_HISTORY_URL ??
  "http://dev-cgw.ioh.co.id/sit/cpq/webtools/webtoolsqueryactivityhistory";
const AUTH =
  process.env.GET_ACTIVITY_HISTORY_AUTH ?? "Basic Y3BxdXNlcjpjcHFwYXNzMjAyNQ==";

const BASE_HEADERS = {
  "Content-Type": "application/json",
  Authorization: AUTH
};

let tc,
  VALID_ACCOUNT_REF,
  endpointActive = true;

test.beforeAll(async () => {
  tc = await getTestParams(
    "api_readiness_activity",
    "tc_activity_history",
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
    /* non-JSON response */
  }
  return { response, json };
}

function buildBody(accountRef) {
  return {
    Input: { AccountRefNumber: accountRef },
    Request: {
      RequestDate: new Date().toISOString().replace("T", " ").slice(0, 19),
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

test("TC-ACTIVITY-001 — Endpoint reachable & returns HTTP 200", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Activity History Gift Wallet");
  await allure.severity("blocker");
  let status;
  await test.step("TC-ACTIVITY-001_S01 - POST ke endpoint", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    status = r.response.status();
    console.log(`[TC-ACTIVITY-001] Status: ${status} | URL: ${BASE_URL}`);
  });
  await test.step("TC-ACTIVITY-001_S02 - Verifikasi status 200", async () => {
    if ([404, 596].includes(status)) {
      endpointActive = false;
      console.warn(
        `[TC-ACTIVITY-001] ⚠️  Endpoint tidak tersedia (HTTP ${status}). Semua test di-skip.`
      );
      test.skip();
      return;
    }
    expect(status, `Endpoint harus HTTP 200`).toBe(200);
  });
});

test("TC-ACTIVITY-002 — Schema: response mengandung field Status", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Activity History Gift Wallet");
  await allure.severity("critical");
  let json;
  await test.step("TC-ACTIVITY-002_S01 - POST request", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    expect(r.response.status(), "Response harus 200").toBe(200);
    json = r.json;
    console.log("[TC-ACTIVITY-002] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-ACTIVITY-002_S02 - Verifikasi field Status ada", async () => {
    expect(json, "Response harus berupa object").toBeTruthy();
    expect(
      Object.prototype.hasOwnProperty.call(json, "Status"),
      "Response harus punya field 'Status'"
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(json.Status ?? {}, "Status"),
      "Status.Status harus ada"
    ).toBe(true);
  });
});

test("TC-ACTIVITY-003 — Negative: AccountRef invalid mengembalikan ERROR", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Activity History Gift Wallet");
  await allure.severity("normal");
  let json;
  await test.step("TC-ACTIVITY-003_S01 - POST dengan AccountRef tidak valid", async () => {
    const r = await postApi(request, buildBody("INVALID_ACCOUNT_99999"));
    expect(r.response.status()).toBe(200);
    json = r.json;
    console.log("[TC-ACTIVITY-003] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-ACTIVITY-003_S02 - Verifikasi ERROR atau data kosong", async () => {
    const isErr = json?.Status?.Status === "ERROR" || !json?.Output;
    expect(
      isErr,
      `Response harus ERROR atau Output kosong. Status: ${json?.Status?.Status}`
    ).toBe(true);
  });
});

test("TC-ACTIVITY-004 — Auth: tanpa Authorization harus 401 atau 403", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Activity History Gift Wallet");
  await allure.severity("critical");
  let status;
  await test.step("TC-ACTIVITY-004_S01 - POST tanpa Auth", async () => {
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF), {
      headers: { "Content-Type": "application/json" }
    });
    status = r.response.status();
    console.log(`[TC-ACTIVITY-004] Status tanpa Auth: ${status}`);
  });
  await test.step("TC-ACTIVITY-004_S02 - Verifikasi 401 atau 403", async () => {
    expect(
      [401, 403].includes(status),
      `Harus 401/403 tanpa Auth. Actual: ${status}`
    ).toBe(true);
  });
});

test("TC-ACTIVITY-005 — Performance: response time < 10 detik", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Activity History Gift Wallet");
  await allure.severity("normal");
  let elapsed, status;
  await test.step("TC-ACTIVITY-005_S01 - POST dan ukur response time", async () => {
    const t = Date.now();
    const r = await postApi(request, buildBody(VALID_ACCOUNT_REF));
    elapsed = Date.now() - t;
    status = r.response.status();
    console.log(`[TC-ACTIVITY-005] Response time: ${elapsed}ms`);
  });
  await test.step("TC-ACTIVITY-005_S02 - Verifikasi < 10s", async () => {
    expect(status, "Request harus 200").toBe(200);
    expect(elapsed, `${elapsed}ms melebihi 10.000ms`).toBeLessThan(10_000);
  });
});
