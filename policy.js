/* 처분 정책 시뮬레이터 — 계산 모델 (화면 없음, 브라우저와 node 공용)
 *
 * 모든 값은 시연용 가상 데이터(lifecycle.json) 위에서 계산하며 실적이 아니다.
 * 반응 가정(할인율 → 판매 배율)과 남은 재고 처리 손실률은 전부 가정이고 화면에서 조정한다.
 *
 * 흐름
 *  1) 기본 수요 역산: 실제 판매 ÷ 반응 가정 배율(그 주 실제 할인율).
 *     [품절 주 보정] 재고가 0이거나 재고 자료가 없는 주는 판매가 잘린 주이므로 역산에서 뺀다.
 *     뺀 주의 기본 수요는 양옆에서 가장 가까운 정상 주 K(=2)개씩의 역산값 평균으로 메운다.
 *     실제 소진 뒤처럼 한쪽에만 정상 주가 있으면 그쪽 K개만 쓴다. 정상 주가 하나도 없는 상품은 대상에서 뺀다.
 *  2) 발주종료 주부터 정책 규칙대로 할인을 적용하고, 재고가 허락하는 만큼만 판다(판매 = min(재고, 기본 수요 × 배율)).
 *  3) 손실 = 할인액(판매가 × 할인율 × 판매량) + 남은 재고 원가 × 처리 손실률. 실제 경과에도 같은 식을 쓴다.
 *     같은 식이므로 의미가 있는 것은 절대 금액이 아니라 실제와 정책의 차이다.
 */
