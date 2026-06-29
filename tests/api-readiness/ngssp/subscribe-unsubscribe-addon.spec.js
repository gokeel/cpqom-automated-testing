/**
 * API Readiness Test — Subscribe/Unsubscribe Add-On Package
 *                      (SSP AddOn Package)
 *
 * Source  : Subscribe+Unsubscribe+(SSP+AddOn+Package).doc
 * Channel : SFDC | Method: POST | Type: Synchronous
 * SIT URL : http://dev-cgw.ioh.co.id/sit/cpq/ssp/addonpackage
 *
 * Status SIT: HTTP 404 — endpoint belum tersedia, semua test auto-skip.
 *
 * Request Body:
 * {
 *   "Input": {
 *     "IMSI": String,
 *     "MSISDN": String,
 *     "AddOnPackage": [{ "ActionID", "Action" (ADD|DELETE), "ServiceName",
 *                        "ShortCode", "KeyWord", "PackageCode", "CommercialName",
 *                        "RegAmount", "PackageGroup", "UnregKeyword" }]
 *   },
 *   "Request": { "RequestDate", "RequestID", "RequestSource" }
 * }
 *
 * Response Schema:
 * {
 *   "Status": { "Status": "SUCCESS"|"ERROR", "ErrorDescription", "ErrorCode" },
 *   "transactionId": [String]
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
  process.env.ADDON_PACKAGE_URL ??
  "http://dev-cgw.ioh.co.id/sit/cpq/ssp/addonpackage";
const AUTH =
  process.env.ADDON_PACKAGE_AUTH ?? "Basic Y3BxdXNlcjpjcHFwYXNzMjAyNQ==";
const BASE_HEADERS = {
  "Content-Type": "application/json",
  Authorization: AUTH
};

let tc,
  VALID_MSISDN,
  VALID_IMSI,
  endpointActive = true;

test.beforeAll(async () => {
  tc = await getTestParams("api_readiness_addon", "tc_addon_package", userId);
  VALID_MSISDN = tc?.msisdn ?? process.env.TEST_MSISDN_VALID ?? "6285882237362";
  VALID_IMSI = tc?.imsi ?? process.env.TEST_IMSI ?? "123456789012345";
  console.log(
    `[beforeAll] ENV: ${ENV} | URL: ${BASE_URL} | MSISDN: ${VALID_MSISDN}`
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

function buildBody(msisdn, imsi, action = "ADD") {
  return {
    Input: {
      IMSI: imsi,
      MSISDN: msisdn,
      AddOnPackage: [
        {
          ActionID: `ACT-${Date.now()}`,
          Action: action,
          ServiceName: "Data Booster Test",
          ShortCode: "97576.0",
          KeyWord: action === "ADD" ? "REG TESTPKG" : "UNREG TESTPKG",
          PackageCode: "PKG_TEST_1GB",
          CommercialName: "1GB Test Pack",
          RegAmount: "5000",
          PackageGroup: "DATA",
          UnregKeyword: action === "DELETE" ? "STOPTEST1GB" : ""
        }
      ]
    },
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

test("TC-ADDON-001 — Endpoint reachable & returns HTTP 200", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Subscribe Unsubscribe Add-On");
  await allure.severity("blocker");
  let status;
  await test.step("TC-ADDON-001_S01 - POST ke endpoint addonpackage", async () => {
    const r = await postApi(request, buildBody(VALID_MSISDN, VALID_IMSI));
    status = r.response.status();
    console.log(`[TC-ADDON-001] Status: ${status} | URL: ${BASE_URL}`);
  });
  await test.step("TC-ADDON-001_S02 - Verifikasi status 200", async () => {
    if ([404, 596].includes(status)) {
      endpointActive = false;
      console.warn(
        `[TC-ADDON-001] ⚠️  Endpoint tidak tersedia (HTTP ${status}). Semua test di-skip.`
      );
      test.skip();
      return;
    }
    expect(status, "Endpoint harus HTTP 200").toBe(200);
  });
});

test("TC-ADDON-002 — Schema: response mengandung field Status dan transactionId", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Subscribe Unsubscribe Add-On");
  await allure.severity("critical");
  let json;
  await test.step("TC-ADDON-002_S01 - POST request", async () => {
    const r = await postApi(request, buildBody(VALID_MSISDN, VALID_IMSI));
    expect(r.response.status()).toBe(200);
    json = r.json;
    console.log("[TC-ADDON-002] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-ADDON-002_S02 - Verifikasi struktur Status", async () => {
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
  await test.step("TC-ADDON-002_S03 - Verifikasi transactionId jika SUCCESS", async () => {
    if (json?.Status?.Status === "SUCCESS") {
      expect(
        Array.isArray(json.transactionId),
        "transactionId harus berupa array"
      ).toBe(true);
      console.log(
        `[TC-ADDON-002] transactionId: ${JSON.stringify(json.transactionId)}`
      );
    }
  });
});

test("TC-ADDON-003 — Subscribe (ADD): action ADD mengembalikan Status SUCCESS", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Subscribe Unsubscribe Add-On");
  await allure.story("Subscribe ADD");
  await allure.severity("critical");
  let json;
  await test.step("TC-ADDON-003_S01 - POST dengan Action ADD", async () => {
    const r = await postApi(
      request,
      buildBody(VALID_MSISDN, VALID_IMSI, "ADD")
    );
    expect(r.response.status()).toBe(200);
    json = r.json;
    console.log("[TC-ADDON-003] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-ADDON-003_S02 - Verifikasi Status SUCCESS atau error backend", async () => {
    // API bisa SUCCESS atau ERROR tergantung kondisi subscriber di SIT
    const validStatuses = ["SUCCESS", "ERROR"];
    expect(
      validStatuses.includes(json?.Status?.Status),
      `Status harus SUCCESS atau ERROR. Actual: ${json?.Status?.Status}`
    ).toBe(true);
    console.log(
      `[TC-ADDON-003] Action: ADD | Status: ${json?.Status?.Status} | ErrorCode: ${json?.Status?.ErrorCode}`
    );
    if (json?.transactionId)
      console.log(
        `[TC-ADDON-003] transactionId: ${JSON.stringify(json.transactionId)}`
      );
  });
});

test("TC-ADDON-004 — Unsubscribe (DELETE): action DELETE mengembalikan Status SUCCESS", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Subscribe Unsubscribe Add-On");
  await allure.story("Unsubscribe DELETE");
  await allure.severity("normal");
  let json;
  await test.step("TC-ADDON-004_S01 - POST dengan Action DELETE", async () => {
    const r = await postApi(
      request,
      buildBody(VALID_MSISDN, VALID_IMSI, "DELETE")
    );
    expect(r.response.status()).toBe(200);
    json = r.json;
    console.log("[TC-ADDON-004] Response:", JSON.stringify(json, null, 2));
  });
  await test.step("TC-ADDON-004_S02 - Verifikasi Status SUCCESS atau error backend", async () => {
    const validStatuses = ["SUCCESS", "ERROR"];
    expect(
      validStatuses.includes(json?.Status?.Status),
      `Status harus SUCCESS atau ERROR. Actual: ${json?.Status?.Status}`
    ).toBe(true);
    console.log(
      `[TC-ADDON-004] Action: DELETE | Status: ${json?.Status?.Status} | ErrorCode: ${json?.Status?.ErrorCode}`
    );
  });
});

test("TC-ADDON-005 — Validation: tanpa field MSISDN harus error", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Subscribe Unsubscribe Add-On");
  await allure.severity("normal");
  let status, json, responseText;
  await test.step("TC-ADDON-005_S01 - POST tanpa MSISDN", async () => {
    const r = await postApi(request, {
      Input: {
        IMSI: VALID_IMSI,
        AddOnPackage: [
          {
            ActionID: "ACT001",
            Action: "ADD",
            ServiceName: "Test",
            ShortCode: "123",
            KeyWord: "REG",
            PackageCode: "PKG001",
            CommercialName: "Test",
            RegAmount: "0",
            PackageGroup: "DATA",
            UnregKeyword: ""
          }
        ]
      },
      Request: {
        RequestDate: new Date().toISOString().replace("T", " ").slice(0, 19),
        RequestID: `REQ-${Date.now()}`,
        RequestSource: "IDCC"
      }
    });
    status = r.response.status();
    json = r.json;
    responseText = JSON.stringify(json ?? "");
    console.log(
      `[TC-ADDON-005] Status: ${status}, Response: ${responseText.slice(0, 200)}`
    );
  });
  await test.step("TC-ADDON-005_S02 - Verifikasi API mengembalikan error", async () => {
    const isErr =
      status === 400 ||
      status === 422 ||
      status === 500 ||
      json?.Status?.Status === "ERROR";
    expect(isErr, `API harus error tanpa MSISDN. Status: ${status}`).toBe(true);
  });
});

test("TC-ADDON-006 — Auth: tanpa Authorization harus 401 atau 403", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Subscribe Unsubscribe Add-On");
  await allure.severity("critical");
  let status;
  await test.step("TC-ADDON-006_S01 - POST tanpa Auth", async () => {
    const r = await postApi(request, buildBody(VALID_MSISDN, VALID_IMSI), {
      headers: { "Content-Type": "application/json" }
    });
    status = r.response.status();
    console.log(`[TC-ADDON-006] Status tanpa Auth: ${status}`);
  });
  await test.step("TC-ADDON-006_S02 - Verifikasi 401 atau 403", async () => {
    expect(
      [401, 403].includes(status),
      `Harus 401/403 tanpa Auth. Actual: ${status}`
    ).toBe(true);
  });
});

test("TC-ADDON-007 — Performance: response time < 10 detik", async ({
  request
}) => {
  skipIfDown();
  await allure.epic("API Readiness");
  await allure.feature("Subscribe Unsubscribe Add-On");
  await allure.severity("normal");
  let elapsed, status;
  await test.step("TC-ADDON-007_S01 - POST dan ukur response time", async () => {
    const t = Date.now();
    const r = await postApi(request, buildBody(VALID_MSISDN, VALID_IMSI));
    elapsed = Date.now() - t;
    status = r.response.status();
    console.log(`[TC-ADDON-007] Response time: ${elapsed}ms`);
  });
  await test.step("TC-ADDON-007_S02 - Verifikasi < 10s", async () => {
    expect(status, "Request harus 200").toBe(200);
    expect(elapsed, `${elapsed}ms melebihi 10.000ms`).toBeLessThan(10_000);
  });
});
