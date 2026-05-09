import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import dataAuth from "../../test-data/auth.json" assert { type: "json" };
import path from "path";
import { fileURLToPath } from "url";
import { getModule, getTestParams, updateTestParams, incrementModuleCounter, closeDb, setRuntimeState } from "../../utils/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let counter;
let tc001;
let tc002;
let tcContact;
let instanceUrl;
let accessToken;
let brandAccountId;

const userDataDirectory = path.resolve(__dirname, '../../.sf-profile');
let context;
let page;

// Resolve login user: sysadmin when TEST_USER_ADMIN=true, otherwise marketing
const loginUser = process.env.TEST_USER_ADMIN === 'true' ? dataAuth.sysadmin : dataAuth.marketing;

// runs only once before all tests in the file
test.beforeAll(async () => {
    await incrementModuleCounter('account_mgmt');
    await incrementModuleCounter('contact_mgmt');

    const module = await getModule('account_mgmt');
    counter = module.counter;
    
    tc001 = await getTestParams('account_mgmt', 'tc001');
    tc002 = await getTestParams('account_mgmt', 'tc002');
    tcContact = await getTestParams('contact_mgmt', 'tc_contact');

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
});

// test('TC004_Navigate to IOS ESM app', async () => {
//     await page.getByRole('button', { name: 'App Launcher' }).click();
//     await page.getByRole('combobox', { name: 'Search apps and items...' }).fill('IOH ESM');
//     await page.getByLabel('Apps', { exact: true }).waitFor({ state: 'visible' });
//     await expect(page.getByLabel('Apps', { exact: true }).getByText('IOH ESM'), 'IOH ESM app should appear in the Apps search results').toBeVisible();
// });

test('TC004_Create CCA', async () => {
    await allure.epic('Account Management');
    await allure.feature('Manage CCA and CA Records');

    await allure.story('Create Customer Corporate Account');
    await allure.severity('critical');

    await test.step('TC004_S01 - Open Accounts list view', async () => {
        await page.goto(`${dataAuth.marketing.afterLoginUrl}lightning/o/Account/list?filterName=__Recent`);

        // Expected: The Accounts list page is displayed
        await expect(
            page.getByRole('button', { name: 'Select a List View: Accounts' }),
            'Accounts list view should be displayed'
        ).toBeVisible();
    });

    await test.step('TC004_S02 - Click the New button', async () => {
        await expect(page.getByRole('button', { name: 'New' }), 'New button should appears').toBeVisible();
        await page.getByRole('button', { name: 'New' }).click();

        // Expected: The record type selection screen appears
        await expect(page.getByRole('heading', { name: 'New Account' })).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'New Account' }),
            'New Account record type selection dialog should appear'
        ).toBeVisible();
    });

    await test.step('TC004_S03 - Select Brand record type', async () => {
        await page.getByText('BrandUse the Brand Account to').click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Expected: The CCA creation form (layout for Brand) is displayed
        await expect(
            page.getByRole('heading', { name: 'New Account: Brand' }),
            'Brand creation form should be displayed'
        ).toBeVisible();
    });

    await test.step('TC004_S04 - Fill in all mandatory fields', async () => {
        await page.getByRole('combobox', { name: 'Salutation' }).click();
        await page.getByRole('option', { name: 'PT.' }).click();

        await page.getByRole('combobox', { name: 'Account Source' }).click();
        await page.getByRole('option', { name: 'Other' }).click();

        await page.getByRole('textbox', { name: 'Account Name' }).click();
        await page.getByRole('textbox', { name: 'Account Name' }).fill(tc001.accountName + ' ' + counter);

        await page.getByRole('textbox', { name: 'Description' }).click();
        await page.getByRole('textbox', { name: 'Description' }).fill('Created by Automation Testing');

        await page.getByRole('combobox', { name: 'Type' }).click();
        await page.getByRole('option', { name: 'Corporate' }).nth(0).click();

        await page.getByRole('combobox', { name: 'Account Status' }).click();
        await page.getByRole('option', { name: 'New' }).click();

        await page.getByRole('textbox', { name: 'Main Contact Area Code' }).click();
        await page.getByRole('textbox', { name: 'Main Contact Area Code' }).fill('021');

        await page.getByRole('textbox', { name: 'Phone' }).click();
        await page.getByRole('textbox', { name: 'Phone' }).fill(tc001.phone.toString());

        await page.getByRole('textbox', { name: 'Email' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill('account.cca.' + counter + '@company.co.id');

        await page.getByRole('textbox', { name: 'Company Street' }).click();
        await page.getByRole('textbox', { name: 'Company Street' }).fill('Jalan Merdeka Barat');

        await page.getByRole('textbox', { name: 'Company City' }).click();
        await page.getByRole('textbox', { name: 'Company City' }).fill('Jakarta Pusat');

        await page.getByRole('textbox', { name: 'Company State/Province' }).click();
        await page.getByRole('textbox', { name: 'Company State/Province' }).fill('DKI Jakarta');

        await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).click();
        await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).fill('10110');

        await page.getByRole('textbox', { name: 'Company Country' }).click();
        await page.getByRole('textbox', { name: 'Company Country' }).fill('Indonesia');

        await page.getByRole('option', { name: 'eMail' }).click();
        await page.getByRole('button', { name: 'Move selection to Chosen' }).click();

        // Expected: All required fields are populated and no validation errors appear
        await expect(
            page.getByRole('textbox', { name: 'Account Name' }),
            'Account Name field should reflect the entered value'
        ).toHaveValue(tc001.accountName + ' ' + counter);
    });

    await test.step('TC004_S05 - Click Save', async () => {
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await page.waitForURL('**/lightning/r/Account/**');

        // Expected: A new Customer Corporate Account record is successfully created and the record detail page is displayed
        await expect(
            page.locator('div').filter({ hasText: 'Success notification.Account' }).nth(3),
            'Success notification should appear after saving the CCA record'
        ).toBeVisible();

        brandAccountId = page.url().match(/\/lightning\/r\/Account\/([^/]+)\//)?.[1];

        await setRuntimeState('corporateAccountId', brandAccountId);
    });
});

