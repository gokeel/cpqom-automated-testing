import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import dataAuth from "../../test-data/auth.json" assert { type: "json" };
import path from "path";
import { fileURLToPath } from "url";
import { getRuntimeState, closeDb } from "../../utils/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let instanceUrl;
let accessToken;
let opportunityId;

const userDataDirectory = path.resolve(__dirname, '../../.sf-profile');
let context;
let page;

// Resolve login user: sysadmin when TEST_USER_ADMIN=true, otherwise enterpriseSolution
const loginUser = process.env.TEST_USER_ADMIN === 'true' ? dataAuth.sysadmin : dataAuth.enterpriseSolution;

// runs only once before all tests in the file
test.beforeAll(async () => {
    opportunityId = await getRuntimeState('opportunityId');

    context = await chromium.launchPersistentContext(userDataDirectory, {
        headless: false,
        args: ['--start-maximized'],
    });
    page = await context.newPage();

    await page.goto(loginUser.url);
    await page.getByRole('textbox', { name: 'Username' }).fill(loginUser.username);
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill(loginUser.password);
    await page.getByRole('button', { name: 'Log In to Sandbox' }).click();

    await page.waitForURL('**/lightning/**', { timeout: 60000 });
    await context.storageState({ path: '.sf-profile/sf-state.json' });
});

test.afterAll(async () => {
    await closeDb();
    if (context) await context.close();
});

/**
 * Updates the StageName field of an Opportunity via Salesforce REST API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} instanceUrl  - e.g. https://your-org.my.salesforce.com
 * @param {string} accessToken  - Bearer token from OAuth
 * @returns {Promise<void>} Resolves when the PATCH is successful
 */
async function patchStageQuoting(request, instanceUrl, accessToken) {
    const patchUrl = `${instanceUrl}/services/data/v65.0/sobjects/Opportunity/${opportunityId}`;
    const patchResponse = await request.patch(patchUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        data: { 
            StageName: 'Quoting',
            CPQ_Partnership_Tier__c: 'Highest Partnership',
            CPQ_ES_Partnership_Tier__c: 'Highest Partnership',
            CPQ_Deal_Registered__c: 'Yes',
            CPQ_ES_Deal_Registered__c: 'Yes'
         },
    });

    const responseBody = await patchResponse.text();
    console.log(`patchStageQuoting — status: ${patchResponse.status()}, body: ${responseBody || '(empty)'}`);

    // Salesforce returns 204 No Content on a successful PATCH
    expect(patchResponse.status(), "Patch StageName to 'Quoting' should return 204 No Content").toBe(204);
    console.log(`StageName set to Quoting on Opportunity ${opportunityId}`);
}

test('API Connection Test', async ({ request }) => {
    const loginUrl = dataAuth.sysadmin.url+'/services/oauth2/token';

    const grantType = 'client_credentials';
    const clientId = dataAuth.sysadmin.clientId;
    const clientSecret = dataAuth.sysadmin.clientSecret;

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
    expect((loginResponse).ok(), 'OAuth login should succeed').toBeTruthy();


    const loginBody = await loginResponse.json();
    accessToken = loginBody.access_token;
    instanceUrl = loginBody.instance_url;

    console.log('Access token is: ', accessToken);

    console.log('Instance URL is: ', instanceUrl);

    await patchStageQuoting(request, instanceUrl, accessToken);
});

test('TC021_TC022_Update Score Card', async () => {
    await allure.epic('Opportunity Management');
    await allure.feature('Manage My Opportunity');

    await allure.story('Update Score Card');
    await allure.severity('normal');

    await page.goto(`${dataAuth.sysadmin.afterLoginUrl}lightning/r/Opportunity/${opportunityId}/view`);

    await page.getByRole('tab', { name: 'Score Card' }).click();

    // assert sales team cannot edit
    if (process.env.TEST_USER_ADMIN == 'false') {
        await expect(
            page.getByRole('button', { name: 'Edit Has Incumbent' }),
            'Sales team edit button for Has Incumbent should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit RFP Influence' }),
            'Sales team edit button for RFP Influence should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit Implementation Risk' }),
            'Sales team edit button for Implementation Risk should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit Partnership Tier with' }),
            'Sales team edit button for Partnership Tier should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit Customer Favor' }),
            'Sales team edit button for Customer Favor should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit Customer Budget' }),
            'Sales team edit button for Customer Budget should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit Project Timeline' }),
            'Sales team edit button for Project Timeline should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit Customer Relationship' }),
            'Sales team edit button for Customer Relationship should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit Core Product' }),
            'Sales team edit button for Core Product should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit Deal Registered' }),
            'Sales team edit button for Deal Registered should not be visible to ES user'
        ).not.toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Edit Internal Capabilities' }),
            'Sales team edit button for Internal Capabilities should not be visible to ES user'
        ).not.toBeVisible();
    }

    // assert ES team can edit
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Has Incumbent' }),
    //     'ES team should be able to edit Has Incumbent'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) RFP Influence' }),
    //     'ES team should be able to edit RFP Influence'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Implementation Risk' }),
    //     'ES team should be able to edit Implementation Risk'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Partnership Tier' }),
    //     'ES team should be able to edit Partnership Tier'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Customer Favor' }),
    //     'ES team should be able to edit Customer Favor'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Customer Budget' }),
    //     'ES team should be able to edit Customer Budget'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Project Timeline' }),
    //     'ES team should be able to edit Project Timeline'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Customer Relationship' }),
    //     'ES team should be able to edit Customer Relationship'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Core Product' }),
    //     'ES team should be able to edit Core Product'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Deal Registered' }),
    //     'ES team should be able to edit Deal Registered'
    // ).toBeVisible();
    // await expect(
    //     page.getByRole('button', { name: 'Edit (ES) Internal' }),
    //     'ES team should be able to edit Internal Capabilities'
    // ).toBeVisible();

    await page.mouse.move(100, 100);

    await page.getByRole('button', { name: 'Edit (ES) Has Incumbent' }).click();

    // await page.getByRole('button', { name: '(ES) Customer Budget' }).click();
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
    await expect(
        page.locator('span').filter({ hasText: 'Red Warning Triangle' }).first(),
        "Score Card should show 'Red Warning Triangle' indicator after saving"
    ).toBeVisible();

});
