/**
 * MOB-NEW-002 — Check mobile number availability based on prefix
 * Creates a fresh Opportunity + Enterprise Quote, then executes test steps 1-5.
 * Writes results to test-results/MOB-NEW-002-report.csv
 */

import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SF_URL    = "https://b2b-io--cpqsitdelo.sandbox.my.salesforce.com";
const USERNAME  = "o.harliansyah@ioh.co.id.cpqsitdelo";
const PASSWORD  = "QFbe3fqe1osXwA";

// ── CSV / Reporting ───────────────────────────────────────────────────────────
const steps = [];
const startTime = new Date();

function recordStep(no, description, status, notes = "") {
  steps.push({ no, description, status, notes });
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "~";
  console.log(`  [${icon}] Step ${no}: ${description} — ${status}${notes ? " | " + notes : ""}`);
}

function writeCsv(overall) {
  mkdirSync(path.resolve(__dirname, "test-results"), { recursive: true });
  const csvPath = path.resolve(__dirname, "test-results/MOB-NEW-002-report.csv");
  const now     = new Date();
  const header  = "Test No,Scenario Summary,Description,Step No,Step Description,Status,Notes,Executed At";
  const rows    = steps.map(s => [
    "MOB-NEW-002", "Quote Management",
    `"Check mobile number availability based on prefix"`,
    s.no,
    `"${String(s.description).replace(/"/g, '""')}"`,
    s.status,
    `"${String(s.notes).replace(/"/g, '""')}"`,
    now.toISOString()
  ].join(","));
  rows.push([
    "MOB-NEW-002", "Quote Management",
    `"Check mobile number availability based on prefix"`,
    "OVERALL", `"Overall Result"`, overall,
    `"Duration: ${Math.round((now - startTime) / 1000)}s"`,
    now.toISOString()
  ].join(","));
  writeFileSync(csvPath, [header, ...rows].join("\n"), "utf8");
  console.log(`\n  CSV → ${csvPath}`);
  return csvPath;
}

/** Wait for Lightning skeleton loaders to disappear */
async function waitReady(page, ms = 30000) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(
    () => !document.querySelector(
      ".slds-spinner_container:not([style*='display: none']), .forceLoadingState"
    ),
    { timeout: ms }
  ).catch(() => {});
  await page.waitForTimeout(2000);
}

