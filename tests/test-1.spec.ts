import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://b2b-io--cpqpro.sandbox.my.salesforce.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('https://b2b-io--cpqpro.sandbox.my.salesforce.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('QFbe3fqe1osXwA');
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Username' }).fill('');
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('o.harliansyah@ioh.co.id.cpqpro');
  await page.getByRole('button', { name: 'Log In to Sandbox' }).click();
  await page.goto('https://b2b-io--cpqpro.sandbox.lightning.force.com/lightning/page/home');
  await page.getByRole('link', { name: 'Leads' }).click();
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('combobox', { name: 'New requirements?' }).click();
  await page.locator('span').filter({ hasText: 'Yes' }).first().click();
  await page.getByRole('combobox', { name: 'Is he an existing customer?' }).click();
  await page.getByRole('option', { name: 'Yes' }).click();
  await page.getByRole('combobox', { name: 'New requirements?' }).click();
  await page.getByRole('option', { name: 'Yes' }).click();
});