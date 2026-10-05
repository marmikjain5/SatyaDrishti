import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLidarCompatibility, requestLidarDepthCalibration } from './lidarCompatibilityService';

const originalWindow = globalThis.window;

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
});

describe('LiDAR compatibility bridge', () => {
  it('reports unavailable when no native ARKit bridge is connected', () => {
    Object.defineProperty(globalThis, 'window', { value: { setTimeout, clearTimeout }, configurable: true });
    expect(getLidarCompatibility()).toEqual({
      supported: false,
      connected: false,
      reason: expect.stringContaining('native iOS wrapper'),
    });
    return expect(requestLidarDepthCalibration()).resolves.toBeNull();
  });

  it('accepts a valid ARKit depth result from the native bridge', async () => {
    let callbackName = '';
    Object.defineProperty(globalThis, 'window', {
      value: {
        setTimeout,
        clearTimeout,
        webkit: { messageHandlers: { satyaDrishtiLidar: {
          postMessage: (message: { callbackName: string }) => {
            callbackName = message.callbackName;
            queueMicrotask(() => {
              const callback = (globalThis.window as unknown as Record<string, unknown>)[callbackName];
              if (typeof callback === 'function') {
                callback({
                  packageWidthMm: 100, packageHeightMm: 160, scaleMmPerPx: 0.2,
                  uncertaintyMm: 1.2, confidence: 0.94, source: 'arkit-lidar',
                });
              }
            });
          },
        } } },
      },
      configurable: true,
    });
    await expect(requestLidarDepthCalibration()).resolves.toMatchObject({ source: 'arkit-lidar', confidence: 0.94 });
  });

  it('times out if the native bridge does not respond', async () => {
    vi.useFakeTimers();
    Object.defineProperty(globalThis, 'window', {
      value: { setTimeout, clearTimeout, webkit: { messageHandlers: { satyaDrishtiLidar: { postMessage: vi.fn() } } } },
      configurable: true,
    });
    const request = requestLidarDepthCalibration();
    vi.advanceTimersByTime(5000);
    await expect(request).resolves.toBeNull();
  });
});
