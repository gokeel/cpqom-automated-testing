import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import path from "path";
import { fileURLToPath } from "url";
import {
  getRuntimeState,
  getTestParams,
  setRuntimeState,
  closeDb,
  updateRun,
  getSfEnvironment
} from "../../utils/db.js";
import { sfOAuthLogin } from "../../utils/sf-auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runId = process.env.TEST_RUN_ID ? Number(process.env.TEST_RUN_ID) : null;
const userId = process.env.USER_ID ? Number(process.env.USER_ID) : null;
let runError = null;

let instanceUrl;
let accessToken;
let opportunityId;
let sysAdminUserId;
let quoteId;
let contractId;
let createdOrderId;
let moduleOrchestrationPlanIDs = [];
let moduleAssetIDs = [];

const userDataDirectory = path.resolve(__dirname, "../../.sf-profile");
let context;
let page;
let testParams;

let sysadmin;
let loginUser;

// runs only once before all tests in the file
test.beforeAll(async ({ request }) => {
  sysadmin = await getSfEnvironment("sysadmin");
  const loginPersona =
    process.env.TEST_USER_ADMIN === "true" ? "sysadmin" : "salesOperation";
  loginUser =
    loginPersona === "sysadmin"
      ? sysadmin
      : await getSfEnvironment(loginPersona);

  opportunityId = await getRuntimeState("opportunityId", userId);
  quoteId = await getRuntimeState("quoteId", userId);
  testParams = await getTestParams("quote_mgmt", "tc_quote", userId);
  console.log("Opportunity ID: " + opportunityId);

  context = await chromium.launchPersistentContext(userDataDirectory, {
    headless: process.env.HEADLESS === "true" || process.env.CI === "true",
    args: ["--start-maximized"]
  });
  page = await context.newPage();

  await page.goto(loginUser.url);
  await page
    .getByRole("textbox", { name: "Username" })
    .fill(loginUser.username);
  await page.getByRole("textbox", { name: "Password" }).click();
  await page
    .getByRole("textbox", { name: "Password" })
    .fill(loginUser.password);
  await page.getByRole("button", { name: "Log In to Sandbox" }).click();

  await page.waitForURL("**/lightning/**", { timeout: 60000 });
  await context.storageState({ path: ".sf-profile/sf-state.json" });

  ({ accessToken, instanceUrl } = await sfOAuthLogin(request, sysadmin));
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
        created_ids: {
          createdContractId: contractId,
          createdOrderIDs: createdOrderId ? [createdOrderId] : [],
          createdOrchestrationPlanIDs: moduleOrchestrationPlanIDs,
          createdAssetIDs: moduleAssetIDs
        },
        finished_at: new Date()
      });
    }
  }
  await closeDb();
  if (context) await context.close();
});

