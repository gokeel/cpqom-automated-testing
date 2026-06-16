import { test, expect, chromium } from "@playwright/test";
import * as allure from "allure-js-commons";
import dataAuth from "../../test-data/auth.json" assert { type: "json" };
import path from "path";
import { fileURLToPath } from "url";
import { closeDb } from "../../utils/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const userDataDirectory = path.resolve(__dirname, "../../.sf-profile");
let context;
let page;

// Resolve login user: sysadmin when TEST_USER_ADMIN=true, otherwise marketing
const loginUser =
  process.env.TEST_USER_ADMIN === "true"
    ? dataAuth.sysadmin
    : dataAuth.marketing;

// runs only once before all tests in the file
test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(userDataDirectory, {
    headless: process.env.HEADLESS === "true" || process.env.CI === "true",
    args: ["--start-maximized"]
  });
  page = await context.newPage();

  await page.goto(loginUser.url);
  await page
    .getByRole("textbox", { name: "Username" })
    .fill(loginUser.username);
  await page.getByRole("textbox", { name: "Password" }).click();
  await page
    .getByRole("textbox", { name: "Password" })
    .fill(loginUser.password);
  await page.getByRole("button", { name: "Log In to Sandbox" }).click();

  await page.waitForURL("**/lightning/**", { timeout: 60000 });
  await context.storageState({ path: ".sf-profile/sf-state.json" });
});

test.afterAll(async () => {
  await closeDb();
  if (context) await context.close();
});

test("TC004_Navigate to IOH ESM App", async () => {
  await allure.epic("App Navigation");
  await allure.feature("IOH ESM App");
  await allure.story("Navigate to IOH ESM App via App Launcher");
  await allure.severity("critical");

  await test.step("TC004_S01 - Open App Launcher", async () => {
    await page.getByRole("button", { name: "App Launcher" }).click();

    // Expected: App Launcher dialog opens
    await expect(
      page.getByRole("dialog", { name: "App Launcher" }),
      "App Launcher dialog should open after clicking the App Launcher button"
    ).toBeVisible({ timeout: 10_000 });
  });

  await test.step("TC004_S02 - Search for IOH ESM app", async () => {
    await page
      .getByRole("combobox", { name: "Search apps and items..." })
      .fill("IOH ESM");

    // Expected: Apps section appears with search results
    await expect(
      page.getByRole("heading", { name: "Apps" }),
      "Apps section heading should be visible after searching"
    ).toBeVisible({ timeout: 10_000 });
  });

  await test.step("TC004_S03 - Verify IOH ESM is visible in Apps section", async () => {
    // Expected: IOH ESM option is listed under Apps
    await expect(
      page
        .getByLabel("Apps", { exact: true })
        .getByRole("option", { name: "IOH ESM" }),
      "IOH ESM app should appear in the Apps search results"
    ).toBeVisible({ timeout: 10_000 });
  });

  await test.step("TC004_S04 - Open IOH ESM app", async () => {
    await page
      .getByLabel("Apps", { exact: true })
      .getByRole("option", { name: "IOH ESM" })
      .click();

    // Expected: IOH ESM app loads and its name appears in the navigation bar
    await expect(
      page.getByRole("heading", { name: "IOH ESM", level: 1 }),
      "IOH ESM heading should be visible in the navigation bar after opening the app"
    ).toBeVisible({ timeout: 15_000 });
  });
});
