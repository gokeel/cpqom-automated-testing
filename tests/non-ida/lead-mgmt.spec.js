const {test, expect} = require('@playwright/test');

let counter = 6;

test('TC001_All My Leads', async ({page}) => {
    await page.goto('https://b2b-io--cpqpro.sandbox.my.salesforce.com/');
    await page.getByRole('textbox', { name: 'Username' }).fill('o.harliansyah@ioh.co.id.cpqpro');
    await page.getByRole('textbox', { name: 'Password' }).click();

    await page.getByRole('textbox', { name: 'Password' }).fill('QFbe3fqe1osXwA');

    await page.getByRole('button', { name: 'Log In to Sandbox' }).click();

    await page.getByRole('link', { name: 'Leads' }).click();
    await page.getByRole('button', { name: 'Select a List View: Leads' }).click();
    await page.getByText('All my Lead').click();
    await expect(page.getByText('All my Lead')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sort by: Project Name' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sort by: Created By Alias' })).toBeVisible();
    await expect(page.getByLabel('Project Name', { exact: true }).locator('lightning-primitive-header-factory')).toContainText('Project Name');
    await expect(page.getByLabel('Created By Alias', { exact: true })).toContainText('Created By Alias');
});

test.only('TC002_New Lead', async ({page}) => {
    await page.goto('https://b2b-io--cpqpro.sandbox.my.salesforce.com/');
    await page.getByRole('textbox', { name: 'Username' }).fill('o.harliansyah@ioh.co.id.cpqpro');
    await page.getByRole('textbox', { name: 'Password' }).click();

    await page.getByRole('textbox', { name: 'Password' }).fill('QFbe3fqe1osXwA');
    
    await page.getByRole('button', { name: 'Log In to Sandbox' }).click();
    await page.getByRole('link', { name: 'Leads' }).click();
    await page.getByRole('button', { name: 'New' }).click();

    await page.getByRole('combobox', { name: 'Account Name' }).click();
    await page.getByRole('combobox', { name: 'Account Name' }).fill('petromas pertiwi');
    await page.getByRole('option', { name: 'PETROMAS PERTIWI-LA CUST' }).click();

    // await page.locator('#combobox-input-547-2-547 > .slds-media__body > .slds-listbox__option-text > span').click();
    await page.getByRole('textbox', { name: 'Opportunity RFS Date' }).click();
    await page.getByRole('button', { name: 'Next Month' }).click();
    await page.getByRole('button', { name: 'Next Month' }).click();
    await page.getByRole('button', { name: '30' }).click();
    
    await page.getByRole('textbox', { name: 'Project Name' }).click();
    await page.getByRole('textbox', { name: 'Project Name' }).fill(`Mantap bos ${counter}`);

    await page.getByRole('textbox', { name: 'Company' }).click();
    await page.getByRole('textbox', { name: 'Company' }).fill(`Pertamax Bos ${counter}`);
    
    await page.getByRole('combobox', { name: 'Lead Source' }).click();
    await page.getByText('Indosat Vendor Data').click();
    
    await page.getByRole('textbox', { name: 'Description' }).click();
    await page.getByRole('textbox', { name: 'Description' }).fill('Created by Automation Testing');
    await page.getByRole('combobox', { name: 'Lead Currency' }).click();
    await page.getByText('IDR - Indonesian Rupiah').click();
    
    // await page.getByRole('combobox', { name: 'Primary Contact' }).click();
    // await page.getByRole('combobox', { name: 'Primary Contact' }).fill('test contact');
    // await page.locator('lightning-base-combobox-formatted-text').filter({ hasText: 'Test Contact' }).click();
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
    // await page.getByText('Yes').click();
    await page.getByRole('option', { name: 'Yes' }).nth(0).click();
    
    await page.getByRole('combobox', { name: 'Is he an existing customer?' }).click();
    await page.getByRole('option', { name: 'Yes' }).nth(0).click();
    
    await page.getByRole('combobox', { name: 'Lead Type' }).click();
    await page.getByTitle('Customer/End User').click();
    
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/lightning/r/Lead/**');

    await expect(page.locator('div').filter({ hasText: 'Success notification.Lead "Mr' }).nth(3)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#tab-10').getByText('Project Name', { exact: true })).toBeVisible();
    await expect(page.locator('records-record-layout-block')).toContainText(`Mantap bos ${counter}`);
    await expect(page.locator('lightning-formatted-text').filter({ hasText: `Mantap bos ${counter}` })).toBeVisible();
    await expect(page.locator('.slds-form-element.slds-hint-parent.test-id__output-root > .slds-form-element__control').first()).toBeVisible();
    
    await expect(page.locator('force-owner-lookup')).toBeVisible();
    // await page.goto('https://b2b-io--cpqpro.sandbox.lightning.force.com/lightning/r/Lead/00QMS0000097uec2AA/view');
    await expect(page.locator('force-owner-lookup')).toContainText('OCKY HARLIANSYAH');

    await expect(page.getByRole('tabpanel', { name: 'Details' }).getByText('Lead Status', { exact: true })).toBeVisible();
    await expect(page.locator('lightning-formatted-text').filter({ hasText: 'New' })).toContainText('New');
});