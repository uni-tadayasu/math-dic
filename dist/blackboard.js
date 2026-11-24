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
const MAX_POINTS_PER_CHUNK = 4096;
const MAX_BACKING_PIXELS = 3000000;
const pressureOf = point => Number.isFinite(point?.[2]) ? clamp(point[2], 0.18, 1.6) : 1;
const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

function strokeStyle(ctx, op) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = op.color || '#f4f4dc';
  ctx.fillStyle = op.color || '#f4f4dc';
  ctx.globalCompositeOperation = op.type === 'eraser' ? 'destination-out' : 'source-over';
}

// Each midpoint curve becomes immutable once its following real sample arrives.
// Draw only those new curves while writing; the short, live tail reaches the tip.
// Sharp turns remain corners rather than being rounded into a different symbol.
function drawStrokeParts(ctx, op, from, to) {
  const points = op.points || [];
  ctx.save();
  strokeStyle(ctx, op);
  for (let i = from; i < to; i++) {
    if (op.smoothing === 'midpoint-v1') {
      const current = points[i], next = points[i + 1];
      if (!current || !next) continue;
      const previous = points[Math.max(0, i - 1)];
      const start = i ? midpoint(previous, current) : current;
      const end = midpoint(current, next);
      const ux = current[0] - previous[0], uy = current[1] - previous[1];
      const vx = next[0] - current[0], vy = next[1] - current[1];
      const product = Math.hypot(ux, uy) * Math.hypot(vx, vy);
      const corner = i > 0 && product > 0 && (ux * vx + uy * vy) / product < 0.35;
      ctx.lineWidth = Math.max(0.18, op.width * pressureOf(current));
      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      if (corner) { ctx.lineTo(current[0], current[1]); ctx.lineTo(end[0], end[1]); }
      else ctx.quadraticCurveTo(current[0], current[1], end[0], end[1]);
      ctx.stroke();
    } else {
      const previous = points[i], current = points[i + 1];
      if (!previous || !current) continue;
      ctx.lineWidth = Math.max(0.18, op.width * (pressureOf(previous) + pressureOf(current)) / 2);
      ctx.beginPath();
      ctx.moveTo(previous[0], previous[1]);
      ctx.lineTo(current[0], current[1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawStrokeTail(ctx, op) {
  const points = op.points || [];
  if (!points.length) return;
  const end = points.at(-1);
  ctx.save();
  strokeStyle(ctx, op);
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(end[0], end[1], Math.max(0.15, op.width * pressureOf(end) / 2), 0, Math.PI * 2);
    ctx.fill();
  } else if (op.smoothing === 'midpoint-v1') {
    const start = midpoint(points.at(-2), end);
    ctx.lineWidth = Math.max(0.18, op.width * pressureOf(end));
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();
  }
  ctx.restore();
}

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
    const points = op.points || [];
    drawStrokeParts(ctx, op, 0, Math.max(0, points.length - 1));
    drawStrokeTail(ctx, op);
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
    this._context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!this._context) throw new Error('このブラウザでは黒板を表示できません。');
    this._ink = document.createElement('canvas');
    this._inkContext = this._ink.getContext('2d');
    this._liveInk = document.createElement('canvas');
    this._liveContext = this._liveInk.getContext('2d');
    this._previewInk = document.createElement('canvas');
    this._previewContext = this._previewInk.getContext('2d');
    this._inkCount = 0;
    this._inkDirty = true;
    this._liveDraft = null;
    this._liveCount = 0;
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
    this._pointerType = '';
    this._usingRaw = false;
    this._lastSampleTime = -Infinity;
    this._lastPressure = null;
    this._rect = null;
    this._rectDirty = true;
    this._penUntil = 0;
    this._touches = new Set();
    this._strokeSerial = 0;
    this._strokeId = '';
    this._sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
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
    this._onRaw = event => this._pointerMove(event, true);
    this._onUp = event => this._pointerUp(event);
    this._onPenPresence = event => this._notePen(event);
    this._onScroll = () => { this._rectDirty = true; };
    this._onContext = event => event.preventDefault();
    this._onVisibility = () => { if (document.visibilityState === 'hidden') void this.flush(); };
    this._onPageHide = () => { void this.flush(); };
    this._onResize = () => this._resize();
    canvas.addEventListener('pointerdown', this._onDown, { passive: false });
    canvas.addEventListener('pointermove', this._onMove, { passive: false });
    canvas.addEventListener('pointerrawupdate', this._onRaw, { passive: false });
    canvas.addEventListener('pointerenter', this._onPenPresence, { passive: true });
    canvas.addEventListener('pointerup', this._onUp, { passive: false });
    canvas.addEventListener('pointercancel', this._onUp, { passive: false });
    canvas.addEventListener('lostpointercapture', this._onUp);
    canvas.addEventListener('contextmenu', this._onContext);
    document.addEventListener('visibilitychange', this._onVisibility);
    globalThis.addEventListener('pagehide', this._onPageHide);
    globalThis.addEventListener('resize', this._onResize);
    globalThis.addEventListener('scroll', this._onScroll, { capture: true, passive: true });
    globalThis.addEventListener('pointerup', this._onUp);
    globalThis.addEventListener('pointercancel', this._onUp);
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
  get revision() { return this._revision; }
  get isDrawing() { return Boolean(this._draft); }

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
    this._invalidateInk();
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
    const last = this._ops.at(-1), group = [this._ops.pop()];
    if (last.strokeId) {
      while (this._ops.at(-1)?.strokeId === last.strokeId) group.unshift(this._ops.pop());
    }
    this._redo.push(group);
    this._invalidateInk();
    this._changed();
  }

  redo() {
    if (this._loading || this._destroyed) return;
    this._finishStroke();
    if (!this._redo.length) return;
    this._ops.push(...this._redo.pop());
    this._changed();
  }

  clear() {
    if (this._loading || this._destroyed) return;
    this._finishStroke();
    if (!this._ops.length) return;
    this._ops = [];
    this._redo = [];
    this._invalidateInk();
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

  async flush({ finish = true } = {}) {
    // Background saves persist completed strokes without ending a new stroke
    // which the user may already be writing. Explicit flush/page hide finishes.
    if (finish) this._finishStroke();
    clearTimeout(this._saveTimer);
    this._saveTimer = null;
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
    this.canvas.removeEventListener('pointerrawupdate', this._onRaw);
    this.canvas.removeEventListener('pointerenter', this._onPenPresence);
    this.canvas.removeEventListener('pointerup', this._onUp);
    this.canvas.removeEventListener('pointercancel', this._onUp);
    this.canvas.removeEventListener('lostpointercapture', this._onUp);
    this.canvas.removeEventListener('contextmenu', this._onContext);
    document.removeEventListener('visibilitychange', this._onVisibility);
    globalThis.removeEventListener('pagehide', this._onPageHide);
    globalThis.removeEventListener('resize', this._onResize);
    globalThis.removeEventListener('scroll', this._onScroll, { capture: true });
    globalThis.removeEventListener('pointerup', this._onUp);
    globalThis.removeEventListener('pointercancel', this._onUp);
    this._touches.clear();
    void pending.finally(() => this._dbPromise?.then(db => db.close()).catch(() => {}));
    return pending;
  }

  _notePen(event) {
    if (event.pointerType !== 'pen') return;
    this._penUntil = Date.now() + 800;
    // Pen proximity takes priority over a palm that happened to land first.
    if (this._draft && this._pointerType === 'touch') this._discardStroke();
  }

  _point(event, carrier, terminal = false) {
    const rect = this._rect;
    const pointerType = event.pointerType || this._pointerType || carrier.pointerType;
    let pressure = 1;
    if (pointerType === 'pen') {
      const reported = Number.isFinite(event.pressure) ? event.pressure : carrier.pressure;
      const raw = Number.isFinite(reported) ? clamp(reported, 0, 1) : 0.5;
      const target = 0.3 + 1.2 * Math.sqrt(raw);
      pressure = this._lastPressure === null ? target : this._lastPressure + (target - this._lastPressure) * (terminal ? 0.65 : 0.5);
    }
    return [clamp((event.clientX - rect.left) / Math.max(1, rect.width) * W, 0, W), clamp((event.clientY - rect.top) / Math.max(1, rect.height) * H, 0, H), pressure];
  }

  _pointerDown(event) {
    if (this._destroyed || this._loading) return;
    this._notePen(event);
    const type = event.pointerType || 'mouse';
    if (type === 'touch') {
      this._touches.add(event.pointerId);
      if (this._touches.size > 1) {
        if (this._pointerType === 'touch') this._discardStroke();
        if (event.cancelable) event.preventDefault();
        return;
      }
      const broadContact = Math.max(event.width || 0, event.height || 0) >= 45 && Math.min(event.width || 0, event.height || 0) >= 28;
      if (Date.now() < this._penUntil || broadContact) {
        if (event.cancelable) event.preventDefault();
        return;
      }
    }
    const hardwareEraser = type === 'pen' && (event.button === 5 || (event.buttons & 32) !== 0);
    if (this._pointerId !== null || event.isPrimary === false || (type === 'mouse' && event.button !== 0) || (type === 'pen' && event.button !== 0 && !hardwareEraser)) return;
    if (event.cancelable) event.preventDefault();
    this._rect = this.canvas.getBoundingClientRect();
    this._rectDirty = false;
    this._pointerId = event.pointerId;
    this._pointerType = type;
    this._lastPressure = null;
    this._lastSampleTime = Number.isFinite(event.timeStamp) ? event.timeStamp : -Infinity;
    this._usingRaw = false;
    this._strokeId = `${this._sessionId}-${++this._strokeSerial}`;
    const point = this._point(event, event);
    this._lastPressure = point[2];
    this._lastPoint = point;
    const tool = hardwareEraser ? 'eraser' : this.tool;
    const width = tool === 'eraser' ? Math.max(18, this.width * 5) : this.width;
    this._draft = tool === 'pen' || tool === 'eraser'
      ? { type: tool, color: this.color, width, strokeId: this._strokeId, ...(tool === 'pen' ? { smoothing: 'midpoint-v1' } : {}), points: [point] }
      : { type: tool, color: this.color, width, strokeId: this._strokeId, x1: point[0], y1: point[1], x2: point[0], y2: point[1] };
    this._liveDraft = null;
    try { this.canvas.setPointerCapture(event.pointerId); } catch (_) { /* Pointer can already have ended. */ }
    this._scheduleRender();
    this._notify();
  }

  _pointerMove(event, raw = false) {
    if (this._destroyed) return;
    this._notePen(event);
    if (!this._draft || event.pointerId !== this._pointerId) return;
    if (event.cancelable) event.preventDefault();
    if (this._pointerType !== 'touch' && event.buttons === 0) {
      this._finishStroke();
      return;
    }
    if (raw) this._usingRaw = true;
    // Raw and pointermove describe the same physical samples. Once the browser
    // supplies raw updates, pointermove is only a fallback for that gesture.
    if (!raw && this._usingRaw) return;
    this._consumeSamples(event);
    this._scheduleRender();
  }

  _consumeSamples(event, terminal = false) {
    if (!this._draft) return;
    if (this._rectDirty || !this._rect) {
      this._rect = this.canvas.getBoundingClientRect();
      this._rectDirty = false;
    }
    let events = [];
    try { const coalesced = event.getCoalescedEvents?.(); if (coalesced?.length) events = Array.from(coalesced); } catch (_) { /* Normal pointer sample remains available. */ }
    // Always keep the carrier endpoint, including pointerup. Some engines omit
    // it from the coalesced list, and it may be closer than the movement filter.
    events.push(event);
    for (let i = 0; i < events.length; i++) {
      const sample = events[i];
      if (!Number.isFinite(sample.clientX) || !Number.isFinite(sample.clientY)) continue;
      const time = Number.isFinite(sample.timeStamp) ? sample.timeStamp : this._lastSampleTime;
      if (time < this._lastSampleTime) continue;
      const endpoint = terminal && i === events.length - 1;
      const point = this._point(sample, event, endpoint);
      if (this._draft.points) {
        const previous = this._draft.points.at(-1);
        const dx = (point[0] - previous[0]) * this._rect.width / W;
        const dy = (point[1] - previous[1]) * this._rect.height / H;
        const distance = Math.hypot(dx, dy);
        if ((!endpoint && distance < (this._pointerType === 'pen' ? 0.12 : 0.18) && Math.abs(point[2] - previous[2]) < 0.055) || (distance < 0.0001 && Math.abs(point[2] - previous[2]) < 0.0001)) continue;
        if (this._draft.points.length >= MAX_POINTS_PER_CHUNK) {
          const completed = this._draft;
          this._commit(completed);
          this._draft = { ...completed, points: [[...previous]] };
          this._liveDraft = null;
        }
        this._draft.points.push(point);
      } else {
        this._draft.x2 = point[0];
        this._draft.y2 = point[1];
      }
      this._lastPoint = point;
      this._lastPressure = point[2];
      this._lastSampleTime = Math.max(this._lastSampleTime, time);
    }
  }

  _pointerUp(event) {
    this._touches.delete(event.pointerId);
    if (this._destroyed || event.pointerId !== this._pointerId) return;
    if (event.cancelable) event.preventDefault();
    this._notePen(event);
    if (event.type === 'pointerup') this._consumeSamples(event, true);
    if (event.type === 'pointercancel' && this._pointerType === 'touch') this._discardStroke();
    else this._finishStroke();
  }

  _releasePointer() {
    const pointerId = this._pointerId;
    this._pointerId = null;
    this._pointerType = '';
    this._usingRaw = false;
    this._lastPressure = null;
    this._liveDraft = null;
    try { if (pointerId !== null && this.canvas.hasPointerCapture(pointerId)) this.canvas.releasePointerCapture(pointerId); } catch (_) { /* Capture can be lost by the browser. */ }
  }

  _discardStroke() {
    if (!this._draft) return;
    const strokeId = this._strokeId;
    this._draft = null;
    this._releasePointer();
    let changed = false;
    while (this._ops.at(-1)?.strokeId === strokeId) { this._ops.pop(); changed = true; }
    if (changed) {
      this._invalidateInk();
      this._changed();
    } else {
      this._scheduleRender();
      this._notify();
    }
  }

  _finishStroke() {
    if (!this._draft) return;
    const operation = this._draft;
    this._draft = null;
    this._releasePointer();
    const redundantTail = operation.points?.length === 1 && this._ops.at(-1)?.strokeId === operation.strokeId;
    if (!redundantTail) this._commit(operation);
    else { this._scheduleRender(); this._notify(); }
  }

  _commit(operation) {
    this._ops.push(operation);
    this._redo = [];
    this._liveDraft = null;
    this._changed();
  }

  _changed() {
    this._revision += 1;
    this.saved = false;
    if (this.key) sessionBoards.set(this.key, { ops: this._ops.slice(), saved: false });
    this._scheduleRender();
    this._notify();
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => { void this.flush({ finish: false }); }, 600);
  }

  _invalidateInk() {
    this._inkDirty = true;
    this._liveDraft = null;
  }

  _resize() {
    if (this._destroyed) return;
    const rect = this.canvas.getBoundingClientRect();
    this._rect = rect;
    this._rectDirty = false;
    const cssWidth = rect.width || 600;
    const cssHeight = rect.height || cssWidth * H / W;
    // Bound four backing stores on high-DPI tablets without changing coordinates.
    const ratio = Math.min(3, globalThis.devicePixelRatio || 1, Math.sqrt(MAX_BACKING_PIXELS / (cssWidth * cssHeight)), 2560 / Math.max(cssWidth, cssHeight));
    const width = Math.max(1, Math.round(cssWidth * ratio));
    const height = Math.max(1, Math.round(cssHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      for (const layer of [this.canvas, this._ink, this._liveInk, this._previewInk]) {
        layer.width = width;
        layer.height = height;
      }
      this._invalidateInk();
    }
    this._scheduleRender();
  }

  _clearLayer(canvas, ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  }

  _copyLayer(canvas, ctx, source) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  }

  _ensureInk() {
    if (this._inkDirty) {
      this._clearLayer(this._ink, this._inkContext);
      this._inkCount = 0;
      this._inkDirty = false;
      this._liveDraft = null;
    }
    if (this._inkCount < this._ops.length) {
      this._inkContext.setTransform(this._ink.width / W, 0, 0, this._ink.height / H, 0, 0);
      while (this._inkCount < this._ops.length) drawOperation(this._inkContext, this._ops[this._inkCount++]);
      this._liveDraft = null;
    }
  }

  _renderFrame() {
    this._ensureInk();
    let ink = this._ink;
    const draft = this._draft;
    if (draft) {
      if (draft.points) {
        if (this._liveDraft !== draft) {
          this._copyLayer(this._liveInk, this._liveContext, this._ink);
          this._liveDraft = draft;
          this._liveCount = 0;
        }
        const complete = Math.max(0, draft.points.length - 1);
        drawStrokeParts(this._liveContext, draft, this._liveCount, complete);
        this._liveCount = complete;
        this._copyLayer(this._previewInk, this._previewContext, this._liveInk);
        drawStrokeTail(this._previewContext, draft);
      } else {
        this._copyLayer(this._previewInk, this._previewContext, this._ink);
        drawOperation(this._previewContext, draft);
      }
      ink = this._previewInk;
    }
    const ctx = this._context;
    ctx.setTransform(this.canvas.width / W, 0, 0, this.canvas.height / H, 0, 0);
    drawBackground(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(ink, 0, 0);
  }

  _scheduleRender() {
    if (this._destroyed || this._frame !== null) return;
    this._frame = requestAnimationFrame(() => {
      this._frame = null;
      if (!this._destroyed) this._renderFrame();
    });
  }

  _renderTo(canvas, ink, draft) {
    const ctx = canvas.getContext('2d');
    const inkContext = ink.getContext('2d');
    this._clearLayer(canvas, ctx);
    drawBackground(ctx);
    this._clearLayer(ink, inkContext);
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
    try { this.onChange({ canUndo: this.canUndo, canRedo: this.canRedo, isEmpty: this.isEmpty, saved: this.saved && !this.isDrawing, loading: this._loading, error: this.error, revision: this.revision, drawing: this.isDrawing }); } catch (_) { /* Interface exceptions must not interrupt persistence. */ }
  }

  _reportError(message) {
    if (this._destroyed) return;
    try { this.onError(message); } catch (_) { /* Keep the canvas usable. */ }
  }
}
