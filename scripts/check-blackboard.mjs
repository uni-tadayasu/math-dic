#!/usr/bin/env node
import assert from 'node:assert/strict';
import { Blackboard } from '../dist/blackboard.js';

// Real canvas controller, with browser input, storage and drawing-command spies.
// These checks verify input/geometry/state; they do not claim device latency.
const original = new Map(['document', 'requestAnimationFrame', 'cancelAnimationFrame', 'addEventListener', 'removeEventListener', 'setTimeout', 'clearTimeout', 'devicePixelRatio'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const realNow = Date.now;
let clock = 10000, nextId = 1;
const frames = new Map(), timers = new Map(), viewport = new EventTarget();
const canvases = [];
class Context {
  constructor() { this.commands = []; this.lineWidth = 1; this.stack = []; }
  save() { this.stack.push({ lineWidth: this.lineWidth, globalCompositeOperation: this.globalCompositeOperation }); }
  restore() { Object.assign(this, this.stack.pop()); }
  record(name, values) { assert.ok(values.every(Number.isFinite), `${name}: nonfinite geometry`); this.commands.push({ name, values, width: this.lineWidth, composite: this.globalCompositeOperation }); }
  setTransform(...a) { this.record('transform', a); }
  clearRect(...a) { this.record('clear', a); }
  fillRect(...a) { this.record('fillRect', a); }
  strokeRect(...a) { this.record('strokeRect', a); }
  beginPath() {}
  moveTo(...a) { this.record('move', a); }
  lineTo(...a) { this.record('line', a); }
  quadraticCurveTo(...a) { this.record('curve', a); }
  arc(...a) { this.record('arc', a); }
  fill() { this.record('fill', []); }
  stroke() { this.record('stroke', []); }
  drawImage() { this.record('image', []); }
  measureText(text) { return { width: text.length * 20 }; }
  fillText(text, x, y) { this.record('text', [x, y]); }
}
class Canvas extends EventTarget {
  constructor(rect = { left: 0, top: 0, width: 600, height: 400 }) { super(); this.style = {}; this.width = 1; this.height = 1; this.rect = rect; this.rectReads = 0; this.ctx = new Context(); this.captures = new Set(); canvases.push(this); }
  getContext() { return this.ctx; }
  getBoundingClientRect() { this.rectReads++; return this.rect; }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); this.dispatchEvent(input('lostpointercapture', { pointerId: id })); }
}
function input(type, values = {}) {
  const event = new Event(type, { cancelable: true });
  const data = { pointerId: 1, pointerType: 'pen', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: 20, clientY: 20, pressure: 0.5, timeStamp: 0, width: 2, height: 2, ...values };
  for (const [key, value] of Object.entries(data)) Object.defineProperty(event, key, { configurable: true, value });
  return event;
}
const documentMock = new EventTarget();
documentMock.visibilityState = 'visible';
documentMock.createElement = type => { assert.equal(type, 'canvas'); return new Canvas(); };
Object.assign(globalThis, {
  document: documentMock,
  requestAnimationFrame: callback => { const id = nextId++; frames.set(id, callback); return id; },
  cancelAnimationFrame: id => frames.delete(id),
  setTimeout: (callback, delay) => { const id = nextId++; timers.set(id, { callback, delay }); return id; },
  clearTimeout: id => timers.delete(id),
  addEventListener: (...args) => viewport.addEventListener(...args),
  removeEventListener: (...args) => viewport.removeEventListener(...args),
  devicePixelRatio: 2
});
Date.now = () => clock;
let serial = 0, checked = 0;
class TestBoard extends Blackboard {
  async _read() { return { ops: this.initial || [] }; }
  async _write(key, ops) { this.writes.push({ key, ops: structuredClone(ops) }); }
}
async function fixture(initial = []) {
  const before = canvases.length;
  const canvas = new Canvas();
  const changes = [];
  const board = new TestBoard({ canvas, onChange: state => changes.push(state) });
  board.initial = initial;
  board.writes = [];
  await board.load(`input-test-${++serial}`);
  render();
  return { board, canvas, changes, layers: canvases.slice(before + 1, before + 4), send: (type, data) => canvas.dispatchEvent(input(type, data)) };
}
function render() { const pending = [...frames.values()]; frames.clear(); for (const run of pending) run(clock); }
async function backgroundSave() {
  for (const [id, timer] of [...timers]) if (timer.delay === 600) { timers.delete(id); timer.callback(); }
  await Promise.resolve(); await Promise.resolve();
}
async function check(name, run, initial = []) {
  const f = await fixture(initial);
  try { await run(f); checked++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; }
  finally { await f.board.destroy(); render(); }
}

