/** Safe, browser-local real-number formula analysis. No source-code evaluation. */
const DEFAULT_PARAMETERS = Object.freeze({ a: 1, b: 0, c: 0, d: 0 });
const FUNCTIONS = new Set(['sqrt', 'abs', 'sin', 'cos', 'tan', 'exp', 'log', 'ln']);
const PARAMETER_NAMES = ['a', 'b', 'c', 'd'];
const MAX_EXPRESSION = 300;
const MAX_NODES = 160;
const MAX_DEPTH = 48;
const MAX_POLYNOMIAL_DEGREE = 32;
const MAX_VALUE = 1e100;
const MAX_INPUT_VALUE = 1e12;
const MAX_RANGE = 1e6;
const SAMPLE_COUNT = 201;
const MAX_DATA = 60;
const EPS = Number.EPSILON;

function fail(message) { throw new Error(message); }
function bounded(value) { return Number.isFinite(value) && Math.abs(value) <= MAX_VALUE ? value : NaN; }
function fmt(value, digits = 10) {
  if (!Number.isFinite(value)) return '定義できません';
  if (Object.is(value, -0) || value === 0) return '0';
  return String(Number(value.toPrecision(digits)));
}
function normalizeInput(value) {
  return String(value ?? '').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, s => '^' + [...s].map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''))
    .normalize('NFKC').replace(/[−–—﹣]/g, '-').replace(/[×·⋅]/g, '*').replace(/[÷]/g, '/')
    .replace(/π/g, 'pi').replace(/√/g, 'sqrt').trim();
}
function parametersWithDefaults(parameters = {}) {
  if (parameters === null || typeof parameters !== 'object' || Array.isArray(parameters)) fail('係数は a、b、c、d の数値で指定してください。');
  const result = { ...DEFAULT_PARAMETERS };
  for (const key of PARAMETER_NAMES) {
    if (Object.prototype.hasOwnProperty.call(parameters, key)) {
      const value = parameters[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > MAX_INPUT_VALUE) fail(`係数 ${key} は、絶対値が1兆以下の有限の数にしてください。`);
      result[key] = value;
    }
  }
  return result;
}

function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (/\s/.test(text[i])) { i++; continue; }
    const remaining = text.slice(i);
    const number = remaining.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) {
      const value = Number(number[0]);
      if (!Number.isFinite(value) || Math.abs(value) > MAX_VALUE) fail(`${i + 1}文字目の数値が大きすぎます。`);
      tokens.push({ type: 'number', value, at: i }); i += number[0].length; continue;
    }
    const name = remaining.match(/^[a-zA-Z_][a-zA-Z_0-9]*/);
    if (name) {
      const value = name[0].toLowerCase();
      if (!['x', 'a', 'b', 'c', 'd', 'pi', 'e'].includes(value) && !FUNCTIONS.has(value)) fail(`「${name[0]}」は使えません。変数は x、係数は a・b・c・d、関数は sin(x) のように書いてください。`);
      tokens.push({ type: FUNCTIONS.has(value) ? 'function' : 'name', value, at: i }); i += name[0].length; continue;
    }
    if ('+-*/^()'.includes(text[i])) { tokens.push({ type: text[i], value: text[i], at: i }); i++; continue; }
    fail(`${i + 1}文字目の「${text[i]}」は式に使えません。掛け算は *、累乗は ^ を使えます。`);
  }
  const result = [];
  const end = new Set(['number', 'name', ')']);
  const start = new Set(['number', 'name', 'function', '(']);
  for (const token of tokens) {
    const previous = result[result.length - 1];
    if (previous && end.has(previous.type) && start.has(token.type)) {
      if (previous.type === 'number' && token.type === 'number') fail(`${token.at + 1}文字目の前に演算記号が必要です。数値の間は * などでつないでください。`);
      result.push({ type: '*', value: '*', at: token.at, implicit: true });
    }
    result.push(token);
  }
  result.push({ type: 'end', at: text.length });
  return result;
}

function parseTree(text) {
  const tokens = tokenize(text);
  let cursor = 0, nodes = 0, depth = 0;
  const current = () => tokens[cursor];
  const take = type => current().type === type ? tokens[cursor++] : null;
  const node = value => { if (++nodes > MAX_NODES) fail('式が複雑すぎます。演算を減らすか、式を分けてください。'); return value; };
  function guarded(fn) {
    if (++depth > MAX_DEPTH) fail('かっこや累乗の入れ子が深すぎます。式を簡単にしてください。');
    try { return fn(); } finally { depth--; }
  }
  function sum() {
    let left = product();
    while (current().type === '+' || current().type === '-') {
      const op = tokens[cursor++].type;
      left = node({ type: 'binary', op, left, right: product() });
    }
    return left;
  }
  function product() {
    let left = unary();
    while (current().type === '*' || current().type === '/') {
      const op = tokens[cursor++].type;
      left = node({ type: 'binary', op, left, right: unary() });
    }
    return left;
  }
  function unary() {
    return guarded(() => {
      if (take('+')) return unary();
      if (take('-')) return node({ type: 'unary', value: unary() });
      return power();
    });
  }
  function power() {
    let left = primary();
    if (take('^')) left = node({ type: 'binary', op: '^', left, right: unary() });
    return left;
  }
  function primary() {
    const token = current();
    if (take('number')) return node({ type: 'number', value: token.value });
    if (take('name')) return node({ type: 'variable', name: token.value });
    if (take('function')) {
      if (!take('(')) fail(`${token.value} の引数はかっこで囲んでください。例: ${token.value}(x)`);
      if (current().type === ')') fail(`${token.value} のかっこの中に数や式を入れてください。`);
      const argument = guarded(sum);
      if (!take(')')) fail(`${token.value} の閉じかっこ ) がありません。`);
      return node({ type: 'call', name: token.value, argument });
    }
    if (take('(')) {
      if (current().type === ')') fail('空のかっこは使えません。中に数や式を入れてください。');
      const value = guarded(sum);
      if (!take(')')) fail('閉じかっこ ) がありません。');
      return value;
    }
    if (token.type === 'end') fail('式の末尾に数や変数が必要です。');
    fail(`${token.at + 1}文字目付近に、数・変数・関数が必要です。`);
  }
  const tree = sum();
  if (current().type !== 'end') fail(current().type === ')' ? '閉じかっこ ) が多すぎます。' : `${current().at + 1}文字目以降の式を確認してください。`);
  return tree;
}

