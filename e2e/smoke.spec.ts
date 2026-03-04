import { expect, test } from "@playwright/test";

test("app shell renders", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "AI chat mock" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
});
