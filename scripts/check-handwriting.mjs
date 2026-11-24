import assert from 'node:assert/strict';
import { recognizeStrokes, registerSample, getSampleSnapshot, clearSamples, sampleCounts } from '../dist/handwriting.js';
import { cases, glyphs, place, row } from './handwriting-fixtures.mjs';

// Independent geometric sketches, not copies of the recognition templates.
// These are regression checks, not an estimate of real-world recognition rate.
let checks = 0;
function expression(label, input, expected, options) {
  const result = recognizeStrokes(input, options);
  assert.equal(result.expression, expected, `${label}: ${JSON.stringify(result)}`);
  assert.equal(result.unsupported, false, label);
  assert.equal(result.requiresConfirmation, true, label);
  assert.ok(result.candidates.length > 0 && result.candidates.length <= 4, label);
  assert.ok(result.candidates.every(c => Number.isFinite(c.confidence) && c.confidence >= 0 && c.confidence <= 1), label);
  checks++;
  return result;
}
function unsupported(label, input) {
  const result = recognizeStrokes(input);
  assert.equal(result.unsupported, true, `${label}: ${JSON.stringify(result)}`);
  assert.equal(result.expression, '', label);
  assert.ok(result.warnings.length > 0, label);
  checks++;
}
const pen = points => ({ type: 'pen', width: 5, points });
const chunks = (points, strokeId, type = 'pen', width = 5) => {
  const result = [];
  for (let i = 0; i < points.length; i += 4095) result.push({ type, width, strokeId, points: points.slice(i, i + 4096) });
  return result;
};

clearSamples();
for (const fixture of cases) expression(fixture.label, fixture.strokes, fixture.expected);
for (const symbol of '0123456789xyabcdπ') expression(`isolated ${symbol}`, place(symbol), symbol);

// Dense pen streams and serialized chunks describe exactly the same gesture.
const denseOne = Array.from({ length: 12001 }, (_, i) => [50, 100 * i / 12000, 0.8]);
expression('dense vertical stroke', [pen(denseOne)], '1');
expression('dense chunked stroke', chunks(denseOne, 'pen-one'), '1');
const denseTwo = place('2')[0].flatMap((p, i, stroke) => i === stroke.length - 1 ? [p] : Array.from({ length: 180 }, (_, j) => [p[0] + (stroke[i + 1][0] - p[0]) * j / 180, p[1] + (stroke[i + 1][1] - p[1]) * j / 180, 0.8]));
expression('dense curve', [pen(denseTwo)], '2');
expression('dense chunked curve', chunks(denseTwo, 'pen-two'), '2');
assert.equal(registerSample('2', chunks(denseTwo, 'training-two')).ok, true);
assert.equal(getSampleSnapshot()[0].count, 1, 'chunks are one pen-down gesture');
clearSamples();
checks++;

// Erasers act on earlier ink only. A rewrite survives; no erased digit leaks.
const eraser = Array.from({ length: 9001 }, (_, i) => [255, 75 + 115 * i / 9000, 1]);
const edited = [...row('x+1').map(pen), ...chunks(eraser, 'eraser-one', 'eraser', 100), ...place('2', 220, 80).map(pen)];
expression('erase and rewrite', edited, 'x+2');
unsupported('completely erased ink', [pen(denseOne), { type: 'eraser', width: 20, points: [[50, -10], [50, 110]] }]);
assert.equal(registerSample('-', [pen([[0, 0], [100, 0]]), { type: 'eraser', width: 10, points: [[50, -20], [50, 20]] }]).ok, true);
assert.equal(getSampleSnapshot()[0].count, 2, 'eraser cuts the middle of a two-point line');
clearSamples();
checks++;

const grid = [[[0, 0], [0, 100]], [[55, 0], [55, 100]], [[-25, 28], [80, 28]], [[-25, 72], [80, 72]]];
const scribble = [Array.from({ length: 81 }, (_, i) => [i * 2, i % 2 ? 100 : 0])];
unsupported('empty input', []);
unsupported('invalid coordinate', [[[0, 0], [NaN, 20]]]);
unsupported('unsupported grid is not pi', grid);
unsupported('scribble is not a symbol', scribble);
unsupported('unknown mark is not silently dropped', [...row('x+1'), ...scribble.map(s => s.map(p => [p[0] + 450, p[1] + 80]))]);
unsupported('bounded raw input', [{ type: 'pen', points: Array(240001).fill([0, 0, 1]) }]);
unsupported('unsupported drawing tool', [{ type: 'rect', x: 0, y: 0, w: 80, h: 100 }]);

// Worker snapshots are independent clones and the explicit option takes
// precedence over process-local samples, including an intentionally empty set.
assert.equal(registerSample('2', grid).ok, true);
const snapshot = getSampleSnapshot();
expression('personal shape in main context', grid, '2');
assert.equal(recognizeStrokes(grid, { samples: [] }).unsupported, true);
clearSamples();
expression('personal shape passed to worker', grid, '2', { samples: snapshot });
assert.equal(recognizeStrokes(grid).unsupported, true);
assert.equal(registerSample('2', place('2')).ok, true);
const copy = getSampleSnapshot();
copy[0].points[0][0] = 100;
assert.notEqual(getSampleSnapshot()[0].points[0][0], 100, 'snapshot must be a deep clone');
assert.equal(recognizeStrokes(grid, { samples: [{ ...snapshot[0], points: [[NaN, 0]] }] }).unsupported, true);
clearSamples();
checks += 4;

for (let i = 0; i < 20; i++) assert.equal(registerSample('2', place('2', i, 0, 1, { skew: i * 0.002 })).ok, true);
assert.equal(sampleCounts()['2'], 16, 'keep the most recent 16 shapes per symbol');
assert.equal(getSampleSnapshot().length, 16);
assert.equal(registerSample('unsupported', glyphs['2']).ok, false);
assert.equal(registerSample('2', []).ok, false);
const legacy = getSampleSnapshot().slice(0, 1).map(({ ends, closed, ...sample }) => sample);
clearSamples();
checks += 3;

// Existing v1 records without endpoint/loop features remain loadable. Simulate
// storage in a fresh module instance so this also covers the Worker-safe import.
const previousStorage = globalThis.localStorage;
try {
  const storage = new Map([['math-atlas-handwriting-samples-v1', JSON.stringify(legacy)]]);
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  const restored = await import('../dist/handwriting.js?legacy-regression');
  assert.equal(restored.sampleCounts()['2'], 1);
  assert.equal(restored.recognizeStrokes(place('2')).expression, '2');
  assert.equal(restored.registerSample('2', place('2')).persistent, true);
  assert.equal(JSON.parse(storage.get('math-atlas-handwriting-samples-v1')).length, 2);
  checks++;
} finally {
  if (previousStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = previousStorage;
  clearSamples();
}

console.log(`Handwriting: ${checks} checks passed (${cases.length} independent expression fixtures; dense/chunked ink, erasing, unknown rejection, sample migration and Worker snapshots).`);
