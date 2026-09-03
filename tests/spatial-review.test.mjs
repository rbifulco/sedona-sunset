import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  SPATIAL_REVIEW_CATALOG, SPATIAL_REVIEW_CONNECTION_REJECTED,
  SPATIAL_REVIEW_DISCOVERY_REQUEST, SPATIAL_REVIEW_DISCOVERY_RESPONSE,
  SPATIAL_REVIEW_REQUEST,
} from '@alterno-dev/spatial-review';
import {
  startSpatialReviewDiscovery, startSpatialReviewCapture, stopSpatialReview,
} from '../src/spatial-review.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('actual bridges preserve local review and reject unauthorized live capture', async () => {
  const previous = globalThis.window;
  const listeners = new Set(), messages = [];
  const parent = { postMessage: (message, origin) => messages.push({ message, origin }) };
  globalThis.window = {
    location: new URL('http://127.0.0.1:8099/?spatial-review-capture=1'),
    parent, opener: null, setTimeout,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };
  try {
    startSpatialReviewDiscovery(); startSpatialReviewCapture();
    messages.length = 0;
    const send = (type, origin, requestId) => {
      for (const listener of listeners) listener({ source: parent, origin, data: { type, requestId } });
    };
    send(SPATIAL_REVIEW_DISCOVERY_REQUEST, 'http://localhost:5173', 'discovery');
    send(SPATIAL_REVIEW_REQUEST, 'http://localhost:5173', 'capture');
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.ok(messages.some(({ message }) => message.type === SPATIAL_REVIEW_CATALOG));
    const discovery = messages.find(({ message }) => message.type === SPATIAL_REVIEW_DISCOVERY_RESPONSE).message.discovery;
    assert.equal(discovery.capabilities?.liveCapture?.editorOriginPolicy, undefined);
    assert.ok(messages.every(({ origin }) => origin === 'http://localhost:5173'));
    messages.length = 0;
    send(SPATIAL_REVIEW_DISCOVERY_REQUEST, 'https://unapproved.example', 'denied-discovery');
    send(SPATIAL_REVIEW_REQUEST, 'https://unapproved.example', 'denied-capture');
    assert.equal(messages.length, 1);
    assert.equal(messages[0].message.type, SPATIAL_REVIEW_CONNECTION_REJECTED);
    assert.equal(messages[0].message.code, 'editor-origin-not-authorized');
    assert.equal(messages[0].message.requestId, 'denied-capture');
    assert.equal(messages[0].message.payload, undefined);
  } finally {
    stopSpatialReview();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('pins the ownership/progressive SDK release in npm and the browser import map', async () => {
  const packageJson = JSON.parse(await read('package.json'));
  const html = await read('index.html');
  const lock = await read('pnpm-lock.yaml');
  assert.equal(packageJson.dependencies['@alterno-dev/spatial-review'], '0.7.0');
  assert.match(html, /@alterno-dev\/spatial-review@0\.7\.0/);
  assert.match(html, /@alterno-dev\/spatial-review-protocol@0\.7\.0/);
  assert.match(lock, /'@alterno-dev\/spatial-review@0\.7\.0'/);
});

test('publishes project-relative discovery and a bounded capture bridge', async () => {
  const discovery = JSON.parse(await read('.well-known/spatial-review.json'));
  const integration = await read('src/spatial-review.js');
  assert.equal(discovery.schema, 'spatial-review-discovery/v1');
  assert.equal(discovery.websiteUrl, '../');
  assert.equal(discovery.liveCapture, '../?spatial-review-capture=1');
  assert.match(integration, /discoveryUrl: '\.well-known\/spatial-review\.json'/);
  assert.match(integration, /maxConcurrentAssetRequests: 1/);
  assert.match(integration, /allowLoopbackPeers: true/);
  assert.match(integration, /maxInFlightBytes: 64 \* 1024 \* 1024/);
  assert.match(integration, /getSourceStatus\?\.\(\)\.phase === 'booting'/);
  assert.match(integration, /setSourceStatus\(\{/);
  assert.match(integration, /SPATIAL_REVIEW_BUILD_ID = 'sedona-sunset@1\.0\.1'/);
});

test('keeps review capture static after the deterministic first frame', async () => {
  const main = await read('src/main.js');
  const integration = await read('src/spatial-review.js');
  assert.match(main, /const spatialReviewCapture = isSpatialReviewCapture\(\)/);
  assert.match(main, /renderOnce\(\);[\s\S]*prepareSpatialReviewCapture\(\);[\s\S]*startSpatialReviewCapture\(\)/);
  assert.match(main, /if \(!spatialReviewCapture\) api\.begin\(\)/);
  assert.match(integration, /if \(!isSpatialReviewCapture\(\)\) return false/);
  assert.match(integration, /terrain: 0xa86242/);
  assert.match(integration, /sandstone: 0xa4492f/);
  assert.match(integration, /foliage: 0x4d5a32/);
});
