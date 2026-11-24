/**
 * Local, constrained mathematical ink recognition; no upload, API or model fetch.
 * Original geometric templates + orientation-preserving point-cloud matching.
 * Point-cloud recognition background: Vatavu, Anthony & Wobbrock (2012),
 * https://depts.washington.edu/ilab/proj/dollar/pdollar.html
 * No third-party source code or trained model weights are included.
 *
 * `confidence` is a heuristic shape-match score, NOT a measured probability.
 * Consumers must preview candidates and require confirmation before solving.
 * Connected handwriting, prose and arbitrary mathematical notation are outside
 * this recognizer's supported scope. Unknown marks are rejected, never omitted.
 */

export const supportedSymbols = Object.freeze(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', 'y', 'a', 'b', 'c', 'd', 'π', '+', '-', '*', '/', '=', '(', ')', '.']);
export const handwritingSymbolLabels = Object.freeze({ '*': '×（掛け算）', '/': '÷・/（割り算）', '-': '−（引き算）', '.': '.（小数点）', 'π': 'π（円周率）' });
const SYMBOLS = new Set(supportedSymbols);
const SAMPLE_KEY = 'math-atlas-handwriting-samples-v1';
const SAMPLE_COUNT = 64;
const MAX_SAMPLES_PER_SYMBOL = 16;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const median = values => { const s = [...values].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const quantile = (values, p) => { const s = [...values].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))] || 0; };
const pressure = value => Number.isFinite(Number(value)) ? clamp(Number(value), 0.18, 1.6) : 1;
const point = p => Array.isArray(p) ? [Number(p[0]), Number(p[1]), pressure(p[2])] : p && typeof p === 'object' ? [Number(p.x), Number(p.y), pressure(p.pressure)] : [NaN, NaN, 1];
const box = strokes => {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const stroke of strokes) for (const p of stroke) {
    x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
    y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
  }
  if (!Number.isFinite(x0)) return { x0: 0, x1: 0, y0: 0, y1: 0, w: 0, h: 0, cx: 0, cy: 0 };
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
};
const length = stroke => stroke.slice(1).reduce((sum, p, i) => sum + dist(p, stroke[i]), 0);
function segmentDistance(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy;
  const t = len2 ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2, 0, 1) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
function resample(stroke, count) {
  if (!stroke.length) return [];
  if (count <= 1 || stroke.length === 1) return Array.from({ length: Math.max(1, count) }, () => [...stroke[0]]);
  const cumulative = [0];
  for (let i = 1; i < stroke.length; i++) cumulative.push(cumulative.at(-1) + dist(stroke[i - 1], stroke[i]));
  const total = cumulative.at(-1);
  if (!total) return Array.from({ length: count }, () => [...stroke[0]]);
  let j = 1;
  return Array.from({ length: count }, (_, i) => {
    const target = total * i / (count - 1);
    while (j < stroke.length - 1 && cumulative[j] < target) j++;
    const t = (target - cumulative[j - 1]) / (cumulative[j] - cumulative[j - 1] || 1);
    const result = [stroke[j - 1][0] + (stroke[j][0] - stroke[j - 1][0]) * t, stroke[j - 1][1] + (stroke[j][1] - stroke[j - 1][1]) * t];
    if (Number.isFinite(stroke[j - 1][2]) && Number.isFinite(stroke[j][2])) result.push(stroke[j - 1][2] + (stroke[j][2] - stroke[j - 1][2]) * t);
    return result;
  });
}
function cloud(strokes) {
  const bounds = box(strokes), scale = Math.max(bounds.w, bounds.h, 1);
  const lengths = strokes.map(length), total = lengths.reduce((a, b) => a + b, 0);
  const allocation = lengths.map(l => Math.max(2, Math.round(SAMPLE_COUNT * l / (total || 1))));
  let count = allocation.reduce((a, b) => a + b, 0);
  while (count > SAMPLE_COUNT) { const i = allocation.indexOf(Math.max(...allocation)); if (allocation[i] <= 2) break; allocation[i]--; count--; }
  while (count < SAMPLE_COUNT) { const i = lengths.indexOf(Math.max(...lengths)); allocation[i]++; count++; }
  const points = strokes.flatMap((s, i) => resample(s, allocation[i]).map(p => [(p[0] - bounds.cx) / scale, (p[1] - bounds.cy) / scale]));
  const ends = [], closed = [];
  for (const stroke of strokes) {
    if (length(stroke) < scale * 0.22) continue;
    const loop = dist(stroke[0], stroke.at(-1)) < scale * 0.18 && length(stroke) > scale * 1.5;
    closed.push(loop);
    if (!loop) for (const p of [stroke[0], stroke.at(-1)]) ends.push([(p[0] - bounds.cx) / scale, (p[1] - bounds.cy) / scale]);
  }
  return { points, ratio: (bounds.w + scale * 0.04) / (bounds.h + scale * 0.04), ink: total / scale, count: strokes.length, ends, closed: closed.some(Boolean) };
}
function cloudDistance(a, b) {
  const directed = (from, to) => from.reduce((sum, p) => {
    let best = Infinity;
    for (const q of to) best = Math.min(best, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2);
    return sum + Math.sqrt(best);
  }, 0) / from.length;
  const shape = (directed(a.points, b.points) + directed(b.points, a.points)) / 2;
  const aspect = Math.min(1.4, Math.abs(Math.log(a.ratio / b.ratio))) * 0.035;
  const ink = Math.min(2, Math.abs(Math.log((a.ink + 0.1) / (b.ink + 0.1)))) * 0.018;
  // Stroke order and direction do not matter; fragmented/retraced strokes only
  // receive a very small penalty. Endpoints help distinguish open 6/9 from 0.
  const strokes = Math.min(3, Math.abs(a.count - b.count)) * 0.003;
  const endpoints = a.ends?.length && b.ends?.length ? Math.min(0.6, (directed(a.ends, b.ends) + directed(b.ends, a.ends)) / 2) * 0.025 : 0;
  const closure = typeof a.closed === 'boolean' && typeof b.closed === 'boolean' && a.closed !== b.closed ? 0.009 : 0;
  return shape + aspect + ink + strokes + endpoints + closure;
}

