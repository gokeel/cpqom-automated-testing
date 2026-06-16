import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import path from "path";
import { fileURLToPath } from "url";
import {
  getModule,
  getTestParams,
  getRuntimeState,
  closeDb,
  updateRun,
  getSfEnvironment
} from "../../utils/db.js";
import { sfOAuthLogin } from "../../utils/sf-auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const runId = process.env.TEST_RUN_ID ? Number(process.env.TEST_RUN_ID) : null;
const userId = process.env.USER_ID ? Number(process.env.USER_ID) : null;
let runError = null;

// let counter;
let tc010;
let instanceUrl;
let accessToken;
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

  const module = await getModule("oppty_mgmt_sales");
  // counter = module.counter;
  tc010 = await getTestParams("oppty_mgmt_sales", "tc010", userId);
  opportunityId = await getRuntimeState("opportunityId");

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
        created_ids: { createdOpportunityId: opportunityId },
        finished_at: new Date()
      });
    }
  }
  await closeDb();
  if (context) await context.close();
});

/**
 * Updates the Number Of Contracted Months field of an Opportunity via Salesforce REST API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} instanceUrl  - e.g. https://your-org.my.salesforce.com
 * @param {string} accessToken  - Bearer token from OAuth
 * @returns {Promise<void>} Resolves when the PATCH is successful
 */
async function patchContractedMonths(request, instanceUrl, accessToken) {
  const patchUrl = `${instanceUrl}/services/data/v65.0/sobjects/Opportunity/${opportunityId}`;
  const patchResponse = await request.patch(patchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    data: { vlocity_cmt__NumberOfContractedMonths__c: 24 }
  });

  // Salesforce returns 204 No Content on a successful PATCH
  expect(
    patchResponse.status(),
    "Patch NumberOfContractedMonths should return 204 No Content"
  ).toBe(204);
  console.log(
    `vlocity_cmt__NumberOfContractedMonths__c set to 24 on Opportunity ${opportunityId}`
  );
}

