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

export const supportedSymbols = Object.freeze(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', 'y', 'a', 'b', 'c', '+', '-', '*', '/', '=', '(', ')', '.']);
export const handwritingSymbolLabels = Object.freeze({ '*': '×（掛け算）', '/': '÷・/（割り算）', '-': '−（引き算）', '.': '.（小数点）' });
const SYMBOLS = new Set(supportedSymbols);
const SAMPLE_KEY = 'math-atlas-handwriting-samples-v1';
const SAMPLE_COUNT = 64;
const MAX_SAMPLES_PER_SYMBOL = 8;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const median = values => { const s = [...values].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const quantile = (values, p) => { const s = [...values].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))] || 0; };
const point = p => Array.isArray(p) ? [Number(p[0]), Number(p[1]), clamp(Number(p[2]) || 1, 0.25, 1.6)] : p && typeof p === 'object' ? [Number(p.x), Number(p.y), clamp(Number(p.pressure) || 1, 0.25, 1.6)] : [NaN, NaN, 1];
const box = strokes => {
  const pts = strokes.flat();
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
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
  return { points, ratio: (bounds.w + scale * 0.04) / (bounds.h + scale * 0.04), ink: total / scale, count: strokes.length };
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
  const strokes = Math.min(3, Math.abs(a.count - b.count)) * 0.006;
  return shape + aspect + ink + strokes;
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

let userSamples = [];
try {
  const saved = JSON.parse(globalThis.localStorage?.getItem(SAMPLE_KEY) || '[]');
  if (Array.isArray(saved)) userSamples = saved.filter(s => SYMBOLS.has(s.symbol) && Array.isArray(s.points) && s.points.length >= 4 && s.points.length <= 100 && s.points.every(p => Array.isArray(p) && p.length === 2 && p.every(v => Number.isFinite(v) && Math.abs(v) <= 2)) && [s.ratio, s.ink, s.count].every(Number.isFinite)).slice(-supportedSymbols.length * MAX_SAMPLES_PER_SYMBOL);
} catch (_) { /* Storage is optional; recognition and session training still work. */ }

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

function normalizeInput(input) {
  const warnings = [], strokes = [];
  if (!Array.isArray(input)) return { strokes, warnings, error: '手書きの線が見つかりません。' };
  if (input.length > 120) return { strokes, warnings, error: '一度に読み取る式が大きすぎます。式を一つずつ書いてください。' };
  let ignoredText = false;
  for (const operation of input) {
    const type = Array.isArray(operation) ? 'pen' : operation?.type || 'pen';
    if (type === 'text') { ignoredText = true; continue; }
    if (!['pen', 'line', 'eraser'].includes(type)) return { strokes: [], warnings, error: '図形ツールの図は数式として読み取りません。手書きの式だけで試してください。' };
    let raw = Array.isArray(operation) ? operation : type === 'line' ? [[operation.x1, operation.y1], [operation.x2, operation.y2]] : operation?.points;
    if (!Array.isArray(raw) || raw.length > 5000) return { strokes: [], warnings, error: '線のデータが大きすぎるか、読み取れません。' };
    raw = raw.map(point);
    if (raw.some(p => p.some(v => !Number.isFinite(v) || Math.abs(v) > 100000))) return { strokes: [], warnings, error: '読み取れない座標が含まれています。' };
    if (!raw.length) continue;
    const sampled = resample(raw, clamp(Math.ceil(length(raw) / 2) + 1, raw.length === 1 ? 1 : 2, 400));
    if (type === 'eraser') {
      const radius = Math.max(3, Number(operation.width) / 2 || 10);
      const fragments = [];
      for (const ink of strokes) {
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
    if (strokes.reduce((sum, s) => sum + s.length, 0) > 12000) return { strokes: [], warnings, error: '線が多すぎます。一つの式だけにして試してください。' };
  }
  if (ignoredText) warnings.push('文字入力で置いた文字は対象外です。今回はペンで書いた線だけを読み取りました。');
  if (strokes.reduce((sum, s) => sum + s.length, 0) > 18000) return { strokes: [], warnings, error: '線が多すぎます。一つの式だけにして試してください。' };
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
function joinStrokes(strokes, em) {
  const parent = strokes.map((_, i) => i), bounds = strokes.map(s => box([s]));
  const root = i => parent[i] === i ? i : (parent[i] = root(parent[i]));
  for (let i = 0; i < strokes.length; i++) for (let j = i + 1; j < strokes.length; j++) {
    const a = bounds[i], b = bounds[j];
    const xGap = Math.max(0, a.x0 - b.x1, b.x0 - a.x1);
    if (xGap > em * 0.12 || yGap(a, b) > em * 0.75) continue;
    let near = false;
    if (xGap < em * 0.08 && yGap(a, b) < em * 0.08) {
      const sa = resample(strokes[i], 28), sb = resample(strokes[j], 28);
      outer: for (const p of sa) for (const q of sb) if (dist(p, q) < em * 0.085) { near = true; break outer; }
    }
    const stackedBars = horizontal(strokes[i]) && horizontal(strokes[j]) && xOverlap(a, b) > Math.min(a.w, b.w) * 0.65 && Math.max(a.w, b.w) < Math.min(a.w, b.w) * 1.8 && yGap(a, b) < Math.max(a.w, b.w) * 0.8;
    const dotAndBar = ((Math.max(a.w, a.h) < em * 0.15 && horizontal(strokes[j])) || (Math.max(b.w, b.h) < em * 0.15 && horizontal(strokes[i]))) && Math.abs(a.cx - b.cx) < em * 0.2 && Math.abs(a.cy - b.cy) < em * 0.65;
    if (near || stackedBars || dotAndBar) parent[root(j)] = root(i);
  }
  const groups = new Map();
  for (let i = 0; i < strokes.length; i++) { const r = root(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(strokes[i]); }
  return [...groups.values()];
}

function recognizeSymbol(strokes, em) {
  const bounds = box(strokes);
  if (Math.max(bounds.w, bounds.h) < em * 0.14 && length(strokes[0]) < em * 0.25) return [{ symbol: '.', confidence: 0.88, distance: 0.03 }];
  if (strokes.length > 7) return [];
  const candidate = cloud(strokes);
  if (candidate.ink > 8.5 || bounds.w > em * 1.9) return [];
  const scores = new Map();
  for (const template of [...builtins, ...userSamples]) {
    if (template.symbol === '.') continue;
    const distance = cloudDistance(candidate, template);
    const previous = scores.get(template.symbol);
    if (!previous || distance < previous.distance) scores.set(template.symbol, { symbol: template.symbol, distance });
  }
  const sorted = [...scores.values()].sort((a, b) => a.distance - b.distance);
  if (!sorted.length || sorted[0].distance > 0.145) return [];
  const best = sorted[0].distance;
  return sorted.filter(s => s.distance <= Math.min(0.145, best + 0.035)).slice(0, 3).map(s => ({ ...s, confidence: clamp(1 - s.distance * 3.8, 0, 0.99) }));
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
  if (!expression || !/^[0-9xyabc+*/=().^\-]+$/.test(expression)) return false;
  let depth = 0, operand = true, equals = 0;
  const tokens = expression.match(/\d*\.\d+|\d+|[xyabc]|[()+*/=^\-]/g) || [];
  if (tokens.join('') !== expression) return false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^[0-9.]|^[xyabc]$/.test(t)) { operand = false; continue; }
    if (t === '(') { depth++; operand = true; continue; }
    if (t === ')') { if (operand || --depth < 0) return false; operand = false; continue; }
    if (t === '=' && ++equals > 1) return false;
    if (operand && t !== '-' && t !== '+') return false;
    operand = true;
  }
  return depth === 0 && (!operand || expression.endsWith('='));
}

function parseInk(strokes, depth = 0) {
  const warnings = [];
  if (!strokes.length || depth > 3) return { candidates: [], warnings, error: '分数の構造を読み取れませんでした。' };
  const em = estimateSize(strokes);
  const { fractions, remaining } = fractionGroups(strokes, em);
  const nodes = joinStrokes(remaining, em).map(group => ({ box: box(group), choices: recognizeSymbol(group, em), type: 'glyph' }));
  for (const fraction of fractions) {
    const numerator = parseInk(fraction.top, depth + 1), denominator = parseInk(fraction.bottom, depth + 1);
    if (numerator.error || denominator.error) return { candidates: [], warnings, error: '分数の上または下を読み取れませんでした。文字を少し離して書いてください。' };
    const choices = [];
    for (const a of numerator.candidates.slice(0, 2)) for (const b of denominator.candidates.slice(0, 2)) choices.push({ symbol: `(${a.expression})/(${b.expression})`, confidence: Math.min(a.confidence, b.confidence) * 0.97 });
    nodes.push({ box: fraction.box, choices: choices.sort((a, b) => b.confidence - a.confidence).slice(0, 3), type: 'fraction' });
    warnings.push(...numerator.warnings, ...denominator.warnings);
  }
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
      n.choices.sort((a, b) => a.symbol === '*' ? -1 : b.symbol === '*' ? 1 : b.confidence - a.confidence);
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
      if (isRaised && !raised && current.last && /[0-9xyabc)]$/.test(expression)) { expression += '^('; raised = true; }
      else if (!isRaised && raised) { expression += ')'; raised = false; }
      else if (isRaised && !raised) continue;
      if (isRaised && current.last && n.box.x0 - current.last.x1 > baseSize * 0.8) continue;
      if (n.type === 'fraction') symbol = `(${symbol})`;
      expression += symbol;
      const scores = [...current.scores, choice.confidence];
      next.push({ expression, scores, confidence: Math.min(...scores) * 0.55 + (scores.reduce((a, b) => a + b, 0) / scores.length) * 0.45, last: n.box, raised });
    }
    beam = next.sort((a, b) => b.confidence - a.confidence).slice(0, 24);
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

export function recognizeStrokes(operations) {
  const normalized = normalizeInput(operations);
  const base = { expression: '', candidates: [], warnings: normalized.warnings, unsupported: true, engine: 'local-stroke-templates', scoreLabel: '形の一致度（認識精度の確率ではありません）', requiresConfirmation: true };
  if (normalized.error) return { ...base, warnings: [...base.warnings, normalized.error] };
  if (!normalized.strokes.length) return { ...base, warnings: [...base.warnings, 'ペンで一つの式を書いてください。'] };
  const result = parseInk(normalized.strokes);
  const warnings = [...new Set([...base.warnings, ...result.warnings])];
  if (result.error) return { ...base, warnings: [...warnings, result.error] };
  if (result.candidates[0].confidence < 0.53) return { ...base, warnings: [...warnings, '形があいまいなため、式として確定できませんでした。書き直すか、一文字を覚えさせてください。'] };
  return { ...base, expression: result.candidates[0].expression, candidates: result.candidates, confidence: result.candidates[0].confidence, warnings, unsupported: false };
}
