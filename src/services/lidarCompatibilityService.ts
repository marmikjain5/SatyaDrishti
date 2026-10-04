/**
 * ARKit/LiDAR bridge contract.
 *
 * The web app cannot access iPhone LiDAR directly. A native iOS wrapper can
 * expose this bridge through WKWebView and return a depth-calibration result.
 * In a normal browser this service safely reports unavailable instead of
 * pretending that camera pixels provide physical scale.
 */

export interface LidarDepthCalibration {
  packageWidthMm: number;
  packageHeightMm: number;
  scaleMmPerPx: number;
  uncertaintyMm: number;
  confidence: number;
  source: 'arkit-lidar';
}

export interface LidarCompatibility {
  supported: boolean;
  connected: boolean;
  reason: string;
}

interface NativeLidarBridge {
  postMessage: (message: unknown) => void;
}

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        satyaDrishtiLidar?: NativeLidarBridge;
      };
    };
  }
}

function bridge(): NativeLidarBridge | undefined {
  return window.webkit?.messageHandlers?.satyaDrishtiLidar;
}

export function getLidarCompatibility(): LidarCompatibility {
  if (!bridge()) {
    return {
      supported: false,
      connected: false,
      reason: 'ARKit bridge is not connected. Use the native iOS wrapper to enable LiDAR depth calibration.',
    };
  }
  return {
    supported: true,
    connected: true,
    reason: 'ARKit LiDAR bridge is connected and ready to return depth calibration.',
  };
}

export function requestLidarDepthCalibration(): Promise<LidarDepthCalibration | null> {
  const nativeBridge = bridge();
  if (!nativeBridge) return Promise.resolve(null);

  return new Promise((resolve) => {
    const callbackName = `__satyaDrishtiLidar_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const timeout = window.setTimeout(() => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      resolve(null);
    }, 5000);
    (window as unknown as Record<string, unknown>)[callbackName] = (result: LidarDepthCalibration | null) => {
      window.clearTimeout(timeout);
      delete (window as unknown as Record<string, unknown>)[callbackName];
      resolve(result?.source === 'arkit-lidar' ? result : null);
    };
    nativeBridge.postMessage({ action: 'requestDepthCalibration', callbackName });
  });
}
