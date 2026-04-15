import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import data from "../../test-data/lead-mgmt.json" assert { type: "json" };
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const counter = data.counter;
let instanceUrl;
let accessToken;
let leadId;
let opportunityId;

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
 * Fetches the Status field of a Lead via Salesforce REST API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} instanceUrl  - e.g. https://your-org.my.salesforce.com
 * @param {string} accessToken  - Bearer token from OAuth
 * @param {string} leadId       - Salesforce Lead record ID
 * @param {string} [expectedStatus] - If provided, asserts the status matches
 * @returns {Promise<string>} The Lead Status value
 */
async function getLeadStatus(request, instanceUrl, accessToken, leadId, expectedStatus) {
    const url = `${instanceUrl}/services/data/v65.0/sobjects/Lead/${leadId}?fields=Status`;

    const response = await request.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('Lead API response:', (await response.body()).toString());
    expect(response.ok()).toBeTruthy();

    const leadStatus = (await response.json()).Status;
    console.log('Lead status from API:', leadStatus);

    if (expectedStatus !== undefined) {
        expect(leadStatus).toBe(expectedStatus);
    }

    return leadStatus;
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
});

test('TC001_View All My Leads', async () => {
    await allure.epic('Lead Management');
    await allure.feature('Manage My Leads');

    await allure.story('View All My Leads');
    await allure.severity('normal');
    await allure.label('pre-requisite', '1.1 User has logged into Salesforce as Sales profile');

    await test.step('TC001_S01 - Open Leads list view', async () => {
        
        await page.goto(`${data.login.afterLoginUrl}lightning/o/Lead/list?filterName=__Recent`);

        // Expected: Leads list view is displayed
        await expect(page.getByRole('button', { name: 'Select a List View: Leads' })).toBeVisible();
    });

    await test.step('TC001_S02 - Select All my Leads', async () => {
        await page.getByRole('button', { name: 'Select a List View: Leads' }).click();
        await page.getByText(data.tc001.listViewName).click();

        // Expected: All leads owned by the user displayed with Project Name and Created By fields
        await expect(page.getByText(data.tc001.listViewName)).toBeVisible();
        await expect(page.getByRole('button', { name: `Sort by: ${data.tc001.expectedColumns[0]}` })).toBeVisible();
        await expect(page.getByRole('button', { name: `Sort by: ${data.tc001.expectedColumns[1]}` })).toBeVisible();
        await expect(page.getByLabel(data.tc001.expectedColumns[0], { exact: true }).locator('lightning-primitive-header-factory')).toContainText(data.tc001.expectedColumns[0]);
        await expect(page.getByLabel(data.tc001.expectedColumns[1], { exact: true })).toContainText(data.tc001.expectedColumns[1]);
    });
});

