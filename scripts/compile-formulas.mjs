#!/usr/bin/env node
/** Compile trusted dictionary TeX into native MathML and readable plain text.
 * Usage: node scripts/compile-formulas.mjs [--katex-module /absolute/katex.mjs]
 * Normal development imports the installed `katex` package. An explicit module
 * path, or KATEX_MODULE_PATH, supports an existing runtime installation.
 */
import { writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { foundationEntries } from '../dist/data-foundations.js';
import { advancedEntries } from '../dist/data-advanced.js';

const args = process.argv.slice(2);
let moduleSpecifier = process.env.KATEX_MODULE_PATH || 'katex';
if (args.length) {
  if (args.length !== 2 || args[0] !== '--katex-module' || !args[1]) {
    throw new Error('Usage: node scripts/compile-formulas.mjs [--katex-module /absolute/katex.mjs]');
  }
  moduleSpecifier = args[1];
}
if (isAbsolute(moduleSpecifier) || moduleSpecifier.startsWith('.')) {
  moduleSpecifier = pathToFileURL(resolve(moduleSpecifier)).href;
}
const imported = await import(moduleSpecifier);
const katex = imported.default || imported;

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = value => value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
  if (code.startsWith('#x')) return String.fromCodePoint(parseInt(code.slice(2), 16));
  if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
  return entities[code] ?? whole;
});

// KaTeX emits a small, trusted XML vocabulary. This dependency-free parser keeps
// the MathML hierarchy, which is necessary to preserve fractions and exponents.
function parseMathML(xml) {
  const root = { tag: 'root', children: [] };
  const stack = [root];
  for (const token of xml.match(/<[^>]*>|[^<]+/g) || []) {
    if (token.startsWith('</')) {
      if (stack.length === 1) throw new Error('Unbalanced generated MathML');
      stack.pop();
    } else if (token.startsWith('<')) {
      if (token.startsWith('<?') || token.startsWith('<!')) continue;
      const tag = /^<([\w:-]+)/.exec(token)?.[1];
      if (!tag) throw new Error('Invalid generated MathML element');
      const attrs = Object.fromEntries([...token.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], decode(m[2])]));
      const node = { tag, attrs, children: [] };
      stack.at(-1).children.push(node);
      if (!token.endsWith('/>')) stack.push(node);
    } else {
      stack.at(-1).children.push(decode(token));
    }
  }
  if (stack.length !== 1) throw new Error('Unclosed generated MathML');
  return root;
}

const superMap = Object.fromEntries([...('0123456789+-−=()')].map((c, i) => [c, [...'⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁼⁽⁾'][i]]));
const subMap = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎', i: 'ᵢ', j: 'ⱼ', n: 'ₙ', r: 'ᵣ', k: 'ₖ', a: 'ₐ', x: 'ₓ' };
const superscript = text => text === '∘' ? '°' : /^[′″‴]+$/.test(text) ? text : [...text].every(c => superMap[c]) ? [...text].map(c => superMap[c]).join('') : `^(${text})`;
const subscript = text => [...text].every(c => subMap[c]) ? [...text].map(c => subMap[c]).join('') : `_[${text}]`;

function toPlain(node) {
  if (typeof node === 'string') return node;
  const children = node.children || [];
  const all = () => children.map(toPlain).join('');
  const child = i => toPlain(children[i] || '');
  const rows = table => table.children.filter(n => typeof n !== 'string' && n.tag === 'mtr')
    .map(row => row.children.filter(n => typeof n !== 'string' && n.tag === 'mtd').map(toPlain));
  switch (node.tag) {
    case 'annotation': case 'annotation-xml': case 'mphantom': return '';
    case 'mspace': return ' ';
    case 'mi': {
      const value = all();
      if (node.attrs?.mathvariant === 'double-struck') return ({ Z: 'ℤ', Q: 'ℚ', R: 'ℝ', C: 'ℂ', N: 'ℕ' })[value] || value;
      return value;
    }
    case 'msup': return child(0) + superscript(child(1));
    case 'msub': return child(0) + subscript(child(1));
    case 'msubsup': return child(0) === '∫' ? `∫[${child(1)}→${child(2)}]` : child(0) + subscript(child(1)) + superscript(child(2));
    case 'mfrac': return /^0(?:px|em|pt)?$/.test(node.attrs?.linethickness || '') ? `C(${child(0)},${child(1)})` : `(${child(0)})/(${child(1)})`;
    case 'msqrt': return `√(${all()})`;
    case 'mroot': return `${superscript(child(1))}√(${child(0)})`;
    case 'munder': return `${child(0)}[${child(1)}]`;
    case 'munderover': return `${child(0)}[${child(1)}…${child(2)}]`;
    case 'mover': {
      const accent = child(1);
      if (['ˉ', '¯', '‾'].includes(accent)) return `${child(0)}\u0304`;
      if (['→', '⃗'].includes(accent)) return `${child(0)}\u20d7`;
      return `${child(0)}[${accent}]`;
    }
    case 'mtable': return `[${rows(node).map(r => r.join(', ')).join('; ')}]`;
    case 'mrow': {
      const table = children.find(n => typeof n !== 'string' && n.tag === 'mtable');
      if (table) {
        const first = toPlain(children[0]);
        if (first === '{') return `{ ${rows(table).map(r => r.join(' ')).join('; ')} }`;
        if (first === '(' || first === '[') return toPlain(table);
      }
      return all();
    }
    default: return all();
  }
}

const entries = [...foundationEntries, ...advancedEntries];
const formulaMarkup = {};
const formulaPlain = {};
for (const entry of entries) {
  if (Object.hasOwn(formulaMarkup, entry.id)) throw new Error(`Duplicate entry: ${entry.id}`);
  const rendered = katex.renderToString(entry.formula, {
    output: 'mathml', displayMode: true, throwOnError: true, strict: 'error', trust: false,
  });
  const match = rendered.match(/<math\b[\s\S]*<\/math>/);
  if (!match) throw new Error(`No MathML generated for ${entry.id}`);
  formulaMarkup[entry.id] = match[0];
  formulaPlain[entry.id] = toPlain(parseMathML(match[0]))
    .replace(/[\u2061\u2062\u2063\u2064]/g, '')
    .replace(/[\s\u00a0\u2009]+/g, ' ').trim();
  if (!formulaPlain[entry.id] || /\\[a-z]+/i.test(formulaPlain[entry.id])) {
    throw new Error(`Unreadable plain formula for ${entry.id}`);
  }
}

const output = fileURLToPath(new URL('../dist/formulas.js', import.meta.url));
const content = `// Generated by scripts/compile-formulas.mjs with KaTeX ${katex.version}.\n// Native MathML needs no external rendering scripts, fonts or stylesheets.\nexport const formulaMarkup = ${JSON.stringify(formulaMarkup, null, 2)};\n\nexport const formulaPlain = ${JSON.stringify(formulaPlain, null, 2)};\n`;
await writeFile(output, content, 'utf8');
console.log(`Compiled ${entries.length} formulas to native MathML and readable text.`);
