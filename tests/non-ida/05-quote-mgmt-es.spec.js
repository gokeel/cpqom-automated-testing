import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import dataAuth from "../../test-data/auth.json" assert { type: "json" };
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

    await page.goto(dataAuth.enterpriseSolution.url);
    await page.getByRole('textbox', { name: 'Username' }).fill(dataAuth.enterpriseSolution.username);
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill(dataAuth.enterpriseSolution.password);
    await page.getByRole('button', { name: 'Log In to Sandbox' }).click();

    await page.waitForURL('**/lightning/**', { timeout: 60000 });
    await context.storageState({ path: '.sf-profile/sf-state.json' });
});

test.afterAll(async () => {
    if (context) await context.close();
});

/**
 * Updates the StageName field of an Opportunity via Salesforce REST API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} instanceUrl  - e.g. https://your-org.my.salesforce.com
 * @param {string} accessToken  - Bearer token from OAuth
 * @returns {Promise<void>} Resolves when the PATCH is successful
 */
async function patchMissingScoreCard(request, instanceUrl, accessToken) {
    const patchUrl = `${instanceUrl}/services/data/v65.0/sobjects/Opportunity/${opportunityId}`;
    const patchResponse = await request.patch(patchUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        data: { 
            CPQ_Partnership_Tier__c: 'Highest Partnership',
            CPQ_ES_Partnership_Tier__c: 'Highest Partnership',
            CPQ_Deal_Registered__c: 'Yes',
            CPQ_ES_Deal_Registered__c: 'Yes'
         },
    });

    // Salesforce returns 204 No Content on a successful PATCH
    expect(patchResponse.status()).toBe(204);
}

test('API Connection Test', async ({ request }) => {
    const loginUrl = dataAuth.sysadmin.url+'/services/oauth2/token';

    const grantType = 'client_credentials';
    const clientId = dataAuth.sysadmin.clientIdDev;
    const clientSecret = dataAuth.sysadmin.clientSecretDev;

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

    await patchMissingScoreCard(request, instanceUrl, accessToken);
});

test('TC021_TC022_Update Score Card', async () => {
    await allure.epic('Opportunity Management');
    await allure.feature('Manage My Opportunity');

    await allure.story('Update Score Card');
    await allure.severity('normal');

    await page.getByRole('tab', { name: 'Score Card' }).click();

    // assert sales team cannot edit
    await expect(page.getByRole('button', { name: 'Edit Has Incumbent' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit RFP Influence' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Implementation Risk' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Partnership Tier with' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Customer Favor' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Customer Budget' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Project Timeline' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Customer Relationship' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Core Product' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Deal Registered' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Internal Capabilities' })).not.toBeVisible();

    // assert ES team can edit
    await expect(page.getByRole('button', { name: 'Edit (ES) Has Incumbent' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) RFP Influence' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) Implementation Risk' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) Partnership Tier' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) Customer Favor' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) Customer Budget' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) Project Timeline' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) Customer Relationship' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) Core Product' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) Deal Registered' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit (ES) Internal' })).toBeVisible();

    await page.getByRole('button', { name: '(ES) Customer Budget' }).click();
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
