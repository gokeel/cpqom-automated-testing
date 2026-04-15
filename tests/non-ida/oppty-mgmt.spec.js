import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import data from "../../test-data/non-ida-oppty.json" assert { type: "json" };
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const counter = data.counter;
let instanceUrl;
let accessToken;
let opportunityId = data.opportunityId;

const userDataDirectory = path.resolve(__dirname, '../../.sf-profile');
let context;
let page;

// runs only once before all tests in the file
test.beforeAll(async () => {
    context = await chromium.launchPersistentContext(userDataDirectory, {
        headless: false,
        args: ['--start-maximized'],
    });
    page = await context.newPage();

    await page.goto(data.login.url);
    await page.getByRole('textbox', { name: 'Username' }).fill(data.login.username);
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill(data.login.password);
    await page.getByRole('button', { name: 'Log In to Sandbox' }).click();

    await page.waitForURL('**/lightning/**', { timeout: 60000 });
    await context.storageState({ path: '.sf-profile/sf-state.json' });
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
            'Content-Type': 'application/json',
        },
        data: { vlocity_cmt__NumberOfContractedMonths__c: 24 },
    });

    // Salesforce returns 204 No Content on a successful PATCH
    expect(patchResponse.status()).toBe(204);
    console.log(`vlocity_cmt__NumberOfContractedMonths__c set to 24 on Opportunity ${opportunityId}`);
}

