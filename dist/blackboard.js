/**
 * Responsive vector blackboard. Logical coordinates stay 1200 × 800 regardless
 * of display size. Erasers operate only on a separate transparent ink layer.
 * Persistence: IndexedDB, per board key, with a temporary in-memory fallback.
 * https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events
 * https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
 */

const W = 1200;
const H = 800;
const BACKGROUND = '#143e36';
const TOOLS = new Set(['pen', 'eraser', 'line', 'rect', 'circle']);
const sessionBoards = new Map();
const clamp = (number, min, max) => Math.min(max, Math.max(min, number));

function drawOperation(ctx, op) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = op.width || 3;
  ctx.strokeStyle = op.color || '#f4f4dc';
  ctx.fillStyle = op.color || '#f4f4dc';
  if (op.type === 'text') {
    ctx.font = `${op.fontSize || 42}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    ctx.textBaseline = 'top';
    for (let i = 0; i < op.lines.length; i++) ctx.fillText(op.lines[i], op.x, op.y + i * op.lineHeight);
  } else if (op.type === 'pen' || op.type === 'eraser') {
    if (op.type === 'eraser') ctx.globalCompositeOperation = 'destination-out';
    const points = op.points || [];
    if (points.length === 1) {
      const [x, y, pressure] = points[0];
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, op.width * (pressure || 1) / 2), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 1; i < points.length; i++) {
      const previous = points[i - 1];
      const point = points[i];
      ctx.lineWidth = op.width * ((previous[2] + point[2]) / 2 || 1);
      ctx.beginPath();
      ctx.moveTo(previous[0], previous[1]);
      ctx.lineTo(point[0], point[1]);
      ctx.stroke();
    }
  } else if (op.type === 'line') {
    ctx.beginPath();
    ctx.moveTo(op.x1, op.y1);
    ctx.lineTo(op.x2, op.y2);
    ctx.stroke();
  } else if (op.type === 'rect') {
    ctx.strokeRect(Math.min(op.x1, op.x2), Math.min(op.y1, op.y2), Math.abs(op.x2 - op.x1), Math.abs(op.y2 - op.y1));
  } else if (op.type === 'circle') {
    ctx.beginPath();
    ctx.arc(op.x1, op.y1, Math.hypot(op.x2 - op.x1, op.y2 - op.y1), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackground(ctx) {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(211, 236, 224, 0.055)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 40; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 40; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

function validOperations(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(op => {
    if (!op || typeof op !== 'object' || !Number.isFinite(op.width)) return false;
    if (op.type === 'text') return Array.isArray(op.lines) && op.lines.every(line => typeof line === 'string') && [op.x, op.y, op.fontSize, op.lineHeight].every(Number.isFinite);
    if (op.type === 'pen' || op.type === 'eraser') return Array.isArray(op.points) && op.points.every(point => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]));
    return TOOLS.has(op.type) && [op.x1, op.x2, op.y1, op.y2].every(Number.isFinite);
  });
}

export class Blackboard {
  constructor({ canvas, onChange = () => {}, onError = () => {} }) {
    if (!canvas || !canvas.getContext) throw new TypeError('黒板の canvas が必要です。');
    this.canvas = canvas;
    this._context = canvas.getContext('2d');
    if (!this._context) throw new Error('このブラウザでは黒板を表示できません。');
    this._ink = document.createElement('canvas');
    this._inkContext = this._ink.getContext('2d');
    this.onChange = onChange;
    this.onError = onError;
    this.tool = 'pen';
    this.color = '#f4f4dc';
    this.width = 3;
    this.key = '';
    this.saved = true;
    this.error = null;
    this._ops = [];
    this._redo = [];
    this._draft = null;
    this._pointerId = null;
    this._lastPoint = null;
    this._revision = 0;
    this._loadToken = 0;
    this._loading = false;
    this._destroyed = false;
    this._frame = null;
    this._saveTimer = null;
    this._saveQueue = Promise.resolve(true);
    this._dbPromise = null;
    this.canvas.style.touchAction = 'none';
    this.canvas.style.userSelect = 'none';
    this.canvas.style.webkitUserSelect = 'none';
    this.canvas.style.cursor = 'crosshair';
    this._onDown = event => this._pointerDown(event);
    this._onMove = event => this._pointerMove(event);
    this._onUp = event => this._pointerUp(event);
    this._onContext = event => event.preventDefault();
    this._onVisibility = () => { if (document.visibilityState === 'hidden') void this.flush(); };
    this._onPageHide = () => { void this.flush(); };
    this._onResize = () => this._resize();
    canvas.addEventListener('pointerdown', this._onDown, { passive: false });
    canvas.addEventListener('pointermove', this._onMove, { passive: false });
    canvas.addEventListener('pointerup', this._onUp, { passive: false });
    canvas.addEventListener('pointercancel', this._onUp, { passive: false });
    canvas.addEventListener('lostpointercapture', this._onUp);
    canvas.addEventListener('contextmenu', this._onContext);
    document.addEventListener('visibilitychange', this._onVisibility);
    globalThis.addEventListener('pagehide', this._onPageHide);
    globalThis.addEventListener('resize', this._onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this._observer = new ResizeObserver(this._onResize);
      this._observer.observe(canvas);
    }
    this._resize();
    this._notify();
  }

  get canUndo() { return this._ops.length > 0; }
  get canRedo() { return this._redo.length > 0; }
  get isEmpty() { return this._ops.length === 0; }

  getOperations() {
    this._finishStroke();
    return typeof structuredClone === 'function'
      ? structuredClone(this._ops)
      : JSON.parse(JSON.stringify(this._ops));
  }

  setTool(tool) {
    if (!TOOLS.has(tool)) return;
    this._finishStroke();
    this.tool = tool;
    this.canvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
    this._notify();
  }

  setColor(color) {
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) this.color = color;
    this._notify();
  }

  setWidth(width) {
    if (Number.isFinite(Number(width))) this.width = clamp(Number(width), 1, 40);
    this._notify();
  }

  async load(key) {
    if (this._destroyed) return false;
    const requestedKey = String(key || 'general');
    if (requestedKey === this.key && !this._loading) return true;
    const token = ++this._loadToken;
    this._finishStroke();
    this._loading = true;
    this._notify();
    await this.flush();
    if (token !== this._loadToken || this._destroyed) return false;
    let record = sessionBoards.get(requestedKey);
    let readError = null;
    if (!record) {
      try {
        const stored = await this._read(requestedKey);
        record = { ops: validOperations(stored?.ops), saved: true };
      } catch (_) {
        record = { ops: [], saved: false };
        readError = '黒板を端末に保存できません。この画面を閉じる前に「画像を保存」をご利用ください。';
      }
    }
    if (token !== this._loadToken || this._destroyed) return false;
    this.key = requestedKey;
    this._ops = record.ops.slice();
    this._redo = [];
    this._draft = null;
    this._revision += 1;
    this._lastPoint = null;
    this._loading = false;
    this.saved = record.saved;
    this.error = readError || (!record.saved ? 'この黒板は端末への保存が完了していません。画像で保存できます。' : null);
    sessionBoards.set(this.key, { ops: this._ops.slice(), saved: this.saved });
    this._scheduleRender();
    this._notify();
    if (readError) this._reportError(readError);
    return true;
  }

  undo() {
    if (this._loading || this._destroyed) return;
    this._finishStroke();
    if (!this._ops.length) return;
    this._redo.push(this._ops.pop());
    this._changed();
  }

  redo() {
    if (this._loading || this._destroyed || !this._redo.length) return;
    this._finishStroke();
    this._ops.push(this._redo.pop());
    this._changed();
  }

  clear() {
    if (this._loading || this._destroyed) return;
    this._finishStroke();
    if (!this._ops.length) return;
    this._ops = [];
    this._redo = [];
    this._changed();
  }

  addText(text) {
    if (this._loading || this._destroyed) return false;
    const value = String(text ?? '').trim();
    if (!value) return false;
    if (value.length > 1200) {
      this._reportError('長い文章は、1200文字以内に分けて黒板に追加してください。');
      return false;
    }
    this._finishStroke();
    const x = this._lastPoint ? clamp(this._lastPoint[0], 36, 850) : 52;
    const maxWidth = W - x - 40;
    const ctx = this._inkContext;
    let fontSize = 42;
    let lines = [];
    let lineHeight = 58;
    do {
      ctx.font = `${fontSize}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
      lines = [];
      for (const paragraph of value.split(/\r?\n/)) {
        let line = '';
        for (const char of Array.from(paragraph)) {
          if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = char; }
          else line += char;
        }
        lines.push(line);
      }
      lineHeight = Math.round(fontSize * 1.4);
      if (lines.length * lineHeight <= H - 80 || fontSize <= 20) break;
      fontSize -= 2;
    } while (fontSize >= 20);
    if (lines.length * lineHeight > H - 80) {
      this._reportError('黒板に収まらないため、文章を短く分けて追加してください。');
      return false;
    }
    const preferredY = this._lastPoint?.[1] ?? 58;
    const y = clamp(preferredY, 40, Math.max(40, H - lines.length * lineHeight - 36));
    this._commit({ type: 'text', x, y, lines, lineHeight, fontSize, color: this.color, width: this.width });
    return true;
  }

  addFormula(text) { return this.addText(text); }

  async exportPNG() {
    if (this._destroyed) return false;
    this._finishStroke();
    try {
      const output = document.createElement('canvas');
      output.width = W * 2;
      output.height = H * 2;
      const ink = document.createElement('canvas');
      ink.width = output.width;
      ink.height = output.height;
      this._renderTo(output, ink, null);
      const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG unavailable');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `数学辞典-黒板-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return true;
    } catch (_) {
      this._reportError('画像を保存できませんでした。もう一度お試しください。');
      return false;
    }
  }

  async flush() {
    clearTimeout(this._saveTimer);
    this._saveTimer = null;
    this._finishStroke();
    if (!this.key || this.saved) return this._saveQueue;
    const key = this.key;
    const revision = this._revision;
    const ops = this._ops.slice();
    const memory = { ops, saved: false };
    sessionBoards.set(key, memory);
    this._saveQueue = this._saveQueue.catch(() => false).then(async () => {
      try {
        await this._write(key, ops);
        if (sessionBoards.get(key) === memory) memory.saved = true;
        if (this.key === key && this._revision === revision) {
          this.saved = true;
          this.error = null;
          this._notify();
        }
        return true;
      } catch (_) {
        const message = '黒板を端末に保存できません。画面を閉じる前に「画像を保存」をご利用ください。';
        if (this.key === key && this._revision === revision) {
          this.saved = false;
          this.error = message;
          this._notify();
        }
        this._reportError(message);
        return false;
      }
    });
    return this._saveQueue;
  }

  destroy() {
    if (this._destroyed) return this._saveQueue;
    this._finishStroke();
    const pending = this.flush();
    this._destroyed = true;
    this._loadToken += 1;
    clearTimeout(this._saveTimer);
    if (this._frame !== null) cancelAnimationFrame(this._frame);
    this._observer?.disconnect();
    this.canvas.removeEventListener('pointerdown', this._onDown);
    this.canvas.removeEventListener('pointermove', this._onMove);
    this.canvas.removeEventListener('pointerup', this._onUp);
    this.canvas.removeEventListener('pointercancel', this._onUp);
    this.canvas.removeEventListener('lostpointercapture', this._onUp);
    this.canvas.removeEventListener('contextmenu', this._onContext);
    document.removeEventListener('visibilitychange', this._onVisibility);
    globalThis.removeEventListener('pagehide', this._onPageHide);
    globalThis.removeEventListener('resize', this._onResize);
    void pending.finally(() => this._dbPromise?.then(db => db.close()).catch(() => {}));
    return pending;
  }

  _point(event) {
    const rect = this.canvas.getBoundingClientRect();
    const pressure = event.pointerType === 'pen' ? clamp((event.pressure || 0.5) * 1.6, 0.25, 1.6) : 1;
    return [clamp((event.clientX - rect.left) / Math.max(1, rect.width) * W, 0, W), clamp((event.clientY - rect.top) / Math.max(1, rect.height) * H, 0, H), pressure];
  }

  _pointerDown(event) {
    if (this._destroyed || this._loading || this._pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0) || event.isPrimary === false) return;
    event.preventDefault();
    const point = this._point(event);
    this._lastPoint = point;
    this._pointerId = event.pointerId;
    const width = this.tool === 'eraser' ? Math.max(18, this.width * 5) : this.width;
    this._draft = this.tool === 'pen' || this.tool === 'eraser'
      ? { type: this.tool, color: this.color, width, points: [point] }
      : { type: this.tool, color: this.color, width, x1: point[0], y1: point[1], x2: point[0], y2: point[1] };
    try { this.canvas.setPointerCapture(event.pointerId); } catch (_) { /* Pointer can already have ended. */ }
    this._scheduleRender();
  }

  _pointerMove(event) {
    if (this._destroyed || !this._draft || event.pointerId !== this._pointerId) return;
    event.preventDefault();
    let events = [event];
    try { const coalesced = event.getCoalescedEvents?.(); if (coalesced?.length) events = coalesced; } catch (_) { /* Standard pointer event is sufficient. */ }
    for (const item of events) {
      const point = this._point(item);
      this._lastPoint = point;
      if (this._draft.points) {
        const previous = this._draft.points.at(-1);
        if (Math.hypot(point[0] - previous[0], point[1] - previous[1]) > 0.6) this._draft.points.push(point);
      } else {
        this._draft.x2 = point[0];
        this._draft.y2 = point[1];
      }
    }
    this._scheduleRender();
  }

  _pointerUp(event) {
    if (event.pointerId !== this._pointerId) return;
    if (event.cancelable) event.preventDefault();
    if (event.type === 'pointerup') this._pointerMove(event);
    this._finishStroke();
  }

  _finishStroke() {
    if (!this._draft) return;
    const operation = this._draft;
    const pointerId = this._pointerId;
    this._draft = null;
    this._pointerId = null;
    try { if (pointerId !== null && this.canvas.hasPointerCapture(pointerId)) this.canvas.releasePointerCapture(pointerId); } catch (_) { /* Capture can be lost by the browser. */ }
    this._commit(operation);
  }

  _commit(operation) {
    this._ops.push(operation);
    this._redo = [];
    this._changed();
  }

  _changed() {
    this._revision += 1;
    this.saved = false;
    if (this.key) sessionBoards.set(this.key, { ops: this._ops.slice(), saved: false });
    this._scheduleRender();
    this._notify();
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => { void this.flush(); }, 400);
  }

  _resize() {
    if (this._destroyed) return;
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(3, globalThis.devicePixelRatio || 1);
    const width = Math.max(1, Math.round((rect.width || 600) * ratio));
    const height = Math.max(1, Math.round((rect.height || (rect.width || 600) * H / W) * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this._ink.width = width;
      this._ink.height = height;
    }
    this._scheduleRender();
  }

  _scheduleRender() {
    if (this._destroyed || this._frame !== null) return;
    this._frame = requestAnimationFrame(() => {
      this._frame = null;
      if (!this._destroyed) this._renderTo(this.canvas, this._ink, this._draft);
    });
  }

  _renderTo(canvas, ink, draft) {
    const ctx = canvas.getContext('2d');
    const inkContext = ink.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    drawBackground(ctx);
    inkContext.setTransform(1, 0, 0, 1, 0, 0);
    inkContext.clearRect(0, 0, ink.width, ink.height);
    inkContext.setTransform(ink.width / W, 0, 0, ink.height / H, 0, 0);
    for (const operation of this._ops) drawOperation(inkContext, operation);
    if (draft) drawOperation(inkContext, draft);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(ink, 0, 0);
  }

  _database() {
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
      let finished = false;
      const timer = setTimeout(() => { if (!finished) { finished = true; reject(new Error('IndexedDB timed out')); } }, 8000);
      const fail = error => { if (!finished) { finished = true; clearTimeout(timer); reject(error); } };
      let request;
      try { request = indexedDB.open('math-atlas-blackboards', 1); } catch (error) { fail(error); return; }
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('boards')) request.result.createObjectStore('boards', { keyPath: 'key' }); };
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(new Error('IndexedDB blocked'));
      request.onsuccess = () => {
        if (finished) { request.result.close(); return; }
        finished = true;
        clearTimeout(timer);
        request.result.onversionchange = () => { request.result.close(); this._dbPromise = null; };
        resolve(request.result);
      };
    });
    return this._dbPromise;
  }

  async _read(key) {
    const db = await this._database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('boards', 'readonly');
      const request = tx.objectStore('boards').get(key);
      let record;
      request.onsuccess = () => { record = request.result; };
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error || new Error('Read failed'));
      tx.onabort = () => reject(tx.error || new Error('Read aborted'));
    });
  }

  async _write(key, ops) {
    const db = await this._database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('boards', 'readwrite');
      tx.objectStore('boards').put({ key, ops, updatedAt: Date.now(), format: 1 });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Save failed'));
      tx.onabort = () => reject(tx.error || new Error('Save aborted'));
    });
  }

  _notify() {
    if (this._destroyed) return;
    try { this.onChange({ canUndo: this.canUndo, canRedo: this.canRedo, isEmpty: this.isEmpty, saved: this.saved, loading: this._loading, error: this.error }); } catch (_) { /* Interface exceptions must not interrupt persistence. */ }
  }

  _reportError(message) {
    if (this._destroyed) return;
    try { this.onError(message); } catch (_) { /* Keep the canvas usable. */ }
  }
}