function operate(op, a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
  if (op === '+') return bounded(a + b);
  if (op === '-') return bounded(a - b);
  if (op === '*') return bounded(a * b);
  if (op === '/') return b === 0 ? NaN : bounded(a / b);
  if (op === '^') {
    if (Math.abs(b) > 1024 || (a === 0 && b <= 0) || (a < 0 && !Number.isInteger(b))) return NaN;
    return bounded(Math.pow(a, b));
  }
  return NaN;
}
function callFunction(name, value) {
  if (!Number.isFinite(value)) return NaN;
  if (name === 'sqrt') return value < 0 ? NaN : bounded(Math.sqrt(value));
  if (name === 'abs') return bounded(Math.abs(value));
  if (name === 'ln') return value <= 0 ? NaN : bounded(Math.log(value));
  if (name === 'log') return value <= 0 ? NaN : bounded(Math.log10(value));
  if (name === 'exp') return bounded(Math.exp(value));
  if (['sin', 'cos', 'tan'].includes(name) && Math.abs(value) > MAX_INPUT_VALUE) return NaN;
  if (name === 'sin') return bounded(Math.sin(value));
  if (name === 'cos') return bounded(Math.cos(value));
  if (name === 'tan') return Math.abs(Math.cos(value)) < 1e-12 ? NaN : bounded(Math.tan(value));
  return NaN;
}
function evaluateNode(tree, x, parameters) {
  if (tree.type === 'number') return tree.value;
  if (tree.type === 'variable') return tree.name === 'x' ? x : tree.name === 'pi' ? Math.PI : tree.name === 'e' ? Math.E : parameters[tree.name];
  if (tree.type === 'unary') return bounded(-evaluateNode(tree.value, x, parameters));
  if (tree.type === 'call') return callFunction(tree.name, evaluateNode(tree.argument, x, parameters));
  return operate(tree.op, evaluateNode(tree.left, x, parameters), evaluateNode(tree.right, x, parameters));
}
function hasX(tree) {
  if (tree.type === 'variable') return tree.name === 'x';
  if (tree.type === 'unary') return hasX(tree.value);
  if (tree.type === 'call') return hasX(tree.argument);
  if (tree.type === 'binary') return hasX(tree.left) || hasX(tree.right);
  return false;
}
function trimPolynomial(coefficients) {
  const result = coefficients.slice();
  while (result.length > 1 && result[result.length - 1] === 0) result.pop();
  return result.every(c => Number.isFinite(c) && Math.abs(c) <= MAX_VALUE) ? result : null;
}
function addPolynomial(a, b, sign = 1) {
  return trimPolynomial(Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + sign * (b[i] || 0)));
}
function multiplyPolynomial(a, b) {
  if (a.length + b.length - 2 > MAX_POLYNOMIAL_DEGREE) return null;
  const result = Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) result[i + j] += a[i] * b[j];
  return trimPolynomial(result);
}
function polynomialOf(tree, parameters) {
  if (!hasX(tree)) {
    const value = evaluateNode(tree, 0, parameters);
    return Number.isFinite(value) ? [value] : null;
  }
  if (tree.type === 'variable') return [0, 1];
  if (tree.type === 'unary') { const value = polynomialOf(tree.value, parameters); return value && value.map(c => -c); }
  if (tree.type !== 'binary') return null;
  const a = polynomialOf(tree.left, parameters), b = polynomialOf(tree.right, parameters);
  if (!a || !b) return null;
  if (tree.op === '+') return addPolynomial(a, b);
  if (tree.op === '-') return addPolynomial(a, b, -1);
  if (tree.op === '*') return multiplyPolynomial(a, b);
  if (tree.op === '/') return b.length === 1 && b[0] !== 0 ? trimPolynomial(a.map(c => c / b[0])) : null;
  if (tree.op === '^' && b.length === 1 && Number.isInteger(b[0]) && b[0] >= 0 && b[0] <= MAX_POLYNOMIAL_DEGREE) {
    // Keep the original domain: this engine leaves 0^0 undefined, so x-dependent
    // bases to power zero must not be described as an everywhere-defined polynomial.
    if (b[0] === 0 && hasX(tree.left)) return null;
    let result = [1];
    for (let i = 0; i < b[0]; i++) { result = multiplyPolynomial(result, a); if (!result) return null; }
    return result;
  }
  return null;
}

