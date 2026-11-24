/**
 * Structural, Japanese math narration. No evaluation, DOM or speech service.
 * Explicit formulas are parsed as a whole; an unsupported structure is retained
 * verbatim. In prose, only a conservative mathematical span is interpreted.
 */
import { applyPronunciations } from './speech-lexicon.js';

const LETTERS = Object.freeze({
  a: 'エー', b: 'ビー', c: 'シー', d: 'ディー', e: 'イー', f: 'エフ',
  g: 'ジー', h: 'エイチ', i: 'アイ', j: 'ジェー', k: 'ケー', l: 'エル',
  m: 'エム', n: 'エヌ', o: 'オー', p: 'ピー', q: 'キュー', r: 'アール',
  s: 'エス', t: 'ティー', u: 'ユー', v: 'ブイ', w: 'ダブリュー',
  x: 'エックス', y: 'ワイ', z: 'ゼット'
});
const GREEK = Object.freeze({
  α: 'アルファ', β: 'ベータ', γ: 'ガンマ', δ: 'デルタ', ε: 'イプシロン',
  ζ: 'ゼータ', η: 'イータ', θ: 'シータ', ι: 'イオタ', κ: 'カッパ',
  λ: 'ラムダ', μ: 'ミュー', ν: 'ニュー', ξ: 'クサイ', ο: 'オミクロン',
  π: 'パイ', ρ: 'ロー', σ: 'シグマ', τ: 'タウ', υ: 'ユプシロン',
  φ: 'ファイ', χ: 'カイ', ψ: 'プサイ', ω: 'オメガ',
  Δ: 'デルタ', Σ: 'シグマ', Π: 'パイ', Ω: 'オメガ', ℓ: 'エル', '∞': '無限大'
});
const SUPERSCRIPT = Object.freeze(Object.fromEntries([...('⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱˣʸᵃᵇᶜᵈᵉᶠᵍʰᶦʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷᶻ')].map((char, i) => [char, [...'0123456789+-=()nixyabcdefghijklmoprstuvwz'][i]])));
const SUBSCRIPT = Object.freeze({ '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')', 'ₐ': 'a', 'ₑ': 'e', 'ₕ': 'h', 'ᵢ': 'i', 'ⱼ': 'j', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₒ': 'o', 'ₚ': 'p', 'ᵣ': 'r', 'ₛ': 's', 'ₜ': 't', 'ᵤ': 'u', 'ᵥ': 'v', 'ₓ': 'x' });
const FUNCTIONS = new Set(['sqrt', 'abs', 'sin', 'cos', 'tan', 'exp', 'log', 'ln', 'gcd', 'lcm', 'det', 'min', 'max']);
const SYMBOL_FUNCTIONS = new Set(['f', 'g', 'h', 'F', 'G', 'H', 'P', 'B']);
const PROSE_PRODUCTS = new Set(['ax', 'bx', 'cx', 'dx', 'ab', 'ac', 'ad', 'bc', 'bh', 'xy', 'pq', 'mn', 'np', 'ka', 'kb', 'nx', 'dt']);
const RELATIONS = new Set(['=', '<', '>', '≤', '≥', '≠', '≈', '≡', '→', '⇒', '⇔', '∈']);
const RELATION_READINGS = { '=': 'イコール', '<': 'しょうなり', '>': 'だいなり', '≤': 'しょうなりイコール', '≥': 'だいなりイコール', '≠': 'ノットイコール', '≈': 'ほぼイコール', '≡': '合同記号', '→': '近づく', '⇒': 'ならば', '⇔': '同値', '∈': '属する' };

function unhandled() { throw new Error('Unsupported mathematical notation'); }

