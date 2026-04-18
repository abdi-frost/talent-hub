import { test, expect } from "@playwright/test";

test.describe("Talent submission flow", () => {
  test("homepage loads and shows stats section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Talent Hub")).toBeVisible();
    await expect(page.getByText("Community at a Glance")).toBeVisible();
  });

  test("navigates to submission page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /submit your profile/i }).click();
    await expect(page).toHaveURL("/submit");
  });
});

test.describe("Admin login flow", () => {
  test("unauthenticated visit to /admin redirects to login", async ({
    page,
  }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
