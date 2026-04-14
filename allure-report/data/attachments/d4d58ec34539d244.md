# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: non-ida/account-mgmt.spec.js >> TC007_Check Duplicate CA Creation with Same Parent Account
- Location: tests/non-ida/account-mgmt.spec.js:287:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div').filter({ hasText: 'Info notification.It looks as' }).nth(3)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('div').filter({ hasText: 'Info notification.It looks as' }).nth(3)

```

# Test source

```ts
  314 |     });
  315 | 
  316 |     await test.step('TC007_S04 - Fill in all mandatory fields', async () => {
  317 |         await page.getByRole('combobox', { name: 'Salutation' }).click();
  318 |         await page.getByRole('option', { name: 'PT.' }).click();
  319 | 
  320 |         await page.getByRole('textbox', { name: 'Account Name' }).click();
  321 |         await page.getByRole('textbox', { name: 'Account Name' }).fill(data.tc002.accountName + ' ' + counter);
  322 | 
  323 |         await page.getByRole('combobox', { name: 'Account Source' }).click();
  324 |         await page.getByRole('option', { name: 'Indosat Vendor Data' }).click();
  325 | 
  326 |         await page.getByRole('combobox', { name: 'Account Status' }).click();
  327 |         await page.getByRole('option', { name: 'New' }).click();
  328 | 
  329 |         await page.getByRole('textbox', { name: 'Company Street' }).click();
  330 |         await page.getByRole('textbox', { name: 'Company Street' }).fill('Jalan Merdeka Barat');
  331 | 
  332 |         await page.getByRole('textbox', { name: 'Company City' }).click();
  333 |         await page.getByRole('textbox', { name: 'Company City' }).fill('Jakarta Pusat');
  334 | 
  335 |         await page.getByRole('textbox', { name: 'Company State/Province' }).click();
  336 |         await page.getByRole('textbox', { name: 'Company State/Province' }).fill('DKI Jakarta');
  337 | 
  338 |         await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).click();
  339 |         await page.getByRole('textbox', { name: 'Company Zip/Postal Code' }).fill('10110');
  340 | 
  341 |         await page.getByRole('textbox', { name: 'Company Country' }).click();
  342 |         await page.getByRole('textbox', { name: 'Company Country' }).fill('Indonesia');
  343 | 
  344 |         await page.getByRole('combobox', { name: 'Type', exact: true }).click();
  345 |         await page.getByRole('option', { name: 'Corporate', exact: true }).click();
  346 | 
  347 |         await page.getByRole('combobox', { name: 'ID Type' }).click();
  348 |         await page.getByRole('option', { name: 'SIUP' }).click();
  349 | 
  350 |         await page.getByLabel('*Date').click();
  351 |         await page.getByLabel('Pick a Year').selectOption('2040');
  352 |         await page.getByRole('button', { name: 'Next Month' }).click();
  353 |         await page.getByRole('button', { name: 'Next Month' }).dblclick();
  354 |         await page.getByRole('button', { name: 'Next Month' }).click();
  355 |         await page.getByRole('button', { name: 'Next Month' }).click();
  356 |         await page.getByRole('button', { name: 'Next Month' }).click();
  357 |         await page.getByRole('button', { name: '31' }).click();
  358 | 
  359 |         await page.getByRole('textbox', { name: 'ID Reference' }).click();
  360 |         await page.getByRole('textbox', { name: 'ID Reference' }).fill(data.tc002.idReference + counter.toString().padStart(4, '0'));
  361 | 
  362 |         await page.getByRole('textbox', { name: 'NPWP' }).click();
  363 |         await page.getByRole('textbox', { name: 'NPWP' }).fill(data.tc002.idReference + counter.toString().padStart(4, '0'));
  364 | 
  365 |         await page.getByRole('combobox', { name: 'Line Of Business', exact: true }).click();
  366 |         await page.getByRole('option', { name: 'Communications & Technologies' }).click();
  367 | 
  368 |         await page.getByRole('combobox', { name: 'Sub Line of Business' }).click();
  369 |         await page.getByRole('option', { name: 'Content Provider' }).click();
  370 | 
  371 |         await page.getByRole('combobox', { name: 'Customer Segment' }).click();
  372 |         await page.getByRole('option', { name: 'Large Enterprise' }).click();
  373 | 
  374 |         await page.getByRole('combobox', { name: 'Corporate Scale' }).click();
  375 |         await page.getByRole('option', { name: 'Multinational Company' }).click();
  376 | 
  377 |         await page.getByRole('textbox', { name: 'Main Contact Area Code' }).click();
  378 |         await page.getByRole('textbox', { name: 'Main Contact Area Code' }).fill('021');
  379 | 
  380 |         await page.getByRole('textbox', { name: 'Phone' }).click();
  381 |         await page.getByRole('textbox', { name: 'Phone' }).fill(data.tc002.phone);
  382 | 
  383 |         await page.getByRole('textbox', { name: 'Email' }).click();
  384 |         await page.getByRole('textbox', { name: 'Email' }).fill('account.ca.' + counter + '@company.co.id');
  385 | 
  386 |         await page.getByRole('combobox', { name: 'Primary Contact' }).click();
  387 |         await page.getByRole('combobox', { name: 'Primary Contact' }).fill('test cont');
  388 |         await page.getByRole('option', { name: 'Test Contact TEST CREATE CA' }).click();
  389 | 
  390 |         await page.getByRole('option', { name: 'eMail' }).click();
  391 |         await page.getByRole('button', { name: 'Move selection to Chosen' }).click();
  392 | 
  393 |         // Expected: All required fields are populated and no validation errors appear
  394 |         await expect(page.getByRole('textbox', { name: 'Account Name' })).toHaveValue(data.tc002.accountName + ' ' + counter);
  395 |     });
  396 | 
  397 |     await test.step('TC007_S05 - Select the appropriate Level 1 Customer Account in the Parent Account field', async () => {
  398 |         await page.getByRole('combobox', { name: 'Parent Account' }).click();
  399 |         await page.getByRole('combobox', { name: 'Parent Account' }).fill(data.tc001.accountName + ' ' + counter);
  400 |         await page.getByRole('listbox', { name: 'Parent Account' })
  401 |         .getByRole('group', { name: 'Search Results' })
  402 |         .getByRole('option', { name: data.tc001.accountName + ' ' + counter })
  403 |         .click();
  404 | 
  405 |         // Expected: The Parent Account field displays the selected Level 1 CA
  406 |         await expect(page.getByRole('combobox', { name: 'Parent Account' })).toHaveValue(data.tc001.accountName.toUpperCase() + ' ' + counter);
  407 |     });
  408 | 
  409 |     await test.step('TC007_S06 - Click Save', async () => {
  410 |         await page.getByRole('button', { name: 'Save', exact: true }).click();
  411 |         await page.waitForURL('**/lightning/r/Account/**');
  412 | 
  413 |         // Expected: A new Customer Account record is successfully created and the record detail page is displayed
> 414 |         await expect(page.locator('div').filter({ hasText: 'Info notification.It looks as' }).nth(3)).toBeVisible();
      |                                                                                                       ^ Error: expect(locator).toBeVisible() failed
  415 |         await expect(page.getByText('We found 1 potential duplicate of this Account.View Duplicates', { exact: true })).toBeVisible();
  416 |     });
  417 | });
  418 | 
```