// Independent handwriting fixtures, drawn for regression testing. These are
// not imported from the recognizer's built-in templates or training samples.
const join = (...parts) => parts.flatMap((part, i) => i ? part.slice(1) : part);
const line = (...points) => points;
function cubic(a, b, c, d, n = 24) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, q = 1 - t;
    return [q ** 3 * a[0] + 3 * q * q * t * b[0] + 3 * q * t * t * c[0] + t ** 3 * d[0], q ** 3 * a[1] + 3 * q * q * t * b[1] + 3 * q * t * t * c[1] + t ** 3 * d[1]];
  });
}
const oval = (cx, cy, rx, ry, start = -Math.PI / 2, end = start + 2 * Math.PI) => Array.from({ length: 65 }, (_, i) => { const t = start + (end - start) * i / 64; return [cx + rx * Math.cos(t) + 1.1 * Math.sin(3 * t), cy + ry * Math.sin(t)]; });
export const glyphs = {
  '0': [oval(32, 51, 29, 49)],
  '1': [line([20, 20], [38, 1], [37, 101])],
  '2': [join(cubic([2, 25], [9, -7], [68, -8], [68, 22]), cubic([68, 22], [72, 43], [21, 72], [3, 98]), line([3, 98], [73, 99]))],
  '3': [join(cubic([4, 9], [67, -19], [87, 42], [30, 48]), cubic([30, 48], [88, 41], [89, 112], [7, 93]))],
  '4': [line([7, 1], [6, 59], [73, 57]), line([56, 3], [55, 104])],
  '5': [join(line([71, 3], [12, 4], [9, 47]), cubic([9, 47], [62, 20], [91, 78], [51, 98]), cubic([51, 98], [33, 107], [12, 101], [1, 87]))],
  '6': [join(cubic([61, 4], [25, -9], [-8, 73], [12, 93]), cubic([12, 93], [51, 123], [92, 69], [47, 50]), cubic([47, 50], [34, 43], [16, 55], [10, 73]))],
  '7': [line([3, 4], [75, 2], [25, 100])],
  '8': [Array.from({ length: 101 }, (_, i) => { const t = i * Math.PI * 2 / 100; return [36 + 30 * Math.sin(2 * t), 50 + 49 * Math.sin(t)]; })],
  '9': [join(oval(31, 29, 29, 27, 0), line([60, 29], [58, 70], [43, 102]))],
  'x': [cubic([1, 4], [28, 32], [47, 75], [69, 100]), cubic([70, 2], [54, 26], [23, 71], [0, 99])],
  'y': [line([0, 2], [26, 50], [58, 39]), cubic([70, 0], [50, 45], [28, 91], [11, 110])],
  'a': [join(oval(29, 57, 28, 39, 0), line([57, 57], [59, 16], [60, 97], [76, 99]))],
  'b': [line([1, 0], [0, 101]), oval(28, 72, 28, 29, Math.PI)],
  'c': [cubic([69, 12], [-16, -35], [-20, 136], [70, 89])],
  'd': [oval(31, 70, 29, 30, 0), line([60, 2], [61, 101])],
  'π': [cubic([0, 20], [26, 10], [67, 15], [91, 18]), line([27, 17], [20, 100]), cubic([71, 17], [67, 66], [61, 108], [88, 97])],
  '+': [line([1, 51], [76, 49]), line([38, 11], [39, 92])],
  '-': [line([0, 49], [76, 51])],
  '*': [line([0, 14], [71, 86]), line([72, 13], [0, 87])],
  '/': [line([4, 98], [67, 1])],
  '÷': [line([0, 48], [76, 49]), line([38, 9], [39, 11]), line([37, 88], [38, 90])],
  '=': [line([1, 29], [75, 27]), line([0, 72], [76, 74])],
  '(': [cubic([33, 0], [-4, 23], [-6, 78], [34, 101])],
  ')': [cubic([0, 1], [40, 22], [42, 78], [0, 102])],
  '.': [line([2, 2], [3.4, 3])]
};
export function place(symbol, x = 0, y = 0, scale = 1, { skew = 0, width = 1, jitter = 0, reverse = false } = {}) {
  let strokes = glyphs[symbol].map((stroke, si) => stroke.map((p, i) => [x + scale * (p[0] * width + p[1] * skew + jitter * Math.sin(i * 1.71 + si)), y + scale * (p[1] + jitter * Math.sin(i * 2.13 + si)), 0.8]));
  if (reverse) strokes = strokes.reverse().map(stroke => stroke.reverse());
  return strokes;
}
export function row(symbols, options = {}) {
  let x = 20; const result = [];
  for (const symbol of symbols) { result.push(...place(symbol, x, symbol === '.' ? 175 : 80, 1, options)); x += symbol === '.' ? 24 : 100; }
  return result;
}
export const cases = [
  { label: 'equation', expected: 'y=2x+1', strokes: row('y=2x+1') },
  { label: 'decimal', expected: '0.5x+1', strokes: row('0.5x+1') },
  { label: 'curves and subtraction', expected: '6-9', strokes: row('6-9') },
  { label: 'division sign', expected: '8/2', strokes: row('8÷2') },
  { label: 'numeric multiplication', expected: '2*3', strokes: row('2*3') },
  { label: 'close neighboring glyphs', expected: 'x+1', strokes: [...place('x', 0, 80), ...place('+', 74, 80), ...place('1', 153, 80)] },
  { label: 'close parallel digits stay separate', expected: '11', strokes: [[[30, 0], [32, 100]], [[39, 0], [40, 100]]] },
  { label: 'fragmented zero joins across short gaps', expected: '0', strokes: [glyphs['0'][0].slice(1, 31), glyphs['0'][0].slice(33, 63)] },
  { label: 'slanted handwriting', expected: '2x+1', strokes: row('2x+1', { skew: 0.16, width: 0.85, jitter: 0.8 }) },
  { label: 'reverse stroke order and direction', expected: 'x+1', strokes: row('x+1').reverse().map(stroke => stroke.reverse()) },
  { label: 'small handwriting', expected: 'x+1', strokes: row('x+1').map(stroke => stroke.map(p => [p[0] * 0.23, p[1] * 0.23, p[2]])) },
  { label: 'coefficient d', expected: 'd+1', strokes: row('d+1') },
  { label: 'pi constant', expected: '2π', strokes: row('2π') },
  { label: 'exponent', expected: 'x^(2)+1', strokes: [...place('x', 20, 100), ...place('2', 100, 54, 0.46), ...place('+', 158, 100), ...place('1', 250, 100)] },
  { label: 'stacked fraction', expected: '((x+1)/(2))', strokes: [...place('x', 20, 20, 0.6), ...place('+', 80, 20, 0.6), ...place('1', 140, 20, 0.6), [[12, 94, 1], [195, 94, 1]], ...place('2', 76, 111, 0.6)] }
];