const numberNode = value => ({ type: 'number', value });
function simplifyBinary(op, left, right) {
  if (left.type === 'number' && right.type === 'number') {
    const value = operate(op, left.value, right.value);
    if (Number.isFinite(value)) return numberNode(value);
  }
  const is = (node, value) => node.type === 'number' && node.value === value;
  if (op === '+' && is(left, 0)) return right;
  if ((op === '+' || op === '-') && is(right, 0)) return left;
  if (op === '*' && (is(left, 0) || is(right, 0))) return numberNode(0);
  if (op === '*' && is(left, 1)) return right;
  if (op === '*' && is(right, 1)) return left;
  if (op === '/' && is(left, 0)) return numberNode(0);
  if ((op === '/' || op === '^') && is(right, 1)) return left;
  if (op === '^' && is(right, 0)) return numberNode(1);
  return { type: 'binary', op, left, right };
}
function derivativeTree(tree, parameters, budget = { nodes: 0 }) {
  if (++budget.nodes > 240) return null;
  if (!hasX(tree)) return numberNode(0);
  if (tree.type === 'variable') return numberNode(1);
  if (tree.type === 'unary') {
    const d = derivativeTree(tree.value, parameters, budget);
    return d && simplifyBinary('*', numberNode(-1), d);
  }
  const bin = simplifyBinary;
  if (tree.type === 'call') {
    const u = tree.argument, du = derivativeTree(u, parameters, budget);
    if (!du || tree.name === 'abs') return null;
    const call = name => ({ type: 'call', name, argument: u });
    if (tree.name === 'sin') return bin('*', call('cos'), du);
    if (tree.name === 'cos') return bin('*', bin('*', numberNode(-1), call('sin')), du);
    if (tree.name === 'tan') return bin('/', du, bin('^', call('cos'), numberNode(2)));
    if (tree.name === 'exp') return bin('*', call('exp'), du);
    if (tree.name === 'ln') return bin('/', du, u);
    if (tree.name === 'log') return bin('/', du, bin('*', u, numberNode(Math.log(10))));
    if (tree.name === 'sqrt') return bin('/', du, bin('*', numberNode(2), call('sqrt')));
    return null;
  }
  const u = tree.left, v = tree.right;
  const du = derivativeTree(u, parameters, budget), dv = derivativeTree(v, parameters, budget);
  if (!du || !dv) return null;
  if (tree.op === '+' || tree.op === '-') return bin(tree.op, du, dv);
  if (tree.op === '*') return bin('+', bin('*', du, v), bin('*', u, dv));
  if (tree.op === '/') return bin('/', bin('-', bin('*', du, v), bin('*', u, dv)), bin('^', v, numberNode(2)));
  if (tree.op === '^' && !hasX(v)) {
    const exponent = evaluateNode(v, 0, parameters);
    if (!Number.isFinite(exponent)) return null;
    return bin('*', bin('*', numberNode(exponent), bin('^', u, numberNode(exponent - 1))), du);
  }
  return null;
}
function formatTree(tree, parameters = null) {
  function visit(node, parent = 0, rightSide = false, parentOp = '') {
    if (node.type === 'number') {
      const text = fmt(node.value, 12);
      return node.value < 0 && parent >= 3 ? `(${text})` : text;
    }
    if (node.type === 'variable') {
      if (!parameters || !PARAMETER_NAMES.includes(node.name)) return node.name;
      const value = parameters[node.name], text = fmt(value, 12);
      return value < 0 && parent >= 3 ? `(${text})` : text;
    }
    if (node.type === 'call') return `${node.name}(${visit(node.argument)})`;
    if (node.type === 'unary') { const value = `-${visit(node.value, 3)}`; return parent > 3 ? `(${value})` : value; }
    const precedence = ['+', '-'].includes(node.op) ? 1 : ['*', '/'].includes(node.op) ? 2 : 4;
    const lhs = visit(node.left, node.op === '^' ? precedence + 1 : precedence, false, node.op);
    const rhs = visit(node.right, precedence, true, node.op);
    const result = `${lhs} ${node.op} ${rhs}`;
    const nonAssociativeRight = rightSide && precedence === parent && (parentOp === '-' || parentOp === '/' || (parentOp === '*' && node.op === '/'));
    return precedence < parent || nonAssociativeRight ? `(${result})` : result;
  }
  return visit(tree);
}
function polynomialExpression(coefficients, variable = 'x', digits = 12) {
  const terms = [];
  for (let power = coefficients.length - 1; power >= 0; power--) {
    const coefficient = coefficients[power];
    if (coefficient === 0) continue;
    const value = fmt(Math.abs(coefficient), digits);
    let term = power === 0 ? value : `${value === '1' ? '' : value + '*'}${variable}${power > 1 ? '^' + power : ''}`;
    if (!terms.length) { if (coefficient < 0) term = '-' + term; }
    else term = (coefficient < 0 ? ' - ' : ' + ') + term;
    terms.push(term);
  }
  return terms.join('') || '0';
}
function compileFormula(input, parameters) {
  if (typeof input !== 'string') fail('公式を文字で入力してください。例: x^2 + 2x + 1');
  if (input.length > MAX_EXPRESSION) fail(`公式は${MAX_EXPRESSION}文字以内で入力してください。`);
  let display = normalizeInput(input).replace(/^(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, '');
  if (!display) fail('公式を入力してください。例: x^2 + 2x + 1');
  if (display.length > MAX_EXPRESSION) fail(`変換後の公式は${MAX_EXPRESSION}文字以内にしてください。`);
  const values = parametersWithDefaults(parameters), tree = parseTree(display);
  const evaluate = x => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= MAX_INPUT_VALUE ? evaluateNode(tree, x, values) : NaN;
  const polynomial = polynomialOf(tree, values);
  let derivative = null;
  if (polynomial) {
    const coefficients = polynomial.length === 1 ? [0] : polynomial.slice(1).map((c, index) => c * (index + 1));
    derivative = polynomialExpression(coefficients);
  } else {
    const d = derivativeTree(tree, values);
    if (d) { const text = formatTree(d, values); if (text.length <= 500) derivative = text; }
  }
  return { evaluate, display, polynomial, derivative, tree, parameters: values };
}

export function parseFormula(input, parameters = DEFAULT_PARAMETERS) {
  const { evaluate, display, polynomial, derivative } = compileFormula(input, parameters);
  return { evaluate, display, polynomial, derivative };
}

function validateRange(xMin = -5, xMax = 5) {
  if (typeof xMin !== 'number' || typeof xMax !== 'number' || !Number.isFinite(xMin) || !Number.isFinite(xMax)) fail('表示範囲の最小値と最大値は有限の数で入力してください。');
  if (xMin >= xMax) fail('表示範囲は、最小値が最大値より小さくなるようにしてください。');
  if (Math.abs(xMin) > MAX_RANGE || Math.abs(xMax) > MAX_RANGE) fail('表示範囲は −1,000,000 から 1,000,000 の間で指定してください。');
  if (xMax - xMin < Math.max(1, Math.abs(xMin), Math.abs(xMax)) * 1e-12) fail('表示範囲が狭すぎて数値を区別できません。最小値と最大値を少し離してください。');
  return { xMin, xMax };
}
function validateData(data = []) {
  if (!Array.isArray(data)) fail('データは x と y の組の配列にしてください。');
  if (data.length > MAX_DATA) fail(`データは${MAX_DATA}点までにしてください。`);
  return data.map((point, index) => {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || !Number.isFinite(point.x) || !Number.isFinite(point.y) || Math.abs(point.x) > MAX_INPUT_VALUE || Math.abs(point.y) > MAX_INPUT_VALUE) fail(`${index + 1}番目のデータは、絶対値が1兆以下の有限の x と y にしてください。`);
    return { x: point.x, y: point.y };
  });
}

