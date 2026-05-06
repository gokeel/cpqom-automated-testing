import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://b2b-io--cpqsitdelo.sandbox.my.salesforce.com/?ec=302&startURL=%2Fvisualforce%2Fsession%3Furl%3Dhttps%253A%252F%252Fb2b-io--cpqsitdelo.sandbox.lightning.force.com%252Flightning%252Fr%252FQuote%252F0Q0MR000001PW7N0AW%252Fview');
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).press('ControlOrMeta+v');
  await page.getByRole('textbox', { name: 'Username' }).fill('o.harliansyah@ioh.co.id.cpqsitdelo');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).press('ControlOrMeta+v');
  await page.getByRole('textbox', { name: 'Password' }).fill('QFbe3fqe1osXwA');
  await page.getByRole('button', { name: 'Log In to Sandbox' }).click();
  await page.goto('https://b2b-io--cpqsitdelo.sandbox.lightning.force.com/lightning/r/Quote/0Q0MR000001PW7N0AW/view');
  await page.getByRole('button', { name: 'Show more actions' }).click();
  await page.getByRole('menuitem', { name: 'Determine Approval Category' }).click();
  await page.getByRole('button', { name: 'Check Approver Line' }).click();
  await page.getByRole('button', { name: 'Cancel and close' }).click();
  await page.getByRole('button', { name: 'Show more actions' }).click();
  await page.getByRole('button', { name: 'Edit Sub Status' }).click();
  await page.getByRole('combobox', { name: 'Sub Status' }).click();
  await page.getByRole('option', { name: 'Business Case' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Submit for Approval' }).click();
  await page.getByRole('textbox', { name: 'Comments' }).click();
  await page.getByRole('textbox', { name: 'Comments' }).fill('please approve');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('button', { name: 'Cancel and close' }).click();
  await page.locator('.slds-grid.slds-page-header__detail-row').click();
  await page.getByRole('button', { name: 'Submit for Approval' }).click();
  await page.getByRole('textbox', { name: 'Comments' }).click();
  await page.getByRole('textbox', { name: 'Comments' }).fill('please approve');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('div').filter({ hasText: 'Success notification.Quote' }).nth(3)).toBeVisible();
  await page.getByRole('button', { name: 'Notifications' }).click();
  await page.getByRole('link', { name: 'OCKY HARLIANSYAH is' }).click();
  await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reassign' })).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('textbox', { name: 'Comments' }).click();
  await page.getByRole('textbox', { name: 'Comments' }).fill('approve');
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('Approved')).toBeVisible();
  await page.locator('#brandBand_2').getByRole('link', { name: 'API Test Quote' }).click();
  await page.getByTitle('Closed').click();
  await page.getByRole('button', { name: 'Show more actions' }).click();
  await page.getByRole('menuitem', { name: 'Close Stage' }).click();
  await page.getByRole('combobox', { name: 'Sub Status' }).click();
  await page.getByRole('option', { name: 'Closed/Win' }).click();
  await page.getByRole('combobox', { name: 'Select Document Type' }).click();
  await page.getByRole('option', { name: 'MLD' }).click();
  await page.getByText('Upload Files').click();
  await page.getByRole('button', { name: 'Select a file Upload Files Or' }).setInputFiles([]);
  await page.getByRole('button', { name: 'Select a file Upload Files Or' }).setInputFiles('chat_transcript.pdf');
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(page.locator('div').filter({ hasText: 'Success notification.' }).nth(3)).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('div').filter({ hasText: 'Success notification.' }).nth(3)).toBeVisible();
  await page.getByTitle('Related').click();


  await page.getByRole('button', { name: 'Notifications' }).click();
  await page.getByRole('link', { name: 'Approval request for the quote is approved API Test Quote 1777884395789 8' }).click();


  await page.getByRole('link', { name: 'API Test Quote 1777890904595' }).click();
  await page.getByRole('button', { name: 'Edit Sub Status' }).click();
  await page.getByRole('combobox', { name: 'Sub Status' }).click();
  await page.getByRole('option', { name: 'Business Case' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.locator('.windowViewMode-normal > .oneRecordHomeFlexipage2Wrapper > .recordHomeFlexipage2 > one-record-home-flexipage2 > .forcegenerated-flexipage-module > record_flexipage-desktop-record-page-decorator > .forcegenerated-flexipage-template > flexipage-component2 > records-lwc-highlights-panel > records-lwc-record-layout > .forcegenerated-record-layout2 > records-highlights2 > .highlights > .secondaryFields > .slds-grid').click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('button', { name: 'Notifications' }).click();
  await page.getByRole('link', { name: 'OCKY HARLIANSYAH is' }).click();


  await page.getByRole('button', { name: 'View profile' }).click();
  await page.getByRole('button', { name: 'View profile' }).click();
});