// Hand-authored templates. Coordinates describe pen centerlines, not font data.
const ellipse = (cx, cy, rx, ry, start = 0, end = Math.PI * 2) => Array.from({ length: 37 }, (_, i) => [cx + rx * Math.cos(start + (end - start) * i / 36), cy + ry * Math.sin(start + (end - start) * i / 36)]);
const builtins = [];
const add = (symbol, ...strokes) => builtins.push({ symbol, ...cloud(strokes) });
add('0', ellipse(35, 50, 35, 50));
add('0', [[35, 0], [10, 10], [0, 40], [5, 80], [25, 100], [50, 95], [70, 70], [68, 25], [55, 5], [35, 0]]);
add('1', [[50, 0], [50, 100]]);
add('1', [[20, 22], [45, 0], [45, 100]]);
add('1', [[15, 25], [40, 0], [40, 100]], [[12, 100], [70, 100]]);
add('2', [[5, 20], [20, 3], [45, 0], [65, 10], [70, 28], [60, 45], [5, 100], [75, 100]]);
add('2', [[0, 25], [15, 5], [45, 0], [65, 12], [65, 35], [45, 58], [5, 90], [0, 100], [70, 100]]);
add('3', [[5, 10], [30, 0], [60, 6], [70, 25], [55, 43], [30, 50], [52, 50], [70, 67], [63, 90], [38, 100], [5, 90]]);
add('3', [[0, 0], [65, 0], [30, 45], [55, 45], [73, 65], [65, 90], [40, 100], [5, 90]]);
add('4', [[60, 0], [0, 65], [80, 65]], [[60, 0], [60, 100]]);
add('4', [[0, 0], [0, 58], [75, 58]], [[60, 5], [60, 100]]);
add('5', [[70, 0], [10, 0], [5, 45], [35, 40], [60, 48], [72, 70], [62, 93], [35, 100], [5, 90]]);
add('5', [[5, 0], [5, 50], [30, 40], [60, 48], [72, 70], [60, 95], [30, 100], [0, 90]], [[5, 0], [70, 0]]);
add('6', [[65, 5], [45, 0], [20, 20], [5, 57], [8, 82], [27, 100], [55, 95], [70, 75], [60, 55], [35, 48], [12, 62]]);
add('6', [[65, 0], [30, 20], [5, 60], [8, 85], [30, 100], [55, 95], [65, 75], [57, 55], [32, 50], [10, 65]]);
add('7', [[0, 0], [80, 0], [20, 100]]);
add('7', [[0, 10], [70, 0], [15, 100]], [[12, 48], [60, 48]]);
add('8', [[38, 50], [15, 35], [10, 15], [30, 0], [55, 4], [65, 22], [54, 40], [38, 50], [15, 65], [8, 85], [30, 100], [58, 94], [70, 73], [55, 57], [38, 50]]);
add('8', ellipse(35, 25, 27, 25), ellipse(35, 73, 35, 27));
add('9', [[65, 40], [48, 55], [20, 50], [5, 34], [10, 12], [30, 0], [58, 10], [70, 38], [58, 80], [38, 100]]);
add('9', ellipse(32, 28, 30, 28), [[62, 0], [62, 100]]);
add('x', [[0, 0], [65, 100]], [[65, 0], [0, 100]]);
add('x', [[0, 0], [100, 100]], [[100, 0], [0, 100]]);
add('x', [[0, 10], [18, 25], [42, 75], [65, 90]], [[65, 10], [48, 25], [18, 75], [0, 90]]);
add('*', [[0, 0], [100, 100]], [[100, 0], [0, 100]]);
add('*', [[0, 0], [65, 100]], [[65, 0], [0, 100]]);
add('*', [[50, 0], [50, 100]], [[5, 25], [95, 75]], [[95, 25], [5, 75]]);
add('y', [[0, 0], [35, 50], [70, 0]], [[35, 50], [28, 90], [10, 110]]);
add('y', [[0, 0], [25, 50], [55, 40]], [[70, 0], [10, 110]]);
add('a', ellipse(31, 57, 30, 40), [[63, 15], [63, 98], [75, 100]]);
add('a', [[65, 30], [48, 15], [20, 20], [0, 50], [5, 85], [30, 100], [55, 85], [65, 50]], [[65, 15], [65, 100]]);
add('b', [[0, 0], [0, 100]], ellipse(30, 70, 30, 30));
add('b', [[0, 0], [0, 100], [25, 100], [53, 90], [65, 65], [50, 45], [25, 42], [0, 55]]);
add('c', ellipse(40, 50, 40, 50, Math.PI * 0.25, Math.PI * 1.75));
add('c', [[70, 12], [50, 0], [20, 8], [0, 35], [0, 70], [20, 95], [50, 100], [70, 85]]);
add('+', [[0, 50], [100, 50]], [[50, 0], [50, 100]]);
add('-', [[0, 0], [100, 0]]);
add('/', [[0, 100], [65, 0]]);
add('/', [[0, 50], [100, 50]], [[50, 8], [50, 10]], [[50, 90], [50, 92]]);
add('=', [[0, 25], [100, 25]], [[0, 75], [100, 75]]);
add('(', [[35, 0], [15, 20], [2, 50], [12, 80], [35, 100]]);
add(')', [[0, 0], [20, 20], [33, 50], [23, 80], [0, 100]]);
add('.', [[0, 0], [1, 1]]);
// Common handwritten alternatives: open-top 4, curved 2/7, looped x and d/pi.
add('2', [[5, 18], [21, 0], [52, 4], [68, 22], [55, 48], [12, 78], [0, 96], [33, 100], [75, 91]]);
add('3', [[0, 2], [45, 0], [62, 15], [54, 35], [27, 46], [53, 50], [72, 67], [66, 91], [42, 102], [4, 93]]);
add('4', [[50, 0], [8, 54], [0, 62], [78, 62]], [[57, 0], [57, 104]]);
add('5', [[64, 0], [9, 0], [4, 48], [32, 37], [61, 49], [72, 74], [56, 96], [23, 99], [1, 87]]);
add('6', [[60, 0], [32, 8], [10, 35], [1, 68], [12, 94], [35, 103], [59, 93], [68, 70], [54, 51], [28, 51], [4, 70]]);
add('7', [[0, 8], [71, 0], [56, 30], [36, 65], [22, 103]]);
add('9', [[63, 38], [52, 54], [29, 57], [8, 45], [0, 23], [12, 3], [37, 0], [58, 15], [65, 46], [59, 79], [38, 105]]);
add('x', [[0, 8], [20, 0], [36, 12], [42, 47], [32, 83], [14, 100], [0, 91]], [[79, 4], [61, 1], [45, 23], [39, 61], [47, 91], [65, 100], [80, 91]]);
add('a', [[58, 37], [47, 18], [25, 15], [5, 35], [0, 72], [17, 95], [43, 91], [59, 65], [61, 15], [61, 98], [78, 100]]);
add('d', ellipse(31, 69, 30, 31), [[62, 0], [62, 102]]);
add('d', [[63, 0], [63, 99], [39, 100], [12, 89], [0, 64], [12, 42], [39, 37], [62, 48]]);
add('π', [[0, 15], [95, 15]], [[26, 15], [21, 69], [10, 100]], [[73, 15], [69, 88], [81, 100], [95, 91]]);
add('π', [[0, 20], [15, 8], [96, 8]], [[28, 8], [23, 97]], [[74, 8], [73, 96]]);


