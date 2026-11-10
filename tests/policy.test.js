// node tests/policy.test.js — 계산 모델 숫자 검사(화면 없음)
const assert = require("assert");
const path = require("path");
const M = require("../policy.js");
const L = require(path.join(__dirname, "..", "lifecycle.json"));
const P = M.DEFAULT_POLICY, A = M.DEFAULT_ASSUME;
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };

// 1) 실제 할인 일정을 그대로 재생하면, 첫 품절 주 전까지 실제 판매·재고가 그대로 나와야 한다
let replayed = 0;
for (const d of L.items) {
  const it = M.prepItem(d, A); if (!it.scope) continue;
  const r = M.simulate(it, P, A, d.disc.map(v => v || 0));
  for (let t = it.t0; t < it.n; t++) {
    if (it.cens[t]) break;
    ok(Math.abs(r.sale[t] - d.sale[t]) < 1e-9, `${d.name} ${d.weeks[t]} 판매 재현 ${r.sale[t]} vs ${d.sale[t]}`);
    ok(Math.abs(r.stock[t] - d.stock[t]) < 1e-9, `${d.name} ${d.weeks[t]} 재고 재현 ${r.stock[t]} vs ${d.stock[t]}`);
  }
  replayed++;
}

// 2) 정책 적용: 재고 보존(재고_t = 재고_t-1 + 입고 − 판매), 판매 ≤ 재고, 음수 없음
for (const d of L.items) {
  const it = M.prepItem(d, A); if (!it.scope) continue;
  const r = M.simulate(it, P, A);
  let S = it.s0;
  for (let t = it.t0; t < it.n; t++) {
    if (r.term >= 0 && t >= r.term) break;
    if (r.sold >= 0 && t > r.sold) break;
    const before = S + it.inflow[t];
    ok(r.sale[t] <= before + 1e-9 && r.sale[t] >= 0, `${d.name} 판매 ≤ 재고`);
    S = before - r.sale[t];
    ok(Math.abs(S - r.stock[t]) < 1e-6 && r.stock[t] >= 0, `${d.name} 재고 보존`);
  }
}

// 3) 품절 주 보정: 품절 주의 원래 판매를 바꿔도 기본 수요는 그대로여야 한다(역산에서 빠졌으므로)
let censTested = 0;
for (const d of L.items) {
  const b1 = M.baseDemand(d, A); if (!b1) continue;
  const t = b1.cens.findIndex((c, i) => c && d.sale[i] != null);
  if (t < 0) continue;
  const d2 = JSON.parse(JSON.stringify(d)); d2.sale[t] = d2.sale[t] + 999;
  const b2 = M.baseDemand(d2, A);
  ok(b2.base.every((v, i) => Math.abs(v - b1.base[i]) < 1e-9), `${d.name} 품절 주 판매 변경이 기본 수요에 영향`);
  censTested++;
}

// 4) 반응 가정 단조성, 기본값이 생성기 가정과 다른지 기록
ok(M.lift(0, A) === 1 && M.lift(30, A) === A.r30 && M.lift(50, A) === A.r50, "반응 가정 기준점");
ok(M.lift(40, A) > M.lift(30, A) && M.lift(60, A) > M.lift(50, A), "반응 가정 증가");

const R = M.runAll(L.items, P, A);
console.log(`검사 ${checks}개 통과 · 재현 상품 ${replayed}개 · 품절 보정 검사 ${censTested}개`);
console.log(`대상 ${R.T.n}개 / 제외 ${R.T.out}개 · 손실 차이 ${Math.round(R.T.dTotal)}원 · 잔고 차이 ${Math.round(R.T.dEndWon)}원 · 정리 ${R.T.aClear.toFixed(1)}→${R.T.pClear.toFixed(1)}주 · 종료 심사 ${R.T.terms}`);
