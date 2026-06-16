import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import path from "path";
import { fileURLToPath } from "url";
import {
  getModule,
  getTestParams,
  updateTestParams,
  incrementModuleCounter,
  closeDb,
  setRuntimeState,
  updateRun,
  getSfEnvironment
} from "../../utils/db.js";
import { sfOAuthLogin } from "../../utils/sf-auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runId = process.env.TEST_RUN_ID ? Number(process.env.TEST_RUN_ID) : null;
const userId = process.env.USER_ID ? Number(process.env.USER_ID) : null;
let runError = null;

let counter;
let tc001;
let tc002;
let instanceUrl;
let accessToken;
let leadId;
let opportunityId;

const userDataDirectory = path.resolve(__dirname, "../../.sf-profile");
let context;
let page;

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

  await incrementModuleCounter("lead_mgmt");

  const module = await getModule("lead_mgmt");
  counter = module.counter;
  tc001 = await getTestParams("lead_mgmt", "tc001", userId);
  tc002 = await getTestParams("lead_mgmt", "tc002", userId);

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
        created_ids: { createdLeadId: leadId },
        finished_at: new Date()
      });
    }
  }
  await closeDb();
  if (context) await context.close();
});

/**
 * Fetches the Status field of a Lead via Salesforce REST API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} instanceUrl  - e.g. https://your-org.my.salesforce.com
 * @param {string} accessToken  - Bearer token from OAuth
 * @param {string} leadId       - Salesforce Lead record ID
 * @param {string} [expectedStatus] - If provided, asserts the status matches
 * @returns {Promise<string>} The Lead Status value
 */
async function getLeadStatus(
  request,
  instanceUrl,
  accessToken,
  leadId,
  expectedStatus
) {
  const url = `${instanceUrl}/services/data/v65.0/sobjects/Lead/${leadId}?fields=Status`;

  const response = await request.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  console.log("Lead API response:", (await response.body()).toString());
  expect(response.ok(), "Lead status API request should succeed").toBeTruthy();

  const leadStatus = (await response.json()).Status;
  console.log("Lead status from API:", leadStatus);

  if (expectedStatus !== undefined) {
    expect(leadStatus, `Lead status should be '${expectedStatus}'`).toBe(
      expectedStatus
    );
  }

  return leadStatus;
}

test("API Connection Test", async () => {
  expect(instanceUrl, "instanceUrl should be set by beforeAll").toBeTruthy();
  expect(accessToken, "accessToken should be set by beforeAll").toBeTruthy();
});

// test('TC001_Navigate to IOS ESM app', async () => {
//     await page.getByRole('button', { name: 'App Launcher' }).click();
//     await page.getByRole('combobox', { name: 'Search apps and items...' }).fill('IOH ESM');
//     await page.getByLabel('Apps', { exact: true }).waitFor({ state: 'visible' });
//     await expect(
//         page.getByLabel('Apps', { exact: true }).getByText('IOH ESM'),
//         'IOH ESM app should appear in the Apps search results'
//     ).toBeVisible();
// });