test('Create Billing Contact', async() => {
    await allure.epic('Account Management');
    await allure.feature('Contact Management');

    await allure.story('Create Billing Contact');
    await allure.severity('normal');

    await page.goto(`${dataAuth.marketing.afterLoginUrl}lightning/o/Contact/list?filterName=__Recent`);

    await expect(page.getByRole('button', { name: 'New' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
    await page.getByRole('button', { name: 'New' }).click();
    await page.getByText('Billing Contact').click();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('combobox', { name: 'Contact Type' }).click();
    await page.getByRole('option', { name: 'PIC Corporate' }).click();
    await page.getByRole('combobox', { name: 'Salutation' }).click();
    await page.getByRole('option', { name: 'Mr.' }).click();
    await page.getByRole('textbox', { name: 'First Name' }).click();
    await page.getByRole('textbox', { name: 'First Name' }).fill(`${tcContact.firstName}`);
    await page.getByRole('textbox', { name: 'Last Name' }).click();
    await page.getByRole('textbox', { name: 'Last Name' }).fill(`${tcContact.lastName} ${counter}`);

    await page.getByRole('combobox', { name: 'Account Name' }).click();
    await page.getByRole('combobox', { name: 'Account Name' }).fill(tc001.accountName + ' ' + counter);

    await page.getByRole('combobox', { name: 'Account Name' }).click();
    await page.getByRole('combobox', { name: 'Account Name' }).fill(tc001.accountName + ' ' + counter);
    await page.getByRole('listbox', { name: 'Account Name' })
    .getByRole('group', { name: 'Search Results' })
    .getByRole('option', { name: tc001.accountName + ' ' + counter })
    .click();
    
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('johan.armando@example.com');
    
    await page.getByRole('textbox', { name: 'Place Of Birth' }).click();
    await page.getByRole('textbox', { name: 'Place Of Birth' }).fill('Garut');
    
    await page.getByRole('combobox', { name: 'Gender' }).click();
    await page.getByRole('option', { name: 'Male', exact: true }).click();
    
    await page.getByRole('textbox', { name: 'Mobile' }).click();
    await page.getByRole('textbox', { name: 'Mobile' }).fill('085647890123');
    
    await page.getByRole('textbox', { name: 'Phone', exact: true }).click();
    await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('03124567654');
    
    await page.getByRole('combobox', { name: 'Marital Status' }).click();
    await page.getByRole('option', { name: 'Single' }).click();
    
    await page.getByRole('combobox', { name: 'Citizenship' }).click();
    await page.getByRole('option', { name: 'Indonesian' }).click();
    
    await page.getByRole('combobox', { name: 'Religion' }).click();
    await page.getByRole('option', { name: 'Moslem' }).click();

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.locator('div').filter({ hasText: 'Success notification.Contact' }).nth(3)).toBeVisible();

    const billingContactId = page.url().match(/\/lightning\/r\/Contact\/([^/]+)\//)?.[1];

    await setRuntimeState('billingContactId', billingContactId);

});

test('TC005_Create CA under CCA', async () => {
    await allure.epic('Account Management');
    await allure.feature('Manage CCA and CA Records');

    await allure.story('Create Customer Account');
    await allure.severity('critical');
    await allure.label('pre-requisite', '1.1 User has Marketing User profile');

    await test.step('TC005_S01 - Open Accounts list view', async () => {
        await page.goto(`${dataAuth.marketing.afterLoginUrl}lightning/o/Account/list?filterName=__Recent`);

        // await page.getByRole('link', { name: 'Accounts' }).click();

        // Expected: The Accounts list page is displayed
        await expect(
            page.getByRole('button', { name: 'Select a List View: Accounts' }),
            'Accounts list view should be displayed'
        ).toBeVisible();
    });

    await test.step('TC005_S02 - Click the New button', async () => {
        await page.getByRole('button', { name: 'New' }).click();

        // Expected: The record type selection screen appears
        await expect(page.getByRole('heading', { name: 'New Account' })).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'New Account' }),
            'New Account record type selection dialog should appear'
        ).toBeVisible();
    });

    await test.step('TC005_S03 - Select Business record type', async () => {
        await page.getByText('BusinessUse business accounts').click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Expected: The CA creation form (layout for Customer Account) is displayed
        await expect(
            page.getByRole('heading', { name: 'New Account: Business' }),
            'Business creation form should be displayed'
        ).toBeVisible();
    });

    await test.step('TC005_S04 - Fill in all mandatory fields', async () => {
        await page.getByRole('combobox', { name: 'Salutation' }).click();
        await page.getByRole('option', { name: 'PT.' }).click();

        await page.getByRole('textbox', { name: 'Account Name' }).click();
        await page.getByRole('textbox', { name: 'Account Name' }).fill(tc002.accountName + ' ' + counter);

        // await page.getByRole('combobox', { name: 'Account Source' }).click();
        // await page.getByRole('option', { name: 'Other' }).click();

        await page.getByRole('combobox', { name: 'Account Status' }).click();
        await page.getByRole('option', { name: 'New' }).click();

        await page.getByRole('textbox', { name: 'Company Street' }).click();
        await page.getByRole('textbox', { name: 'Company Street' }).fill('Jalan Merdeka Barat');

        await page.getByRole('textbox', { name: 'Company City' }).click();
        await page.getByRole('textbox', { name: 'Company City' }).fill('Jakarta Pusat');

        await page.getByRole('textbox', { name: 'Company State/Province' }).click();
        await page.getByRole('textbox', { name: 'Company State/Province' }).fill('DKI Jakarta');

        await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).click();
        await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).fill('10110');

        await page.getByRole('textbox', { name: 'Company Country' }).click();
        await page.getByRole('textbox', { name: 'Company Country' }).fill('Indonesia');

        await page.getByRole('combobox', { name: 'Type', exact: true }).click();
        await page.getByRole('option', { name: 'Corporate', exact: true }).click();

        await page.getByRole('combobox', { name: 'ID Type' }).click();
        await page.getByRole('option', { name: 'SIUP' }).click();

        await page.getByLabel('*Date').click();
        await page.getByLabel('Pick a Year').selectOption('2030');
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: '10' }).click();

        await page.getByRole('textbox', { name: 'ID Reference' }).click();
        await page.getByRole('textbox', { name: 'ID Reference' }).fill(tc002.idReference + counter.toString().padStart(4, '0'));

        await page.getByRole('textbox', { name: 'NPWP' }).click();
        await page.getByRole('textbox', { name: 'NPWP' }).fill(tc002.idReference + counter.toString().padStart(4, '0'));

        await page.getByRole('combobox', { name: 'Line Of Business', exact: true }).click();
        await page.getByRole('option', { name: 'Communications & Technologies' }).click();

        await page.getByRole('combobox', { name: 'Sub Line of Business' }).click();
        await page.getByRole('option', { name: 'Content Provider' }).click();

        await page.getByRole('combobox', { name: 'Customer Segment' }).click();
        await page.getByRole('option', { name: 'Large Enterprise' }).click();

        await page.getByRole('combobox', { name: 'Corporate Scale' }).click();
        await page.getByRole('option', { name: 'Multinational Company' }).click();

        await page.getByRole('textbox', { name: 'Main Contact Area Code' }).click();
        await page.getByRole('textbox', { name: 'Main Contact Area Code' }).fill('021');

        await page.getByRole('textbox', { name: 'Phone' }).click();
        await page.getByRole('textbox', { name: 'Phone' }).fill(tc002.phone.toString());

        await page.getByRole('textbox', { name: 'Email' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill('account.ca.' + counter + '@company.co.id');

        await page.getByRole('combobox', { name: 'Primary Contact' }).click();
        await page.getByRole('combobox', { name: 'Primary Contact' }).fill(`${tcContact.firstName} ${tcContact.lastName} ${counter}`);
        // await page.getByRole('option', { name: `${tcContact.firstName} ${tcContact.lastName} ${counter} ${tc001.accountName.toUpperCase()} ${counter}` }).click();
        await page.getByTitle(`${tcContact.firstName} ${tcContact.lastName} ${counter}`, { exact: true }).click();

        await page.getByRole('option', { name: 'eMail' }).click();
        await page.getByRole('button', { name: 'Move selection to Chosen' }).click();

        // Expected: All required fields are populated and no validation errors appear
        await expect(
            page.getByRole('textbox', { name: 'Account Name' }),
            'Account Name field should reflect the entered value'
        ).toHaveValue(tc002.accountName + ' ' + counter);
    });

    await test.step('TC005_S05 - Select the appropriate Level 1 Customer Account in the Parent Account field', async () => {
        await page.getByRole('combobox', { name: 'Parent Account' }).click();
        await page.getByRole('combobox', { name: 'Parent Account' }).fill(tc001.accountName + ' ' + counter);
        await page.getByRole('listbox', { name: 'Parent Account' })
        .getByRole('group', { name: 'Search Results' })
        .getByRole('option', { name: tc001.accountName + ' ' + counter })
        .click();

        // Expected: The Parent Account field displays the selected Level 1 CA
        await expect(
            page.getByRole('combobox', { name: 'Parent Account' }),
            'Parent Account field should display the selected CCA'
        ).toHaveValue(tc001.accountName.toUpperCase() + ' ' + counter);
    });

    await test.step('TC005_S06 - Click Save', async () => {
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await page.waitForURL('**/lightning/r/Account/**');

        // Expected: A new Customer Account record is successfully created and the record detail page is displayed
        await expect(
            page.locator('div').filter({ hasText: 'Success notification.Account' }).nth(3),
            'Success notification should appear after saving the CA record'
        ).toBeVisible();

        const newAccountName = (tc002.accountName + ' ' + counter).toUpperCase();
        await updateTestParams('lead_mgmt', 'tc002', { accountName: newAccountName, accountOption: newAccountName });
        console.log(`[TC005] Updated tc002.accountName and tc002.accountOption to: ${newAccountName}`);
    });
});

