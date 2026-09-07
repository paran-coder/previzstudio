export const APP_VERSION = '1.3.3';
export const BUILD_ID = typeof __PREVIZ_BUILD_ID__ !== 'undefined' ? __PREVIZ_BUILD_ID__ : 'source-dev';
export const BUILD_CHANNEL = typeof __PREVIZ_BUILD_CHANNEL__ !== 'undefined' ? __PREVIZ_BUILD_CHANNEL__ : 'source';
export const BUILD_LABEL = `v${APP_VERSION} · ${BUILD_ID}`;
export const BUILD_INFO = Object.freeze({ appVersion: APP_VERSION, buildId: BUILD_ID, channel: BUILD_CHANNEL });
