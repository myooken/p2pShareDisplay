import { test, expect } from '@playwright/test';
import { injectPeerConfig } from './utils';

test.beforeEach(async ({ page }) => {
    await injectPeerConfig(page);
});

test('debug ui check', async ({ page }) => {
    // Go to home page
    await page.goto('http://localhost:5173');

    // Click Create Room
    await page.click('button:has-text("Create Room")');

    // Wait for navigation
    await page.waitForURL(/\/room\//);

    // Check if Debug Toggle button exists
    await expect(page.locator('button[title="Toggle Logs"]')).toBeVisible();

    // Click Toggle Logs
    await page.click('button[title="Toggle Logs"]');

    // Check if Debug Panel is visible
    await expect(page.locator('.debug-logs')).toBeVisible();

    // Check for initial logs
    await expect(page.locator('.debug-logs')).toContainText('Initializing new Peer');
});