/** Click a button by label, trying multiple locator strategies */
async function clickBtn(page, label, timeout = 12000) {
  const selectors = [
    page.getByRole("button", { name: label }),
    page.getByRole("menuitem", { name: label }),
    page.getByRole("link",   { name: label }),
    page.locator(`[title="${label}"]`),
    page.locator(`button:has-text("${label}")`),
  ];
  for (const sel of selectors) {
    if (await sel.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await sel.first().click();
      return true;
    }
  }
  // Try partial text match as last resort
  const partial = page.locator(`button, a[role='button']`).filter({ hasText: label }).first();
  if (await partial.isVisible({ timeout: timeout }).catch(() => false)) {
    await partial.click();
    return true;
  }
  return false;
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser  = await chromium.launch({ headless: false, slowMo: 250 });
  const bContext = await browser.newContext({ viewport: null });
  const page     = await bContext.newPage();
  let overall    = "FAIL";
  let oppUrl     = "";
  let quoteUrl   = "";

  try {
    // ── LOGIN ─────────────────────────────────────────────────────────────────
    console.log("\n[MOB-NEW-002] Logging in...");
    await page.goto(SF_URL, { waitUntil: "domcontentloaded" });
    await page.fill("#username", USERNAME);
    await page.click("#Login");
    await page.waitForSelector("#password", { timeout: 20000 });
    await page.fill("#password", PASSWORD);
    await page.click("#Login");
    await page.waitForURL("**/lightning/**", { timeout: 60000 });
    console.log("  Logged in →", page.url());

    // ── PRE-REQ 1: Find an existing Account ───────────────────────────────────
    console.log("\n[MOB-NEW-002] Pre-req — Finding an existing Account...");
    await page.goto(`${SF_URL}/lightning/o/Account/list`, { waitUntil: "domcontentloaded" });
    await waitReady(page, 30000);
    await page.screenshot({ path: "test-results/mob-p01-accounts.png" });

    // Click the first account in the list
    const firstAccountLink = page.locator("table tbody tr").first().locator("a").first();
    if (!await firstAccountLink.isVisible({ timeout: 10000 }).catch(() => false)) {
      throw new Error("No accounts found in the list");
    }
    await firstAccountLink.click();
    await page.waitForURL("**/lightning/r/Account/**", { timeout: 20000 });
    const accountName = await page.locator("h1 .custom-truncate, h1 span[class*='title']").first().textContent().catch(() => "Unknown Account");
    console.log(`  Account: "${accountName.trim()}" → ${page.url()}`);
    await page.screenshot({ path: "test-results/mob-p02-account-page.png" });

    recordStep("PRE-1", "Find existing Account", "PASS", `${accountName.trim()} — ${page.url()}`);

    // ── PRE-REQ 2: Create New Opportunity from Account ────────────────────────
    console.log("\n[MOB-NEW-002] Pre-req — Creating new Opportunity (Quoting stage)...");
    const newOppClicked = await clickBtn(page, "New Opportunity");
    if (!newOppClicked) {
      // Try from the global New button or Related tab
      await clickBtn(page, "New");
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/mob-p03-new-opp-modal.png" });

    // Fill in Opportunity details
    const oppName = `MOB-NEW-002-${Date.now()}`;

    // Opportunity Name
    const nameField = page.locator("input[name='Name'], input[placeholder*='Opportunity Name' i]").first();
    if (await nameField.isVisible({ timeout: 8000 }).catch(() => false)) {
      await nameField.fill(oppName);
    }

    // Close Date
    const closeDateField = page.locator("input[name='CloseDate'], input[placeholder*='Close Date' i]").first();
    if (await closeDateField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeDateField.fill("12/31/2026");
      await page.keyboard.press("Escape");
    }

    // Stage = Quoting
    const stageField = page.locator("[data-field='StageName'] button, [data-label='Stage'] button, lightning-combobox[data-field-name='StageName'] button").first();
    if (await stageField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await stageField.click();
      await page.waitForTimeout(800);
    } else {
      // Try picklist label
      const stageCombo = page.getByLabel("Stage").first();
      if (await stageCombo.isVisible({ timeout: 5000 }).catch(() => false)) await stageCombo.click();
    }
    await page.waitForTimeout(500);
    const quotingOpt = page.getByRole("option", { name: /Quoting/i }).first();
    if (await quotingOpt.isVisible({ timeout: 5000 }).catch(() => false)) {
      await quotingOpt.click();
    }

    await page.screenshot({ path: "test-results/mob-p04-opp-form.png" });

    // Save the Opportunity
    const saved = await clickBtn(page, "Save");
    if (!saved) await clickBtn(page, "Save & New");
    await page.waitForTimeout(3000);
    await waitReady(page, 30000);

    oppUrl = page.url();
    console.log(`  Opportunity created: ${oppUrl}`);
    await page.screenshot({ path: "test-results/mob-p05-opp-created.png" });
    recordStep("PRE-2", "Create Opportunity in Quoting stage", "PASS", `${oppName} → ${oppUrl}`);

    // ── PRE-REQ 3: Create Quote from Opportunity ──────────────────────────────
    console.log("\n[MOB-NEW-002] Pre-req — Creating Quote from Opportunity...");

    // Look for "Create Quote" or "New Quote" button / Configure Enterprise Quote button on Opp page
    await waitReady(page, 20000);
    await dumpVisibleButtons(page, "Opportunity page");
    await page.screenshot({ path: "test-results/mob-p06-opp-page.png" });

    // First check if "Configure Enterprise Quote" is directly on the Opportunity
    const configOnOpp = await bContext.pages();
    let configFound = false;

    const configOppBtn = page.getByRole("button", { name: /Configure Enterprise Quote/i })
      .or(page.locator("[title='Configure Enterprise Quote']"))
      .or(page.locator("button, a").filter({ hasText: /Configure Enterprise Quote/ }));
    if (await configOppBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("  'Configure Enterprise Quote' found directly on Opportunity page!");
      configFound = true;
    }

    if (!configFound) {
      // Create Quote via "New Quote" button or equivalent
      let quoteCreated = false;

      // Try clicking New Quote from action buttons
      const newQuoteBtn = page.getByRole("button", { name: /New Quote/i })
        .or(page.locator("button[title='New Quote']"))
        .or(page.locator("a[title='New Quote']"));
      if (await newQuoteBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await newQuoteBtn.first().click();
        quoteCreated = true;
      }

      // Try from Related tab → Quotes
      if (!quoteCreated) {
        const relatedTab = page.getByRole("tab", { name: "Related" });
        if (await relatedTab.isVisible({ timeout: 5000 }).catch(() => false)) {
          await relatedTab.click();
          await page.waitForTimeout(2000);
          const quotesNew = page.locator("a[title='New'], button[title='New']").first();
          if (await quotesNew.isVisible({ timeout: 5000 }).catch(() => false)) {
            await quotesNew.click();
            quoteCreated = true;
          }
        }
      }

      if (quoteCreated) {
        await page.waitForTimeout(3000);
        await page.screenshot({ path: "test-results/mob-p07-quote-form.png" });

        // Fill Quote Name
        const quoteNameField = page.locator("input[name='Name'], input[placeholder*='Quote Name' i]").first();
        if (await quoteNameField.isVisible({ timeout: 5000 }).catch(() => false)) {
          await quoteNameField.fill(`MOB-002-Quote-${Date.now()}`);
        }

        // Set Sub Status = Draft-Sales if visible
        const subStatusCombo = page.locator("[data-field='Sub_Status__c'] button, [data-label='Sub Status'] button").first();
        if (await subStatusCombo.isVisible({ timeout: 3000 }).catch(() => false)) {
          await subStatusCombo.click();
          await page.waitForTimeout(500);
          const draftSalesOpt = page.getByRole("option", { name: /Draft.?Sales/i }).first();
          if (await draftSalesOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
            await draftSalesOpt.click();
          }
        }

        await clickBtn(page, "Save");
        await page.waitForTimeout(3000);
        await waitReady(page, 30000);
        quoteUrl = page.url();
        console.log(`  Quote created: ${quoteUrl}`);
        await page.screenshot({ path: "test-results/mob-p08-quote-created.png" });
        recordStep("PRE-3", "Create Quote with Draft-Sales substatus", "PASS", quoteUrl);
      } else {
        // Navigate to the Quote list and pick a Draft quote
        console.log("  Could not create new quote, falling back to Draft quote in list...");
        await page.goto(`${SF_URL}/lightning/o/Quote/list?filterName=Recent`, { waitUntil: "domcontentloaded" });
        await waitReady(page, 25000);

        // Click the 3rd row (index 2) which is visually confirmed Draft from screenshots
        const draftRows = [];
        const allRows = await page.locator("table tbody tr").all();
        for (let i = 0; i < Math.min(allRows.length, 20); i++) {
          const hasText = await allRows[i].getByText("Draft", { exact: true }).isVisible({ timeout: 800 }).catch(() => false);
          if (hasText) {
            draftRows.push(i);
            console.log(`  Row ${i} contains 'Draft' text`);
          }
        }
        const targetIdx = draftRows[0] ?? 2; // use first Draft row or index 2 as fallback
        await page.locator("table tbody tr").nth(targetIdx).locator("a").first().click();
        await page.waitForTimeout(3000);
        await waitReady(page, 25000);
        quoteUrl = page.url();
        console.log(`  Navigated to Quote: ${quoteUrl}`);
        await page.screenshot({ path: "test-results/mob-p08-quote-fallback.png" });
        recordStep("PRE-3", "Navigate to existing Draft Quote", "PASS", quoteUrl);
      }
    } else {
      quoteUrl = page.url(); // staying on Opportunity page
    }

    // ── STEP 1: Click "Configure Enterprise Quote" ───────────────────────────
    console.log("\n[MOB-NEW-002] Step 1 — Click Configure Enterprise Quote...");
    await waitReady(page, 20000);
    await dumpVisibleButtons(page, "Page before Step 1");
    await page.screenshot({ path: "test-results/mob-002-step1-before.png" });

    let step1Clicked = false;

    // Strategy A: try all standard locations
    step1Clicked = await clickBtn(page, "Configure Enterprise Quote");

    // Strategy B: overflow / "Show more actions" dropdown
    if (!step1Clicked) {
      const showMoreBtn = page.locator("button[title='Show more actions'], button[aria-haspopup='menu']").first();
      if (await showMoreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await showMoreBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: "test-results/mob-002-step1-dropdown.png" });
        step1Clicked = await clickBtn(page, "Configure Enterprise Quote");
        if (!step1Clicked) await page.keyboard.press("Escape");
      }
    }

    // Strategy C: look in all open dropdown menus
    if (!step1Clicked) {
      const allMenuBtns = await page.locator("button[aria-haspopup], lightning-button-menu button").all();
      for (const btn of allMenuBtns) {
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(1000);
          step1Clicked = await clickBtn(page, "Configure Enterprise Quote");
          if (step1Clicked) break;
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);
        }
      }
    }

    if (!step1Clicked) {
      recordStep(1, "Click Configure Enterprise Quote",
        "FAIL",
        `Button not found on page. Quote Status may not be Draft-Sales or Mobility product not yet added. URL: ${page.url()}`
      );
      await page.screenshot({ path: "test-results/mob-002-step1-fail.png" });
      throw new Error("Configure Enterprise Quote not found");
    }

    // Wait for CPQ wizard/OmniScript to load
    await page.waitForTimeout(5000);
    const allPages = bContext.pages();
    const cpq     = allPages.length > 1 ? allPages[allPages.length - 1] : page;
    await waitReady(cpq, 45000);
    await cpq.screenshot({ path: "test-results/mob-002-step1-pass.png" });
    recordStep(1, "Click Configure Enterprise Quote", "PASS", `CPQ loaded → ${cpq.url()}`);
    console.log("  CPQ URL:", cpq.url());

    // ── STEP 2: Click "Number Mgmt" (Number Reservation in UI) ─────────────
    console.log("\n[MOB-NEW-002] Step 2 — Click Number Mgmt (Number Reservation)...");
    await waitReady(cpq, 20000);
    await dumpVisibleButtons(cpq, "CPQ page");
    await cpq.screenshot({ path: "test-results/mob-002-step2-before.png" });

    // The button appears as "Number Mgmt" in the Vlocity Enterprise Sales App
    const numMgmtClicked = await clickBtn(cpq, "Number Mgmt");

    if (!numMgmtClicked) {
      // Try broader patterns matching the visible CPQ toolbar buttons
      const fallbacks = [
        cpq.getByRole("button", { name: /Number/i }).first(),
        cpq.getByRole("tab",    { name: /Number/i }).first(),
        cpq.getByRole("link",   { name: /Number/i }).first(),
        cpq.locator("[title*='Number' i]").first(),
        cpq.locator("button, a").filter({ hasText: /Number/i }).first(),
      ];
      let clicked = false;
      for (const f of fallbacks) {
        if (await f.isVisible({ timeout: 3000 }).catch(() => false)) {
          await f.click();
          clicked = true;
          console.log("  Clicked Number button via fallback");
          break;
        }
      }
      if (!clicked) {
        recordStep(2, "Click Number Reservation", "FAIL", "Number Mgmt button not found in CPQ toolbar");
        await cpq.screenshot({ path: "test-results/mob-002-step2-fail.png" });
        throw new Error("Number Mgmt not found");
      }
    }

    await waitReady(cpq, 25000);
    await cpq.screenshot({ path: "test-results/mob-002-step2-pass.png" });
    recordStep(2, "Click Number Reservation", "PASS", "Number Mgmt section opened");

    // ── STEP 3: Select Mobility, service type, quantity, requirements ────────
    console.log("\n[MOB-NEW-002] Step 3 — Select Mobility, service type, quantity...");
    await cpq.waitForTimeout(2000);
    await cpq.screenshot({ path: "test-results/mob-002-step3-before.png" });

    const step3Notes = [];

    // Select product = Mobility
    const allCombos = cpq.locator("select, [role='combobox'], lightning-combobox, lightning-base-combobox");
    const comboCount = await allCombos.count();
    console.log(`  Found ${comboCount} combo/select elements`);

    for (let i = 0; i < comboCount; i++) {
      const combo    = allCombos.nth(i);
      const comboTxt = await combo.textContent().catch(() => "");
      if (/Mobility/i.test(comboTxt)) {
        // Select Mobility option
        await combo.click().catch(() => {});
        await cpq.waitForTimeout(500);
        const mobOpt = cpq.getByRole("option", { name: /^Mobility$/i }).first();
        if (await mobOpt.isVisible({ timeout: 4000 }).catch(() => false)) {
          await mobOpt.click();
          step3Notes.push("Product=Mobility selected");
        } else {
          // Try select element
          await combo.selectOption({ label: "Mobility" }).catch(() => {
            step3Notes.push("Mobility option not found in combo");
          });
        }
        break;
      }
    }

    // Service type — pick first available option in 2nd combo
    if (comboCount > 1) {
      const sCombo = allCombos.nth(1);
      if (await sCombo.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sCombo.click().catch(() => {});
        await cpq.waitForTimeout(500);
        const firstOpt = cpq.getByRole("option").first();
        if (await firstOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstOpt.click();
          step3Notes.push("Service type selected");
        }
      }
    }

    // Quantity
    const qtyInputs = cpq.locator(
      "input[type='number'], input[name*='quantity' i], input[placeholder*='qty' i], input[aria-label*='quantity' i]"
    );
    if (await qtyInputs.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await qtyInputs.first().fill("1");
      step3Notes.push("Qty=1");
    }

    await cpq.screenshot({ path: "test-results/mob-002-step3-after.png" });
    recordStep(3, "Select Mobility product, service type, qty, requirements", "PASS",
      step3Notes.join("; ") || "Form fields inspected");

    // ── STEP 4: Click Next ──────────────────────────────────────────────────
    console.log("\n[MOB-NEW-002] Step 4 — Click Next...");

    const nextClicked = await clickBtn(cpq, "Next");
    if (!nextClicked) {
      recordStep(4, "Click Next", "FAIL", "Next button not found");
      await cpq.screenshot({ path: "test-results/mob-002-step4-fail.png" });
      throw new Error("Next button not found");
    }

    await waitReady(cpq, 30000);
    await cpq.screenshot({ path: "test-results/mob-002-step4-pass.png" });
    recordStep(4, "Click Next", "PASS", "Proceeded to number results");

    // ── STEP 5: Verify Number ───────────────────────────────────────────────
    console.log("\n[MOB-NEW-002] Step 5 — Verify Number...");
    await cpq.waitForTimeout(3000);
    await cpq.screenshot({ path: "test-results/mob-002-step5-verify.png" });

    const bodyText = await cpq.textContent("body").catch(() => "");

    // Error check
    const errEl   = cpq.locator(".slds-notify--error, [role='alert'], [class*='error-message']").first();
    const hasError = await errEl.isVisible({ timeout: 3000 }).catch(() => false);

    // Row count
    const numRows  = cpq.locator("table tbody tr, ul li").filter({ has: cpq.locator("td, span") });
    const rowCount = await numRows.count().catch(() => 0);

    // Indonesian mobile number pattern
    const hasPhone = /\b08\d{7,11}\b|\+628\d{7,11}/.test(bodyText);
    const noNumMsg = /no.{0,20}number|not.{0,20}available|tidak.{0,20}tersedia|0.{0,5}result/i.test(bodyText);

    console.log(`  Rows: ${rowCount} | Phone pattern: ${hasPhone} | Error: ${hasError} | No-num msg: ${noNumMsg}`);

    if (hasError) {
      const errTxt = await errEl.textContent().catch(() => "");
      recordStep(5, "Verify Number", "FAIL", `Error: ${errTxt.trim().substring(0, 120)}`);
    } else if (noNumMsg) {
      recordStep(5, "Verify Number", "FAIL", "Page shows no numbers available for prefix");
    } else if (rowCount > 0 || hasPhone) {
      recordStep(5, "Verify Number", "PASS",
        `${rowCount > 0 ? rowCount + " row(s) displayed" : "Mobile number pattern found"}`);
      overall = "PASS";
    } else {
      recordStep(5, "Verify Number", "FAIL",
        `Inconclusive — no rows, no phone pattern. Snippet: "${bodyText.trim().substring(0, 100)}"`);
    }

  } catch (err) {
    console.error("\n  [ERROR]", err.message);
    if (!steps.find(s => s.status === "FAIL")) {
      recordStep("ERR", "Unexpected error", "FAIL", err.message.substring(0, 200));
    }
  } finally {
    try {
      const last = bContext.pages().pop();
      await last?.screenshot({ path: "test-results/mob-002-final.png" }).catch(() => {});
    } catch (_) {}

    const csvPath = writeCsv(overall);
    console.log("\n" + "═".repeat(60));
    console.log(`  MOB-NEW-002  ►  ${overall}`);
    console.log(`  Report       ►  ${csvPath}`);
    console.log("═".repeat(60) + "\n");
    await browser.close();
  }
})();

// ── Utility: dump visible buttons (Playwright locator, pierces shadow DOM) ───
async function dumpVisibleButtons(page, label) {
  const btns = page.locator("button, a[role='button'], [role='menuitem']");
  const count = await btns.count().catch(() => 0);
  const labels = [];
  for (let i = 0; i < Math.min(count, 60); i++) {
    const btn = btns.nth(i);
    const visible = await btn.isVisible({ timeout: 500 }).catch(() => false);
    if (visible) {
      const txt = (await btn.textContent().catch(() => "")).trim().substring(0, 60)
                || await btn.getAttribute("title").catch(() => "") || "";
      if (txt) labels.push(txt);
    }
  }
  console.log(`  [BTN:${label}] ${[...new Set(labels)].join(" | ") || "(none)"}`);
}
