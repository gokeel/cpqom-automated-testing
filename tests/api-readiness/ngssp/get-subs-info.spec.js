/**
 * API Readiness Test — Query Subscriber Info (Get Subs Info)
 *
 * Source    : tests/api-readiness/Query+subscriber+info+(Get+Subs+Info).doc
 * Channel   : SFDC
 * Method    : POST (REST)
 * Type      : Synchronous
 *
 * Environments:
 *   SIT  → http://dev-cgw.ioh.co.id/sit/cpq/ssp/getsubsinfo
 *   UAT  → TBC
 *   Prod → TBC
 *
 * ─── Actual Response Schema (discovered from live SIT call) ─────────────────
 * {
 *   "Tid"             : String  — echo-back dari request
 *   "Msisdn"          : String  — echo-back dari request
 *   "IMSI"            : String  — kosong di SIT meskipun MSISDN terdaftar
 *   "SimType"         : String  — tipe SIM (contoh: "USIM")
 *   "Offers"          : Object  — daftar offer aktif (tidak ada di doc Confluence)
 *   "ServiceClass"    : String  — kosong jika MSISDN tidak terdaftar
 *   "CustBalanceInfo" : String  — saldo pelanggan dalam Rupiah
 *   "SubsType"        : String  — tipe subscriber
 *   "ExpiredDate"     : String  — tanggal expired (format: YYYYMMDD)
 *   "TerminateDate"   : String  — tanggal terminasi
 *   "Services"        : Object  — daftar layanan aktif
 * }
 */

import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { getTestParams, closeDb, updateRun } from "../../../utils/db.js";

// ─── Run context (dari trigger server / web app) ──────────────────────────────
const runId = process.env.TEST_RUN_ID ? Number(process.env.TEST_RUN_ID) : null;
const userId = process.env.USER_ID ? Number(process.env.USER_ID) : null;
let runError = null;

// ─── Config ───────────────────────────────────────────────────────────────────
const ENV = process.env.TESTING_ENVIRONMENT ?? "SIT";

const ENDPOINTS = {
  SIT: "http://dev-cgw.ioh.co.id/sit/cpq/ssp/getsubsinfo",
  UAT: process.env.GET_SUBS_INFO_UAT_URL ?? null,
  PROD: process.env.GET_SUBS_INFO_PROD_URL ?? null
};

const BASE_URL = ENDPOINTS[ENV] ?? ENDPOINTS.SIT;

/**
 * Authorization dari Confluence doc:
 * Basic Y3BxdXNlcjpjcHFwYXNzMjAyNQ==
 * (decoded: cpquser:cpqpass2025)
 */
const AUTH_TOKEN =
  process.env.GET_SUBS_INFO_AUTH ?? "Basic Y3BxdXNlcjpjcHFwYXNzMjAyNQ==";

const BASE_HEADERS = {
  "Content-Type": "application/json",
  Authorization: AUTH_TOKEN
};

/**
 * Field wajib yang SELALU ada di response (berdasarkan actual SIT response).
 * Nilai boleh kosong ("") — yang penting key-nya exist.
 */
const REQUIRED_RESPONSE_KEYS = [
  "Tid",
  "Msisdn",
  "IMSI",
  "SimType",
  "Offers",
  "ServiceClass",
  "CustBalanceInfo",
  "SubsType",
  "ExpiredDate",
  "TerminateDate",
  "Services"
];

// ─── Test params (dari DB atau fallback ke .env) ───────────────────────────────
let tc;
let VALID_MSISDN;
let INVALID_MSISDN;

// ─── Lifecycle hooks ──────────────────────────────────────────────────────────

