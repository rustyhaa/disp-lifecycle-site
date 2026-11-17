/* 세 화면 공통 위쪽 띠: 같은 상품을 품의 추적 → 상품 한 장 → 처분으로 같은 탭에서 오간다.
   공용 생성기(make_shared.py)가 상품 목록을 넣어 만든다. 쓰는 법: <body> 바로 뒤에
   <script src="lifebar.js" data-site="import|product|disp"></script> */
(function () {
  var P = [{"id": "P01", "name": "미니 블루투스 스피커", "type": 1, "sr": "SR-2536-01"}, {"id": "P02", "name": "대용량 세탁세제 리필", "type": 2, "sr": "SR-2506-02"}, {"id": "P03", "name": "휴대용 손선풍기", "type": 3, "sr": "SR-2508-03"}, {"id": "P04", "name": "모기 기피 스프레이", "type": 3, "sr": "SR-2510-01"}, {"id": "P05", "name": "극세사 담요", "type": 4, "sr": "SR-2511-04"}, {"id": "P06", "name": "트러플 감자스낵", "type": 5, "sr": "SR-2631-02"}, {"id": "P07", "name": "주방세제 1+1 기획팩", "type": 6, "sr": "SR-2615-01"}, {"id": "P08", "name": "매운 컵라면", "type": 6, "sr": "SR-2519-02"}];
  var TOUR = [{"site": "product", "path": "#/", "sel": "#h-list", "title": "문제: 체화재고가 계속 늘어난다", "text": "가상 회사의 체화재고가 12주 동안 18.1억 늘었습니다. 어디서 늘었고 어느 상품부터 볼지, 그리고 그 상품에 무슨 일이 있었는지를 끝까지 따라가 보려고 만든 화면 세 개입니다.", "focus": {"holes": [{"sel": "#h-kpis .kpi:nth-child(2)"}, {"sel": "#h-list", "items": 2}], "ring": 1, "label": {"at": 1, "text": "12주 동안 체화가 가장 많이 늘어난 두 상품"}}}, {"site": "product", "path": "#/p/P03", "sel": "#chartbox", "act": "cf-off", "title": "상품 하나의 전체 이력을 한 시간축에", "text": "휴대용 손선풍기(유형 3 · 계절성). 상태·행사·입고(발주 주체별)·판매·센터/점포 재고·체화를 같은 주 단위로 쌓았습니다. 동그라미 번호는 규칙에 걸린 사건입니다.", "focus": {"holes": [{"lanes": ["ann", "band"]}], "events": true, "label": {"at": 0, "text": "규칙에 걸린 사건 5개를 시간 순서로"}}}, {"site": "product", "path": "#/p/P03", "sel": "#chartbox", "act": "cf-off", "title": "판매는 정상이었다. 문제는 발주 시점", "text": "판매 줄의 회색 띠는 같은 유형 가상 상품 40개의 정상 범위(25~75%)입니다. 판매는 87주 중 72주가 띠 안에 있었는데, 정점이 지난 뒤 들어온 예외발주 때문에 재고만 쌓였습니다.", "focus": {"holes": [{"lanes": ["sal"]}], "ring": 0, "label": {"at": 0, "text": "회색 띠 = 유형 3 정상 범위 · 판매 87주 중 72주가 띠 안"}}}, {"site": "product", "path": "#/p/P03", "sel": "#p-cf-card", "act": "cf-on", "title": "유형대로 발주했다면", "text": "정상 모양만큼만 채웠다면 체화 최대 7,745만원 → 186만원. 대신 품절로 못 판 수량이 1,961개 생깁니다. 공짜 개선이 아니라 맞바꿈이라는 것까지 숫자로 보여 줍니다.", "focus": {"holes": [{"lanes": ["stk", "chw"]}, {"sel": "#p-cf-card"}], "ring": 1, "label": {"at": 1, "text": "체화 최대", "tween": [7745, 186, "만원"]}}}, {"site": "import", "path": "#SR-2508-03", "sel": "#kp", "title": "앞단: 품의 추적 화면", "text": "같은 상품을 품의 기준으로 봅니다. 합의 30,000개 대비 입고 64,000개(213%). 이 화면의 경보는 '첫 4주 판매율'로 판단하는데, 유형 1처럼 초반 행사로 정점이 오는 상품은 이 규칙에 걸리지 않는다는 것도 이 데이터에서 드러났습니다.", "focus": {"holes": [{"sel": "#kp > :nth-child(2)"}, {"sel": "#kp > :nth-child(4)"}], "ring": 0, "label": {"at": 0, "text": "합의 대비 입고 213%"}}}, {"site": "disp", "path": "lifecycle.html#item=휴대용 손선풍기", "sel": ".card.det", "title": "뒷단: 처분 화면 (샘플 점포 1곳)", "text": "시즌 종료 처분 2회. 1회차는 할인 중 주평균 5.0개로 할인 전 15.6개보다 오히려 낮았습니다(배수 0.3배). 시즌이 끝난 뒤의 할인은 반응이 약했습니다.", "focus": {"holes": [{"sel": ".card.det .chartwrap"}, {"sel": ".dl .drow"}], "ring": 1, "label": {"at": 1, "text": "1회차 배수 0.3배 · 할인했는데 덜 팔림"}}}, {"site": "disp", "path": "easy.html#item=휴대용 손선풍기", "sel": ".grid", "title": "상품마다 결정하지 않고 규칙을 설계", "text": "처분은 상품별로 하나씩 정하는 대신, 할인 규칙(정책)을 바꿔 보고 결과를 미리 보는 방식으로 만들었습니다. 발주종료된 상품을 대상으로, 가정 65가지에서 결과가 어떻게 달라지는지까지 함께 보여 줍니다.", "focus": {"holes": [{"sel": ".grid > :first-child"}], "ring": 0, "label": {"at": 0, "text": "규칙대로 했을 때 vs 실제 · 가정 65가지"}}}, {"site": "product", "path": "#/p/P05", "sel": "#chartbox", "act": "cf-off", "title": "유형을 모르면 처분도 틀린다", "text": "극세사 담요는 겨울에 다시 오르는 유형 4입니다. 여름 저점에서 처분했고, 겨울에는 7주 품절로 4,363개를 못 팔았습니다. 판매 막대가 정상 범위 아래로 떨어진 구간입니다.", "focus": {"holes": [{"lanes": ["sal", "stk"], "from": 46, "to": 54}], "ring": 0, "label": {"at": 0, "text": "7주 품절 · 4,363개 못 팖"}}}, {"site": "product", "path": "#/p/P04", "sel": "#chartbox", "act": "cf-off", "title": "같은 유형, 다른 결과", "text": "모기 기피 스프레이도 유형 3(계절성)이지만 정점 전에 발주를 줄여 체화 없이 시즌을 마감했습니다. 판매 모양은 휴대용 손선풍기와 같고, 발주 시점만 다릅니다.", "focus": {"holes": [{"lanes": ["sal"]}, {"lanes": ["chw"]}], "ring": 0, "label": {"at": 0, "text": "휴대용 손선풍기와 같은 계절 모양 · 체화 0"}}}, {"site": "product", "path": "#/", "sel": null, "title": "정리", "text": "판매 수명 유형 6가지(정점 초반·완만 상승·계절성·하락 후 재상승·신상품·행사 급등)마다 가상 상품을 1~2개 만들고, 품의 추적 → 상품 한 장 → 처분 세 화면이 같은 데이터와 같은 링크를 쓰게 했습니다. 모든 숫자와 상품은 가상입니다."}];
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
    ".lfb .lfb-tour{background:#1FA39A;color:#fff;border:0;border-radius:7px;padding:5px 12px;font:inherit;font-weight:600;cursor:pointer}.lfb .lfb-tour:hover{filter:brightness(1.08)}" +
    ".lfb-hl{outline:3px solid #1FA39A !important;outline-offset:6px;border-radius:10px;transition:outline-offset .2s}" +
    ".lfb-cap{position:fixed;right:20px;bottom:20px;z-index:10000;width:400px;max-width:calc(100vw - 32px);background:#fff;color:#16223D;border-radius:14px;box-shadow:0 12px 40px rgba(22,34,61,.28),0 0 0 1px rgba(22,34,61,.08);padding:16px 18px;font:14px/1.6 Pretendard,'Pretendard Variable',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}" +
    ".lfb-cap .k{font-size:12px;color:#11796F;font-weight:700;letter-spacing:.03em}.lfb-cap h3{font-size:16px;margin:2px 0 6px;font-weight:700}.lfb-cap p{margin:0;color:#4B5B78;font-size:13.5px}" +
    ".lfb-cap .bar2{height:3px;background:#E1E6EE;border-radius:2px;margin:12px 0 10px;overflow:hidden}.lfb-cap .bar2 i{display:block;height:100%;background:#1FA39A}" +
    ".lfb-cap .bt{display:flex;gap:8px;justify-content:flex-end}.lfb-cap button{font:inherit;font-size:13px;border-radius:8px;padding:6px 12px;cursor:pointer;border:1px solid #E1E6EE;background:#fff;color:#16223D}" +
    ".lfb-cap button.pr{background:#16223D;color:#fff;border-color:#16223D;font-weight:600}.lfb-cap button.x{margin-right:auto;border:0;color:#8592A8;padding-left:0}" +
    ".lfb-cap.left{right:auto;left:20px}" +
    ".lfb-lbl{position:absolute;z-index:9995;background:#0F1A30;color:#fff;font:600 13.5px/1.4 Pretendard,'Pretendard Variable',-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;padding:7px 12px;border-radius:9px;box-shadow:0 6px 20px rgba(0,0,0,.25);white-space:nowrap;transition:opacity .35s,transform .35s;pointer-events:none}" +
    ".lfb-lbl s{opacity:.6;font-weight:500}.lfb-lbl b{color:#5EEAD4;font-size:15px}" +
    "@media (max-width:700px){.lfb-cap{right:12px;left:12px;bottom:12px;width:auto}}" +
    ".lfb .lfb-sp{flex:1}.lfb .lfb-tg{font-size:12px;opacity:.6;white-space:nowrap}" +
    "@media (max-width:700px){.lfb{padding:7px 12px;gap:8px}.lfb .lfb-tg{display:none}.lfb select{max-width:150px}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var bar = document.createElement("div"); bar.className = "lfb"; bar.setAttribute("role", "navigation");
  bar.innerHTML = '<b>재고 생애</b><select aria-label="상품 고르기"></select><span class="lfb-st"></span><span class="lfb-sp"></span><button type="button" class="lfb-tour">둘러보기 ▶</button><span class="lfb-tg">가상 데이터 · 판매 수명 유형 6가지</span>';
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

  /* ---------- 둘러보기: 장면 번호를 주소(?tour=N)에 실어 세 화면을 오간다 ---------- */
  function tourStep() { var m = location.search.match(/[?&]tour=(\d+)/); return m ? +m[1] : -1; }
  function tourUrl(k) {
    var s = TOUR[k], hash = s.path.indexOf("#") >= 0 ? s.path.slice(s.path.indexOf("#")) : "", file = s.path.indexOf("#") > 0 ? s.path.slice(0, s.path.indexOf("#")) : "";
    var q = "?tour=" + k;
    if (s.site !== here) return BASE[s.site] + file + q + hash;
    return (file || (here === "disp" ? "lifecycle.html" : location.pathname.split("/").pop() || "./")) + q + hash;
  }
  function tourGo(k) { if (k < 0 || k >= TOUR.length) return tourEnd(); location.href = tourUrl(k); }
  function tourEnd() {
    var c = document.querySelector(".lfb-cap"); if (c) c.remove(); clearSpot();
    document.querySelectorAll(".lfb-hl").forEach(function (e) { e.classList.remove("lfb-hl"); });
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
  }
  function tourShow(k) {
    var s = TOUR[k]; if (!s) return;
    var cap = document.createElement("div"); cap.className = "lfb-cap"; cap.setAttribute("role", "dialog"); cap.setAttribute("aria-label", "둘러보기");
    cap.innerHTML = '<div class="k">둘러보기 ' + (k + 1) + " / " + TOUR.length + "</div><h3></h3><p></p>" +
      '<div class="bar2"><i style="width:' + Math.round((k + 1) / TOUR.length * 100) + '%"></i></div>' +
      '<div class="bt"><button type="button" class="x">끝내기</button>' + (k ? '<button type="button" class="pv">← 이전</button>' : "") +
      '<button type="button" class="pr">' + (k < TOUR.length - 1 ? "다음 →" : "처음으로") + "</button></div>";
    cap.querySelector("h3").textContent = s.title; cap.querySelector("p").textContent = s.text;
    cap.querySelector(".x").onclick = tourEnd;
    if (k) cap.querySelector(".pv").onclick = function () { tourGo(k - 1); };
    cap.querySelector(".pr").onclick = function () { k < TOUR.length - 1 ? tourGo(k + 1) : tourGo(0); };
    document.body.appendChild(cap);
    document.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") cap.querySelector(".pr").click(); else if (e.key === "ArrowLeft" && k) tourGo(k - 1); else if (e.key === "Escape") tourEnd(); });
    var t0 = Date.now();
    (function find() {
      if (s.act) {
        var b = document.getElementById("p-cf");
        if (b && !b.disabled) { var on = b.classList.contains("on"); if ((s.act === "cf-on") !== on) b.click(); }
        else if (!b && Date.now() - t0 < 6000) return setTimeout(find, 150);
      }
      if (s.focus) {
        var rs = s.focus.holes.map(holeRect);
        if (rs.some(function (r) { return !r; })) { if (Date.now() - t0 < 6000) setTimeout(find, 150); return; }
        var main = rs[s.focus.ring != null ? s.focus.ring : (s.focus.label ? s.focus.label.at : 0)] || rs[0];
        window.scrollTo({ top: Math.max(0, main.y + main.h / 2 - innerHeight / 2 - 20), behavior: "smooth" });
        if (main.x + main.w / 2 > innerWidth * 0.55) cap.classList.add("left");
        setTimeout(function () { spotlight(s.focus); }, 500);
        addEventListener("resize", function () { spotlight(s.focus, true); });
        setTimeout(function () {   // 화면이 다시 그려진 뒤 자리·스크롤 맞춤
          var m2 = holeRect(s.focus.holes[s.focus.ring != null ? s.focus.ring : 0]);
          if (m2 && (m2.y + m2.h / 2 < scrollY || m2.y + m2.h / 2 > scrollY + innerHeight)) window.scrollTo({ top: Math.max(0, m2.y + m2.h / 2 - innerHeight / 2 - 20), behavior: "smooth" });
          spotlight(s.focus, true);
        }, 1600);
        return;
      }
      if (!s.sel) return;
      var el = document.querySelector(s.sel);
      if (!el || !el.getBoundingClientRect().height) { if (Date.now() - t0 < 6000) setTimeout(find, 150); return; }
      document.querySelectorAll(".lfb-hl").forEach(function (e) { e.classList.remove("lfb-hl"); });
      el.classList.add("lfb-hl");
      setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 900);
    })();
  }

  /* ---------- 스포트라이트: 말하는 곳만 밝게, 그 자리에 표시 하나, 짧은 모션 ---------- */
  var RM = false; try { RM = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function docRect(el) { var r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }
  function union(a, b) { if (!a) return b; var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x: x, y: y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; }
  function holeRect(h) {
    if (h.sel) {
      var el = document.querySelector(h.sel); if (!el || !el.getBoundingClientRect().height) return null;
      if (!h.items) return docRect(el);
      var u = null; Array.prototype.slice.call(el.children, 0, h.items).forEach(function (c) { u = union(u, docRect(c)); }); return u;
    }
    if (h.lanes) {
      var svg = document.getElementById("chart"), g = svg && svg._geo; if (!g || !svg.getBoundingClientRect().height) return null;
      var sr = docRect(svg), vb = svg.viewBox && svg.viewBox.baseVal, k = vb && vb.width ? sr.w / vb.width : 1, y0 = 1e9, y1 = -1e9;
      h.lanes.forEach(function (l) {
        var a = l === "ann" ? 4 : g.P[l].y - 24, b = l === "ann" ? g.TOP - 6 : g.P[l].y + g.P[l].h + 8;
        y0 = Math.min(y0, a); y1 = Math.max(y1, b);
      });
      var ix = function (w) { var i = g.W.indexOf(w); return i < 0 ? (w < g.W[0] ? 0 : g.N - 1) : i; };
      var x0 = h.from != null ? g.L + g.step * ix(h.from) : 0, x1 = h.to != null ? g.L + g.step * (ix(h.to) + 1) : g.R + 56;
      return { x: sr.x + x0 * k, y: sr.y + y0 * k, w: (x1 - x0) * k, h: (y1 - y0) * k };
    }
    return null;
  }
  function clearSpot() { document.querySelectorAll(".lfb-spot,.lfb-lbl").forEach(function (e) { e.remove(); }); }
  function spotlight(f, quiet) {
    var rs = f.holes.map(holeRect); if (rs.some(function (r) { return !r; })) return;
    clearSpot();
    var W = Math.max(document.documentElement.scrollWidth, innerWidth), H = Math.max(document.documentElement.scrollHeight, innerHeight), P = 8, NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "lfb-spot"); svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.style.cssText = "position:absolute;left:0;top:0;z-index:9990;pointer-events:none;transition:opacity .45s;opacity:" + (quiet || RM ? 1 : 0);
    var rr = function (r, rad) { var x = r.x - P, y = r.y - P, w = r.w + 2 * P, h = r.h + 2 * P; return "M" + (x + rad) + "," + y + "H" + (x + w - rad) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + rad) + "V" + (y + h - rad) + "Q" + (x + w) + "," + (y + h) + " " + (x + w - rad) + "," + (y + h) + "H" + (x + rad) + "Q" + x + "," + (y + h) + " " + x + "," + (y + h - rad) + "V" + (y + rad) + "Q" + x + "," + y + " " + (x + rad) + "," + y + "Z"; };
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M0,0H" + W + "V" + H + "H0Z" + rs.map(function (r) { return rr(r, 12); }).join(""));
    path.setAttribute("fill-rule", "evenodd"); path.setAttribute("fill", "rgba(12,17,28,.58)"); svg.appendChild(path);
    if (f.ring != null && rs[f.ring]) {
      var ring = document.createElementNS(NS, "path"); ring.setAttribute("d", rr(rs[f.ring], 12)); ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "#2BC4B6"); ring.setAttribute("stroke-width", "3");
      svg.appendChild(ring);
      if (!quiet && !RM) { var L = ring.getTotalLength ? 0 : 0; requestAnimationFrame(function () { var len = ring.getTotalLength(); ring.style.strokeDasharray = len; ring.style.strokeDashoffset = len; ring.style.transition = "stroke-dashoffset .9s ease-out .35s"; requestAnimationFrame(function () { ring.style.strokeDashoffset = 0; }); }); }
    }
    if (f.events) {
      var cs = document.querySelectorAll("#chart g[style] circle");
      Array.prototype.forEach.call(cs, function (c, i) {
        var r = docRect(c), e = document.createElementNS(NS, "circle");
        e.setAttribute("cx", r.x + r.w / 2); e.setAttribute("cy", r.y + r.h / 2); e.setAttribute("r", 17); e.setAttribute("fill", "none"); e.setAttribute("stroke", "#2BC4B6"); e.setAttribute("stroke-width", "3");
        if (!quiet && !RM) { e.style.opacity = 0; e.style.transformOrigin = (r.x + r.w / 2) + "px " + (r.y + r.h / 2) + "px"; e.style.transform = "scale(1.8)"; e.style.transition = "opacity .35s, transform .35s"; setTimeout(function () { e.style.opacity = 1; e.style.transform = "scale(1)"; }, 600 + i * 280); }
        svg.appendChild(e);
      });
    }
    document.body.appendChild(svg);
    if (!quiet && !RM) requestAnimationFrame(function () { svg.style.opacity = 1; });
    if (f.label && rs[f.label.at]) {
      var r = rs[f.label.at], lb = document.createElement("div"); lb.className = "lfb-lbl";
      var tw = f.label.tween, nf = function (n) { return Math.round(n).toLocaleString("ko-KR"); };
      lb.innerHTML = "<span></span>" + (tw ? ' <s>' + nf(tw[0]) + tw[2] + "</s> → <b>" + nf(quiet || RM ? tw[1] : tw[0]) + "</b>" + tw[2] : "");
      lb.firstChild.textContent = f.label.text;
      document.body.appendChild(lb);
      var above = r.y - P - lb.offsetHeight - 12, top = above > scrollY + 60 ? above : r.y + r.h + P + 12;
      lb.style.left = Math.max(12, Math.min(r.x - P, W - lb.offsetWidth - 12)) + "px"; lb.style.top = top + "px";
      if (!quiet && !RM) { lb.style.opacity = 0; lb.style.transform = "translateY(6px)"; setTimeout(function () { lb.style.opacity = 1; lb.style.transform = "none"; }, 450); }
      if (tw && !quiet && !RM) {
        var bEl = lb.querySelector("b"), t1 = null;
        setTimeout(function () { (function step(ts) { t1 = t1 || ts; var q = Math.min(1, (ts - t1) / 1100), e = 1 - Math.pow(1 - q, 3); bEl.textContent = nf(tw[0] + (tw[1] - tw[0]) * e); if (q < 1) requestAnimationFrame(step); })(performance.now()); requestAnimationFrame(function st(ts) { t1 = ts; }); }, 1100);
      }
    }
  }
  bar.querySelector(".lfb-tour").onclick = function () { tourGo(0); };
  if (tourStep() >= 0 && TOUR[tourStep()] && TOUR[tourStep()].site === here) tourShow(tourStep());
})();
