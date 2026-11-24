#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spokenFormula, spokenText } from '../dist/math-speech.js';
import { applyPronunciations } from '../dist/speech-lexicon.js';
import { splitSpeech } from '../dist/speech.js';
import { parseFormula, analyzeFormula } from '../dist/formula-engine.js';
import { foundationEntries } from '../dist/data-foundations.js';
import { advancedEntries } from '../dist/data-advanced.js';

// Meaningful regression cases: protect mathematical scope and distinguish the
// expressions whose former character replacement could read them identically.
let cases = 0;
function check(name, run) {
  try { run(); cases++; } catch (error) { error.message = `${name}: ${error.message}`; throw error; }
}
check('A fraction is read denominator first, without reversing its value', () => {
  assert.equal(spokenFormula('1/2'), '2ぶんの1');
  assert.equal(spokenFormula('2/1'), '1ぶんの2');
});
check('An implicit coefficient is multiplication', () => {
  assert.equal(spokenFormula('2x+1'), '2、かける、エックス、たす、1');
});
check('The numerator and denominator are explicitly identified', () => {
  assert.equal(spokenFormula('(x+1)/(x-1)'), 'ぶんしが、かっこ、エックス、たす、1、かっことじ、ぶんぼが、かっこ、エックス、ひく、1、かっことじ、のぶんすう');
});
for (const [left, right] of [
  ['-x^2', '(-x)^2'], ['x+1^2', '(x+1)^2'],
  ['x^a+1', 'x^(a+1)'], ['1/x+1', '1/(x+1)'],
  ['sqrt(x)+1', 'sqrt(x+1)'], ['log(x)+1', 'log(x+1)'],
  ['ln(x)+1', 'ln(x+1)'], ['(x^2)^3', 'x^(2^3)'],
  ['x_i^2', 'x_{i^2}'], ['x/(2*x)', 'x/2*x']
]) check(`Different scope must remain audible: ${left} versus ${right}`, () => {
  assert.notEqual(spokenFormula(left), spokenFormula(right));
});
check('Square-root scope ends before the following addition', () => {
  assert.equal(spokenFormula('sqrt(x)+1'), 'ルート、かっこ、エックス、かっことじ、たす、1');
});
check('Common and natural logarithms have different names', () => {
  assert.equal(spokenFormula('log(x)+1'), 'エックスのじょうようたいすう、たす、1');
  assert.equal(spokenFormula('ln(x)+1'), 'エックスのしぜんたいすう、たす、1');
});
check('Scientific notation preserves a negative exponent', () => {
  assert.equal(spokenFormula('1.25e-3'), '1.25、かける、10のマイナス3乗');
});
check('Derivatives keep their prime mark', () => {
  assert.match(spokenFormula("f'(x)"), /エフダッシュ/);
  assert.notEqual(spokenFormula("f'(x)"), spokenFormula('f(x)'));
});
check('Combination notation is not a product of three symbols', () => {
  assert.equal(spokenText('3C2'), '3個から2個を選ぶくみあわせの数');
});
check('The condition of conditional probability is in the correct direction', () => {
  assert.equal(spokenText('P(A|B)'), 'ビーを条件とする、エーのかくりつ');
});
check('A point annotation is not multiplication', () => {
  const text = spokenText('この式の値は -0.005（x=-5）です。');
  assert.doesNotMatch(text, /かける/);
  assert.match(text, /マイナス0\.005/);
  assert.match(text, /エックス、イコール、マイナス5/);
});
check('Unicode square root has the same scope as the formula engine', () => {
  parseFormula('√(x)^2');
  assert.equal(spokenFormula('√(x)^2'), spokenFormula('sqrt(x)^2'));
  assert.notEqual(spokenFormula('√(x)^2'), spokenFormula('sqrt(x^2)'));
});
check('Uncertainty and percentage annotations are not multiplication', () => {
  assert.doesNotMatch(spokenText('測定値は3.2（±0.4）です。'), /かける/);
  assert.doesNotMatch(spokenText('値は5（95%）です。'), /かける/);
  assert.match(spokenText('測定値は3.2（±0.4）です。'), /プラスマイナス/);
  assert.match(spokenText('値は5（95%）です。'), /パーセント/);
  assert.match(spokenFormula('2(3+4)'), /かける/);
});
check('Decimals retain their zeroes and precision', () => {
  assert.equal(spokenText('0.001と1.10です。'), '0.001と1.10です。');
});
check('A physical unit is not interpreted as variables', () => {
  assert.equal(spokenText('長さは10 cmです。'), '長さは10センチメートルです。');
});
check('Dates, ordinary words and web addresses are protected', () => {
  const text = '日時は2026/11/24です。Web Speech APIを使い、https://example.com/a-b?x=2 を参照します。';
  assert.equal(spokenText(text), text);
});
check('Unknown syntax is preserved instead of dropping information', () => {
  for (const expression of ['unknown(x)', 'x@2', '\\unsupported{x}', 'sqrt(x,y)', 'sin(x,y)', "sin'(x)"]) {
    assert.equal(spokenFormula(expression), expression);
  }
});
check('Mathematical readings override ambiguous kanji', () => {
  assert.equal(applyPronunciations('重解、値域、定義域、差商、漸近線、正弦、余弦。'), 'じゅうかい、ちいき、ていぎいき、さしょう、ぜんきんせん、せいげん、よげん。');
});
check('Ordinary Japanese is not damaged by single-character substitutions', () => {
  const text = '解説を理解して値上げを比べる。見積もりと積み上げ。街角を曲がる。海の底を見る。勝負をする。';
  assert.equal(applyPronunciations(text), text);
});
check('Both text and explicit mathematical segments reach the same reader', () => {
  assert.equal(splitSpeech(['式です。', { math: '(x+1)/(x-1)' }]).join(''), '式です。' + spokenFormula('(x+1)/(x-1)'));
});
check('Long narration is divided without losing or repeating text', () => {
  const source = 'エックスのにじょう、たす、エックス、たす、1。'.repeat(20);
  const chunks = splitSpeech([source], 0.75);
  assert.ok(chunks.length > 1);
  assert.equal(chunks.join(''), spokenText(source));
});