function normalizeFormula(input) {
  let text = String(input).trim();
  if (/^\$\$[\s\S]*\$\$$/.test(text)) text = text.slice(2, -2);
  else if (/^\$[^$]+\$$/.test(text)) text = text.slice(1, -1);
  if (/^\\\([\s\S]*\\\)$/.test(text) || /^\\\[[\s\S]*\\\]$/.test(text)) text = text.slice(2, -2);
  text = text.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱˣʸᵃᵇᶜᵈᵉᶠᵍʰᶦʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷᶻ]+/gu, value => `^{${[...value].map(char => SUPERSCRIPT[char] ?? char).join('')}}`)
    .replace(/[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ]+/gu, value => `_{${[...value].map(char => SUBSCRIPT[char] ?? char).join('')}}`)
    .replace(/[Ａ-Ｚａ-ｚ０-９＋－＝＜＞／＊＾（）［］｛｝．，：]/g, char => char.normalize('NFKC'))
    .replace(/[−–—﹣]/g, '-').replace(/[×·⋅]/g, '*').replace(/÷/g, '/')
    .replace(/≦/g, '≤').replace(/≧/g, '≥').replace(/≒/g, '≈')
    .replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/!=/g, '≠')
    .replace(/′/g, "'").replace(/″/g, "''").replace(/\u00a0/g, ' ');
  // These TeX commands are notation, not arbitrary markup. Unknown commands stay
  // in the input and cause the complete formula to fall back unchanged.
  const commands = { times: '*', cdot: '*', div: '/', pm: '±', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', to: '→', rightarrow: '→', Rightarrow: '⇒', Longrightarrow: '⇒', Leftrightarrow: '⇔', in: '∈', cap: '∩', cup: '∪', infty: '∞', pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', lambda: 'λ', mu: 'μ', sigma: 'σ', phi: 'φ', omega: 'ω', ell: 'ℓ', int: '∫', sin: 'sin', cos: 'cos', tan: 'tan', log: 'log', ln: 'ln', exp: 'exp', gcd: 'gcd', lvert: '|', rvert: '|' };
  text = text.replace(/\\(?:left|right)\b/g, '').replace(/\\(?:quad|qquad)\b/g, ' ').replace(/\\[,;! ]/g, ' ')
    .replace(/\\([A-Za-z]+)/g, (whole, command) => Object.hasOwn(commands, command) ? commands[command] : whole);
  function readArgument(source, at) {
    while (/\s/.test(source[at] || '') && at < source.length) at++;
    if (source[at] === '{') {
      let depth = 1, end = at + 1;
      while (end < source.length && depth) { if (source[end] === '{') depth++; if (source[end] === '}') depth--; end++; }
      if (depth) unhandled();
      return { value: source.slice(at + 1, end - 1), end };
    }
    if (!source[at]) unhandled();
    return { value: source[at], end: at + 1 };
  }
  function tex(source, depth = 0) {
    if (depth > 32) unhandled();
    let out = '';
    for (let i = 0; i < source.length;) {
      if (source.startsWith('\\frac', i)) {
        const top = readArgument(source, i + 5), bottom = readArgument(source, top.end);
        out += `((${tex(top.value, depth + 1)})/(${tex(bottom.value, depth + 1)}))`; i = bottom.end;
      } else if (source.startsWith('\\sqrt', i)) {
        const argument = readArgument(source, i + 5);
        out += `sqrt(${tex(argument.value, depth + 1)})`; i = argument.end;
      } else { out += source[i++]; }
    }
    return out;
  }
  return tex(text);
}

