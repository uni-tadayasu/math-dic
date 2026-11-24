// Original Japanese explanations and worked examples; references support the mathematical facts.
const ref = (book, page, label) => ({ label: `OpenStax｜${label}`, url: `https://openstax.org/books/${book}/pages/${page}` });
const P = (page, label) => ref('prealgebra-2e', page, label);
const A = (page, label) => ref('elementary-algebra-2e', page, label);
const C = (page, label) => ref('contemporary-mathematics', page, label);
const S = {
  integers: A('1-3-add-and-subtract-integers', '整数と絶対値'),
  fractions: P('4-1-visualize-fractions', '分数の意味'),
  decimals: P('5-3-decimals-and-fractions', '小数と分数'),
  percent: P('6-1-understand-percent', '百分率'),
  ratio: P('5-6-ratios-and-rate', '比と割合'),
  primes: P('2-4-find-multiples-and-factors', '倍数・約数・素数'),
  primeFactors: P('2-5-prime-factorization-and-the-least-common-multiple', '素因数分解と最小公倍数'),
  gcd: A('7-1-greatest-common-factor-and-factor-by-grouping', '最大公約数と因数分解'),
  roots: P('5-7-simplify-and-use-square-roots', '平方根'),
  reals: A('1-8-the-real-numbers', '実数・有理数・無理数'),
  expressions: A('1-2-use-the-language-of-algebra', '文字式と項'),
  distribution: A('1-9-properties-of-real-numbers', '実数の演算法則'),
  products: A('6-3-multiply-polynomials', '多項式の積'),
  specialProducts: A('6-4-special-products', '展開の公式'),
  factoring: A('7-4-factor-special-products', '因数分解の公式'),
  equations: A('2-4-use-a-general-strategy-to-solve-linear-equations', '一次方程式'),
  systems: A('5-3-solve-systems-of-equations-by-elimination', '連立方程式'),
  inequalities: A('2-7-solve-linear-inequalities', '一次不等式'),
  quadratic: A('7-6-quadratic-equations', '二次方程式'),
  quadraticFormula: A('10-3-solve-quadratic-equations-using-the-quadratic-formula', '解の公式と判別式'),
  completing: A('10-2-solve-quadratic-equations-by-completing-the-square', '平方完成'),
  exponents: A('6-7-integer-exponents-and-scientific-notation', '整数指数'),
  triangles: P('9-3-use-properties-of-angles-triangles-and-the-pythagorean-theorem', '三角形と三平方の定理'),
  areas: P('9-4-use-properties-of-rectangles-triangles-and-trapezoids', '三角形・長方形・台形'),
  parallelogram: C('10-6-area', '平面図形の面積'),
  circle: P('9-5-solve-geometry-applications-circles-and-irregular-figures', '円の面積と円周'),
  sector: ref('precalculus-2e', '5-1-angles', '角度と扇形'),
  solids: P('9-6-solve-geometry-applications-volume-and-surface-area', '立体の体積と表面積'),
  polygons: C('10-4-polygons-perimeter-and-circumference', '多角形'),
  congruence: { label: 'ウォータールー大学 CEMC｜相似と合同', url: 'https://courseware.cemc.uwaterloo.ca/46/assignments/1239/1' }
};