function validatedSamples(value) {
  if (!Array.isArray(value)) return [];
  const valid = value.slice(-supportedSymbols.length * MAX_SAMPLES_PER_SYMBOL).filter(s =>
    s && SYMBOLS.has(s.symbol) && Array.isArray(s.points) && s.points.length >= 4 && s.points.length <= 100 &&
    s.points.every(p => Array.isArray(p) && p.length === 2 && p.every(v => Number.isFinite(v) && Math.abs(v) <= 2)) &&
    Number.isFinite(s.ratio) && s.ratio > 0 && s.ratio < 100 && Number.isFinite(s.ink) && s.ink >= 0 && s.ink <= 20 &&
    Number.isInteger(s.count) && s.count > 0 && s.count <= 12);
  return valid.map(s => ({ symbol: s.symbol, points: s.points.map(p => [...p]), ratio: s.ratio, ink: s.ink, count: s.count,
    ...(Array.isArray(s.ends) && s.ends.length <= 24 && s.ends.every(p => Array.isArray(p) && p.length === 2 && p.every(v => Number.isFinite(v) && Math.abs(v) <= 2)) ? { ends: s.ends.map(p => [...p]) } : {}),
    ...(typeof s.closed === 'boolean' ? { closed: s.closed } : {}) }));
}
let userSamples = [];
try { userSamples = validatedSamples(JSON.parse(globalThis.localStorage?.getItem(SAMPLE_KEY) || '[]')); }
catch (_) { /* Workers and restricted storage still support recognition. */ }

/** Clone only validated shape features; safe to structured-clone to a worker. */
export function getSampleSnapshot() { return validatedSamples(userSamples); }

function saveSamples() {
  try { if (!globalThis.localStorage) return false; globalThis.localStorage.setItem(SAMPLE_KEY, JSON.stringify(userSamples)); return true; }
  catch (_) { return false; }
}
export function clearSamples() {
  const count = userSamples.length;
  userSamples = [];
  saveSamples();
  return { ok: true, count };
}
export function sampleCounts() { return Object.fromEntries(supportedSymbols.map(symbol => [symbol, userSamples.filter(s => s.symbol === symbol).length])); }