// test('TC007_Check Duplicate CA Creation with Same Parent Account', async () => {
//     await allure.epic('Account Management');
//     await allure.feature('Manage CCA and CA Records');

//     await allure.story('Check Duplicate CA Creation with Same Parent Account');
//     await allure.severity('critical');

//     await test.step('TC007_S01 - Open Accounts list view', async () => {
//         await page.getByRole('link', { name: 'Accounts' }).click();

//         // Expected: The Accounts list page is displayed
//         await expect(
//             page.getByRole('button', { name: 'Select a List View: Accounts' }),
//             'Accounts list view should be displayed'
//         ).toBeVisible();
//     });

//     await test.step('TC007_S02 - Click the New button', async () => {
//         await page.getByRole('button', { name: 'New' }).click();

//         // Expected: The record type selection screen appears
//         await expect(page.getByRole('heading', { name: 'New Account' })).toBeVisible();
//         await expect(
//             page.getByRole('heading', { name: 'New Account' }),
//             'New Account record type selection dialog should appear'
//         ).toBeVisible();
//     });

//     await test.step('TC007_S03 - Select Customer Account record type', async () => {
//         await page.getByText('BusinessUse business accounts').click();
//         await page.getByRole('button', { name: 'Next' }).click();

//         // Expected: The CA creation form (layout for Customer Account) is displayed
//         await expect(
//             page.getByRole('heading', { name: 'New Account: Business' }),
//             'Business creation form should be displayed'
//         ).toBeVisible();
//     });

