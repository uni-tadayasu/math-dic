import { getSampleSnapshot, recognizeStrokes } from './handwriting.js';

const abortError = () => new DOMException('読み取りを中止しました。', 'AbortError');

/** Keep recognition off the drawing thread; the caller owns cancellation. */
export function recognizeHandwriting(operations, { signal } = {}) {
  if (signal?.aborted) return Promise.reject(abortError());
  const samples = getSampleSnapshot();
  const fallback = async () => {
    // Older browsers still get the same recognizer. Yield before the bounded
    // calculation so the button state can paint, and never retry a timeout here.
    await new Promise(resolve => setTimeout(resolve, 20));
    if (signal?.aborted) throw abortError();
    if (operations.length > 80) throw new Error('一度に読み取る線が多いため、式を短く分けてください。');
    const result = recognizeStrokes(operations, { samples });
    if (signal?.aborted) throw abortError();
    return result;
  };
  if (typeof Worker === 'undefined') return fallback();
  return new Promise((resolve, reject) => {
    let worker = null, timer = null, done = false, usingFallback = false;
    const stopWorker = () => {
      clearTimeout(timer);
      timer = null;
      if (worker) {
        worker.onmessage = worker.onerror = worker.onmessageerror = null;
        worker.terminate();
        worker = null;
      }
    };
    const finish = (error, result) => {
      if (done) return;
      done = true;
      stopWorker();
      signal?.removeEventListener('abort', onAbort);
      if (error) reject(error); else resolve(result);
    };
    const onAbort = () => finish(abortError());
    const useFallback = () => {
      if (done || usingFallback) return;
      usingFallback = true;
      stopWorker();
      fallback().then(result => finish(null, result), error => finish(error));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) { onAbort(); return; }
    try {
      worker = new Worker(new URL('./handwriting-worker.js', import.meta.url), { type: 'module', name: 'math-handwriting' });
      worker.onmessage = event => {
        if (done || event.data?.id !== 1) return;
        if (event.data.error) finish(new Error(event.data.error));
        else if (event.data.result && Array.isArray(event.data.result.candidates)) finish(null, event.data.result);
        else finish(new Error('読み取り結果を受け取れませんでした。もう一度お試しください。'));
      };
      worker.onerror = event => { event.preventDefault?.(); useFallback(); };
      worker.onmessageerror = () => finish(new Error('筆跡を読み取れませんでした。もう一度お試しください。'));
      timer = setTimeout(() => finish(new Error('読み取りに時間がかかっています。式を短く分けて、もう一度お試しください。')), 15000);
      worker.postMessage({ id: 1, operations, samples });
    } catch (_) { useFallback(); }
  });
}
