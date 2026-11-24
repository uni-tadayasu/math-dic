import { parseFormula, analyzeFormula, evolveFormula, parseData } from './formula-engine.js';

const LIBRARY_KEY = 'math-atlas-formula-library-v1';
const DRAFT_KEY = 'math-atlas-formula-draft-v1';
const SCHEMA = 'math-atlas-formula-lab';
const MAX_BACKUP = 2 * 1024 * 1024;
const DEFAULT_DATA = '-3, 8.7\n-2, 4.3\n-1, 1.2\n0, 0.2\n1, 1.4\n2, 4.1\n3, 9.2';
const DEFAULT_WORK = { name: 'わたしの数式', expression: 'x^2', parameters: { a: 1, b: 0, c: 0, d: 0 }, xMin: -5, xMax: 5, data: '' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const list = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : typeof value === 'string' && value ? [value] : [];
const uid = () => globalThis.crypto?.randomUUID?.() || `formula-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const number = value => {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  if (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-4) return value.toExponential(3).replace('e+', ' × 10^').replace('e-', ' × 10^-');
  return Number(value.toPrecision(6)).toLocaleString('ja-JP', { maximumFractionDigits: 6 });
};
const date = value => new Date(value).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

function icon(name) {
  const paths = {
    spark: '<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3Z"/>',
    sound: '<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    save: '<path d="M5 3h12l4 4v14H3V3h2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
    board: '<rect x="3" y="3" width="18" height="14" rx="2"/><path d="m7 21 3-4m7 4-3-4M7 10l3-3 3 4 4-5"/>',
    file: '<path d="M14 2H5v20h14V7l-5-5Z"/><path d="M14 2v6h5M8 13h8m-8 4h6"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    restore: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2"/>',
    chart: '<path d="M3 3v18h18M5 16l5-7 4 4 6-9"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>'
  };
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
}

function validateWork(input) {
  if (!input || typeof input !== 'object' || typeof input.expression !== 'string' || !input.expression.trim() || input.expression.length > 300) throw new Error('数式のデータ形式が正しくありません。');
  const parameters = {};
  for (const key of ['a', 'b', 'c', 'd']) {
    const value = input.parameters?.[key] ?? DEFAULT_WORK.parameters[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('係数のデータ形式が正しくありません。');
    parameters[key] = value;
  }
  if (!Number.isFinite(input.xMin) || !Number.isFinite(input.xMax) || input.xMax <= input.xMin) throw new Error('表示範囲のデータ形式が正しくありません。');
  if (input.data !== undefined && (typeof input.data !== 'string' || input.data.length > 60000)) throw new Error('観測データが長すぎるか、形式が正しくありません。');
  return { name: String(input.name || '名称未設定の数式').slice(0, 80), expression: input.expression, parameters, xMin: input.xMin, xMax: input.xMax, data: input.data || '' };
}

function validateLibrary(value) {
  if (!value || value.schema !== SCHEMA || value.version !== 1 || !Array.isArray(value.items) || value.items.length > 50) throw new Error('このサイトの数式バックアップを選んでください。');
  const ids = new Set();
  const items = value.items.map(item => {
    if (!item || typeof item.id !== 'string' || item.id.length > 120 || ids.has(item.id) || typeof item.name !== 'string' || !Array.isArray(item.versions) || !item.versions.length || item.versions.length > 60) throw new Error('数式一覧のデータ形式が正しくありません。');
    ids.add(item.id);
    const versions = item.versions.map(version => {
      const work = validateWork({ ...version, name: item.name });
      if (typeof version.id !== 'string' || version.id.length > 120 || typeof version.at !== 'string' || !Number.isFinite(Date.parse(version.at))) throw new Error('版の日時または形式が正しくありません。');
      parseFormula(work.expression, work.parameters);
      if (work.data) parseData(work.data);
      return { id: version.id, at: version.at, ...work, metrics: cleanMetrics(version.metrics), source: String(version.source || '保存').slice(0, 80) };
    });
    return { id: item.id, name: item.name.slice(0, 80), createdAt: versions[0].at, updatedAt: versions.at(-1).at, versions };
  });
  return { schema: SCHEMA, version: 1, items, selectedId: ids.has(value.selectedId) ? value.selectedId : items[0]?.id || null };
}

function cleanMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') return null;
  return { rmse: Number.isFinite(metrics.rmse) ? metrics.rmse : null, mae: Number.isFinite(metrics.mae) ? metrics.mae : null, r2: Number.isFinite(metrics.r2) ? metrics.r2 : null };
}

function graphMarkup(result, work, data) {
  const width = 960, height = 530, left = 74, right = 28, top = 24, bottom = 60;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const points = Array.isArray(result.points) ? result.points : [];
  const finite = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  const plottedData = data.filter(point => point.x >= work.xMin && point.x <= work.xMax && Number.isFinite(point.y));
  const values = [...finite.map(point => point.y), ...plottedData.map(point => point.y)];
  if (!values.length) return '<div class="lab-graph-empty">この範囲には、実数のグラフを描ける点がありません。<br>式や表示範囲を変更してください。</div>';
  const smallest = Math.min(...values), largest = Math.max(...values);
  const scale = Math.max(Math.abs(smallest), Math.abs(largest), 1);
  let low = smallest / scale, high = largest / scale;
  if (Math.abs(high - low) < 1e-10) { low -= 0.8; high += 0.8; }
  else { const padding = (high - low) * 0.1; low -= padding; high += padding; }
  const xScale = Math.max(Math.abs(work.xMin), Math.abs(work.xMax), 1);
  const xLow = work.xMin / xScale, xHigh = work.xMax / xScale;
  const px = x => left + ((x / xScale - xLow) / (xHigh - xLow)) * plotWidth;
  const py = y => top + ((high - y / scale) / (high - low)) * plotHeight;
  let grid = '', labels = '';
  for (let i = 0; i <= 6; i++) {
    const x = left + plotWidth * i / 6;
    const value = (xLow + (xHigh - xLow) * i / 6) * xScale;
    grid += `<path d="M${x.toFixed(2)} ${top}V${height - bottom}"/>`;
    labels += `<text x="${x.toFixed(2)}" y="${height - bottom + 28}" text-anchor="middle">${esc(number(value))}</text>`;
  }
  for (let i = 0; i <= 5; i++) {
    const y = top + plotHeight * i / 5;
    const value = (high - (high - low) * i / 5) * scale;
    grid += `<path d="M${left} ${y.toFixed(2)}H${width - right}"/>`;
    labels += `<text x="${left - 12}" y="${(y + 5).toFixed(2)}" text-anchor="end">${esc(number(value))}</text>`;
  }
  let axes = '';
  if (work.xMin <= 0 && work.xMax >= 0) axes += `<path d="M${px(0).toFixed(2)} ${top}V${height - bottom}"/>`;
  if (low <= 0 && high >= 0) axes += `<path d="M${left} ${py(0).toFixed(2)}H${width - right}"/>`;
  let path = '', previous = null;
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) { previous = null; continue; }
    const x = px(point.x), y = py(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) { previous = null; continue; }
    const breakLine = !previous || Math.abs(y - previous.y) > plotHeight * 0.8;
    path += `${breakLine ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
    previous = { x, y };
  }
  const dots = plottedData.map(point => `<circle cx="${px(point.x).toFixed(2)}" cy="${py(point.y).toFixed(2)}" r="5.5"><title>x=${esc(number(point.x))}, y=${esc(number(point.y))}</title></circle>`).join('');
  const clipId = `lab-clip-${uid()}`;
  return `<svg class="lab-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(work.expression)}のグラフ。横軸x、縦軸y。xの範囲は${esc(work.xMin)}から${esc(work.xMax)}。"><defs><clipPath id="${clipId}"><rect x="${left}" y="${top}" width="${plotWidth}" height="${plotHeight}"/></clipPath></defs><g class="lab-graph-grid">${grid}</g><g class="lab-graph-axes">${axes}</g><g class="lab-graph-labels">${labels}<text x="${width - 24}" y="${height - 16}" text-anchor="end">x</text><text x="30" y="24">y</text></g><g clip-path="url(#${clipId})"><path class="lab-graph-curve" d="${path}"/><g class="lab-graph-dots">${dots}</g></g></svg>`;
}