//     await test.step('TC007_S04 - Fill in all mandatory fields', async () => {
//         await page.getByRole('combobox', { name: 'Salutation' }).click();
//         await page.getByRole('option', { name: 'PT.' }).click();

//         await page.getByRole('textbox', { name: 'Account Name' }).click();
//         await page.getByRole('textbox', { name: 'Account Name' }).fill(tc002.accountName + ' ' + counter);

//         await page.getByRole('combobox', { name: 'Account Source' }).click();
//         await page.getByRole('option', { name: 'Other' }).click();

//         await page.getByRole('combobox', { name: 'Account Status' }).click();
//         await page.getByRole('option', { name: 'New' }).click();

//         await page.getByRole('textbox', { name: 'Company Street' }).click();
//         await page.getByRole('textbox', { name: 'Company Street' }).fill('Jalan Merdeka Barat');

//         await page.getByRole('textbox', { name: 'Company City' }).click();
//         await page.getByRole('textbox', { name: 'Company City' }).fill('Jakarta Pusat');

//         await page.getByRole('textbox', { name: 'Company State/Province' }).click();
//         await page.getByRole('textbox', { name: 'Company State/Province' }).fill('DKI Jakarta');

//         await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).click();
//         await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).fill('10110');

//         await page.getByRole('textbox', { name: 'Company Country' }).click();
//         await page.getByRole('textbox', { name: 'Company Country' }).fill('Indonesia');

