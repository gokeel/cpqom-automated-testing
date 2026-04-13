import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import data from "../../test-data/non-ida-account-mgmt.json" assert { type: "json" };
import { count } from "node:console";

const counter = data.counter;

test.only('test', async ({ page }) => {
  // Recording...
  await page.goto(data.login.url);
  await page.getByRole('textbox', { name: 'Username' }).fill(data.login.username);
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill(data.login.password);
  await page.getByRole('button', { name: 'Log In to Sandbox' }).click();
  await page.getByRole('link', { name: 'Accounts' }).click();
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByLabel('New Account').getByText('Customer Corporate Account').click();
  await page.getByRole('button', { name: 'Next' }).click();
  
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
  
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await page.waitForURL('**/lightning/r/Account/**');

  await expect(page.locator('div').filter({ hasText: 'Success notification.Account' }).nth(3)).toBeVisible();
  
//   Create a new Customer Account
  await page.getByRole('link', { name: 'Accounts' }).click();
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByLabel('New Account').getByText('Customer Account').click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('combobox', { name: 'Salutation' }).click();
  await page.getByRole('option', { name: 'PT.' }).click();
  
  await page.getByRole('textbox', { name: 'Account Name' }).click();
  await page.getByRole('textbox', { name: 'Account Name' }).fill(data.tc002.accountName + ' ' + counter);
  
  await page.getByRole('combobox', { name: 'Parent Account' }).click();
  await page.getByRole('combobox', { name: 'Parent Account' }).fill(data.tc001.accountName + ' ' + counter);
  await page.getByRole('option', { name: data.tc001.accountName.toUpperCase() + ' ' + counter, exact: true }).click();
  
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

  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await page.waitForURL('**/lightning/r/Account/**');

  await expect(page.locator('div').filter({ hasText: 'Success notification.Account' }).nth(3)).toBeVisible();
});