async function deleteOpportunityLineItems(request, instanceUrl, accessToken) {
  const queryUrl = `${instanceUrl}/services/data/v65.0/query?q=SELECT+Id+FROM+OpportunityLineItem+WHERE+OpportunityId='${opportunityId}'`;
  const queryResponse = await request.get(queryUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  expect(
    queryResponse.ok(),
    "Query for OpportunityLineItems should succeed"
  ).toBeTruthy();
  const lineItems = (await queryResponse.json()).records;
  for (const item of lineItems) {
    const deleteUrl = `${instanceUrl}/services/data/v65.0/sobjects/OpportunityLineItem/${item.Id}`;
    const deleteResponse = await request.delete(deleteUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    expect(
      deleteResponse.status(),
      `Delete OpportunityLineItem ${item.Id} should return 204 No Content`
    ).toBe(204);
    console.log(`Deleted OpportunityLineItem with Id ${item.Id}`);
  }
}

async function addOpportunityTeamMember(request) {
  const q = encodeURIComponent(
    `SELECT Id, Name FROM User WHERE Username = 'at.enterprise.solution@b2b.uat' LIMIT 1`
  );
  const queryResponse = await request.get(
    `${instanceUrl}/services/data/v65.0/query?q=${q}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    }
  );
  expect(queryResponse.ok(), "Query for ES user should succeed").toBeTruthy();
  const user = (await queryResponse.json()).records?.[0];
  expect(user, "User at.enterprise.solution@b2b.uat not found").toBeTruthy();
  console.log(`ES user found: ${user.Name} (${user.Id})`);

  const createResponse = await request.post(
    `${instanceUrl}/services/data/v65.0/sobjects/OpportunityTeamMember`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      data: {
        OpportunityId: opportunityId,
        UserId: user.Id,
        TeamMemberRole: "Sales Solution",
        OpportunityAccessLevel: "All"
      }
    }
  );
  const createBody = await createResponse.json();
  expect(
    createBody.success,
    "OpportunityTeamMember creation should succeed"
  ).toBeTruthy();
  console.log(
    `OpportunityTeamMember created: ${createBody.id} — ${user.Name} (Sales Solution)`
  );
}

test("API Connection Test", async ({ request }) => {
  expect(instanceUrl, "instanceUrl should be set by beforeAll").toBeTruthy();
  expect(accessToken, "accessToken should be set by beforeAll").toBeTruthy();

  if (!opportunityId) {
    const userInfoResponse = await request.get(
      `${instanceUrl}/services/oauth2/userinfo`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    console.log(
      "User info response is: ",
      (await userInfoResponse.body()).toString()
    );
    expect(
      userInfoResponse.ok(),
      "User info request should succeed"
    ).toBeTruthy();

    const userInfo = await userInfoResponse.json();
    let userId = userInfo.user_id;

    const opportunityResponse = await request.get(
      `${instanceUrl}/services/data/v65.0/query?q=SELECT+Id,Name+FROM+Opportunity+WHERE+OwnerId='${userId}'+AND+StageName='Scoping'+ORDER+BY+CreatedDate+DESC+LIMIT+1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    expect(
      opportunityResponse.ok(),
      "Query for latest Scoping opportunity should succeed"
    ).toBeTruthy();
    const opportunityRecords = (await opportunityResponse.json()).records;
    console.log(
      "Opportunities owned by user in Scoping stage:",
      opportunityRecords
    );
    opportunityId =
      opportunityRecords.length > 0 ? opportunityRecords[0].Id : null;
  }
  await patchContractedMonths(request, instanceUrl, accessToken);
  await deleteOpportunityLineItems(request, instanceUrl, accessToken);
});

test("TC010_Managing my opportunity", async () => {
  await allure.epic("Opportunity Management");
  await allure.feature("Manage My Opportunity");

  await allure.story("Add Products to Opportunity and Update Sales Scenario");
  await allure.severity("critical");

  await page.goto(
    `${sysadmin.afterLoginUrl}lightning/r/Opportunity/${opportunityId}/view`
  );

  await page.getByRole("button", { name: "Show actions for Products" }).click();
  await page.getByRole("menuitem", { name: "Add Products" }).click();
  await page.getByRole("combobox", { name: "Search Products Search" }).click();
  await page
    .getByRole("combobox", { name: "Search Products Search" })
    .fill(tc010.productName);
  await page
    .getByRole("combobox", { name: "Search Products Search" })
    .press("Enter");
  await page.waitForTimeout(3000);
  await page.locator("td:nth-child(2) > span").first().click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Edit MRC: Item" }).click();
  await page.getByRole("textbox", { name: "MRC *" }).fill(tc010.mrc);
  await page.getByRole("button", { name: "Edit OTC: Item null" }).click();
  await page.getByRole("textbox", { name: "OTC" }).fill(tc010.otc);
  await page
    .getByRole("button", { name: "Edit Line Description: Item" })
    .click();
  await page.getByRole("button", { name: "Save" }).click();

  await expect(
    page
      .locator("lightning-formatted-text")
      .filter({ hasText: `${tc010.expectedOtc}` }),
    `OTC value should display '${tc010.expectedOtc}'`
  ).toBeVisible();
  await expect(
    page
      .locator("lightning-formatted-text")
      .filter({ hasText: `${tc010.expectedMrc}` }),
    `MRC value should display '${tc010.expectedMrc}'`
  ).toBeVisible();
  await expect(
    page
      .locator("lightning-formatted-text")
      .filter({ hasText: `${tc010.expectedTotal}` }),
    `Total value should display '${tc010.expectedTotal}'`
  ).toBeVisible();
  await expect(
    page
      .locator("lightning-formatted-text")
      .filter({ hasText: `${tc010.expectedAnnualRevenue}` }),
    `Annual Revenue value should display '${tc010.expectedAnnualRevenue}'`
  ).toBeVisible();
});

test("TC012_Update Sales Scenario and Credit Scoring", async () => {
  await allure.epic("Opportunity Management");
  await allure.feature("Manage My Opportunity");

  await allure.story("Update Sales Scenario, Credit Scoring and Score Card");
  await allure.severity("critical");

  await page.getByRole("button", { name: "Edit Sales Scenario" }).click();
  await page.getByRole("combobox", { name: "Sales Scenario" }).click();
  await page.waitForTimeout(3000);

  await page.getByRole("option", { name: "Non-BAU/Tender" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(3000);

  await expect(
    page.getByRole("button", { name: "Tender Information" }),
    "Tender Information button should appear after setting Sales Scenario to Non-BAU/Tender"
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit Statement Letter" }).click();
  await page.getByRole("checkbox", { name: "Statement Letter" }).check();
  await page.getByRole("checkbox", { name: "Financial Document" }).check();
  await page.getByRole("checkbox", { name: "Deed of Company" }).check();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(3000);
});

test("TC013_Add Opportunity Team Member", async ({ request }) => {
  await allure.epic("Opportunity Management");
  await allure.feature("Manage My Opportunity");

  await allure.story("Add Opportunity Team Member");
  await allure.severity("critical");

  await addOpportunityTeamMember(request);

  // await page.getByRole('button', { name: 'Show actions for Opportunity Team' }).click();
  // await page.getByRole('menuitem', { name: 'Add Opportunity Team Members' }).click();
  // await page.getByRole('button', { name: 'Edit Team Role: Item' }).first().click();
  // await page.getByRole('button', { name: 'Team Role --None--' }).click();
  // await page.getByRole('option', { name: 'ICT Expert' }).click();
  // await page.getByRole('button', { name: 'Edit User: Item' }).first().click();
  // await page.getByRole('option', { name: 'AT Enterprise Solution' }).click();
  // await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(3000);
  // await expect(
  //     page.getByRole('listitem').filter({ hasText: 'Tester ES' }),
  //     "Tester ES should appear in the Opportunity Team list after being added"
  // ).toBeVisible();
});

test("TC015_Update Credit Scoring", async () => {
  await allure.epic("Opportunity Management");
  await allure.feature("Manage My Opportunity");

  await allure.story("Update Credit Scoring");
  await allure.severity("normal");

  await page.getByRole("tab", { name: "Credit Scoring" }).click();
  await page.getByRole("button", { name: "Edit Financial Condition" }).click();

  await page.getByRole("combobox", { name: "Financial Condition" }).click();
  await page.getByRole("option", { name: "Audited & Healthy" }).click();

  await page.getByRole("combobox", { name: "Office Condition" }).click();
  await page
    .getByRole("option", { name: "Rental building more than 2" })
    .click();

  await page.getByRole("combobox", { name: "Business Form" }).click();
  await page.getByRole("option", { name: "Private (PT)" }).click();

  await page.getByRole("combobox", { name: "Company Reputation" }).click();
  await page.getByRole("option", { name: "Good reputation" }).click();

  await page.getByRole("combobox", { name: "Age of the Company" }).click();
  await page.getByRole("option", { name: "- 5 years" }).click();

  await page.getByRole("combobox", { name: "Number Employee" }).click();
  await page.getByRole("option", { name: "-200 personnel" }).click();

  await page.getByRole("combobox", { name: "Existence of IO Office" }).click();
  await page.getByRole("option", { name: "In the same city" }).click();

  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(3000);
  await expect(
    page.locator("lightning-formatted-text").filter({ hasText: "Low Risk" }),
    "Credit scoring result should display 'Low Risk' based on the entered values"
  ).toBeVisible();
  await page
    .locator("lightning-formatted-number")
    .filter({ hasText: "1.50" })
    .click();
});

test("TC017_TC018_Update Score Card", async () => {
  await allure.epic("Opportunity Management");
  await allure.feature("Manage My Opportunity");

  await allure.story("Update Score Card");
  await allure.severity("normal");

  await page.getByRole("tab", { name: "Score Card" }).click();

  // assert sales team can edit
  await expect(
    page.getByRole("button", { name: "Edit Has Incumbent" }),
    "Sales team should be able to edit Has Incumbent"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit RFP Influence" }),
    "Sales team should be able to edit RFP Influence"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Implementation Risk" }),
    "Sales team should be able to edit Implementation Risk"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Partnership Tier with" }),
    "Sales team should be able to edit Partnership Tier with"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Customer Favor" }),
    "Sales team should be able to edit Customer Favor"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Customer Budget" }),
    "Sales team should be able to edit Customer Budget"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Project Timeline" }),
    "Sales team should be able to edit Project Timeline"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Customer Relationship" }),
    "Sales team should be able to edit Customer Relationship"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Core Product" }),
    "Sales team should be able to edit Core Product"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Deal Registered" }),
    "Sales team should be able to edit Deal Registered"
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Internal Capabilities" }),
    "Sales team should be able to edit Internal Capabilities"
  ).toBeVisible();

  // assert ES team cannot edit
  if (process.env.TEST_USER_ADMIN == "false") {
    await expect(
      page.getByRole("button", { name: "Edit (ES) Has Incumbent" }),
      "ES team edit button for Has Incumbent should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) RFP Influence" }),
      "ES team edit button for RFP Influence should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) Implementation Risk" }),
      "ES team edit button for Implementation Risk should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) Partnership Tier" }),
      "ES team edit button for Partnership Tier should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) Customer Favor" }),
      "ES team edit button for Customer Favor should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) Customer Budget" }),
      "ES team edit button for Customer Budget should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) Project Timeline" }),
      "ES team edit button for Project Timeline should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) Customer Relationship" }),
      "ES team edit button for Customer Relationship should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) Core Product" }),
      "ES team edit button for Core Product should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) Deal Registered" }),
      "ES team edit button for Deal Registered should not be visible to Sales user"
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit (ES) Internal" }),
      "ES team edit button for Internal Capabilities should not be visible to Sales user"
    ).not.toBeVisible();
  }

  await page.getByRole("button", { name: "Edit Has Incumbent" }).click();
  await page
    .getByRole("combobox", { name: "Has Incumbent", exact: true })
    .click();
  await page.getByRole("option", { name: "No", exact: true }).click();

  await page
    .getByRole("combobox", { name: "RFP Influence", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Yes, BoQ and RFP/KAK Drafted" })
    .click();

  await page
    .getByRole("combobox", { name: "Implementation Risk", exact: true })
    .click();
  await page.getByRole("option", { name: "High" }).click();

  // await page.getByRole('combobox', { name: 'Partnership Tier with Principal', exact: true }).click();
  // await page.getByRole('option', { name: 'Highest Partnership' }).click();

  await page
    .getByRole("combobox", { name: "Customer Favor", exact: true })
    .click();
  await page.getByRole("option", { name: "Customer preferred IOH" }).click();

  await page
    .getByRole("combobox", { name: "Customer Budget", exact: true })
    .click();
  await page.getByRole("option", { name: "Budget available" }).click();

  await page
    .getByRole("combobox", { name: "Project Timeline", exact: true })
    .click();
  await page.getByRole("option", { name: "<1 Month" }).click();

  await page
    .getByLabel("Customer Relationship", { exact: true })
    .getByRole("option", { name: "IT Head" })
    .click();
  await page
    .getByLabel("Customer Relationship", { exact: true })
    .getByRole("option", { name: "IT Head" })
    .click();
  await page
    .getByLabel("Customer Relationship", { exact: true })
    .getByRole("button", { name: "Move selection to Chosen" })
    .click();

  await page
    .getByRole("combobox", { name: "Core Product", exact: true })
    .click();
  await page.getByRole("option", { name: "Yes, Fully IOH Product" }).click();

  await page
    .getByRole("combobox", { name: "Internal Capabilities", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Has full internal capability" })
    .click();

  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(3000);
  // await expect(page.locator('div').filter({ hasText: /^Red Warning Triangle$/ })).toBeVisible();
  await expect(
    page.locator("span").filter({ hasText: "Red Warning Triangle" }).first(),
    "Score Card should show 'Red Warning Triangle' indicator after saving"
  ).toBeVisible();
});
