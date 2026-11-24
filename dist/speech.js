/**
 * Japanese, browser-native text-to-speech for Math Atlas.
 * No audio is started until read() or resume() is called by the interface.
 *
 * Sources for the platform contract:
 * https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
 * https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
 * https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisErrorEvent/error
 */

import { spokenText, spokenFormula } from './math-speech.js';

const isJapanese = voice => /^ja(?:[-_]|$)/i.test(voice.lang || '');
let wordSegmenter = null;
try { wordSegmenter = new Intl.Segmenter('ja', { granularity: 'word' }); } catch (_) { /* Older engines use phrase boundaries. */ }

function wordStarts(text) {
  if (wordSegmenter) {
    return [0, ...Array.from(wordSegmenter.segment(text))
      .filter(part => part.isWordLike).map(part => part.index)];
  }
  const starts = [0];
  for (const match of text.matchAll(/[、。！？!?；;\s]+/gu)) starts.push(match.index + match[0].length);
  return starts;
}

function resumeOffset(text, requested) {
  // Some voices report a character inside a word. Resume at its start so a
  // mathematical name, decimal or variable is never resumed halfway through.
  let safe = 0;
  for (const start of wordStarts(text)) {
    if (start > requested) break;
    safe = start;
  }
  return safe;
}

export function splitSpeech(segments, rate = 1) {
  const max = Math.max(80, Math.min(180, Math.round(140 * rate)));
  const chunks = [];
  for (const segment of segments) {
    const text = segment && typeof segment === 'object' && typeof segment.math === 'string'
      ? spokenFormula(segment.math)
      : spokenText(segment);
    if (!text) continue;
    const sentences = text.match(/[^。！？!?]+[。！？!?]*/gu) || [text];
    for (const sentence of sentences) {
      let remaining = sentence.trim();
      while (remaining.length > max) {
        // Prefer a spoken pause. A comma inside 1,000 is not a pause.
        const pauses = Array.from(remaining.slice(0, max + 1).matchAll(/[、；;\s]+|(?<![0-9]),(?![0-9])/gu));
        let cut = pauses.length ? pauses[pauses.length - 1].index + pauses[pauses.length - 1][0].length : 0;
        if (cut < max / 3) {
          const starts = wordStarts(remaining).filter(start => start > 0 && start <= max);
          cut = starts[starts.length - 1] || 0;
        }
        // Do not sever an indivisible word just to meet a character budget.
        if (!cut) {
          const next = wordStarts(remaining).find(start => start >= max);
          if (!next) break;
          cut = next;
        }
        const part = remaining.slice(0, cut).trim();
        if (part) chunks.push(part);
        remaining = remaining.slice(cut).trimStart();
      }
      if (remaining) chunks.push(remaining);
    }
  }
  return chunks;
}

const ERROR_MESSAGES = {
  'not-allowed': '音声を開始できませんでした。読み上げボタンをもう一度押してください。',
  'audio-busy': '音声出力を利用できません。ほかの音声アプリを確認して、もう一度お試しください。',
  'audio-hardware': '音声出力が見つかりません。端末のスピーカーやイヤホンを確認してください。',
  'network': '音声の取得に失敗しました。接続を確認するか、別の音声を選んでください。',
  'synthesis-unavailable': '端末の読み上げ音声を利用できません。端末の音声設定を確認してください。',
  'language-unavailable': '日本語の読み上げ音声を利用できません。端末に日本語音声を追加してください。',
  'voice-unavailable': '選択した音声を利用できません。音声設定から別の音声を選んでください。',
  'text-too-long': 'この文章の読み上げを開始できませんでした。別の解説でお試しください。',
  'synthesis-failed': '読み上げが中断されました。読み上げボタンからもう一度お試しください。',
  'timeout': '読み上げが応答していません。読み上げボタンからもう一度お試しください。'
};

