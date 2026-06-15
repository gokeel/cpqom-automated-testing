import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
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

const runId = process.env.TEST_RUN_ID ? Number(process.env.TEST_RUN_ID) : null;
const userId = process.env.USER_ID ? Number(process.env.USER_ID) : null;
let runError = null;

let sysadmin;

let counter;
let tc001;
let tc002;
let tcContact;
let instanceUrl;
let accessToken;
let brandAccountId;
let customerAccountId;
let billingContactId;

test.beforeAll(async () => {
  sysadmin = await getSfEnvironment("sysadmin");

  await incrementModuleCounter("account_mgmt");
  await incrementModuleCounter("contact_mgmt");

  const module = await getModule("account_mgmt");
  counter = module.counter;

  tc001 = await getTestParams("account_mgmt", "tc001", userId);
  tc002 = await getTestParams("account_mgmt", "tc002", userId);
  tcContact = await getTestParams("contact_mgmt", "tc_contact", userId);
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
          corporateCustomerId: brandAccountId,
          customerAccountId,
          billingContactId
        },
        finished_at: new Date()
      });
    }
  }
  await closeDb();
});

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
    const err = new Error(
      `HTTP ${response.status()} ${method.toUpperCase()} ${url}`
    );
    err.body = body;
    throw err;
  }

  if (body && typeof body === "object") {
    const errField = body.error ?? body.errorCode;
    if (errField && !body.id && !body.records) {
      const err = new Error(
        `Salesforce error: ${errField} — ${body.message ?? ""}`
      );
      err.body = body;
      throw err;
    }
  }

  return body;
}

const hdrs = () => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
  Accept: "application/json"
});

async function getRecordTypeId(request, sobjectType, developerName) {
  const q = encodeURIComponent(
    `SELECT Id FROM RecordType WHERE SobjectType = '${sobjectType}' AND DeveloperName = '${developerName}' LIMIT 1`
  );
  const body = await sfRequest(
    request,
    "get",
    `${instanceUrl}/services/data/v65.0/query?q=${q}`,
    { headers: hdrs() }
  );
  const id = body.records?.[0]?.Id;
  if (!id)
    throw new Error(
      `RecordType '${developerName}' not found for ${sobjectType}`
    );
  return id;
}

test("API Connection Test", async ({ request }) => {
  const loginResponse = await request.post(
    `${sysadmin.url}/services/oauth2/token`,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      form: {
        grant_type: "client_credentials",
        client_id: sysadmin.clientId,
        client_secret: sysadmin.clientSecret
      }
    }
  );

  expect(loginResponse.ok(), "OAuth login should succeed").toBeTruthy();

  const loginBody = await loginResponse.json();
  accessToken = loginBody.access_token;
  instanceUrl = loginBody.instance_url;

  console.log("Instance URL:", instanceUrl);
});

test("TC004_Create CCA", async ({ request }) => {
  await allure.epic("Account Management");
  await allure.feature("Manage CCA and CA Records");
  await allure.story("Create Customer Corporate Account");
  await allure.severity("critical");

  let recordTypeId;

  await test.step("TC004_S01 - Look up Brand RecordType Id", async () => {
    recordTypeId = await getRecordTypeId(request, "Account", "Brand");
    console.log("Brand RecordType Id:", recordTypeId);
  });

  await test.step("TC004_S02 - Create Brand Account via API", async () => {
    const body = await sfRequest(
      request,
      "post",
      `${instanceUrl}/services/data/v65.0/sobjects/Account`,
      {
        headers: hdrs(),
        data: {
          RecordTypeId: recordTypeId,
          SFA_Salutation__c: "PT.",
          Name: tc001.accountName + " " + counter,
          AccountSource: "Other",
          Description: "Created by Automation Testing",
          Type: "Corporate",
          SFA_Account_Status__c: "New",
          SFA_Main_Contact_Area_Code__c: "021",
          Phone: tc001.phone.toString(),
          SFA_Email__c: "account.cca." + counter + "@company.co.id",
          ShippingStreet: "Jalan Merdeka Barat",
          ShippingCity: "Jakarta Pusat",
          ShippingState: "DKI Jakarta",
          ShippingPostalCode: "10110",
          ShippingCountry: "Indonesia",
          vlocity_cmt__ContactPreferences__c: "eMail"
        }
      }
    );

    expect(body.success, "Brand Account creation should succeed").toBeTruthy();
    brandAccountId = body.id;
    console.log("Brand Account created:", brandAccountId);

    await setRuntimeState("corporateAccountId", brandAccountId);
  });
});

