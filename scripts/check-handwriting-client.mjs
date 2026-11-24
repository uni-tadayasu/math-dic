#!/usr/bin/env node
import assert from 'node:assert/strict';
import { recognizeHandwriting } from '../dist/handwriting-client.js';
import { recognizeStrokes, registerSample, clearSamples, getSampleSnapshot } from '../dist/handwriting.js';

// Exercise the real recognition client and recognizer. FakeWorker only models
// message delivery, failure and termination; no recognition result is invented.
const ink = [
  { type: 'pen', width: 3, points: [[20, 20], [75, 120]] },
  { type: 'pen', width: 3, points: [[75, 20], [20, 120]] },
  { type: 'pen', width: 3, points: [[110, 70], [190, 70]] },
  { type: 'pen', width: 3, points: [[150, 30], [150, 110]] },
  { type: 'pen', width: 3, points: [[240, 20], [240, 120]] }
];
class FakeWorker {
  static instances = [];
  constructor(url, options) {
    this.url = String(url);
    this.options = options;
    this.terminated = false;
    FakeWorker.instances.push(this);
  }
  postMessage(message) { this.message = structuredClone(message); }
  terminate() { this.terminated = true; }
  reply(message) { this.onmessage?.({ data: message }); }
  complete() {
    this.reply({ id: this.message.id, result: recognizeStrokes(this.message.operations, { samples: this.message.samples }) });
  }
}

let count = 0;
async function check(name, run, WorkerClass = FakeWorker) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
  FakeWorker.instances = [];
  try {
    if (WorkerClass) Object.defineProperty(globalThis, 'Worker', { value: WorkerClass, writable: true, configurable: true });
    else delete globalThis.Worker;
    await run();
    count++;
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  } finally {
    if (previous) Object.defineProperty(globalThis, 'Worker', previous);
    else delete globalThis.Worker;
  }
}

clearSamples();
await check('Module worker URL, real result and cleanup', async () => {
  const expected = recognizeStrokes(ink);
  assert.equal(expected.unsupported, false);
  const pending = recognizeHandwriting(ink);
  const worker = FakeWorker.instances[0];
  assert.equal(worker.url, new URL('../dist/handwriting-worker.js', import.meta.url).href);
  assert.equal(worker.options.type, 'module');
  assert.deepEqual(worker.message.operations, ink);
  worker.reply({ id: 99, result: expected });
  assert.equal(worker.terminated, false, 'A message for another request must be ignored');
  worker.complete();
  assert.deepEqual(await pending, expected);
  assert.equal(worker.terminated, true);
  assert.equal(worker.onmessage, null);
  assert.equal(worker.onerror, null);
});

await check('An already cancelled request never creates a worker', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(recognizeHandwriting(ink, { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(FakeWorker.instances.length, 0);
});

await check('Aborting an older request does not cancel or resolve a newer request', async () => {
  const controller = new AbortController();
  const first = recognizeHandwriting(ink, { signal: controller.signal });
  const old = FakeWorker.instances[0], lateReply = old.onmessage;
  const rejection = assert.rejects(first, { name: 'AbortError' });
  controller.abort();
  const second = recognizeHandwriting(ink);
  const current = FakeWorker.instances[1];
  lateReply({ data: { id: 1, result: recognizeStrokes(ink) } });
  await rejection;
  assert.equal(old.terminated, true);
  assert.equal(current.terminated, false);
  current.complete();
  assert.equal((await second).unsupported, false);
});

await check('A worker load error falls back to the real local recognizer', async () => {
  const pending = recognizeHandwriting(ink);
  const worker = FakeWorker.instances[0];
  let prevented = false;
  worker.onerror({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(worker.terminated, true);
  assert.deepEqual(await pending, recognizeStrokes(ink));
});

await check('Abort during worker-error fallback prevents recognition completion', async () => {
  const controller = new AbortController();
  const pending = recognizeHandwriting(ink, { signal: controller.signal });
  const rejection = assert.rejects(pending, { name: 'AbortError' });
  FakeWorker.instances[0].onerror({ preventDefault() {} });
  controller.abort();
  await rejection;
});

await check('Missing Worker support still returns the real recognition result', async () => {
  assert.deepEqual(await recognizeHandwriting(ink), recognizeStrokes(ink));
}, null);

await check('Worker construction failure also uses the bounded local fallback', async () => {
  assert.deepEqual(await recognizeHandwriting(ink), recognizeStrokes(ink));
}, class UnavailableWorker { constructor() { throw new Error('Worker disabled'); } });

await check('A hung worker times out, terminates, and never falls back on the UI thread', async () => {
  const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
  let timeout = null, fallbackScheduled = false, cleared = false;
  const timerId = 987654321;
  globalThis.setTimeout = (fn, delay, ...args) => {
    if (delay === 15000) { timeout = () => fn(...args); return timerId; }
    fallbackScheduled = true;
    return realSet(fn, delay, ...args);
  };
  globalThis.clearTimeout = id => { if (id === timerId) cleared = true; else realClear(id); };
  try {
    const pending = recognizeHandwriting(ink);
    const rejection = assert.rejects(pending, /時間がかかっています/);
    const worker = FakeWorker.instances[0];
    assert.ok(timeout);
    timeout();
    await rejection;
    assert.equal(worker.terminated, true);
    assert.equal(cleared, true);
    assert.equal(fallbackScheduled, false);
  } finally {
    globalThis.setTimeout = realSet; globalThis.clearTimeout = realClear;
  }
});

await check('Malformed worker results fail clearly and release the worker', async () => {
  const pending = recognizeHandwriting(ink);
  const rejection = assert.rejects(pending, /結果を受け取れません/);
  const worker = FakeWorker.instances[0];
  worker.reply({ id: 1, result: {} });
  await rejection;
  assert.equal(worker.terminated, true);
});

await check('Personal handwriting samples are transferred as an isolated snapshot', async () => {
  const registered = registerSample('x', ink.slice(0, 2));
  assert.equal(registered.ok, true);
  const snapshot = getSampleSnapshot();
  assert.ok(snapshot.length > 0);
  const pending = recognizeHandwriting(ink);
  const worker = FakeWorker.instances[0];
  assert.deepEqual(worker.message.samples, snapshot);
  snapshot[0].symbol = '9';
  assert.equal(worker.message.samples[0].symbol, 'x');
  assert.equal(getSampleSnapshot()[0].symbol, 'x');
  worker.complete();
  assert.equal((await pending).unsupported, false);
  clearSamples();
});

console.log(`Validated ${count} handwriting client scenarios: worker delivery, cancellation, fallbacks, timeout, URL and personal samples.`);