function tokenize(input) {
  if (!input || input.length > 4000) unhandled();
  const text = normalizeFormula(input), tokens = [];
  let position = 0;
  const add = (type, value = type) => { tokens.push({ type, value }); if (tokens.length > 1400) unhandled(); };
  while (position < text.length) {
    const char = text[position], rest = text.slice(position);
    if (/\s/u.test(char)) { position++; continue; }
    const numeric = rest.match(/^(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|(?:\d+(?:\.\d*)?|\.\d+))(?:[eE][+-]?\d+)?/);
    if (numeric) { add('number', numeric[0]); position += numeric[0].length; continue; }
    if (rest.startsWith('∫')) { add('integral'); position++; continue; }
    if (char === '√') { add('root'); position++; continue; }
    if (Object.hasOwn(GREEK, char)) { add('symbol', char); position++; continue; }
    // In integration notation the final dx/dt is a differential, not a product.
    const differential = text.includes('∫') && rest.match(/^d([A-Za-z])(?=$|\s|[=+\-),}\]])/);
    if (differential) { add('differential', differential[1]); position += 2; continue; }
    const word = rest.match(/^[A-Za-z]+/);
    if (word) {
      const raw = word[0], lower = raw.toLowerCase();
      if (FUNCTIONS.has(lower)) add('function', lower);
      else if (lower === 'pi') add('symbol', 'π');
      else if (/^(?:n)[CP](?:r|k)$/.test(raw)) {
        add('symbol', 'n'); add(raw[1] === 'C' ? 'choose' : 'permute'); add('symbol', raw[2]);
      } else if (/^[CP]$/.test(raw) && tokens.at(-1)?.type === 'number' && /[0-9(]/.test(text[position + raw.length] || '')) add(raw === 'C' ? 'choose' : 'permute');
      else if (/^n[CP]$/.test(raw) && text.slice(position + raw.length).trimStart().startsWith('(')) { add('symbol', 'n'); add(raw[1] === 'C' ? 'choose' : 'permute'); }
      else {
        if (raw.length > 3 || raw.length > 1 && !PROSE_PRODUCTS.has(raw) && !/^[A-Z]{2,3}$/.test(raw)) unhandled();
        if (raw.length > 1 && !PROSE_PRODUCTS.has(raw) && text.slice(position + raw.length).trimStart().startsWith('(')) unhandled();
        for (const letter of raw) add('symbol', letter);
      }
      position += raw.length; continue;
    }
    if ('+-*/^_(){}[],!%°:|±∩∪'.includes(char) || RELATIONS.has(char)) { add(char); position++; continue; }
    if (char === "'") { add('prime'); position++; continue; }
    unhandled();
  }
  tokens.push({ type: 'end' });
  return tokens;
}