test("Create Billing Contact", async ({ request }) => {
  await allure.epic("Account Management");
  await allure.feature("Contact Management");
  await allure.story("Create Billing Contact");
  await allure.severity("normal");

  let recordTypeId;

  await test.step("Look up Billing Contact RecordType Id", async () => {
    recordTypeId = await getRecordTypeId(
      request,
      "Contact",
      "SFA_Billing_Contact"
    );
    console.log("Billing Contact RecordType Id:", recordTypeId);
  });

  await test.step("Create Billing Contact via API", async () => {
    const body = await sfRequest(
      request,
      "post",
      `${instanceUrl}/services/data/v65.0/sobjects/Contact`,
      {
        headers: hdrs(),
        data: {
          RecordTypeId: recordTypeId,
          SFA_Contact_Type__c: "PIC Corporate",
          Salutation: "Mr.",
          FirstName: tcContact.firstName,
          LastName: `${tcContact.lastName} ${counter}`,
          AccountId: brandAccountId,
          Email: "johan.armando@example.com",
          SFA_Place_Of_Birth__c: "Garut",
          SFA_Gender__c: "Male",
          MobilePhone: "085647890123",
          Phone: "03124567654",
          SFA_Marital_Status__c: "Single",
          SFA_Citizenship__c: "Indonesian",
          SFA_Religion__c: "Moslem"
        }
      }
    );

    expect(
      body.success,
      "Billing Contact creation should succeed"
    ).toBeTruthy();
    billingContactId = body.id;
    console.log("Billing Contact created:", billingContactId);

    await setRuntimeState("billingContactId", billingContactId);
  });
});

test("TC005_Create CA under CCA", async ({ request }) => {
  await allure.epic("Account Management");
  await allure.feature("Manage CCA and CA Records");
  await allure.story("Create Customer Account");
  await allure.severity("critical");
  await allure.label("pre-requisite", "1.1 User has Marketing User profile");

  let recordTypeId;

  await test.step("TC005_S01 - Look up Business RecordType Id", async () => {
    recordTypeId = await getRecordTypeId(request, "Account", "Business");
    console.log("Business RecordType Id:", recordTypeId);
  });

  await test.step("TC005_S02 - Create Business Account via API", async () => {
    const tomorrow = new Date();
    tomorrow.setFullYear(2030);
    const idExpiryDate = tomorrow.toISOString().split("T")[0];

    const body = await sfRequest(
      request,
      "post",
      `${instanceUrl}/services/data/v65.0/sobjects/Account`,
      {
        headers: hdrs(),
        data: {
          RecordTypeId: recordTypeId,
          ParentId: brandAccountId,
          SFA_Salutation__c: "PT.",
          Name: tc002.accountName + " " + counter,
          AccountSource: "Other",
          Description: "Created by Automation Testing",
          Type: "Corporate",
          SFA_Account_Status__c: "New",
          SFA_Main_Contact_Area_Code__c: "021",
          Phone: tc002.phone.toString(),
          SFA_Email__c: "account.ca." + counter + "@company.co.id",
          ShippingStreet: "Jalan Merdeka Barat",
          ShippingCity: "Jakarta Pusat",
          ShippingState: "DKI Jakarta",
          ShippingPostalCode: "10110",
          ShippingCountry: "Indonesia",
          vlocity_cmt__ContactPreferences__c: "eMail",
          SFA_Agency_Code__c: "SIUP",
          SFA_Date_Formed__c: idExpiryDate,
          SFA_License_Number__c:
            tc002.idReference + counter.toString().padStart(4, "0"),
          SFA_NPWP__c: tc002.idReference + counter.toString().padStart(4, "0"),
          Industry: "Communications & Technologies",
          SFA_Sub_Line_of_Business__c: "Content Provider",
          SFA_Customer_Segment__c: "Large Enterprise",
          SFA_Corporate_Scale__c: "Multinational Company",
          SFA_Primary_Contact__c: billingContactId
        }
      }
    );

    expect(
      body.success,
      "Business Account creation should succeed"
    ).toBeTruthy();
    customerAccountId = body.id;
    console.log("Business Account created:", customerAccountId);

    const newAccountName = (tc002.accountName + " " + counter).toUpperCase();
    await updateTestParams("lead_mgmt", "tc002", userId, {
      accountName: newAccountName,
      accountOption: newAccountName
    });
    console.log(
      `[TC005] Updated tc002.accountName and tc002.accountOption to: ${newAccountName}`
    );

    await setRuntimeState("customerAccountId", body.id);
  });
});
