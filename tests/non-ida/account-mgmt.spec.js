import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import data from "../../test-data/non-ida-account-mgmt.json" assert { type: "json" };

const counter = data.counter;

test.only('Account Management', async ({ page }) => {
    await allure.epic('Account Management');
    await allure.feature('Manage CCA and CA Records');
    await allure.story('Create Customer Corporate Account');
    await allure.severity('critical');
    await allure.label('pre-requisite', '1.1 User has Marketing User profile');

    await test.step('TC004_S01 - Open Accounts list view', async () => {
        await page.goto(data.login.url);
        await page.getByRole('textbox', { name: 'Username' }).fill(data.login.username);
        await page.getByRole('textbox', { name: 'Password' }).click();
        await page.getByRole('textbox', { name: 'Password' }).fill(data.login.password);
        await page.getByRole('button', { name: 'Log In to Sandbox' }).click();
        await page.getByRole('link', { name: 'Accounts' }).click();

        // Expected: The Accounts list page is displayed
        await expect(page.getByRole('button', { name: 'Select a List View: Accounts' })).toBeVisible();
    });

    await test.step('TC004_S02 - Click the New button', async () => {
        await page.getByRole('button', { name: 'New' }).click();

        // Expected: The record type selection screen appears
        await expect(page.getByLabel('New Account')).toBeVisible();
    });

    await test.step('TC004_S03 - Select Business record type', async () => {
        await page.getByLabel('New Account').getByText('Customer Corporate Account').click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Expected: The CCA creation form (layout for Customer Corporate Account) is displayed
        await expect(page.getByRole('heading', { name: 'New Account: Customer Corporate Account' })).toBeVisible();
    });

    await test.step('TC004_S04 - Fill in all mandatory fields', async () => {
        await page.getByRole('combobox', { name: 'Salutation' }).click();
        await page.getByRole('option', { name: 'PT.' }).click();

        await page.getByRole('combobox', { name: 'Account Source' }).click();
        await page.getByRole('option', { name: 'Indosat Vendor Data' }).click();

        await page.getByRole('textbox', { name: 'Account Name' }).click();
        await page.getByRole('textbox', { name: 'Account Name' }).fill(data.tc001.accountName + ' ' + counter);

        await page.getByRole('textbox', { name: 'Description' }).click();
        await page.getByRole('textbox', { name: 'Description' }).fill('Created by Automation Testing');

        await page.getByRole('combobox', { name: 'Type' }).click();
        await page.getByRole('option', { name: 'Corporate' }).click();

        await page.getByRole('combobox', { name: 'Account Status' }).click();
        await page.getByRole('option', { name: 'New' }).click();

        await page.getByRole('textbox', { name: 'Main Contact Area Code' }).click();
        await page.getByRole('textbox', { name: 'Main Contact Area Code' }).fill('021');

        await page.getByRole('textbox', { name: 'Phone' }).click();
        await page.getByRole('textbox', { name: 'Phone' }).fill(data.tc001.phone);

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
        await expect(page.getByRole('textbox', { name: 'Account Name' })).toHaveValue(data.tc001.accountName + ' ' + counter);
    });

    await test.step('TC004_S05 - Click Save', async () => {
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await page.waitForURL('**/lightning/r/Account/**');

        // Expected: A new Customer Corporate Account record is successfully created and the record detail page is displayed
        await expect(page.locator('div').filter({ hasText: 'Success notification.Account' }).nth(3)).toBeVisible();
    });


    await allure.story('Create Customer Account');
    await allure.severity('critical');
    await allure.label('pre-requisite', '1.1 User has Marketing User profile');

    await test.step('TC005_S01 - Open Accounts list view', async () => {
        await page.getByRole('link', { name: 'Accounts' }).click();

        // Expected: The Accounts list page is displayed
        await expect(page.getByRole('button', { name: 'Select a List View: Accounts' })).toBeVisible();
    });

    await test.step('TC005_S02 - Click the New button', async () => {
        await page.getByRole('button', { name: 'New' }).click();

        // Expected: The record type selection screen appears
        await expect(page.getByLabel('New Account')).toBeVisible();
    });

    await test.step('TC005_S03 - Select Business record type', async () => {
        await page.getByLabel('New Account').getByText('Customer Account').click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Expected: The CA creation form (layout for Customer Account) is displayed
        await expect(page.getByRole('heading', { name: 'New Account: Customer Account' })).toBeVisible();
    });

    await test.step('TC005_S04 - Fill in all mandatory fields', async () => {
        await page.getByRole('combobox', { name: 'Salutation' }).click();
        await page.getByRole('option', { name: 'PT.' }).click();

        await page.getByRole('textbox', { name: 'Account Name' }).click();
        await page.getByRole('textbox', { name: 'Account Name' }).fill(data.tc002.accountName + ' ' + counter);

        await page.getByRole('combobox', { name: 'Account Source' }).click();
        await page.getByRole('option', { name: 'Indosat Vendor Data' }).click();

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
        await page.getByLabel('Pick a Year').selectOption('2040');
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: 'Next Month' }).dblclick();
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: '31' }).click();

        await page.getByRole('textbox', { name: 'ID Reference' }).click();
        await page.getByRole('textbox', { name: 'ID Reference' }).fill(data.tc002.idReference + counter.toString().padStart(4, '0'));

        await page.getByRole('textbox', { name: 'NPWP' }).click();
        await page.getByRole('textbox', { name: 'NPWP' }).fill(data.tc002.idReference + counter.toString().padStart(4, '0'));

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
        await page.getByRole('textbox', { name: 'Phone' }).fill(data.tc002.phone);

        await page.getByRole('textbox', { name: 'Email' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill('account.ca.' + counter + '@company.co.id');

        await page.getByRole('combobox', { name: 'Primary Contact' }).click();
        await page.getByRole('combobox', { name: 'Primary Contact' }).fill('test cont');
        await page.getByRole('option', { name: 'Test Contact TEST CREATE CA' }).click();

        await page.getByRole('option', { name: 'eMail' }).click();
        await page.getByRole('button', { name: 'Move selection to Chosen' }).click();

        // Expected: All required fields are populated and no validation errors appear
        await expect(page.getByRole('textbox', { name: 'Account Name' })).toHaveValue(data.tc002.accountName + ' ' + counter);
    });

    await test.step('TC005_S05 - Select the appropriate Level 1 Customer Account in the Parent Account field', async () => {
        await page.getByRole('combobox', { name: 'Parent Account' }).click();
        await page.getByRole('combobox', { name: 'Parent Account' }).fill(data.tc001.accountName + ' ' + counter);
        await page.getByRole('listbox', { name: 'Parent Account' })
        .getByRole('group', { name: 'Search Results' })
        .getByRole('option', { name: data.tc001.accountName + ' ' + counter })
        .click();

        // Expected: The Parent Account field displays the selected Level 1 CA
        await expect(page.getByRole('combobox', { name: 'Parent Account' })).toHaveValue(data.tc001.accountName.toUpperCase() + ' ' + counter);
    });

    await test.step('TC005_S06 - Click Save', async () => {
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await page.waitForURL('**/lightning/r/Account/**');

        // Expected: A new Customer Account record is successfully created and the record detail page is displayed
        await expect(page.locator('div').filter({ hasText: 'Success notification.Account' }).nth(3)).toBeVisible();
    });

    // test the duplicate CA creation with same Parent Account
    await allure.story('Check Duplicate CA Creation with Same Parent Account');
    await allure.severity('critical');
    await allure.label('pre-requisite', '1.1 User has Marketing User profile');

    await test.step('TC007_S01 - Open Accounts list view', async () => {
        await page.getByRole('link', { name: 'Accounts' }).click();

        // Expected: The Accounts list page is displayed
        await expect(page.getByRole('button', { name: 'Select a List View: Accounts' })).toBeVisible();
    });

    await test.step('TC007_S02 - Click the New button', async () => {
        await page.getByRole('button', { name: 'New' }).click();

        // Expected: The record type selection screen appears
        await expect(page.getByLabel('New Account')).toBeVisible();
    });

    await test.step('TC007_S03 - Select Customer Account record type', async () => {
        await page.getByLabel('New Account').getByText('Customer Account').click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Expected: The CA creation form (layout for Customer Account) is displayed
        await expect(page.getByRole('heading', { name: 'New Account: Customer Account' })).toBeVisible();
    });

    await test.step('TC007_S04 - Fill in all mandatory fields', async () => {
        await page.getByRole('combobox', { name: 'Salutation' }).click();
        await page.getByRole('option', { name: 'PT.' }).click();

        await page.getByRole('textbox', { name: 'Account Name' }).click();
        await page.getByRole('textbox', { name: 'Account Name' }).fill(data.tc002.accountName + ' ' + counter);

        await page.getByRole('combobox', { name: 'Account Source' }).click();
        await page.getByRole('option', { name: 'Indosat Vendor Data' }).click();

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
        await page.getByLabel('Pick a Year').selectOption('2040');
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: 'Next Month' }).dblclick();
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: '31' }).click();

        await page.getByRole('textbox', { name: 'ID Reference' }).click();
        await page.getByRole('textbox', { name: 'ID Reference' }).fill(data.tc002.idReference + counter.toString().padStart(4, '0'));

        await page.getByRole('textbox', { name: 'NPWP' }).click();
        await page.getByRole('textbox', { name: 'NPWP' }).fill(data.tc002.idReference + counter.toString().padStart(4, '0'));

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
        await page.getByRole('textbox', { name: 'Phone' }).fill(data.tc002.phone);

        await page.getByRole('textbox', { name: 'Email' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill('account.ca.' + counter + '@company.co.id');

        await page.getByRole('combobox', { name: 'Primary Contact' }).click();
        await page.getByRole('combobox', { name: 'Primary Contact' }).fill('test cont');
        await page.getByRole('option', { name: 'Test Contact TEST CREATE CA' }).click();

        await page.getByRole('option', { name: 'eMail' }).click();
        await page.getByRole('button', { name: 'Move selection to Chosen' }).click();

        // Expected: All required fields are populated and no validation errors appear
        await expect(page.getByRole('textbox', { name: 'Account Name' })).toHaveValue(data.tc002.accountName + ' ' + counter);
    });

    await test.step('TC007_S05 - Select the appropriate Level 1 Customer Account in the Parent Account field', async () => {
        await page.getByRole('combobox', { name: 'Parent Account' }).click();
        await page.getByRole('combobox', { name: 'Parent Account' }).fill(data.tc001.accountName + ' ' + counter);
        await page.getByRole('listbox', { name: 'Parent Account' })
        .getByRole('group', { name: 'Search Results' })
        .getByRole('option', { name: data.tc001.accountName + ' ' + counter })
        .click();

        // Expected: The Parent Account field displays the selected Level 1 CA
        await expect(page.getByRole('combobox', { name: 'Parent Account' })).toHaveValue(data.tc001.accountName.toUpperCase() + ' ' + counter);
    });

    await test.step('TC007_S06 - Click Save', async () => {
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await page.waitForURL('**/lightning/r/Account/**');

        // Expected: A new Customer Account record is successfully created and the record detail page is displayed
        await expect(page.locator('div').filter({ hasText: 'Info notification.It looks as' }).nth(3)).toBeVisible();
        await expect(page.getByText('We found 1 potential duplicate of this Account.View Duplicates', { exact: true })).toBeVisible();
    });
});