async function deleteOpportunityLineItems(request, instanceUrl, accessToken) {
    const queryUrl = `${instanceUrl}/services/data/v65.0/query?q=SELECT+Id+FROM+OpportunityLineItem+WHERE+OpportunityId='${opportunityId}'`;
    const queryResponse = await request.get(queryUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    expect(queryResponse.ok()).toBeTruthy();
    const lineItems = (await queryResponse.json()).records;
    for (const item of lineItems) {
        const deleteUrl = `${instanceUrl}/services/data/v65.0/sobjects/OpportunityLineItem/${item.Id}`;
        const deleteResponse = await request.delete(deleteUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        expect(deleteResponse.status()).toBe(204);
        console.log(`Deleted OpportunityLineItem with Id ${item.Id}`);
    }
}

test('API Connection Test', async ({ request }) => {
    const loginUrl = data.login.url+'/services/oauth2/token';

    const grantType = 'client_credentials';
    const clientId = data.login.clientId;
    const clientSecret = data.login.clientSecret;

  // Step 1: Authenticate and get access token
    const loginResponse = await request.post(loginUrl, {
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded'
      },
      form: {
        grant_type: grantType,
        client_id: clientId,
        client_secret: clientSecret
      }
    });

    console.log('Login response is: ', (await (loginResponse).body()).toString());
    expect((loginResponse).ok()).toBeTruthy();


    const loginBody = await loginResponse.json();
    accessToken = loginBody.access_token;
    instanceUrl = loginBody.instance_url;

    console.log('Access token is: ', accessToken);

    console.log('Instance URL is: ', instanceUrl);

    if (!data.opportunityId) {
        const userInfoResponse = await request.get(`${instanceUrl}/services/oauth2/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        console.log('User info response is: ', (await userInfoResponse.body()).toString());
        expect(userInfoResponse.ok()).toBeTruthy();

        const userInfo = await userInfoResponse.json();
        let userId = userInfo.user_id;

        const opportunityResponse = await request.get(`${instanceUrl}/services/data/v65.0/query?q=SELECT+Id,Name+FROM+Opportunity+WHERE+OwnerId='${userId}'+AND+StageName='Scoping'+ORDER+BY+CreatedDate+DESC+LIMIT+1`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        expect(opportunityResponse.ok()).toBeTruthy();
        const opportunityRecords = (await opportunityResponse.json()).records;
        console.log('Opportunities owned by user in Scoping stage:', opportunityRecords);
        opportunityId = opportunityRecords.length > 0 ? opportunityRecords[0].Id : null;
    }
    await patchContractedMonths(request, instanceUrl, accessToken);
    await deleteOpportunityLineItems(request, instanceUrl, accessToken);
});

test('TC010_Managing my opportunity', async () => {
    await allure.epic('Opportunity Management');
    await allure.feature('Manage My Opportunity');

    await allure.story('Add Products to Opportunity and Update Sales Scenario');
    await allure.severity('critical');

    await page.goto(`${data.login.afterLoginUrl}lightning/r/Opportunity/${opportunityId}/view`);
    
    await page.getByRole('button', { name: 'Show actions for Products' }).click();
    await page.getByRole('menuitem', { name: 'Add Products' }).click();
    await page.getByRole('combobox', { name: 'Search Products Search' }).click();
    await page.getByRole('combobox', { name: 'Search Products Search' }).fill(data.tc010.productName);
    await page.getByRole('combobox', { name: 'Search Products Search' }).press('Enter');
    await page.waitForTimeout(3000);
    await page.locator('td:nth-child(2) > span').first().click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Edit MRC: Item' }).click();
    await page.getByRole('textbox', { name: 'MRC *' }).fill(data.tc010.mrc);
    await page.getByRole('button', { name: 'Edit OTC: Item null' }).click();
    await page.getByRole('textbox', { name: 'OTC' }).fill(data.tc010.otc);
    await page.getByRole('button', { name: 'Edit Line Description: Item' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.locator('lightning-formatted-text').filter({ hasText: `${data.tc010.expectedOtc}` })).toBeVisible();
    await expect(page.locator('lightning-formatted-text').filter({ hasText: `${data.tc010.expectedMrc}` })).toBeVisible();
    await expect(page.locator('lightning-formatted-text').filter({ hasText: `${data.tc010.expectedTotal}` })).toBeVisible();
    await expect(page.locator('lightning-formatted-text').filter({ hasText: `${data.tc010.expectedAnnualRevenue}` })).toBeVisible();
});

test('TC012_Update Sales Scenario and Credit Scoring', async () => {
    await allure.epic('Opportunity Management');
    await allure.feature('Manage My Opportunity');

    await allure.story('Update Sales Scenario, Credit Scoring and Score Card');
    await allure.severity('critical');
    
    await page.getByRole('button', { name: 'Edit Sales Scenario' }).click();
    await page.getByRole('combobox', { name: 'Sales Scenario' }).click();
    await page.waitForTimeout(3000);
    
    await page.getByRole('option', { name: 'Non-BAU/Tender' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    
    await expect(page.getByRole('button', { name: 'Tender Information' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit Statement Letter' }).click();
    await page.getByRole('checkbox', { name: 'Statement Letter' }).check();
    await page.getByRole('checkbox', { name: 'Financial Document' }).check();
    await page.getByRole('checkbox', { name: 'Deed of Company' }).check();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
});

test('TC013_Add Opportunity Team Member', async () => {
    await allure.epic('Opportunity Management');
    await allure.feature('Manage My Opportunity');

    await allure.story('Add Opportunity Team Member');
    await allure.severity('critical');
    
    await page.getByRole('button', { name: 'Show actions for Opportunity Team' }).click();
    await page.getByRole('menuitem', { name: 'Add Opportunity Team Members' }).click();
    await page.getByRole('button', { name: 'Edit Team Role: Item' }).first().click();
    await page.getByRole('button', { name: 'Team Role', exact: true }).click();
    await page.getByRole('option', { name: 'ICT Expert' }).click();
    await page.getByRole('button', { name: 'Edit User: Item' }).first().click();
    await page.getByRole('option', { name: 'OCKY HARLIANSYAH' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await expect(page.getByRole('listitem').filter({ hasText: 'OCKY HARLIANSYAH User' })).toBeVisible();
});

test('TC015_Update Credit Scoring', async () => {
    await allure.epic('Opportunity Management');
    await allure.feature('Manage My Opportunity');

    await allure.story('Update Credit Scoring');
    await allure.severity('normal');

    await page.getByRole('tab', { name: 'Credit Scoring' }).click();
    await page.getByRole('button', { name: 'Edit Financial Condition' }).click();
    
    await page.getByRole('combobox', { name: 'Financial Condition' }).click();
    await page.getByRole('option', { name: 'Audited & Healthy' }).click();
    
    await page.getByRole('combobox', { name: 'Office Condition' }).click();
    await page.getByRole('option', { name: 'Rental building more than 2' }).click();
    
    await page.getByRole('combobox', { name: 'Business Form' }).click();
    await page.getByRole('option', { name: 'Private (PT)' }).click();
    
    await page.getByRole('combobox', { name: 'Company Reputation' }).click();
    await page.getByRole('option', { name: 'Good reputation' }).click();
    
    await page.getByRole('combobox', { name: 'Age of the Company' }).click();
    await page.getByRole('option', { name: '- 5 years' }).click();
    
    await page.getByRole('combobox', { name: 'Number Employee' }).click();
    await page.getByRole('option', { name: '-200 personnel' }).click();
    
    await page.getByRole('combobox', { name: 'Existence of IO Office' }).click();
    await page.getByRole('option', { name: 'In the same city' }).click();
    
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await expect(page.locator('lightning-formatted-text').filter({ hasText: 'Low Risk' })).toBeVisible();
    await page.locator('lightning-formatted-number').filter({ hasText: '1.50' }).click();
});

test('TC017_TC018_Update Score Card', async () => {
    await allure.epic('Opportunity Management');
    await allure.feature('Manage My Opportunity');

    await allure.story('Update Score Card');
    await allure.severity('normal');

    await page.getByRole('tab', { name: 'Score Card' }).click();
    await page.getByRole('button', { name: 'Edit Has Incumbent' }).click();
    await page.getByRole('combobox', { name: 'Has Incumbent', exact: true }).click();
    await page.getByRole('option', { name: 'No', exact: true }).click();

    await page.getByRole('combobox', { name: 'RFP Influence', exact: true }).click();
    await page.getByRole('option', { name: 'Yes, BoQ and RFP/KAK Drafted' }).click();
    
    await page.getByRole('combobox', { name: 'Implementation Risk', exact: true }).click();
    await page.getByRole('option', { name: 'High' }).click();
    
    // await page.getByRole('combobox', { name: 'Partnership Tier with Principal', exact: true }).click();
    // await page.getByRole('option', { name: 'Highest Partnership' }).click();

    await page.getByRole('combobox', { name: 'Customer Favor', exact: true }).click();
    await page.getByRole('option', { name: 'Customer preferred IOH' }).click();
    
    await page.getByRole('combobox', { name: 'Customer Budget', exact: true }).click();
    await page.getByRole('option', { name: 'Budget available' }).click();
    
    await page.getByRole('combobox', { name: 'Project Timeline', exact: true }).click();
    await page.getByRole('option', { name: '<3 Months' }).click();
    
    await page.getByLabel('Customer Relationship', { exact: true }).getByRole('option', { name: 'IT Head' }).click();
    await page.getByLabel('Customer Relationship', { exact: true }).getByRole('option', { name: 'IT Head' }).click();
    await page.getByLabel('Customer Relationship', { exact: true }).getByRole('button', { name: 'Move selection to Chosen' }).click();
    
    await page.getByRole('combobox', { name: 'Core Product', exact: true }).click();
    await page.getByRole('option', { name: 'Yes, Fully IOH Product' }).click();

    await page.getByRole('combobox', { name: 'Internal Capabilities', exact: true }).click();
    await page.getByRole('option', { name: 'Has full internal capability' }).click();
    
    await page.getByRole('combobox', { name: '(ES) Customer Budget' }).click();
    await page.getByRole('option', { name: 'Budget available' }).click();
    
    await page.getByRole('combobox', { name: '(ES) Project Timeline' }).click();
    await page.getByRole('option', { name: '<3 Months' }).click();
    
    await page.getByRole('combobox', { name: '(ES) Has Incumbent' }).click();
    await page.getByRole('option', { name: 'Yes' }).click();

    await page.getByLabel('(ES) Customer Relationship').getByText('IT Head', { exact: true }).click();
    await page.getByLabel('(ES) Customer Relationship').getByRole('option', { name: 'IT Head' }).click();
    await page.getByLabel('(ES) Customer Relationship').getByRole('button', { name: 'Move selection to Chosen' }).click();
    
    await page.getByRole('combobox', { name: '(ES) Implementation Risk' }).click();
    await page.getByRole('option', { name: 'High' }).click();
    
    // await page.getByRole('combobox', { name: '(ES) Partnership Tier with' }).click();
    // await page.getByRole('option', { name: 'Highest Partnership' }).click();
    
    await page.getByRole('combobox', { name: '(ES) Customer Favor' }).click();
    await page.getByRole('option', { name: 'Customer preferred IOH' }).click();
    
    await page.getByRole('combobox', { name: '(ES) Core Product' }).click();
    await page.getByRole('option', { name: 'Yes, Fully IOH Product' }).click();
    
    await page.getByRole('combobox', { name: '(ES) Deal Registered' }).click();
    await page.getByRole('option', { name: 'Yes' }).click();
    
    await page.getByRole('combobox', { name: '(ES) Internal Capabilities' }).click();
    await page.getByRole('option', { name: 'Has full internal capability' }).click();
    
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    // await expect(page.locator('div').filter({ hasText: /^Red Warning Triangle$/ })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: 'Red Warning Triangle' }).first()).toBeVisible();
    
});