const labCases = ['x^2', 'a*x^2+b*x+c', '(x+1)/(x-1)', '-x^2', 'x^-2', '2^3^2', 'sqrt(x+1)', 'abs(x)', 'sin(x)', 'cos(x)', 'tan(x)', 'exp(-x)', 'log(x)', 'ln(x)', 'pi*x', '1e-3*x', '2(x+1)', 'sin(x)cos(x)', 'f(x)=x^2', 'y=2x+1'];
for (const expression of labCases) check(`A supported formula is completely narrated: ${expression}`, () => {
  parseFormula(expression);
  const text = spokenFormula(expression);
  assert.ok(text.trim());
  assert.doesNotMatch(text, /[A-Za-z_^=<>√*/]/);
});

let segments = 0;
for (const entry of [...foundationEntries, ...advancedEntries]) {
  for (const source of [entry.reading, entry.definition, entry.formulaSpeech, ...entry.explanation, entry.summary, entry.example.question, ...entry.example.steps, entry.example.answer, entry.pitfall]) {
    const text = spokenText(source);
    assert.ok(text.trim(), `${entry.id}: empty narration`);
    assert.doesNotMatch(text, /[=^_<>≠≤≥≧≦√]|[A-Za-z]{1,3}\(/, `${entry.id}: unconverted formula in ${source}`);
    assert.doesNotMatch(text, /undefined|\[object Object\]/, `${entry.id}: invalid narration`);
    segments++;
  }
}
for (const expression of ['a*x^2+b*x+c', '(x+1)/(x-1)', 'log(x)', '1e-3*x']) {
  const result = analyzeFormula(expression);
  const e = result.explanation;
  for (const source of [e.meaning, ...e.steps, ...e.parameters, ...e.conditions, ...(e.sample?.steps || []), ...result.summary]) {
    assert.doesNotMatch(spokenText(source), /[=^_<>≠≤≥≧≦√]/, `${expression}: unconverted analysis formula in ${source}`);
  }
}
console.log(`Validated ${cases} mathematical speech regressions, ${segments} dictionary segments and generated formula explanations.`);