//         await page.getByRole('combobox', { name: 'Type', exact: true }).click();
//         await page.getByRole('option', { name: 'Corporate', exact: true }).click();

//         await page.getByRole('combobox', { name: 'ID Type' }).click();
//         await page.getByRole('option', { name: 'SIUP' }).click();

//         await page.getByLabel('*Date').click();
//         await page.getByLabel('Pick a Year').selectOption('2030');
//         await page.getByRole('button', { name: 'Next Month' }).click();
//         await page.getByRole('button', { name: '10' }).click();

//         await page.getByRole('textbox', { name: 'ID Reference' }).click();
//         await page.getByRole('textbox', { name: 'ID Reference' }).fill(tc002.idReference + counter.toString().padStart(4, '0'));

//         await page.getByRole('textbox', { name: 'NPWP' }).click();
//         await page.getByRole('textbox', { name: 'NPWP' }).fill(tc002.idReference + counter.toString().padStart(4, '0'));

//         await page.getByRole('combobox', { name: 'Line Of Business', exact: true }).click();
//         await page.getByRole('option', { name: 'Communications & Technologies' }).click();

//         await page.getByRole('combobox', { name: 'Sub Line of Business' }).click();
//         await page.getByRole('option', { name: 'Content Provider' }).click();

//         await page.getByRole('combobox', { name: 'Customer Segment' }).click();
//         await page.getByRole('option', { name: 'Large Enterprise' }).click();

