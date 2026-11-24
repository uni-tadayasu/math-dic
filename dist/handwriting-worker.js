import { recognizeStrokes } from './handwriting.js';

// This worker handles local ink only. It has no network or storage side effects.
self.onmessage = ({ data }) => {
  if (data?.id !== 1 || !Array.isArray(data.operations)) return;
  try {
    const result = recognizeStrokes(data.operations, { samples: data.samples });
    self.postMessage({ id: data.id, result });
  } catch (_) {
    self.postMessage({ id: data.id, error: '筆跡を読み取れませんでした。文字を少し離して、もう一度お試しください。' });
  }
};
