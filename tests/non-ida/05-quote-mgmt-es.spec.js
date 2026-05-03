import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import dataAuth from "../../test-data/auth.json" assert { type: "json" };
import path from "path";
import { fileURLToPath } from "url";
import { getRuntimeState, getTestParams, setRuntimeState, closeDb } from "../../utils/db.js";
import quoteData from "../../test-data/non-ida-05-quote.json" assert { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let instanceUrl;
let accessToken;
let opportunityId;

const userDataDirectory = path.resolve(__dirname, '../../.sf-profile');
let context;
let page;
let testParams;

// runs only once before all tests in the file
test.beforeAll(async () => {
    opportunityId = await getRuntimeState('opportunityId');
    testParams = await getTestParams('quote_mgmt', 'tc_quote');
    console.log('Opportunity ID: '+opportunityId);

    context = await chromium.launchPersistentContext(userDataDirectory, {
        headless: false,
        args: ['--start-maximized'],
    });
    page = await context.newPage();

    await page.goto(dataAuth.enterpriseSolution.url);
    await page.getByRole('textbox', { name: 'Username' }).fill(dataAuth.enterpriseSolution.username);
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill(dataAuth.enterpriseSolution.password);
    await page.getByRole('button', { name: 'Log In to Sandbox' }).click();

    await page.waitForURL('**/lightning/**', { timeout: 60000 });
    await context.storageState({ path: '.sf-profile/sf-state.json' });
});

test.afterAll(async () => {
    await closeDb();
    if (context) await context.close();
});

/**
 * Updates the StageName field of an Opportunity via Salesforce REST API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} instanceUrl  - e.g. https://your-org.my.salesforce.com
 * @param {string} accessToken  - Bearer token from OAuth
 * @returns {Promise<void>} Resolves when the PATCH is successful
 */
async function patchMissingScoreCard(request, instanceUrl, accessToken) {
    const patchUrl = `${instanceUrl}/services/data/v65.0/sobjects/Opportunity/${opportunityId}`;
    const patchResponse = await request.patch(patchUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        data: { 
            CPQ_Partnership_Tier__c: 'Highest Partnership',
            CPQ_ES_Partnership_Tier__c: 'Highest Partnership',
            CPQ_Deal_Registered__c: 'Yes',
            CPQ_ES_Deal_Registered__c: 'Yes'
         },
    });

    // Salesforce returns 204 No Content on a successful PATCH
    console.log('Patch response: '+patchResponse);
    expect(patchResponse.status()).toBe(204);
}

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
    expect((loginResponse).ok()).toBeTruthy();


    const loginBody = await loginResponse.json();
    accessToken = loginBody.access_token;
    instanceUrl = loginBody.instance_url;

    console.log('Access token is: ', accessToken);

    console.log('Instance URL is: ', instanceUrl);

    await patchMissingScoreCard(request, instanceUrl, accessToken);
});

/**
 * Executes a Salesforce REST request and throws on HTTP errors or embedded
 * Vlocity error bodies (HTTP 200 with { "error": "..." }).
 * @returns {Promise<object|string>}
 */
async function sfRequest(request, method, url, { headers, data } = {}) {
    const opts = { headers };
    if (data !== undefined) opts.data = data;

    const response = await request[method](url, opts);

    let body;
    try {
        body = await response.json();
    } catch {
        body = await response.text();
    }

    if (!response.ok()) {
        const err = new Error(`HTTP ${response.status()} ${method.toUpperCase()} ${url}`);
        err.body = body;
        throw err;
    }

    // Some Vlocity endpoints return HTTP 200 with an embedded error
    if (body && typeof body === 'object') {
        const errField = body.error ?? body.errorCode;
        if (errField && !body.cartId && !body.records) {
            const err = new Error(`Salesforce error: ${errField} — ${body.message ?? ''}`);
            err.body = body;
            throw err;
        }
    }

    return body;
}

