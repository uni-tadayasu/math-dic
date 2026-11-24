#!/usr/bin/env node
import assert from 'node:assert/strict';
import { foundationEntries } from '../dist/data-foundations.js';
import { advancedEntries } from '../dist/data-advanced.js';
import { formulaMarkup, formulaPlain } from '../dist/formulas.js';

const entries = [...foundationEntries, ...advancedEntries];
const ids = new Set(entries.map(e => e.id));
assert.equal(entries.length, 80, 'The initial edition must contain 80 entries.');
assert.equal(ids.size, entries.length, 'Dictionary IDs must be unique.');
const categories = new Set(['numbers', 'algebra', 'geometry', 'functions', 'probability', 'calculus', 'linear']);
const levels = new Set(['小学校', '中学校', '高校', '大学基礎']);
const textFields = ['id', 'title', 'reading', 'short', 'summary', 'definition', 'formula', 'formulaSpeech', 'pitfall'];
for (const entry of entries) {
  assert.match(entry.id, /^[a-z]+(?:-[a-z]+)*$/, `${entry.id}: ID format`);
  assert(categories.has(entry.category), `${entry.id}: category`);
  assert(levels.has(entry.level), `${entry.id}: level`);
  for (const field of textFields) {
    assert.equal(typeof entry[field], 'string', `${entry.id}: ${field} type`);
    assert(entry[field].trim().length > 0, `${entry.id}: ${field} empty`);
  }
  for (const field of ['tags', 'aliases', 'explanation', 'related', 'sources']) {
    assert(Array.isArray(entry[field]), `${entry.id}: ${field} array`);
  }
  assert(entry.explanation.length >= 2, `${entry.id}: detailed explanation`);
  assert(entry.summary.length >= 30, `${entry.id}: summary must explain the concept`);
  assert(entry.example?.question && entry.example?.answer, `${entry.id}: worked example`);
  assert(entry.example?.steps?.length >= 2, `${entry.id}: worked example steps`);
  assert(entry.related.length > 0, `${entry.id}: related terms`);
  for (const id of entry.related) assert(ids.has(id), `${entry.id}: unresolved related term ${id}`);
  assert(entry.sources.length > 0, `${entry.id}: references`);
  for (const source of entry.sources) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:', `${entry.id}: source must use HTTPS`);
    assert(source.label.trim(), `${entry.id}: source label`);
  }
  assert.match(formulaMarkup[entry.id] || '', /^<math\b/, `${entry.id}: compiled native MathML`);
  assert.match(formulaMarkup[entry.id], /<\/math>$/, `${entry.id}: complete native MathML`);
  assert(!/<(?:script|iframe|img)\b|\bon\w+=/i.test(formulaMarkup[entry.id]), `${entry.id}: safe markup`);
  assert(formulaPlain[entry.id]?.trim(), `${entry.id}: readable plain formula`);
  assert(!/\\[a-z]+/i.test(formulaPlain[entry.id]), `${entry.id}: no raw TeX in plain formula`);
}
assert.equal(Object.keys(formulaMarkup).length, entries.length, 'MathML count');
assert.equal(Object.keys(formulaPlain).length, entries.length, 'Plain formula count');

// These structural examples guard against losing mathematical meaning when
// native MathML is converted for the plain-text blackboard fallback.
assert.match(formulaPlain['area-circle'], /r²/, 'Preserve numeric exponents');
assert.match(formulaPlain['quadratic-formula'], /√\(/, 'Preserve square roots');
assert.match(formulaPlain['fraction'], /\(a\)\/\(b\)/, 'Preserve fractions');
assert.match(formulaPlain['matrix'], /\[a, b; c, d\]/, 'Preserve matrix rows');
assert.match(formulaPlain['absolute-value'], /x≥0.*x<0/, 'Preserve piecewise conditions');
console.log(`Validated ${entries.length} entries: unique IDs, resolved links, examples, sources and compiled formulas.`);