function cleanStroke(raw) {
  if (raw.length < 2) return raw;
  const b = box([raw]);
  const tolerance = clamp(Math.max(b.w, b.h) * 0.0008, 0.015, 0.3);
  const points = [raw[0]];
  for (let i = 1; i < raw.length - 1; i++) if (dist(raw[i], points.at(-1)) >= tolerance) points.push(raw[i]);
  if (dist(points.at(-1), raw.at(-1)) > 0) points.push(raw.at(-1));
  const sampled = resample(points, clamp(Math.ceil(length(points) / 1.5) + 1, points.length === 1 ? 1 : 2, 320));
  // Reduce small sampling jitter without rounding a sharp mathematical corner.
  return sampled.map((p, i) => {
    if (!i || i === sampled.length - 1) return p;
    const a = sampled[i - 1], b = sampled[i + 1];
    const ux = p[0] - a[0], uy = p[1] - a[1], vx = b[0] - p[0], vy = b[1] - p[1];
    const cosine = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1);
    return cosine > 0.45 ? [a[0] * 0.15 + p[0] * 0.7 + b[0] * 0.15, a[1] * 0.15 + p[1] * 0.7 + b[1] * 0.15, p[2]] : p;
  });
}

function normalizeInput(input) {
  const warnings = [], strokes = [];
  if (!Array.isArray(input)) return { strokes, warnings, error: '手書きの線が見つかりません。' };
  if (input.length > 2400) return { strokes, warnings, error: '一度に読み取る式が大きすぎます。式を一つずつ書いてください。' };
  let ignoredText = false, rawCount = 0;
  const logical = [];
  for (const operation of input) {
    const type = Array.isArray(operation) ? 'pen' : operation?.type || 'pen';
    if (type === 'text') { ignoredText = true; continue; }
    if (!['pen', 'line', 'eraser'].includes(type)) return { strokes, warnings, error: '図形ツールの図は数式として読み取りません。手書きの式だけで試してください。' };
    const raw = Array.isArray(operation) ? operation : type === 'line' ? [[operation.x1, operation.y1], [operation.x2, operation.y2]] : operation?.points;
    if (!Array.isArray(raw) || (rawCount += raw.length) > 240000) return { strokes: [], warnings, error: '線のデータが大きすぎるか、読み取れません。' };
    const previous = logical.at(-1), id = typeof operation?.strokeId === 'string' ? operation.strokeId : '';
    // Dense pen streams can be saved in chunks. Rejoin only adjacent chunks of
    // the same physical stroke, not separate pen-down gestures or eraser edits.
    if (id && previous?.id === id && previous.type === type && previous.width === operation.width) {
      const start = previous.raw.length && raw.length && dist(point(previous.raw.at(-1)), point(raw[0])) < 0.0001 ? 1 : 0;
      for (let i = start; i < raw.length; i++) previous.raw.push(raw[i]);
    } else logical.push({ type, width: operation?.width, raw: raw.slice(), id });
    if (logical.length > 180) return { strokes: [], warnings, error: '一つの短い式だけを書いて試してください。' };
  }
  for (const operation of logical) {
    const raw = operation.raw.map(point);
    if (raw.some(p => p.some(v => !Number.isFinite(v) || Math.abs(v) > 100000))) return { strokes: [], warnings, error: '読み取れない座標が含まれています。' };
    if (!raw.length) continue;
    const sampled = cleanStroke(raw);
    if (operation.type === 'eraser') {
      const radius = Math.max(1, Number(operation.width) / 2 || 10), eb = box([sampled]);
      const fragments = [];
      for (const ink of strokes) {
        const ib = box([ink]);
        if (ib.x1 < eb.x0 - radius * 1.6 || ib.x0 > eb.x1 + radius * 1.6 || ib.y1 < eb.y0 - radius * 1.6 || ib.y0 > eb.y1 + radius * 1.6) { fragments.push(ink); continue; }
        let run = [];
        for (const p of ink) {
          let erased = sampled.length === 1 && dist(p, sampled[0]) <= radius * (sampled[0][2] || 1);
          for (let j = 1; !erased && j < sampled.length; j++) erased = segmentDistance(p, sampled[j - 1], sampled[j]) <= radius * (((sampled[j - 1][2] || 1) + (sampled[j][2] || 1)) / 2);
          if (erased) { if (run.length) fragments.push(run); run = []; }
          else run.push(p);
        }
        if (run.length) fragments.push(run);
      }
      strokes.splice(0, strokes.length, ...fragments);
    } else strokes.push(sampled);
    if (strokes.length > 220 || strokes.reduce((sum, stroke) => sum + stroke.length, 0) > 28000) return { strokes: [], warnings, error: '線が多すぎます。一つの式だけにして試してください。' };
  }
  if (ignoredText) warnings.push('文字入力で置いた文字は対象外です。今回はペンで書いた線だけを読み取りました。');
  return { strokes, warnings };
}

export function registerSample(symbol, operations) {
  symbol = ({ '×': '*', '÷': '/', '−': '-' })[symbol] || symbol;
  if (!SYMBOLS.has(symbol)) return { ok: false, message: '対応している一文字を選んでください。' };
  const input = normalizeInput(operations);
  if (input.error) return { ok: false, message: input.error };
  if (!input.strokes.length) return { ok: false, message: '覚えさせる一文字をペンで書いてください。' };
  if (input.strokes.length > 8) return { ok: false, message: '一文字だけを、線を重ねずに書いてください。' };
  const bounds = box(input.strokes);
  if (symbol !== '.' && Math.max(bounds.w, bounds.h) < 8) return { ok: false, message: 'もう少し大きく一文字を書いてください。' };
  const sample = { symbol, ...cloud(input.strokes) };
  if (sample.ink > 10) return { ok: false, message: '線が重なりすぎています。一文字だけ書き直してください。' };
  const same = userSamples.filter(s => s.symbol === symbol);
  if (same.length >= MAX_SAMPLES_PER_SYMBOL) userSamples.splice(userSamples.findIndex(s => s.symbol === symbol), 1);
  userSamples.push(sample);
  const persistent = saveSamples();
  return { ok: true, symbol, count: userSamples.filter(s => s.symbol === symbol).length, persistent, message: persistent ? 'このブラウザに字の形を覚えました。' : 'この画面を開いている間、字の形を覚えます。' };
}

