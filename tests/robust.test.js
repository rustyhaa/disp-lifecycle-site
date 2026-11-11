const assert = require("assert"); const path = require("path");
const M = require("../policy.js"); const L = require(path.join(__dirname, "..", "lifecycle.json"));
let checks = 0; const ok = (c, m) => { assert.ok(c, m); checks++; };
const nums = (s) => (s.match(/\d+/g) || []).map(Number);

// 1) 격자 집계 기본 성질
const G = M.robust(L.items, M.DEFAULT_POLICY);
ok(G.n === 65, "격자 조합 수는 65여야 함: " + G.n);
for (const key of ["dClear", "dTotal"]) {
  const t = G[key];
  ok(t.neg + t.pos + t.flat === G.n, key + " 합계가 n과 다름");
  ok(t.min <= t.max, key + " min > max");
}

// 2) grade 분기 4종
const g = (neg, pos, flat) => M.grade({ neg, pos, flat, min: 0, max: 0 }, neg + pos + flat);
ok(g(3, 0, 0) === "same-neg", "same-neg");
ok(g(0, 3, 0) === "same-pos", "same-pos");
ok(g(0, 0, 3) === "flat", "flat");
ok(g(1, 1, 1) === "depends", "depends");

// 3) 격자를 테스트 안에서 직접 돌려 집계를 다시 계산
const R30 = [1.0, 1.3, 1.6, 2.0, 2.5], R50 = [1.0, 1.6, 2.2, 3.0], RLOSS = [0, 30, 60, 80, 100];
const FL = { dTotal: 50000, dClear: 0.5 };
const mine = { dClear: { neg: 0, pos: 0, flat: 0, min: Infinity, max: -Infinity }, dTotal: { neg: 0, pos: 0, flat: 0, min: Infinity, max: -Infinity } };
let combos = 0;
for (const r30 of R30) for (const r50 of R50) for (const loss of RLOSS) {
  if (r50 < r30) continue;
  const T = M.runAll(L.items, M.DEFAULT_POLICY, { r30, r50, loss }).T;
  combos++;
  for (const key of ["dClear", "dTotal"]) {
    const v = T[key], m = mine[key];
    if (v <= -FL[key]) m.neg++; else if (v >= FL[key]) m.pos++; else m.flat++;
    m.min = Math.min(m.min, v); m.max = Math.max(m.max, v);
  }
}
ok(combos === G.n, "직접 계산 조합 수 불일치");
for (const key of ["dClear", "dTotal"]) {
  ok(mine[key].neg === G[key].neg, key + " neg 불일치");
  ok(mine[key].pos === G[key].pos, key + " pos 불일치");
  ok(mine[key].flat === G[key].flat, key + " flat 불일치");
  ok(mine[key].min === G[key].min && mine[key].max === G[key].max, key + " min/max 불일치");
}

// 4) 뒤집는 지점: 범위 안이고, 앞뒤 한 칸(클램프) 값의 dTotal 부호가 뒤집힌다(0 포함)
const KEYS = ["loss", "X", "d1", "Z", "Y", "d2", "N", "r30", "r50"];
const F = M.flips(L.items, M.DEFAULT_POLICY, M.DEFAULT_ASSUME, KEYS);
for (const f of F) {
  const r = M.RANGES[f.k];
  ok(f.v >= r.min && f.v <= r.max, f.k + " 뒤집는 지점이 범위 밖: " + f.v);
  const lo = Math.max(r.min, f.v - r.step), hi = Math.min(r.max, f.v + r.step);
  const s = M.sweep(L.items, M.DEFAULT_POLICY, M.DEFAULT_ASSUME, f.k, [lo, hi]);
  ok(s[0].dTotal * s[1].dTotal <= 0, f.k + " 앞뒤 값에서 부호가 뒤집히지 않음: " + s[0].dTotal + ", " + s[1].dTotal);
}

// 5) 화면 문장이 T/G에서 계산한 숫자와 일치
const T = M.runAll(L.items, M.DEFAULT_POLICY, M.DEFAULT_ASSUME).T;
const S = M.sentences(T, G, F);
ok(S.clear.grade === M.grade(G.dClear, G.n), "clear.grade 불일치");
ok(S.loss.grade === M.grade(G.dTotal, G.n), "loss.grade 불일치");

let expClearText = [], expClearBadge = [];
if (S.clear.grade === "same-neg") {
  expClearText = [Math.round(-T.dClear)];
  expClearBadge = [Math.round(-G.dClear.max), Math.round(-G.dClear.min)];
} else if (S.clear.grade === "same-pos") {
  expClearText = [Math.round(T.dClear)];
  expClearBadge = [Math.round(G.dClear.min), Math.round(G.dClear.max)];
} else if (S.clear.grade === "depends") {
  expClearBadge = [G.n, G.dClear.neg, G.dClear.pos];
}
assert.deepStrictEqual(nums(S.clear.text), expClearText, "clear.text 숫자 불일치");
assert.deepStrictEqual(nums(S.clear.badge), expClearBadge, "clear.badge 숫자 불일치");

const expLossBadge = S.loss.grade === "depends" ? [G.n, G.dTotal.neg, G.dTotal.pos] : [];
assert.deepStrictEqual(nums(S.loss.badge), expLossBadge, "loss.badge 숫자 불일치");
ok(true, "문장 숫자 검사");

ok(S.flips.length === F.length, "flips 개수 불일치");
S.flips.forEach((x, i) => ok(x.k === F[i].k && x.assume === !!M.RANGES[F[i].k].assume, "flips 항목 " + i));

console.log(`검사 ${checks}개 통과`);
console.log(JSON.stringify(S));