try {
  await check('Coalesced samples inherit pen type and preserve the carrier and tiny release endpoint', ({ board, canvas, send, changes }) => {
    send('pointerdown', { clientX: 10, clientY: 10, pressure: 0, timeStamp: 1 });
    const reads = canvas.rectReads;
    assert.equal(board.isDrawing, true);
    assert.equal(changes.at(-1).drawing, true);
    send('pointermove', { clientX: 30, clientY: 30, pressure: 0.8, timeStamp: 4, getCoalescedEvents: () => [
      { clientX: 20, clientY: 20, pressure: 0.2, timeStamp: 2 },
      { clientX: 25, clientY: 25, pressure: 0.4, timeStamp: 3 }
    ] });
    send('pointerup', { clientX: 30.04, clientY: 30.05, pressure: 0, timeStamp: 5 });
    const [stroke] = board.getOperations();
    assert.equal(stroke.points.length, 5);
    assert.deepEqual(stroke.points.map(p => Number(p[0].toFixed(6))), [20, 40, 50, 60, 60.08]);
    assert.equal(stroke.points[0][2], 0.3);
    assert.ok(stroke.points[1][2] > 0.3 && stroke.points[1][2] < 1);
    assert.ok(stroke.points.at(-1)[2] < stroke.points.at(-2)[2]);
    assert.equal(canvas.rectReads, reads, 'No layout read per coalesced point');
    assert.equal(board.isDrawing, false);
    assert.equal(changes.at(-1).drawing, false);
    assert.equal(changes.at(-1).revision, board.revision);
  });

  await check('Raw samples and subsequent pointermove are not counted twice', ({ board, send }) => {
    send('pointerdown', { timeStamp: 1, clientX: 10, clientY: 10 });
    const data = { timeStamp: 3, clientX: 30, clientY: 20, getCoalescedEvents: () => [{ timeStamp: 2, clientX: 20, clientY: 15, pressure: 0.5 }] };
    send('pointerrawupdate', data);
    send('pointermove', data);
    send('pointerrawupdate', { timeStamp: 4, clientX: 40, clientY: 30 });
    send('pointerup', { timeStamp: 5, clientX: 40, clientY: 30 });
    const points = board.getOperations()[0].points;
    assert.equal(points.filter(p => p[0] === 40).length, 1);
    assert.equal(points.filter(p => p[0] === 60).length, 1);
    assert.equal(points.at(-1)[0], 80);
  });

  await check('Saving a preceding stroke cannot cut a stroke currently in progress', async ({ board, canvas, send }) => {
    send('pointerdown', { pointerType: 'mouse', timeStamp: 1 });
    send('pointerup', { pointerType: 'mouse', timeStamp: 2, clientX: 30 });
    const revision = board.revision;
    send('pointerdown', { pointerType: 'mouse', timeStamp: 3, clientX: 50 });
    send('pointermove', { pointerType: 'mouse', timeStamp: 4, clientX: 60 });
    await backgroundSave();
    assert.equal(board.isDrawing, true);
    assert.equal(board.revision, revision);
    assert.equal(canvas.hasPointerCapture(1), true);
    assert.equal(board.writes[0].ops.length, 1);
    send('pointermove', { pointerType: 'mouse', timeStamp: 5, clientX: 70 });
    send('pointerup', { pointerType: 'mouse', timeStamp: 6, clientX: 80 });
    await board.flush();
    const operations = board.getOperations();
    assert.equal(operations.length, 2);
    assert.deepEqual(operations[1].points.map(p => p[0]), [100, 120, 140, 160]);
    assert.equal(board.writes.at(-1).ops.length, 2);
  });

  await check('Pen presence discards an accidental palm draft and keeps pen writing', ({ board, send }) => {
    send('pointerdown', { pointerType: 'touch', pointerId: 3, width: 12, height: 12 });
    send('pointermove', { pointerType: 'touch', pointerId: 3, clientX: 60, timeStamp: 1 });
    send('pointerenter', { pointerId: 7, pointerType: 'pen', buttons: 0 });
    assert.equal(board.isDrawing, false);
    send('pointerdown', { pointerId: 7, timeStamp: 2 });
    send('pointerdown', { pointerId: 4, pointerType: 'touch', isPrimary: false });
    send('pointermove', { pointerId: 7, timeStamp: 3, clientX: 70 });
    send('pointerup', { pointerId: 7, timeStamp: 4, clientX: 80 });
    assert.equal(board.getOperations().length, 1);
    assert.equal(board.getOperations()[0].type, 'pen');
    send('pointerup', { pointerId: 3, pointerType: 'touch' });
    send('pointerup', { pointerId: 4, pointerType: 'touch' });
    clock += 1000;
    send('pointerdown', { pointerId: 5, pointerType: 'touch', width: 12, height: 12, timeStamp: 6 });
    assert.equal(board.isDrawing, true, 'Finger-only drawing is restored after the pen leaves');
    send('pointerup', { pointerId: 5, pointerType: 'touch', timeStamp: 7 });
    assert.equal(board.getOperations().length, 2);
  });

  await check('Multiple touch contacts and cancelled touch gestures leave no accidental ink', ({ board, send }) => {
    send('pointerdown', { pointerType: 'touch', pointerId: 10 });
    send('pointermove', { pointerType: 'touch', pointerId: 10, clientX: 80, timeStamp: 1 });
    send('pointerdown', { pointerType: 'touch', pointerId: 11, isPrimary: false });
    assert.equal(board.isDrawing, false);
    assert.equal(board.getOperations().length, 0);
    send('pointerup', { pointerType: 'touch', pointerId: 10 });
    send('pointerup', { pointerType: 'touch', pointerId: 11 });
    send('pointerdown', { pointerType: 'touch', pointerId: 12, width: 60, height: 35 });
    assert.equal(board.isDrawing, false);
    send('pointerup', { pointerType: 'touch', pointerId: 12 });
    send('pointerdown', { pointerType: 'touch', pointerId: 13 });
    send('pointercancel', { pointerType: 'touch', pointerId: 13 });
    assert.equal(board.getOperations().length, 0);
  });

  await check('Hardware pen eraser is temporary and preserves the selected tool', ({ board, send }) => {
    board.setTool('pen');
    send('pointerdown', { button: 5, buttons: 32, timeStamp: 1 });
    send('pointermove', { button: 5, buttons: 32, timeStamp: 2, clientX: 50 });
    send('pointerup', { button: 5, timeStamp: 3, clientX: 60 });
    assert.equal(board.getOperations()[0].type, 'eraser');
    assert.equal(board.tool, 'pen');
    send('pointerdown', { button: 2, buttons: 2 });
    assert.equal(board.isDrawing, false, 'Barrel right click must not create a mark');
  });

  await check('Long strokes keep all real samples in bounded chunks and undo as one gesture', ({ board, send }) => {
    send('pointerdown', { pointerType: 'mouse', clientX: 5, clientY: 5, timeStamp: 0 });
    const samples = Array.from({ length: 8300 }, (_, i) => ({ clientX: 10 + i % 570, clientY: 20 + (i % 2) * 120, timeStamp: i + 1 }));
    const last = samples.at(-1);
    send('pointermove', { pointerType: 'mouse', ...last, getCoalescedEvents: () => samples });
    send('pointerup', { pointerType: 'mouse', ...last, timeStamp: 8301 });
    const operations = board.getOperations();
    assert.equal(operations.length, 3);
    assert.ok(operations.every(op => op.points.length <= 4096));
    assert.ok(operations.every(op => op.strokeId === operations[0].strokeId));
    const points = operations.flatMap((op, i) => i ? op.points.slice(1) : op.points);
    assert.equal(points.length, 8301);
    assert.deepEqual(points.at(-1).slice(0, 2), [last.clientX * 2, last.clientY * 2]);
    board.undo(); assert.equal(board.isEmpty, true);
    board.redo(); assert.deepEqual(board.getOperations(), operations);
    send('pointerdown', { pointerType: 'mouse', timeStamp: 9000 });
    send('pointerup', { pointerType: 'mouse', timeStamp: 9001 });
    assert.notEqual(board.getOperations().at(-1).strokeId, operations[0].strokeId);
    board.undo(); assert.equal(board.getOperations().length, 3);
  });

  const history = Array.from({ length: 500 }, (_, i) => ({ type: 'pen', color: '#ffffff', width: 3, points: [[i % 100, 0, 1], [i % 100 + 10, 10, 1]] }));
  await check('Input rendering does not redraw old history or the whole active stroke', ({ board, send, layers }) => {
    const [committed, live] = layers;
    const count = ctx => ctx.commands.filter(c => c.name === 'stroke').length;
    const oldCount = count(committed.ctx), liveStart = count(live.ctx);
    send('pointerdown', { pointerType: 'mouse', clientX: 5, clientY: 20, timeStamp: 1 }); render();
    for (let i = 1; i <= 40; i++) { send('pointermove', { pointerType: 'mouse', clientX: 5 + i, clientY: 20 + Math.sin(i / 5) * 10, timeStamp: i + 1 }); render(); }
    assert.equal(count(committed.ctx), oldCount, 'Old history stays cached throughout pen movement');
    assert.ok(count(live.ctx) - liveStart <= 42, 'Only new stable curve segments are drawn');
    send('pointerup', { pointerType: 'mouse', clientX: 45, clientY: 30, timeStamp: 50 }); render();
    assert.ok(count(committed.ctx) - oldCount < 50, 'Commit draws only the newly completed stroke');
    board.undo(); render(); assert.equal(board.getOperations().length, 500);
    board.redo(); render(); assert.equal(board.getOperations().length, 501);
  }, history);

  await check('Resize keeps the same logical canvas and current stroke', ({ board, canvas, send }) => {
    send('pointerdown', { pointerType: 'mouse', clientX: 300, clientY: 200, timeStamp: 1 });
    canvas.rect = { left: 20, top: 10, width: 300, height: 200 };
    viewport.dispatchEvent(new Event('resize'));
    assert.equal(board.isDrawing, true);
    send('pointerup', { pointerType: 'mouse', clientX: 185, clientY: 120, timeStamp: 2 });
    const stroke = board.getOperations()[0];
    assert.deepEqual(stroke.points[0].slice(0, 2), [600, 400]);
    assert.deepEqual(stroke.points.at(-1).slice(0, 2).map(v => Number(v.toFixed(6))), [660, 440]);
    canvas.rect = { left: 0, top: 0, width: 2400, height: 1600 };
    viewport.dispatchEvent(new Event('resize'));
    assert.ok(canvas.width * canvas.height < 3010000, 'Backing-store memory is bounded on large screens');
  });

  await check('A point remains a visible dot and legacy strokes remain editable', ({ board, send, layers }) => {
    send('pointerdown', { clientX: 40, clientY: 40, timeStamp: 1, pressure: 0 }); render();
    assert.ok(layers[2].ctx.commands.some(c => c.name === 'arc' && c.values[2] > 0));
    send('pointerup', { clientX: 40, clientY: 40, timeStamp: 2, pressure: 0 });
    assert.equal(board.getOperations().at(-1).points.length, 1);
    board.undo(); assert.equal(board.getOperations().length, 1);
    board.redo(); assert.equal(board.getOperations().length, 2);
    board.clear(); assert.equal(board.isEmpty, true);
  }, [{ type: 'pen', color: '#ffffff', width: 3, points: [[10, 10], [20, 20]] }]);

  await check('Page hide explicitly finishes and persists a stroke', async ({ board, send }) => {
    send('pointerdown', { timeStamp: 1 });
    send('pointermove', { clientX: 40, timeStamp: 2 });
    viewport.dispatchEvent(new Event('pagehide'));
    assert.equal(board.isDrawing, false);
    await Promise.resolve(); await Promise.resolve();
    assert.equal(board.writes.at(-1).ops.length, 1);
  });

  console.log(`Validated ${checked} blackboard input, persistence, palm, rendering and compatibility scenarios.`);
} finally {
  Date.now = realNow;
  for (const [key, descriptor] of original) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
}