test("TC001_View All My Leads", async () => {
  await allure.epic("Lead Management");
  await allure.feature("Manage My Leads");

  await allure.story("View All My Leads");
  await allure.severity("normal");
  await allure.label(
    "pre-requisite",
    "1.1 User has logged into Salesforce as Sales profile"
  );

  await test.step("TC001_S01 - Open Leads list view", async () => {
    await page.goto(
      `${loginUser.afterLoginUrl}lightning/o/Lead/list?filterName=__Recent`
    );

    // Expected: Leads list view is displayed
    await expect(
      page.getByRole("button", { name: "Select a List View: Leads" }),
      "Leads list view should be displayed"
    ).toBeVisible();
  });

  // await test.step('TC001_S02 - Select All my Leads', async () => {
  //     await page.getByRole('button', { name: 'Select a List View: Leads' }).click();
  //     await page.getByText(tc001.listViewName).click();

  //     // Expected: All leads owned by the user displayed with Project Name and Created By fields
  //     await expect(
  //         page.getByText(tc001.listViewName),
  //         `List view '${tc001.listViewName}' should be selected and displayed`
  //     ).toBeVisible();
  //     await expect(
  //         page.getByRole('button', { name: `Sort by: ${tc001.expectedColumns[0]}` }),
  //         `Column '${tc001.expectedColumns[0]}' should be present in the list view`
  //     ).toBeVisible();
  //     await expect(
  //         page.getByRole('button', { name: `Sort by: ${tc001.expectedColumns[1]}` }),
  //         `Column '${tc001.expectedColumns[1]}' should be present in the list view`
  //     ).toBeVisible();
  //     await expect(
  //         page.getByLabel(tc001.expectedColumns[0], { exact: true }).locator('lightning-primitive-header-factory'),
  //         `Column header '${tc001.expectedColumns[0]}' should display correct label`
  //     ).toContainText(tc001.expectedColumns[0]);
  //     await expect(
  //         page.getByLabel(tc001.expectedColumns[1], { exact: true }),
  //         `Column header '${tc001.expectedColumns[1]}' should display correct label`
  //     ).toContainText(tc001.expectedColumns[1]);
  // });
});