export class SpeechReader extends EventTarget {
  constructor() {
    super();
    this.state = 'idle';
    this.rate = 1;
    this.voiceURI = '';
    this.title = '';
    this.mode = '';
    this.index = 0;
    this.total = 0;
    this.error = null;
    this._synth = null;
    this._Utterance = null;
    this._chunks = [];
    this._offset = 0;
    this._length = 0;
    this._token = 0;
    this._utterance = null;
    this._startTimer = null;
    this._endTimer = null;
    this._destroyed = false;
    try {
      this._synth = globalThis.speechSynthesis || null;
      this._Utterance = globalThis.SpeechSynthesisUtterance || null;
    } catch (_) { /* Speech services can be disabled by browser policy. */ }
    this.supported = Boolean(this._synth && this._Utterance);
    this._onVoices = () => {
      if (this._destroyed) return;
      this.dispatchEvent(new CustomEvent('voiceschange', { detail: { voices: this.getVoices() } }));
    };
    this._onPageHide = () => this.stop();
    if (this.supported) {
      try { this._synth.addEventListener('voiceschanged', this._onVoices); } catch (_) { /* getVoices remains usable. */ }
      this.getVoices();
      queueMicrotask(this._onVoices);
    }
    if (globalThis.addEventListener) globalThis.addEventListener('pagehide', this._onPageHide);
  }

  _availableVoices() {
    if (!this.supported || this._destroyed) return [];
    try {
      return Array.from(this._synth.getVoices());
    } catch (_) { return []; }
  }

  getVoices() {
    return this._availableVoices().filter(isJapanese).sort((a, b) => {
      const weight = voice => (/^ja[-_]JP$/i.test(voice.lang) ? 20 : 0) + (voice.default ? 4 : 0) + (voice.localService ? 2 : 0);
      return weight(b) - weight(a) || a.name.localeCompare(b.name, 'ja');
    });
  }

  configure({ rate, voiceURI } = {}) {
    if (this._destroyed) return;
    const nextRate = Number.isFinite(Number(rate)) && rate !== undefined ? Math.min(2, Math.max(0.5, Number(rate))) : this.rate;
    const nextVoice = typeof voiceURI === 'string' ? voiceURI : this.voiceURI;
    const changed = nextRate !== this.rate || nextVoice !== this.voiceURI;
    this.rate = nextRate;
    this.voiceURI = nextVoice;
    if (changed && this.state === 'playing') {
      // Resume from the last boundary of the current chunk, never the article's start.
      this._cancelCurrent();
      this._speakCurrent();
    } else {
      this._emit();
    }
  }

  read({ title = '', mode = '', segments = [] } = {}) {
    if (this._destroyed) return;
    this._cancelCurrent();
    this.title = String(title);
    this.mode = String(mode);
    this.index = 0;
    this._offset = 0;
    this._chunks = splitSpeech(Array.isArray(segments) ? segments : [segments], this.rate);
    this.total = this._chunks.length;
    this._length = this._chunks.reduce((length, chunk) => length + chunk.length, 0);
    this.error = null;
    if (!this.supported) {
      this.state = 'error';
      this.error = 'このブラウザでは読み上げを利用できません。対応ブラウザでお試しください。';
      this._emit();
      return;
    }
    if (!this.total) {
      this.state = 'idle';
      this._emit();
      return;
    }
    this.state = 'playing';
    // Deliberately synchronous: Safari can require speak() in the initiating tap.
    this._speakCurrent();
  }

  pause() {
    if (this._destroyed || this.state !== 'playing') return;
    // Native pause is inconsistent across mobile engines. Cancelling the current
    // short chunk and keeping its last boundary gives deterministic pause/resume.
    this.state = 'paused';
    this._cancelCurrent();
    this._emit();
  }

  resume() {
    if (this._destroyed || this.state !== 'paused') return;
    this.state = 'playing';
    this.error = null;
    this._speakCurrent();
  }

  toggle() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  stop() {
    if (this._destroyed) return;
    this._cancelCurrent();
    this.state = 'idle';
    this.title = '';
    this.mode = '';
    this.index = 0;
    this.total = 0;
    this.error = null;
    this._chunks = [];
    this._offset = 0;
    this._length = 0;
    this._emit();
  }

  destroy() {
    if (this._destroyed) return;
    this.stop();
    this._destroyed = true;
    try { this._synth?.removeEventListener('voiceschanged', this._onVoices); } catch (_) { /* Already unavailable. */ }
    if (globalThis.removeEventListener) globalThis.removeEventListener('pagehide', this._onPageHide);
  }

