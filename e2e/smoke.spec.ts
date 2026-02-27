import { expect, test } from "@playwright/test";

test("app shell renders", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Local-first AI overlay" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide overlay" })).toBeVisible();
});
