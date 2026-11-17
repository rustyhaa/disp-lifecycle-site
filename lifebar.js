/* 세 화면 공통 위쪽 띠: 같은 상품을 품의 추적 → 상품 한 장 → 처분으로 같은 탭에서 오간다.
   공용 생성기(make_shared.py)가 상품 목록을 넣어 만든다. 쓰는 법: <body> 바로 뒤에
   <script src="lifebar.js" data-site="import|product|disp"></script> */
(function () {
  var P = [{"id": "P01", "name": "멸균우유 24입", "type": 1, "sr": "SR-2536-01"}, {"id": "P02", "name": "바닐라 바 아이스크림", "type": 2, "sr": "SR-2506-02"}, {"id": "P03", "name": "초코 콘 아이스크림", "type": 3, "sr": "SR-2508-03"}, {"id": "P04", "name": "딸기 파인트 아이스크림", "type": 3, "sr": "SR-2510-01"}, {"id": "P05", "name": "얼큰 봉지라면 5입", "type": 4, "sr": "SR-2511-04"}, {"id": "P06", "name": "트러플 감자스낵", "type": 5, "sr": "SR-2631-02"}, {"id": "P07", "name": "짜장 봉지라면 멀티팩", "type": 6, "sr": "SR-2615-01"}, {"id": "P08", "name": "매운 컵라면", "type": 6, "sr": "SR-2519-02"}];
  var me = document.currentScript, here = (me && me.dataset.site) || "product";
  var BASE = {
    import: "https://rustyhaa.github.io/import-lifecycle-demo/",
    product: "https://rustyhaa.github.io/product-lifecycle-demo/",
    disp: "https://rustyhaa.github.io/disp-lifecycle-site/"
  };
  var LABEL = { import: "품의 추적", product: "상품 한 장", disp: "처분" };
  var SUB = { import: "앞단 · 품의부터 소진까지", product: "전체 이력 · 한 시간축", disp: "뒷단 · 발주종료부터 처분까지" };
  function path(site, p) {
    if (site === "import") return "#" + p.sr;
    if (site === "product") return "#/p/" + p.id;
    return "lifecycle.html#item=" + encodeURIComponent(p.name);
  }
  function url(site, p) {
    if (site !== here) return BASE[site] + path(site, p);
    if (site === "disp") return "lifecycle.html#item=" + encodeURIComponent(p.name);
    return path(site, p);
  }
  function current() {
    var h = "";
    try { h = decodeURIComponent(location.hash); } catch (e) { h = location.hash; }
    var m;
    if (here === "import") return P.filter(function (p) { return h === "#" + p.sr; })[0];
    if (here === "product") { m = h.match(/#\/p\/(\w+)/); return m && P.filter(function (p) { return p.id === m[1]; })[0]; }
    m = h.match(/item=([^&]+)/); return m && P.filter(function (p) { return p.name === m[1]; })[0];
  }
  function go(site, p) {
    var u = url(site, p);
    if (site === here && here === "disp") {
      var samePage = /lifecycle\.html$/.test(location.pathname);
      location.href = u;
      if (samePage) location.reload();
      return;
    }
    location.href = u;
  }
  var css = ".lfb,.lfb *{box-sizing:border-box;margin:0}.lfb .lfb-st{background:none;border:0;box-shadow:none;padding:0;min-height:0}.lfb{position:sticky;top:0;z-index:9999;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:7px 20px;background:#16223D;color:#fff;" +
    "font:13px/1.4 Pretendard,'Pretendard Variable',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;box-shadow:0 1px 0 rgba(255,255,255,.08)}" +
    ".lfb b{font-weight:700;letter-spacing:.02em;white-space:nowrap}.lfb .lfb-st{display:flex;align-items:center;gap:4px}" +
    ".lfb .lfb-st a{color:#fff;opacity:.62;text-decoration:none;padding:5px 10px;border-radius:7px;white-space:nowrap}.lfb .lfb-st a:hover{opacity:1;background:rgba(255,255,255,.08)}" +
    ".lfb .lfb-st a.on{opacity:1;background:rgba(255,255,255,.14);font-weight:600}.lfb .lfb-st i{opacity:.4;font-style:normal}" +
    ".lfb select{background:#24314F;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:7px;padding:4px 8px;font:inherit;max-width:260px}" +
    ".lfb .lfb-sp{flex:1}.lfb .lfb-tg{font-size:12px;opacity:.6;white-space:nowrap}" +
    "@media (max-width:700px){.lfb{padding:7px 12px;gap:8px}.lfb .lfb-tg{display:none}.lfb select{max-width:150px}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var bar = document.createElement("div"); bar.className = "lfb"; bar.setAttribute("role", "navigation");
  bar.innerHTML = '<b>재고 생애</b><select aria-label="상품 고르기"></select><span class="lfb-st"></span><span class="lfb-sp"></span><span class="lfb-tg">가상 데이터 · 판매 수명 유형 6가지</span>';
  var sel = bar.querySelector("select"), steps = bar.querySelector(".lfb-st");
  P.forEach(function (p) { var o = document.createElement("option"); o.value = p.id; o.textContent = "유형 " + p.type + " · " + p.name; sel.appendChild(o); });
  function render() {
    var p = current() || null;
    sel.value = p ? p.id : "";
    if (!p) { if (!sel.querySelector('option[value=""]')) { var o = document.createElement("option"); o.value = ""; o.textContent = "상품 고르기"; o.disabled = true; sel.insertBefore(o, sel.firstChild); } sel.value = ""; }
    var KEY = "lifebar-pid", saved = null;
    try { if (p) localStorage.setItem(KEY, p.id); else saved = localStorage.getItem(KEY); } catch (e) {}
    var q = p || P.filter(function (x) { return x.id === saved; })[0] || P[0];   // 세 화면이 같은 주소(github.io)라 마지막에 본 상품을 기억
    steps.innerHTML = ["import", "product", "disp"].map(function (s, k) {
      return (k ? "<i>→</i>" : "") + '<a href="' + url(s, q) + '" data-s="' + s + '" class="' + (s === here ? "on" : "") + '" title="' + SUB[s] + '">' + LABEL[s] + "</a>";
    }).join("");
    steps.querySelectorAll("a").forEach(function (a) { a.onclick = function (e) { e.preventDefault(); go(a.dataset.s, current() || q); }; });
  }
  sel.onchange = function () { var p = P.filter(function (x) { return x.id === sel.value; })[0]; if (p) go(here, p); };
  window.addEventListener("hashchange", render);
  window.addEventListener("lifebar:sel", render);
  document.body.insertBefore(bar, document.body.firstChild);
  render();
})();