export function parseData(text) {
  if (typeof text !== 'string') fail('データは1行ごとに x,y の形式で入力してください。');
  if (text.length > 20000) fail('データの文字数が多すぎます。60点以内に整理してください。');
  const result = [];
  const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].normalize('NFKC').replace(/[−–—﹣]/g, '-').replace(/、/g, ',').trim();
    if (!line) continue;
    const parts = line.includes(',') ? line.split(',').map(s => s.trim()) : line.split(/\s+/);
    if (parts.length !== 2 || !parts.every(value => numeric.test(value))) fail(`${i + 1}行目を確認してください。「2,5」のように x と y の二つの数だけを入力します。`);
    const x = Number(parts[0]), y = Number(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > MAX_INPUT_VALUE || Math.abs(y) > MAX_INPUT_VALUE) fail(`${i + 1}行目の数値が大きすぎます。絶対値が1兆以下の有限の数にしてください。`);
    result.push({ x, y });
    if (result.length > MAX_DATA) fail(`${i + 1}行目でデータが${MAX_DATA}点を超えました。`);
  }
  return result;
}
function metricsFor(data, predict) {
  if (!data.length) return null;
  let squared = 0, absolute = 0, total = 0;
  const mean = data.reduce((m, point, i) => m + (point.y - m) / (i + 1), 0);
  for (const point of data) {
    const predicted = predict(point.x);
    if (!Number.isFinite(predicted)) return null;
    const error = predicted - point.y;
    squared += error * error;
    absolute += Math.abs(error);
    total += (point.y - mean) ** 2;
  }
  const rmse = Math.sqrt(squared / data.length), mae = absolute / data.length;
  return { rmse, mae, r2: total === 0 ? null : 1 - squared / total };
}