(function (root) {
  "use strict";
  var K = 2;            // 품절 주 보정: 양옆 정상 주 몇 개씩 평균낼지
  var TRAIL = 4;        // 재고 주수·배수 계산에 쓰는 직전 판매 주 수
  var EPS = 0.05;       // 주평균 판매 0 나눗셈 방지(주 0.05개)
  var TOL = 4;          // 예외 리포트: 정책 판정 뒤 실제 첫 할인까지 이 주 수를 넘으면 "늦은 할인"

  var DEFAULT_POLICY = { X: 12, d1: 20, N: 4, Y: 1.3, d2: 40, Z: 20 };
  var DEFAULT_ASSUME = { r30: 1.3, r50: 1.6, loss: 60 };
  var RANGES = {
    X:   { min: 4,   max: 30,  step: 1,   unit: "주",  label: "1단계 진입: 남은 재고 주수 초과" },
    d1:  { min: 5,   max: 50,  step: 5,   unit: "%",   label: "1단계 할인율" },
    N:   { min: 2,   max: 8,   step: 1,   unit: "주",  label: "1단계 관찰 기간" },
    Y:   { min: 1.0, max: 2.5, step: 0.1, unit: "배",  label: "2단계 진입: 배수 미만" },
    d2:  { min: 20,  max: 70,  step: 5,   unit: "%",   label: "2단계 할인율" },
    Z:   { min: 6,   max: 40,  step: 2,   unit: "주",  label: "종료 심사: 1단계 뒤 미소진 기한" },
    r30: { min: 1.0, max: 2.5, step: 0.1, unit: "배",  label: "할인 30%일 때 판매 배율", assume: true },
    r50: { min: 1.0, max: 3.0, step: 0.1, unit: "배",  label: "할인 50%일 때 판매 배율", assume: true },
    loss:{ min: 0,   max: 100, step: 10,  unit: "%",   label: "남은 재고 처리 손실률(원가 대비)", assume: true }
  };

  // 반응 가정: (0%,1배) · (30%,r30) · (50%,r50)을 직선으로 잇고, 50% 위는 30~50% 기울기를 이어 간다. 1배 아래로는 내려가지 않는다.
  function lift(d, A) {
    if (!d) return 1;
    var v = d <= 30 ? 1 + (A.r30 - 1) * d / 30 : A.r30 + (A.r50 - A.r30) * (d - 30) / 20;
    return Math.max(1, v);
  }
  function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  // 1) 기본 수요 역산 + 품절 주 보정
  function baseDemand(d, A) {
    var n = d.weeks.length, raw = new Array(n), cens = new Array(n), base = new Array(n), valid = [];
    for (var t = 0; t < n; t++) {
      var st = d.stock[t], s = d.sale[t];
      cens[t] = st == null || st <= 0 || s == null;          // 재고 0 또는 자료 없음 → 판매가 잘린 주
      raw[t] = cens[t] ? null : s / lift(d.disc[t] || 0, A);
      if (!cens[t]) valid.push(t);
    }
    if (!valid.length) return null;
    for (t = 0; t < n; t++) {
      if (!cens[t]) { base[t] = raw[t]; continue; }
      var L = [], R = [];
      for (var i = t - 1; i >= 0 && L.length < K; i--) if (!cens[i]) L.push(raw[i]);
      for (i = t + 1; i < n && R.length < K; i++) if (!cens[i]) R.push(raw[i]);
      base[t] = mean(L.concat(R));
    }
    return { base: base, cens: cens };
  }

  function prepItem(d, A) {
    var n = d.weeks.length, t0 = d.eo ? d.weeks.indexOf(d.eo) : -1;
    var out = { d: d, n: n, t0: t0, scope: false, why: "" };
    if (t0 < 0) { out.why = "발주 중(발주종료 전)"; return out; }
    var bd = baseDemand(d, A);
    if (!bd) { out.why = "정상 주 없음"; return out; }
    var post = 0; for (var t = t0; t < n; t++) if (!bd.cens[t]) post++;
    if (!post) { out.why = "발주종료 뒤 정상 주 없음"; return out; }
    var inflow = new Array(n).fill(0);
    for (t = 1; t < n; t++) if (d.stock[t] != null && d.stock[t - 1] != null && d.sale[t] != null)
      inflow[t] = Math.max(0, d.stock[t] - d.stock[t - 1] + d.sale[t]);
    var s0 = t0 > 0 && d.stock[t0 - 1] != null ? d.stock[t0 - 1] : (d.stock[t0] || 0) + (d.sale[t0] || 0) - inflow[t0];
    out.scope = true; out.base = bd.base; out.cens = bd.cens; out.inflow = inflow; out.s0 = Math.max(0, s0);
    return out;
  }

  function lastStock(d) { for (var t = d.weeks.length - 1; t >= 0; t--) if (d.stock[t] != null) return d.stock[t]; return 0; }

  // 2) 정책 적용. sched가 있으면 그 할인 일정을 그대로 재생(검사용).
  function simulate(it, P, A, sched) {
    var d = it.d, n = it.n, t0 = it.t0, S = it.s0;
    var sale = d.sale.map(function (v, t) { return t < t0 ? (v || 0) : 0; });
    var stock = d.stock.map(function (v, t) { return t < t0 ? v : null; });
    var disc = new Array(n).fill(0), stage = new Array(n).fill(0);
    var stg = 0, s1 = -1, s2 = -1, term = -1, termStock = 0, sold = -1, mult = null;
    for (var t = t0; t < n; t++) {
      if (term >= 0 || sold >= 0) { stock[t] = 0; stage[t] = term >= 0 ? 3 : stage[t - 1]; continue; }
      if (!sched) {
        var tr = sale.slice(Math.max(0, t - TRAIL), t);
        if (stg === 0 && tr.length === TRAIL && S / Math.max(mean(tr), EPS) > P.X) { stg = 1; s1 = t; }
        if (stg === 1 && t === s1 + P.N) {
          var on = mean(sale.slice(s1, t)), pre = mean(sale.slice(Math.max(0, s1 - TRAIL), s1));
          mult = on / Math.max(pre, EPS);
          if (mult < P.Y) { stg = 2; s2 = t; }
        }
        if (stg >= 1 && t === s1 + P.Z && S > 0) { term = t; termStock = S; S = 0; stock[t] = 0; stage[t] = 3; continue; }
      }
      var dc = sched ? (sched[t] || 0) : (stg === 1 ? P.d1 : stg === 2 ? P.d2 : 0);
      S += it.inflow[t];
      var q = Math.min(S, it.base[t] * lift(dc, A));
      S -= q;
      sale[t] = q; stock[t] = S; disc[t] = dc; stage[t] = sched ? (dc ? 1 : 0) : stg;
      if (S <= 1e-9 && sold < 0) { S = 0; stock[t] = 0; sold = t; }
    }
    var md = 0; for (t = t0; t < n; t++) md += sale[t] * d.price * disc[t] / 100;
    var end = term >= 0 ? 0 : S;
    var resid = (end + termStock) * d.cost * A.loss / 100;
    return { sale: sale, stock: stock, disc: disc, stage: stage, s1: s1, s2: s2, term: term, termStock: termStock, sold: sold, mult: mult,
             md: md, resid: resid, total: md + resid, end: end, clear: sold >= 0 ? sold : term };
  }

  // 실제 경과(가상 데이터상)에 같은 손실식
  function actual(it, A) {
    var d = it.d, n = it.n, t0 = it.t0, md = 0, sold = -1;
    for (var t = t0; t < n; t++) {
      md += (d.sale[t] || 0) * d.price * (d.disc[t] || 0) / 100;
      if (sold < 0 && d.stock[t] != null && d.stock[t] <= 0) sold = t;
    }
    var end = lastStock(d), resid = end * d.cost * A.loss / 100;
    return { md: md, resid: resid, total: md + resid, end: end, sold: sold, clear: sold };
  }

  // 행동 지연: 판정 시점 = 정책 1단계 조건(남은 재고 주수 > X)이 실제 경과에서 처음 충족된 주(실제 첫 할인 전까지만 본다)
  function delay(it, P) {
    var d = it.d, n = it.n, t0 = it.t0, act = -1, trig = -1, trigAny = -1;
    for (var t = t0; t < n; t++) if (d.disc[t]) { act = t; break; }
    for (t = Math.max(t0, TRAIL); t < n; t++) {
      var st = d.stock[t - 1]; if (st == null || st <= 0) continue;
      var tr = d.sale.slice(t - TRAIL, t).map(function (v) { return v || 0; });
      if (st / Math.max(mean(tr), EPS) > P.X) { trigAny = t; break; }
    }
    trig = trigAny >= 0 && (act < 0 || trigAny <= act) ? trigAny : -1;
    var lag = trig >= 0 ? (act >= 0 ? act - trig : n - 1 - trig) : null;
    return { act: act, trig: trig, trigAny: trigAny, lag: lag, open: trig >= 0 && act < 0 };
  }

  function runAll(items, P, A) {
    var rows = items.map(function (d) {
      var it = prepItem(d, A); if (!it.scope) return { d: d, it: it, scope: false };
      var p = simulate(it, P, A), a = actual(it, A), dl = delay(it, P), ex = [];
      if (dl.trig >= 0 && (dl.act < 0 || dl.lag > TOL)) ex.push("late");
      if (dl.act >= 0 && dl.trig < 0) ex.push("early");
      if (p.term >= 0 && !(a.sold >= 0 && a.sold <= p.term)) ex.push("term");
      return { d: d, it: it, scope: true, p: p, a: a, dl: dl, ex: ex };
    });
    var S = rows.filter(function (r) { return r.scope; });
    var hz = function (r, c) { return (c >= 0 ? c : r.it.n) - r.it.t0; };   // 정리까지 걸린 주(기간 안 미정리는 기간 끝으로 자름)
    var T = {
      n: S.length, out: rows.length - S.length,
      aTotal: sum(S.map(function (r) { return r.a.total; })), pTotal: sum(S.map(function (r) { return r.p.total; })),
      aMd: sum(S.map(function (r) { return r.a.md; })), pMd: sum(S.map(function (r) { return r.p.md; })),
      aEndWon: sum(S.map(function (r) { return r.a.end * r.d.cost; })), pEndWon: sum(S.map(function (r) { return r.p.end * r.d.cost; })),
      termWon: sum(S.map(function (r) { return r.p.termStock * r.d.cost; })), terms: S.filter(function (r) { return r.p.term >= 0; }).length,
      aClear: mean(S.map(function (r) { return hz(r, r.a.clear); })), pClear: mean(S.map(function (r) { return hz(r, r.p.clear); })),
      aCleared: S.filter(function (r) { return r.a.clear >= 0; }).length, pCleared: S.filter(function (r) { return r.p.clear >= 0; }).length,
      lagMean: mean(S.filter(function (r) { return r.dl.lag != null; }).map(function (r) { return r.dl.lag; })),
      lagN: S.filter(function (r) { return r.dl.lag != null; }).length
    };
    T.dTotal = T.pTotal - T.aTotal; T.dEndWon = T.pEndWon - T.aEndWon; T.dClear = T.pClear - T.aClear;
    return { rows: rows, T: T };
  }

  function sweep(items, P, A, key, vals) {
    return vals.map(function (v) {
      var P2 = Object.assign({}, P), A2 = Object.assign({}, A);
      if (RANGES[key].assume) A2[key] = v; else P2[key] = v;
      var T = runAll(items, P2, A2).T;
      return { v: v, dTotal: T.dTotal, dEndWon: T.dEndWon, dClear: T.dClear, terms: T.terms };
    });
  }
  function steps(key) { var r = RANGES[key], o = []; for (var v = r.min; v <= r.max + 1e-9; v += r.step) o.push(Math.round(v * 100) / 100); return o; }

  // 정책·가정 저장(브라우저 저장소가 막히면 기본값으로 동작)
  var KEY = "disp-policy:v1";
  function load() {
    try { var j = JSON.parse(root.localStorage.getItem(KEY)) || {}; return { P: Object.assign({}, DEFAULT_POLICY, j.P), A: Object.assign({}, DEFAULT_ASSUME, j.A) }; }
    catch (e) { return { P: Object.assign({}, DEFAULT_POLICY), A: Object.assign({}, DEFAULT_ASSUME) }; }
  }
  function save(P, A) { try { root.localStorage.setItem(KEY, JSON.stringify({ P: P, A: A })); return true; } catch (e) { return false; } }

  /* 설정값 없는 화면(한눈에 보기)용: 문장마다 가정 격자를 돌려 등급을 붙인다. 화면 문장은 전부 이 함수가 만든다(손으로 친 숫자 없음). */
  var GRID = { r30: [1.0, 1.3, 1.6, 2.0, 2.5], r50: [1.0, 1.6, 2.2, 3.0], loss: [0, 30, 60, 80, 100] };  // r50 >= r30 조합만 → 65개
  var FLAT = { dTotal: 50000, dClear: 0.5 };   // |v| < FLAT 이면 "차이 거의 없음"

  function tally() { return { neg: 0, pos: 0, flat: 0, min: Infinity, max: -Infinity }; }
  function addTo(t, v, f) {
    if (v <= -f) t.neg++; else if (v >= f) t.pos++; else t.flat++;
    if (v < t.min) t.min = v;
    if (v > t.max) t.max = v;
  }
  // 격자 전 조합의 실제 대비 차이를 모은다
  function robust(items, P) {
    var G = { n: 0, dClear: tally(), dTotal: tally() };
    GRID.r30.forEach(function (r30) {
      GRID.r50.forEach(function (r50) {
        if (r50 < r30) return;
        GRID.loss.forEach(function (loss) {
          var T = runAll(items, P, { r30: r30, r50: r50, loss: loss }).T;
          G.n++;
          addTo(G.dClear, T.dClear, FLAT.dClear);
          addTo(G.dTotal, T.dTotal, FLAT.dTotal);
        });
      });
    });
    return G;
  }
  function grade(t, n) {
    if (t.neg === n) return "same-neg";
    if (t.pos === n) return "same-pos";
    if (t.flat === n) return "flat";
    return "depends";
  }
  // 손익 부호가 바뀌는 지점(가정값 또는 정책값)을 찾는다. dir: 현재 값에서 어느 쪽으로 움직여야 뒤집히는지
  function flips(items, P, A, keys) {
    var out = [];
    keys.forEach(function (key) {
      // 정리 기한(Z)·관찰 기간(N)은 정수 주에서만 작동한다(simulate가 t === s1 + 값으로 비교). 보간하면 소수 값이 나와 판정이 안 되므로
      // 정수 격자에서 찾고, 부호가 처음 바뀐 정수 값을 쓴다.
      var disc = key === "Z" || key === "N", vals = [], r = RANGES[key];
      if (disc) for (var q = r.min; q <= r.max; q++) vals.push(q); else vals = steps(key);
      var s = sweep(items, P, A, key, vals);
      for (var i = 1; i < s.length; i++) {
        var a = s[i - 1].dTotal, b = s[i].dTotal;
        if ((a < 0) !== (b < 0) && a !== b) {
          var v = disc ? s[i].v : s[i - 1].v + (s[i].v - s[i - 1].v) * (0 - a) / (b - a);
          var cur = RANGES[key].assume ? A[key] : P[key];
          out.push({ k: key, v: v, cur: cur, dir: cur > v ? "down" : "up" });
          break;
        }
      }
    });
    return out;
  }
  var FLIP_LABEL = { loss: "남은 재고 처리 손실률", X: "할인 시작 기준(남은 재고 주수)", d1: "1단계 할인율", Z: "정리 기한",
                     Y: "2단계 진입 배수", d2: "2단계 할인율", N: "관찰 기간", r30: "할인 30%일 때 판매 배율", r50: "할인 50%일 때 판매 배율" };
  // 화면 문장 생성: T = 현재 설정의 결과, G = robust(), F = flips()
  function sentences(T, G, F) {
    var cg = grade(G.dClear, G.n), lg = grade(G.dTotal, G.n);
    var ct, cb, lt, lb;
    if (cg === "same-neg") {
      ct = "재고 정리가 평균 " + Math.round(-T.dClear) + "주 빨라집니다";
      cb = "어떤 가정에서도 같은 방향 · " + Math.round(-G.dClear.max) + "~" + Math.round(-G.dClear.min) + "주";
    } else if (cg === "same-pos") {
      ct = "재고 정리가 평균 " + Math.round(T.dClear) + "주 늦어집니다";
      cb = "어떤 가정에서도 같은 방향 · " + Math.round(G.dClear.min) + "~" + Math.round(G.dClear.max) + "주";
    } else if (cg === "flat") {
      ct = "재고 정리 속도는 거의 같습니다";
      cb = "어떤 가정에서도 차이 거의 없음";
    } else {
      ct = "재고 정리 속도는 가정에 따라 달라집니다";
      cb = G.n + "가지 가정 중 " + G.dClear.neg + "가지에서 빨라지고 " + G.dClear.pos + "가지에서 늦어짐";
    }
    if (lg === "same-neg") { lt = "손실이 줄어듭니다"; lb = "어떤 가정에서도 같은 방향"; }
    else if (lg === "same-pos") { lt = "손실이 늘어납니다"; lb = "어떤 가정에서도 같은 방향"; }
    else if (lg === "flat") { lt = "손실은 거의 같습니다"; lb = "어떤 가정에서도 차이 거의 없음"; }
    else { lt = "손실은 가정에 따라 달라집니다"; lb = G.n + "가지 가정 중 " + G.dTotal.neg + "가지에서 줄고 " + G.dTotal.pos + "가지에서 늘어남"; }
    return {
      clear: { grade: cg, text: ct, badge: cb },
      loss: { grade: lg, text: lt, badge: lb },
      flips: F.map(function (f) {
        var r = RANGES[f.k], vs = r.step < 1 ? f.v.toFixed(1) : String(Math.round(f.v));
        return { k: f.k, text: FLIP_LABEL[f.k] + " " + vs + r.unit + (f.dir === "down" ? " 미만" : " 초과"), assume: !!r.assume };
      })
    };
  }

  var API = { K: K, TRAIL: TRAIL, TOL: TOL, DEFAULT_POLICY: DEFAULT_POLICY, DEFAULT_ASSUME: DEFAULT_ASSUME, RANGES: RANGES,
              lift: lift, baseDemand: baseDemand, prepItem: prepItem, simulate: simulate, actual: actual, delay: delay,
              runAll: runAll, sweep: sweep, steps: steps, load: load, save: save,
              GRID: GRID, FLAT: FLAT, robust: robust, grade: grade, flips: flips, sentences: sentences, FLIP_LABEL: FLIP_LABEL };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.DispPolicy = API;
})(typeof window !== "undefined" ? window : globalThis);