test("API Connection Test", async ({ request }) => {
  expect(instanceUrl, "instanceUrl should be set by beforeAll").toBeTruthy();
  expect(accessToken, "accessToken should be set by beforeAll").toBeTruthy();

  // Get the current user's ID
  const userInfoResponse = await request.get(
    `${instanceUrl}/services/oauth2/userinfo`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  expect(
    userInfoResponse.ok(),
    "User info request should succeed"
  ).toBeTruthy();
  const userInfoBody = await userInfoResponse.json();
  sysAdminUserId = userInfoBody.user_id;

  // await patchMissingScoreCard(request, instanceUrl, accessToken);
});

/**
 * Executes a Salesforce REST request and throws on HTTP errors or embedded
 * Vlocity error bodies (HTTP 200 with { "error": "..." }).
 * @returns {Promise<object|string>}
 */
async function sfRequest(request, method, url, { headers, data } = {}) {
  const opts = { headers };
  if (data !== undefined) opts.data = data;

  const response = await request[method](url, opts);

  let body;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  if (!response.ok()) {
    console.error(
      `sfRequest error — ${method.toUpperCase()} ${url} → ${response.status()}`
    );
    console.error("Response body:", JSON.stringify(body, null, 2));
    const err = new Error(
      `HTTP ${response.status()} ${method.toUpperCase()} ${url}`
    );
    err.body = body;
    throw err;
  }

  // Some Vlocity endpoints return HTTP 200 with an embedded error
  if (body && typeof body === "object") {
    const errField = body.error ?? body.errorCode;
    if (errField && !body.cartId && !body.records) {
      console.error(`sfRequest Vlocity error — ${method.toUpperCase()} ${url}`);
      console.error("Response body:", JSON.stringify(body, null, 2));
      const err = new Error(
        `Salesforce error: ${errField} — ${body.message ?? ""}`
      );
      err.body = body;
      throw err;
    }
  }

  return body;
}

async function getDocumentTemplateId(request) {
  const q = encodeURIComponent(
    "SELECT id, name, vlocity_cmt__VersionNumber__c, vlocity_cmt__IsActive__c FROM vlocity_cmt__DocumentTemplate__c WHERE name LIKE 'IOH FAB Document%' AND vlocity_cmt__IsActive__c = true"
  );
  const body = await sfRequest(
    request,
    "get",
    `${instanceUrl}/services/data/v65.0/query?q=${q}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    }
  );
  const record = body.records?.[0];
  if (!record) throw new Error("No active IOH FAB Document template found");
  console.log("DocumentTemplate found:", record.Name, record.Id);
  return record.Id;
}

async function createContractVersion(request) {
  const documentTemplateId = await getDocumentTemplateId(request);
  const body = await sfRequest(
    request,
    "post",
    `${instanceUrl}/services/data/v65.0/sobjects/vlocity_cmt__ContractVersion__c`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      data: {
        vlocity_cmt__ContractId__c: contractId,
        vlocity_cmt__Status__c: "Active",
        vlocity_cmt__DocumentTemplateId__c: documentTemplateId
      }
    }
  );
  console.log("ContractVersion created:", body.id);
  return body.id;
}

async function patchContract(request) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

  await sfRequest(
    request,
    "patch",
    `${instanceUrl}/services/data/v65.0/sobjects/Contract/${contractId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      data: {
        StartDate: startDate,
        ContractTerm: 12
      }
    }
  );
  console.log("Contract patched — StartDate:", startDate, "ContractTerm: 12");
}

async function patchContractStatusSigned(request) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

  await sfRequest(
    request,
    "patch",
    `${instanceUrl}/services/data/v65.0/sobjects/Contract/${contractId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      data: {
        Status: "Signed"
      }
    }
  );
}

async function getContractRecord(request) {
  const q = encodeURIComponent(
    `SELECT Id, ContractNumber, vlocity_cmt__QuoteId__r.Name, AccountId FROM Contract WHERE Id = '${contractId}' LIMIT 1`
  );
  const body = await sfRequest(
    request,
    "get",
    `${instanceUrl}/services/data/v65.0/query?q=${q}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    }
  );
  const record = body.records?.[0];
  if (!record) throw new Error(`Contract ${contractId} not found`);
  const contractRecord = {
    contractNumber: record.ContractNumber,
    quoteName: record.vlocity_cmt__QuoteId__r?.Name,
    accountId: record.AccountId
  };
  return contractRecord;
}

async function patchAccount(request, accountId) {
  await sfRequest(
    request,
    "patch",
    `${instanceUrl}/services/data/v65.0/sobjects/Account/${accountId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      data: {
        CPQ_Collection_Status__c: "CLEARED",
        CPQ_Collection_Status_Date__c: new Date().toISOString()
      }
    }
  );
  console.log("Account patched — CPQ_Collection_Status__c: CLEARED");
}

async function getChildOrders(request, parentOrderId) {
  const q = encodeURIComponent(
    `SELECT Id, Name, OrderNumber, Status, vlocity_cmt__ParentOrderId__c FROM Order WHERE vlocity_cmt__ParentOrderId__c = '${parentOrderId}'`
  );
  const body = await sfRequest(
    request,
    "get",
    `${instanceUrl}/services/data/v65.0/query?q=${q}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    }
  );
  console.log(`Child orders found: ${body.totalSize}`);
  return body.records;
}