function rootEstimates(compiled, points, xMin, xMax) {
  const evaluate = compiled.evaluate, polynomial = compiled.polynomial;
  const roots = [], span = xMax - xMin;
  const dedupe = Math.max(1e-9, Math.min(1e-5, span * 1e-7));
  const add = value => {
    if (Number.isFinite(value) && value >= xMin && value <= xMax && Number.isFinite(evaluate(value)) && !roots.some(r => Math.abs(r - value) < dedupe)) roots.push(value);
  };
  // Exact low-degree structure also finds touching roots missed by a sign-change scan.
  if (polynomial && polynomial.length <= 3) {
    if (polynomial.length === 2) add(-polynomial[0] / polynomial[1]);
    if (polynomial.length === 3) {
      const [c, b, a] = polynomial;
      const coefficientScale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c));
      const aa = a / coefficientScale, bb = b / coefficientScale, cc = c / coefficientScale;
      const discriminant = bb * bb - 4 * aa * cc;
      if (discriminant === 0) add(-bb / (2 * aa));
      if (discriminant > 0) {
        const q = -0.5 * (bb + (bb >= 0 ? 1 : -1) * Math.sqrt(discriminant));
        add(q / aa); if (q !== 0) add(cc / q);
      }
    }
    return roots.sort((a, b) => a - b);
  }
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!Number.isFinite(point.y)) continue;
    if (point.y === 0) add(point.x);
    else if (i > 0 && i < points.length - 1 && Number.isFinite(points[i - 1].y) && Number.isFinite(points[i + 1].y)) {
      const nearby = Math.min(Math.abs(points[i - 1].y), Math.abs(points[i + 1].y));
      if (nearby > 0 && Math.abs(point.y) <= nearby * 1e-9) add(point.x);
    }
    if (i === points.length - 1) continue;
    const next = points[i + 1];
    if (!Number.isFinite(next.y) || point.y === 0 || next.y === 0 || Math.sign(point.y) === Math.sign(next.y)) continue;
    let a = point.x, b = next.x, fa = point.y, fb = next.y;
    const tolerance = Math.max(Number.MIN_VALUE, Math.max(Math.abs(fa), Math.abs(fb)) * 1e-9);
    let bestX = Math.abs(fa) < Math.abs(fb) ? a : b, bestY = Math.min(Math.abs(fa), Math.abs(fb));
    for (let iteration = 0; iteration < 80; iteration++) {
      const middle = a + (b - a) / 2;
      if (middle === a || middle === b) break;
      const value = evaluate(middle);
      if (!Number.isFinite(value)) break;
      if (Math.abs(value) < bestY) { bestY = Math.abs(value); bestX = middle; }
      if (Math.abs(value) <= tolerance) { bestX = middle; bestY = Math.abs(value); break; }
      if (Math.sign(value) === Math.sign(fa)) { a = middle; fa = value; } else { b = middle; fb = value; }
    }
    // A sign flip across a pole is not accepted unless the residual also approaches zero.
    if (bestY <= tolerance) add(bestX);
  }
  return roots.sort((a, b) => a - b).slice(0, 32);
}