test('TC002_Create New Lead', async ({ request }) => {
    await allure.epic('Lead Management');
    await allure.feature('Manage My Leads');
    await allure.story('Create New Lead');
    await allure.severity('critical');

    await test.step('TC002_S01 - Click the New button', async () => {
        await page.goto(`${data.login.afterLoginUrl}lightning/o/Lead/list?filterName=__Recent`);
        await page.getByRole('button', { name: 'New' }).click();

        // Expected: Create new lead screen is displayed
        await expect(page.getByRole('heading', { name: 'New Lead' })).toBeVisible();
    });

    await test.step('TC002_S02 - Fill all mandatory fields', async () => {
        await page.getByRole('combobox', { name: 'Account Name' }).click();
        await page.getByRole('combobox', { name: 'Account Name' }).fill(data.tc002.accountName);
        await page.getByRole('option', { name: data.tc002.accountOption }).click();

        await page.getByRole('textbox', { name: 'Opportunity RFS Date' }).click();
        for (let i = 0; i < data.tc002.rfsDateMonthsAhead; i++) {
            await page.getByRole('button', { name: 'Next Month' }).click();
        }
        await page.getByRole('button', { name: data.tc002.rfsDateDay }).click();

        await page.getByRole('textbox', { name: 'Project Name' }).click();
        await page.getByRole('textbox', { name: 'Project Name' }).fill(`${data.tc002.projectName} ${counter}`);

        await page.getByRole('textbox', { name: 'Company' }).click();
        await page.getByRole('textbox', { name: 'Company' }).fill(`${data.tc002.company} ${counter}`);

        await page.getByRole('combobox', { name: 'Lead Source' }).click();
        await page.getByRole('option', { name: data.tc002.leadSource }).click();

        await page.getByRole('textbox', { name: 'Description' }).click();
        await page.getByRole('textbox', { name: 'Description' }).fill(data.tc002.description);

        await page.getByRole('combobox', { name: 'Lead Currency' }).click();
        await page.getByText(data.tc002.leadCurrency).click();

        await page.getByRole('combobox', { name: 'Primary Contact' }).click();
        await page.getByRole('combobox', { name: 'Primary Contact' }).fill(data.tc002.primaryContactSearch);
        await page.getByRole('option', { name: data.tc002.primaryContactOption }).click();

        await page.getByRole('textbox', { name: 'Last Name' }).click();
        await page.getByRole('textbox', { name: 'Last Name' }).fill(`${data.tc002.lastName} ${counter}`);

        await page.getByRole('textbox', { name: 'Mobile' }).click();
        await page.getByRole('textbox', { name: 'Mobile' }).fill(`${data.tc002.mobile}${counter}`);

        await page.getByRole('combobox', { name: 'Type of Product' }).click();
        await page.getByText(data.tc002.typeOfProduct).click();

        await page.getByRole('combobox', { name: 'Function' }).click();
        await page.locator('span').filter({ hasText: new RegExp(`^${data.tc002.function}$`) }).first().click();

        await page.getByRole('combobox', { name: 'Budget Status?' }).click();
        await page.getByText(data.tc002.budgetStatus).click();

        await page.getByRole('combobox', { name: 'Role of Lead (Seniority)' }).click();
        await page.getByText(data.tc002.roleOfLeadSeniority).click();

        await page.getByRole('combobox', { name: 'What is the timeframe of' }).click();
        await page.getByText(data.tc002.timeframe).click();

        await page.getByRole('combobox', { name: 'New requirements?' }).click();
        await page.getByRole('option', { name: data.tc002.newRequirements }).nth(0).click();

        await page.getByRole('combobox', { name: 'Is he an existing customer?' }).click();
        await page.getByRole('option', { name: data.tc002.existingCustomer }).nth(0).click();

        await page.getByRole('combobox', { name: 'Lead Type' }).click();
        await page.getByTitle(data.tc002.leadType).click();

        // Expected: All mandatory fields are filled
        await expect(page.getByRole('textbox', { name: 'Project Name' })).toHaveValue(`${data.tc002.projectName} ${counter}`);
    });

    await test.step('TC002_S03 - Click Save', async () => {
        await page.getByRole('button', { name: 'Save' }).click();
        await page.waitForURL('**/lightning/r/Lead/**');

        leadId = page.url().match(/\/lightning\/r\/Lead\/([^/]+)\//)?.[1];
        console.log(`[TC002] Lead ID: ${leadId}`);

        // Expected: Lead created successfully, status is New, lead owner is current user
        await expect(page.locator('div').filter({ hasText: 'Success notification.Lead "Mr' }).nth(3)).toBeVisible({ timeout: 10000 });
        await expect(page.locator('records-record-layout-item[field-label="Project Name"]')).toBeVisible();
        await expect(page.locator('records-record-layout-block')).toContainText(`${data.tc002.projectName} ${counter}`);
        await expect(page.locator('lightning-formatted-text').filter({ hasText: `${data.tc002.projectName} ${counter}` })).toBeVisible();
        await expect(page.locator('.slds-form-element.slds-hint-parent.test-id__output-root > .slds-form-element__control').first()).toBeVisible();
        await expect(page.locator('force-owner-lookup')).toBeVisible();
        await expect(page.locator('force-owner-lookup')).toContainText(data.tc002.expectedLeadOwner);
        await expect(page.getByRole('tabpanel', { name: 'Details' }).getByText('Lead Status', { exact: true })).toBeVisible();
        await expect(page.locator('lightning-formatted-text').filter({ hasText: data.tc002.expectedLeadStatus })).toContainText(data.tc002.expectedLeadStatus);
    });

    await test.step('TC002_S04 - Verify the lead status', async () => {
        // Expected: Lead status is New
        await getLeadStatus(request, instanceUrl, accessToken, leadId, data.tc002.expectedLeadStatus);
    });
});

test('TC008_Update Lead Status', async ({ request }) => {
    await allure.epic('Lead Management');
    await allure.feature('Manage My Leads');
    await allure.story('Update Lead Status');
    await allure.severity('normal');

    await test.step('TC008_S01 - Update lead status to New to Working', async () => {
        await page.goto(`${data.login.url}lightning/r/Lead/${leadId}/view`);
        await page.getByRole('button', { name: 'Show more actions' }).click();
        await page.getByRole('menuitem', { name: 'Update Lead Status' }).first().click();
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.locator('lightning-formatted-rich-text')).toContainText('New to Working');
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('dialog', { name: 'Update Lead Status' }).waitFor({ state: 'hidden' });
        // Expected: Lead status is Working
        await getLeadStatus(request, instanceUrl, accessToken, leadId, 'Working');
    });

    await test.step('TC008_S02 - Update lead status to Working to Qualified', async () => {
        await page.getByRole('button', { name: 'Show more actions' }).click();
        await page.getByRole('menuitem', { name: 'Update Lead Status' }).first().click();
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.locator('lightning-formatted-rich-text')).toContainText('Working to Qualify');
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('dialog', { name: 'Update Lead Status' }).waitFor({ state: 'hidden' });
        // Expected: Lead status is Qualified
        await getLeadStatus(request, instanceUrl, accessToken, leadId, 'Qualified');
    });
});

test('TC009_Convert Lead', async () => {
    await allure.epic('Lead Management');
    await allure.feature('Manage My Leads');
    await allure.story('Convert Lead');
    await allure.severity('critical');

    await test.step('TC009_S01 - Convert Lead', async () => {
        await page.goto(`${data.login.url}lightning/r/Lead/${leadId}/view`);
        await page.getByRole('button', { name: 'Convert' }).click();
        await page.waitForURL('**/lightning/r/Opportunity/**', { timeout: 10000 });
        
        await expect(page.locator('records-entity-label').filter({ hasText: 'Opportunity' })).toBeVisible();
        opportunityId = page.url().match(/\/lightning\/r\/Opportunity\/([^/]+)\//)?.[1];
        console.log(`[TC009] Opportunity ID: ${opportunityId}`);

        const opptyDataPath = path.resolve(__dirname, '../../test-data/non-ida-oppty.json');
        const opptyData = JSON.parse(readFileSync(opptyDataPath, 'utf-8'));
        opptyData.opportunityId = opportunityId;
        writeFileSync(opptyDataPath, JSON.stringify(opptyData, null, 2));
        console.log(`[TC009] Updated opportunityId in non-ida-oppty.json`);

        await expect(page.locator('forcegenerated-highlightspanel_opportunity___012ms000000haxkyao___compact___view___recordlayout2')).toContainText(data.tc002.accountOption);
        await expect(page.locator('forcegenerated-highlightspanel_opportunity___012ms000000haxkyao___compact___view___recordlayout2')).toContainText('Scoping');
    
    });
    
});
