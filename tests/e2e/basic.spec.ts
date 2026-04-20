import { test, expect } from "@playwright/test";

const adminUsername = process.env.ADMIN_USERNAME ?? "TalentHubAdmin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "P@ssw0rd";

async function loginAsSeededAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/username/i).fill(adminUsername);
  await page.locator("#password").fill(adminPassword);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByRole("heading", { name: /talent records/i })).toBeVisible();
}

test.describe("Public talent flow", () => {
  test("homepage loads and shows stats section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /submit your profile/i })).toBeVisible();
    await expect(page.getByText("Community at a Glance")).toBeVisible();
  });

  test("submits a talent profile successfully", async ({ page }) => {
    const uniqueEmail = `playwright-${Date.now()}@example.com`;

    await page.goto("/submit");

    await expect(page.getByRole("heading", { name: /^submit\.$/i })).toBeVisible();
    await expect
      .poll(async () => page.locator("#primarySkill option").count())
      .toBeGreaterThan(1);

    const firstPrimarySkillValue = await page
      .locator("#primarySkill option")
      .nth(1)
      .getAttribute("value");

    await page.getByLabel(/full name/i).fill("Playwright Candidate");
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.locator("#primarySkill").selectOption(firstPrimarySkillValue ?? "");
    await page.getByLabel(/years of experience/i).fill("4");
    await page
      .locator('input[type="checkbox"]')
      .nth(0)
      .locator("xpath=..")
      .click();
    await page
      .locator('input[type="checkbox"]')
      .nth(1)
      .locator("xpath=..")
      .click();
    await page
      .getByLabel(/description/i)
      .fill("Frontend engineer focused on product quality, accessibility, and reliable delivery.");
    await page.getByLabel(/location/i).fill("Lagos, Nigeria");
    await page.getByLabel(/portfolio/i).fill("https://example.com");
    await page.getByRole("button", { name: /submit profile/i }).click();

    await expect(page.getByRole("heading", { name: /profile submitted/i })).toBeVisible();
    await expect(page.getByText(/your profile is under review/i)).toBeVisible();
  });
});

test.describe("Admin login flow", () => {
  test("unauthenticated visit to /admin redirects to login", async ({
    page,
  }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("super-admin can access team page and invite another admin", async ({ page }) => {
    const uniqueId = Date.now();
    const inviteUsername = `playwright_admin_${uniqueId}`;
    const inviteEmail = `playwright-admin-${uniqueId}@example.com`;

    await loginAsSeededAdmin(page);

    await expect(page.getByRole("link", { name: /team/i })).toBeVisible();
    await page.getByRole("link", { name: /team/i }).click();
    await expect(page).toHaveURL(/\/admin\/team/);
    await expect(page.getByRole("heading", { name: /team/i })).toBeVisible();

    await page.getByRole("button", { name: /invite admin/i }).click();
    await page.getByPlaceholder("e.g. jane_admin").fill(inviteUsername);
    await page.getByPlaceholder("jane@example.com").fill(inviteEmail);
    await page.getByRole("button", { name: /send invite/i }).click();

    await expect(page.getByText(new RegExp(`Invite sent to ${inviteEmail}`, "i"))).toBeVisible();
    await expect(page.locator("table").getByText(inviteUsername)).toBeVisible();
  });
});