function estimateSize(strokes) {
  const bounds = strokes.map(s => box([s]));
  const tall = bounds.filter(b => b.h > 8 && b.h > b.w * 0.28).map(b => b.h);
  return clamp(quantile(tall, 0.65) || median(bounds.map(b => Math.max(b.w, b.h))) || 50, 10, 400);
}
const horizontal = stroke => {
  const b = box([stroke]);
  return b.w > 8 && b.h < b.w * 0.15 && length(stroke) < b.w * 1.3;
};
const xOverlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
const yGap = (a, b) => Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
function joinStrokes(strokes, em, mode = 'balanced') {
  const proximity = { strict: 0.028, balanced: 0.085, loose: 0.14 }[mode];
  const parent = strokes.map((_, i) => i), bounds = strokes.map(s => box([s]));
  const root = i => parent[i] === i ? i : (parent[i] = root(parent[i]));
  for (let i = 0; i < strokes.length; i++) for (let j = i + 1; j < strokes.length; j++) {
    const a = bounds[i], b = bounds[j];
    const xGap = Math.max(0, a.x0 - b.x1, b.x0 - a.x1);
    if (xGap > em * Math.max(0.12, proximity) || yGap(a, b) > em * 0.75) continue;
    let near = false;
    if (xGap < em * proximity && yGap(a, b) < em * proximity) {
      const sa = resample(strokes[i], 28), sb = resample(strokes[j], 28);
      outer: for (const p of sa) for (const q of sb) if (dist(p, q) < em * proximity) { near = true; break outer; }
    }
    const stackedBars = horizontal(strokes[i]) && horizontal(strokes[j]) && xOverlap(a, b) > Math.min(a.w, b.w) * 0.65 && Math.max(a.w, b.w) < Math.min(a.w, b.w) * 1.8 && yGap(a, b) < Math.max(a.w, b.w) * 0.8;
    const dotAndBar = ((Math.max(a.w, a.h) < em * 0.15 && horizontal(strokes[j])) || (Math.max(b.w, b.h) < em * 0.15 && horizontal(strokes[i]))) && Math.abs(a.cx - b.cx) < em * 0.2 && Math.abs(a.cy - b.cy) < em * 0.65;
    if (near || stackedBars || dotAndBar) parent[root(j)] = root(i);
  }
  const groups = new Map();
  for (let i = 0; i < strokes.length; i++) { const r = root(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(strokes[i]); }
  return [...groups.values()];
}

function transformedCloud(input, shear, xScale) {
  const transform = p => [p[0] * xScale + p[1] * shear, p[1]];
  const points = input.points.map(transform), b = box([points]), scale = Math.max(b.w, b.h, 0.01);
  const normalized = p => [(p[0] - b.cx) / scale, (p[1] - b.cy) / scale];
  return { ...input, points: points.map(normalized), ends: input.ends?.map(transform).map(normalized),
    ratio: (b.w + scale * 0.04) / (b.h + scale * 0.04) };
}
function geometricCandidates(strokes, em) {
  const b = box(strokes), straight = stroke => stroke.length > 1 && length(stroke) <= dist(stroke[0], stroke.at(-1)) * 1.07;
  const choices = [];
  const offer = (symbol, distance) => choices.push({ symbol, distance });
  if (strokes.length === 1 && straight(strokes[0])) {
    const stroke = strokes[0], dx = stroke.at(-1)[0] - stroke[0][0], dy = stroke.at(-1)[1] - stroke[0][1];
    if (b.w > em * 0.25 && b.h < b.w * 0.16) offer('-', 0.008 + b.h / b.w * 0.08);
    else if (b.h > em * 0.3 && b.w < b.h * 0.23) offer('1', 0.012 + b.w / b.h * 0.05);
    else if (dx * dy < 0 && b.w > b.h * 0.3 && b.w < b.h * 1.7) offer('/', 0.025);
  }
  if (strokes.length === 2 && strokes.every(horizontal)) {
    const [a, c] = strokes.map(stroke => box([stroke]));
    if (xOverlap(a, c) > Math.min(a.w, c.w) * 0.7 && Math.max(a.w, c.w) / Math.min(a.w, c.w) < 1.45 && yGap(a, c) > Math.max(a.w, c.w) * 0.08 && yGap(a, c) < Math.max(a.w, c.w) * 0.85) offer('=', 0.012);
  }
  if (strokes.length === 2 && strokes.every(straight)) {
    const [a, c] = strokes, ax = a.at(-1)[0] - a[0][0], ay = a.at(-1)[1] - a[0][1], cx = c.at(-1)[0] - c[0][0], cy = c.at(-1)[1] - c[0][1];
    const det = ax * cy - ay * cx;
    const vx = c[0][0] - a[0][0], vy = c[0][1] - a[0][1];
    const t = (vx * cy - vy * cx) / det, u = (vx * ay - vy * ax) / det;
    if (Number.isFinite(t) && t > 0.2 && t < 0.8 && u > 0.2 && u < 0.8) {
      const aHorizontal = Math.abs(ay) < Math.abs(ax) * 0.25, cHorizontal = Math.abs(cy) < Math.abs(cx) * 0.25;
      const aVertical = Math.abs(ax) < Math.abs(ay) * 0.25, cVertical = Math.abs(cx) < Math.abs(cy) * 0.25;
      if (aHorizontal && cVertical || cHorizontal && aVertical) offer('+', 0.012);
      else if (ax * ay * cx * cy < 0) { offer('x', 0.018); offer('*', 0.018); }
    }
  }
  if (strokes.length === 3) {
    const bars = strokes.filter(horizontal), dots = strokes.filter(stroke => { const q = box([stroke]); return Math.max(q.w, q.h) < em * 0.18; });
    if (bars.length === 1 && dots.length === 2) {
      const q = box([bars[0]]), [a, c] = dots.map(stroke => box([stroke])).sort((a, c) => a.cy - c.cy);
      if (a.cy < q.cy && c.cy > q.cy && Math.abs(a.cx - q.cx) < em * 0.2 && Math.abs(c.cx - q.cx) < em * 0.2) offer('/', 0.01);
    }
  }
  return choices;
}
function isUnsupportedGrid(strokes, em) {
  // A hash/grid has two distinct crossbars and two stems. None of the built-in
  // symbols explains all four lines; a cloud-only match can otherwise call it
  // pi or 4. Explicitly taught personal shapes can still override this veto.
  const straight = stroke => stroke.length > 1 && length(stroke) <= dist(stroke[0], stroke.at(-1)) * 1.08;
  const bars = strokes.filter(stroke => horizontal(stroke) && box([stroke]).w > em * 0.5).map(stroke => box([stroke]));
  const stems = strokes.filter(stroke => { const b = box([stroke]); return straight(stroke) && b.h > em * 0.5 && b.w < b.h * 0.2; }).map(stroke => box([stroke]));
  for (let i = 0; i < bars.length; i++) for (let j = i + 1; j < bars.length; j++) {
    if (Math.abs(bars[i].cy - bars[j].cy) < em * 0.18) continue;
    const crossing = stems.filter(stem => [bars[i], bars[j]].every(bar => stem.cx >= bar.x0 && stem.cx <= bar.x1 && bar.cy >= stem.y0 && bar.cy <= stem.y1));
    if (crossing.some((stem, k) => crossing.slice(k + 1).some(other => Math.abs(stem.cx - other.cx) > em * 0.18))) return true;
  }
  return false;
}
function recognizeSymbol(strokes, em, context) {
  const key = strokes.map(stroke => context.ids.get(stroke)).sort((a, b) => a - b).join(',') + ':' + Math.round(em * 10);
  if (context.cache.has(key)) return context.cache.get(key);
  const bounds = box(strokes);
  if (Math.max(bounds.w, bounds.h) < em * 0.14 && length(strokes[0]) < em * 0.25) return [{ symbol: '.', confidence: 0.91, distance: 0.024 }];
  if (strokes.length > 10) return [];
  const candidate = cloud(strokes);
  if (candidate.ink > 9 || bounds.w > em * 2.1) return [];
  const scores = new Map();
  const grid = isUnsupportedGrid(strokes, em);
  const ranked = context.templates.filter(template => template.symbol !== '.' && (!grid || template.personal)).map(template => ({ template, distance: cloudDistance(candidate, template) })).sort((a, b) => a.distance - b.distance);
  const variants = [[-0.16, 1], [0.16, 1], [0, 0.82], [0, 1.2]].map(([shear, width]) => transformedCloud(candidate, shear, width));
  for (let i = 0; i < ranked.length; i++) {
    const { template } = ranked[i];
    let distance = ranked[i].distance;
    // Adapt only a small shortlist: no arbitrary rotation that could turn 6 into
    // 9, or '-' into '1'. The regularization favors the unmodified handwriting.
    if (i < 10 && distance < 0.23) for (const variant of variants) distance = Math.min(distance, cloudDistance(variant, template) + 0.008);
    if (template.personal && distance < 0.09) distance = Math.max(0, distance - 0.006);
    const previous = scores.get(template.symbol);
    if (!previous || distance < previous.distance) scores.set(template.symbol, { symbol: template.symbol, distance });
  }
  for (const choice of geometricCandidates(strokes, em)) {
    if (!scores.has(choice.symbol) || choice.distance < scores.get(choice.symbol).distance) scores.set(choice.symbol, choice);
  }
  const sorted = [...scores.values()].sort((a, b) => a.distance - b.distance);
  const best = sorted[0]?.distance ?? Infinity;
  const result = best > 0.145 ? [] : sorted.filter(choice => choice.distance <= Math.min(0.145, best + 0.038)).slice(0, 4).map(choice => ({ ...choice, confidence: clamp(1 - choice.distance * 3.8, 0, 0.99) }));
  context.cache.set(key, result);
  return result;
}

function fractionGroups(strokes, em) {
  const used = new Set(), groups = [];
  const bars = strokes.map((s, i) => ({ i, s, b: box([s]) })).filter(o => horizontal(o.s) && o.b.w > em * 0.5).sort((a, b) => b.b.w - a.b.w);
  for (const bar of bars) {
    if (used.has(bar.i)) continue;
    const top = [], bottom = [];
    let crossing = false;
    for (let i = 0; i < strokes.length; i++) {
      if (i === bar.i || used.has(i)) continue;
      const b = box([strokes[i]]);
      if (b.x0 < bar.b.x0 - em * 0.14 || b.x1 > bar.b.x1 + em * 0.14) continue;
      if (b.y1 < bar.b.cy - em * 0.035 && b.y0 > bar.b.cy - em * 1.65) top.push(i);
      else if (b.y0 > bar.b.cy + em * 0.035 && b.y1 < bar.b.cy + em * 1.65) bottom.push(i);
      else if (b.y0 < bar.b.cy && b.y1 > bar.b.cy) crossing = true;
    }
    if (crossing || !top.length || !bottom.length) continue;
    const topBox = box(top.map(i => strokes[i])), bottomBox = box(bottom.map(i => strokes[i]));
    // Two dots around a bar form a division sign, not a stacked fraction.
    if (Math.max(topBox.w, topBox.h) < em * 0.25 && Math.max(bottomBox.w, bottomBox.h) < em * 0.25) continue;
    if (bar.b.cy - topBox.y1 > em * 0.5 || bottomBox.y0 - bar.b.cy > em * 0.5) continue;
    if (top.every(i => horizontal(strokes[i])) || bottom.every(i => horizontal(strokes[i]))) continue;
    const indices = [...top, bar.i, ...bottom];
    indices.forEach(i => used.add(i));
    groups.push({ top: top.map(i => strokes[i]), bottom: bottom.map(i => strokes[i]), box: box(indices.map(i => strokes[i])) });
  }
  return { fractions: groups, remaining: strokes.filter((_, i) => !used.has(i)) };
}

function validExpression(expression) {
  if (!expression || !/^[0-9xyabcdπ+*/=().^\-]+$/.test(expression)) return false;
  let depth = 0, operand = true, equals = 0, previous = '';
  const tokens = expression.match(/\d*\.\d+|\d+|[xyabcdπ]|[()+*/=^\-]/g) || [];
  if (tokens.join('') !== expression) return false;
  for (const t of tokens) {
    if (/^[0-9.]|^[xyabcdπ]$/.test(t)) {
      if (/^[0-9.]/.test(t) && /^[0-9.]/.test(previous)) return false;
      operand = false;
    } else if (t === '(') { depth++; operand = true; }
    else if (t === ')') { if (operand || --depth < 0) return false; operand = false; }
    else {
      if (t === '=' && (depth || ++equals > 1)) return false;
      if (operand && t !== '-' && t !== '+') return false;
      operand = true;
    }
    previous = t;
  }
  return depth === 0 && (!operand || expression.endsWith('='));
}

function decodeNodes(nodes, em) {
  const warnings = [];
  nodes.sort((a, b) => a.box.x0 - b.box.x0);
  if (!nodes.length || nodes.length > 36) return { candidates: [], warnings, error: '一つの短い式だけを書いて試してください。' };
  const unknown = nodes.findIndex(n => !n.choices.length || n.choices[0].confidence < 0.60);
  if (unknown >= 0) return { candidates: [], warnings, error: `${unknown + 1} 文字目付近の形を判断できませんでした。書き直すか、一文字の書き方を覚えさせてください。` };
  const largeNodes = nodes.filter(n => n.type === 'glyph' && n.box.h > em * 0.65);
  const baseline = median(largeNodes.map(n => n.box.y1)) || median(nodes.map(n => n.box.y1));
  const baseSize = median(largeNodes.map(n => n.box.h)) || em;
  let beam = [{ expression: '', confidence: 1, scores: [], last: null, raised: false }];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (i > 0 && i < nodes.length - 1 && nodes[i - 1].choices.every(c => /^[0-9.]$/.test(c.symbol)) && nodes[i + 1].choices.every(c => /^[0-9.]$/.test(c.symbol)) && n.choices.some(c => c.symbol === '*') && n.choices.some(c => c.symbol === 'x')) {
      n.choices = [...n.choices].sort((a, b) => a.symbol === '*' ? -1 : b.symbol === '*' ? 1 : b.confidence - a.confidence);
    }
    const isSmallOperator = n.choices.every(c => ['+', '-', '*', '/', '='].includes(c.symbol));
    const isRaised = n.type === 'glyph' && n.choices[0].symbol !== '=' && n.box.h < baseSize * 0.85 && (isSmallOperator || n.choices[0].symbol === '.' ? n.box.cy < baseline - baseSize * 0.80 : n.box.y1 < baseline - baseSize * 0.28);
    if (!isRaised && n.type === 'glyph' && n.box.h > baseSize * 0.4 && Math.abs(n.box.y1 - baseline) > baseSize * 0.75) return { candidates: [], warnings, error: '複数行や上下の配置を判断できませんでした。一行の式、または一つの分数に分けてください。' };
    if (n.choices.length > 1 && n.choices[0].confidence - n.choices[1].confidence < 0.10) warnings.push(`${i + 1} 文字目付近に似た形の候補があります。候補の式を確認してください。`);
    const next = [];
    for (const current of beam) for (const choice of n.choices) {
      let symbol = choice.symbol, expression = current.expression, raised = current.raised;
      if ((symbol === 'x' || symbol === '*') && n.choices.some(c => c.symbol === 'x') && n.choices.some(c => c.symbol === '*')) {
        warnings.push('x（文字）と ×（掛け算）は似た形です。式に合う候補を選んでください。');
      }
      if (isRaised && !raised && current.last && /[0-9xyabcdπ)]$/.test(expression)) { expression += '^('; raised = true; }
      else if (!isRaised && raised) { expression += ')'; raised = false; }
      else if (isRaised && !raised) continue;
      if (isRaised && current.last && n.box.x0 - current.last.x1 > baseSize * 0.8) continue;
      if (n.type === 'fraction') symbol = `(${symbol})`;
      // The analysis engine accepts explicit products of named coefficients.
      // Adjacent digits stay a multi-digit number; a following raised glyph
      // has already opened its exponent above.
      if (/[xyabcdπ]$/.test(expression) && /^[xyabcdπ0-9]/.test(symbol)) expression += '*';
      expression += symbol;
      const scores = [...current.scores, choice.confidence];
      next.push({ expression, scores, confidence: Math.min(...scores) * 0.55 + (scores.reduce((a, b) => a + b, 0) / scores.length) * 0.45, last: n.box, raised });
    }
    beam = next.sort((a, b) => b.confidence - a.confidence).slice(0, 32);
  }
  const unique = new Map();
  for (const candidate of beam) {
    const expression = candidate.expression + (candidate.raised ? ')' : '');
    if (!validExpression(expression)) continue;
    if (!unique.has(expression)) unique.set(expression, { expression, confidence: Number(candidate.confidence.toFixed(3)) });
  }
  const candidates = [...unique.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  if (!candidates.length) return { candidates, warnings, error: '線の形は見つかりましたが、数式としてつながりませんでした。文字や記号の間を空けて書き直してください。' };
  return { candidates, warnings, nodes };
}