function collectTree(tree, predicate, result = []) {
  if (predicate(tree)) result.push(tree);
  if (tree.type === 'unary') collectTree(tree.value, predicate, result);
  if (tree.type === 'call') collectTree(tree.argument, predicate, result);
  if (tree.type === 'binary') { collectTree(tree.left, predicate, result); collectTree(tree.right, predicate, result); }
  return result;
}
function sampleExplanation(tree, parameters, x) {
  const actions = [];
  function run(node) {
    const value = evaluateNode(node, x, parameters);
    if (node.type === 'unary') { const v = run(node.value); actions.push(`${fmt(v)} の符号を反転すると ${fmt(value)} です。`); }
    if (node.type === 'binary') {
      const a = run(node.left), b = run(node.right);
      const verb = { '+': 'に', '-': 'から', '*': 'と', '/': 'を', '^': 'を' }[node.op];
      const operation = { '+': 'を足す', '-': 'を引く', '*': 'を掛ける', '/': 'で割る', '^': '乗する' }[node.op];
      actions.push(`${fmt(a)} ${verb} ${fmt(b)} ${operation}と ${fmt(value)} です。`);
    }
    if (node.type === 'call') {
      const argument = run(node.argument);
      const names = { sqrt: '0以上の平方根', abs: '絶対値', sin: 'sin（サイン）', cos: 'cos（コサイン）', tan: 'tan（タンジェント）', exp: '自然指数関数 exp', log: '底10の対数 log', ln: '自然対数 ln' };
      actions.push(`${fmt(argument)}${['sin', 'cos', 'tan'].includes(node.name) ? ' ラジアン' : ''} に ${names[node.name]}を適用すると ${fmt(value)} です。`);
    }
    return value;
  }
  const value = run(tree);
  let steps = [`x に ${fmt(x)} を代入します。`, ...actions];
  if (steps.length > 9) steps = [...steps.slice(0, 7), '残りの内側の計算も同じ順序で進めます。'];
  steps.push(`この入力での式の値は ${fmt(value)} です。`);
  return { x, value, steps };
}
function explainCompiled(compiled, xMin, xMax) {
  const { tree, polynomial, parameters, derivative, evaluate } = compiled;
  const steps = [], conditions = [], used = [...new Set(collectTree(tree, n => n.type === 'variable' && PARAMETER_NAMES.includes(n.name)).map(n => n.name))];
  let meaning;
  if (polynomial) {
    const degree = polynomial.length - 1;
    if (degree === 0) meaning = `この係数設定では、x を変えても値が ${fmt(polynomial[0])} となる定数式です。`;
    else if (degree === 1) {
      const [intercept, slope] = polynomial;
      meaning = `一次関数です。x が1増えると、値は ${fmt(Math.abs(slope))} ${slope >= 0 ? '増えます' : '減ります'}。`;
      steps.push(`x の係数 ${fmt(slope)} が直線の傾きで、定数項 ${fmt(intercept)} が x=0 での値（切片）です。`);
    } else if (degree === 2) {
      const [c, b, a] = polynomial, h = -b / (2 * a), k = c - b * b / (4 * a);
      meaning = `二次関数です。x² の係数は ${fmt(a)} なので、${a > 0 ? '上向き' : '下向き'}に開く放物線になります。`;
      if (Number.isFinite(h) && Number.isFinite(k)) steps.push(`平方完成すると頂点は (${fmt(h)}, ${fmt(k)})、対称軸は x=${fmt(h)} です。全実数で考えると、頂点で${a > 0 ? '最小' : '最大'}値 ${fmt(k)} を取ります。`);
      steps.push(`x² の係数の絶対値が大きいほど、頂点から離れたときの値の変化が急になります。定数項 ${fmt(c)} は x=0 での値です。`);
    } else {
      meaning = `${degree === 3 ? '三次' : degree + '次'}の多項式です。最高次の係数は ${fmt(polynomial[degree])}、定数項は ${fmt(polynomial[0])} です。`;
      steps.push(`x の絶対値が十分に大きくなると、最高次の項 ${polynomialExpression(Array.from({ length: degree + 1 }, (_, i) => i === degree ? polynomial[i] : 0))} が全体の増え方を左右します。`);
    }
    if (polynomial.length > 1 && derivative) steps.push(`導関数は ${derivative} です。これは各 x での変化の速さを表し、正ならその付近で増加、負なら減少する目安になります。`);
  } else {
    const operations = collectTree(tree, node => node.type === 'call').map(node => node.name);
    const names = { sqrt: '平方根', abs: '絶対値', sin: 'サイン', cos: 'コサイン', tan: 'タンジェント', exp: '指数関数', log: '常用対数', ln: '自然対数' };
    const list = [...new Set(operations)].map(name => names[name]);
    meaning = list.length ? `${list.join('・')}を組み合わせ、入力 x から値を計算する式です。かっこの内側から順に計算します。` : '割り算や累乗を含む式です。入力 x ごとに計算し、式が定義できる範囲を確かめます。';
    if (derivative) steps.push(`微分可能な点での導関数は ${derivative} です。各点での増え方・減り方を調べるために使えます。`);
    else steps.push('この形の導関数は自動表示していません。グラフの標本点から全区間の増減を断定することはできません。');
  }
  const nodes = collectTree(tree, n => n.type === 'binary' || n.type === 'call');
  const descriptions = new Set();
  for (const node of nodes) {
    if (node.type === 'binary') {
      if (node.op === '/') {
        conditions.push(`分母 ${formatTree(node.right, parameters)} が0になる入力は使えません。`);
        descriptions.add(`割り算 ${formatTree(node, parameters)} は、分子を計算してから分母で割ります。`);
      }
      if (node.op === '^') {
        const exponent = !hasX(node.right) ? evaluateNode(node.right, 0, parameters) : null;
        if (exponent === null || !Number.isInteger(exponent)) conditions.push(`非整数の指数では、底 ${formatTree(node.left, parameters)} が負になる計算はこの実数計算では扱いません。`);
        if (exponent === null || exponent <= 0) conditions.push(`底 ${formatTree(node.left, parameters)} が0のとき、0乗や負の指数は定義しません。`);
      }
    } else {
      const argument = formatTree(node.argument, parameters);
      if (node.name === 'sqrt') { conditions.push(`sqrt の中身 ${argument} は0以上である必要があります。`); descriptions.add(`sqrt(${argument}) は、中身の0以上の平方根を取ります。`); }
      if (node.name === 'ln' || node.name === 'log') { conditions.push(`${node.name} の中身 ${argument} は0より大きい必要があります。`); descriptions.add(`${node.name}(${argument}) は、${node.name === 'log' ? '10' : '自然対数の底 e'} を何乗すると中身になるかを求めます。`); }
      if (node.name === 'abs') descriptions.add(`abs(${argument}) は0からの距離を取り、負の値を正に、0以上の値をそのままにします。`);
      if (node.name === 'exp') descriptions.add(`exp(${argument}) は、自然対数の底 e を ${argument} 乗する計算です。`);
      if (['sin', 'cos', 'tan'].includes(node.name)) { conditions.push('三角関数の角度はラジアンです。180度は pi ラジアンに当たります。'); descriptions.add(`${node.name}(${argument}) は、内側の値を角度として三角関数を計算します。`); }
      if (node.name === 'tan') conditions.push(`cos(${argument}) が0となる位置では tan は定義されません。`);
    }
  }
  steps.push(...[...descriptions].slice(0, 4));
  if (!steps.length) steps.push('文字 x の値を変えても、この設定では出力は変わりません。');
  if (!conditions.length) conditions.push('この式には、分母・対数・平方根による実数の定義域の制限はありません。');
  if (derivative && !polynomial) conditions.push('導関数の表示は、各演算が微分可能な点で使います。元の式の端点などでは別の確認が必要です。');
  conditions.push('グラフと根の探索は指定範囲内の数値計算です。桁あふれや計算精度の限界がある点は表示しません。');
  const candidates = [1, 0, (xMin + xMax) / 2, xMin, xMax];
  for (let i = 1; i < 20; i++) candidates.push(xMin + (xMax - xMin) * i / 20);
  const sampleX = candidates.find(x => x >= xMin && x <= xMax && Number.isFinite(evaluate(x)));
  return {
    meaning,
    steps,
    parameters: used.map(name => `${name} = ${fmt(parameters[name])} を代入しています。この係数を変えると、式の形や値を比較できます。`),
    conditions: [...new Set(conditions)].slice(0, 10),
    sample: sampleX === undefined ? null : sampleExplanation(tree, parameters, sampleX)
  };
}

