import { chromium } from "@playwright/test";

const SF_URL   = "https://b2b-io--cpqsitdelo.sandbox.my.salesforce.com";
const USERNAME = "o.harliansyah@ioh.co.id.cpqsitdelo";
const PASSWORD = "QFbe3fqe1osXwA";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ viewport: null });
  const page    = await context.newPage();

  await page.goto(SF_URL, { waitUntil: "domcontentloaded" });
  await page.fill("#username", USERNAME);
  await page.click("#Login");
  await page.waitForSelector("#password", { timeout: 20000 });
  await page.fill("#password", PASSWORD);
  await page.click("#Login");
  await page.waitForURL("**/lightning/**", { timeout: 60000 });

  await page.goto(`${SF_URL}/lightning/o/Quote/list?filterName=Recent`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "test-results/debug-list.png" });

  // Dump first 5 row structures
  const info = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table tbody tr")).slice(0, 5);
    return rows.map((row, i) => {
      const links = Array.from(row.querySelectorAll("a")).map(a => ({
        text: a.textContent.trim().substring(0, 50),
        href: a.getAttribute("href"),
        dataId: a.dataset.recordid || a.dataset.id || ""
      }));
      return { row: i + 1, text: row.textContent.trim().substring(0, 80), links };
    });
  });

  console.log("Table structure:");
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