  _clearTimers() {
    clearTimeout(this._startTimer);
    clearTimeout(this._endTimer);
    this._startTimer = null;
    this._endTimer = null;
  }

  _cancelCurrent() {
    // Invalidate callbacks before cancel(), which can fire interrupted synchronously.
    this._token += 1;
    this._clearTimers();
    this._utterance = null;
    try {
      this._synth?.cancel();
      // Some engines retain paused state after cancellation.
      if (this._synth?.paused) this._synth.resume();
    } catch (_) { /* The next start reports any actual service failure. */ }
  }

  _speakCurrent() {
    if (this._destroyed || this.state !== 'playing') return;
    if (this.index >= this.total) {
      this._clearTimers();
      this._utterance = null;
      this.state = 'idle';
      this._offset = 0;
      this._emit();
      return;
    }
    const original = this._chunks[this.index];
    const offset = Math.min(this._offset, Math.max(0, original.length - 1));
    const text = original.slice(offset);
    const token = ++this._token;
    const current = () => token === this._token && !this._destroyed;
    this._clearTimers();
    try {
      const utterance = new this._Utterance(text);
      // Keep a strong reference; some engines otherwise lose their event callbacks.
      this._utterance = utterance;
      utterance.lang = 'ja-JP';
      utterance.rate = this.rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voices = this.getVoices();
      const selected = voices.find(voice => voice.voiceURI === this.voiceURI) || voices[0];
      // Never send Japanese mathematics to a known foreign-language voice.
      // An empty list may mean voices are still loading; keep lang=ja-JP in
      // that case so the engine can resolve its Japanese default on the tap.
      if (!selected && this._availableVoices().length) {
        this._fail('language-unavailable');
        return;
      }
      if (selected) {
        utterance.voice = selected;
        utterance.lang = selected.lang || 'ja-JP';
      }
      utterance.onstart = () => {
        if (!current()) return;
        clearTimeout(this._startTimer);
        this._startTimer = null;
        // One bounded watchdog per chunk, not a recurring pause/resume loop.
        const duration = Math.max(25000, Math.min(120000, text.length * 650 / this.rate + 15000));
        this._endTimer = setTimeout(() => {
          if (current() && this.state === 'playing') this._fail('timeout');
        }, duration);
        this._emit();
      };
      utterance.onboundary = event => {
        if (!current() || this.state !== 'playing') return;
        if (Number.isFinite(event.charIndex) && event.charIndex >= 0) {
          const requested = Math.min(original.length - 1, offset + Math.floor(event.charIndex));
          this._offset = Math.max(this._offset, resumeOffset(original, requested));
          this._emit();
        }
      };
      utterance.onend = () => {
        if (!current() || this.state !== 'playing') return;
        this._clearTimers();
        this.index += 1;
        this._offset = 0;
        this._utterance = null;
        this._speakCurrent();
      };
      utterance.onerror = event => {
        if (!current()) return;
        // Self-initiated cancel callbacks are already excluded by the token.
        // External interruptions must leave playing state and show a recovery path.
        this._fail(event.error || 'synthesis-failed');
      };
      this._startTimer = setTimeout(() => {
        if (current() && this.state === 'playing') this._fail('timeout');
      }, 12000);
      if (this._synth.paused) this._synth.resume();
      this._synth.speak(utterance);
      this._emit();
    } catch (_) {
      if (current()) this._fail('synthesis-unavailable');
    }
  }

  _fail(code) {
    this._cancelCurrent();
    this.state = 'error';
    this.error = ERROR_MESSAGES[code] || ERROR_MESSAGES['synthesis-failed'];
    this._emit();
  }

  _emit() {
    const completed = this._chunks.slice(0, this.index).reduce((length, chunk) => length + chunk.length, 0);
    const progress = this._length ? Math.min(100, Math.round((completed + this._offset) / this._length * 100)) : 0;
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        state: this.state,
        title: this.title,
        mode: this.mode,
        index: this.index,
        total: this.total,
        progress,
        error: this.error
      }
    }));
  }
}
