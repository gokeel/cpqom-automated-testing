import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";

let counter = 10;

test('Lead Management', async ({ page }) => {
    await allure.epic('Lead Management');
    await allure.feature('Manage My Leads');

    await allure.story('View All My Leads');
    await allure.severity('normal');
    await allure.label('pre-requisite', '1.1 User has logged into Salesforce as Sales profile');

    await test.step('S01 - Open Leads list view', async () => {
        await page.goto('https://b2b-io--cpqpro.sandbox.my.salesforce.com/');
        await page.getByRole('textbox', { name: 'Username' }).fill('o.harliansyah@ioh.co.id.cpqpro');
        await page.getByRole('textbox', { name: 'Password' }).click();
        await page.getByRole('textbox', { name: 'Password' }).fill('QFbe3fqe1osXwA');
        await page.getByRole('button', { name: 'Log In to Sandbox' }).click();
        await page.getByRole('link', { name: 'Leads' }).click();

        // Expected: Leads list view is displayed
        await expect(page.getByRole('button', { name: 'Select a List View: Leads' })).toBeVisible();
    });

    await test.step('S02 - Select All my Leads', async () => {
        await page.getByRole('button', { name: 'Select a List View: Leads' }).click();
        await page.getByText('All my Lead').click();

        // Expected: All leads owned by the user displayed with Project Name and Created By fields
        await expect(page.getByText('All my Lead')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sort by: Project Name' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sort by: Created By Alias' })).toBeVisible();
        await expect(page.getByLabel('Project Name', { exact: true }).locator('lightning-primitive-header-factory')).toContainText('Project Name');
        await expect(page.getByLabel('Created By Alias', { exact: true })).toContainText('Created By Alias');
    });


    await allure.story('Create New Lead');
    await allure.severity('critical');

    await test.step('S02 - Click the New button', async () => {
        await page.getByRole('button', { name: 'New' }).click();

        // Expected: Create new lead screen is displayed
        await expect(page.getByRole('heading', { name: 'New Lead' })).toBeVisible();
    });

    await test.step('S03 - Fill all mandatory fields', async () => {
        await page.getByRole('combobox', { name: 'Account Name' }).click();
        await page.getByRole('combobox', { name: 'Account Name' }).fill('petromas pertiwi');
        await page.getByRole('option', { name: 'PETROMAS PERTIWI-LA CUST' }).click();

        await page.getByRole('textbox', { name: 'Opportunity RFS Date' }).click();
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: 'Next Month' }).click();
        await page.getByRole('button', { name: '30' }).click();

        await page.getByRole('textbox', { name: 'Project Name' }).click();
        await page.getByRole('textbox', { name: 'Project Name' }).fill(`Mantap bos ${counter}`);

        await page.getByRole('textbox', { name: 'Company' }).click();
        await page.getByRole('textbox', { name: 'Company' }).fill(`Pertamax Bos ${counter}`);

        await page.getByRole('combobox', { name: 'Lead Source' }).click();
        await page.getByRole('option', { name: 'Indosat Vendor Data' }).click();

        await page.getByRole('textbox', { name: 'Description' }).click();
        await page.getByRole('textbox', { name: 'Description' }).fill('Created by Automation Testing');

        await page.getByRole('combobox', { name: 'Lead Currency' }).click();
        await page.getByText('IDR - Indonesian Rupiah').click();

        await page.getByRole('combobox', { name: 'Primary Contact' }).click();
        await page.getByRole('combobox', { name: 'Primary Contact' }).fill('test contact');
        await page.getByRole('option', { name: 'Test Contact TEST CREATE CA' }).click();

        await page.getByRole('textbox', { name: 'Last Name' }).click();
        await page.getByRole('textbox', { name: 'Last Name' }).fill(`Agus ${counter}`);

        await page.getByRole('textbox', { name: 'Mobile' }).click();
        await page.getByRole('textbox', { name: 'Mobile' }).fill(`08174563789${counter}`);

        await page.getByRole('combobox', { name: 'Type of Product' }).click();
        await page.getByText('Connectivity').click();

        await page.getByRole('combobox', { name: 'Function' }).click();
        await page.locator('span').filter({ hasText: /^IT$/ }).first().click();

        await page.getByRole('combobox', { name: 'Budget Status?' }).click();
        await page.getByText('Budget available').click();

        await page.getByRole('combobox', { name: 'Role of Lead (Seniority)' }).click();
        await page.getByText('Enterprise (Director / Vice').click();

        await page.getByRole('combobox', { name: 'What is the timeframe of' }).click();
        await page.getByText('-3 Months').click();

        await page.getByRole('combobox', { name: 'New requirements?' }).click();
        await page.getByRole('option', { name: 'Yes' }).nth(0).click();

        await page.getByRole('combobox', { name: 'Is he an existing customer?' }).click();
        await page.getByRole('option', { name: 'Yes' }).nth(0).click();

        await page.getByRole('combobox', { name: 'Lead Type' }).click();
        await page.getByTitle('Customer/End User').click();

        // Expected: All mandatory fields are filled
        await expect(page.getByRole('textbox', { name: 'Project Name' })).toHaveValue(`Mantap bos ${counter}`);
    });

    await test.step('S04 - Click Save', async () => {
        await page.getByRole('button', { name: 'Save' }).click();
        await page.waitForURL('**/lightning/r/Lead/**');

        // Expected: Lead created successfully, status is New, lead owner is current user
        await expect(page.locator('div').filter({ hasText: 'Success notification.Lead "Mr' }).nth(3)).toBeVisible({ timeout: 10000 });
        await expect(page.locator('records-record-layout-item[field-label="Project Name"]')).toBeVisible();
        await expect(page.locator('records-record-layout-block')).toContainText(`Mantap bos ${counter}`);
        await expect(page.locator('lightning-formatted-text').filter({ hasText: `Mantap bos ${counter}` })).toBeVisible();
        await expect(page.locator('.slds-form-element.slds-hint-parent.test-id__output-root > .slds-form-element__control').first()).toBeVisible();
        await expect(page.locator('force-owner-lookup')).toBeVisible();
        await expect(page.locator('force-owner-lookup')).toContainText('OCKY HARLIANSYAH');
        await expect(page.getByRole('tabpanel', { name: 'Details' }).getByText('Lead Status', { exact: true })).toBeVisible();
        await expect(page.locator('lightning-formatted-text').filter({ hasText: 'New' })).toContainText('New');
    });
});

// test('TC002_New Lead', async ({ page }) => {
//     await allure.epic('Lead Management');
//     await allure.feature('Manage My Leads');
//     await allure.story('Create New Lead');
//     await allure.severity('critical');
//     await allure.label('pre-requisite', '1.1 User has logged into Salesforce as Sales profile');

//     // await test.step('S01 - In Salesforce, open Leads', async () => {
//     //     await page.goto('https://b2b-io--cpqpro.sandbox.lightning.force.com/lightning/o/Lead/list?filterName=__Recent');

//     //     // Expected: Leads list view is displayed
//     //     await expect(page.getByRole('button', { name: 'Select a List View: Leads' })).toBeVisible();
//     // });

    
// });
