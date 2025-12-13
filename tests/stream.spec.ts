import { test, expect } from '@playwright/test';
import { injectPeerConfig } from './utils';

test.use({
    launchOptions: {
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
        ],
    },
});

test('screen share stream flow', async ({ browser }) => {
    const hostContext = await browser.newContext();
    await injectPeerConfig(hostContext);
    const guestContext = await browser.newContext();
    await injectPeerConfig(guestContext);
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    hostPage.on('console', msg => console.log('HOST:', msg.text()));
    guestPage.on('console', msg => console.log('GUEST:', msg.text()));

    // Host creates room
    await hostPage.goto('http://localhost:5173');
    await hostPage.click('button:has-text("Create Room")');
    await hostPage.waitForURL(/\/room\//);
    const url = hostPage.url();

    // Guest joins
    await guestPage.goto(url);
    await expect(guestPage.locator('.status-badge')).toContainText('Connected to Host', { timeout: 15000 });

    // Host starts sharing
    // Note: With fake-ui, the permission prompt is auto-accepted.
    await hostPage.click('text=Start Screen Share');

    // Verify Host gets stream
    await expect(hostPage.locator('video')).toHaveJSProperty('paused', false);

    // Verify Guest gets stream
    // We check if the video element exists and is playing
    await expect(guestPage.locator('video')).toHaveJSProperty('paused', false, { timeout: 15000 });

    // Check logs for "Guest received stream"
    // (This is implicit if the video is playing, but good to know)

    await hostContext.close();
    await guestContext.close();
});