export function mountFormulaLab(container, { onSpeak = () => {}, onToast = () => {}, onOpenBoard = () => {}, initialExpression } = {}) {
  if (!document.querySelector('link[data-formula-lab-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = new URL('./formula-lab.css', import.meta.url).href;
    style.dataset.formulaLabStyle = 'true';
    document.head.append(style);
  }
  container.innerHTML = `<div class="lab-shell">
    <header class="lab-heading"><div><p class="lab-eyebrow">FORMULA LAB</p><h1>数式をつくり、<span>わかる。</span></h1><p>自分の式をグラフで確かめ、意味と計算の流れを解説。データに合う式への改善も試せます。</p></div><span class="lab-heading-mark" aria-hidden="true">ƒ<span>(x)</span></span></header>
    <div class="lab-error" data-ref="error" role="alert" hidden></div>
    <section class="lab-library-bar" aria-label="保存した数式"><label class="lab-library-select">保存した数式<select data-ref="library"><option value="">新しい数式</option></select></label><div class="lab-library-actions"><button type="button" class="lab-button lab-button-light" data-action="new">${icon('plus')}新しくつくる</button><button type="button" class="lab-button lab-button-quiet" data-action="export">${icon('file')}JSONを書き出す</button><button type="button" class="lab-button lab-button-quiet" data-action="import">読み込む</button><input data-ref="file" type="file" accept=".json,application/json" hidden></div></section>
    <div class="lab-workspace">
      <section class="lab-card lab-editor"><div class="lab-section-label">CREATE</div><h2>数式を入力</h2><label class="lab-field">数式の名前<input data-ref="name" maxlength="80" value="わたしの数式" placeholder="例：売上の変化を調べる式"></label><label class="lab-field">y =<textarea data-ref="expression" rows="3" maxlength="300" spellcheck="false" autocapitalize="off" autocomplete="off" aria-describedby="lab-expression-help">x^2</textarea></label><p class="lab-help" id="lab-expression-help">掛け算は <code>*</code>、累乗は <code>^</code>。<code>sin(x)</code>、<code>sqrt(x)</code> なども使えます。</p><div class="lab-examples" aria-label="数式の例"><button type="button" data-example="x^2">x²</button><button type="button" data-example="sin(x)">sin(x)</button><button type="button" data-example="a*x^2+b*x+c">ax² + bx + c</button><button type="button" data-example="1/x">1 / x</button></div><fieldset class="lab-parameters"><legend>係数を変えてみる</legend>${['a', 'b', 'c', 'd'].map((key, index) => `<label>${key}<input data-ref="param-${key}" type="number" step="any" value="${index ? 0 : 1}" aria-label="係数${key}"></label>`).join('')}</fieldset><fieldset class="lab-domain"><legend>x の表示範囲</legend><label>最小<input data-ref="xMin" type="number" step="any" value="-5"></label><span aria-hidden="true">〜</span><label>最大<input data-ref="xMax" type="number" step="any" value="5"></label></fieldset><button type="button" class="lab-button lab-button-primary lab-button-full" data-action="analyze">${icon('spark')}分析・解説をつくる</button><div class="lab-editor-actions"><button type="button" class="lab-button lab-button-light" data-action="save">${icon('save')}この版を保存</button><button type="button" class="lab-button lab-button-quiet" data-action="board">${icon('board')}黒板へ</button></div><p class="lab-storage-status" data-ref="storage">保存先は、このブラウザ・この端末です。</p></section>
      <section class="lab-card lab-visual"><div class="lab-visual-top"><div><div class="lab-section-label">VISUALIZE</div><h2>式のかたち</h2></div><div class="lab-legend"><span><i class="lab-line-key"></i>数式</span><span><i class="lab-dot-key"></i>観測値</span></div></div><div data-ref="graph" class="lab-graph-wrap"><div class="lab-graph-empty">数式を分析するとグラフを表示します。</div></div><div class="lab-graph-footer"><code data-ref="display">y = x²</code><span data-ref="sampling"></span></div><p class="lab-help lab-graph-note">グラフは指定範囲の点を計算して描画します。不連続な点や、点と点の間の細かな変化をすべて表すものではありません。</p></section>
    </div>
    <section class="lab-explanation" data-ref="explanation" aria-labelledby="lab-explanation-title"><div class="lab-explanation-top"><div><div class="lab-section-label">UNDERSTAND</div><h2 id="lab-explanation-title">この式をやさしく解説</h2></div><button type="button" class="lab-button lab-button-white" data-action="speak">${icon('sound')}解説を聴く</button></div><div data-ref="explanation-content"><p>数式を入力して「分析・解説をつくる」を押してください。</p></div></section>
    <section class="lab-card lab-analysis"><div class="lab-analysis-head"><div><div class="lab-section-label">CHECK</div><h2>計算してわかったこと</h2></div><span class="lab-small-tag">指定範囲の数値検証</span></div><div class="lab-stat-grid" data-ref="stats"></div><div data-ref="analysis-text" class="lab-analysis-text"></div><p class="lab-method-note">${icon('info')}<span>数値検証・近似の提案です。一般的な証明や未観測の範囲での正しさは保証しません。</span></p></section>
    <section class="lab-card lab-data-section"><div class="lab-section-label">EVOLVE</div><h2>データに合う式を探す</h2><p class="lab-section-description">観測した x と y を入れて、一次・二次・三次式の候補を比較。採用した式は、新しい版として保存します。</p><div class="lab-data-layout"><div><label class="lab-field">観測データ<textarea data-ref="data" rows="8" maxlength="60000" spellcheck="false" placeholder="x, y を1行に1組ずつ&#10;-2, 4.3&#10;-1, 1.2&#10;0, 0.2&#10;1, 1.4"></textarea></label><div class="lab-data-caption"><span>1行に x, y。最大60点。</span><button type="button" class="lab-text-button" data-action="sample-data">サンプルを入れる</button></div><button type="button" class="lab-button lab-button-primary lab-button-full" data-action="evolve">${icon('chart')}改善候補を比較</button></div><div data-ref="candidates" class="lab-candidates"><div class="lab-candidate-empty"><span aria-hidden="true">y ≈ f(x)</span><h3>ぴったりの式を、比較から。</h3><p>データを入力すると候補を表示します。<br>学習に使わない点での検証誤差も比べます。</p></div></div></div></section>
    <section class="lab-card lab-history"><div class="lab-history-head"><div><div class="lab-section-label">HISTORY</div><h2>この数式の変更履歴</h2></div><span data-ref="version-count" class="lab-small-tag">未保存</span></div><div data-ref="history"><p class="lab-muted">「この版を保存」で、式・係数・範囲・観測データを記録できます。</p></div></section>
  </div>`;

  const refs = Object.fromEntries([...container.querySelectorAll('[data-ref]')].map(element => [element.dataset.ref, element]));
  const abort = new AbortController();
  const listen = (element, name, callback) => element.addEventListener(name, callback, { signal: abort.signal });
  let disposed = false, draftTimer = null, analysis = null, analyzedWork = null, currentData = [], candidates = [];
  let storageFailed = false;
  let library = { schema: SCHEMA, version: 1, items: [], selectedId: null };

  function notify(message) { if (!disposed) onToast(message); }
  function showError(error) {
    refs.error.textContent = error instanceof Error ? error.message : String(error);
    refs.error.hidden = false;
  }
  function clearError() { refs.error.hidden = true; refs.error.textContent = ''; }
  function storageError() {
    refs.storage.textContent = 'この端末への保存を利用できません。JSONを書き出して保管できます。';
    refs.storage.classList.add('lab-storage-warning');
    if (!storageFailed) notify('端末保存を利用できません。必要な内容はJSONで書き出してください。');
    storageFailed = true;
  }
  function readWork(strict = true) {
    const parameters = {};
    for (const key of ['a', 'b', 'c', 'd']) {
      const raw = refs[`param-${key}`].value;
      const value = raw.trim() ? Number(raw) : NaN;
      if (strict && !Number.isFinite(value)) throw new Error(`係数 ${key} に数値を入力してください。`);
      parameters[key] = Number.isFinite(value) ? value : DEFAULT_WORK.parameters[key];
    }
    const xMin = refs.xMin.value.trim() ? Number(refs.xMin.value) : NaN;
    const xMax = refs.xMax.value.trim() ? Number(refs.xMax.value) : NaN;
    if (strict && (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMax <= xMin)) throw new Error('x の最大値は最小値より大きくしてください。');
    const expression = refs.expression.value.trim();
    if (strict && !expression) throw new Error('分析する数式を入力してください。');
    return { name: refs.name.value.trim() || '名称未設定の数式', expression, parameters, xMin: Number.isFinite(xMin) ? xMin : -5, xMax: Number.isFinite(xMax) ? xMax : 5, data: refs.data.value };
  }
  function persistDraft() {
    clearTimeout(draftTimer);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...readWork(false), selectedId: library.selectedId })); }
    catch (_) { storageError(); }
  }
  function scheduleDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(persistDraft, 450);
    refs.storage.textContent = storageFailed ? '端末保存は利用できません。JSONで書き出せます。' : '編集内容あり。「この版を保存」で履歴に記録できます。';
  }
  function applyWork(work) {
    refs.name.value = work.name;
    refs.expression.value = work.expression;
    for (const key of ['a', 'b', 'c', 'd']) refs[`param-${key}`].value = work.parameters[key];
    refs.xMin.value = work.xMin;
    refs.xMax.value = work.xMax;
    refs.data.value = work.data;
    candidates = [];
    renderCandidates();
  }
  function persistLibrary(next) {
    const serialized = JSON.stringify(next);
    if (new Blob([serialized]).size > MAX_BACKUP) throw new Error('保存データが2MBを超えました。JSONを書き出して保管し、数式を分けて管理してください。');
    try { localStorage.setItem(LIBRARY_KEY, serialized); }
    catch (_) { storageError(); throw new Error('端末に保存できませんでした。現在の入力をJSONで書き出して保管できます。'); }
    library = next;
    return true;
  }
  function renderLibrary() {
    refs.library.innerHTML = '<option value="">新しい数式</option>' + [...library.items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(item => `<option value="${esc(item.id)}">${esc(item.name)} · ${item.versions.length}版</option>`).join('');
    refs.library.value = library.selectedId || '';
    renderHistory();
  }
  function renderHistory() {
    const item = library.items.find(item => item.id === library.selectedId);
    refs['version-count'].textContent = item ? `${item.versions.length} 版` : '未保存';
    if (!item) { refs.history.innerHTML = '<p class="lab-muted">「この版を保存」で、式・係数・範囲・観測データを記録できます。</p>'; return; }
    refs.history.innerHTML = `<ol class="lab-version-list">${item.versions.map((version, index) => ({ version, index })).reverse().map(({ version, index }) => `<li><div class="lab-version-icon">v${index + 1}</div><div class="lab-version-description"><strong>${esc(version.source || '保存')}</strong><time datetime="${esc(version.at)}">${esc(date(version.at))}</time><code>y = ${esc(version.expression)}</code><span>${esc(version.xMin)} ≤ x ≤ ${esc(version.xMax)}${version.metrics ? ` · RMSE ${esc(number(version.metrics.rmse))}` : ''}</span></div><button type="button" class="lab-button lab-button-quiet" data-restore="${esc(version.id)}">${icon('restore')}この版を開く</button></li>`).join('')}</ol>`;
  }

  function renderExplanation(result) {
    const explanation = result.explanation;
    if (!explanation) {
      refs['explanation-content'].innerHTML = `<p class="lab-explanation-meaning">${esc(list(result.summary)[0] || '入力した数式を、指定した x の範囲で計算しました。')}</p>`;
      return;
    }
    const steps = list(explanation.steps), parameters = list(explanation.parameters), conditions = list(explanation.conditions);
    const sample = explanation.sample;
    refs['explanation-content'].innerHTML = `<p class="lab-explanation-meaning">${esc(explanation.meaning)}</p><div class="lab-explanation-grid">${steps.length ? `<div><h3>式の読み取り方</h3><ol>${steps.map(text => `<li>${esc(text)}</li>`).join('')}</ol></div>` : ''}${parameters.length ? `<div><h3>係数が表すこと</h3><ul>${parameters.map(text => `<li>${esc(text)}</li>`).join('')}</ul></div>` : ''}${sample ? `<div class="lab-sample-calculation"><h3>実際に代入してみる</h3><p class="lab-sample-result">x = ${esc(number(sample.x))}<span>のとき</span>y = ${esc(number(sample.value))}</p>${list(sample.steps).map(text => `<p>${esc(text)}</p>`).join('')}</div>` : ''}${conditions.length ? `<div><h3>この式を使うときの条件</h3><ul>${conditions.map(text => `<li>${esc(text)}</li>`).join('')}</ul></div>` : ''}</div>`;
  }

  function renderAnalysis(result, work, data) {
    refs.graph.innerHTML = graphMarkup(result, work, data);
    const display = String(work.expression).replace(/^\s*y\s*=\s*/i, '');
    refs.display.textContent = `y = ${display}`;
    refs.sampling.textContent = `${result.finiteCount ?? 0} / ${result.totalCount ?? 0} 点を表示`;
    renderExplanation(result);
    let roots = result.zeroEverywhere ? 'すべての計算点で 0' : Array.isArray(result.roots) && result.roots.length ? result.roots.slice(0, 8).map(number).join(', ') + (result.roots.length > 8 ? ' …' : '') : '見つかりませんでした';
    const degree = Array.isArray(result.polynomial) ? result.polynomial.length - 1 : null;
    const stats = [{ label: '式の種類', value: degree === null ? '多項式以外' : degree === 0 ? '定数' : `${degree} 次式` }, { label: 'y = 0 になる x（数値探索）', value: roots }, { label: '導関数', value: result.derivative || '記号的な導関数は未対応' }];
    if (result.metrics) stats.push({ label: '観測値との誤差 RMSE', value: number(result.metrics.rmse) }, { label: '平均絶対誤差 MAE', value: number(result.metrics.mae) }, { label: '決定係数 R²', value: result.metrics.r2 === null ? '算出対象外' : number(result.metrics.r2) });
    refs.stats.innerHTML = stats.map(stat => `<div class="lab-stat"><span>${esc(stat.label)}</span><strong>${esc(stat.value)}</strong></div>`).join('');
    refs['analysis-text'].innerHTML = `<ul>${list(result.summary).map(text => `<li>${esc(text)}</li>`).join('')}</ul>`;
  }

  function runAnalysis({ silent = false } = {}) {
    clearError();
    try {
      const work = readWork();
      parseFormula(work.expression, work.parameters);
      const data = work.data.trim() ? parseData(work.data) : [];
      const result = analyzeFormula(work.expression, { parameters: work.parameters, xMin: work.xMin, xMax: work.xMax, data });
      analysis = result;
      analyzedWork = work;
      currentData = data;
      renderAnalysis(result, work, data);
      persistDraft();
      if (!silent) notify('式の解説とグラフを更新しました。');
      return true;
    } catch (error) { showError(error); return false; }
  }

  function saveVersion(source = '数式を保存') {
    if (!runAnalysis({ silent: true })) return false;
    try {
      const work = readWork();
      const existing = library.items.find(item => item.id === library.selectedId);
      if (!existing && library.items.length >= 50) throw new Error('保存できる数式は50件です。JSONを書き出して保管してください。');
      if (existing?.versions.length >= 60) throw new Error('1つの数式に保存できる履歴は60版です。新しい数式として続けてください。');
      const now = new Date().toISOString();
      const version = { id: uid(), at: now, ...work, metrics: cleanMetrics(analysis.metrics), source };
      const item = existing ? { ...existing, name: work.name, updatedAt: now, versions: [...existing.versions, version] } : { id: uid(), name: work.name, createdAt: now, updatedAt: now, versions: [version] };
      const next = { ...library, selectedId: item.id, items: existing ? library.items.map(entry => entry.id === item.id ? item : entry) : [...library.items, item] };
      persistLibrary(next);
      persistDraft();
      renderLibrary();
      refs.storage.textContent = `${date(now)} · 第${item.versions.length}版を端末に保存しました。`;
      refs.storage.classList.remove('lab-storage-warning');
      notify(`「${work.name}」の第${item.versions.length}版を保存しました。`);
      return true;
    } catch (error) { showError(error); return false; }
  }

  function renderCandidates() {
    if (!candidates.length) {
      refs.candidates.innerHTML = '<div class="lab-candidate-empty"><span aria-hidden="true">y ≈ f(x)</span><h3>ぴったりの式を、比較から。</h3><p>データを入力すると候補を表示します。<br>学習に使わない点での検証誤差も比べます。</p></div>';
      return;
    }
    refs.candidates.innerHTML = `<p class="lab-validation-note">検証誤差は、観測点を1つずつ外して計算した値です。小さい候補から表示します。</p>${candidates.map((candidate, index) => `<article class="lab-candidate ${index === 0 ? 'lab-candidate-best' : ''}"><div class="lab-candidate-heading"><h3>${candidate.degree}次式</h3>${index === 0 ? '<span class="lab-best-label">おすすめ候補</span>' : ''}</div><code>y = ${esc(candidate.expression)}</code><div class="lab-candidate-metrics"><span>検証誤差<strong>${esc(number(candidate.cvRmse))}</strong></span><span>当てはめ誤差<strong>${esc(number(candidate.rmse))}</strong></span><span>R²<strong>${esc(number(candidate.r2))}</strong></span></div><p>${esc(candidate.summary)}</p><button type="button" class="lab-button ${index === 0 ? 'lab-button-primary' : 'lab-button-light'} lab-button-full" data-adopt="${index}">この式を採用して保存</button></article>`).join('')}`;
  }

  async function compareCandidates(button) {
    clearError();
    button.disabled = true;
    const original = button.innerHTML;
    button.textContent = '候補を計算しています…';
    await new Promise(resolve => setTimeout(resolve, 30));
    if (disposed) return;
    try {
      const data = parseData(refs.data.value);
      if (!data.length) throw new Error('観測データを入力するか、サンプルを入れてください。');
      candidates = evolveFormula(data);
      if (!candidates.length) throw new Error('このデータでは改善候補を求められませんでした。異なる x のデータを追加してください。');
      runAnalysis({ silent: true });
      renderCandidates();
      persistDraft();
      notify(`${candidates.length}種類の候補を比較しました。`);
    } catch (error) { showError(error); }
    finally { if (!disposed) { button.disabled = false; button.innerHTML = original; } }
  }

  function speakExplanation() {
    if (!runAnalysis({ silent: true })) return;
    const explanation = analysis.explanation || {};
    const segments = [analyzedWork.name, 'この式の解説です。', explanation.meaning, ...list(explanation.steps), ...list(explanation.parameters), ...(explanation.sample ? ['実際に代入してみます。', ...list(explanation.sample.steps)] : []), ...list(explanation.conditions), '計算してわかったこと。', ...list(analysis.summary)].filter(Boolean);
    onSpeak(`${analyzedWork.name}の解説`, segments);
  }

  function exportBackup() {
    try {
      const next = { ...library, items: [...library.items], exportedAt: new Date().toISOString() };
      const work = readWork();
      parseFormula(work.expression, work.parameters);
      if (work.data.trim()) parseData(work.data);
      const current = library.items.find(item => item.id === library.selectedId);
      const latest = current?.versions.at(-1);
      const unchanged = latest && JSON.stringify({ expression: latest.expression, parameters: latest.parameters, xMin: latest.xMin, xMax: latest.xMax, data: latest.data, name: current.name }) === JSON.stringify({ expression: work.expression, parameters: work.parameters, xMin: work.xMin, xMax: work.xMax, data: work.data, name: work.name });
      if (!unchanged) {
        const now = new Date().toISOString();
        const draftItem = { id: uid(), name: `${work.name}（書き出し時の入力）`, createdAt: now, updatedAt: now, versions: [{ id: uid(), at: now, ...work, metrics: null, source: '書き出し時の入力' }] };
        next.items.push(draftItem);
        next.selectedId = draftItem.id;
      }
      if (next.items.length > 50) throw new Error('書き出す数式が50件を超えます。現在の入力を保存済みの版に合わせてからお試しください。');
      const blob = new Blob([JSON.stringify(next, null, 2)], { type: 'application/json' });
      if (blob.size > MAX_BACKUP) throw new Error('バックアップが2MBを超えました。観測データを短くしてからお試しください。');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `数学辞典-数式バックアップ-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      notify('数式・変更履歴・現在の入力をJSONで書き出しました。');
    } catch (error) { showError(error); }
  }

  async function importBackup(file) {
    clearError();
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP) throw new Error('読み込めるJSONは2MBまでです。');
      const imported = validateLibrary(JSON.parse(await file.text()));
      if (disposed) return;
      // Imported formulas are new copies. Existing formulas and versions are kept.
      const copies = imported.items.map(item => ({ ...item, id: uid(), name: `${item.name}（読込）`.slice(0, 80), versions: item.versions.map(version => ({ ...version, id: uid() })) }));
      if (library.items.length + copies.length > 50) throw new Error('読み込み後の数式が50件を超えます。');
      if (!copies.length) throw new Error('このバックアップには数式がありません。');
      persistLibrary({ ...library, items: [...library.items, ...copies], selectedId: copies[0].id });
      applyWork({ ...copies[0].versions.at(-1), name: copies[0].name });
      renderLibrary();
      runAnalysis({ silent: true });
      notify(`${copies.length}件の数式を追加しました。以前の数式も残っています。`);
    } catch (error) { showError(error instanceof SyntaxError ? new Error('JSONファイルを読み取れませんでした。数式バックアップを選んでください。') : error); }
    finally { refs.file.value = ''; }
  }

  listen(container, 'input', event => {
    if (event.target.matches('input:not([type="file"]),textarea')) {
      scheduleDraft();
      if (event.target !== refs.name) refs.sampling.textContent = '入力を変更しました。再分析してください。';
      if (event.target === refs.data) { candidates = []; renderCandidates(); }
    }
  });
  listen(refs.library, 'change', () => {
    const item = library.items.find(item => item.id === refs.library.value);
    library.selectedId = item?.id || null;
    if (item) applyWork({ ...item.versions.at(-1), name: item.name });
    else applyWork({ ...DEFAULT_WORK, parameters: { ...DEFAULT_WORK.parameters } });
    renderHistory();
    runAnalysis({ silent: true });
  });
  listen(refs.file, 'change', () => { void importBackup(refs.file.files?.[0]); });
  listen(container, 'click', event => {
    const example = event.target.closest('[data-example]');
    if (example) { refs.expression.value = example.dataset.example; runAnalysis({ silent: true }); return; }
    const restore = event.target.closest('[data-restore]');
    if (restore) {
      const item = library.items.find(item => item.id === library.selectedId);
      const version = item?.versions.find(version => version.id === restore.dataset.restore);
      if (version) { applyWork({ ...version, name: item.name }); runAnalysis({ silent: true }); notify('過去の版を開きました。保存すると新しい版になります。'); }
      return;
    }
    const adopt = event.target.closest('[data-adopt]');
    if (adopt) {
      const candidate = candidates[Number(adopt.dataset.adopt)];
      if (!candidate) return;
      refs.expression.value = candidate.expression;
      for (const key of ['a', 'b', 'c', 'd']) refs[`param-${key}`].value = DEFAULT_WORK.parameters[key];
      saveVersion(`${candidate.degree}次式の改善候補を採用`);
      return;
    }
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'analyze') runAnalysis();
    if (action === 'save') saveVersion();
    if (action === 'speak') speakExplanation();
    if (action === 'board') {
      try { const work = readWork(); parseFormula(work.expression, work.parameters); onOpenBoard(`${work.name}\ny = ${work.expression.replace(/^\s*y\s*=\s*/i, '')}`); } catch (error) { showError(error); }
    }
    if (action === 'sample-data') { refs.data.value = DEFAULT_DATA; candidates = []; renderCandidates(); runAnalysis({ silent: true }); notify('サンプルの観測データを入れました。'); }
    if (action === 'evolve') void compareCandidates(button);
    if (action === 'new') { library.selectedId = null; applyWork({ ...DEFAULT_WORK, parameters: { ...DEFAULT_WORK.parameters }, name: '新しい数式' }); renderLibrary(); runAnalysis({ silent: true }); refs.name.focus(); }
    if (action === 'export') exportBackup();
    if (action === 'import') refs.file.click();
  });

  let initial = { ...DEFAULT_WORK, parameters: { ...DEFAULT_WORK.parameters } };
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) library = validateLibrary(JSON.parse(raw));
    const selected = library.items.find(item => item.id === library.selectedId);
    if (selected) initial = { ...selected.versions.at(-1), name: selected.name };
    const draft = initialExpression === undefined ? localStorage.getItem(DRAFT_KEY) : null;
    if (draft) {
      const savedDraft = JSON.parse(draft);
      initial = validateWork(savedDraft);
      library.selectedId = library.items.some(item => item.id === savedDraft.selectedId) ? savedDraft.selectedId : null;
    }
  } catch (error) { storageError(); }
  if (typeof initialExpression === 'string' && initialExpression.trim()) {
    initial = { ...DEFAULT_WORK, parameters: { ...DEFAULT_WORK.parameters }, name: '黒板から読み取った数式', expression: initialExpression.trim() };
    library.selectedId = null;
  }
  applyWork(initial);
  renderLibrary();
  runAnalysis({ silent: true });

  return () => {
    persistDraft();
    disposed = true;
    abort.abort();
    clearTimeout(draftTimer);
  };
}
