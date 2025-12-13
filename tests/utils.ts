import type { BrowserContext, Page } from '@playwright/test';

export const localPeerConfig = {
  host: 'localhost',
  port: 9000,
  path: '/peerjs',
  secure: false,
  debug: 2,
};

export async function injectPeerConfig(target: BrowserContext | Page) {
  // Add as init script so it runs before any app code.
  // Passing config as argument avoids relying on outer scope in the browser.
  await target.addInitScript(config => {
    // @ts-expect-error injected into window for runtime use
    window.__PEER_CONFIG__ = config;
  }, localPeerConfig);
}

export async function mockBrowserDisplayApis(target: BrowserContext | Page) {
  await target.addInitScript(() => {
    // @ts-expect-error test-only flag
    window.__pipRequests = 0;
    // @ts-expect-error test-only flag
    window.__fullscreenToggles = { enter: 0, exit: 0 };
    // Picture-in-Picture mocks
    Object.defineProperty(document, 'pictureInPictureEnabled', { value: true });
    // @ts-expect-error allow assignment in tests
    document.pictureInPictureElement = null;
    // @ts-expect-error mocking PiP
    document.exitPictureInPicture = async () => {
      // @ts-expect-error mocking PiP
      const el = document.pictureInPictureElement;
      // @ts-expect-error mocking PiP
      document.pictureInPictureElement = null;
      if (el) {
        el.dispatchEvent(new Event('leavepictureinpicture'));
      }
    };
    HTMLVideoElement.prototype.requestPictureInPicture = async function requestPiP() {
      // @ts-expect-error test-only counter
      window.__pipRequests = (window.__pipRequests || 0) + 1;
      // @ts-expect-error mocking PiP
      document.pictureInPictureElement = this;
      this.dispatchEvent(new Event('enterpictureinpicture'));
      return this;
    };

    // Fullscreen mocks
    // @ts-expect-error mock fullscreen
    document.fullscreenElement = null;
    Document.prototype.exitFullscreen = async function exitFs() {
      // @ts-expect-error test-only counter
      window.__fullscreenToggles = {
        // @ts-expect-error test-only counter
        enter: window.__fullscreenToggles.enter || 0,
        // @ts-expect-error test-only counter
        exit: (window.__fullscreenToggles.exit || 0) + 1,
      };
      // @ts-expect-error mock fullscreen
      document.fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    };
    Element.prototype.requestFullscreen = function requestFs() {
      // @ts-expect-error test-only counter
      window.__fullscreenToggles = {
        // @ts-expect-error test-only counter
        enter: (window.__fullscreenToggles.enter || 0) + 1,
        // @ts-expect-error test-only counter
        exit: window.__fullscreenToggles.exit || 0,
      };
      // @ts-expect-error mock fullscreen
      document.fullscreenElement = this;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    };
  });
}
