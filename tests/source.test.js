// node tests/source.test.js — 재고 출처 모델 숫자 검사(화면 없음)
const assert = require("assert");
const path = require("path");
const S = require("../source.js");
const L = require(path.join(__dirname, "..", "lifecycle.json"));
const D = S.DEFAULT;
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const clone = o => JSON.parse(JSON.stringify(o));

// 1) 재고 보존식 재현: 추정 입고 − 판매를 쌓으면 모든 주의 실제 재고가 그대로 나와야 한다
let rows = 0, stockoutWeeks = 0, gapItems = 0;
for (const d of L.items) {
  const inf = S.inflows(d, D), rp = S.replay(d, inf);
  if (inf.gapBeforeEo && inf.eo >= 0) gapItems++;
  for (let t = 0; t < inf.n; t++) {
    if (inf.gap[t]) continue;
    ok(Math.abs(rp[t] - d.stock[t]) < 1e-9, `${d.name} ${d.weeks[t]} 재고 재현 ${rp[t]} vs ${d.stock[t]}`);
    ok(inf.q[t] >= 0, `${d.name} 입고 음수`);
    if (d.stock[t] === 0) stockoutWeeks++;
    rows++;
  }
  ok(inf.mismatch === 0, `${d.name} 불일치 ${inf.mismatch}`);
  ok(inf.events.filter(e => e.type === "init" || e.type === "open").length === 1, `${d.name} 첫 입고 1건`);
}

// 2) 품절 주(재고 0): 따로 메우지 않고 보존식 그대로. 품절 주 다음에 들어온 입고도 정확해야 한다
const so = L.items.find(d => d.stock.some((v, i) => v === 0 && i > 0 && i < d.stock.length - 1));
{ const d = clone(so), t = d.stock.findIndex((v, i) => v === 0 && i > 0);
  d.stock[t + 1] = 10; d.sale[t + 1] = 2;                 // 품절 다음 주에 12개 입고 → 10개 남음
  const inf = S.inflows(d, D);
  ok(Math.abs(inf.q[t + 1] - 12) < 1e-9 && !inf.gap[t + 1], "품절 다음 주 입고 12");
  ok(Math.abs(S.replay(d, inf)[t + 1] - 10) < 1e-9, "품절 다음 주 재고 재현"); }

// 3) 재고 null 구간: 그 주와 다음 주는 추정 불가로 표시하고 입고를 만들지 않는다. 발주종료 전이면 출처 분해 대상에서 빠진다
{ const d = clone(L.items.find(x => x.eo && x.weeks.indexOf(x.eo) > 10)), eo = d.weeks.indexOf(d.eo), t = eo - 5;
  d.stock[t] = null;
  const inf = S.inflows(d, D);
  ok(inf.gap[t] && inf.gap[t + 1] && !inf.gap[t + 2], "null 주와 다음 주가 추정 불가");
  ok(!inf.events.some(e => e.t === t || e.t === t + 1), "추정 불가 주에 입고 없음");
  ok(inf.gapBeforeEo, "발주종료 전 공백 → 분해 제외 표시");
  const rp = S.replay(d, inf);
  ok(rp[t] === null && Math.abs(rp[t + 2] - d.stock[t + 2]) < 1e-9, "공백 뒤 다시 재현"); }

// 4) 설명 안 되는 재고 감소는 입고 0 + 불일치로 센다
{ const d = clone(L.items[0]); d.stock[5] = d.stock[5] - 1000;
  const inf = S.inflows(d, D); ok(inf.mismatch >= 1 && inf.q[5] === 0, "불일치 감지"); }

console.log(`검사 ${checks}개 통과 · 재현한 주 ${rows}개(품절 주 ${stockoutWeeks}개 포함) · 실제 데이터의 추정 불가 상품 ${gapItems}개`);

// 5) 출처 분해: 발주종료 잔고 = 층 합계, 발주종료 뒤 끝(정상가·할인·남음) 합계 = 시뮬레이터 경로와 일치
{
  const M = require("../policy.js"), P = M.DEFAULT_POLICY, A = M.DEFAULT_ASSUME;
  let nDec = 0, c0 = checks;
  for (const d of L.items) {
    const inf = S.inflows(d, D); if (inf.eo < 0) continue;
    const it = M.prepItem(d, A), sim = it.scope ? M.simulate(it, P, A) : null;
    for (const fifo of [true, false]) {
      const x = S.decompose(d, inf, sim, fifo); if (!x) continue;
      const at = S.SRC.reduce((a, s) => a + x.atEo[s], 0);
      ok(Math.abs(at - d.stock[inf.eo - 1]) < 1e-6, `${d.name} 발주종료 잔고 ${at} vs ${d.stock[inf.eo - 1]}`);
      if (sim) {
        const full = S.SRC.reduce((a, s) => a + x.fate[s].full + x.fate[s].disc, 0), left = S.SRC.reduce((a, s) => a + x.fate[s].left, 0);
        let sold = 0; for (let t = it.t0; t < it.n; t++) { if (sim.term >= 0 && t >= sim.term) break; sold += sim.sale[t]; }
        ok(Math.abs(full - sold) < 1e-6, `${d.name} 판매 합계 일치`);
        ok(Math.abs(left - (sim.end + sim.termStock)) < 1e-6, `${d.name} 남은 재고 일치 ${left} vs ${sim.end + sim.termStock}`);
        const md = S.SRC.reduce((a, s) => a + x.fate[s].md, 0);
        ok(Math.abs(md - sim.md) < 1e-3, `${d.name} 할인액 일치`);
      }
      if (fifo) nDec++;
    }
  }
  // FIFO에서는 가장 최근 입고가 가장 늦게 팔린다: 종료 직전 입고분의 잔존 비율 ≥ 평균 소진의 잔존 비율
  const R = S.runAll(L.items, D, M, P, A);
  ok(R.fifo.at.pre >= R.avg.at.pre - 1e-6, "FIFO 종료 직전 잔존 ≥ 평균 소진");
  ok(Math.abs(R.fifo.sumAt - R.avg.sumAt) < 1e-3, "두 가정의 발주종료 잔고 합계 동일");
  console.log(`분해 검사 ${checks - c0}개 · 분해 상품 ${nDec}개`);
  const pct = (a, b) => (b ? (a / b * 100).toFixed(1) : "0") + "%";
  for (const k of ["fifo", "avg"]) { const T = R[k];
    console.log(k, "잔고", S.SRC.map(s => s + " " + pct(T.at[s], T.sumAt)).join(" · "), "| 손실", S.SRC.map(s => s + " " + pct(T.loss[s], T.sumLoss)).join(" · "), "| 합계 잔고", Math.round(T.sumAt), "손실", Math.round(T.sumLoss)); }
}
