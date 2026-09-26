/* Free Scripture: the Bible timeline (/timeline/).
   The page works without this file: every part is listed in full.
   This script makes it one part at a time:
   - Tap a part to open it. On wide screens it opens under the columns.
     On phones it opens right under the part you tapped.
   - Sections you open (Key events, People...) stay open as you move on.
   - The link updates to #part-name, so a part can be shared.
   Nothing is saved or sent anywhere. */
(function () {
  /* Wait until React has finished hydrating before touching the page. */
  function whenReady(fn) {
    var done = false;
    function go() { if (done) return; done = true; fn(); }
    if (window.__fsHydrated) go();
    else { window.addEventListener("fs:hydrated", go); setTimeout(go, 5000); }
  }
  whenReady(function () {
  var root = document.querySelector("[data-tl]");
  if (!root) return;
  root.classList.add("tl-js");

  var mq = window.matchMedia("(min-width: 900px)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var box = root.querySelector("[data-tl-panels]");
  var panels = Array.prototype.slice.call(root.querySelectorAll("[data-panel]"));
  var here = root.querySelector("[data-tl-here]");
  var funnel = root.querySelector("[data-tl-funnel]");
  var partsEl = root.querySelector("[data-tl-parts]");
  var showAll = root.querySelector("[data-tl-showall]");
  var current = null, syncing = false, open = {};
  var SECS = ["events", "people", "places", "back", "books"];

  function panelOf(id) { return root.querySelector('[data-panel="' + id + '"]'); }
  function rowOf(id) { return root.querySelector('.tl-row[data-era="' + id + '"]'); }
  function beh() { return reduce.matches ? "auto" : "smooth"; }
  function allMode() { return root.classList.contains("tl-all"); }

  function place() {
    var inline = !mq.matches && !allMode();
    panels.forEach(function (p) {
      var id = p.getAttribute("data-panel");
      if (inline && id === current) {
        var slot = root.querySelector('[data-slot="' + id + '"]');
        if (slot && p.parentNode !== slot) slot.appendChild(p);
      } else if (p.parentNode !== box) {
        box.appendChild(p);
      }
    });
    // Keep the panels in story order inside the list.
    panels.forEach(function (p) { if (p.parentNode === box) box.appendChild(p); });
  }

  function select(id, toggle) {
    current = (!mq.matches && toggle && current === id) ? null : id;
    root.querySelectorAll("[data-era]").forEach(function (n) {
      n.classList.toggle("is-on", n.getAttribute("data-era") === current);
    });
    root.querySelectorAll(".tl-row__btn").forEach(function (a) {
      if (a.getAttribute("data-pick") === current) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    panels.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-panel") === current); });
    var row = current && rowOf(current);
    if (row) { here.hidden = false; here.style.left = row.getAttribute("data-center") + "%"; }
    else here.hidden = true;
    place();
    try {
      history.replaceState(null, "", current ? "#" + current : location.pathname + location.search);
    } catch (e) {}
  }

  function setOpen(sec, v) {
    open[sec] = v;
    syncing = true;
    root.querySelectorAll('details[data-sec="' + sec + '"]').forEach(function (d) { if (d.open !== v) d.open = v; });
    syncing = false;
    labelOpenAll();
  }
  function everyOpen() { return SECS.every(function (s) { return open[s]; }); }
  function labelOpenAll() {
    root.querySelectorAll("[data-tl-openall]").forEach(function (b) { b.textContent = everyOpen() ? "Close all" : "Open all"; });
  }

  root.addEventListener("toggle", function (ev) {
    var d = ev.target;
    if (syncing || !d.getAttribute || !d.getAttribute("data-sec")) return;
    setOpen(d.getAttribute("data-sec"), d.open);
  }, true);

  root.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-tl-openall], [data-tl-showall], [data-go], [data-pick]");
    if (!t) return;
    if (t.hasAttribute("data-tl-openall")) {
      var v = !everyOpen();
      SECS.forEach(function (s) { setOpen(s, v); });
      return;
    }
    if (t.hasAttribute("data-tl-showall")) {
      root.classList.toggle("tl-all");
      t.textContent = allMode() ? "Show one part at a time" : "Show every part as one list";
      place();
      return;
    }
    ev.preventDefault();
    var id = t.getAttribute("data-go") || t.getAttribute("data-pick");
    var isGo = t.hasAttribute("data-go");
    select(id, !isGo);
    var p = panelOf(id);
    if (!current || !p) return;
    if (mq.matches || allMode()) p.scrollIntoView({ block: isGo || allMode() ? "start" : "nearest", behavior: beh() });
    else if (isGo) { var r = rowOf(id); if (r) r.scrollIntoView({ block: "start", behavior: beh() }); }
  });

  partsEl.addEventListener("keydown", function (ev) {
    if (!ev.target.classList.contains("tl-row__btn")) return;
    var list = Array.prototype.slice.call(partsEl.querySelectorAll(".tl-row__btn"));
    var i = list.indexOf(ev.target), to = null;
    if (ev.key === "ArrowDown" || ev.key === "ArrowRight") to = list[i + 1];
    if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") to = list[i - 1];
    if (to) { to.focus(); ev.preventDefault(); }
  });

  /* The colored wedges that join each part of the band to its column. */
  var FROM = [null, -1880, -930, -6], TO = [-1880, -930, -6, 100];
  function x(y) { return (y + 2250) / 2430 * 100; }
  function drawFunnel() {
    if (!mq.matches || !funnel) return;
    var b = funnel.getBoundingClientRect(), W = b.width, H = 44, out = "";
    if (!W) return;
    funnel.setAttribute("viewBox", "0 0 " + W + " " + H);
    Array.prototype.forEach.call(partsEl.children, function (col, i) {
      var r = col.getBoundingClientRect();
      var x1 = (FROM[i] == null ? 0 : x(FROM[i])) * W / 100, x2 = x(TO[i]) * W / 100;
      out += '<polygon class="tl-funnel__part tl-t' + (i + 1) + '" points="' + x1 + ",0 " + x2 + ",0 " +
        (r.right - b.left) + "," + H + " " + (r.left - b.left) + "," + H + '"/>';
    });
    funnel.innerHTML = out;
  }

  function onMode() { if (mq.matches && !current) select("the-beginning", false); else place(); drawFunnel(); }
  if (mq.addEventListener) mq.addEventListener("change", onMode); else if (mq.addListener) mq.addListener(onMode);
  window.addEventListener("resize", drawFunnel);

  root.querySelectorAll("[data-tl-openall]").forEach(function (b) { b.hidden = false; });
  if (showAll) showAll.hidden = false;

  var start = (location.hash || "").slice(1);
  if (start && panelOf(start)) {
    select(start, false);
    var target = mq.matches ? panelOf(start) : rowOf(start);
    if (target) setTimeout(function () { target.scrollIntoView({ block: "start" }); }, 0);
  } else if (mq.matches) {
    select("the-beginning", false);
  }
  drawFunnel();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawFunnel);
  });
})();
