function nextTask() {
  // Capture runs in a hidden, cross-site iframe. Chained setTimeout(0) calls
  // there are timer-throttled; thousands of geometry checkpoints can become
  // minutes of artificial waiting. Scheduler tasks keep cooperative yielding
  // without tying it to either clamped timers or hidden-frame animation frames.
  if (globalThis.scheduler?.yield) return globalThis.scheduler.yield();
  return new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close(); channel.port2.close(); resolve();
    };
    channel.port2.postMessage(null);
  });
}

export function createReviewYield({ now = () => performance.now(), task = nextTask, budgetMs = 8 } = {}) {
  let lastYield = now();
  return async function yieldReview() {
    if (now() - lastYield < budgetMs) return;
    await task();
    lastYield = now();
  };
}
