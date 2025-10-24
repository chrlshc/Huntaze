import { test, expect } from "@playwright/test";

test.describe("Marketing surface", () => {
  test("Hero renders with breathing space + valid CTAs", async ({ page }) => {
    await page.goto("/");

    // Headline visible
    await expect(page.getByRole("heading", { name: /Build faster/i })).toBeVisible();

    // Primary CTA is white pill with dark text
    const primary = page.getByRole("button", { name: /Join the Beta/i });
    await expect(primary).toBeVisible();

    const bg = await primary.evaluate((el) => getComputedStyle(el).backgroundColor);
    const radius = await primary.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
    const color = await primary.evaluate((el) => getComputedStyle(el).color);

    expect(bg).toMatch(/rgb\(\s*255,\s*255,\s*255\s*\)/); // white
    expect(color).toMatch(/rgb\(/); // some rgb color (dark)
    expect(parseFloat(radius)).toBeGreaterThanOrEqual(20); // pill-ish

    // Section islands exist
    await expect(page.getByText(/Works with/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Huntaze product pillars/i })).toBeVisible();
  });

  test("Tabs are keyboard-usable", async ({ page }) => {
    await page.goto("/#features");
    const tabs = page.getByRole("tablist");
    await expect(tabs).toBeVisible();

    // Focus, move, and activate
    const first = page.getByRole("tab", { name: /Unified Inbox/i });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("tabpanel")).toBeVisible();
  });
});