test("TC002_Create New Lead", async ({ request }) => {
  await allure.epic("Lead Management");
  await allure.feature("Manage My Leads");
  await allure.story("Create New Lead");
  await allure.severity("critical");

  await test.step("TC002_S01 - Click the New button", async () => {
    await page.goto(
      `${loginUser.afterLoginUrl}lightning/o/Lead/list?filterName=__Recent`
    );
    await page.getByRole("button", { name: "New" }).click();

    // Expected: Create new lead screen is displayed
    await expect(
      page.getByRole("heading", { name: "New Lead" }),
      "New Lead creation form should be displayed"
    ).toBeVisible();
  });

  await test.step("TC002_S02 - Fill all mandatory fields", async () => {
    await page.getByRole("combobox", { name: "Account Name" }).click();
    await page
      .getByRole("combobox", { name: "Account Name" })
      .fill(tc002.accountName);
    await page
      .getByRole("option", { name: tc002.accountOption, exact: true })
      .click();

    await page.getByRole("textbox", { name: "Opportunity RFS Date" }).click();
    for (let i = 0; i < tc002.rfsDateMonthsAhead; i++) {
      await page.getByRole("button", { name: "Next Month" }).click();
    }
    await page.getByRole("button", { name: tc002.rfsDateDay }).nth(0).click();

    await page.getByRole("textbox", { name: "Project Name" }).click();
    await page
      .getByRole("textbox", { name: "Project Name" })
      .fill(`${tc002.projectName} ${counter}`);

    await page.getByRole("textbox", { name: "Company" }).click();
    await page
      .getByRole("textbox", { name: "Company" })
      .fill(`${tc002.company} ${counter}`);

    await page.getByRole("combobox", { name: "Lead Source" }).click();
    await page.getByRole("option", { name: tc002.leadSource }).click();

    // await page.getByRole('textbox', { name: 'Description' }).click();
    // await page.getByRole('textbox', { name: 'Description' }).fill(tc002.description);

    await page.getByRole("combobox", { name: "Lead Currency" }).click();
    await page.getByText(tc002.leadCurrency).click();

    await page.getByRole("combobox", { name: "Primary Contact" }).click();
    await page
      .getByRole("combobox", { name: "Primary Contact" })
      .fill(tc002.primaryContactSearch);
    await page
      .getByRole("option", { name: tc002.primaryContactOption })
      .nth(1)
      .click();

    await page.getByRole("textbox", { name: "Last Name" }).click();
    await page
      .getByRole("textbox", { name: "Last Name" })
      .fill(`${tc002.lastName} ${counter}`);

    await page.getByRole("textbox", { name: "Mobile" }).click();
    await page
      .getByRole("textbox", { name: "Mobile" })
      .fill(`${tc002.mobile}${counter}`);

    await page.getByRole("combobox", { name: "Type of Product" }).click();
    await page.getByText(tc002.typeOfProduct).click();

    await page.getByRole("combobox", { name: "Function" }).click();
    await page
      .locator("span")
      .filter({ hasText: new RegExp(`^${tc002.function}$`) })
      .first()
      .click();

    await page.getByRole("combobox", { name: "Budget Status?" }).click();
    await page.getByText(tc002.budgetStatus).click();

    await page
      .getByRole("combobox", { name: "Role of Lead (Seniority)" })
      .click();
    await page.getByText(tc002.roleOfLeadSeniority).click();

    await page
      .getByRole("combobox", { name: "What is the timeframe of" })
      .click();
    await page.getByText(tc002.timeframe).click();

    await page.getByRole("combobox", { name: "New requirements?" }).click();
    await page
      .getByRole("option", { name: tc002.newRequirements })
      .nth(0)
      .click();

    await page
      .getByRole("combobox", { name: "Is he an existing customer?" })
      .click();
    await page
      .getByRole("option", { name: tc002.existingCustomer })
      .nth(0)
      .click();

    await page.getByRole("combobox", { name: "Lead Type" }).click();
    await page.getByTitle(tc002.leadType).click();

    // Expected: All mandatory fields are filled
    await expect(
      page.getByRole("textbox", { name: "Project Name" }),
      "Project Name field should reflect the entered value"
    ).toHaveValue(`${tc002.projectName} ${counter}`);
  });

  await test.step("TC002_S03 - Click Save", async () => {
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL("**/lightning/r/Lead/**");

    leadId = page.url().match(/\/lightning\/r\/Lead\/([^/]+)\//)?.[1];
    console.log(`[TC002] Lead ID: ${leadId}`);

    // Expected: Lead created successfully, status is New, lead owner is current user
    await expect(
      page
        .locator("div")
        .filter({ hasText: 'Success notification.Lead "Mr' })
        .nth(3),
      "Success notification should appear after saving the lead"
    ).toBeVisible({ timeout: 10000 });

    // await expect(page.getByText('Project Name', { exact: true }).nth(0)).toBeVisible();
    // await expect(page.getByText('Lead Owner', { exact: true }).nth(0)).toBeVisible();
    // await expect(page.getByText('Lead Status', { exact: true }).nth(0)).toBeVisible();

    // await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
  });

  // await test.step('TC002_S04 - Verify the lead status', async () => {
  // Expected: Lead status is New
  // await getLeadStatus(request, instanceUrl, accessToken, leadId, 'Qualified');
  // });
});

test("TC008_Update Lead Status", async ({ request }) => {
  await allure.epic("Lead Management");
  await allure.feature("Manage My Leads");
  await allure.story("Update Lead Status");
  await allure.severity("normal");

  await test.step("TC008_S01 - Update lead status to New to Working", async () => {
    // await page.goto(`${loginUser.afterLoginUrl}lightning/r/Lead/${leadId}/view`);
    await expect(
      page.getByRole("button", { name: "Show more actions" }),
      "Show more actions button should appear"
    ).toBeVisible();
    await page.getByRole("button", { name: "Show more actions" }).click();
    await page
      .getByRole("menuitem", { name: "Update Lead Status" })
      .first()
      .click();
    await page.getByRole("button", { name: "Next" }).click();
    // await expect(
    //     page.locator('lightning-formatted-rich-text'),
    //     'Status update dialog should show the New to Working transition'
    // ).toContainText('New to Working');
    await page.getByRole("button", { name: "Next" }).click();
    await page
      .getByRole("dialog", { name: "Update Lead Status" })
      .waitFor({ state: "hidden" });
    await page.waitForTimeout(3_000);
    // Expected: Lead status is Working
    await getLeadStatus(request, instanceUrl, accessToken, leadId, "Working");
  });

  await test.step("TC008_S02 - Update lead status to Working to Qualified", async () => {
    await page.getByRole("button", { name: "Show more actions" }).click();
    await page
      .getByRole("menuitem", { name: "Update Lead Status" })
      .first()
      .click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(
      page.locator("lightning-formatted-rich-text"),
      "Status update dialog should show the Working to Qualify transition"
    ).toContainText("Working to Qualify");
    await page.getByRole("button", { name: "Next" }).click();
    await page
      .getByRole("dialog", { name: "Update Lead Status" })
      .waitFor({ state: "hidden" });
    // Expected: Lead status is Qualified
    await getLeadStatus(request, instanceUrl, accessToken, leadId, "Qualified");
  });

  await test.step("TC008_S03 - Update lead status to Qualified to Converted", async () => {
    // await page.goto(`${loginUser.afterLoginUrl}lightning/r/Lead/${leadId}/view`);
    await page.getByRole("button", { name: "Show more actions" }).click();
    await page
      .getByRole("menuitem", { name: "Update Lead Status" })
      .first()
      .click();
    await page
      .getByRole("dialog", { name: "Update Lead Status" })
      .waitFor({ state: "visible" });
    await page.waitForTimeout(3_000);
    await expect(
      page.getByText("Something went wrong. Please"),
      'The flow is showing unexpected message: "Something went wrong. Please contact the admin for further check."'
    ).not.toBeVisible();
    await page.locator('[name="Name_of_incumbent"]').fill("Kompetitor");
    await expect(
      page.getByRole("button", { name: "Next" }),
      "Next button should be visible"
    ).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    // await expect(
    //     page.locator('lightning-formatted-rich-text'),
    //     'Status update dialog should show the New to Working transition'
    // ).toContainText('New to Working');
    await page.getByRole("button", { name: "Finish" }).click();
    await page
      .getByRole("dialog", { name: "Update Lead Status" })
      .waitFor({ state: "hidden" });
    await page.waitForTimeout(3_000);
    await expect(page.getByRole("button", { name: "Convert" })).toBeVisible();
  });
});

test("TC009_Convert Lead", async () => {
  await allure.epic("Lead Management");
  await allure.feature("Manage My Leads");
  await allure.story("Convert Lead");
  await allure.severity("critical");

  await test.step("TC009_S01 - Convert Lead", async () => {
    // await page.goto(`${loginUser.afterLoginUrl}lightning/r/Lead/${leadId}/view`);
    await page.getByRole("button", { name: "Convert" }).click();
    await page.waitForURL("**/lightning/r/Opportunity/**", { timeout: 10000 });

    // await expect(
    //     page.locator('records-entity-label').filter({ hasText: 'Opportunity' }),
    //     'Page should show an Opportunity record after lead conversion'
    // ).toBeVisible();
    opportunityId = page
      .url()
      .match(/\/lightning\/r\/Opportunity\/([^/]+)\//)?.[1];
    console.log(`[TC009] Opportunity ID: ${opportunityId}`);

    await setRuntimeState("opportunityId", opportunityId);
    console.log(
      `[TC009] Updated opportunityId in runtime_state: ${opportunityId}`
    );

    // await expect(
    //     page.locator('forcegenerated-highlightspanel_opportunity___012ms000000haxkyao___compact___view___recordlayout2'),
    //     `Opportunity should be linked to account '${tc002.accountOption}'`
    // ).toContainText(tc002.accountOption);
    // await expect(
    //     page.locator('forcegenerated-highlightspanel_opportunity___012ms000000haxkyao___compact___view___recordlayout2'),
    //     "Opportunity stage should be 'Scoping' after lead conversion"
    // ).toContainText('Scoping');
  });
});