test.beforeAll(async () => {
  // Ambil parameter test dari database (konsisten dengan spec lain)
  tc = await getTestParams("api_readiness_subs", "tc_get_subs_info", userId);

  // Fallback ke env / hardcoded jika DB belum ada row-nya
  VALID_MSISDN =
    tc?.msisdnValid ?? process.env.TEST_MSISDN_VALID ?? "6285882237362";
  INVALID_MSISDN =
    tc?.msisdnInvalid ?? process.env.TEST_MSISDN_INVALID ?? "628000000000";

  console.log(`[beforeAll] ENV: ${ENV}`);
  console.log(`[beforeAll] BASE_URL: ${BASE_URL}`);
  console.log(`[beforeAll] VALID_MSISDN: ${VALID_MSISDN}`);
  console.log(`[beforeAll] INVALID_MSISDN: ${INVALID_MSISDN}`);
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
 * Wrapper POST ke IOH middleware API.
 * Mengembalikan { response, json } agar test bisa assert status & body sekaligus.
 */
async function postSubsInfo(request, body, { headers = BASE_HEADERS } = {}) {
  const response = await request.post(BASE_URL, { headers, data: body });
  let json = null;
  try {
    json = await response.json();
  } catch {
    // body bukan JSON (misal: HTML error page)
  }
  return { response, json };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test("TC-SUBS-001 — Endpoint reachable & returns HTTP 200", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Get Subscriber Info");
  await allure.story("Endpoint Reachability");
  await allure.severity("blocker");

  let response;

  await test.step("TC-SUBS-001_S01 - POST ke endpoint getsubsinfo", async () => {
    const result = await postSubsInfo(request, {
      Tid: `TID-REACH-${Date.now()}`,
      Msisdn: VALID_MSISDN,
      Lang: "EN",
      Eid: "IDCC",
      IMSI: "123456789012345"
    });
    response = result.response;
    console.log(
      `[TC-SUBS-001] Status: ${response.status()} | URL: ${BASE_URL}`
    );
  });

  await test.step("TC-SUBS-001_S02 - Verifikasi status 200", async () => {
    expect(
      response.status(),
      `Endpoint ${BASE_URL} harus mengembalikan HTTP 200`
    ).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-SUBS-002 — Schema validation: response mengandung semua field wajib", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Get Subscriber Info");
  await allure.story("Response Schema");
  await allure.severity("critical");

  const body = {
    Tid: `TID-SCHEMA-${Date.now()}`,
    Msisdn: VALID_MSISDN,
    Lang: "EN",
    Eid: "IDCC",
    IMSI: "123456789012345"
  };

  let json;

  await test.step("TC-SUBS-002_S01 - POST request dengan MSISDN valid", async () => {
    const result = await postSubsInfo(request, body);
    expect(result.response.status(), "Response harus 200 OK").toBe(200);
    json = result.json;
    console.log("[TC-SUBS-002] Response:", JSON.stringify(json, null, 2));
  });

  await test.step("TC-SUBS-002_S02 - Verifikasi response adalah valid JSON object", async () => {
    expect(json, "Response harus berupa object JSON, bukan null").toBeTruthy();
    expect(typeof json, "Response harus berupa object").toBe("object");
  });

  await test.step("TC-SUBS-002_S03 - Verifikasi semua field wajib ada di response", async () => {
    for (const key of REQUIRED_RESPONSE_KEYS) {
      expect(
        Object.prototype.hasOwnProperty.call(json, key),
        `Response harus mengandung field '${key}' (nilai boleh kosong)`
      ).toBe(true);
    }
  });

  await test.step("TC-SUBS-002_S04 - Verifikasi Tid dan Msisdn echo-back", async () => {
    expect(json.Tid, "Tid di response harus sama dengan Tid yang dikirim").toBe(
      body.Tid
    );
    expect(
      json.Msisdn,
      "Msisdn di response harus sama dengan Msisdn yang dikirim"
    ).toBe(VALID_MSISDN);
  });

  await test.step("TC-SUBS-002_S05 - Verifikasi struktur Services jika MSISDN terdaftar", async () => {
    if (json.Services?.Service && Array.isArray(json.Services.Service)) {
      console.log(
        "[TC-SUBS-002] MSISDN terdaftar — validasi struktur Services..."
      );
      for (const svc of json.Services.Service) {
        expect(
          svc.ServiceType,
          "Setiap Service harus punya ServiceType"
        ).toBeDefined();
        expect(
          svc.ServiceName,
          "Setiap Service harus punya ServiceName"
        ).toBeDefined();
        if (svc.Quotas?.Quota && Array.isArray(svc.Quotas.Quota)) {
          for (const quota of svc.Quotas.Quota) {
            expect(quota.Name, "Setiap Quota harus punya Name").toBeDefined();
            expect(
              quota.QuotaUnit,
              "Setiap Quota harus punya QuotaUnit"
            ).toBeDefined();
            expect(
              quota.RemainingQuota,
              "Setiap Quota harus punya RemainingQuota"
            ).toBeDefined();
          }
        }
      }
    } else {
      console.log(
        `[TC-SUBS-002] MSISDN '${VALID_MSISDN}' tidak memiliki Services — ` +
          "skip validasi struktur Services."
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-SUBS-002B — Positive scenario: MSISDN terdaftar mengembalikan data subscriber aktif", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Get Subscriber Info");
  await allure.story("Positive Scenario");
  await allure.severity("normal");

  // Skip jika tidak ada MSISDN dari DB maupun .env
  if (!tc?.msisdnValid && !process.env.TEST_MSISDN_VALID) {
    console.log(
      "[TC-SUBS-002B] SKIP — Set TEST_MSISDN_VALID di .env ke MSISDN nyata SIT"
    );
    test.skip();
  }

  const body = {
    Tid: `TID-POS-${Date.now()}`,
    Msisdn: VALID_MSISDN,
    Lang: "EN",
    Eid: "IDCC",
    IMSI: "123456789012345"
  };

  let json;

  await test.step("TC-SUBS-002B_S01 - POST dengan MSISDN aktif", async () => {
    const result = await postSubsInfo(request, body);
    expect(result.response.status(), "Response harus 200 OK").toBe(200);
    json = result.json;
    console.log("[TC-SUBS-002B] Response:", JSON.stringify(json, null, 2));
  });

  await test.step("TC-SUBS-002B_S02 - Verifikasi indikator subscriber aktif", async () => {
    // Catatan SIT behavior: IMSI selalu kosong ("") meskipun MSISDN terdaftar.
    // Indikator subscriber AKTIF yang reliable: ServiceClass, SimType, Offers
    expect(
      json.ServiceClass,
      "MSISDN terdaftar harus mengembalikan ServiceClass yang terisi"
    ).toBeTruthy();

    expect(
      json.SimType,
      "MSISDN terdaftar harus mengembalikan SimType (contoh: USIM)"
    ).toBeTruthy();

    expect(
      json.Offers?.Offer,
      "MSISDN terdaftar harus memiliki minimal 1 Offer"
    ).toBeTruthy();

    expect(
      Array.isArray(json.Offers?.Offer) && json.Offers.Offer.length > 0,
      "Offers.Offer harus berupa array dengan minimal 1 item"
    ).toBe(true);

    console.log(
      `[TC-SUBS-002B] Subscriber aktif — ` +
        `ServiceClass: ${json.ServiceClass}, ` +
        `SimType: ${json.SimType}, ` +
        `Offers: ${json.Offers?.Offer?.length ?? 0} item(s), ` +
        `Balance: ${json.CustBalanceInfo}, ` +
        `ExpiredDate: ${json.ExpiredDate}`
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-SUBS-003 — Negative scenario: MSISDN tidak terdaftar mengembalikan Services kosong", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Get Subscriber Info");
  await allure.story("Negative Scenario");
  await allure.severity("normal");

  const body = {
    Tid: `TID-NEG-${Date.now()}`,
    Msisdn: INVALID_MSISDN,
    Lang: "EN",
    Eid: "IDCC",
    IMSI: "000000000000000"
  };

  let json;

  await test.step("TC-SUBS-003_S01 - POST dengan MSISDN tidak terdaftar", async () => {
    const result = await postSubsInfo(request, body);
    expect(result.response.status(), "Response harus tetap 200").toBe(200);
    json = result.json;
    console.log("[TC-SUBS-003] Response:", JSON.stringify(json, null, 2));
  });

  await test.step("TC-SUBS-003_S02 - Verifikasi Tid dan Msisdn echo-back", async () => {
    expect(json.Tid, "Response harus mengandung Tid").toBeTruthy();
    expect(json.Msisdn, "Response harus mengandung Msisdn").toBeTruthy();
  });

  await test.step("TC-SUBS-003_S03 - Verifikasi Services kosong untuk MSISDN tidak terdaftar", async () => {
    const hasEmptyServices =
      !json.Services?.Service ||
      (Array.isArray(json.Services.Service) &&
        json.Services.Service.length === 0);

    expect(
      hasEmptyServices,
      "Negative scenario: Services harus kosong untuk MSISDN tidak terdaftar"
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-SUBS-004 — Request validation: tanpa field Msisdn harus error", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Get Subscriber Info");
  await allure.story("Request Validation");
  await allure.severity("normal");

  let status, responseText;

  await test.step("TC-SUBS-004_S01 - POST tanpa field Msisdn", async () => {
    const result = await postSubsInfo(request, {
      Tid: `TID-NOMSISDN-${Date.now()}`,
      Lang: "EN",
      Eid: "IDCC",
      IMSI: "123456789012345"
      // Msisdn sengaja dihilangkan
    });
    status = result.response.status();
    responseText = await result.response.text().catch(() => "");
    console.log(`[TC-SUBS-004] Status: ${status}`);
    console.log(`[TC-SUBS-004] Response: ${responseText.slice(0, 200)}`);
  });

  await test.step("TC-SUBS-004_S02 - Verifikasi API mengembalikan error", async () => {
    const isErrorResponse =
      status === 400 ||
      status === 422 ||
      status === 500 ||
      responseText.toLowerCase().includes("error") ||
      responseText.toLowerCase().includes("invalid") ||
      responseText.toLowerCase().includes("required");

    expect(
      isErrorResponse,
      `API harus error ketika Msisdn tidak dikirim. Status: ${status}`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-SUBS-005 — Auth validation: tanpa Authorization header harus 401 atau 403", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Get Subscriber Info");
  await allure.story("Authentication");
  await allure.severity("critical");

  let status;

  await test.step("TC-SUBS-005_S01 - POST tanpa Authorization header", async () => {
    const result = await postSubsInfo(
      request,
      {
        Tid: `TID-NOAUTH-${Date.now()}`,
        Msisdn: VALID_MSISDN,
        Lang: "EN",
        Eid: "IDCC",
        IMSI: "123456789012345"
      },
      { headers: { "Content-Type": "application/json" } }
    );
    status = result.response.status();
    console.log(`[TC-SUBS-005] Status tanpa Auth: ${status}`);
  });

  await test.step("TC-SUBS-005_S02 - Verifikasi response 401 atau 403", async () => {
    expect(
      [401, 403].includes(status),
      `API harus mengembalikan 401 atau 403 tanpa Authorization. Actual: ${status}`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test("TC-SUBS-006 — Performance: response time harus di bawah 10 detik", async ({
  request
}) => {
  await allure.epic("API Readiness");
  await allure.feature("Get Subscriber Info");
  await allure.story("Performance");
  await allure.severity("normal");

  let elapsed, status;

  await test.step("TC-SUBS-006_S01 - POST dan ukur response time", async () => {
    const startTime = Date.now();
    const result = await postSubsInfo(request, {
      Tid: `TID-PERF-${Date.now()}`,
      Msisdn: VALID_MSISDN,
      Lang: "EN",
      Eid: "IDCC",
      IMSI: "123456789012345"
    });
    elapsed = Date.now() - startTime;
    status = result.response.status();
    console.log(`[TC-SUBS-006] Response time: ${elapsed}ms`);
  });

  await test.step("TC-SUBS-006_S02 - Verifikasi request berhasil dan response time < 10s", async () => {
    expect(status, "Request harus berhasil (200)").toBe(200);
    expect(
      elapsed,
      `Response time ${elapsed}ms melebihi batas maksimum 10.000ms`
    ).toBeLessThan(10_000);
  });
});