export function explainFormula(expression, options = {}) {
  const { xMin, xMax } = validateRange(options.xMin ?? -5, options.xMax ?? 5);
  const compiled = compileFormula(expression, options.parameters);
  return explainCompiled(compiled, xMin, xMax);
}

export function analyzeFormula(expression, options = {}) {
  const { xMin, xMax } = validateRange(options.xMin ?? -5, options.xMax ?? 5);
  const data = validateData(options.data ?? []);
  const compiled = compileFormula(expression, options.parameters);
  const points = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const x = index === SAMPLE_COUNT - 1 ? xMax : xMin + (xMax - xMin) * index / (SAMPLE_COUNT - 1);
    return { x, y: compiled.evaluate(x) };
  });
  const finite = points.filter(point => Number.isFinite(point.y));
  const zeroEverywhere = !!(compiled.polynomial && compiled.polynomial.length === 1 && compiled.polynomial[0] === 0);
  const roots = zeroEverywhere ? [] : rootEstimates(compiled, points, xMin, xMax);
  const metrics = metricsFor(data, compiled.evaluate);
  const summary = [`x=${fmt(xMin)} から ${fmt(xMax)} を201点で調べ、${finite.length}点で有限の値を計算できました。`];
  if (finite.length) {
    const minimum = finite.reduce((a, b) => b.y < a.y ? b : a), maximum = finite.reduce((a, b) => b.y > a.y ? b : a);
    summary.push(`標本点での最小値は ${fmt(minimum.y)}（x=${fmt(minimum.x)}）、最大値は ${fmt(maximum.y)}（x=${fmt(maximum.x)}）です。連続した範囲全体の厳密な極値とは限りません。`);
  } else summary.push('この表示範囲では値を計算できません。定義域・係数・表示範囲を確認してください。');
  if (zeroEverywhere) summary.push('この設定では、式が定義される範囲で値は常に0です。個々の根は列挙しません。');
  else if (roots.length) summary.push(`この範囲で0になる位置の推定値は ${roots.map(r => fmt(r, 7)).join('、')} です。低次式の計算と標本点・符号変化による探索で、すべての根を保証するものではありません。`);
  else summary.push('この範囲の探索では根を検出しませんでした。根が存在しないことの証明ではありません。');
  if (finite.length !== SAMPLE_COUNT) summary.push('定義できない点や数値が大きすぎる点があります。グラフの途切れをまたいで連続とは考えないでください。');
  if (data.length && metrics) summary.push(`入力した${data.length}点とのRMSEは ${fmt(metrics.rmse, 7)}、MAEは ${fmt(metrics.mae, 7)} です。${metrics.r2 === null ? '正解データが一定なのでR²は定義しません。' : `R²は ${fmt(metrics.r2, 7)} です。`}これらは入力データへの一致度で、将来の値の保証ではありません。`);
  else if (data.length) summary.push('入力データの一部で式を計算できないため、誤差指標は計算していません。');
  return { points, roots, polynomial: compiled.polynomial, derivative: compiled.derivative, summary, metrics, finiteCount: finite.length, totalCount: SAMPLE_COUNT, zeroEverywhere, explanation: explainCompiled(compiled, xMin, xMax) };
}

