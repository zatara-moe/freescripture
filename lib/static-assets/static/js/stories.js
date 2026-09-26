/* Free Scripture: the Stories list.
   Filters (feeling, kind, length, ready now), a find box, live counts, and a
   preview before you open anything.

   Rules that keep it predictable:
   - Every filter shows how many results you would get before you tap it.
   - Filters you picked always show as chips you can remove.
   - "Coming soon" items never show when you filter by feeling, so a
     feeling never leads to nothing you can read.
   - The address updates (?feel=anxious), so Back and shared links work. */
(function () {
  "use strict";
  /* Wait until React has finished hydrating before touching the page. */
  function whenReady(fn) {
    var done = false;
    function go() { if (done) return; done = true; fn(); }
    if (window.__fsHydrated) go();
    else { window.addEventListener("fs:hydrated", go); setTimeout(go, 5000); }
  }
  whenReady(function () {
  var list = document.querySelector("[data-list]");
  if (!list) return;
  var form = document.querySelector("[data-filters]");
  var items = Array.prototype.slice.call(list.querySelectorAll(".cat-item"));
  var q = document.querySelector("[data-cat-q]");
  var line = document.querySelector("[data-result-line]");
  var active = document.querySelector("[data-active]");
  var empty = document.querySelector("[data-empty]");
  var preview = document.querySelector("[data-preview]");
  var pvBody = document.querySelector("[data-preview-body]");
  var filterBtn = document.querySelector("[data-filters-open]");
  var filterLabel = document.querySelector("[data-filter-label]");
  var applyBtn = document.querySelector("[data-filters-apply]");
  var backdrop = document.createElement("div");
  backdrop.className = "verse-backdrop";
  backdrop.hidden = true;
  document.body.appendChild(backdrop);
  document.documentElement.classList.add("has-cat-js");
  if (filterBtn) filterBtn.hidden = false;

  var LABELS = {};
  Array.prototype.forEach.call(form.querySelectorAll("input"), function (i) {
    var t = i.parentNode.querySelector(".fopt__label");
    LABELS[i.name + ":" + i.value] = t ? t.firstChild.textContent.trim() : i.value;
  });

  function isSheet() { return window.matchMedia("(max-width: 999px)").matches; }
  function checked(name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (i) { return i.value; });
  }
  function state() {
    return { feel: checked("feel"), kind: checked("kind"), len: checked("len"), ready: checked("ready").length > 0, q: (q && q.value || "").trim().toLowerCase() };
  }
  function match(it, f) {
    var d = it.dataset;
    if (f.ready && d.status === "Coming soon") return false;
    if (f.feel.length) {
      if (d.status === "Coming soon") return false;
      var fs = (d.feel || "").split(" ");
      if (!f.feel.some(function (x) { return fs.indexOf(x) >= 0; })) return false;
    }
    if (f.kind.length && f.kind.indexOf(d.kind) < 0) return false;
    if (f.len.length && f.len.indexOf(d.len) < 0) return false;
    if (f.q && d.find.indexOf(f.q) < 0) return false;
    return true;
  }

  var pageEl = document.querySelector(".cat-page");
  var quick = Array.prototype.slice.call(document.querySelectorAll("[data-quick-feel]"));

  function update(opts) {
    var f = state();
    /* Shelves when browsing. The plain list as soon as you filter or search. */
    var filtering = f.feel.length || f.kind.length || f.len.length || f.ready || f.q;
    if (pageEl) pageEl.classList.toggle("is-filtering", !!filtering);
    quick.forEach(function (b) { b.setAttribute("aria-pressed", String(f.feel.indexOf(b.getAttribute("data-quick-feel")) >= 0)); });
    var n = 0;
    items.forEach(function (it) { var ok = match(it, f); it.hidden = !ok; if (ok) n++; });
    empty.hidden = n > 0;

    /* counts: what you'd get if you picked just this option in its group */
    Array.prototype.forEach.call(form.querySelectorAll("[data-n]"), function (span) {
      var parts = span.getAttribute("data-n").split(":");
      var test = { feel: f.feel, kind: f.kind, len: f.len, ready: f.ready, q: f.q };
      test[parts[0]] = [parts[1]];
      var c = items.filter(function (it) { return match(it, test); }).length;
      span.textContent = c;
      span.parentNode.classList.toggle("is-zero", c === 0 && !span.parentNode.querySelector("input").checked);
    });

    var chips = [];
    ["feel", "kind", "len"].forEach(function (g) {
      f[g].forEach(function (v) { chips.push({ g: g, v: v, label: LABELS[g + ":" + v] }); });
    });
    if (f.ready) chips.push({ g: "ready", v: "1", label: "Can read now" });
    active.innerHTML = chips.map(function (c) {
      return '<button type="button" class="chip-active" data-remove="' + c.g + ":" + c.v + '" aria-label="Remove filter: ' + c.label + '">' + c.label +
        ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
    }).join("") + (chips.length ? '<button type="button" class="link-btn" data-clear>Clear all</button>' : "");
    active.hidden = chips.length === 0;

    line.textContent = filtering ? "Showing " + n + " of " + items.length : "";
    if (filterLabel) filterLabel.textContent = chips.length ? "Filters (" + chips.length + ")" : "Filters";
    if (applyBtn) applyBtn.textContent = n === 1 ? "Show 1 result" : "Show " + n + " results";

    if (!opts || opts.url !== false) {
      var p = new URLSearchParams();
      if (f.feel.length) p.set("feel", f.feel.join(","));
      if (f.kind.length) p.set("kind", f.kind.join(","));
      if (f.len.length) p.set("len", f.len.join(","));
      if (f.ready) p.set("ready", "1");
      var qs = p.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
    }
  }

  /* read the address: /stories/?feel=anxious,lonely&kind=Parable */
  var params = new URLSearchParams(location.search);
  ["feel", "kind", "len"].forEach(function (g) {
    (params.get(g) || "").split(",").filter(Boolean).forEach(function (v) {
      var box = form.querySelector('input[name="' + g + '"][value="' + v + '"]');
      if (box) box.checked = true;
    });
  });
  if (params.get("ready")) form.querySelector('input[name="ready"]').checked = true;

  form.addEventListener("change", function () { update(); });
  if (q) q.addEventListener("input", function () { update({ url: false }); });
  document.addEventListener("click", function (e) {
    var r = e.target.closest("[data-remove]");
    if (r) {
      var parts = r.getAttribute("data-remove").split(":");
      var box = form.querySelector('input[name="' + parts[0] + '"][value="' + parts[1] + '"]');
      if (box) box.checked = false;
      update();
      return;
    }
    if (e.target.closest("[data-clear]")) {
      Array.prototype.forEach.call(form.querySelectorAll("input:checked"), function (i) { i.checked = false; });
      if (q) q.value = "";
      update();
    }
  });

  quick.forEach(function (b) {
    b.addEventListener("click", function () {
      var box = form.querySelector('input[name="feel"][value="' + b.getAttribute("data-quick-feel") + '"]');
      if (box) { box.checked = !box.checked; update(); }
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-see-kind]"), function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      a.getAttribute("data-see-kind").split(",").forEach(function (k) {
        var box = form.querySelector('input[name="kind"][value="' + k + '"]');
        if (box) box.checked = true;
      });
      update();
      line.scrollIntoView({ block: "start" });
    });
  });
  var shelvesEl = document.querySelector("[data-shelves]");
  if (shelvesEl) {
    shelvesEl.addEventListener("click", function (e) {
      var cover = e.target.closest("[data-cover]");
      if (!cover || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      var item = list.querySelector('.cat-item[data-id="' + cover.getAttribute("data-cover") + '"]');
      if (!item) return;
      e.preventDefault();
      showPreview(item, cover);
    });
    /* scroll arrows, for mouse users; touch users swipe */
    Array.prototype.forEach.call(shelvesEl.querySelectorAll(".shelf2__rowwrap"), function (wrap) {
      var row = wrap.querySelector("[data-row]");
      var btns = wrap.querySelectorAll("[data-scroll]");
      function sync() {
        var can = row.scrollWidth > row.clientWidth + 4 && window.matchMedia("(hover: hover)").matches;
        btns[0].hidden = !can || row.scrollLeft < 4;
        btns[1].hidden = !can || row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
      }
      Array.prototype.forEach.call(btns, function (b) {
        b.addEventListener("click", function () { row.scrollBy({ left: +b.getAttribute("data-scroll") * row.clientWidth * 0.8, behavior: "smooth" }); });
      });
      row.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);
      sync();
    });
  }

  /* ---- filter sheet (phones and tablets) ---- */
  function openFilters() { form.classList.add("is-open"); backdrop.hidden = false; document.body.classList.add("sheet-open"); var c = form.querySelector("[data-filters-close]"); if (c) c.focus(); }
  function closeFilters() { form.classList.remove("is-open"); if (!preview.classList.contains("is-open")) { backdrop.hidden = true; document.body.classList.remove("sheet-open"); } if (filterBtn && isSheet()) filterBtn.focus(); }
  if (filterBtn) filterBtn.addEventListener("click", openFilters);
  form.querySelector("[data-filters-close]").addEventListener("click", closeFilters);
  if (applyBtn) applyBtn.addEventListener("click", closeFilters);

  /* ---- preview: see what's inside before you go ---- */
  var lastCard = null;
  function showPreview(item, card) {
    var src = item.querySelector("[data-inside] > .pv");
    if (!src) return;
    pvBody.innerHTML = "";
    pvBody.appendChild(src.cloneNode(true));
    items.forEach(function (it) { it.classList.toggle("is-picked", it === item); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-cover]"), function (c) { c.classList.toggle("is-picked", c.getAttribute("data-cover") === item.getAttribute("data-id")); });
    lastCard = card;
    if (isSheet()) {
      preview.classList.add("is-open");
      backdrop.hidden = false;
      document.body.classList.add("sheet-open");
    }
    var open = pvBody.querySelector(".btn--primary");
    if (open && isSheet()) open.focus();
  }
  function closePreview() {
    preview.classList.remove("is-open");
    if (!form.classList.contains("is-open")) { backdrop.hidden = true; document.body.classList.remove("sheet-open"); }
    if (lastCard) lastCard.focus();
  }
  list.addEventListener("click", function (e) {
    var card = e.target.closest(".cat-card");
    if (!card || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    showPreview(card.closest(".cat-item"), card);
  });
  document.querySelector("[data-preview-close]").addEventListener("click", closePreview);
  backdrop.addEventListener("click", function () { if (preview.classList.contains("is-open")) closePreview(); if (form.classList.contains("is-open")) closeFilters(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (preview.classList.contains("is-open")) closePreview();
    else if (form.classList.contains("is-open")) closeFilters();
  });

  update({ url: false });
  /* desktop: show the first visible item so the preview column is never blank */
  if (!isSheet()) {
    var first = items.filter(function (it) { return !it.hidden; })[0];
    if (first) showPreview(first, first.querySelector(".cat-card"));
    if (lastCard && pageEl && !pageEl.classList.contains("is-filtering")) lastCard = null;
  }
  if (pageEl) pageEl.classList.add("cat-ready");
  });
})();