test('TC010: CPQ Enterprise Quote Flow — API', async ({ request }, testInfo) => {
    await allure.epic('Quote Management');
    await allure.feature('Enterprise Quote');

    await allure.story('Create an Enterprise Quote as ES Team');
    await allure.severity('normal');
    
    test.setTimeout(300_000);

    let cartId;
    let priceListId;
    let recordTypeId;

    // Reuse the accessToken / instanceUrl set by the preceding 'API Connection Test'
    const hdrs = () => ({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    });

    // ── STEP 1a — Look up EnterpriseQuote RecordType Id ──────────────────────
    await test.step('Step 1a: Look up EnterpriseQuote RecordType Id', async () => {
        const q = "SELECT+Id+FROM+RecordType+WHERE+DeveloperName='EnterpriseQuote'+AND+SobjectType='Quote'+LIMIT+1";
        let body;
        try {
            body = await sfRequest(request, 'get',
                `${instanceUrl}/services/data/v66.0/query?q=${q}`,
                { headers: hdrs() }
            );
        } catch (e) {
            await testInfo.attach('recordtype-error', { body: JSON.stringify(e.body ?? e.message), contentType: 'application/json' });
            throw e;
        }
        recordTypeId = body.records?.[0]?.Id ?? process.env.SF_RECORD_TYPE_ID;
        expect(recordTypeId, 'EnterpriseQuote RecordType not found; set SF_RECORD_TYPE_ID as fallback').toBeTruthy();
        console.log('RecordType Id:', recordTypeId);
    });

    // ── STEP 1b — Look up B2B Pricelist Id ───────────────────────────────────
    await test.step('Step 1b: Look up B2B Pricelist Id', async () => {
        const q = "SELECT+Id,Name+FROM+vlocity_cmt__PriceList__c+WHERE+vlocity_cmt__IsActive__c=true+AND+Name='B2B+Pricelist'+LIMIT+1";
        let body;
        try {
            body = await sfRequest(request, 'get',
                `${instanceUrl}/services/data/v66.0/query?q=${q}`,
                { headers: hdrs() }
            );
        } catch (e) {
            await testInfo.attach('pricelist-error', { body: JSON.stringify(e.body ?? e.message), contentType: 'application/json' });
            throw e;
        }
        priceListId = body.records?.[0]?.Id ?? process.env.SF_PRICE_LIST_ID;
        expect(priceListId, 'B2B Pricelist not found; set SF_PRICE_LIST_ID as fallback').toBeTruthy();
        console.log('PriceList Id:', priceListId);
    });

    // ── STEP 1 — Create Quote (cart) ──────────────────────────────────────────
    await test.step('Step 1: Create CPQ quote (cart)', async () => {
        let body;
        try {
            body = await sfRequest(request, 'post',
                `${instanceUrl}/services/apexrest/vlocity_cmt/v2/carts`,
                {
                    headers: hdrs(),
                    data: {
                        methodName: 'createCart',
                        objectType: 'Quote',
                        subaction: 'createQuote',
                        fields: 'Id,Name',
                        filters: 'Account.vlocity_cmt__Status__c:Inactive_Active_Pending',
                        inputFields: [
                            { OpportunityId: opportunityId },
                            { Name: `API Test Quote ${Date.now()}` },
                            { 'vlocity_cmt__PriceListId__c': priceListId },
                            { CurrencyIsoCode: 'IDR' },
                            { RecordTypeId: recordTypeId },
                        ],
                    },
                }
            );
        } catch (e) {
            await testInfo.attach('create-cart-error', { body: JSON.stringify(e.body ?? e.message), contentType: 'application/json' });
            throw e;
        }
        cartId = body.cartId
            ?? body.records?.[0]?.Id
            ?? body.Id
            ?? null;
        expect(cartId, 'cartId missing from createCart response').toBeTruthy();
        await setRuntimeState('cartId', cartId);
        console.log('Cart (Quote) Id:', cartId);
    });

    // ── STEP 2 — Fetch root products ──────────────────────────────────────────
    let productId;
    await test.step('Step 2: Fetch root products from B2B price list', async () => {
        let body;
        try {
            body = await sfRequest(request, 'get',
                `${instanceUrl}/services/apexrest/vlocity_cmt/v2/cpq/carts/${cartId}/products` +
                `?hierarchy=0&pagesize=200&includeAttachment=false&includeAttributes=true&priceListId=${priceListId}`,
                { headers: hdrs() }
            );
        } catch (e) {
            await testInfo.attach('fetch-products-error', { body: JSON.stringify(e.body ?? e.message), contentType: 'application/json' });
            throw e;
        }

        const records = body.records ?? [];
        expect(records.length, 'No products returned from B2B price list').toBeGreaterThan(0);

        // Prefer the product named in test data; fall back to first available
        const targetName = testParams.productName;
        const match = targetName
            ? records.find(p => (p.Product2?.Name ?? p.Name ?? '').includes(targetName))
            : null;

        const chosen = match ?? records[0];
        // "Id" may be a compound field object { "value": "01t...", "displayValue": null }
        productId = typeof chosen.Id === 'object' ? chosen.Id.value : chosen.Id;
        const chosenName = chosen.Product2?.Name ?? chosen.Name ?? productId;

        expect(productId, 'Could not resolve a product Id from the catalog').toBeTruthy();
        console.log(`Product selected: "${chosenName}" (${productId})`);
    });

    // ── STEP 3 — Add product to cart ──────────────────────────────────────────
    await test.step('Step 3: Add product to cart', async () => {
        let body;
        try {
            body = await sfRequest(request, 'post',
                `${instanceUrl}/services/apexrest/vlocity_cmt/v2/cpq/carts/${cartId}/items`,
                {
                    headers: hdrs(),
                    data: {
                        cartId,
                        price: true,
                        validate: true,
                        items: [{ itemId: productId, quantity: testParams.quantity }],
                    },
                }
            );
        } catch (e) {
            await testInfo.attach('add-items-error', { body: JSON.stringify(e.body ?? e.message), contentType: 'application/json' });
            throw e;
        }
        if (body?.jobId) {
            console.log(`Add-to-cart is async (jobId: ${body.jobId}); Step 4 will poll until items appear.`);
        }
    });

    // ── STEP 4 — Load cart items (verify) ────────────────────────────────────
    await test.step('Step 4: Load and verify cart line items', async () => {
        const deadline = Date.now() + 10_000;
        const pollInterval = 1_500;
        let records = [];

        while (Date.now() < deadline) {
            let body;
            try {
                body = await sfRequest(request, 'get',
                    `${instanceUrl}/services/apexrest/vlocity_cmt/v2/cpq/carts/${cartId}/items` +
                    `?includeAttachment=true&hierarchy=true`,
                    { headers: hdrs() }
                );
            } catch (e) {
                await testInfo.attach('load-items-error', { body: JSON.stringify(e.body ?? e.message), contentType: 'application/json' });
                throw e;
            }
            records = body.records ?? [];
            if (records.length > 0) break;
            await new Promise(r => setTimeout(r, pollInterval));
        }

        expect(records.length, 'Cart line items empty after polling — product may not have been added').toBeGreaterThan(0);

        const childCount = records.reduce((sum, r) => sum + (r.lineItems?.records?.length ?? 0), 0);
        console.log(`Cart: ${records.length} root line item(s), ${childCount} child item(s)`);
    });

    // ── STEP 5 — Recalculate / price the quote ────────────────────────────────
    await test.step('Step 5: Recalculate and price the quote', async () => {
        try {
            await sfRequest(request, 'get',
                `${instanceUrl}/services/apexrest/vlocity_cmt/v2/cpq/carts/${cartId}/price?price=true`,
                { headers: hdrs() }
            );
        } catch (e) {
            await testInfo.attach('price-error', { body: JSON.stringify(e.body ?? e.message), contentType: 'application/json' });
            throw e;
        }
        console.log('Pricing sync complete.');
    });

    // Verify Quote Line Items on Quote Record Page
    const quoteId = await getRuntimeState('cartId');
    expect(quoteId, 'cartId not found in runtime state — run TC010 first').toBeTruthy();

    const quoteUrl = `${dataAuth.enterpriseSolution.afterLoginUrl}lightning/r/Quote/${quoteId}/view`;
    await page.goto(quoteUrl);

    // Wait for the record page to load
    await page.waitForURL('**/lightning/r/Quote/**', { timeout: 30_000 });
    await expect(page.getByRole('tab', { name: 'Related' })).toBeVisible({ timeout: 15_000 });

    // Click the Related tab
    await page.getByRole('tab', { name: 'Related' }).click();
    await page.waitForTimeout(3000);

    // Wait for the Quote Line Items related list header to appear
    const qliLink = page.getByRole('link', { name: /Quote Line Items \(\d+\)/ });
    await expect(qliLink).toBeVisible({ timeout: 15_000 });

    // Extract the count from the link text, e.g. "Quote Line Items (3)" → 3
    const linkText = await qliLink.textContent();
    const match = linkText?.match(/\((\d+)\)/);
    const count = match ? parseInt(match[1], 10) : 0;

    console.log(`Quote Line Items count: ${count}`);
    expect(count, 'Expected at least 1 Quote Line Item').toBeGreaterThanOrEqual(1);
});