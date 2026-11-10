/* 재고 출처 모델 — 발주종료 때 남은 재고가 어느 입고에서 왔는지 (브라우저와 node 공용)
 *
 * 모든 값은 시연용 가상 데이터(lifecycle.json) 위의 추정이며 실적이 아니다. 기준값은 전부 가상 설정이다.
 *
 * 1) 입고 추정: 입고 = max(0, 이번 주 재고 − 지난주 재고 + 이번 주 판매)  (재고 보존식 역산)
 *    - 첫 주(출시 주 또는 데이터 시작 주)는 "그 전 재고 0"으로 보고 첫 주 재고 + 첫 주 판매를 입고로 본다.
 *      출시 주면 "초도", 데이터 시작 전에 출시된 상품이면 "시작 재고(출처 모름)".
 *    - 재고 자료가 없는(null) 주가 끼면 그 주와 다음 주의 입고를 계산할 수 없다. 억지로 메우지 않고
 *      "추정 불가 구간"으로 표시하며, 발주종료 전에 이런 구간이 있으면 그 상품은 출처 분해에서 뺀다.
 *    - 역산값이 음수(설명 안 되는 재고 감소)면 입고 0으로 두고 "불일치"로 센다.
 * 2) 입고 분류(가상 설정): 출시 주 = 초도 / 발주종료 전 PRE주 이내이면서 직전 8주 주평균 판매의 BIG주 치 이상 = 종료 직전 입고 / 나머지 = 추가 입고.
 * 3) 출처 분해: 오래된 입고부터 팔린다(FIFO)는 가정. 비교용으로 평균 소진(판매가 그때 있던 모든 입고분에서 비율대로 빠짐)도 계산한다.
 *    발주종료 뒤에는 정책 시뮬레이터(policy.js)의 판매·할인·종료 심사 경로를 이어 받아, 입고분마다
 *    정상가 판매 / 할인 판매(할인액) / 남은 재고(처리 손실)로 끝을 나눈다.
 */
(function (root) {
  "use strict";
  var AVGW = 8;                                   // "큰 물량" 기준에 쓰는 직전 주평균 판매 기간(주, 가상 설정)
  var DEFAULT = { PRE: 6, BIG: 4 };               // 가상 설정: 직전 범위(주), 큰 물량(주평균 판매의 몇 주 치)
  var RANGES = { PRE: { min: 2, max: 12, step: 1, unit: "주" }, BIG: { min: 1, max: 10, step: 1, unit: "주 치" } };
  var SRC = ["open", "init", "add", "pre", "after"];
  var LABEL = { open: "시작 재고(출처 모름)", init: "초도", add: "추가 입고", pre: "종료 직전 입고", after: "발주종료 뒤 입고" };

  function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }

  // 1) 입고 추정 + 분류
  function inflows(d, S) {
    var n = d.weeks.length, eo = d.eo ? d.weeks.indexOf(d.eo) : -1, launched = !!d.launch && d.weeks[0] === d.launch;
    var q = new Array(n).fill(0), gap = new Array(n).fill(false), events = [], mismatch = 0;
    for (var t = 0; t < n; t++) {
      if (d.stock[t] == null || d.sale[t] == null) { gap[t] = true; continue; }
      if (t === 0) { q[0] = d.stock[0] + d.sale[0]; continue; }
      if (d.stock[t - 1] == null) { gap[t] = true; continue; }    // 지난주 재고가 없으면 이번 주 입고를 알 수 없음
      var v = d.stock[t] - d.stock[t - 1] + d.sale[t];
      if (v < -1e-9) mismatch++;
      q[t] = Math.max(0, v);
    }
    for (t = 0; t < n; t++) {
      if (gap[t] || q[t] <= 1e-9) continue;
      var type;
      if (t === 0) type = launched ? "init" : "open";
      else if (eo >= 0 && t >= eo) type = "after";
      else {
        var pre = d.sale.slice(Math.max(0, t - AVGW), t).filter(function (x) { return x != null; });
        var big = pre.length ? q[t] >= S.BIG * Math.max(mean(pre), 0.5) : false;
        type = eo >= 0 && t >= eo - S.PRE && big ? "pre" : "add";
      }
      events.push({ t: t, q: q[t], type: type });
    }
    var gapBeforeEo = gap.some(function (g, i) { return g && (eo < 0 || i < eo); });
    return { n: n, eo: eo, q: q, gap: gap, events: events, mismatch: mismatch, gapBeforeEo: gapBeforeEo };
  }

  // 재고 보존식 재현: 첫 주부터 입고 − 판매를 쌓으면 실제 재고와 같아야 한다(공백 없는 구간)
  function replay(d, inf) {
    var S = 0, out = [];
    for (var t = 0; t < inf.n; t++) {
      if (inf.gap[t]) { out.push(null); S = null; continue; }
      if (S === null) S = d.stock[t - 1] != null ? d.stock[t - 1] : 0;
      S = S + inf.q[t] - d.sale[t];
      out.push(S);
    }
    return out;
  }

  var API = { AVGW: AVGW, DEFAULT: DEFAULT, RANGES: RANGES, SRC: SRC, LABEL: LABEL, inflows: inflows, replay: replay };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.DispSource = API;
})(typeof window !== "undefined" ? window : globalThis);
