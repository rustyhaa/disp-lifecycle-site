const assert = require("assert"); const path = require("path");
const M = require("../policy.js"); const L = require(path.join(__dirname, "..", "lifecycle.json"));
let checks = 0; const ok = (c, m) => { assert.ok(c, m); checks++; };
const near = (a, b, m) => ok(Math.abs(a - b) < 1e-9, m + ": " + a + " vs " + b);

// 1) 파레트 CBM (1.1 × 1.1 × 1.5 × 0.8)
near(M.palletCbm(), 1.452, "palletCbm");
const PC = 1.452;

// 2) 개수 → 박스(올림) → 파레트 역산
const snack = { cat: "과자" };                 // 1박스 = 1.5L × 20 = 0.03 m³
const boxSnack = 1.5 * 20 / 1000;
ok(M.pallets(snack, 0) === 0, "0개 → 0");
ok(M.pallets(snack, -5) === 0, "음수 → 0");
near(M.pallets(snack, 1), boxSnack / PC, "1개 → 1박스(올림)");
near(M.pallets(snack, 20), boxSnack / PC, "20개 → 1박스(딱 맞음)");
near(M.pallets(snack, 21), 2 * boxSnack / PC, "21개 → 2박스(올림)");
near(M.palletsRaw(snack, 10) * 2, M.palletsRaw(snack, 20), "palletsRaw 선형");
near(M.palletsRaw(snack, 20), 20 * 1.5 / 1000 / PC, "palletsRaw 값(박스 올림 없음)");
const unknown = { cat: "없는분류" };
ok(M.volOf(unknown) === M.VOLUME._default, "미등록 분류 → _default");
near(M.pallets(unknown, 12), (2.0 * 12 / 1000) / PC, "미등록 분류 파레트 값");

// 3) runAll 파레트·주 집계를 테스트에서 독립 계산과 대조
const A = M.DEFAULT_ASSUME, P = M.DEFAULT_POLICY;
const R = M.runAll(L.items, P, A), T = R.T;
const palIn = (cat, units) => {
  if (!(units > 0)) return 0;
  const v = M.VOLUME[cat] || M.VOLUME._default;
  return Math.ceil(units / v.perBox) * (v.unitL * v.perBox / 1000) / (1.1 * 1.1 * 1.5 * 0.8);
};
const pwIn = (cat, arr, t0, n) => {
  let s = 0;
  for (let t = t0; t < n; t++) { if (arr[t] == null) continue; s += palIn(cat, arr[t]); }
  return s;
};
let sumA = 0, sumP = 0, sumA0 = 0, scopedN = 0, below = 0, above = 0;
for (const r of R.rows) {
  if (!r.scope) continue;
  scopedN++;
  const a = pwIn(r.d.cat, r.d.stock, r.it.t0, r.it.n);
  const p = pwIn(r.d.cat, r.p.stock, r.it.t0, r.it.n);
  near(r.aPW, a, "행 aPW " + r.d.name);
  near(r.pPW, p, "행 pPW " + r.d.name);
  sumA += a; sumP += p;
  sumA0 += palIn(r.d.cat, r.it.s0);
  if (r.it.t0 > 0 && r.d.stock[r.it.t0 - 1] != null)
    ok(r.it.s0 === Math.max(0, r.d.stock[r.it.t0 - 1]), "s0 = 발주종료 전 주 재고 " + r.d.name);
  if (p < a - 1e-9) below++; else if (p > a + 1e-9) above++;
}
ok(scopedN === T.n, "대상 행 수 불일치");
near(T.aPW, sumA, "T.aPW 합계");
near(T.pPW, sumP, "T.pPW 합계");
ok(T.dPW === T.pPW - T.aPW, "T.dPW = pPW − aPW");
near(T.dPWpct, T.aPW > 0 ? (T.pPW - T.aPW) / T.aPW * 100 : 0, "T.dPWpct");
near(T.aPal0, sumA0, "T.aPal0 합계");
ok(T.aPW > 0, "실제 파레트·주가 0보다 커야 함");

// 4) 격자 강건성: dPW 분류 합계 = 65
const G = M.robust(L.items, P);
ok(G.n === 65, "격자 조합 수 65: " + G.n);
ok(G.dPW.neg + G.dPW.pos + G.dPW.flat === G.n, "G.dPW 합계 = n");
ok(G.dPW.min <= G.dPW.max, "G.dPW min <= max");

// 5) 문장: space 등급과 숫자
const S = M.sentences(T, G, []);
ok(S.space.grade === M.grade(G.dPW, G.n), "space.grade = grade(G.dPW, n)");
const g = S.space.grade;
if (g === "same-neg") ok(S.space.text === "재고가 차지한 공간이 " + Math.round(-T.dPWpct) + "% 줄어듭니다", "same-neg 문장 숫자");
else if (g === "same-pos") ok(S.space.text === "재고가 차지한 공간이 " + Math.round(T.dPWpct) + "% 늘어납니다", "same-pos 문장 숫자");
else if (g === "flat") ok(S.space.text === "재고가 차지한 공간은 거의 같습니다", "flat 문장");
else ok(S.space.text === "재고가 차지한 공간은 가정에 따라 달라집니다", "depends 문장");
ok(S.space.badge.length > 0, "space.badge 존재");

// 출력
console.log(`검사 ${checks}개 통과`);
console.log(`파레트·주 실제 ${T.aPW.toFixed(1)} → 규칙 ${T.pPW.toFixed(1)} (${T.dPWpct.toFixed(1)}%) · 발주종료 시점 ${T.aPal0.toFixed(1)}파레트`);
console.log(`행 기준: 정책이 더 적은 상품 ${below}개 · 더 많은 상품 ${above}개 · 대상 ${scopedN}개`);
console.log(JSON.stringify(S.space));
console.log(JSON.stringify(G.dPW));
