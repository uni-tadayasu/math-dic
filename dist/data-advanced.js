// Original Japanese explanations and worked examples. Source links are further reading.
const pre = (path, label) => ({ label: `OpenStax Precalculus 2e — ${label}`, url: `https://openstax.org/books/precalculus-2e/pages/${path}` });
const stats = (path, label) => ({ label: `OpenStax Introductory Statistics 2e — ${label}`, url: `https://openstax.org/books/introductory-statistics-2e/pages/${path}` });
const calc = (path, label) => ({ label: `OpenStax Calculus Volume 1 — ${label}`, url: `https://openstax.org/books/calculus-volume-1/pages/${path}` });

export const advancedEntries = [
  {
    id: 'quadratic-function', title: '二次関数', reading: 'にじかんすう', category: 'functions', level: '高校', tags: ['関数', 'グラフ', '放物線'], aliases: ['2次関数', '放物線', 'quadratic function'],
    short: '変数の二乗を含み、グラフが放物線になる関数。',
    summary: '二次関数は、エックスの二乗を使って値が決まる関数です。グラフはおわんのような曲線になり、頂点を調べると、いちばん小さい値や大きい値がわかります。',
    definition: '実数の定数 a、b、c を用いて y = ax² + bx + c と表せる関数。ただし a は 0 ではない。グラフは放物線で、a が正なら下に凸、負なら上に凸になる。',
    explanation: ['平方完成すると y = a(x − p)² + q となり、頂点は (p, q)、対称の軸は x = p と読めます。係数 a の絶対値が大きいほど、頂点の近くでグラフの幅が狭くなります。', '定義域がすべての実数なら、a が正のとき頂点で最小、負のとき頂点で最大です。区間が指定されている場合は、頂点がその区間にあるかと、両端の値を確認します。'],
    formula: String.raw`y=ax^2+bx+c=a(x-p)^2+q\quad(a\ne0)`, formulaSpeech: 'ワイ イコール、エー エックスの二乗、プラス ビー エックス、プラス シー。エーはゼロではありません。',
    example: { question: 'y = x² − 4x + 7 の頂点と最小値は？', steps: ['x² − 4x + 7 を、(x − 2)² + 3 に書きかえます。', '(x − 2)² は 0 以上で、x = 2 のとき 0 になります。'], answer: '頂点は (2, 3)。x = 2 のとき最小値 3。' },
    pitfall: 'y = (x − 2)² + 3 の頂点の x 座標は −2 ではなく 2。かっこ内が 0 になる値を探しましょう。', related: ['quadratic-equation', 'linear-function', 'extrema'], sources: [pre('3-2-quadratic-functions', 'Quadratic Functions')]
  },
  {
    id: 'linear-function', title: '一次関数', reading: 'いちじかんすう', category: 'functions', level: '中学校', tags: ['関数', '傾き', '切片'], aliases: ['1次関数', 'linear function'],
    short: 'x が同じだけ増えると、y も一定の割合で変わる関数。',
    summary: '一次関数は、エックスを何倍かして、決まった数を足す関係です。グラフは直線で、傾きと切片がわかれば形が決まります。',
    definition: '定数 a、b を用いて y = ax + b と表せる関数。日本の中学校数学では通常 a ≠ 0 とする。a は変化の割合である傾き、b は y 軸との交点の y 座標である切片。',
    explanation: ['x が 1 増えたときの y の増え方が a です。a が負の場合は、x が増えると y が減り、直線は右下がりになります。', 'x = 0 のとき y = b です。グラフを描くときは、まず (0, b) を取り、傾きを使ってもう一つの点を見つけます。'],
    formula: String.raw`y=ax+b\qquad a=\frac{\Delta y}{\Delta x}`, formulaSpeech: 'ワイ イコール、エー エックス、プラス ビー。傾きは、ワイの増加量をエックスの増加量で割ったものです。',
    example: { question: 'y = 3x + 2 で、x が 1 から 4 まで増えると y はいくつ増える？', steps: ['x の増加量は 4 − 1 = 3 です。', '傾きは 3 なので、y の増加量は 3 × 3 です。'], answer: 'y は 9 増える。' },
    pitfall: '傾きと切片を取り違えないようにしましょう。x の係数が傾き、x を含まない項が切片です。', related: ['proportionality', 'quadratic-function', 'tangent-line'], sources: [pre('2-1-linear-functions', 'Linear Functions')]
  },
  {
    id: 'proportionality', title: '比例', reading: 'ひれい', category: 'functions', level: '中学校', tags: ['関数', '比', 'グラフ'], aliases: ['正比例', 'proportion'],
    short: '一方が何倍かになると、もう一方も同じ倍率になる関係。',
    summary: '比例は、一方が二倍なら、もう一方も二倍になる関係です。単価が同じ品物の個数と代金のように、割り算で求めた比が一定になります。',
    definition: '二つの量 x、y の間に y = ax という関係があるとき、y は x に比例するという。定数 a を比例定数と呼ぶ。x が 0 でないとき、y ÷ x は一定になる。',
    explanation: ['比例のグラフは原点 (0, 0) を通る直線です。一次関数 y = ax + b のうち、切片 b が 0 であるものと考えられます。', '同じ倍率になることを確かめるには、いくつかの組で y ÷ x を求めます。ただ増えているだけでは、比例とは限りません。'],
    formula: String.raw`y=ax\qquad\frac{y}{x}=a\quad(x\ne0)`, formulaSpeech: 'ワイ イコール、エー エックス。エックスがゼロでなければ、ワイ割るエックスはエーで一定です。',
    example: { question: '1 個 120 円のパンを x 個買うとき、5 個の代金は？', steps: ['代金 y は個数 x に比例し、y = 120x です。', 'x = 5 を入れて、120 × 5 を計算します。'], answer: '600 円。比例定数は 120。' },
    pitfall: '基本料金が加わる料金は、一般に個数と比例しません。0 個のときも料金がかかるかを確認しましょう。', related: ['linear-function', 'inverse-proportion', 'fraction'], sources: [pre('3-key-concepts', 'Modeling Using Variation')]
  },
  {
    id: 'inverse-proportion', title: '反比例', reading: 'はんぴれい', category: 'functions', level: '中学校', tags: ['関数', '双曲線', '比例'], aliases: ['inverse proportion'],
    short: '一方が何倍かになると、もう一方がその逆数倍になる関係。',
    summary: '反比例は、一方が二倍になると、もう一方が二分の一になる関係です。二つの量をかけた値がいつも同じになります。',
    definition: '0 でない定数 a を用いて y = a ÷ x と表せるとき、y は x に反比例する。定義域から x = 0 を除く。積 xy は常に a になる。',
    explanation: ['一定の距離を進む速さと時間は反比例します。同じ道のりなら、速さを 2 倍にすると必要な時間は半分になります。', 'グラフは二つに分かれた曲線です。x が 0 に近づくと y の絶対値が大きくなりますが、グラフは座標軸と交わりません。'],
    formula: String.raw`y=\frac{a}{x}\qquad xy=a\quad(a\ne0,\ x\ne0)`, formulaSpeech: 'ワイ イコール、エックス分のエー。エックスかけるワイはエーで一定です。',
    example: { question: '120 km を進むとき、時速 40 km と時速 60 km では何時間かかる？', steps: ['時間は、距離 120 を速さで割って求めます。', '120 ÷ 40 = 3、120 ÷ 60 = 2 です。'], answer: '時速 40 km なら 3 時間、時速 60 km なら 2 時間。' },
    pitfall: '一方が増えて他方が減るだけでは反比例とはいえません。二つの量の積が一定かを確かめます。', related: ['proportionality', 'function-domain', 'limit'], sources: [pre('3-key-concepts', 'Modeling Using Variation')]
  },
  {
    id: 'sine-function', title: '正弦・サイン', reading: 'せいげんさいん', category: 'functions', level: '高校', tags: ['三角関数', '単位円', '波'], aliases: ['sin', 'サイン', '正弦関数', 'sine'],
    short: '単位円上の点の高さを、角度に対応させる関数。',
    summary: 'サインは、円を回る点の高さを表します。角度を増やすと値が上下を繰り返すため、波や振動を表すときにも使います。',
    definition: '原点を中心とする半径 1 の円で、正の x 軸から角 θ だけ回った点の y 座標を sin θ と定義する。鋭角の直角三角形では、対辺の長さを斜辺の長さで割った値に等しい。',
    explanation: ['sin θ の値は −1 以上 1 以下です。0 度で 0、90 度で 1、180 度で 0、270 度で −1 となり、360 度で一周します。', '微分や積分では、角度にラジアンを使います。一周は 2π ラジアンなので、sin(x + 2π) = sin x です。'],
    formula: String.raw`\sin\theta=\frac{\text{対辺}}{\text{斜辺}}\quad(0<\theta<90^\circ)`, formulaSpeech: '鋭角の直角三角形では、サイン シータは、対辺の長さを斜辺の長さで割った値です。',
    example: { question: '角度 30 度に向かい合う辺が 3 cm、斜辺が 6 cm のとき、sin 30° は？', steps: ['サインは、対辺を斜辺で割った値です。', '3 ÷ 6 を計算して約分します。'], answer: 'sin 30° = 1/2。' },
    pitfall: '電卓の度数法とラジアン設定を確認しましょう。sin 30° と sin 30 ラジアンは異なる値です。', related: ['cosine-function', 'dot-product', 'derivative'], sources: [pre('5-2-unit-circle-sine-and-cosine-functions', 'Sine and Cosine')]
  },
  {
    id: 'cosine-function', title: '余弦・コサイン', reading: 'よげんこさいん', category: 'functions', level: '高校', tags: ['三角関数', '単位円', '角度'], aliases: ['cos', 'コサイン', '余弦関数', 'cosine'],
    short: '単位円上の点の横の位置を、角度に対応させる関数。',
    summary: 'コサインは、円を回る点の横の位置を表します。サインと組み合わせると、円の上の点がどこにあるかを表せます。',
    definition: '単位円で、正の x 軸から角 θ だけ回った点の x 座標を cos θ と定義する。鋭角の直角三角形では、θ に隣り合う斜辺以外の辺を斜辺で割った値になる。',
    explanation: ['cos 0° = 1、cos 90° = 0、cos 180° = −1 です。コサインの値は −1 以上 1 以下で、一周すると元の値に戻ります。', '単位円の点は (cos θ, sin θ) と表せます。この点は半径 1 の円上にあるため、cos²θ + sin²θ = 1 が成り立ちます。'],
    formula: String.raw`\cos^2\theta+\sin^2\theta=1`, formulaSpeech: 'コサイン シータの二乗、プラス、サイン シータの二乗は、いちです。',
    example: { question: '斜辺が 10 cm、角 θ に隣り合う辺が 6 cm の直角三角形で、cos θ は？', steps: ['コサインは、隣り合う辺を斜辺で割ります。', '6 ÷ 10 = 3/5 です。'], answer: 'cos θ = 3/5。' },
    pitfall: 'どの角を基準にするかで、対辺と隣辺が入れかわります。最初に注目する角を決めましょう。', related: ['sine-function', 'pythagorean-theorem', 'dot-product'], sources: [pre('5-2-unit-circle-sine-and-cosine-functions', 'Sine and Cosine')]
  },
  {
    id: 'logarithm', title: '対数', reading: 'たいすう', category: 'functions', level: '高校', tags: ['指数', '関数', '対数法則'], aliases: ['log', 'ログ', 'logarithm'],
    short: 'ある数を何乗すれば目的の数になるかを表す数。',
    summary: '対数は、何乗したかを答える仕組みです。たとえば二を三乗すると八なので、底が二の、八の対数は三です。',
    definition: 'a > 0、a ≠ 1、x > 0 のとき、aʸ = x を満たす実数 y を、a を底とする x の対数といい、logₐx と書く。対数関数は指数関数の逆関数である。',
    explanation: ['底 a は何を繰り返しかけるかを表します。底が 10 の対数を常用対数、底が自然対数の底 e のものを自然対数と呼びます。', '正の数 M、N について、積の対数は対数の和になります。大きく異なる数の桁を比較したり、指数の含まれる方程式を解いたりするときに役立ちます。'],
    formula: String.raw`\log_a x=y\iff a^y=x\quad(a>0,\ a\ne1,\ x>0)`, formulaSpeech: '底がエーのエックスの対数がワイであることは、エーのワイ乗がエックスであることと同じです。',
    example: { question: 'log₂32 を求めよう。', steps: ['2 を何乗すると 32 になるか考えます。', '2 × 2 × 2 × 2 × 2 = 32 です。'], answer: 'log₂32 = 5。' },
    pitfall: 'logₐ(M + N) を logₐM + logₐN に分けることはできません。和に変えられるのは積の対数です。', related: ['exponential-function', 'inverse-function', 'function-domain'], sources: [pre('4-key-concepts', 'Exponential and Logarithmic Functions')]
  },
  {
    id: 'exponential-function', title: '指数関数', reading: 'しすうかんすう', category: 'functions', level: '高校', tags: ['指数', '関数', '増減'], aliases: ['exponential function', '指数的増加'],
    short: '変数が指数に入り、一定の倍率で増減する関数。',
    summary: '指数関数は、一回進むたびに同じ倍率をかける関係です。毎回二倍になる数は、同じ数を足す場合よりも、後になるほど大きく増えます。',
    definition: 'a > 0、a ≠ 1 を満たす定数 a に対し、y = aˣ で表される関数。a > 1 のとき増加し、0 < a < 1 のとき減少する。どの実数 x に対しても値は正である。',
    explanation: ['x が 1 増えるたびに y は a 倍になります。y = 2ˣ なら 1、2、4、8 と変わり、増加量そのものも大きくなります。', '指数が 0 なら値は 1 です。負の指数は逆数を表すので、2 の −1 乗は 1/2、−2 乗は 1/4 になります。'],
    formula: String.raw`y=a^x\quad(a>0,\ a\ne1)`, formulaSpeech: 'ワイ イコール、エーのエックス乗。エーは正で、いちではありません。',
    example: { question: '初めに 3 個あり、1 回ごとに 2 倍になるとき、4 回後はいくつ？', steps: ['4 回倍になるので、3 に 2 の 4 乗をかけます。', '2 の 4 乗は 16 なので、3 × 16 を計算します。'], answer: '48 個。' },
    pitfall: 'y = x² は二次関数です。指数関数では変数 x が指数の位置にあります。', related: ['logarithm', 'geometric-sequence', 'quadratic-function'], sources: [pre('4-key-concepts', 'Exponential and Logarithmic Functions')]
  },
  {
    id: 'arithmetic-sequence', title: '等差数列', reading: 'とうさすうれつ', category: 'functions', level: '高校', tags: ['数列', '公差', '一般項'], aliases: ['arithmetic sequence'],
    short: '隣り合う項の差がいつも同じになる数列。',
    summary: '等差数列は、同じ数を足しながら並べた数の列です。最初の数と、毎回いくつ足すかがわかれば、どの位置の数も求められます。',
    definition: '隣り合う項の差が一定の数列を等差数列という。この一定の差を公差 d といい、初項を a₁ とすると第 n 項は a₁ + (n − 1)d である。n は 1 以上の整数。',
    explanation: ['第 1 項から第 n 項までは、足す操作を n − 1 回行います。この回数が一般項の n − 1 に対応しています。', '初項から第 n 項までの和は、最初と最後の項の平均に項数をかければ求められます。公差が負なら、項は順に小さくなります。'],
    formula: String.raw`a_n=a_1+(n-1)d\qquad S_n=\frac{n(a_1+a_n)}{2}`, formulaSpeech: '第エヌ項は、初項に、公差かけるエヌ引くいちを足します。和は、初項と末項の和に項数をかけて、にで割ります。',
    example: { question: '3、7、11、15、… の第 10 項は？', steps: ['初項は 3、公差は 4 です。', '第 10 項は 3 + (10 − 1) × 4 です。'], answer: '39。' },
    pitfall: '第 n 項までの増加回数は n 回ではなく n − 1 回です。初項の時点では、まだ一度も足していません。', related: ['linear-function', 'geometric-sequence', 'mean'], sources: [pre('11-2-arithmetic-sequences', 'Arithmetic Sequences')]
  },
  {
    id: 'geometric-sequence', title: '等比数列', reading: 'とうひすうれつ', category: 'functions', level: '高校', tags: ['数列', '公比', '指数'], aliases: ['geometric sequence'],
    short: '前の項に、毎回同じ数をかけてできる数列。',
    summary: '等比数列は、同じ倍率をかけながら作る数の列です。二、六、十八のように、ひとつ前の数を三倍する列も等比数列です。',
    definition: '各項が一つ前の項の一定倍となる数列を等比数列という。一定の倍率を公比 r と呼ぶ。公比が 0 でないとき、初項 a₁ と第 n 項 aₙ について、aₙ = a₁rⁿ⁻¹ が成り立つ。',
    explanation: ['初項から第 n 項までは公比を n − 1 回かけます。前の項が 0 でなければ、次の項を前の項で割ることで公比を求められます。', '公比が負なら、0 でない項の符号は交互に変わります。公比が 1 ならすべて同じ値で、n 項の和は初項の n 倍です。公比が 0 なら第 2 項以降が 0 になります。'],
    formula: String.raw`a_n=a_1r^{n-1}\ (r\ne0)\qquad S_n=\frac{a_1(1-r^n)}{1-r}\quad(r\ne1)`, formulaSpeech: '第エヌ項は、初項かける、公比のエヌ引くいち乗です。和の公式で公比がいちの場合は、別に計算します。',
    example: { question: '2、6、18、… の第 5 項は？', steps: ['初項は 2、公比は 3 です。', '第 5 項は 2 × 3 の 4 乗なので、2 × 81 です。'], answer: '162。' },
    pitfall: '公比と公差は別のものです。等比数列は「かける数」、等差数列は「足す数」が一定です。', related: ['arithmetic-sequence', 'exponential-function', 'limit'], sources: [pre('11-key-concepts', 'Geometric Sequences')]
  },
  {
    id: 'function-domain', title: '定義域と値域', reading: 'ていぎいきとちいき', category: 'functions', level: '高校', tags: ['関数', '範囲', 'グラフ'], aliases: ['定義域', '値域', 'domain', 'range'],
    short: '関数に入れられる値の範囲と、実際に出てくる値の範囲。',
    summary: '定義域は、入力してよい数の範囲です。値域は、その入力から実際に出てくる答えの範囲です。',
    definition: '関数の入力となる変数が動く集合を定義域、そのすべての入力に対応して実際に得られる出力の集合を値域という。式だけでなく、問題で指定された入力範囲も確認する。',
    explanation: ['実数の範囲で考えると、分母を 0 にする値は入力できず、平方根の中は 0 以上でなければなりません。対数の中は正である必要があります。', '値域を求めるには、グラフの高さや最大値・最小値を調べます。定義域を狭めると、値域も変わることがあります。'],
    formula: String.raw`f(x)=x^2,\quad -2\le x\le3\quad\Longrightarrow\quad0\le f(x)\le9`, formulaSpeech: 'エフ エックスがエックスの二乗で、エックスがマイナスに以上さん以下なら、値はゼロ以上きゅう以下です。',
    example: { question: 'y = x²、−2 ≤ x ≤ 3 の値域は？', steps: ['区間内の x = 0 で、最小値 0 になります。', '両端の値は 4 と 9 なので、最大値は 9 です。'], answer: '0 ≤ y ≤ 9。' },
    pitfall: '入力範囲の両端だけを計算しても、値域が決まるとは限りません。途中に頂点などがないか調べましょう。', related: ['quadratic-function', 'logarithm', 'inverse-function'], sources: [pre('1-2-domain-and-range', 'Domain and Range')]
  },
  {
    id: 'inverse-function', title: '逆関数', reading: 'ぎゃくかんすう', category: 'functions', level: '高校', tags: ['関数', '対応', '対称'], aliases: ['inverse function'],
    short: '出力から元の入力を一つに決めて、対応を逆にたどる関数。',
    summary: '逆関数は、計算の結果から元の数へ戻す関数です。たとえば二倍して三を足す計算は、三を引いて二で割ると元に戻せます。',
    definition: '関数 f が入力と出力を一対一に対応させるとき、その対応を逆向きにした関数を逆関数といい、f⁻¹ と書く。逆関数の定義域は元の関数の値域となる。',
    explanation: ['y = f(x) を x について解き、入力と出力の記号を交換すると式を求められます。グラフは直線 y = x に関して対称になります。', 'y = x² をすべての実数で考えると、1 と −1 がどちらも 1 になるので逆関数を作れません。x ≥ 0 に制限すれば、逆関数は平方根になります。'],
    formula: String.raw`f^{-1}(f(x))=x`, formulaSpeech: 'エフで計算した結果を、エフの逆関数に入れると、元のエックスに戻ります。',
    example: { question: 'f(x) = 2x + 3 の逆関数は？', steps: ['y = 2x + 3 を x について解くと、x = (y − 3)/2 です。', '入力を x と書きかえて、逆の対応を表します。'], answer: 'f⁻¹(x) = (x − 3)/2。' },
    pitfall: 'f⁻¹(x) は 1/f(x) という逆数を意味しません。関数の対応そのものを逆にした記号です。', related: ['logarithm', 'exponential-function', 'function-domain'], sources: [pre('1-7-inverse-functions', 'Inverse Functions')]
  },
  {
    id: 'probability', title: '確率', reading: 'かくりつ', category: 'probability', level: '中学校', tags: ['場合の数', '事象', '割合'], aliases: ['probability'],
    short: 'あるできごとの起こりやすさを、0 から 1 の数で表したもの。',
    summary: '確率は、あるできごとがどれくらい起こりやすいかを表します。どの結果も同じように起こる場合は、目的に合う場合の数を、すべての場合の数で割ります。',
    definition: '事象の起こりやすさを数値で表すもの。確率は 0 以上 1 以下で、必ず起こる事象の確率は 1 である。有限個の結果がすべて同様に確からしい場合、場合の数の比で求められる。',
    explanation: ['さいころのように各結果が同じ確率なら、該当する目を数えれば計算できます。出やすさに偏りがある場合は、単純な個数の比では求められません。', '「起こらない確率」は 1 から「起こる確率」を引けば求められます。短い試行での実際の割合は、理論上の確率と一致するとは限りません。'],
    formula: String.raw`P(A)=\frac{\text{A に合う場合の数}}{\text{全場合の数}}`, formulaSpeech: 'どの結果も同じように起こる場合、事象エーの確率は、エーに合う場合の数を、すべての場合の数で割ります。',
    example: { question: '公平な 6 面さいころを 1 回振り、偶数が出る確率は？', steps: ['すべての結果は 1 から 6 の 6 通りです。', '偶数は 2、4、6 の 3 通りなので、3/6 を約分します。'], answer: '1/2、つまり 50%。' },
    pitfall: '確率が 1/2 でも、2 回試せば必ず 1 回起こるわけではありません。', related: ['conditional-probability', 'independence', 'combination'], sources: [stats('3-chapter-review', 'Probability Topics')]
  },
  {
    id: 'mean', title: '平均値', reading: 'へいきんち', category: 'probability', level: '中学校', tags: ['統計', '代表値', 'データ'], aliases: ['平均', '算術平均', 'mean', 'average'],
    short: 'データの合計を、データの個数で割った代表値。',
    summary: '平均値は、全体の合計を同じ量ずつ分けたときの値です。データの中心を知るのに役立ちますが、とても大きな値や小さな値の影響を受けます。',
    definition: '有限個の数値データの合計を、その個数で割った値。ここでは算術平均を扱う。データの代表値の一つで、すべての値が計算に反映される。',
    explanation: ['平均に個数をかけると元の合計に戻ります。平均から各データを引いた差をすべて足すと 0 になることも特徴です。', '人数の異なる二つの集団を合わせるときは、二つの平均をそのまま平均してはいけません。それぞれの合計と人数に戻して計算します。'],
    formula: String.raw`\bar{x}=\frac{x_1+x_2+\cdots+x_n}{n}`, formulaSpeech: '平均値は、すべてのデータを足して、データの個数エヌで割ります。',
    example: { question: '6、8、10、12 の平均値は？', steps: ['合計は 6 + 8 + 10 + 12 = 36 です。', 'データは 4 個なので、36 を 4 で割ります。'], answer: '9。' },
    pitfall: '平均値と、いちばん多く現れる値は同じとは限りません。分布や中央値も一緒に見ましょう。', related: ['median', 'mode', 'variance'], sources: [stats('2-5-measures-of-the-center-of-the-data', 'Measures of the Center')]
  },
  {
    id: 'median', title: '中央値', reading: 'ちゅうおうち', category: 'probability', level: '中学校', tags: ['統計', '代表値', 'データ'], aliases: ['メジアン', 'median'],
    short: 'データを大きさ順に並べたとき、中央にくる値。',
    summary: '中央値は、数を小さい順に並べたときの真ん中の値です。個数が偶数なら、中央の二つの値の平均を取ります。',
    definition: '数値データを大きさ順に並べ、個数が奇数なら中央の値、偶数なら中央の 2 値の算術平均を中央値とする。極端な値の大きさに左右されにくい代表値である。',
    explanation: ['中央値を求める前に、必ずデータを並べかえます。入力された順番の真ん中を選ぶのではありません。', '一部の非常に大きな値で平均が押し上げられるようなデータでは、中央値が中心的な傾向をつかむ助けになります。'],
    formula: String.raw`\mathrm{median}=\frac{x_{(n/2)}+x_{(n/2+1)}}{2}\quad(n\text{ が偶数})`, formulaSpeech: '個数が偶数なら、並べたデータの中央にある二つの数を足して、にで割ります。',
    example: { question: '9、2、100、5、7 の中央値は？', steps: ['小さい順に 2、5、7、9、100 と並べます。', '5 個のうち中央にある 3 番目の値を選びます。'], answer: '7。' },
    pitfall: '中央値は、最大値と最小値の平均ではありません。中央の位置にあるデータを使います。', related: ['mean', 'mode', 'variance'], sources: [stats('2-5-measures-of-the-center-of-the-data', 'Measures of the Center')]
  },
  {
    id: 'mode', title: '最頻値', reading: 'さいひんち', category: 'probability', level: '中学校', tags: ['統計', '代表値', '度数'], aliases: ['モード', 'mode'],
    short: 'データの中で、最も多く現れる値。',
    summary: '最頻値は、いちばん何度も出てくる値です。同じ最大回数で現れる値が複数あれば、最頻値も複数になることがあります。',
    definition: 'データの中で出現回数が最大の値を最頻値という。度数分布表では、度数が最大の階級を最頻階級といい、その階級値を最頻値として扱うこともある。',
    explanation: ['数値の大小ではなく、出現する回数に注目します。靴のサイズのように、どれが多く選ばれているかを知りたい場面で役立ちます。', '出現回数がすべて同じなら、最頻値を定めない慣習があります。最頻値だけではデータの散らばりはわかりません。'],
    formula: String.raw`\mathrm{mode}=\underset{x}{\operatorname{arg\,max}}\ \mathrm{frequency}(x)`, formulaSpeech: '最頻値は、出現回数がいちばん多い値です。',
    example: { question: '1、2、2、3、4、4、4、5 の最頻値は？', steps: ['2 は 2 回、4 は 3 回現れます。ほかは 1 回です。', '出現回数が最も多い値を選びます。'], answer: '4。' },
    pitfall: '最頻値は「最も大きい値」ではありません。度数が最大になる値を探しましょう。', related: ['mean', 'median', 'probability'], sources: [stats('2-key-terms', 'Descriptive Statistics Key Terms')]
  },
  {
    id: 'variance', title: '分散', reading: 'ぶんさん', category: 'probability', level: '高校', tags: ['統計', '散らばり', '偏差'], aliases: ['variance'],
    short: '平均からのずれを二乗して平均した、散らばりの指標。',
    summary: '分散は、データが平均の周りにどれくらい散らばっているかを表します。平均との差を二乗してから平均するので、プラスとマイナスのずれが打ち消し合いません。',
    definition: 'n 個のデータについて、各値と平均値の差を二乗し、その合計を n で割った値。ここではデータ自体の分散を扱う。母分散の推定に使う不偏分散では、分母が n − 1 になる。',
    explanation: ['平均が同じでも、データの並び方は違います。全員の点数が平均に近い集団と、大きく離れている集団を分散で比べられます。', '単位は元の単位の二乗になります。点数なら平方点に相当するため、元の単位で見たいときは平方根を取った標準偏差を使います。'],
    formula: String.raw`\sigma^2=\frac{1}{n}\sum_{i=1}^{n}(x_i-\bar{x})^2`, formulaSpeech: '分散は、それぞれのデータから平均を引いた差を二乗し、すべて足して、個数で割った値です。',
    example: { question: '2、4、6 の分散を、個数 3 で割る定義で求めよう。', steps: ['平均は 4、平均との差は −2、0、2 です。', '差の二乗は 4、0、4 なので、合計 8 を 3 で割ります。'], answer: '8/3、約 2.67。' },
    pitfall: '分散と不偏分散では分母が異なります。問題が n で割るのか、n − 1 で割るのかを確認しましょう。', related: ['standard-deviation', 'mean', 'binomial-distribution'], sources: [stats('2-7-measures-of-the-spread-of-the-data', 'Measures of Spread')]
  },
  {
    id: 'standard-deviation', title: '標準偏差', reading: 'ひょうじゅんへんさ', category: 'probability', level: '高校', tags: ['統計', '散らばり', '分散'], aliases: ['SD', 'standard deviation'],
    short: '分散の正の平方根で表す、データの散らばりの大きさ。',
    summary: '標準偏差は、分散の平方根を取ったものです。データと同じ単位で表せるので、散らばりの大きさを読み取りやすくなります。',
    definition: '分散の 0 以上の平方根を標準偏差という。データ自体の分散を使う場合と、標本の不偏分散を使う場合があるため、計算の定義を確認する。',
    explanation: ['標準偏差が 0 なら、すべてのデータが同じ値です。同じ単位・同じ条件で比べると、大きいほど平均の周りの散らばりが大きいことを表します。', '各データを同じ倍率 k で変換すると、標準偏差は k の絶対値倍になります。全データに同じ数を足しても変わりません。'],
    formula: String.raw`\sigma=\sqrt{\frac{1}{n}\sum_{i=1}^{n}(x_i-\bar{x})^2}`, formulaSpeech: '標準偏差は、分散のゼロ以上の平方根です。',
    example: { question: '2、2、6、6 の標準偏差を求めよう。', steps: ['平均は 4 で、平均との差の二乗はすべて 4 です。', '分散は 4。4 の 0 以上の平方根を取ります。'], answer: '標準偏差は 2。' },
    pitfall: '「平均 ± 標準偏差に必ず約 68% 入る」とは限りません。この目安は正規分布の場合のものです。', related: ['variance', 'mean', 'expected-value'], sources: [stats('2-7-measures-of-the-spread-of-the-data', 'Measures of Spread')]
  },
  {
    id: 'combination', title: '組合せ', reading: 'くみあわせ', category: 'probability', level: '高校', tags: ['場合の数', '選び方', '階乗'], aliases: ['組み合わせ', 'nCr', 'combination'],
    short: '順番を区別せず、決まった個数を選ぶこと。',
    summary: '組合せは、順番を気にせずメンバーを選ぶ数え方です。エーさんとビーさんを選ぶことは、ビーさんとエーさんを選ぶことと同じ一通りです。',
    definition: '異なる n 個から、重複なく r 個を選ぶ方法を組合せという。選ぶ順序は区別しない。0 ≤ r ≤ n を満たす整数について、その数は nCr = n! ÷ {r!(n − r)!}。',
    explanation: ['まず順番付きで選んだあと、同じメンバーの並べかえ r! 通りをまとめると組合せの数になります。階乗は 1 からその整数までの積で、0! = 1 とします。', 'n 個から r 個を選ぶことと、選ばない n − r 個を決めることは同じです。そのため nCr = nC(n − r) が成り立ちます。'],
    formula: String.raw`{}_nC_r=\binom nr=\frac{n!}{r!(n-r)!}`, formulaSpeech: 'エヌ シー アールは、エヌの階乗を、アールの階乗と、エヌ引くアールの階乗の積で割ります。',
    example: { question: '5 人から 2 人の係を、役割を分けずに選ぶ方法は？', steps: ['順番を区別すると、最初が 5 通り、次が 4 通りで 20 通りです。', '同じ 2 人の選び方を 2 回ずつ数えたので、2 で割ります。'], answer: '10 通り。' },
    pitfall: 'リーダーと副リーダーのように役割が異なる場合は、順序を区別する順列で数えます。', related: ['permutation', 'probability', 'binomial-distribution'], sources: [pre('11-5-counting-principles', 'Counting Principles')]
  },
  {
    id: 'permutation', title: '順列', reading: 'じゅんれつ', category: 'probability', level: '高校', tags: ['場合の数', '順番', '階乗'], aliases: ['nPr', 'permutation'],
    short: '異なるものを選び、順番を区別して並べること。',
    summary: '順列は、何を選んだかに加えて、並び順も区別します。同じ三人でも、立つ順番が違えば別の並び方として数えます。',
    definition: '異なる n 個から、重複なく r 個を選んで並べることを順列という。0 ≤ r ≤ n を満たす整数について、並べ方の数は nPr = n! ÷ (n − r)!。',
    explanation: ['一つ目に n 通り、二つ目に n − 1 通りというように、選べる数が一つずつ減ります。これらをかけ合わせるのが基本です。', 'すべてを並べる場合は n! 通りになります。同じものを含む並べ方や、円形の並べ方には別の重複調整が必要です。'],
    formula: String.raw`{}_nP_r=\frac{n!}{(n-r)!}`, formulaSpeech: 'エヌ ピー アールは、エヌの階乗を、エヌ引くアールの階乗で割った数です。',
    example: { question: '5 人から代表と副代表を 1 人ずつ選ぶ方法は？', steps: ['代表は 5 人の中から選べます。', '副代表は代表以外の 4 人から選ぶので、5 × 4 です。'], answer: '20 通り。' },
    pitfall: '同じ人を何度も選べる場合は、この順列の公式をそのまま使えません。重複が許されるかを確認します。', related: ['combination', 'probability', 'binomial-distribution'], sources: [pre('11-5-counting-principles', 'Counting Principles')]
  },
  {
    id: 'conditional-probability', title: '条件付き確率', reading: 'じょうけんつきかくりつ', category: 'probability', level: '高校', tags: ['確率', '条件', '事象'], aliases: ['条件付確率', 'conditional probability'],
    short: 'あるできごとが起きたという条件のもとでの確率。',
    summary: '条件付き確率は、わかっている情報で考える範囲を絞ってから求める確率です。さいころの目が偶数だとわかれば、候補は二、四、六だけになります。',
    definition: '事象 B が起こったという条件のもとで、事象 A が起こる確率を P(A|B) と書く。P(B) > 0 のとき、P(A|B) = P(A∩B) ÷ P(B) で定義する。',
    explanation: ['分母はすべての場合ではなく、条件 B を満たす範囲です。その範囲の中で A も満たす部分を数えます。', 'P(A|B) と P(B|A) は一般には異なります。何が先にわかっている条件なのかを、文章から丁寧に読み取りましょう。'],
    formula: String.raw`P(A\mid B)=\frac{P(A\cap B)}{P(B)}\quad(P(B)>0)`, formulaSpeech: 'ビーが起きた条件でのエーの確率は、エーとビーが両方起きる確率を、ビーが起きる確率で割ります。',
    example: { question: '公平なさいころで偶数が出たとわかっているとき、4 以上である確率は？', steps: ['条件に合う目は 2、4、6 の 3 通りです。', 'そのうち 4 以上は 4、6 の 2 通りです。'], answer: '2/3。' },
    pitfall: '条件が加わったら、分母となる範囲も変わります。元の全事象をそのまま分母にしないようにしましょう。', related: ['probability', 'independence', 'combination'], sources: [stats('3-1-terminology', 'Probability Terminology')]
  },
  {
    id: 'independence', title: '独立な事象', reading: 'どくりつなじしょう', category: 'probability', level: '高校', tags: ['確率', '独立', '試行'], aliases: ['独立', 'independent events'],
    short: '一方が起きた情報によって、他方の起こる確率が変わらない関係。',
    summary: '独立とは、一方の結果を知っても、もう一方の確率が変わらないことです。独立な二つのできごとが両方起こる確率は、それぞれの確率をかけて求めます。',
    definition: '二つの事象 A、B が P(A∩B) = P(A)P(B) を満たすとき、独立という。P(B) > 0 なら、P(A|B) = P(A) と同値である。',
    explanation: ['別々に公平なコインを投げるとき、一枚目が表でも二枚目の表の確率は変わりません。こうした試行は独立なモデルで扱います。', '袋から玉を取り出して戻さない場合は、残りの構成が変わるので、通常は独立ではありません。試行の条件を確かめることが大切です。'],
    formula: String.raw`P(A\cap B)=P(A)P(B)`, formulaSpeech: '独立なとき、エーとビーが両方起こる確率は、エーの確率かけるビーの確率です。',
    example: { question: '公平なコインを独立に 2 回投げ、両方表になる確率は？', steps: ['各回に表が出る確率は、それぞれ 1/2 です。', '独立なので、1/2 × 1/2 を計算します。'], answer: '1/4。' },
    pitfall: '独立と排反は違います。確率が正の二つの事象が同時に起きないなら、その二つは独立ではありません。', related: ['conditional-probability', 'probability', 'binomial-distribution'], sources: [stats('3-chapter-review', 'Independent Events')]
  },
  {
    id: 'expected-value', title: '期待値', reading: 'きたいち', category: 'probability', level: '高校', tags: ['確率', '平均', '確率変数'], aliases: ['数学的期待値', 'expectation', 'expected value'],
    short: '取りうる値にそれぞれの確率をかけ、足し合わせた平均的な値。',
    summary: '期待値は、各結果を、その起こりやすさに合わせて平均した値です。一回の結果を予言する数ではなく、同じ条件を何度も繰り返したときの平均を考える目安です。',
    definition: '有限個の値 xᵢ を確率 pᵢ で取る確率変数 X の期待値は、各値と確率の積の和で定義される。確率の合計は 1 である。',
    explanation: ['すべての結果が同じ確率なら、期待値は結果の数値の算術平均になります。出やすさが異なれば、確率を重みとして使います。', '期待値そのものが実際に出る値である必要はありません。たとえば整数しか出ないさいころでも、期待値は小数になります。'],
    formula: String.raw`E[X]=\sum_i x_iP(X=x_i)`, formulaSpeech: '期待値は、それぞれの値に、その値が出る確率をかけて、すべて足したものです。',
    example: { question: '公平な 6 面さいころの出た目の期待値は？', steps: ['1 から 6 の各値が、同じ確率 1/6 で出ます。', '(1 + 2 + 3 + 4 + 5 + 6) ÷ 6 = 21 ÷ 6 です。'], answer: '3.5。' },
    pitfall: '期待値が 3.5 でも、さいころで 3.5 の目は出ません。実現値と平均的な値を区別しましょう。', related: ['mean', 'probability', 'binomial-distribution'], sources: [stats('4-2-mean-or-expected-value-and-standard-deviation', 'Expected Value')]
  },
  {
    id: 'binomial-distribution', title: '二項分布', reading: 'にこうぶんぷ', category: 'probability', level: '高校', tags: ['確率分布', '独立', '反復試行'], aliases: ['binomial distribution'],
    short: '同じ成功確率の独立な試行を繰り返したときの成功回数の分布。',
    summary: '二項分布は、成功か失敗かの試行を何回か繰り返し、何回成功するかを表します。毎回の成功確率が同じで、各回が独立であることが条件です。',
    definition: '成功確率 p の独立な試行を n 回行うとき、成功回数 X が従う確率分布を二項分布 B(n, p) という。n は非負整数、0 ≤ p ≤ 1。期待値は np、分散は np(1 − p)。',
    explanation: ['ちょうど k 回成功する並び方は nCk 通りです。それぞれの並びの確率 pᵏ(1 − p)ⁿ⁻ᵏ をかけると、成功回数の確率になります。', '前の結果で次の成功確率が変わる場合や、試行回数を結果に応じて変える場合には、このモデルをそのまま使えません。'],
    formula: String.raw`P(X=k)=\binom nk p^k(1-p)^{n-k}\quad(k=0,1,\ldots,n)`, formulaSpeech: 'エックスがケーとなる確率は、エヌ シー ケー、かけるピーのケー乗、かける、いち引くピーのエヌ引くケー乗です。',
    example: { question: '公平なコインを独立に 3 回投げ、表がちょうど 2 回出る確率は？', steps: ['表が 2 回出る位置の選び方は 3C2 = 3 通りです。', '各並びの確率は (1/2)³ = 1/8 なので、3 × 1/8 です。'], answer: '3/8。' },
    pitfall: '成功と失敗の確率を、回数に合わせてそれぞれかけます。成功の確率だけでは計算できません。', related: ['combination', 'independence', 'expected-value'], sources: [stats('4-3-binomial-distribution', 'Binomial Distribution')]
  },
  {
    id: 'derivative', title: '微分・導関数', reading: 'びぶんどうかんすう', category: 'calculus', level: '高校', tags: ['微積分', '変化率', '接線'], aliases: ['微分', '導関数', 'derivative', 'differentiation'],
    short: 'ある点の、ごく瞬間的な変化の割合を求めること。',
    summary: '微分は、今この瞬間にどれくらい変化しているかを調べる方法です。グラフでは、その点に引いた接線の傾きに対応します。',
    definition: '関数 f の点 x における差商 {f(x+h) − f(x)}/h が、h を 0 に近づけたとき有限の極限を持つなら、その値を微分係数という。これを x の関数として表したものが導関数 f′。',
    explanation: ['二つの点を結ぶ直線の傾きは、ある区間の平均変化率です。点の間隔を限りなく小さくすると、一点での変化率を考えられます。', '位置を時間で微分すると速度を表します。グラフに角がある点などでは、左右からの傾きが一致せず微分できないことがあります。'],
    formula: String.raw`f^{\prime}(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}`, formulaSpeech: 'エフ ダッシュ エックスは、エフ エックス プラス エイチと、エフ エックスの差をエイチで割り、エイチをゼロに近づけた極限です。',
    example: { question: 'f(x) = x² の導関数と、x = 3 での傾きは？', steps: ['差商は {(x+h)² − x²}/h = 2x + h です。', 'h を 0 に近づけると 2x。x = 3 を入れます。'], answer: 'f′(x) = 2x、x = 3 での傾きは 6。' },
    pitfall: '微分係数は一点での数値、導関数は各点の微分係数をまとめた関数です。', related: ['limit', 'tangent-line', 'integral'], sources: [calc('3-1-defining-the-derivative', 'Defining the Derivative')]
  },
  {
    id: 'integral', title: '積分・不定積分', reading: 'せきぶんふていせきぶん', category: 'calculus', level: '高校', tags: ['微積分', '原始関数', '積分定数'], aliases: ['積分', '不定積分', '原始関数', 'integral', 'antiderivative'],
    short: '微分すると元の関数になる関数を求める操作。',
    summary: '不定積分は、微分の計算を逆にたどります。同じ関数を微分結果にもつ関数は定数の違いだけたくさんあるので、答えには積分定数を付けます。',
    definition: 'ある区間で F′(x) = f(x) を満たす F を f の原始関数と呼ぶ。原始関数全体を F(x) + C と表したものが不定積分であり、C は任意定数。積分には区間の蓄積を表す定積分もある。',
    explanation: ['x² も x² + 5 も、微分すると 2x になります。そのため 2x の不定積分は、一つの関数だけでなく x² + C と表します。', '答えを微分して元の関数に戻るかを調べると、計算を確認できます。区間と端の値を指定する定積分とは、答えの形が異なります。'],
    formula: String.raw`\int f(x)\,dx=F(x)+C\qquad F^{\prime}(x)=f(x)`, formulaSpeech: 'エフ エックスの不定積分は、微分するとエフ エックスになる関数エフ大文字に、積分定数シーを加えたものです。',
    example: { question: '2x の不定積分を求めよう。', steps: ['x² を微分すると 2x になります。', '定数を足しても微分結果は同じなので、任意定数 C を付けます。'], answer: '∫ 2x dx = x² + C。' },
    pitfall: '不定積分では積分定数 C を忘れないようにしましょう。定積分の計算結果には C は残りません。', related: ['derivative', 'definite-integral', 'fundamental-theorem'], sources: [calc('4-key-terms', 'Antiderivatives')]
  },
  {
    id: 'limit', title: '極限', reading: 'きょくげん', category: 'calculus', level: '高校', tags: ['微積分', '収束', '関数'], aliases: ['lim', 'limit', '収束'],
    short: '変数や項をある方向に近づけたとき、値が近づく先。',
    summary: '極限は、値をどこまでも近づけたとき、その先が何になるかを考えます。その点そのものの値がなくても、近づく先を決められる場合があります。',
    definition: 'x を a に限りなく近づけるとき、f(x) が一定の値 L に限りなく近づくなら、L を x → a のときの極限という。両側からの極限では、左右の極限が一致する必要がある。',
    explanation: ['極限では通常 x = a そのものを除いて近づけます。分母が 0 になる式でも、近くで式を整理できれば極限を求められることがあります。', '数列の項番号をどこまでも大きくする極限もあります。たとえば 1/n は n が大きくなるほど 0 に近づきます。'],
    formula: String.raw`\lim_{x\to a}f(x)=L`, formulaSpeech: 'エックスをエーに近づけたときの、エフ エックスの極限はエルです。',
    example: { question: 'x → 1 のとき、(x² − 1)/(x − 1) の極限は？', steps: ['x ≠ 1 では、分子を (x − 1)(x + 1) と因数分解できます。', '約分して x + 1 とし、x を 1 に近づけます。'], answer: '極限は 2。元の式は x = 1 では定義されない。' },
    pitfall: '分子も分母も 0 に近づく形を、そのまま 0 と判断してはいけません。式を整理して近づき方を調べます。', related: ['continuity', 'derivative', 'geometric-sequence'], sources: [calc('2-key-concepts', 'Limits')]
  },
  {
    id: 'continuity', title: '連続', reading: 'れんぞく', category: 'calculus', level: '高校', tags: ['関数', '極限', 'グラフ'], aliases: ['連続関数', 'continuity'],
    short: 'ある点で、近づく値とその点の値が一致すること。',
    summary: '関数が連続というのは、近くの入力から近づいた値が、その点の値につながることです。グラフに飛びや穴がない状態をイメージできます。',
    definition: '関数 f が点 a で定義され、x → a の極限が存在し、その極限が f(a) に等しいとき、f は a で連続である。区間の端では、区間内からの片側の極限を用いる。',
    explanation: ['連続を調べるには、その点の値、極限の存在、両者の一致を確認します。近づく先があっても、その点の値が違えば連続ではありません。', '微分可能な関数はその点で連続です。ただし、連続だからといって必ず微分できるわけではありません。絶対値のグラフの原点がその例です。'],
    formula: String.raw`\lim_{x\to a}f(x)=f(a)`, formulaSpeech: 'エックスをエーに近づけたときの極限が、エーでの関数の値に等しければ、エーで連続です。',
    example: { question: 'f(x) = x² は x = 2 で連続？', steps: ['その点の値は f(2) = 4 です。', 'x を 2 に近づけると x² は 4 に近づき、値が一致します。'], answer: 'x = 2 で連続。' },
    pitfall: '「連続」と「滑らか」は同じ条件ではありません。とがった点があっても連続な場合があります。', related: ['limit', 'derivative', 'fundamental-theorem'], sources: [calc('2-4-continuity', 'Continuity')]
  },
  {
    id: 'differentiation-power', title: 'べき関数の微分', reading: 'べきかんすうのびぶん', category: 'calculus', level: '高校', tags: ['微分公式', '指数', '多項式'], aliases: ['累乗の微分', 'power rule'],
    short: 'x の累乗を、指数を使って微分する基本公式。',
    summary: 'エックスの累乗を微分するときは、指数を前にかけて、指数を一つ減らします。定数だけの項を微分するとゼロになります。',
    definition: '正整数 n に対して、xⁿ の導関数は nxⁿ⁻¹ である。実数の指数にも適切な定義域で拡張できる。ここでは主に多項式の微分として扱う。',
    explanation: ['x³ の微分は 3x²、x² の微分は 2x です。項の前に定数がかかっていれば、その定数はそのまま残します。', '多項式の和や差は、項ごとに微分できます。定数は x を変えても変わらないため、その変化率は 0 です。'],
    formula: String.raw`\frac{d}{dx}x^n=nx^{n-1}\quad(n=1,2,3,\ldots)`, formulaSpeech: 'エックスのエヌ乗を微分すると、エヌかける、エックスのエヌ引くいち乗になります。',
    example: { question: 'f(x) = 3x³ − 2x + 7 を微分しよう。', steps: ['3x³ の微分は 3 × 3x² = 9x² です。', '−2x の微分は −2、定数 7 の微分は 0 です。'], answer: 'f′(x) = 9x² − 2。' },
    pitfall: '指数を下げるだけではありません。元の指数を係数にかける手順も必要です。', related: ['derivative', 'chain-rule', 'integral'], sources: [calc('3-key-concepts', 'Differentiation Rules')]
  },
  {
    id: 'tangent-line', title: '接線', reading: 'せっせん', category: 'calculus', level: '高校', tags: ['微分', '直線', '傾き'], aliases: ['tangent line'],
    short: '曲線のある点で、その点の傾きを表す直線。',
    summary: '接線は、曲線のある場所を拡大したときの進む向きを表す直線です。微分すると、その傾きを求められます。',
    definition: '関数 f が x = a で微分可能なとき、点 (a, f(a)) を通り、傾き f′(a) を持つ直線をその点での接線という。',
    explanation: ['接線の式には、通る点の座標と傾きの両方が必要です。まず f(a) を求め、次に導関数へ a を代入して傾きを求めます。', '接点の近くでは、曲線の値を接線の値で近似できます。接線は接点以外で曲線と交わることもあります。'],
    formula: String.raw`y-f(a)=f^{\prime}(a)(x-a)`, formulaSpeech: 'ワイ引くエフ エーは、エフ ダッシュ エーかける、エックス引くエーです。',
    example: { question: 'y = x² の x = 1 における接線は？', steps: ['接点は (1, 1)。導関数は 2x なので、傾きは 2 です。', 'y − 1 = 2(x − 1) を整理します。'], answer: 'y = 2x − 1。' },
    pitfall: '接線を「曲線とただ 1 点でしか交わらない直線」とだけ覚えると、一般の曲線で誤ります。', related: ['derivative', 'linear-function', 'quadratic-function'], sources: [calc('3-1-defining-the-derivative', 'Defining the Derivative')]
  },
  {
    id: 'extrema', title: '極大・極小', reading: 'きょくだいきょくしょう', category: 'calculus', level: '高校', tags: ['微分', '増減', '最大最小'], aliases: ['極値', '極大値', '極小値', 'extrema'],
    short: 'ある点の近くだけを見たときの、山や谷の値。',
    summary: '極大は近くと比べて高い山、極小は近くと比べて低い谷です。関数の増え方が減る方向に変わると山、減り方が増える方向に変わると谷になります。',
    definition: '点 a のある近傍で f(x) ≤ f(a) が成り立つなら f(a) を極大値、f(x) ≥ f(a) なら極小値という。定義域全体で比較する最大値・最小値とは区別する。',
    explanation: ['微分可能な内点で極値を取るなら、導関数は 0 になります。ただし、導関数が 0 になる点が必ず極値になるとは限りません。', '導関数の符号が正から負なら極大、負から正なら極小です。区間全体の最大・最小を求めるときは、端点も比較します。'],
    formula: String.raw`f^{\prime}(a)=0\quad\text{（微分可能な内点での極値の必要条件）}`, formulaSpeech: '微分できる区間の内側で極値を取るなら、その点の導関数はゼロです。ただし十分な条件ではありません。',
    example: { question: 'f(x) = x² − 4x + 1 の極値は？', steps: ['f′(x) = 2x − 4 は x = 2 で 0 です。', 'x = 2 の前で負、後で正になるので極小です。f(2) を計算します。'], answer: 'x = 2 で極小値 −3。極大値はない。' },
    pitfall: 'f(x) = x³ は x = 0 で導関数が 0 ですが、極大でも極小でもありません。前後の増減を確認しましょう。', related: ['derivative', 'quadratic-function', 'function-domain'], sources: [calc('4-3-maxima-and-minima', 'Maxima and Minima'), calc('4-5-derivatives-and-the-shape-of-a-graph', 'Derivative Tests')]
  },
  {
    id: 'chain-rule', title: '合成関数の微分', reading: 'ごうせいかんすうのびぶん', category: 'calculus', level: '高校', tags: ['微分', '合成関数', '連鎖律'], aliases: ['連鎖律', 'チェーンルール', 'chain rule'],
    short: '関数の中に関数が入るとき、外側と内側の微分をかける規則。',
    summary: '合成関数は、ある計算の結果を、さらに別の計算に入れた関数です。微分するときは外側を微分し、さらに内側の微分をかけます。',
    definition: 'u = g(x) が x で微分可能で、f が u = g(x) で微分可能なら、合成関数 f(g(x)) の導関数は f′(g(x))g′(x) となる。',
    explanation: ['(2x + 1)³ では、外側は「三乗」、内側は「2x + 1」です。外側を微分したあと、内側がどれくらい変化するかも反映します。', '入れ子が複数あるときも、外から順に微分してかけ合わせます。途中の関数を u などと置くと構造を見分けやすくなります。'],
    formula: String.raw`\frac{d}{dx}f(g(x))=f^{\prime}(g(x))g^{\prime}(x)`, formulaSpeech: 'エフ ジー エックスの微分は、外側を微分してジー エックスを入れたものに、内側のジー エックスの微分をかけます。',
    example: { question: 'y = (2x + 1)³ を微分しよう。', steps: ['外側の三乗を微分すると、3(2x + 1)² です。', '内側の 2x + 1 の微分は 2 なので、それをかけます。'], answer: 'y′ = 6(2x + 1)²。' },
    pitfall: '外側の微分だけで終わらず、内側の微分をかけることを忘れないでください。', related: ['derivative', 'differentiation-power', 'inverse-function'], sources: [calc('3-6-the-chain-rule', 'The Chain Rule')]
  },
  {
    id: 'definite-integral', title: '定積分', reading: 'ていせきぶん', category: 'calculus', level: '高校', tags: ['積分', '面積', '蓄積'], aliases: ['definite integral'],
    short: 'ある区間での量の積み重ねを、符号付きで求める計算。',
    summary: '定積分は、細かい量を足し合わせて、区間全体の量を求めます。グラフでは、横軸より上の部分をプラス、下の部分をマイナスとした面積に対応します。',
    definition: '区間を細かく分け、各小区間の幅と関数値の積を足した和の極限が存在するとき、その値を定積分という。連続関数では定積分が存在する。',
    explanation: ['f(x) が区間内で 0 以上なら、定積分はグラフと x 軸で囲まれる面積になります。負の部分を含む場合は、その部分が差し引かれます。', '連続な関数の原始関数を F とすると、a から b までの定積分は F(b) − F(a) です。引く順番に注意しましょう。'],
    formula: String.raw`\int_a^b f(x)\,dx=F(b)-F(a)\qquad F^{\prime}=f`, formulaSpeech: 'エーからビーまでの定積分は、原始関数のビーでの値から、エーでの値を引きます。',
    example: { question: '0 から 2 までの、f(x) = x の定積分は？', steps: ['x の原始関数の一つは x²/2 です。', '上端での値 2²/2 から、下端での値 0²/2 を引きます。'], answer: '2。' },
    pitfall: '定積分は、常に正の面積になるとは限りません。図形の面積を求めるなら、符号が変わる場所で区切ります。', related: ['integral', 'fundamental-theorem', 'limit'], sources: [calc('5-2-the-definite-integral', 'The Definite Integral')]
  },
  {
    id: 'fundamental-theorem', title: '微積分の基本定理', reading: 'びせきぶんのきほんていり', category: 'calculus', level: '大学基礎', tags: ['微積分', '定理', '原始関数'], aliases: ['微分積分学の基本定理', 'fundamental theorem of calculus'],
    short: '変化を調べる微分と、蓄積を求める積分を結び付ける定理。',
    summary: '微分と積分は、適切な条件のもとで逆向きの関係になります。この定理のおかげで、細かい面積をすべて足さなくても、原始関数から定積分を計算できます。',
    definition: 'f が閉区間 [a, b] で連続なら、G(x) = ∫ₐˣ f(t)dt は内部で微分可能で G′(x) = f(x)。さらに f の原始関数 F を使い、∫ₐᵇ f(x)dx = F(b) − F(a) と計算できる。',
    explanation: ['積分の上端を動かした関数 G は、それまでの量の蓄積を表します。上端を少し動かしたときの増え方が、元の関数値になるという関係です。', 'この定理は、面積の極限としての積分と、微分を逆にたどる原始関数とを結び付けます。計算時は関数の定義域や連続性も確かめます。'],
    formula: String.raw`\frac{d}{dx}\int_a^x f(t)\,dt=f(x)`, formulaSpeech: 'エーからエックスまでの、エフ ティーの積分を、エックスで微分すると、エフ エックスになります。',
    example: { question: 'G(x) = ∫₀ˣ 3t² dt の導関数は？', steps: ['積分する関数 3t² は連続です。', '基本定理により、上端の x を入れた 3x² が導関数です。'], answer: 'G′(x) = 3x²。' },
    pitfall: '積分の上端が x² などの関数なら、基本定理に加えて合成関数の微分が必要です。', related: ['derivative', 'integral', 'definite-integral'], sources: [calc('5-3-the-fundamental-theorem-of-calculus', 'Fundamental Theorem')]
  },
  {
    id: 'vector', title: 'ベクトル', reading: 'べくとる', category: 'linear', level: '高校', tags: ['線形代数', '向き', '大きさ'], aliases: ['vector'],
    short: '大きさと向きを合わせて表す量。',
    summary: 'ベクトルは、どれくらい、どちらへ進むかをまとめて表すものです。平面では横と縦の移動量を組にして書けます。',
    definition: '幾何学では大きさと向きを持つ量をベクトルという。平面のベクトルは成分 (a, b) で表せる。同じ成分のベクトルは、置く場所が異なっても同じとみなす。',
    explanation: ['ベクトルの和は、移動を続けて行うことに対応します。成分表示では横どうし、縦どうしを足します。', '実数倍は長さや向きを変えます。正の数倍なら向きは同じ、負の数倍なら逆向きです。零ベクトルは長さが 0 で、向きは定まりません。'],
    formula: String.raw`\vec{v}=(a,b)\qquad|\vec{v}|=\sqrt{a^2+b^2}`, formulaSpeech: '成分がエー、ビーのベクトルの長さは、エーの二乗とビーの二乗の和の平方根です。',
    example: { question: 'ベクトル (3, 4) の大きさは？', steps: ['横 3、縦 4 の直角三角形として考えます。', '三平方の定理より、長さは 3² + 4² = 25 の平方根です。'], answer: '5。' },
    pitfall: 'ベクトル (3, 4) と (4, 3) は大きさが同じでも向きが違うため、異なるベクトルです。', related: ['dot-product', 'matrix', 'pythagorean-theorem'], sources: [pre('8-8-vectors', 'Vectors')]
  },
  {
    id: 'dot-product', title: '内積', reading: 'ないせき', category: 'linear', level: '高校', tags: ['ベクトル', '角度', '直交'], aliases: ['ドット積', 'dot product', 'scalar product'],
    short: '二つのベクトルの向きの関係を、一つの数で表す演算。',
    summary: '内積は、二つのベクトルがどれくらい同じ向きを向くかを調べる計算です。どちらも長さがゼロでないなら、内積がゼロのとき二つは直角です。',
    definition: '平面の直交座標で、ベクトル a = (a₁, a₂)、b = (b₁, b₂) の内積は a₁b₁ + a₂b₂。零でないベクトルのなす角を θ とすると、|a||b|cos θ に等しい。',
    explanation: ['同じ位置の成分をかけ、それらを足して計算します。内積の結果はベクトルではなく、一つの数です。', '内積が正ならなす角は鋭角、負なら鈍角、0 なら直角です。ただし、角度の説明では両方のベクトルが零でないことが必要です。'],
    formula: String.raw`\vec a\cdot\vec b=a_1b_1+a_2b_2=|\vec a||\vec b|\cos\theta`, formulaSpeech: 'エーとビーの内積は、横の成分どうしの積と、縦の成分どうしの積を足した値です。',
    example: { question: 'a = (1, 2)、b = (2, −1) の内積は？', steps: ['同じ位置の成分をかけると、1 × 2 と 2 × (−1) です。', '足し合わせると 2 − 2 = 0 です。'], answer: '内積は 0。この二つのベクトルは直交する。' },
    pitfall: '内積の答えを (a₁b₁, a₂b₂) としないようにしましょう。最後に足して一つの数にします。', related: ['vector', 'cosine-function', 'matrix-product'], sources: [pre('8-8-vectors', 'Vectors')]
  },
  {
    id: 'matrix', title: '行列', reading: 'ぎょうれつ', category: 'linear', level: '大学基礎', tags: ['線形代数', '成分', '行と列'], aliases: ['matrix', 'matrices'],
    short: '数や式を、縦横に並べたもの。',
    summary: '行列は、数を表のように縦と横に並べたものです。連立方程式や図形の変換を、まとめて計算するのに使います。',
    definition: '数や式を長方形状に配列したものを行列という。横の並びを行、縦の並びを列と呼ぶ。m 行 n 列の行列を m × n 行列という。',
    explanation: ['同じ大きさの行列は、同じ位置の成分どうしを足したり引いたりできます。定数倍はすべての成分をその数倍します。', '行数と列数が等しい行列は正方行列です。対角成分が 1、その他が 0 の正方行列を単位行列と呼び、掛け算で数の 1 に似た役割をします。'],
    formula: String.raw`A=\begin{pmatrix}a&b\\c&d\end{pmatrix}`, formulaSpeech: '二行二列の行列。第一行がエー、ビー。第二行がシー、ディーです。',
    example: { question: '第 1 行が 1、2、第 2 行が 3、4 の行列を 2 倍すると？', steps: ['行列の定数倍は、各成分を同じ倍率にします。', '1、2、3、4 をそれぞれ 2 倍します。'], answer: '第 1 行は 2、4、第 2 行は 6、8。' },
    pitfall: '行は横、列は縦です。行列の大きさは「行数 × 列数」の順に読みます。', related: ['matrix-product', 'determinant', 'inverse-matrix'], sources: [pre('9-5-matrices-and-matrix-operations', 'Matrices and Matrix Operations')]
  },
  {
    id: 'matrix-product', title: '行列の積', reading: 'ぎょうれつのせき', category: 'linear', level: '大学基礎', tags: ['線形代数', '行列', '演算'], aliases: ['行列積', 'matrix multiplication'],
    short: '左の行と右の列を組み合わせて計算する、行列の掛け算。',
    summary: '行列の掛け算は、左の行と右の列の数を順にかけて足します。普通の数の掛け算と違い、順番を入れかえると答えが変わることがあります。',
    definition: 'A が m × n 行列、B が n × p 行列のとき、積 AB は m × p 行列。その i 行 j 列成分は、A の i 行と B の j 列の対応する成分の積の和である。',
    explanation: ['左の列数と右の行数が一致するときに積を定義できます。結果の大きさは、左の行数と右の列数で決まります。', 'AB と BA は一般に等しくありません。片方だけが定義できることもあるので、まず行列の大きさを確認します。'],
    formula: String.raw`(AB)_{ij}=\sum_{k=1}^{n}a_{ik}b_{kj}`, formulaSpeech: '積のアイ行ジェイ列は、左のアイ行と右のジェイ列の対応する成分をかけ、すべて足したものです。',
    example: { question: '行ベクトル (1, 2) と、列ベクトル (3, 4) の行列積は？', steps: ['左は 1 行 2 列、右は 2 行 1 列なので積を計算できます。', '1 × 3 + 2 × 4 を求めます。'], answer: '成分が 11 の、1 行 1 列の行列。' },
    pitfall: '行列の積は、同じ位置の成分をかけるだけの計算ではありません。行と列を組み合わせます。', related: ['matrix', 'dot-product', 'inverse-matrix'], sources: [pre('9-5-matrices-and-matrix-operations', 'Matrix Multiplication')]
  },
  {
    id: 'determinant', title: '行列式', reading: 'ぎょうれつしき', category: 'linear', level: '大学基礎', tags: ['線形代数', '正方行列', '面積'], aliases: ['det', 'determinant'],
    short: '正方行列から求める、変換の倍率や逆行列の有無に関わる数。',
    summary: '行列式は、正方行列から計算する一つの数です。二次元では、図形を変換したときの面積の倍率と向きの情報を表します。',
    definition: '正方行列に対応するスカラー値。2 × 2 行列で成分が順に a、b、c、d なら、行列式は ad − bc。行列式が 0 でないことと、逆行列が存在することは同値である。',
    explanation: ['二次元の線形変換では、行列式の絶対値が面積の倍率になります。符号が負なら、向きが反転しています。', '行列式が 0 のとき、二次元では平面が直線などにつぶれ、元の位置を一意に戻せなくなります。行列式の値と行列そのものは区別します。'],
    formula: String.raw`\det\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc`, formulaSpeech: '二行二列の行列式は、左上と右下の積から、右上と左下の積を引きます。',
    example: { question: '第 1 行が 2、1、第 2 行が 3、4 の行列の行列式は？', steps: ['左上と右下の積は 2 × 4 = 8 です。', '右上と左下の積 1 × 3 = 3 を引きます。'], answer: '5。逆行列が存在する。' },
    pitfall: '2 × 2 の公式を、そのまま大きい行列に当てはめることはできません。行列の次数に応じた方法を使います。', related: ['matrix', 'inverse-matrix', 'vector'], sources: [pre('9-key-concepts', 'Determinants and Inverses')]
  },
  {
    id: 'inverse-matrix', title: '逆行列', reading: 'ぎゃくぎょうれつ', category: 'linear', level: '大学基礎', tags: ['線形代数', '行列', '単位行列'], aliases: ['inverse matrix'],
    short: '行列による変換を元に戻し、積が単位行列になる行列。',
    summary: '逆行列は、ある行列の計算を元に戻す役割を持ちます。すべての行列にあるわけではなく、情報がつぶれずに残る場合に存在します。',
    definition: '正方行列 A に対し、AB = BA = I を満たす行列 B があるとき、B を A の逆行列といい A⁻¹ と書く。I は単位行列。逆行列は存在すれば一意である。',
    explanation: ['2 × 2 行列では、行列式 ad − bc が 0 でなければ逆行列を公式で求められます。分母が 0 になる場合は存在しません。', '連立一次方程式を AX = B と表せるとき、A が可逆なら左から A⁻¹ をかけて X = A⁻¹B とできます。かける側と順番に注意します。'],
    formula: String.raw`\begin{pmatrix}a&b\\c&d\end{pmatrix}^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}\quad(ad-bc\ne0)`, formulaSpeech: '二行二列の逆行列は、対角成分を入れかえ、残りの成分の符号を変えた行列を、行列式で割ります。行列式はゼロではありません。',
    example: { question: '対角成分が 2 と 3、それ以外が 0 の行列の逆行列は？', steps: ['横方向を 2 倍、縦方向を 3 倍する変換です。', '元に戻すには、横を 1/2 倍、縦を 1/3 倍します。'], answer: '対角成分が 1/2 と 1/3、それ以外が 0 の行列。' },
    pitfall: '逆行列は、各成分をそれぞれ逆数にしたものではありません。積が単位行列になるか確認します。', related: ['matrix', 'matrix-product', 'determinant'], sources: [pre('9-key-concepts', 'Determinants and Inverses')]
  }
];
