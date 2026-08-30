import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('pins the ownership/progressive SDK release in npm and the browser import map', async () => {
  const packageJson = JSON.parse(await read('package.json'));
  const html = await read('index.html');
  const lock = await read('pnpm-lock.yaml');
  assert.equal(packageJson.dependencies['@alterno-dev/spatial-review'], '0.5.0');
  assert.match(html, /@alterno-dev\/spatial-review@0\.5\.0/);
  assert.match(html, /@alterno-dev\/spatial-review-protocol@0\.5\.0/);
  assert.match(lock, /'@alterno-dev\/spatial-review@0\.5\.0'/);
});

test('publishes project-relative discovery and a bounded capture bridge', async () => {
  const discovery = JSON.parse(await read('.well-known/spatial-review.json'));
  const integration = await read('src/spatial-review.js');
  assert.equal(discovery.schema, 'spatial-review-discovery/v1');
  assert.equal(discovery.websiteUrl, '../');
  assert.equal(discovery.liveCapture, '../?spatial-review-capture=1');
  assert.match(integration, /discoveryUrl: '\.well-known\/spatial-review\.json'/);
  assert.match(integration, /maxConcurrentAssetRequests: 1/);
  assert.match(integration, /maxInFlightBytes: 64 \* 1024 \* 1024/);
  assert.match(integration, /getSourceStatus\?\.\(\)\.phase === 'booting'/);
  assert.match(integration, /setSourceStatus\(\{/);
});

test('keeps review capture static after the deterministic first frame', async () => {
  const main = await read('src/main.js');
  assert.match(main, /const spatialReviewCapture = isSpatialReviewCapture\(\)/);
  assert.match(main, /if \(!spatialReviewCapture\) api\.begin\(\)/);
});