export const foundationEntries = [
  {
    id: 'integer', title: '整数', reading: 'せいすう', category: 'numbers', level: '中学校', tags: ['数の種類', '正負の数'], aliases: ['正の整数', '負の整数'],
    short: '小数や分数の端数をもたない、正負の数とゼロ。',
    summary: '整数は、ゼロを中心に、右へ一つずつ、左へ一つずつ並ぶ数です。一、二、三だけでなく、マイナス一やマイナス二も整数に含まれます。',
    definition: '整数は、0、1、2、3、…と、その負の数を合わせた数の集合です。整数全体を記号 ℤ で表します。',
    explanation: ['数直線では、整数は0から等間隔に並びます。右にある数ほど大きく、例えばマイナス2はマイナス5より大きい数です。', '整数どうしの加法・減法・乗法の結果は整数です。除法の結果は整数とは限らず、例えば3を2で割ると1.5になります。'],
    formula: '\\mathbb{Z}=\\{\\ldots,-2,-1,0,1,2,\\ldots\\}', formulaSpeech: '整数全体は、マイナス二、マイナス一、ゼロ、一、二のように、両方向へ続く数の集まりです。',
    example: { question: '気温がマイナス3度から7度上がると、何度になりますか。', steps: ['出発点をマイナス3とします。', '7度上がるので、数直線を右へ7つ進みます。'], answer: '4度です。' },
    pitfall: '「負の数はすべて整数」とは限りません。マイナス0.5は負の数ですが、整数ではありません。', related: ['absolute-value', 'rational-number'], sources: [S.integers]
  },
  {
    id: 'fraction', title: '分数', reading: 'ぶんすう', category: 'numbers', level: '小学校', tags: ['計算', '分母', '分子'], aliases: ['分母', '分子', '約分', '通分'],
    short: 'ひとつの量を等しく分けたうち、いくつ分かを表す数。',
    summary: '分数は、同じ大きさに分けたものを何個集めたかを表します。四分の三なら、四つに等しく分けたうちの三つ分です。',
    definition: '分数は、整数aと0ではない整数bを使ってa/bと表す数です。上のaを分子、下のbを分母と呼び、aをbで割った値を表します。',
    explanation: ['分母と分子に同じ0でない数を掛けても、分数の値は変わりません。両方を共通の約数で割って簡単にすることを約分といいます。', '分数の足し算や引き算では、まず分母をそろえます。これは、同じ大きさの単位にそろえてから個数を数えるためです。'],
    formula: '\\frac{a}{b}=a\\div b\\quad(b\\ne0)', formulaSpeech: 'ビー分のエーは、エー割るビーです。ただし、ビーはゼロではありません。',
    example: { question: '2分の1と3分の1を足すと、いくつですか。', steps: ['共通の分母を6にします。', '2分の1は6分の3、3分の1は6分の2です。', '分子を足して、6分の5になります。'], answer: '6分の5です。' },
    pitfall: '足し算で分母どうしを足してはいけません。2分の1と3分の1の和は、5分の2ではありません。', related: ['least-common-multiple', 'decimal', 'rational-number'], sources: [S.fractions]
  },
  {
    id: 'decimal', title: '小数', reading: 'しょうすう', category: 'numbers', level: '小学校', tags: ['位取り', '計算'], aliases: ['小数点', '有限小数', '循環小数'],
    short: '小数点を使って、1より小さい位まで表した数。',
    summary: '小数は、一を十等分、百等分と細かく分けて表す書き方です。零点七は十分の七、零点零七は百分の七と同じ値です。',
    definition: '十進法の小数では、小数点の右側に10分の1の位、100分の1の位、1000分の1の位が続きます。有限小数のほか、数字が無限に続く小数もあります。',
    explanation: ['足し算・引き算では小数点を縦にそろえ、同じ位どうしを計算します。末尾に0を補っても値は変わりません。', '有限小数は分母が10の累乗である分数に直せます。例えば0.125は1000分の125で、約分すると8分の1です。'],
    formula: '0.125=\\frac{125}{1000}=\\frac18', formulaSpeech: '零点一二五は、千分の百二十五、つまり八分の一です。',
    example: { question: '0.7と0.08の和を求めましょう。', steps: ['0.7を0.70と書き、位をそろえます。', '0.70に0.08を足します。'], answer: '0.78です。' },
    pitfall: '桁数が多い小数ほど大きいとは限りません。0.9は0.125より大きい数です。', related: ['fraction', 'percentage'], sources: [S.decimals]
  },
  {
    id: 'percentage', title: '百分率', reading: 'ひゃくぶんりつ', category: 'numbers', level: '小学校', tags: ['割合', 'パーセント'], aliases: ['パーセント', '%', '割合'],
    short: '全体を100としたときの割合を、％で表す方法。',
    summary: '百分率は、全体を百個分と考えたときの割合です。二十五パーセントなら全体の四分の一で、百パーセントなら全体そのものです。',
    definition: '比較する量を基準となる量で割った割合を100倍し、％を付けて表したものが百分率です。基準となる量は0でないものとします。',
    explanation: ['割合が20％なら、計算では0.20として使います。基準量に0.20を掛けると、その20％に当たる量が求められます。', '増加率や割引率では、何を基準にするかが大切です。20％引き後の価格は元の価格の80％です。'],
    formula: 'p=\\frac{\\text{比較する量}}{\\text{基準となる量}}\\times100\\%', formulaSpeech: '百分率は、比較する量を基準となる量で割り、百を掛けてパーセントで表します。',
    example: { question: '2400円の商品を25％引きで買うと、いくらですか。', steps: ['値引き額は2400に0.25を掛けて600円です。', '元の価格から600円を引きます。'], answer: '1800円です。' },
    pitfall: '20％増やした後に20％減らしても、元の量には戻りません。二回目の基準量が変わるためです。', related: ['ratio', 'decimal', 'fraction'], sources: [S.percent]
  },
  {
    id: 'ratio', title: '比', reading: 'ひ', category: 'numbers', level: '小学校', tags: ['割合', '比例式'], aliases: ['比の値', '比例式'],
    short: '二つの量を、同じ尺度で比べた関係。',
    summary: '比は、二つの量のつり合いを表します。二対三なら、片方を二個分と見たとき、もう片方は三個分です。',
    definition: '二つの量a、bの関係をa:bと書きます。bが0でないとき、aをbで割ったa/bを比の値と呼びます。',
    explanation: ['比の両方に同じ正の数を掛けたり、同じ正の数で割ったりしても、量の関係は変わりません。6対9は2対3と同じ比です。', '全体を2対3に分けるなら、全体は2と3を合わせた5個分です。それぞれ全体の5分の2、5分の3になります。'],
    formula: 'a:b=ka:kb\\quad(k>0)', formulaSpeech: 'エー対ビーは、ケーエー対ケービーと同じ比です。ケーは正の数です。',
    example: { question: '500ミリリットルの飲み物を2対3に分けると、それぞれ何ミリリットルですか。', steps: ['全部で5個分なので、1個分は500割る5で100です。', '2個分は200、3個分は300です。'], answer: '200ミリリットルと300ミリリットルです。' },
    pitfall: '2対3で分けるとき、片方を全体の3分の2にするわけではありません。全体は5個分です。', related: ['percentage', 'similarity', 'fraction'], sources: [S.ratio]
  },
  {
    id: 'prime-number', title: '素数', reading: 'そすう', category: 'numbers', level: '中学校', tags: ['整数', '約数'], aliases: ['素数判定'],
    short: '1と自分自身だけを正の約数にもつ、2以上の整数。',
    summary: '素数は、一と自分自身以外では割り切れない、二以上の整数です。二、三、五、七などがあり、数を掛け算に分解するときの基本になります。',
    definition: '2以上の整数のうち、正の約数が1とその数自身の二つだけであるものを素数といいます。2以上で素数でない整数は合成数です。',
    explanation: ['2は唯一の偶数の素数です。2より大きい偶数には、1と自分自身以外に2という約数があります。', 'ある整数nが素数か調べるには、平方根n以下の素数で割り切れるか確かめれば十分です。約数の組の小さい方は必ず平方根n以下になるからです。'],
    formula: '2,3,5,7,11,13,17,19,\\ldots', formulaSpeech: '素数は、二、三、五、七、十一、十三、十七、十九と続きます。',
    example: { question: '29は素数ですか。', steps: ['29の平方根は5と6の間にあります。', '5以下の素数である2、3、5のどれでも29は割り切れません。'], answer: '29は素数です。' },
    pitfall: '1は素数ではありません。正の約数が一つしかないため、素数の定義に当てはまりません。', related: ['prime-factorization', 'greatest-common-divisor'], sources: [S.primes]
  },
  {
    id: 'prime-factorization', title: '素因数分解', reading: 'そいんすうぶんかい', category: 'numbers', level: '中学校', tags: ['整数', '素数'], aliases: ['素因数'],
    short: '2以上の整数を、素数だけの積で表すこと。',
    summary: '素因数分解は、数を素数の掛け算にほどくことです。どの順番で分け始めても、最後に現れる素数の種類と個数は同じになります。',
    definition: '2以上の整数を素数の積として表すことを素因数分解といいます。素因数の並ぶ順序を除けば、その表し方は一意に定まります。',
    explanation: ['小さい素数から順に割り、商もさらに素数で割っていくと整理しやすくなります。同じ素数が続く部分は累乗でまとめます。', '素因数分解は、最大公約数・最小公倍数の計算や、平方根の簡単化に役立ちます。'],
    formula: '84=2^2\\times3\\times7', formulaSpeech: '八十四は、二の二乗掛ける三掛ける七です。',
    example: { question: '90を素因数分解しましょう。', steps: ['90を2で割ると45です。', '45は3掛ける15で、15は3掛ける5です。', '素数だけの積にまとめます。'], answer: '90は2掛ける3の2乗掛ける5です。' },
    pitfall: '6や9が因数として残っている間は、素因数分解は終わっていません。すべての因数を素数にします。', related: ['prime-number', 'greatest-common-divisor', 'least-common-multiple'], sources: [S.primeFactors]
  },
  {
    id: 'greatest-common-divisor', title: '最大公約数', reading: 'さいだいこうやくすう', category: 'numbers', level: '小学校', tags: ['整数', '約分'], aliases: ['GCD', '公約数'],
    short: '二つ以上の正の整数を、すべて割り切る最大の正の整数。',
    summary: '最大公約数は、いくつかの数を全部割り切れる数のうち、一番大きいものです。余りなく同じ組に分けたいときや、分数を約分するときに使います。',
    definition: '正の整数a、bの共通の正の約数を公約数といい、そのうち最大のものを最大公約数といいます。記号ではgcd(a,b)と表します。',
    explanation: ['数が小さいときは、それぞれの約数を並べて共通する最大のものを探せます。', '素因数分解を使う場合は、共通して現れる素数を、両方に含まれる回数だけ掛け合わせます。'],
    formula: '\\gcd(18,30)=6', formulaSpeech: '十八と三十の最大公約数は六です。',
    example: { question: '24個の赤玉と36個の青玉を、各組が同じ内訳になるよう余りなく分けます。組数は最大いくつですか。', steps: ['組数は24と36の両方の約数です。', '共通する約数のうち最大の数は12です。'], answer: '最大12組で、各組は赤玉2個と青玉3個です。' },
    pitfall: '「最大」の対象は公約数です。大きい方の元の数が答えになるとは限りません。', related: ['prime-factorization', 'least-common-multiple', 'fraction'], sources: [S.gcd]
  },
  {
    id: 'least-common-multiple', title: '最小公倍数', reading: 'さいしょうこうばいすう', category: 'numbers', level: '小学校', tags: ['整数', '通分'], aliases: ['LCM', '公倍数'],
    short: '二つ以上の正の整数の共通の倍数のうち、最小の正の数。',
    summary: '最小公倍数は、それぞれの数の倍数が最初に重なる正の数です。周期が違う出来事の重なりや、分数の通分を考えるときに役立ちます。',
    definition: '正の整数a、bの両方の倍数である数を公倍数といい、そのうち最小の正の数を最小公倍数といいます。0はここでは対象から除きます。',
    explanation: ['倍数を小さい方から並べ、初めて共通する数を探します。例えば4の倍数と6の倍数が最初に重なる正の数は12です。', '正の整数a、bでは、最大公約数と最小公倍数の積はaとbの積に等しくなります。'],
    formula: '\\operatorname{lcm}(a,b)=\\frac{ab}{\\gcd(a,b)}\\quad(a,b>0)', formulaSpeech: '正の整数エーとビーの最小公倍数は、エー掛けるビーを最大公約数で割った数です。',
    example: { question: '6分ごとと8分ごとに鳴るベルが同時に鳴りました。次に同時に鳴るのは何分後ですか。', steps: ['6と8の共通の正の倍数を探します。', '6の倍数は6、12、18、24。8の倍数は8、16、24です。'], answer: '24分後です。' },
    pitfall: '二つの数を掛けた値は公倍数ですが、必ず最小とは限りません。共通の約数があると、さらに小さくできます。', related: ['greatest-common-divisor', 'fraction', 'prime-factorization'], sources: [S.primeFactors]
  },
  {
    id: 'absolute-value', title: '絶対値', reading: 'ぜったいち', category: 'numbers', level: '中学校', tags: ['数直線', '距離'], aliases: ['絶対値記号'],
    short: '数直線で、その数が0からどれだけ離れているか。',
    summary: '絶対値は、ゼロからの距離です。向きは考えないので、五の絶対値もマイナス五の絶対値も五になります。',
    definition: '実数xの絶対値|x|は、数直線上の点xと0の距離です。xが0以上ならx、xが負なら−xに等しく、必ず0以上になります。',
    explanation: ['縦線二本で数を囲み、例えば|−7|と書きます。負の数に限って符号を反転するので、結果は負になりません。', '二つの数a、bの距離は|a−b|で表せます。差を取ってから絶対値にすることが大切です。'],
    formula: '|x|=\\begin{cases}x&(x\\ge0)\\\\-x&(x<0)\\end{cases}', formulaSpeech: 'エックスの絶対値は、エックスがゼロ以上ならエックス、負ならマイナスエックスです。',
    example: { question: '数直線上のマイナス4と3の間の距離を求めましょう。', steps: ['二つの数の差を計算すると、マイナス4引く3でマイナス7です。', 'その絶対値を取ります。'], answer: '距離は7です。' },
    pitfall: '絶対値は「必ず正」ではなく「0以上」です。0の絶対値は0です。', related: ['integer', 'square-root', 'inequality'], sources: [S.integers]
  },
  {
    id: 'square-root', title: '平方根', reading: 'へいほうこん', category: 'numbers', level: '中学校', tags: ['根号', 'ルート'], aliases: ['ルート', '根号', '√'],
    short: '2乗すると、もとの数になる数。',
    summary: '平方根は、二乗を元に戻す考え方です。九の平方根は三とマイナス三ですが、ルート九という記号は、そのうちゼロ以上の三を表します。',
    definition: 'x²=aを満たすxをaの平方根といいます。実数の範囲で、aが正なら平方根は二つ、aが0なら0一つです。√aは0以上の平方根を表します。',
    explanation: ['負の実数には、実数の平方根はありません。どの実数を2乗しても0以上になるからです。', '√(x²)は|x|に等しくなります。例えばxがマイナス4なら、√16は4であり、マイナス4ではありません。'],
    formula: '\\sqrt{x^2}=|x|', formulaSpeech: 'エックスの二乗の平方根のうちゼロ以上のものは、エックスの絶対値です。',
    example: { question: '50の平方根を簡単な形で表しましょう。', steps: ['50を25掛ける2と分けます。', '25のゼロ以上の平方根は5です。', '正と負の両方を考えます。'], answer: 'プラス・マイナス5ルート2です。' },
    pitfall: '√9そのものの値は3です。「9の平方根をすべて求める」ときに、3とマイナス3を答えます。', related: ['absolute-value', 'quadratic-equation', 'prime-factorization'], sources: [S.roots]
  },
  {
    id: 'rational-number', title: '有理数', reading: 'ゆうりすう', category: 'numbers', level: '中学校', tags: ['数の種類', '実数'], aliases: ['無理数', '有理数と無理数'],
    short: '整数どうしの分数で表せる数。',
    summary: '有理数は、整数を整数で割った形にできる数です。整数、有限小数、同じ並びが繰り返す循環小数は有理数に含まれます。',
    definition: '整数aと0ではない整数bを使ってa/bと表せる数を有理数といいます。有理数でない実数は無理数と呼び、√2や円周率πがその例です。',
    explanation: ['整数nはn/1と書けるため、有理数です。小数で書くと終わる数も、分母を10の累乗にして分数に直せます。', '分数の割り算で同じ余りが現れると、その後の数字も同じ順に繰り返します。そのため有理数の小数表示は、有限小数か循環小数になります。'],
    formula: '\\mathbb{Q}=\\left\\{\\frac ab\\mid a,b\\in\\mathbb{Z},\\ b\\ne0\\right\\}', formulaSpeech: '有理数全体は、整数エーをゼロでない整数ビーで割った数の集まりです。',
    example: { question: '0.375は有理数ですか。', steps: ['0.375を1000分の375と書きます。', '分子と分母を125で割ると、8分の3になります。'], answer: '整数どうしの分数にできるので、有理数です。' },
    pitfall: '小数が無限に続くからといって無理数とは限りません。0.333…のような循環小数は有理数です。', related: ['fraction', 'decimal', 'square-root'], sources: [S.reals]
  },
  {
    id: 'algebraic-expression', title: '文字式', reading: 'もじしき', category: 'algebra', level: '中学校', tags: ['代数', '文字'], aliases: ['変数', '係数', '項'],
    short: '数や量を文字で表し、計算の関係をまとめた式。',
    summary: '文字式は、まだ決まっていない数や、いろいろ変わる量を文字で表します。一つの式で、たくさんの場合に共通する関係を説明できます。',
    definition: '数や量を表す文字と、数、演算記号を組み合わせた式を文字式といいます。3xでは3を係数、xを文字と呼びます。',
    explanation: ['数と文字の掛け算は、掛け算記号を省いて3xと書きます。xに数を入れて式の値を求める操作を代入といいます。', '文字式と方程式は区別します。3x+2は式であり、3x+2=11は二つの量が等しいという条件を表す方程式です。'],
    formula: '3x+2', formulaSpeech: '三エックス、プラス二。三とエックスの積に、二を加えた式です。',
    example: { question: '1冊x円のノート3冊と、120円のペンの合計金額を式で表しましょう。', steps: ['ノート3冊の代金は3x円です。', 'ペンの120円を足します。'], answer: '合計は3x+120円です。' },
    pitfall: '3xは3とxの掛け算であり、二桁の数「3x」を意味するわけではありません。', related: ['like-terms', 'linear-equation', 'distributive-law'], sources: [S.expressions]
  },
  {
    id: 'like-terms', title: '同類項', reading: 'どうるいこう', category: 'algebra', level: '中学校', tags: ['式の計算', '係数'], aliases: ['項をまとめる'],
    short: '文字の部分と、それぞれの指数が同じ項。',
    summary: '同類項は、同じ種類の文字のまとまりです。同じものの個数を合わせるように、係数だけを足したり引いたりしてまとめます。',
    definition: '文字の組み合わせと各文字の指数がすべて一致する項を同類項といいます。2xと−5xは同類項ですが、2xと2x²は異なります。',
    explanation: ['3x+4xは、xが3個と4個あると考えて7xにまとめられます。これは分配法則を逆向きに使った計算です。', '定数だけの項も同類項としてまとめます。一方、xの項とyの項は、一般には一つの項にできません。'],
    formula: 'ax+bx=(a+b)x', formulaSpeech: 'エーエックス、プラス、ビーエックスは、エーとビーの和、掛けるエックスです。',
    example: { question: '5x+2−3x+7を簡単にしましょう。', steps: ['xの項は5x−3xで2xになります。', '数だけの項は2+7で9になります。'], answer: '2x+9です。' },
    pitfall: 'xとx²は同類項ではありません。x+x²を2x²とすることはできません。', related: ['algebraic-expression', 'distributive-law', 'expansion'], sources: [S.expressions]
  },
  {
    id: 'distributive-law', title: '分配法則', reading: 'ぶんぱいほうそく', category: 'algebra', level: '中学校', tags: ['計算法則', 'かっこ'], aliases: ['分配'],
    short: '和に数を掛けるとき、各項に分けて掛けられる法則。',
    summary: '分配法則は、かっこの外の数を、中のそれぞれの項に掛けるルールです。まとめて計算することと、分けて計算することが同じ結果になります。',
    definition: '数a、b、cについて、a(b+c)=ab+acが成り立つことを分配法則といいます。減法の場合も、a(b−c)=ab−acとなります。',
    explanation: ['例えば、3人にりんご2個とみかん4個ずつを配る場合、3(2+4)と、3×2+3×4は同じ個数を数えています。', '逆向きに使うと、共通する因数をくくり出せます。これは因数分解の基本です。'],
    formula: 'a(b+c)=ab+ac', formulaSpeech: 'エー掛ける、ビーたすシーは、エービーたすエーシーです。',
    example: { question: '−2(x−3)を展開しましょう。', steps: ['マイナス2をxに掛けて、マイナス2xにします。', 'マイナス2をマイナス3に掛けると、プラス6です。'], answer: '−2x+6です。' },
    pitfall: 'かっこの最初の項だけに掛けてはいけません。すべての項に掛け、符号も確認します。', related: ['expansion', 'factorization', 'like-terms'], sources: [S.distribution]
  },
  {
    id: 'expansion', title: '展開', reading: 'てんかい', category: 'algebra', level: '中学校', tags: ['式の計算', '乗法公式'], aliases: ['展開公式'],
    short: '積の形の式を、和や差の形に書き直すこと。',
    summary: '展開は、掛け算のかっこを開く計算です。それぞれの項を掛け合わせてから、同類項をまとめます。',
    definition: '多項式の積を分配法則によって計算し、項の和として表すことを展開といいます。因数分解とは逆向きの操作です。',
    explanation: ['(x+a)(x+b)では、前のかっこの各項を、後ろのかっこの各項に掛けます。x²、bx、ax、abの四つの項が現れます。', 'よく出る形は公式としてまとめられます。(a+b)²=a²+2ab+b²ですが、途中の2abを忘れないことが大切です。'],
    formula: '(x+a)(x+b)=x^2+(a+b)x+ab', formulaSpeech: 'エックスたすエーと、エックスたすビーの積は、エックスの二乗、たす、エーたすビー掛けるエックス、たす、エービーです。',
    example: { question: '(x+4)(x−2)を展開しましょう。', steps: ['各項を掛けると、x²−2x+4x−8です。', '同類項の−2xと4xをまとめます。'], answer: 'x²+2x−8です。' },
    pitfall: '(a+b)²はa²+b²ではありません。交差する積から2abが現れます。', related: ['distributive-law', 'factorization', 'like-terms'], sources: [S.products, S.specialProducts]
  },
  {
    id: 'factorization', title: '因数分解', reading: 'いんすうぶんかい', category: 'algebra', level: '中学校', tags: ['式の計算', '方程式'], aliases: ['共通因数', 'くくり出す'],
    short: '和や差の形の式を、いくつかの式の積で表すこと。',
    summary: '因数分解は、展開を逆向きにたどる計算です。式を掛け算の形にすると、方程式の解や式の性質を見つけやすくなります。',
    definition: '多項式を、より簡単な多項式などの積として表すことを因数分解といいます。どの範囲の係数を認めるかで、分解できる形は変わります。',
    explanation: ['まず全項に共通する因数がないかを確認します。例えば3x²+6xは3x(x+2)と書けます。', 'x²+bx+cでは、和がb、積がcになる二つの数を探す方法があります。最後に展開して元の式に戻るか確かめます。'],
    formula: 'x^2+(p+q)x+pq=(x+p)(x+q)', formulaSpeech: 'エックスの二乗、たす、ピーとキューの和掛けるエックス、たす、ピーキューは、エックスたすピーとエックスたすキューの積です。',
    example: { question: 'x²+7x+12を因数分解しましょう。', steps: ['和が7、積が12になる数を探します。', '3と4が条件を満たします。'], answer: '(x+3)(x+4)です。' },
    pitfall: 'どんな式でも整数係数の一次式の積になるわけではありません。分解する係数の範囲を確認しましょう。', related: ['expansion', 'quadratic-equation', 'distributive-law'], sources: [S.factoring]
  },
  {
    id: 'linear-equation', title: '一次方程式', reading: 'いちじほうていしき', category: 'algebra', level: '中学校', tags: ['方程式', '移項'], aliases: ['一元一次方程式', '移項'],
    short: '整理すると、文字の1次式が0に等しい形になる方程式。',
    summary: '一次方程式は、つり合いを保ちながら未知の数を探す式です。両辺に同じ操作をして、文字一つだけの形に近づけます。',
    definition: '一つの未知数xについて、ax+b=0という形に整理できる方程式を一元一次方程式といいます。ただしaは0ではありません。',
    explanation: ['両辺に同じ数を加えたり引いたりしても、等しい関係は保たれます。0でない同じ数で両辺を割ることもできます。', '移項は、両辺に同じ数や式を加減する操作を省略した書き方です。求めた値を元の式に入れると、計算を確認できます。'],
    formula: 'ax+b=0\\quad\\Longrightarrow\\quad x=-\\frac ba\\quad(a\\ne0)', formulaSpeech: 'エーエックスたすビーがゼロなら、エックスはマイナスビー割るエーです。エーはゼロではありません。',
    example: { question: '4x−7=13を解きましょう。', steps: ['両辺に7を加えて、4x=20にします。', '両辺を4で割ります。'], answer: 'x=5です。' },
    pitfall: '片方の辺だけに足したり割ったりすると、等しい関係が崩れます。両辺に同じ操作をします。', related: ['algebraic-expression', 'simultaneous-equations', 'inequality'], sources: [S.equations]
  },
  {
    id: 'simultaneous-equations', title: '連立方程式', reading: 'れんりつほうていしき', category: 'algebra', level: '中学校', tags: ['方程式', '加減法', '代入法'], aliases: ['二元一次連立方程式', '加減法', '代入法'],
    short: '複数の方程式を、同時に満たす値の組を求める問題。',
    summary: '連立方程式では、いくつかの条件を同時に満たす数を探します。一つの文字を消したり、別の式に置き換えたりして解きます。',
    definition: '複数の方程式をひとまとまりにして考えるものを連立方程式といい、すべてを同時に満たす未知数の値の組を解といいます。',
    explanation: ['加減法では、式どうしを足したり引いたりして一つの未知数を消します。係数をそろえるために、式全体を何倍かすることもあります。', '二元一次方程式を直線として見ると、連立方程式の解は共通する点です。解が一つの場合だけでなく、解なしや無数の解の場合もあります。'],
    formula: '\\begin{cases}x+y=11\\\\x-y=3\\end{cases}', formulaSpeech: 'エックスたすワイは十一、エックスひくワイは三。この二つを同時に満たす数を求めます。',
    example: { question: 'x+y=11、x−y=3を解きましょう。', steps: ['二つの式を足すと、2x=14です。', 'x=7を最初の式に入れると、7+y=11です。', 'y=4となり、二つの式の両方を満たします。'], answer: 'x=7、y=4です。' },
    pitfall: '一方の方程式だけを満たしても解ではありません。求めた値の組を両方の式で確かめます。', related: ['linear-equation', 'distributive-law'], sources: [S.systems]
  },
  {
    id: 'inequality', title: '不等式', reading: 'ふとうしき', category: 'algebra', level: '高校', tags: ['大小関係', '範囲'], aliases: ['一次不等式', '不等号'],
    short: '二つの数や式の大小関係を、不等号で表した式。',
    summary: '不等式は、ぴったり一つの値だけでなく、条件に合う数の範囲を表せます。負の数で両辺を掛けたり割ったりすると、不等号の向きが逆になります。',
    definition: '大小を表す<、>、≤、≥などで二つの数や式を結んだものを不等式といいます。未知数を含む不等式では、それを成り立たせる値の範囲を求めます。',
    explanation: ['両辺に同じ数を足したり引いたりしても、不等号の向きは変わりません。正の数を掛けたり割ったりする場合も同じです。', '負の数を掛ける操作は数直線の向きを反転させるため、不等号を逆向きにします。≤は等しい場合も含み、<は含みません。'],
    formula: 'a<b\\quad\\Longrightarrow\\quad -a>-b', formulaSpeech: 'エーがビーより小さいなら、マイナスエーはマイナスビーより大きくなります。',
    example: { question: '−3x+2≤11を解きましょう。', steps: ['両辺から2を引き、−3x≤9にします。', '両辺をマイナス3で割り、不等号を逆向きにします。'], answer: 'x≥−3です。' },
    pitfall: '文字式で両辺を割るとき、その式の正負や0になる可能性が不明なら、すぐに同じ操作をしてはいけません。', related: ['linear-equation', 'absolute-value'], sources: [S.inequalities]
  },
  {
    id: 'quadratic-equation', title: '二次方程式', reading: 'にじほうていしき', category: 'algebra', level: '中学校', tags: ['方程式', '2次式'], aliases: ['二次式', '2次方程式'],
    short: '整理すると、未知数の最高次数が2になる方程式。',
    summary: '二次方程式には、未知数を二乗した項が含まれます。因数分解や解の公式を使うと、条件を満たす数を求められます。',
    definition: 'ax²+bx+c=0という形に整理できる方程式を二次方程式といいます。a、b、cは定数で、aは0ではありません。',
    explanation: ['因数分解して積が0の形になれば、少なくとも一つの因数が0です。この性質を使って、それぞれの一次方程式を解きます。', '実数の範囲では、異なる解が二つ、重なった解が一つ、実数解なしのいずれかです。条件は判別式で調べられます。'],
    formula: 'ax^2+bx+c=0\\quad(a\\ne0)', formulaSpeech: 'エーエックスの二乗、たす、ビーエックス、たす、シーはゼロ。エーはゼロではありません。',
    example: { question: 'x²−5x+6=0を解きましょう。', steps: ['左辺を(x−2)(x−3)と因数分解します。', '積が0なので、x−2=0またはx−3=0です。'], answer: 'x=2、3です。' },
    pitfall: 'x²=9の解を3だけにしてはいけません。マイナス3も二乗すると9になります。', related: ['quadratic-formula', 'factorization', 'discriminant', 'quadratic-function'], sources: [S.quadratic]
  },
  {
    id: 'quadratic-formula', title: '解の公式', reading: 'かいのこうしき', category: 'algebra', level: '中学校', tags: ['二次方程式', '平方根'], aliases: ['二次方程式の解の公式'],
    short: '二次方程式の解を、係数から直接求める公式。',
    summary: '解の公式は、二次方程式を係数だけで解くための道具です。まず右辺をゼロにそろえ、二乗の係数、一次の係数、定数項を正しく入れます。',
    definition: 'ax²+bx+c=0、a≠0の解は、x=(−b±√(b²−4ac))/(2a)で与えられます。実数の解を求めるときは、根号の中が0以上である必要があります。',
    explanation: ['±はプラスの場合とマイナスの場合を表します。根号の中が0なら二つの結果が一致して重解になります。', 'この公式は平方完成から導けます。整数で簡単に因数分解できない方程式にも使えるのが利点です。'],
    formula: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}\\quad(a\\ne0)', formulaSpeech: 'エックスは、二エー分の、マイナスビー、プラスマイナス、ルート、ビーの二乗ひく四エーシー、です。エーはゼロではありません。',
    example: { question: 'x²−2x−2=0を解きましょう。', steps: ['a=1、b=−2、c=−2です。', '公式に入れると、xは2分の、2プラスマイナスルート12です。', 'ルート12を2ルート3に直して約分します。'], answer: 'x=1±√3です。' },
    pitfall: '分母の2aは、分子全体を割ります。根号の部分だけ、または−bだけを割るのではありません。', related: ['quadratic-equation', 'discriminant', 'completing-square'], sources: [S.quadraticFormula]
  },
  {
    id: 'discriminant', title: '判別式', reading: 'はんべつしき', category: 'algebra', level: '高校', tags: ['二次方程式', '実数解'], aliases: ['D', '重解'],
    short: '二次方程式の実数解の個数を判断する式。',
    summary: '判別式は、二次方程式に実数の解が何個あるかを教えてくれます。正なら異なる二つ、ゼロなら重なった一つ、負なら実数の解はありません。',
    definition: '実数係数の二次方程式ax²+bx+c=0、a≠0について、D=b²−4acを判別式といいます。解の公式の根号の中に当たる部分です。',
    explanation: ['D>0では平方根に正負の違いが生まれ、異なる二つの実数解があります。D=0では二つの式が同じ値になり、重解になります。', 'D<0では実数解がありません。複素数まで範囲を広げれば、異なる二つの非実数の解があります。'],
    formula: 'D=b^2-4ac', formulaSpeech: 'ディーは、ビーの二乗ひく四エーシーです。',
    example: { question: '2x²−4x+2=0の実数解はいくつですか。', steps: ['a=2、b=−4、c=2を判別式に入れます。', 'Dは16−16で0になります。'], answer: '重解をもち、実数の値としては一つです。解はx=1です。' },
    pitfall: 'D<0を「どの数の範囲でも解がない」と言い切ってはいけません。ここで判定しているのは実数解です。', related: ['quadratic-formula', 'quadratic-function', 'quadratic-equation'], sources: [S.quadraticFormula]
  },
  {
    id: 'completing-square', title: '平方完成', reading: 'へいほうかんせい', category: 'algebra', level: '高校', tags: ['二次関数', '式変形'], aliases: ['平方の形'],
    short: '二次式を「文字を含む式の2乗」と定数の形にすること。',
    summary: '平方完成は、二次式の中に二乗のまとまりを作る計算です。グラフの頂点や、式の最大値・最小値が見つけやすくなります。',
    definition: '二次式ax²+bx+cをa(x−p)²+qという形に変形することを平方完成といいます。ただしa≠0です。',
    explanation: ['x²+bxの部分では、xにbの半分を足したものを2乗します。そのままでは定数が増えるので、増えた分を引いてつり合わせます。', 'x²の係数が1でない場合は、まずxを含む部分からその係数をくくり出すと見通しがよくなります。'],
    formula: 'x^2+bx+c=\\left(x+\\frac b2\\right)^2+c-\\frac{b^2}{4}', formulaSpeech: 'エックスの二乗たすビーエックスたすシーは、エックスたすビーの半分の二乗、たすシー、ひくビーの二乗の四分の一です。',
    example: { question: 'x²−6x+5を平方完成しましょう。', steps: ['x²−6xは、(x−3)²−9と書けます。', '残りの5を足し、−9+5をまとめます。'], answer: '(x−3)²−4です。' },
    pitfall: '二乗を作るために足した定数は、その分だけ引いて補います。式の値が変わらないようにしましょう。', related: ['quadratic-function', 'quadratic-formula', 'expansion'], sources: [S.completing]
  },
  {
    id: 'exponent-law', title: '指数法則', reading: 'しすうほうそく', category: 'algebra', level: '高校', tags: ['累乗', '指数'], aliases: ['累乗', 'べき乗', '整数指数'],
    short: '同じ底の累乗を掛けたり割ったりするときの計算法則。',
    summary: '指数は、同じ数を何回掛けるかをまとめた記号です。同じ底の累乗の掛け算では、掛ける回数がつながるので、指数を足します。',
    definition: '0でない数aと整数m、nについて、a^m a^n=a^(m+n)、(a^m)^n=a^(mn)などが成り立ちます。a^0=1、a^(−n)=1/a^nと定めます。',
    explanation: ['a³a²は、aを3個掛けたものに、さらに2個掛けるのでa⁵になります。同じ底であることが条件です。', '負の指数は負の値を意味せず、逆数を意味します。例えば2のマイナス3乗は8分の1です。'],
    formula: 'a^m a^n=a^{m+n},\\quad (a^m)^n=a^{mn}\\quad(a\\ne0)', formulaSpeech: 'エーのエム乗掛けるエーのエヌ乗は、エーのエムたすエヌ乗です。エーのエム乗をさらにエヌ乗すると、エーのエム掛けるエヌ乗です。',
    example: { question: '3⁴÷3²を計算しましょう。', steps: ['同じ底の割り算なので、指数を4−2にします。', '3²を計算します。'], answer: '9です。' },
    pitfall: 'a^m+a^nのような足し算で、指数を足してはいけません。指数を足す法則は同じ底の掛け算に使います。', related: ['expansion', 'square-root', 'prime-factorization'], sources: [S.exponents]
  },
  {
    id: 'identity', title: '恒等式', reading: 'こうとうしき', category: 'algebra', level: '高校', tags: ['等式', '係数比較'], aliases: ['係数比較'],
    short: '文字に許されるどの値を入れても成り立つ等式。',
    summary: '恒等式は、たまたま一つの値で合う式ではありません。文字にどんな許される値を入れても、左右が同じになる式です。',
    definition: '定義される範囲内のすべての値について成り立つ等式を恒等式といいます。例えば(x+1)²=x²+2x+1は実数xについての恒等式です。',
    explanation: ['方程式は条件を満たす文字の値を探しますが、恒等式は式として常に同じ値であることを表します。', '二つの多項式がすべての実数xで等しいなら、同じ次数の項の係数はそれぞれ等しくなります。これを係数比較といいます。'],
    formula: '(x+1)^2=x^2+2x+1', formulaSpeech: 'エックスたす一の二乗は、エックスの二乗たす二エックスたす一に、いつも等しくなります。',
    example: { question: 'ax+b=3x−5がすべての実数xで成り立つとき、aとbを求めましょう。', steps: ['xの係数を比べると、a=3です。', '定数項を比べると、b=−5です。'], answer: 'a=3、b=−5です。' },
    pitfall: 'いくつかの値を代入して成り立っても、それだけで恒等式と証明できるとは限りません。式変形などで全体を確かめます。', related: ['expansion', 'algebraic-expression', 'linear-equation'], sources: [S.equations, S.specialProducts]
  },
  {
    id: 'triangle-angles', title: '三角形の内角', reading: 'さんかくけいのないかく', category: 'geometry', level: '小学校', tags: ['角度', '三角形'], aliases: ['内角の和', '三角形の角'],
    short: '平面上の三角形の三つの内角を足すと180度。',
    summary: '三角形の内側にある三つの角は、足すと百八十度になります。二つの角が分かれば、残りの角を引き算で求められます。',
    definition: 'ユークリッド平面上の三角形では、三つの内角の和は180度です。直角三角形では一つが90度なので、残り二つの和は90度です。',
    explanation: ['一つの頂点を通り、向かい側の辺に平行な直線を引くと、錯角・同位角を使って三つの角を一直線上に並べて考えられます。', '一つの外角は、それと隣り合わない二つの内角の和に等しくなります。内角とその外角の和が180度であることから分かります。'],
    formula: 'A+B+C=180^\\circ', formulaSpeech: '三角形の角エー、ビー、シーを足すと百八十度です。',
    example: { question: '二つの内角が48度と67度の三角形で、残りの角は何度ですか。', steps: ['分かっている角の和は48+67で115度です。', '180度から115度を引きます。'], answer: '65度です。' },
    pitfall: 'ここでの180度は平面上の三角形の性質です。また、外角をそのまま内角として足さないようにしましょう。', related: ['polygon-angles', 'congruence', 'pythagorean-theorem'], sources: [S.triangles]
  },
  {
    id: 'area-triangle', title: '三角形の面積', reading: 'さんかくけいのめんせき', category: 'geometry', level: '小学校', tags: ['面積', '高さ'], aliases: ['底辺かける高さ割る2'],
    short: '底辺と、それに垂直な高さの積の半分。',
    summary: '三角形の面積は、底辺掛ける高さを二で割ると求まります。高さは斜めの辺の長さではなく、底辺までまっすぐ垂直に測った長さです。',
    definition: '底辺の長さをb、その底辺を含む直線に対する高さをhとすると、三角形の面積Sはbh/2です。どの辺を底辺に選んでも求められます。',
    explanation: ['同じ三角形を二つ組み合わせると、同じ底辺と高さの平行四辺形を作れます。面積がその半分になるのが公式の理由です。', '鈍角三角形では、高さを下ろす位置が底辺の延長上になることがあります。それでも垂直な距離を使います。'],
    formula: 'S=\\frac12bh', formulaSpeech: '面積エスは、底辺ビー掛ける高さエイチの二分の一です。',
    example: { question: '底辺が9センチメートル、高さが4センチメートルの三角形の面積は。', steps: ['底辺と高さを掛けて、9×4=36です。', '2で割ります。'], answer: '18平方センチメートルです。' },
    pitfall: '底辺と高さは直角の関係で組み合わせます。別の辺に対する高さを使わないようにしましょう。', related: ['parallelogram', 'trapezoid', 'similarity'], sources: [S.areas]
  },
  {
    id: 'rectangle', title: '長方形', reading: 'ちょうほうけい', category: 'geometry', level: '小学校', tags: ['四角形', '面積', '周長'], aliases: ['長方形の面積', '長方形の周'],
    short: '四つの角がすべて直角の四角形。',
    summary: '長方形は、四つの角がすべて直角の形です。縦と横を掛けると面積、縦と横の和を二倍すると周の長さになります。',
    definition: '四つの内角がすべて90度である四角形を長方形といいます。向かい合う辺は平行で長さが等しく、正方形も長方形の一種です。',
    explanation: ['縦a、横bの長方形には、単位正方形がa×b個分入ると考えられるため、面積はabです。', '二本の対角線の長さは等しく、互いの中点で交わります。ただし、一般の長方形で対角線が直角に交わるとは限りません。'],
    formula: 'S=ab,\\qquad P=2(a+b)', formulaSpeech: '面積エスはエー掛けるビー。周の長さピーは、エーたすビーの二倍です。',
    example: { question: '縦5センチメートル、横8センチメートルの長方形の面積と周の長さは。', steps: ['面積は5×8です。', '周の長さは2×(5+8)です。'], answer: '面積は40平方センチメートル、周は26センチメートルです。' },
    pitfall: '面積と周の長さでは単位が違います。面積には平方センチメートルなどの単位を使います。', related: ['parallelogram', 'area-triangle', 'pythagorean-theorem'], sources: [S.areas]
  },
  {
    id: 'parallelogram', title: '平行四辺形', reading: 'へいこうしへんけい', category: 'geometry', level: '中学校', tags: ['四角形', '面積'], aliases: ['平行四辺形の面積'],
    short: '向かい合う二組の辺が、それぞれ平行な四角形。',
    summary: '平行四辺形は、向かい合う辺が二組とも平行な形です。斜めに傾いていても、底辺掛ける垂直な高さで面積を求められます。',
    definition: '対辺が二組とも平行な四角形を平行四辺形といいます。対辺の長さと対角の大きさはそれぞれ等しく、対角線は互いの中点で交わります。',
    explanation: ['端の三角形を切り取って反対側に移すと、同じ底辺と高さの長方形に変形できます。このため面積は底辺と高さの積です。', '長方形、ひし形、正方形は、いずれも平行四辺形の条件を満たす特別な場合です。'],
    formula: 'S=bh', formulaSpeech: '平行四辺形の面積は、底辺ビー掛ける垂直な高さエイチです。',
    example: { question: '底辺7センチメートル、高さ3センチメートルの平行四辺形の面積は。', steps: ['底辺に対して垂直な高さが3センチメートルであることを確認します。', '7と3を掛けます。'], answer: '21平方センチメートルです。' },
    pitfall: '斜めの辺を高さとして掛けないようにしましょう。底辺と垂直な距離を使います。', related: ['rectangle', 'area-triangle', 'trapezoid'], sources: [S.parallelogram]
  },
  {
    id: 'trapezoid', title: '台形の面積', reading: 'だいけいのめんせき', category: 'geometry', level: '小学校', tags: ['四角形', '面積'], aliases: ['台形', '上底', '下底'],
    short: '平行な二辺の長さの平均に、高さを掛ける。',
    summary: '台形の面積は、上底と下底を足し、高さを掛けて二で割ります。高さは、平行な二辺の間を垂直に測った長さです。',
    definition: '平行な二辺の長さをa、b、その間の垂直な距離をhとすると、台形の面積Sは(a+b)h/2です。ここでは平行な一組の辺を持つ四角形について考えます。',
    explanation: ['同じ台形を二つ並べると、底辺が上底と下底の和、高さが元の台形と同じ平行四辺形になります。元の台形はその半分の面積です。', '上底と下底は、図の上か下かという見た目よりも、平行な二辺であることが重要です。'],
    formula: 'S=\\frac{(a+b)h}{2}', formulaSpeech: '台形の面積は、上底エーと下底ビーの和に、高さエイチを掛けて、二で割ります。',
    example: { question: '上底4センチメートル、下底10センチメートル、高さ5センチメートルの台形の面積は。', steps: ['上底と下底を足すと14です。', '14に5を掛けて2で割ります。'], answer: '35平方センチメートルです。' },
    pitfall: '平行でない二辺を上底・下底として選ぶことはできません。まず平行な辺を確認します。', related: ['parallelogram', 'area-triangle'], sources: [S.areas]
  },
  {
    id: 'area-circle', title: '円の面積', reading: 'えんのめんせき', category: 'geometry', level: '小学校', tags: ['円', '円周率', '面積'], aliases: ['半径かける半径かける円周率'],
    short: '半径の2乗に円周率を掛けた、円の内側の広さ。',
    summary: '円の面積は、半径掛ける半径掛ける円周率で求められます。半径が二倍になると、面積は四倍になります。',
    definition: '半径rの円で囲まれた領域の面積Sはπr²です。πは円周率を表し、約3.14159ですが、問題の指定がない限りπのまま表せます。',
    explanation: ['円を細かな扇形に分けて交互に並べると、半径を高さ、円周の半分を底辺とする長方形に近づきます。その積がπr²です。', '直径が与えられているときは、まず2で割って半径に直します。長さの単位がセンチメートルなら、面積は平方センチメートルです。'],
    formula: 'S=\\pi r^2', formulaSpeech: '円の面積エスは、円周率パイ掛ける半径アールの二乗です。',
    example: { question: '直径12センチメートルの円の面積を、πを使って表しましょう。', steps: ['半径は12割る2で6センチメートルです。', '半径を2乗してπを掛けます。'], answer: '36π平方センチメートルです。' },
    pitfall: '公式に入れるのは半径です。直径をそのまま2乗すると、面積を4倍に数えてしまいます。', related: ['circumference', 'sector', 'volume-cylinder'], sources: [S.circle]
  },
  {
    id: 'circumference', title: '円周', reading: 'えんしゅう', category: 'geometry', level: '小学校', tags: ['円', '円周率', '長さ'], aliases: ['円周の長さ', '円周率', 'π', 'パイ'],
    short: '円の周りを一周した長さで、直径のπ倍。',
    summary: '円周は、円のふちを一周した長さです。どんな大きさの円でも、円周を直径で割った値は同じで、これを円周率と呼びます。',
    definition: '半径r、直径dの円の円周Lは2πr、またはπdです。円周率πは円周と直径の比であり、単位を持たない定数です。',
    explanation: ['円周は長さなので、センチメートルやメートルで表します。円の内側の広さを表す面積とは、公式も単位も異なります。', '半径をk倍にすると円周もk倍になります。一方で面積はk²倍になるため、増え方が異なります。'],
    formula: 'L=2\\pi r=\\pi d', formulaSpeech: '円周の長さエルは、二掛けるパイ掛ける半径アール、つまりパイ掛ける直径ディーです。',
    example: { question: '半径4センチメートルの円の円周を、πを使って表しましょう。', steps: ['直径は半径の2倍なので8センチメートルです。', '直径にπを掛けます。'], answer: '8πセンチメートルです。' },
    pitfall: '円周の公式2πrと面積の公式πr²を混同しないように、求めるものが長さか広さかを確認します。', related: ['area-circle', 'sector', 'ratio'], sources: [S.circle]
  },
  {
    id: 'sector', title: '扇形', reading: 'おうぎがた', category: 'geometry', level: '中学校', tags: ['円', '中心角', '弧'], aliases: ['扇形の面積', '弧の長さ', '中心角'],
    short: '二本の半径と、その間の弧で囲まれた円の一部分。',
    summary: '扇形は、円を中心から切り分けた形です。中心角が一周の何分のいくつかを考えると、面積も弧の長さも同じ割合で求められます。',
    definition: '半径r、中心角θ度の扇形では、面積Sはπr²×θ/360、弧の長さℓは2πr×θ/360です。θは度数法で表した角度とします。',
    explanation: ['中心角90度なら一周360度の4分の1なので、面積も円全体の4分の1、弧の長さも円周の4分の1です。', '扇形の周の長さを求める場合は、弧の長さだけでなく、二本の半径の長さも加えます。'],
    formula: 'S=\\pi r^2\\frac{\\theta}{360},\\quad \\ell=2\\pi r\\frac{\\theta}{360}\\quad(\\theta:\\text{度})', formulaSpeech: '面積はパイアールの二乗に、三百六十分の中心角を掛けます。弧の長さは二パイアールに同じ割合を掛けます。中心角は度で表します。',
    example: { question: '半径6センチメートル、中心角60度の扇形の面積は。', steps: ['60度は360度の6分の1です。', '円全体の面積36πを6で割ります。'], answer: '6π平方センチメートルです。' },
    pitfall: '角度をラジアンで表している場合には、この360で割る式をそのまま使えません。角度の単位を確認します。', related: ['area-circle', 'circumference', 'ratio'], sources: [S.sector]
  },
  {
    id: 'pythagorean-theorem', title: '三平方の定理', reading: 'さんへいほうのていり', category: 'geometry', level: '中学校', tags: ['直角三角形', '長さ'], aliases: ['ピタゴラスの定理', 'ピタゴラス'],
    short: '直角三角形で、斜辺の2乗は他の二辺の2乗の和に等しい。',
    summary: '三平方の定理は、直角三角形の三辺を結び付けるルールです。一番長い斜辺の二乗が、残り二辺の二乗を足したものになります。',
    definition: '直角三角形の直角を挟む二辺をa、b、直角の向かいにある斜辺をcとすると、a²+b²=c²が成り立ちます。ピタゴラスの定理とも呼ばれます。',
    explanation: ['二辺の長さが分かれば、残り一辺の2乗を計算し、最後に正の平方根を取って長さを求められます。', '逆も成り立ちます。三角形の最長辺をcとしてa²+b²=c²を満たすなら、その三角形は直角三角形です。'],
    formula: 'a^2+b^2=c^2', formulaSpeech: 'エーの二乗たすビーの二乗は、斜辺シーの二乗に等しくなります。',
    example: { question: '直角を挟む二辺が5センチメートルと12センチメートルのとき、斜辺は何センチメートルですか。', steps: ['斜辺の2乗は5²+12²で、25+144=169です。', '長さは正なので、169の正の平方根を取ります。'], answer: '13センチメートルです。' },
    pitfall: '直角でない三角形には、この形の式をそのまま使えません。斜辺は必ず直角の向かいの辺です。', related: ['square-root', 'triangle-angles', 'rectangle'], sources: [S.triangles]
  },
  {
    id: 'similarity', title: '相似', reading: 'そうじ', category: 'geometry', level: '中学校', tags: ['図形', '拡大縮小', '比'], aliases: ['相似比', '面積比'],
    short: '一方を同じ倍率で拡大・縮小すると、もう一方に重なる関係。',
    summary: '相似な図形は、大きさが違っても形が同じです。対応する長さの比が同じで、対応する角の大きさは変わりません。',
    definition: '一方の図形を一様に拡大または縮小し、移動・回転・裏返しをすると他方と重ねられるとき、二つの図形は相似であるといいます。',
    explanation: ['対応する辺の長さの比を相似比といいます。長さがk倍になると、平面図形の面積はk²倍、相似な立体の体積はk³倍になります。', '三角形は、二組の角がそれぞれ等しい場合などに相似と判断できます。対応する頂点をそろえて比を立てることが大切です。'],
    formula: '\\text{長さの比 }1:k\\quad\\Rightarrow\\quad\\text{面積の比 }1:k^2', formulaSpeech: '相似な図形で長さの比が一対ケーなら、面積の比は一対ケーの二乗です。',
    example: { question: '相似比が2対5の二つの三角形で、小さい方の面積が12平方センチメートルです。大きい方の面積は。', steps: ['面積比は2²対5²、つまり4対25です。', '12を4で割って25を掛けます。'], answer: '75平方センチメートルです。' },
    pitfall: '面積比を相似比と同じにしないようにしましょう。面積では長さの倍率を2乗します。', related: ['ratio', 'congruence', 'area-triangle'], sources: [S.congruence, S.triangles]
  },
  {
    id: 'congruence', title: '合同', reading: 'ごうどう', category: 'geometry', level: '中学校', tags: ['図形', '証明'], aliases: ['合同条件', '三角形の合同'],
    short: '移動・回転・裏返しで、ぴったり重ねられる図形の関係。',
    summary: '合同な図形は、形も大きさも同じです。向きが違っていても、伸ばしたり縮めたりせずに重ねられれば合同です。',
    definition: '対応する点の距離を変えず、移動・回転・鏡映によって一方を他方へ重ねられるとき、二つの図形は合同といいます。',
    explanation: ['三角形では、三組の辺がそれぞれ等しい、二組の辺とその間の角がそれぞれ等しい、一組の辺とその両端の角がそれぞれ等しい、などが合同条件です。', '合同を表すときは、対応する頂点を同じ順に書きます。合同なら、対応する辺の長さと角の大きさがすべて等しくなります。'],
    formula: '\\triangle ABC\\cong\\triangle DEF', formulaSpeech: '三角形エービーシーと、三角形ディーイーエフは合同です。エーとディー、ビーとイー、シーとエフが対応します。',
    example: { question: '三辺が4、6、8センチメートルの三角形が二つあります。この二つは合同ですか。', steps: ['三組の対応する辺の長さがそれぞれ等しいことを確認します。', '三辺相等の合同条件を使います。'], answer: '二つの三角形は合同です。' },
    pitfall: '三つの角がそれぞれ等しいだけでは、三角形が合同とはいえません。大きさの違う相似な三角形もあり得ます。', related: ['similarity', 'triangle-angles'], sources: [S.congruence]
  },
  {
    id: 'polygon-angles', title: '多角形の内角の和', reading: 'たかくけいのないかくのわ', category: 'geometry', level: '中学校', tags: ['角度', '多角形'], aliases: ['多角形', '正多角形の内角'],
    short: 'n角形の内角の和は、180度のn−2倍。',
    summary: '多角形の角の合計は、三角形に分けて考えると分かります。五角形なら三つの三角形に分けられるので、合計は五百四十度です。',
    definition: '辺が交差しない平面上のn角形の内角の和は、(n−2)×180度です。nは3以上の整数で、へこんだ頂点では180度を超える内角を数えます。',
    explanation: ['凸多角形では、一つの頂点から対角線を引くと、n−2個の三角形に分けられます。その内角の和を合わせると公式になります。', '正n角形ではすべての内角が等しいので、内角の和をnで割ると一つの内角を求められます。'],
    formula: '\\text{内角の和}=(n-2)\\times180^\\circ', formulaSpeech: 'エヌ角形の内角の和は、エヌひく二、掛ける百八十度です。',
    example: { question: '正六角形の一つの内角は何度ですか。', steps: ['六角形の内角の和は、(6−2)×180で720度です。', '正六角形では六つの角が等しいので、720を6で割ります。'], answer: '120度です。' },
    pitfall: '内角の和を辺の数で割れるのは、各角が等しい場合です。一般の多角形で一つの角が分かるわけではありません。', related: ['triangle-angles', 'congruence'], sources: [S.polygons]
  },
  {
    id: 'volume-cylinder', title: '円柱の体積', reading: 'えんちゅうのたいせき', category: 'geometry', level: '小学校', tags: ['立体', '体積', '円柱'], aliases: ['円柱', '底面積かける高さ'],
    short: '円の底面積に、底面どうしの垂直な高さを掛ける。',
    summary: '円柱は、同じ大きさの円を高さの分だけ積み重ねた形です。底面の円の面積に高さを掛けると、体積を求められます。',
    definition: '底面の半径がr、高さがhの円柱の体積Vはπr²hです。高さは二つの底面を含む平行な平面の間の垂直な距離です。',
    explanation: ['まず底面の面積πr²を求め、その面積が高さ方向にどれだけ続くかを掛け合わせます。', '体積の単位は立方センチメートルなどです。底面の半径と高さは、同じ長さの単位にそろえてから計算します。'],
    formula: 'V=\\pi r^2h', formulaSpeech: '円柱の体積ブイは、パイ掛ける半径アールの二乗掛ける高さエイチです。',
    example: { question: '底面の半径が3センチメートル、高さが8センチメートルの円柱の体積は。', steps: ['底面積はπ×3²で9π平方センチメートルです。', '高さ8センチメートルを掛けます。'], answer: '72π立方センチメートルです。' },
    pitfall: '表面積と体積を混同しないようにしましょう。底面積と側面積を足すのは、表面の広さを求める計算です。', related: ['area-circle', 'sphere', 'similarity'], sources: [S.solids]
  },
  {
    id: 'sphere', title: '球の体積と表面積', reading: 'きゅうのたいせきとひょうめんせき', category: 'geometry', level: '中学校', tags: ['立体', '球', '体積', '表面積'], aliases: ['球', '球の体積', '球の表面積'],
    short: '球の体積は半径の3乗、表面積は半径の2乗に比例する。',
    summary: '球は、中心から表面までの距離がどこでも同じ立体です。半径を二倍にすると、表面積は四倍、体積は八倍になります。',
    definition: '半径rの球の体積Vは(4/3)πr³、表面積Sは4πr²です。球面は中心から距離rにある点の集まりで、体積はその内側の空間の大きさです。',
    explanation: ['表面積は、同じ半径を持つ円の面積の4倍です。体積では半径を3回掛けるため、半径の変化の影響がさらに大きくなります。', '直径が分かっている場合は、半分にしてから公式へ入れます。体積と表面積は単位も異なります。'],
    formula: 'V=\\frac43\\pi r^3,\\qquad S=4\\pi r^2', formulaSpeech: '球の体積は、三分の四掛けるパイ掛ける半径の三乗。表面積は、四掛けるパイ掛ける半径の二乗です。',
    example: { question: '半径3センチメートルの球の体積と表面積を求めましょう。', steps: ['体積は3分の4×π×27です。', '表面積は4×π×9です。'], answer: '体積は36π立方センチメートル、表面積は36π平方センチメートルです。' },
    pitfall: 'この例では数の部分が同じですが、体積と表面積は別の量です。数値だけで同じものと考えないようにしましょう。', related: ['volume-cylinder', 'area-circle', 'similarity'], sources: [S.solids]
  }
];
