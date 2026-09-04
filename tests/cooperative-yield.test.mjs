import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createReviewYield } from '../review/cooperative-yield.js';

test('many geometry checkpoints share a bounded work slice instead of one timer per checkpoint', async () => {
  let time = 0, tasks = 0;
  const checkpoint = createReviewYield({ now: () => time, task: async () => { tasks++; }, budgetMs: 8 });
  for (let i = 0; i < 800; i++) { time += 0.25; await checkpoint(); }
  assert.equal(tasks, 25);
  time += 8; await checkpoint(); assert.equal(tasks, 26);
});

test('time spent waiting is not charged to the following CPU slice', async () => {
  let time = 0, tasks = 0;
  const checkpoint = createReviewYield({ now: () => time, task: async () => { tasks++; time += 1000; } });
  time = 8; await checkpoint();
  await checkpoint(); assert.equal(tasks, 1);
  time += 8; await checkpoint(); assert.equal(tasks, 2);
});

test('the fallback yields to a real task without clamped timers and closes its ports', async () => {
  const checkpoint = createReviewYield({ budgetMs: 0 });
  const order = [];
  const pending = checkpoint().then(() => order.push('task'));
  await Promise.resolve(); order.push('microtask');
  await pending; assert.deepEqual(order, ['microtask', 'task']);
  const capture = await readFile(new URL('../review/capture.js', import.meta.url), 'utf8');
  assert.match(capture, /const yieldTask=createReviewYield\(\)/);
  assert.match(capture, /signal.throwIfAborted\(\);await yieldTask\(\)/);
});