function parseFormulaTree(input) {
  const tokens = Array.isArray(input) ? input : tokenize(input);
  let cursor = 0, depth = 0;
  const current = () => tokens[cursor] || { type: 'end' };
  const take = type => current().type === type ? tokens[cursor++] : null;
  const expect = type => { if (!take(type)) unhandled(); };
  const guard = fn => { if (++depth > 96) unhandled(); try { return fn(); } finally { depth--; } };
  const implicitStart = token => ['number', 'symbol', 'function', 'root', 'integral', '(', '{', '['].includes(token.type);
  const hasClosingBar = () => {
    for (let i = cursor + 1; i < tokens.length; i++) {
      if (tokens[i].type === '|') return true;
      if (['end', ')', '}', ']', ','].includes(tokens[i].type)) return false;
    }
    return false;
  };
  const containsRelation = node => node.type === 'group' ? containsRelation(node.value) : node.type === 'binary' && RELATIONS.has(node.op);
  function expression(stops = new Set()) {
    let left = sum(stops);
    while (!stops.has(current().type) && (RELATIONS.has(current().type) || [':', '|', '∩', '∪'].includes(current().type))) {
      const op = tokens[cursor++].type;
      left = { type: 'binary', op, left, right: sum(stops) };
    }
    return left;
  }
  function sum(stops) {
    let left = product(stops);
    while (!stops.has(current().type) && ['+', '-', '±'].includes(current().type)) {
      const op = tokens[cursor++].type;
      left = { type: 'binary', op, left, right: product(stops) };
    }
    return left;
  }
  function product(stops) {
    let left = unary(stops);
    while (!stops.has(current().type)) {
      if (['*', '/', 'choose', 'permute'].includes(current().type)) {
        const op = tokens[cursor++].type;
        left = { type: 'binary', op, left, right: unary(stops) };
      } else if (implicitStart(current()) || current().type === '|' && hasClosingBar()) {
        if (left.type === 'number' && current().type === 'number') unhandled();
        const right = unary(stops);
        // An equation in parentheses is an annotation, not a numeric factor.
        if (containsRelation(left) || containsRelation(right)) unhandled();
        left = { type: 'binary', op: '*', implicit: true, left, right };
      } else break;
    }
    return left;
  }
  function unary(stops) {
    return guard(() => {
      if (['+', '-', '±'].includes(current().type)) {
        const op = tokens[cursor++].type;
        return { type: 'unary', op, value: unary(stops) };
      }
      return power(stops);
    });
  }
  function power(stops) {
    let left = primary(stops);
    while (['!', '%', '°', 'prime', '_'].includes(current().type) && !stops.has(current().type)) {
      if (take('_')) left = { type: 'subscript', base: left, index: script(stops) };
      else { const type = tokens[cursor++].type; left = { type: type === 'prime' ? 'prime' : 'postfix', op: type, value: left }; }
    }
    if (take('^')) left = { type: 'binary', op: '^', left, right: unary(stops) };
    return left;
  }
  function script(stops) {
    if (current().type === '{' || current().type === '(') return primary(stops);
    if (current().type === '+' || current().type === '-') {
      const op = tokens[cursor++].type;
      return { type: 'unary', op, value: primary(stops) };
    }
    const token = current();
    if (token.type === 'number' || token.type === 'symbol') { cursor++; return { type: token.type, value: token.value }; }
    unhandled();
  }
  function argumentsInGroup(open = '(') {
    const close = { '(': ')', '{': '}', '[': ']' }[open];
    expect(open);
    if (current().type === close) unhandled();
    const values = [expression(new Set([',', close]))];
    while (take(',')) values.push(expression(new Set([',', close])));
    expect(close);
    return values;
  }
  function functionNode(token, stops) {
    let subscript = null, exponent = null, primes = 0;
    while (['_', '^', 'prime'].includes(current().type)) {
      if (take('_')) subscript = script(stops);
      else if (take('^')) exponent = script(stops);
      else { take('prime'); primes++; }
    }
    let args;
    if (current().type === '(') args = argumentsInGroup();
    else if (token.type === 'function' && ['symbol', 'number', 'root', '{', '['].includes(current().type)) {
      args = [unary(stops)];
      // With omitted brackets, sin 2x has ambiguous scope. Do not silently turn
      // it into sin(2)*x. Existing sin θ / sin 30° notation remains supported.
      if (implicitStart(current())) unhandled();
    }
    else {
      let result = { type: token.type === 'function' ? 'functionName' : 'symbol', value: token.value };
      while (primes-- > 0) result = { type: 'prime', value: result };
      if (subscript) result = { type: 'subscript', base: result, index: subscript };
      if (exponent) result = token.type === 'symbol'
        ? { type: 'decoratedSymbol', base: result, exponent }
        : { type: 'binary', op: '^', left: result, right: exponent };
      return result;
    }
    if (token.type === 'function' && primes) unhandled();
    if (['P', 'B'].includes(token.value) && primes) unhandled();
    if (['sqrt', 'abs', 'sin', 'cos', 'tan', 'exp', 'log', 'ln', 'det'].includes(token.value) && args.length !== 1) unhandled();
    if (token.value === 'P' && args.length !== 1 || token.value === 'B' && args.length !== 2) unhandled();
    if (['gcd', 'lcm'].includes(token.value) && args.length < 2) unhandled();
    let result = { type: 'call', name: token.value, args, subscript, primes };
    const rawExponent = exponent && ungroup(exponent);
    const ambiguousInverse = rawExponent?.type === 'unary' && rawExponent.op === '-' && ungroup(rawExponent.value).type === 'number' && ungroup(rawExponent.value).value === '1';
    if (exponent) result = token.type === 'function' && token.value !== 'log' && !ambiguousInverse
      ? { type: 'binary', op: '^', left: result, right: exponent }
      : { type: 'decoratedCall', call: result, exponent };
    return result;
  }
  function integral(stops) {
    let low = null, high = null;
    while (current().type === '_' || current().type === '^') {
      if (take('_')) low = script(stops); else { take('^'); high = script(stops); }
    }
    let nesting = 0, end = cursor;
    for (; end < tokens.length; end++) {
      const type = tokens[end].type;
      if (type === 'differential' && nesting === 0) break;
      if (['(', '{', '['].includes(type)) nesting++;
      if ([')', '}', ']'].includes(type)) nesting--;
      if (nesting < 0 || type === 'end' || (nesting === 0 && RELATIONS.has(type))) unhandled();
    }
    if (tokens[end]?.type !== 'differential' || end === cursor) unhandled();
    const argument = parseFormulaTree([...tokens.slice(cursor, end), { type: 'end' }]);
    const variable = tokens[end].value;
    cursor = end + 1;
    return { type: 'integral', low, high, argument, variable };
  }
  function primary(stops) {
    const token = current();
    if (take('number')) return { type: 'number', value: token.value };
    if (take('symbol')) {
      if (SYMBOL_FUNCTIONS.has(token.value)) return functionNode(token, stops);
      return { type: 'symbol', value: token.value };
    }
    if (take('function')) return functionNode(token, stops);
    if (take('root')) {
      // An explicit bracket ends the radicand: √(x)^2 is (sqrt(x))^2,
      // whereas √(x^2) keeps the power inside the radical.
      const explicitBracket = ['(', '{', '['].includes(current().type);
      const argument = explicitBracket ? primary(stops) : power(stops);
      return { type: 'call', name: 'sqrt', args: [explicitBracket && argument.type === 'group' ? argument.value : argument], primes: 0 };
    }
    if (take('integral')) return integral(stops);
    if (take('|')) { const value = expression(new Set(['|'])); expect('|'); return { type: 'call', name: 'abs', args: [value], primes: 0 }; }
    if (['(', '{', '['].includes(token.type)) {
      const values = argumentsInGroup(token.type);
      return values.length === 1 ? { type: 'group', value: values[0], bracket: token.type } : { type: 'tuple', values, bracket: token.type };
    }
    unhandled();
  }
  const tree = expression();
  if (current().type !== 'end') unhandled();
  return tree;
}