async function getOrchestrationPlans(request, orders) {
  let whereClause;
  if (typeof orders === "string") {
    // single order ID — query by order
    whereClause = `vlocity_cmt__OrderId__c IN ('${orders}')`;
  } else if (Array.isArray(orders) && orders.length === 0) {
    console.log("getOrchestrationPlans — no IDs, skipping");
    return [];
  } else if (Array.isArray(orders) && typeof orders[0] === "string") {
    // array of orchestration plan IDs collected from URL redirects
    const ids = orders.map((id) => `'${id}'`).join(",");
    whereClause = `Id IN (${ids})`;
  } else {
    // array of Order records with .Id
    const ids = orders.map((o) => `'${o.Id}'`).join(",");
    whereClause = `vlocity_cmt__OrderId__c IN (${ids})`;
  }
  const q = encodeURIComponent(
    `SELECT Id, vlocity_cmt__OrderId__c, Name, vlocity_cmt__OrderId__r.OrderNumber, CreatedDate FROM vlocity_cmt__OrchestrationPlan__c WHERE ${whereClause} ORDER BY CreatedDate DESC`
  );
  const body = await sfRequest(
    request,
    "get",
    `${instanceUrl}/services/data/v65.0/query?q=${q}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    }
  );
  console.log(`OrchestrationPlans found: ${body.totalSize}`);
  return body.records;
}

async function assertOrchestrationItemsCompleted(request, orchestrationPlans) {
  const planIds = orchestrationPlans.map((p) => `'${p.Id}'`).join(",");
  const targetNames = ["Start Order", "Create FSL Work Order"];
  const namesClause = targetNames.map((n) => `'${n}'`).join(",");

  const q = encodeURIComponent(
    `SELECT Id, Name, vlocity_cmt__State__c, vlocity_cmt__OrchestrationPlanId__c FROM vlocity_cmt__OrchestrationItem__c WHERE vlocity_cmt__OrchestrationPlanId__c IN (${planIds}) AND Name IN (${namesClause})`
  );
  const body = await sfRequest(
    request,
    "get",
    `${instanceUrl}/services/data/v65.0/query?q=${q}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    }
  );

  for (const name of targetNames) {
    const item = body.records.find((r) => r.Name === name);
    expect(item, `OrchestrationItem '${name}' not found`).toBeTruthy();
    expect(
      item.vlocity_cmt__State__c,
      `OrchestrationItem '${name}' should be Completed`
    ).toBe("Completed");
    console.log(
      `OrchestrationItem '${name}' — State: ${item.vlocity_cmt__State__c} ✓`
    );
  }
}

async function completeOrchestrationItems(request, orchestrationPlans) {
  const planIds = orchestrationPlans.map((p) => `'${p.Id}'`).join(",");
  const sequence = [
    "Completed FSL Work Order",
    "Billing Order Activation",
    "Billing Activated",
    "Assetize Order",
    "End Order (Asset Created)"
  ];
  const namesClause = sequence.map((n) => `'${n}'`).join(",");

  const q = encodeURIComponent(
    `SELECT Id, Name, vlocity_cmt__State__c FROM vlocity_cmt__OrchestrationItem__c WHERE vlocity_cmt__OrchestrationPlanId__c IN (${planIds}) AND Name IN (${namesClause})`
  );
  const body = await sfRequest(
    request,
    "get",
    `${instanceUrl}/services/data/v65.0/query?q=${q}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    }
  );

  for (const name of sequence) {
    const item = body.records.find((r) => r.Name === name);
    if (!item) {
      console.warn(`OrchestrationItem '${name}' not found — skipping`);
      continue;
    }
    await sfRequest(
      request,
      "patch",
      `${instanceUrl}/services/data/v65.0/sobjects/vlocity_cmt__OrchestrationItem__c/${item.Id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        data: { vlocity_cmt__State__c: "Completed" }
      }
    );
    console.log(`OrchestrationItem '${name}' — set to Completed ✓`);
  }
}