function parseInk(strokes, context, depth = 0) {
  const warnings = [];
  if (!strokes.length || depth > 3) return { candidates: [], warnings, error: '分数の構造を読み取れませんでした。' };
  const em = estimateSize(strokes);
  const { fractions, remaining } = fractionGroups(strokes, em);
  const structural = [];
  for (const fraction of fractions) {
    const numerator = parseInk(fraction.top, context, depth + 1), denominator = parseInk(fraction.bottom, context, depth + 1);
    if (numerator.error || denominator.error) return { candidates: [], warnings, error: '分数の上または下を読み取れませんでした。文字を少し離して書いてください。' };
    const choices = [];
    for (const a of numerator.candidates.slice(0, 2)) for (const b of denominator.candidates.slice(0, 2)) choices.push({ symbol: `(${a.expression})/(${b.expression})`, confidence: Math.min(a.confidence, b.confidence) * 0.97 });
    structural.push({ box: fraction.box, choices: choices.sort((a, b) => b.confidence - a.confidence).slice(0, 3), type: 'fraction' });
    warnings.push(...numerator.warnings, ...denominator.warnings);
  }
  const partitions = new Set(), unique = new Map();
  let lastError = '';
  for (const mode of ['balanced', 'strict', 'loose']) {
    const groups = joinStrokes(remaining, em, mode);
    const fingerprint = groups.map(group => group.map(stroke => context.ids.get(stroke)).sort((a, b) => a - b).join(',')).sort().join('|');
    if (partitions.has(fingerprint)) continue;
    partitions.add(fingerprint);
    const nodes = groups.map(group => ({ box: box(group), choices: recognizeSymbol(group, em, context), type: 'glyph' }));
    const result = decodeNodes([...nodes, ...structural], em);
    if (result.error) { lastError = result.error; continue; }
    for (const candidate of result.candidates) {
      const previous = unique.get(candidate.expression);
      if (!previous || candidate.confidence > previous.confidence) unique.set(candidate.expression, candidate);
    }
    warnings.push(...result.warnings);
  }
  const candidates = [...unique.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  if (!candidates.length) return { candidates, warnings, error: lastError || '線の形から数式を判断できませんでした。' };
  if (partitions.size > 1 && candidates.length > 1) warnings.push('文字の切れ目も含めて候補を比較しました。式全体を確認してください。');
  return { candidates, warnings };
}

export function recognizeStrokes(operations, { samples } = {}) {
  const normalized = normalizeInput(operations);
  const base = { expression: '', candidates: [], warnings: normalized.warnings, unsupported: true, engine: 'local-ink-ensemble', scoreLabel: '形の一致度（認識精度の確率ではありません）', requiresConfirmation: true };
  if (normalized.error) return { ...base, warnings: [...base.warnings, normalized.error] };
  if (!normalized.strokes.length) return { ...base, warnings: [...base.warnings, 'ペンで一つの式を書いてください。'] };
  const personal = samples === undefined ? userSamples : validatedSamples(samples);
  const context = { templates: [...builtins, ...personal.map(sample => ({ ...sample, personal: true }))], cache: new Map(), ids: new WeakMap() };
  normalized.strokes.forEach((stroke, index) => context.ids.set(stroke, index));
  const result = parseInk(normalized.strokes, context);
  const warnings = [...new Set([...base.warnings, ...result.warnings])];
  if (result.error) return { ...base, warnings: [...warnings, result.error] };
  if (result.candidates[0].confidence < 0.53) return { ...base, warnings: [...warnings, '形があいまいなため、式として確定できませんでした。書き直すか、一文字を覚えさせてください。'] };
  return { ...base, expression: result.candidates[0].expression, candidates: result.candidates, confidence: result.candidates[0].confidence, warnings, unsupported: false };
}