function simple(node) {
  return ['number', 'symbol', 'prime', 'functionName'].includes(node.type)
    || (node.type === 'unary' && ['number', 'symbol'].includes(node.value.type));
}
function ungroup(node) { return node.type === 'group' ? ungroup(node.value) : node; }
function grouped(node) {
  if (node.type === 'group' || node.type === 'tuple') return narrate(node);
  return simple(node) ? narrate(node) : `かっこ、${narrate(node)}、かっことじ`;
}
function numberSpeech(raw) {
  const match = String(raw).match(/^(.+)[eE]([+-]?\d+)$/);
  if (!match) return String(raw);
  const exponent = match[2].replace(/^\+/, '').replace(/^-/, 'マイナス');
  return `${match[1]}、かける、10の${exponent}乗`;
}
function functionName(name) {
  return { sqrt: 'ルート', abs: '絶対値', sin: 'サイン', cos: 'コサイン', tan: 'タンジェント', exp: '自然指数関数', log: 'ログ', ln: 'エルエヌ', gcd: '最大公約数', lcm: '最小公倍数', det: '行列式', min: '最小値', max: '最大値' }[name] || symbolSpeech(name);
}
function symbolSpeech(name) {
  return GREEK[name] || LETTERS[String(name).toLowerCase()] || String(name);
}
function narrate(node) {
  if (node.type === 'label') return [...node.value].map(symbolSpeech).join('');
  if (node.type === 'number') return numberSpeech(node.value);
  if (node.type === 'symbol') return symbolSpeech(node.value);
  if (node.type === 'functionName') return functionName(node.value);
  if (node.type === 'group') return `かっこ、${narrate(node.value)}、かっことじ`;
  if (node.type === 'tuple') return `${node.bracket === '[' ? 'かくかっこ' : 'かっこ'}、${node.values.map(narrate).join('、コンマ、')}、${node.bracket === '[' ? 'かくかっことじ' : 'かっことじ'}`;
  if (node.type === 'subscript') return `添え字が、${grouped(node.index)}、の${narrate(node.base)}`;
  if (node.type === 'prime') return `${narrate(node.value)}ダッシュ`;
  if (node.type === 'decoratedSymbol') return `${narrate(node.base)}、上付き、${grouped(node.exponent)}`;
  if (node.type === 'unary') {
    if (node.op === '+') return `プラス${grouped(node.value)}`;
    if (node.op === '±') return `プラスマイナス${grouped(node.value)}`;
    return simple(node.value) ? `マイナス${narrate(node.value)}` : `${grouped(node.value)}、全体にマイナスを付けた値`;
  }
  if (node.type === 'postfix') return `${grouped(node.value)}${{ '!': 'の階乗', '%': 'パーセント', '°': '度' }[node.op]}`;
  if (node.type === 'integral') {
    const range = node.low && node.high ? `${grouped(node.low)}から${grouped(node.high)}まで、` : '';
    if (Boolean(node.low) !== Boolean(node.high)) unhandled();
    return `${range}${grouped(node.argument)}を、${symbolSpeech(node.variable)}について${node.low ? '定積分' : '積分'}`;
  }
  if (node.type === 'decoratedCall') {
    return `${functionName(node.call.name)}、上付き、${grouped(node.exponent)}、かっこ、${node.call.args.map(narrate).join('、コンマ、')}、かっことじ`;
  }
  if (node.type === 'call') {
    const argument = node.args[0], name = node.name;
    if (name === 'P' && node.args.length === 1) {
      if (argument.type === 'binary' && argument.op === '|') return `${grouped(argument.right)}を条件とする、${grouped(argument.left)}の確率`;
      return `${grouped(argument)}の確率`;
    }
    if (name === 'B' && node.args.length === 2) return `二項分布、かっこ、${node.args.map(narrate).join('、コンマ、')}、かっことじ`;
    if (name === 'log' && node.subscript) return `底が、${grouped(node.subscript)}、真数が、${grouped(argument)}、の対数`;
    if (node.subscript) unhandled();
    if (name === 'sqrt') return `ルート、かっこ、${narrate(argument)}、かっことじ`;
    if (name === 'abs') return `${grouped(argument)}の絶対値`;
    if (name === 'log') return `${grouped(argument)}の常用対数`;
    if (name === 'ln') return `${grouped(argument)}の自然対数`;
    if (name === 'exp') return `自然対数の底イーを底とし、指数が、${grouped(argument)}、の累乗`;
    if (['gcd', 'lcm', 'min', 'max'].includes(name)) return `${node.args.map(grouped).join('、と、')}の${functionName(name)}`;
    if (name === 'det') return `${grouped(argument)}の行列式`;
    if (['sin', 'cos', 'tan'].includes(name)) return `${functionName(name)}、かっこ、${narrate(argument)}、かっことじ`;
    return `${symbolSpeech(name)}${'ダッシュ'.repeat(node.primes || 0)}、かっこ、${node.args.map(narrate).join('、コンマ、')}、かっことじ`;
  }
  if (node.type === 'binary') {
    const { left, right, op } = node;
    if (RELATIONS.has(op)) return `${narrate(left)}、${RELATION_READINGS[op]}、${narrate(right)}`;
    if (op === '+') return `${narrate(left)}、たす、${narrate(right)}`;
    if (op === '-') return `${narrate(left)}、ひく、${grouped(right)}`;
    if (op === '±') return `${narrate(left)}、プラスマイナス、${grouped(right)}`;
    if (op === '*') {
      const operand = value => value.type === 'binary' && ['+', '-', '±', '/', '∩', '∪', '|', ':'].includes(value.op) ? grouped(value) : narrate(value);
      return `${operand(left)}、かける、${operand(right)}`;
    }
    if (op === '/') {
      return simple(left) && simple(right) ? `${narrate(right)}ぶんの${narrate(left)}` : `分子が、${grouped(left)}、分母が、${grouped(right)}、の分数`;
    }
    if (op === '^') {
      const exponent = ungroup(right);
      const base = grouped(left);
      if (exponent.type === 'number' && /^\d+$/.test(exponent.value)) {
        const power = exponent.value === '2' ? '二乗' : exponent.value === '3' ? '三乗' : `${exponent.value}乗`;
        return `${base}${left.type === 'group' || !simple(left) ? '、全体' : ''}の${power}`;
      }
      if (simple(exponent)) return `${base}の${narrate(exponent)}乗`;
      return `底が、${base}、指数が、${grouped(right)}、の累乗`;
    }
    if (op === ':') return `${grouped(left)}、対、${grouped(right)}`;
    if (op === '∩') return `${grouped(left)}と${grouped(right)}の共通部分`;
    if (op === '∪') return `${grouped(left)}と${grouped(right)}の和集合`;
    if (op === '|') return `${grouped(left)}、縦棒、${grouped(right)}`;
    if (op === 'choose') return `${grouped(left)}個から${grouped(right)}個を選ぶ組合せの数`;
    if (op === 'permute') return `${grouped(left)}個から${grouped(right)}個を選んで並べる順列の数`;
  }
  unhandled();
}