function uniqueCount(data) { return new Set(data.map(point => point.x)).size; }
function binomial(n, k) { let value = 1; for (let i = 1; i <= k; i++) value = value * (n - i + 1) / i; return value; }
function fitPolynomial(data, degree) {
  const width = degree + 1, n = data.length;
  if (n < width || uniqueCount(data) < width) return null;
  const minX = Math.min(...data.map(p => p.x)), maxX = Math.max(...data.map(p => p.x));
  const center = minX + (maxX - minX) / 2, scale = (maxX - minX) / 2;
  if (!(scale > 0)) return null;
  const yCenter = data.reduce((m, point, i) => m + (point.y - m) / (i + 1), 0);
  const yScale = Math.max(...data.map(p => Math.abs(p.y - yCenter))) || 1;
  const matrix = data.map(point => {
    const x = (point.x - center) / scale, row = [1];
    for (let i = 1; i < width; i++) row.push(row[i - 1] * x);
    return row;
  });
  const rhs = data.map(point => (point.y - yCenter) / yScale);
  // Householder QR avoids squaring the condition number as normal equations would.
  for (let k = 0; k < width; k++) {
    let norm = 0;
    for (let i = k; i < n; i++) norm = Math.hypot(norm, matrix[i][k]);
    if (norm < 1e-11 * Math.sqrt(n)) return null;
    const alpha = matrix[k][k] >= 0 ? -norm : norm;
    const vector = Array.from({ length: n - k }, (_, offset) => matrix[k + offset][k]);
    vector[0] -= alpha;
    const vectorNorm = Math.hypot(...vector);
    if (!(vectorNorm > 0)) return null;
    for (let i = 0; i < vector.length; i++) vector[i] /= vectorNorm;
    for (let j = k; j < width; j++) {
      let dot = 0;
      for (let i = k; i < n; i++) dot += vector[i - k] * matrix[i][j];
      for (let i = k; i < n; i++) matrix[i][j] -= 2 * vector[i - k] * dot;
    }
    let dot = 0;
    for (let i = k; i < n; i++) dot += vector[i - k] * rhs[i];
    for (let i = k; i < n; i++) rhs[i] -= 2 * vector[i - k] * dot;
    matrix[k][k] = alpha;
    for (let i = k + 1; i < n; i++) matrix[i][k] = 0;
  }
  const normalized = Array(width).fill(0);
  for (let i = width - 1; i >= 0; i--) {
    if (Math.abs(matrix[i][i]) < 1e-11 * Math.sqrt(n)) return null;
    let sum = rhs[i];
    for (let j = i + 1; j < width; j++) sum -= matrix[i][j] * normalized[j];
    normalized[i] = sum / matrix[i][i];
  }
  for (let i = 0; i < width; i++) normalized[i] *= yScale;
  normalized[0] += yCenter;
  const predict = x => {
    const t = (x - center) / scale;
    let result = normalized[normalized.length - 1];
    for (let i = normalized.length - 2; i >= 0; i--) result = result * t + normalized[i];
    return result;
  };
  const coefficients = Array(width).fill(0);
  for (let j = 0; j < width; j++) for (let k = 0; k <= j; k++) coefficients[k] += normalized[j] * binomial(j, k) * (-center) ** (j - k) / scale ** j;
  if (![...coefficients, ...normalized].every(Number.isFinite)) return null;
  return { coefficients, normalized, center, scale, yScale, predict };
}

export function evolveFormula(inputData) {
  const data = validateData(inputData);
  if (data.length < 3) fail('公式の改善候補を比べるには、少なくとも3点のデータが必要です。');
  if (uniqueCount(data) < 2) fail('異なる x の値が少なくとも2種類必要です。同じ x だけでは傾きを推定できません。');
  const candidates = [];
  for (let degree = 1; degree <= 3; degree++) {
    if (data.length < degree + 2 || uniqueCount(data) < degree + 1) continue;
    const model = fitPolynomial(data, degree);
    if (!model) continue;
    let cvSquared = 0, valid = true;
    for (let omit = 0; omit < data.length; omit++) {
      const training = data.filter((_, index) => index !== omit), trial = fitPolynomial(training, degree);
      if (!trial) { valid = false; break; }
      const error = trial.predict(data[omit].x) - data[omit].y;
      if (!Number.isFinite(error)) { valid = false; break; }
      cvSquared += error * error;
    }
    if (!valid || !Number.isFinite(cvSquared)) continue;
    let expression = polynomialExpression(model.coefficients, 'x', 13);
    let parsed;
    try { parsed = parseFormula(expression); } catch { parsed = null; }
    const rawMetrics = metricsFor(data, model.predict);
    let metrics = parsed && metricsFor(data, parsed.evaluate);
    const magnitude = Math.max(...data.map(point => Math.abs(point.y)), 1);
    const roundAllowance = Math.max(model.yScale * 1e-10, magnitude * EPS * 64);
    if (Math.abs(model.center) > 1000 * model.scale || !metrics || metrics.rmse > rawMetrics.rmse + roundAllowance) {
      const center = fmt(model.center, 16), scale = fmt(model.scale, 16);
      const variable = `((x - (${center})) / (${scale}))`;
      expression = polynomialExpression(model.normalized, variable, 16);
      try { parsed = parseFormula(expression); metrics = metricsFor(data, parsed.evaluate); } catch { metrics = null; }
    }
    if (!metrics) continue;
    const cvRmse = Math.sqrt(cvSquared / data.length);
    candidates.push({
      degree,
      expression,
      coefficients: model.coefficients.slice(),
      rmse: metrics.rmse,
      cvRmse,
      r2: metrics.r2,
      summary: `最大${degree}次の式を${data.length}点から当てはめました。1点ずつ除いて予測する交差検証（LOOCV）のRMSEは ${fmt(cvRmse, 7)} です。小さいほど今回のデータでの予測誤差が小さくなりますが、法則の証明や範囲外の予測保証ではありません。`
    });
  }
  if (!candidates.length) fail('安定して比較できる候補を作れませんでした。異なる x のデータを増やし、極端に近い値ばかりになっていないか確認してください。');
  const yMean = data.reduce((m, p, i) => m + (p.y - m) / (i + 1), 0);
  const yScale = Math.max(...data.map(p => Math.abs(p.y - yMean)), 1e-12);
  const tieTolerance = Math.max(yScale * 1e-8, Math.max(...data.map(p => Math.abs(p.y)), 1) * EPS * 64);
  candidates.sort((a, b) => Math.abs(a.cvRmse - b.cvRmse) <= tieTolerance ? a.degree - b.degree : a.cvRmse - b.cvRmse);
  return candidates;
}