//         await page.getByRole('combobox', { name: 'Corporate Scale' }).click();
//         await page.getByRole('option', { name: 'Multinational Company' }).click();

//         await page.getByRole('textbox', { name: 'Main Contact Area Code' }).click();
//         await page.getByRole('textbox', { name: 'Main Contact Area Code' }).fill('021');

//         await page.getByRole('textbox', { name: 'Phone' }).click();
//         await page.getByRole('textbox', { name: 'Phone' }).fill(tc002.phone.toString());

//         await page.getByRole('textbox', { name: 'Email' }).click();
//         await page.getByRole('textbox', { name: 'Email' }).fill('account.ca.' + counter + '@company.co.id');

//         await page.getByRole('combobox', { name: 'Primary Contact' }).click();
//         await page.getByRole('combobox', { name: 'Primary Contact' }).fill(`${tcContact.firstName} ${tcContact.lastName} ${counter}`);
//         await page.getByRole('option', { name: `${tcContact.firstName} ${tcContact.lastName} ${counter} ${tc001.accountName.toUpperCase()} ${counter}` }).click();

//         await page.getByRole('option', { name: 'eMail' }).click();
//         await page.getByRole('button', { name: 'Move selection to Chosen' }).click();

//         // Expected: All required fields are populated and no validation errors appear
//         await expect(
//             page.getByRole('textbox', { name: 'Account Name' }),
//             'Account Name field should reflect the entered value'
//         ).toHaveValue(tc002.accountName + ' ' + counter);
//     });

//     await test.step('TC007_S05 - Select the appropriate Level 1 Customer Account in the Parent Account field', async () => {
//         await page.getByRole('combobox', { name: 'Parent Account' }).click();
//         await page.getByRole('combobox', { name: 'Parent Account' }).fill(tc001.accountName + ' ' + counter);
//         await page.getByRole('listbox', { name: 'Parent Account' })
//         .getByRole('group', { name: 'Search Results' })
//         .getByRole('option', { name: tc001.accountName + ' ' + counter })
//         .click();

//         // Expected: The Parent Account field displays the selected Level 1 CA
//         await expect(
//             page.getByRole('combobox', { name: 'Parent Account' }),
//             'Parent Account field should display the selected CCA'
//         ).toHaveValue(tc001.accountName.toUpperCase() + ' ' + counter);
//     });

//     await test.step('TC007_S06 - Click Save', async () => {
//         await page.getByRole('button', { name: 'Save', exact: true }).click();
//         await page.waitForURL('**/lightning/r/Account/**');

//         // Expected: A new Customer Account record is successfully created and the record detail page is displayed
//         await expect(
//             page.locator('div').filter({ hasText: 'Info notification.It looks as' }).nth(3),
//             'Info notification about potential duplicates should appear'
//         ).toBeVisible();
//         await expect(
//             page.getByText('We found 1 potential duplicate of this Account.View Duplicates', { exact: true }),
//             'Duplicate warning message should be displayed'
//         ).toBeVisible();
//     });
// });