async function getOrderRecType(request, orderId) {
  const q = encodeURIComponent(
    `SELECT Id, RecordType.DeveloperName FROM Order WHERE Id = '${orderId}' LIMIT 1`
  );
  const body = await sfRequest(
    request,
    "get",
    `${instanceUrl}/services/data/v65.0/query?q=${q}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    }
  );
  const record = body.records?.[0];
  expect(record, `Order ${orderId} not found`).toBeTruthy();
  return record.RecordType?.DeveloperName;
}

test("TC023: CPQ Enterprise Quote Flow — API", async ({
  request
}, testInfo) => {
  await page.goto(
    `${loginUser.afterLoginUrl}lightning/r/Quote/${quoteId}/view`
  );

  await expect(
    page.getByRole("button", { name: "Create Contract" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Create Contract" }).click();

  await page.waitForURL("**/lightning/r/Contract/**", { timeout: 10000 });
  contractId = page.url().match(/\/lightning\/r\/Contract\/([^/]+)\//)?.[1];
  const contractVersionId = await createContractVersion(request);

  await patchContract(request);

  await page.reload();

  // await page.waitForTimeout(3_000);

  await page.getByRole("button", { name: "Current Status: Draft" }).click();
  await page.getByRole("button", { name: "Execute Transition" }).click();

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Upload Document" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Upload Document" }).click();
  await page.getByRole("combobox", { name: "Select Document Type" }).click();
  await page.getByRole("option", { name: "FAB" }).click();
  // await page.getByText('Upload Files').click();
  // await page.getByRole('button', { name: 'Select a file Upload Files Or' }).setInputFiles('chat_transcript.pdf');
  // await page.getByRole('button', { name: 'Upload', exact: true }).click();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.waitFor({ state: "attached", timeout: 10_000 });
  await fileInput.setInputFiles(
    path.resolve(__dirname, "../../test-data/chat_transcript.pdf")
  );
  await expect(
    page.getByText("chat_transcript.pdf"),
    "MLD file should be attached to the uploader field"
  ).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Upload", exact: true }).click();

  await page.goto(
    `${sysadmin.afterLoginUrl}lightning/r/Contract/${contractId}/view`
  );

  await page
    .getByRole("button", { name: "Current Status: Negotiating" })
    .click();
  await page.getByRole("button", { name: "Execute Transition" }).click();

  await page.reload();

  const contractRecord = await getContractRecord(request);

  // await expect(page.getByRole('button', { name: 'Submit for Approval' })).toBeVisible();
  // await page.getByRole('button', { name: 'Submit for Approval' }).click();
  // await page.getByRole('button', { name: 'Submit' }).click();

  await page.goto(
    `${sysadmin.afterLoginUrl}lightning/r/Contract/${contractId}/view`
  );

  await patchContractStatusSigned(request);

  // await page.getByRole('button', { name: 'Current Status: Customer Assessment' }).click();
  // await page.getByRole('combobox', { name: 'Target State' }).click();
  // await page.getByRole('option', { name: 'Signed' }).click();
  // await page.getByRole('button', { name: 'Execute Transition' }).click();

  await page.reload();

  // sebelum check eligibility harus update account fields:
  // CPQ_Collection_Status__c = CLEARED
  // CPQ_Collection_Status_Date__c <= 24 jam
  await patchAccount(request, contractRecord.accountId);

  await expect(
    page.getByRole("button", { name: "Check Eligiblity", exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check Eligiblity", exact: true })
    .click();

  // await page.getByRole('button', { name: 'Check Eligiblity' }).click();
  await page.getByRole("button", { name: "Check Eligibility" }).click();
  await expect(
    page.locator("div").filter({ hasText: "Success notification." }).nth(3)
  ).toBeVisible();
  await page.locator("#action button").filter({ hasText: "Show menu" }).click();
  // await page.locator('li').filter({ hasText: 'Activate' }).click();
  // await page.locator('li').filter({ hasText: 'Activate' }).click();
  await page.locator("a").filter({ hasText: "Activate" }).click();

  // berhasil di-activate

  // mulai create order
  await page.locator("button").filter({ hasText: "Create Order" }).click();
  await page.waitForURL("**/lightning/r/Order/**", { timeout: 10000 });
  createdOrderId = page.url().match(/\/lightning\/r\/Order\/([^/]+)\//)?.[1];

  console.log("Created order ID: " + createdOrderId);

  // butuh di cek apakah record type order ini adalah sub order atau bukan
  const orderRecordTypeName = await getOrderRecType(request, createdOrderId);
  console.log("Order record type name: " + orderRecordTypeName);

  await page.waitForTimeout(10_000);
  let orchestrationPlanIDs = [];
  if (orderRecordTypeName == "MasterOrder") {
    // get sub orders
    const subOrders = await getChildOrders(request, createdOrderId);
    console.log(`Sub-orders found: ${subOrders.length}`);

    for (const subOrder of subOrders) {
      const subOrderId = subOrder.Id;
      console.log(
        `Submitting sub-order: ${subOrderId} (${subOrder.OrderNumber})`
      );
      await page.goto(
        `${loginUser.afterLoginUrl}lightning/r/Order/${subOrderId}/view`
      );
      await expect(
        page.getByRole("button", { name: "Submit Order" })
      ).toBeVisible({ timeout: 15_000 });
      await page.getByRole("button", { name: "Submit Order" }).click();
      // await expect(page.locator('div').filter({ hasText: 'Success notification.' }).nth(3)).toBeVisible({ timeout: 15_000 });
      console.log(`Sub-order ${subOrderId} submitted`);
      // await page.waitForTimeout(1_000);

      await page.waitForURL(
        "**/lightning/r/vlocity_cmt__OrchestrationPlan__c/**",
        { timeout: 10000 }
      );
      const planId = page
        .url()
        .match(
          /\/lightning\/r\/vlocity_cmt__OrchestrationPlan__c\/([^/]+)\//
        )?.[1];
      if (planId) {
        orchestrationPlanIDs.push(planId);
        moduleOrchestrationPlanIDs.push(planId);
        console.log(`OrchestrationPlan ID collected: ${planId}`);
      }
    }

    const orchestrationPlans = await getOrchestrationPlans(
      request,
      orchestrationPlanIDs
    );

    await page.waitForTimeout(10_000);

    // await assertOrchestrationItemsCompleted(request, orchestrationPlans);

    await completeOrchestrationItems(request, orchestrationPlans);
  } else if (orderRecordTypeName == "SubOrder") {
    await page.goto(
      `${login.afterLoginUrl}lightning/r/Order/${createdOrderId}/view`
    );
    await expect(
      page.getByRole("button", { name: "Submit Order" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Submit Order" }).click();

    await page.waitForURL(
      "**/lightning/r/vlocity_cmt__OrchestrationPlan__c/**",
      { timeout: 10000 }
    );
    const planId = page
      .url()
      .match(
        /\/lightning\/r\/vlocity_cmt__OrchestrationPlan__c\/([^/]+)\//
      )?.[1];
    if (planId) moduleOrchestrationPlanIDs.push(planId);

    await page.waitForTimeout(10_000);

    const orchestrationPlans = await getOrchestrationPlans(
      request,
      createdOrderId
    );
    await assertOrchestrationItemsCompleted(request, orchestrationPlans);
  }

  // await page.goto('https://b2b-io--cpqsitdelo.sandbox.lightning.force.com/lightning/r/Order/801MR00000BbPsSYAV/view');

  // cek ke related ke sub order
  // ubah status ke Ready to Submit
  // await page.goto('https://b2b-io--cpqsitdelo.sandbox.my.salesforce.com/?ec=302&startURL=%2Fvisualforce%2Fsession%3Furl%3Dhttps%253A%252F%252Fb2b-io--cpqsitdelo.sandbox.lightning.force.com%252Flightning%252Fr%252FOrder%252F801MR00000BbPsSYAV%252Fview');

  // automate using API only
  // await page.getByRole('tab', { name: 'Related' }).click();
  // await expect(page.getByRole('heading', { name: 'Orders (1)' })).toBeVisible();
  // await page.getByRole('link', { name: '00094725' }).click();
  // await page.getByRole('button', { name: 'Close' }).click();
  // await page.getByRole('button', { name: 'Close' }).click();
  // await page.getByRole('button', { name: 'Close' }).click();
  // await page.getByRole('button', { name: 'Close' }).click();
  // await page.getByRole('rowheader', { name: 'Open 00094725 Preview' }).click();
  // await page.getByRole('rowheader', { name: 'Open 00094725 Preview' }).click();
  // await page.getByRole('button', { name: 'Close' }).click();
  // await page.getByRole('button', { name: 'Close' }).click();
  // await page.getByRole('button', { name: 'Close' }).click();
  // await page.getByRole('button', { name: 'Show Actions' }).click();
  // await page.locator('span').filter({ hasText: '00094725Open 00094725 Preview' }).click();
  // await page.getByRole('link', { name: '00094725' }).click();
  // await page.getByLabel('Orders').getByRole('link', { name: '00094725' }).click();
  // await expect(page.getByRole('button', { name: 'Submit Order' })).toBeVisible();
  // await page.getByRole('button', { name: 'Submit Order' }).click();
  // await page.goto('https://b2b-io--cpqsitdelo.sandbox.lightning.force.com/lightning/r/vlocity_cmt__OrchestrationPlan__c/a67MR0000000IOLYA2/view');
  // await expect(page.locator('records-entity-label').filter({ hasText: 'Orchestration Plan' })).toBeVisible();
});
