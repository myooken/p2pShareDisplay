import { test, expect } from '@playwright/test';
import { injectPeerConfig, mockBrowserDisplayApis } from './utils';

test.setTimeout(60000);

test.use({
    launchOptions: {
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
        ],
    },
});

test('guest can retry password after failure and connect', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    await injectPeerConfig(hostContext);
    await injectPeerConfig(guestContext);

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
        await hostPage.goto('/');
        await hostPage.fill('input[placeholder="Enter password"]', 'secret123');
        await hostPage.click('button:has-text("Create Room")');
        await hostPage.waitForURL(/\/room\//);
        const roomId = await hostPage.locator('.header strong').innerText();

        await guestPage.goto('/');
        await guestPage.fill('input[placeholder="Enter Room ID"]', roomId);
        await guestPage.fill('input[placeholder="Enter Room Password"]', 'wrongpass');
        await guestPage.click('button:has-text("Join Room")');
        await guestPage.waitForURL(/\/room\//);

        await expect(guestPage.locator('.status-badge')).toContainText('Authentication Failed', { timeout: 15000 });
        const modal = guestPage.locator('.modal-overlay');
        await expect(modal).toBeVisible();

        await guestPage.fill('input[placeholder="Enter Password"]', 'secret123');
        await guestPage.click('button:has-text("Join")');

        await expect(guestPage.locator('.status-badge')).toContainText('Connected to Host', { timeout: 15000 });
        await expect(modal).toHaveCount(0);
    } finally {
        await hostContext.close();
        await guestContext.close();
    }
});

test('host controls and viewer cursor sync UI', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    await injectPeerConfig(hostContext);
    await injectPeerConfig(guestContext);
    await mockBrowserDisplayApis(hostContext);
    await mockBrowserDisplayApis(guestContext);

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
        await hostPage.goto('/');
        await hostPage.click('button:has-text("Create Room")');
        await hostPage.waitForURL(/\/room\//);
        const roomUrl = hostPage.url();

        await guestPage.goto(roomUrl);
        await expect(guestPage.locator('.status-badge')).toContainText('Connected to Host', { timeout: 15000 });

        await hostPage.click('text=Start Screen Share');

        const hostVideo = hostPage.locator('video');
        await expect(hostVideo).toHaveJSProperty('paused', false, { timeout: 15000 });
        const guestVideo = guestPage.locator('video');
        await expect(guestVideo).toHaveJSProperty('paused', false, { timeout: 15000 });

        await hostPage.getByRole('button', { name: /Mute Audio/i }).click();
        await expect(hostPage.getByRole('button', { name: /Unmute Audio/i })).toBeVisible();

        await expect(hostVideo).toHaveCSS('object-fit', 'contain');
        await hostPage.getByTitle('Toggle Fit/Fill').click();
        await expect(hostVideo).toHaveCSS('object-fit', 'cover');

        const pipButton = hostPage.getByTitle('Picture in Picture');
        await pipButton.click();
        await pipButton.click();
        await hostPage.waitForTimeout(100);
        const pipRequests = await hostPage.evaluate(() => {
            // @ts-expect-error injected counter from mocks
            return window.__pipRequests || 0;
        });
        expect(pipRequests).toBeGreaterThan(0);

        const fullscreenButton = hostPage.getByTitle('Fullscreen');
        await fullscreenButton.click();
        await fullscreenButton.click();
        await hostPage.waitForTimeout(100);
        const fullscreenToggles = await hostPage.evaluate(() => {
            // @ts-expect-error injected counter from mocks
            return window.__fullscreenToggles || { enter: 0, exit: 0 };
        });
        expect(fullscreenToggles.enter).toBeGreaterThan(0);
        if (!fullscreenToggles.exit) {
            await hostPage.evaluate(() => document.exitFullscreen());
        }

        const guestVideoContainer = guestPage.locator('.video-container');
        await guestVideoContainer.waitFor();
        await guestPage.locator('.color-swatch').nth(1).click(); // pick blue
        const box = await guestVideoContainer.boundingBox();
        if (!box) throw new Error('Video container not visible');
        await guestPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

        const remoteCursor = hostPage.locator('.remote-cursor');
        await expect(remoteCursor).toBeVisible({ timeout: 5000 });
        await expect(remoteCursor).toHaveCSS('background-color', 'rgb(59, 130, 246)');
        await guestVideoContainer.dispatchEvent('mouseleave');
        await hostPage.waitForTimeout(100);

        await hostPage.getByRole('button', { name: 'Stop Sharing' }).click();
        await expect(hostPage.getByText('Click Start to share your screen')).toBeVisible();
        await expect(hostVideo).toHaveCount(0);
    } finally {
        await hostContext.close();
        await guestContext.close();
    }
});
