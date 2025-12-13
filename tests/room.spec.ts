import { test, expect } from '@playwright/test';
import { injectPeerConfig } from './utils';

test('create room with password and guest join', async ({ browser }) => {
    // --- Host Context ---
    const hostContext = await browser.newContext();
    await injectPeerConfig(hostContext);
    const hostPage = await hostContext.newPage();

    // Go to home
    await hostPage.goto('/');

    // Set password
    await hostPage.fill('input[placeholder="Enter password"]', 'secret123');

    // Create Room
    await hostPage.click('button:has-text("Create Room")');

    // Wait for room to load
    await hostPage.waitForURL(/\/room\//);

    // Get Room ID
    const roomId = await hostPage.locator('.header strong').innerText();
    console.log('Room ID:', roomId);

    // Verify Link Generation (IP check)
    const hostUrl = hostPage.url();
    expect(hostUrl).toContain('/room/');

    // --- Guest Context ---
    const guestContext = await browser.newContext();
    await injectPeerConfig(guestContext);
    const guestPage = await guestContext.newPage();

    // Go to home
    await guestPage.goto('/');

    // Fill Room ID and Password
    await guestPage.fill('input[placeholder="Enter Room ID"]', roomId);
    await guestPage.fill('input[placeholder="Enter Room Password"]', 'secret123');

    // Join
    await guestPage.click('button:has-text("Join Room")');

    // Wait for navigation
    await guestPage.waitForURL(/\/room\//);

    // Wait for connection
    await expect(guestPage.locator('.status-badge')).toContainText('Connected to Host', { timeout: 15000 });

    // Cleanup
    await hostContext.close();
    await guestContext.close();
});

test('guest join with wrong password fails', async ({ browser }) => {
    // --- Host Context ---
    const hostContext = await browser.newContext();
    await injectPeerConfig(hostContext);
    const hostPage = await hostContext.newPage();
    await hostPage.goto('/');
    await hostPage.fill('input[placeholder="Enter password"]', 'secret123');
    await hostPage.click('button:has-text("Create Room")');
    await hostPage.waitForURL(/\/room\//);
    const roomId = await hostPage.locator('.header strong').innerText();

    // --- Guest Context ---
    const guestContext = await browser.newContext();
    await injectPeerConfig(guestContext);
    const guestPage = await guestContext.newPage();
    await guestPage.goto('/');

    // Fill Room ID and WRONG Password
    await guestPage.fill('input[placeholder="Enter Room ID"]', roomId);
    await guestPage.fill('input[placeholder="Enter Room Password"]', 'wrongpass');

    // Join
    await guestPage.click('button:has-text("Join Room")');

    // Wait for navigation
    await guestPage.waitForURL(/\/room\//);

    // Expect Auth Failure Modal or Status
    await expect(guestPage.locator('.status-badge')).toContainText('Authentication Failed', { timeout: 15000 });

    await hostContext.close();
    await guestContext.close();
});