function proseLabels(node) {
  const letters = value => value.type === 'symbol' && /^[A-Z]$/.test(value.value) ? value.value
    : value.type === 'binary' && value.op === '*' && value.implicit && letters(value.left) && letters(value.right) ? letters(value.left) + letters(value.right) : '';
  const label = letters(node);
  if (label.length >= 2) return { type: 'label', value: label };
  for (const key of ['left', 'right', 'value', 'base', 'index', 'argument', 'exponent', 'call', 'low', 'high', 'subscript']) {
    if (node[key] && typeof node[key] === 'object') node[key] = proseLabels(node[key]);
  }
  for (const key of ['args', 'values']) if (Array.isArray(node[key])) node[key] = node[key].map(proseLabels);
  return node;
}
function parseAndSpeak(value, prose = false) {
  let tree = parseFormulaTree(value);
  if (prose) tree = proseLabels(tree);
  return narrate(tree).replace(/、\s*、/g, '、');
}

/** A complete formula, explicitly marked by the caller. Unsupported input stays. */
export function spokenFormula(expression) {
  const original = String(expression ?? '');
  try { return applyPronunciations(parseAndSpeak(original)); }
  catch (_) { return applyPronunciations(original); }
}

const UNITS = Object.freeze({
  'km/h': 'キロメートル毎時', 'm/s': 'メートル毎秒', km: 'キロメートル', cm: 'センチメートル', mm: 'ミリメートル', m: 'メートル',
  kg: 'キログラム', mg: 'ミリグラム', g: 'グラム', mL: 'ミリリットル', ml: 'ミリリットル', L: 'リットル', l: 'リットル',
  Hz: 'ヘルツ', kHz: 'キロヘルツ', MHz: 'メガヘルツ', s: '秒', min: '分', h: '時間', rad: 'ラジアン'
});
const UNIT_PATTERN = /^(.*?)(km\/h|m\/s|MHz|kHz|Hz|km|cm|mm|kg|mg|mL|ml|rad|min|[mgLlhs])([²³])?$/;
const DATE_PATTERN = /^\d{4}[-/]\d{1,2}(?:[-/]\d{1,2})?(?:[T\s]+\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:\s*(?:Z|UTC|JST|GMT|[+-]\d{2}:?\d{2}))?)?$/;
const MATH_RUN = /[A-Za-zＡ-Ｚａ-ｚ0-9０-９α-ωΔΣΠΩℓ∞⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱˣʸᵃᵇᶜᵈᵉᶠᵍʰᶦʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷᶻ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ+\-−–—×·⋅*÷/＾^_()（）{}｛｝\[\]［］=＝<>＜＞≤≥≦≧≠≈≒≡→⇒⇔∈∩∪√∫±%％°′″'!.,，:：|\\$ \t]+/gu;

function clearlyMath(value) {
  const words = value.match(/[A-Za-z]+/g) || [];
  for (const word of words) {
    if (word.length === 1 || FUNCTIONS.has(word.toLowerCase()) || word === 'pi' || PROSE_PRODUCTS.has(word) || /^[A-Z]{2,3}$/.test(word) || /^n[CP][rk]?$/.test(word)) continue;
    if (['frac', 'left', 'right', 'theta', 'alpha', 'beta', 'gamma', 'delta', 'lambda', 'sigma', 'infty', 'times', 'cdot', 'div', 'leq', 'geq', 'neq'].includes(word) && value.includes('\\')) continue;
    return false;
  }
  // Standalone numerical prose, enumerations and ordinary English acronyms keep
  // their original text. Individual mathematical letters still get clear names.
  if (/^[\d.,，\s]+$/.test(value)) return false;
  if (/^[A-Z]{2,}$/.test(value) && !['AB', 'BA', 'AX'].includes(value)) return false;
  return true;
}

function proseSpan(value, before, after) {
  const leading = value.match(/^\s*/)?.[0] || '', trailing = value.match(/\s*$/)?.[0] || '';
  let core = value.trim();
  if (!core) return value;
  // Preserve dates, times, URLs, decimal lists and version-like numbers. A bare
  // 1/2 remains a fraction unless the surrounding prose explicitly identifies a date.
  if (DATE_PATTERN.test(core) || /^\d{1,2}:\d{2}(?::\d{2})?$/.test(core)
    || /^v?\d+\.\d+\.\d+(?:\.\d+)?$/i.test(core)
    || /^\d{1,2}\/\d{1,2}$/.test(core) && /(?:日付|更新日|開催日|日時|月日|予定)[^。！？]{0,12}$/.test(before)) return value;
  let punctuation = '';
  if (/[.,，]$/.test(core) && !/\d\.\d+$/.test(core)) { punctuation = core.at(-1); core = core.slice(0, -1).trimEnd(); }
  if (!core) return value;
  // In prose, uncertainty/percentage notes after a measurement are not
  // multiplication. Keep ordinary arithmetic such as 2(3+4) unchanged.
  const numericNote = core.match(/^([+\-−]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?)\s*([（(])\s*(±\s*(?:\d+(?:\.\d*)?|\.\d+)(?:[%％])?|(?:\d+(?:\.\d*)?|\.\d+)\s*[%％])\s*[）)]$/);
  if (numericNote && (numericNote[2] === '（' || /(?:測定|値|誤差|不確かさ|割合|比率|確率)[^。！？]{0,12}$/.test(before))) {
    try {
      return `${leading}${parseAndSpeak(numericNote[1], true)}、かっこ、${parseAndSpeak(numericNote[3].replace(/％/g, '%'), true)}、かっことじ${punctuation}${trailing}`;
    } catch (_) { /* Unsupported notes stay as originally written. */ }
  }
  // A parenthesized relation following a value is a contextual note. The math
  // parser deliberately rejects multiplying by a relation; read the two parts.
  const annotation = core.match(/^(.*?)\s*[（(]([^()（）]*(?:=|≤|≥|≠|<|>|＝)[^()（）]*)[）)]$/);
  const annotationPrefix = annotation && annotation[1].trim();
  const numericAnnotation = annotationPrefix && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(annotationPrefix);
  if (annotation && annotationPrefix && (numericAnnotation || clearlyMath(annotation[1])) && clearlyMath(annotation[2])) {
    try {
      return `${leading}${parseAndSpeak(annotation[1].trim(), true)}、かっこ、${parseAndSpeak(annotation[2], true)}、かっことじ${punctuation}${trailing}`;
    } catch (_) { /* Continue conservatively if either side is unsupported. */ }
  }
  // A physical unit in prose is not an implicit product of Latin letters.
  const unit = core.match(UNIT_PATTERN);
  const singleLetterUnit = unit && unit[2].length === 1;
  const unitBoundary = unit && (/\s$/.test(unit[1]) || !singleLetterUnit || /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(unit[1]));
  if (unit && unitBoundary && unit[1].trim() && /\d/.test(unit[1])) {
    const quantity = unit[1].trim();
    if (clearlyMath(quantity) || /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(quantity)) {
      try {
        const amount = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(quantity) ? quantity.replace(/^-/, 'マイナス') : parseAndSpeak(quantity, true);
        const power = unit[3] === '²' ? '平方' : unit[3] === '³' ? '立方' : '';
        return `${leading}${amount}${power}${UNITS[unit[2]]}${punctuation}${trailing}`;
      } catch (_) { /* A trailing h/m can be an algebraic variable instead. */ }
    }
  }
  if (!clearlyMath(core)) return value;
  if (/^[A-Z]{2,3}$/.test(core)) return `${leading}${[...core].map(symbolSpeech).join('')}${punctuation}${trailing}`;
  try { return `${leading}${parseAndSpeak(core, true)}${punctuation}${trailing}`; }
  catch (_) {
    // Known standalone operator signs in explanations retain their exact role.
    if (RELATIONS.has(core)) return `${leading}${RELATION_READINGS[core]}${punctuation}${trailing}`;
    if (core === '±') return `${leading}プラスマイナス${punctuation}${trailing}`;
    return value;
  }
}

/** Japanese prose with conservative inline math conversion and pronunciation. */
export function spokenText(value) {
  const original = String(value ?? '');
  // Protect web/email addresses before scanning prose; no placeholder can collide
  // with user text because the protected ranges are held as separate segments.
  const protectedPattern = /(?:https?:\/\/|www\.)[^\s「」『』<>]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  let output = '', position = 0;
  const convert = (text, offset) => text.replace(MATH_RUN, (match, at) => proseSpan(match, original.slice(Math.max(0, offset + at - 24), offset + at), original.slice(offset + at + match.length, offset + at + match.length + 24)));
  for (const match of original.matchAll(protectedPattern)) {
    output += convert(original.slice(position, match.index), position) + match[0];
    position = match.index + match[0].length;
  }
  output += convert(original.slice(position), position);
  return applyPronunciations(output);
}
