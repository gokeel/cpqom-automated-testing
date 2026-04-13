import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import data from "../../test-data/lead-mgmt.json" assert { type: "json" };

const counter = data.counter;

test('Lead Management', async ({ page }) => {
    await allure.epic('Lead Management');
    await allure.feature('Manage My Leads');

    await allure.story('View All My Leads');
    await allure.severity('normal');
    await allure.label('pre-requisite', '1.1 User has logged into Salesforce as Sales profile');

    await test.step('TC001_S01 - Open Leads list view', async () => {
        await page.goto(data.login.url);
        await page.getByRole('textbox', { name: 'Username' }).fill(data.login.username);
        await page.getByRole('textbox', { name: 'Password' }).click();
        await page.getByRole('textbox', { name: 'Password' }).fill(data.login.password);
        await page.getByRole('button', { name: 'Log In to Sandbox' }).click();
        await page.getByRole('link', { name: 'Leads' }).click();

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


    await allure.story('Create New Lead');
    await allure.severity('critical');

    await test.step('TC002_S01 - Click the New button', async () => {
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
});
