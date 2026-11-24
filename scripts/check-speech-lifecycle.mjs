#!/usr/bin/env node
import assert from 'node:assert/strict';
import { SpeechReader } from '../dist/speech.js';

// Exercise the real speech/formatting modules with an in-memory browser speech
// service. This checks application behavior, not native audio or pronunciation.
const japanese = { lang: 'ja-JP', name: 'Japanese', voiceURI: 'ja', localService: true };
const english = { lang: 'en-US', name: 'English', voiceURI: 'en', default: true };
class Utterance { constructor(text) { this.text = text; } }
class Synth extends EventTarget {
  constructor(voices) { super(); this.voices = voices; this.log = []; this.current = null; this.paused = false; }
  getVoices() { return this.voices; }
  speak(utterance) { this.log.push(utterance); this.current = utterance; utterance.onstart?.(); }
  cancel() {
    const previous = this.current;
    this.current = null;
    // Some engines dispatch cancellation synchronously.
    previous?.onerror?.({ error: 'interrupted' });
  }
  resume() { this.paused = false; }
}

let checked = 0;
function check(name, voices, run) {
  const saved = new Map(['speechSynthesis', 'SpeechSynthesisUtterance'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const synth = new Synth(voices);
  globalThis.speechSynthesis = synth;
  globalThis.SpeechSynthesisUtterance = Utterance;
  const reader = new SpeechReader();
  const events = [];
  reader.addEventListener('change', event => events.push(event.detail));
  try {
    run({ reader, synth, events });
    checked += 1;
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  } finally {
    reader.destroy();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

check('Japanese voices only, including a saved foreign preference', [english, japanese], ({ reader, synth }) => {
  assert.deepEqual(reader.getVoices(), [japanese]);
  reader.configure({ voiceURI: english.voiceURI });
  reader.read({ segments: ['数式を説明します。'] });
  assert.equal(synth.current.voice, japanese);
  assert.equal(synth.current.lang, 'ja-JP');
});

check('A foreign-only device must not speak Japanese using English', [english], ({ reader, synth, events }) => {
  reader.read({ segments: ['数式を説明します。'] });
  assert.equal(reader.state, 'error');
  assert.match(events.at(-1).error, /日本語/);
  assert.equal(synth.log.length, 0);
});

check('An empty voice list starts synchronously with Japanese language', [], ({ reader, synth }) => {
  reader.read({ segments: ['数式を説明します。'] });
  assert.equal(reader.state, 'playing');
  assert.equal(synth.log.length, 1);
  assert.equal(synth.current.lang, 'ja-JP');
  assert.equal(synth.current.voice, undefined);
});

check('Voice updates refresh choices without starting or restarting speech', [], ({ reader, synth }) => {
  let updated;
  reader.addEventListener('voiceschange', event => { updated = event.detail.voices; });
  synth.voices = [english, japanese];
  synth.dispatchEvent(new Event('voiceschanged'));
  assert.deepEqual(updated, [japanese]);
  assert.equal(synth.log.length, 0);
  reader.read({ segments: ['数式を説明します。'] });
  synth.dispatchEvent(new Event('voiceschanged'));
  assert.equal(synth.log.length, 1);
});

check('Pause and resume never restart in the middle of a word', [japanese], ({ reader, synth }) => {
  reader.read({ segments: ['エックス プラス エックスです。'] });
  const old = synth.current;
  const word = old.text.indexOf('プラス');
  assert.ok(word >= 0);
  old.onboundary({ charIndex: word + 1 });
  reader.pause();
  old.onend();
  old.onerror({ error: 'interrupted' });
  assert.equal(reader.state, 'paused');
  assert.equal(synth.log.length, 1);
  reader.configure({ rate: 0.75 });
  assert.equal(synth.log.length, 1);
  reader.resume();
  assert.equal(synth.current.text, old.text.slice(word));
  assert.equal(synth.current.rate, 0.75);
  assert.equal(reader.state, 'playing');
});

check('Replacing and stopping speech ignores old callbacks', [japanese], ({ reader, synth, events }) => {
  reader.read({ title: '前の説明', segments: ['前の説明です。'] });
  const old = synth.current;
  reader.read({ title: '次の説明', segments: ['次の説明です。'] });
  old.onend();
  old.onerror({ error: 'interrupted' });
  assert.equal(reader.state, 'playing');
  assert.equal(events.at(-1).title, '次の説明');
  assert.equal(synth.log.length, 2);
  const current = synth.current;
  reader.stop();
  current.onend();
  current.onerror({ error: 'interrupted' });
  assert.equal(reader.state, 'idle');
  assert.equal(events.at(-1).title, '');
  assert.equal(events.at(-1).error, null);
  assert.equal(synth.log.length, 2);
});

check('Sentences play in order and complete with full progress', [japanese], ({ reader, synth, events }) => {
  reader.read({ segments: ['一つ目の説明です。', '二つ目の説明です。'] });
  const first = synth.current;
  first.onend();
  assert.equal(synth.log.length, 2);
  assert.notEqual(synth.current.text, first.text);
  first.onend();
  assert.equal(synth.log.length, 2);
  synth.current.onend();
  assert.equal(reader.state, 'idle');
  assert.equal(events.at(-1).progress, 100);
});

check('A speech error stops playback and a fresh read can recover', [japanese], ({ reader, synth, events }) => {
  reader.read({ segments: ['数式を説明します。'] });
  synth.current.onerror({ error: 'network' });
  assert.equal(reader.state, 'error');
  assert.ok(events.at(-1).error);
  reader.read({ segments: ['もう一度説明します。'] });
  assert.equal(reader.state, 'playing');
  assert.equal(events.at(-1).error, null);
  assert.equal(synth.log.length, 2);
});

console.log(`Validated ${checked} speech lifecycle scenarios with the real speech and math-formatting modules.`);
