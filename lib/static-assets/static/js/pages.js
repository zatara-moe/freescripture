/* Free Scripture — paged reading.
   Turns the chapter or story you are on into a book you page through.
   Off by default: it switches on when Display is set to Pages, and the
   scrolling page stays exactly as it was underneath.
   Contract: reads data-fs-reading (scroll|pages) and data-fs-turn
   (paper|slide|none) from <html>, which reading-prefs.js manages. */
(function () {
  "use strict";
  var root = document.documentElement;
  var source = document.querySelector(".chapter-text, .story-text");
  if (!source) return;

  var ui = null, S = {};

  function turnStyle() {
    var t = root.getAttribute("data-fs-turn") || "paper";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && !root.getAttribute("data-fs-turn")) return "none";
    return t;
  }

  /* ---- the verse the reader is looking at, so their place survives ---- */
  function anchorFromScroll() {
    var vs = source.querySelectorAll("[id^='v']");
    for (var i = 0; i < vs.length; i++) {
      var r = vs[i].getBoundingClientRect();
      if (r.bottom > 80) return vs[i].id;
    }
    return null;
  }
  function currentAnchor() {
    if (!ui || !S.step) return S.anchor || null;
    var ps = ui.flowL.querySelectorAll("[data-pg-a]");
    var left = S.page * S.step;
    for (var i = 0; i < ps.length; i++) if (ps[i].offsetLeft >= left - 2) return ps[i].getAttribute("data-pg-a");
    return null;
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function build() {
    var title = document.querySelector(".chapter-title, .story-title");
    var sub = document.querySelector(".chapter-translation-tag, .story-eyebrow");
    var nextLink = document.querySelector(".chapter-foot__nav a.next") || document.querySelector(".story-foot a.next");
    var prevLink = null;
    var footLinks = document.querySelectorAll(".chapter-foot__nav a");
    for (var i = 0; i < footLinks.length; i++) if (!footLinks[i].classList.contains("next")) prevLink = footLinks[i];

    var wrap = el("div", "pg");
    wrap.innerHTML =
      '<header class="pg__bar pg__bar--top"><div class="pg__bar-in">' +
        '<div class="pg__crumb"><span class="pg__crumb-title"></span><span class="pg__crumb-sub"></span></div>' +
        '<span class="pg__spacer"></span>' +
        '<button class="pg__icon" type="button" data-prefs-open aria-label="Display settings">Aa</button>' +
        '<button class="pg__done" type="button" data-pg-close>Done</button>' +
      '</div></header>' +
      '<div class="pg__stage"><div class="pg__book">' +
        '<div class="pg__page pg__page--l"><div class="pg__vp"><div class="pg__flow chapter-text"></div></div><div class="pg__folio"></div></div>' +
        '<div class="pg__page pg__page--r"><div class="pg__vp"><div class="pg__flow chapter-text"></div></div><div class="pg__folio"></div></div>' +
        '<button class="pg__zone pg__zone--prev" type="button" aria-label="Previous page"></button>' +
        '<button class="pg__zone pg__zone--next" type="button" aria-label="Next page"></button>' +
      '</div></div>' +
      '<footer class="pg__bar pg__bar--bottom"><div class="pg__bar-in">' +
        '<button class="pg__nav" type="button" data-pg-prev aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>' +
        '<div class="pg__track" data-pg-track><div class="pg__rail"><div class="pg__fill"></div></div><div class="pg__label"></div></div>' +
        '<button class="pg__nav" type="button" data-pg-next aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>' +
      '</div></footer>';
    document.body.appendChild(wrap);

    ui = {
      wrap: wrap,
      book: wrap.querySelector(".pg__book"),
      pageL: wrap.querySelector(".pg__page--l"),
      pageR: wrap.querySelector(".pg__page--r"),
      flowL: wrap.querySelector(".pg__page--l .pg__flow"),
      flowR: wrap.querySelector(".pg__page--r .pg__flow"),
      folioL: wrap.querySelector(".pg__page--l .pg__folio"),
      folioR: wrap.querySelector(".pg__page--r .pg__folio"),
      fill: wrap.querySelector(".pg__fill"),
      label: wrap.querySelector(".pg__label"),
      prev: wrap.querySelector("[data-pg-prev]"),
      next: wrap.querySelector("[data-pg-next]")
    };
    wrap.querySelector(".pg__crumb-title").textContent = title ? title.textContent.trim() : document.title;
    wrap.querySelector(".pg__crumb-sub").textContent = sub ? sub.textContent.trim() : "";

    /* content, plus an end of chapter card so the last page is never a wall */
    var html = source.innerHTML;
    var endTitle = nextLink ? (nextLink.querySelector(".label") ? nextLink.querySelector(".label").textContent.trim() : "Next") : null;
    var end = '<div class="pg__end"><div class="pg__end-label">End of ' +
      (title ? title.textContent.trim() : "this reading") + "</div>";
    if (nextLink) end += '<a class="pg__end-btn" href="' + nextLink.getAttribute("href") + '">' + endTitle +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></a>';
    end += "</div>";
    ui.flowL.innerHTML = html + end;
    ui.flowR.innerHTML = html + end;

    /* mark anchors: verses where we have them, paragraphs otherwise */
    [ui.flowL, ui.flowR].forEach(function (f) {
      var kids = f.children, n = 0;
      for (var i = 0; i < kids.length; i++) {
        var id = kids[i].id || "";
        kids[i].setAttribute("data-pg-a", id && id.charAt(0) === "v" ? id : "p" + (n++));
        kids[i].removeAttribute("id");
      }
    });

    S.prevHref = prevLink ? prevLink.getAttribute("href") : null;
    S.nextHref = nextLink ? nextLink.getAttribute("href") : null;
    wire();
    S.page = 0;
    layout(S.anchor);
    coach();
  }

  function destroy() {
    if (!ui) return;
    ui.wrap.remove();
    ui = null;
    document.documentElement.style.removeProperty("overflow");
    if (S.anchor) {
      var t = document.getElementById(S.anchor);
      if (t) t.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }

  function layout(anchorIn) {
    if (!ui) return;
    var anchor = anchorIn !== undefined ? anchorIn : currentAnchor();
    var vw = window.innerWidth, vh = window.innerHeight;
    S.spread = vw >= 1024;
    ui.wrap.setAttribute("data-spread", S.spread ? "1" : "0");
    ui.pageR.style.display = S.spread ? "" : "none";

    var chrome = ui.wrap.getAttribute("data-chrome") === "off" ? 40 : 150;
    var padX = vw < 700 ? 22 : 40, padY = vw < 700 ? 22 : 34;
    var pageW = S.spread ? Math.min(440, (Math.min(1180, vw - 80)) / 2) : Math.min(620, vw - (vw < 700 ? 16 : 80));
    var pageH = Math.min(Math.max(320, vh - chrome), 900);
    [ui.pageL, ui.pageR].forEach(function (p) { p.style.width = pageW + "px"; p.style.height = pageH + "px"; });

    var colW = pageW - padX * 2, colH = pageH - padY * 2 - 26;
    [ui.flowL, ui.flowR].forEach(function (f) {
      /* Offset with position, not padding: the site sets border-box
         sizing, so padding would shrink the column and drift the pages. */
      f.style.padding = "0";
      f.style.left = padX + "px";
      f.style.top = padY + "px";
      f.style.width = colW + "px";
      f.style.height = colH + "px";
      f.style.columnWidth = colW + "px";
      f.style.columnGap = (padX * 2) + "px";
    });
    S.step = colW + padX * 2;
    S.pages = Math.max(1, Math.round(ui.flowL.scrollWidth / S.step));
    S.per = S.spread ? 2 : 1;
    S.maxPage = Math.max(0, S.pages - S.per);

    if (anchor) {
      var p = ui.flowL.querySelector('[data-pg-a="' + anchor + '"]');
      if (p) {
        var page = Math.floor((p.offsetLeft + 2) / S.step);
        if (S.spread && page % 2) page--;
        S.page = Math.max(0, Math.min(S.maxPage, page));
      }
    }
    if (S.page > S.maxPage) S.page = S.maxPage;
    if (S.spread && S.page % 2) S.page--;
    if (S.page < 0) S.page = 0;
    render();
  }

  function render() {
    ui.flowL.style.transform = "translateX(" + (-S.page * S.step) + "px)";
    if (S.spread) ui.flowR.style.transform = "translateX(" + (-(S.page + 1) * S.step) + "px)";
    ui.folioL.textContent = S.page + 1;
    ui.folioR.textContent = S.spread ? S.page + 2 : "";
    var shown = Math.min(S.page + S.per, S.pages);
    var left = Math.max(1, Math.round((S.words || 0) * (1 - shown / S.pages) / 200));
    var time = shown >= S.pages ? "End" : "About " + left + " min left";
    ui.label.textContent = (S.per === 2 ? "Pages " + (S.page + 1) + " to " + shown : "Page " + (S.page + 1)) +
      " of " + S.pages + " · " + time;
    ui.fill.style.width = ((shown / S.pages) * 100) + "%";
    ui.prev.disabled = S.page <= 0;
    ui.next.disabled = S.page >= S.maxPage;
    S.anchor = currentAnchor();
  }

  function turn(dir) {
    if (!ui || S.busy) return;
    var target = S.page + dir * S.per;
    if (target < 0) { if (S.prevHref && S.page === 0) window.location.href = S.prevHref; return; }
    if (target > S.maxPage) return;
    var style = turnStyle();
    if (style === "none") { S.page = target; render(); return; }
    S.busy = true;

    var src = S.spread ? (dir > 0 ? ui.pageR : ui.pageL) : ui.pageL;
    var r = src.getBoundingClientRect(), br = ui.book.getBoundingClientRect();

    if (style === "slide") {
      var f = S.spread ? [ui.flowL, ui.flowR] : [ui.flowL];
      f.forEach(function (x) { x.classList.add(dir > 0 ? "pg-out" : "pg-in"); });
      setTimeout(function () {
        S.page = target; render();
        f.forEach(function (x) { x.classList.remove("pg-out", "pg-in"); x.classList.add(dir > 0 ? "pg-in" : "pg-out"); });
        setTimeout(function () { f.forEach(function (x) { x.classList.remove("pg-in", "pg-out"); }); S.busy = false; }, 260);
      }, 260);
      return;
    }

    var full = S.spread ? 178 : 96, dur = S.spread ? 520 : 420;
    var leaf = el("div", "pg__leaf");
    leaf.style.left = (r.left - br.left) + "px";
    leaf.style.width = r.width + "px";
    leaf.style.height = r.height + "px";
    leaf.style.transformOrigin = dir > 0 ? "left center" : "right center";

    var face = el("div", "pg__leaf-face");
    face.style.borderRadius = dir > 0 ? "2px 10px 10px 2px" : "10px 2px 2px 10px";
    var faceClone = (dir > 0 && S.spread ? ui.flowR : ui.flowL).cloneNode(true);
    if (dir < 0) faceClone.style.transform = "translateX(" + (-target * S.step) + "px)";
    face.appendChild(faceClone);
    face.appendChild(el("div", "pg__leaf-shade"));

    var back = el("div", "pg__leaf-back");
    var backWrap = el("div", "pg__leaf-backwrap");
    var backClone = ui.flowL.cloneNode(true);
    backClone.style.transform = "translateX(" + (-(dir > 0 ? target : S.page) * S.step) + "px)";
    backWrap.appendChild(backClone);
    back.appendChild(backWrap);

    leaf.appendChild(face); leaf.appendChild(back);
    leaf.style.transform = dir > 0 ? "rotateY(0deg)" : "rotateY(-" + full + "deg)";
    if (!S.spread && dir < 0) leaf.style.opacity = "0";
    ui.book.appendChild(leaf);
    leaf.getBoundingClientRect();

    if (dir > 0) { S.page = target; render(); }
    leaf.classList.add("is-turning");
    leaf.style.transition = "transform " + dur + "ms cubic-bezier(.36,.16,.2,1), opacity " +
      Math.round(dur * 0.45) + "ms linear " + Math.round(dur * 0.55) + "ms";
    leaf.style.transform = dir > 0 ? "rotateY(-" + full + "deg)" : "rotateY(0deg)";
    if (!S.spread) leaf.style.opacity = dir > 0 ? "0" : "1";

    var done = function () {
      if (dir < 0) { S.page = target; render(); }
      leaf.remove(); S.busy = false;
    };
    leaf.addEventListener("transitionend", function (e) { if (e.propertyName === "transform") done(); }, { once: true });
    setTimeout(function () { if (document.body.contains(leaf)) done(); }, dur + 240);
  }

  function coach() {
    try { if (localStorage.getItem("fs-pages-coach") === "1") return; } catch (e) { return; }
    var c = el("div", "pg__coach",
      '<div class="pg__coach-row">Tap the right side, or swipe, to turn the page.</div>' +
      '<div class="pg__coach-row">Tap the middle to hide everything but the words.</div>' +
      '<button class="pg__coach-btn" type="button">Got it</button>');
    ui.wrap.appendChild(c);
    setTimeout(function () { c.classList.add("is-on"); }, 500);
    c.querySelector("button").addEventListener("click", function (e) {
      e.stopPropagation(); c.remove();
      try { localStorage.setItem("fs-pages-coach", "1"); } catch (e2) {}
    });
  }

  function wire() {
    var w = ui.wrap;
    w.addEventListener("click", function (e) {
      if (e.target.closest("[data-pg-close]")) { setPref("reading", "scroll"); return; }
      if (e.target.closest("[data-prefs-open]")) return;
      if (e.target.closest("[data-pg-next]") || e.target.closest(".pg__zone--next")) { turn(1); return; }
      if (e.target.closest("[data-pg-prev]") || e.target.closest(".pg__zone--prev")) { turn(-1); return; }
      if (e.target.closest(".pg__end-btn") || e.target.closest(".pg__bar")) return;
      if (e.target.closest(".pg__stage")) {
        var off = w.getAttribute("data-chrome") === "off";
        w.setAttribute("data-chrome", off ? "on" : "off");
        setTimeout(function () { layout(); }, 300);
      }
    });
    w.querySelector("[data-pg-track]").addEventListener("click", function (e) {
      var rect = e.currentTarget.getBoundingClientRect();
      var p = Math.round(((e.clientX - rect.left) / rect.width) * (S.pages - 1));
      if (S.spread && p % 2) p--;
      S.page = Math.max(0, Math.min(S.maxPage, p)); render();
    });
    var tx = 0, ty = 0;
    w.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    w.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function setPref(key, val) {
    try {
      var p = JSON.parse(localStorage.getItem("fs-prefs") || "{}");
      p[key] = val;
      localStorage.setItem("fs-prefs", JSON.stringify(p));
    } catch (e) {}
    root.setAttribute("data-fs-" + key, val);
    if (val === "scroll") root.removeAttribute("data-fs-reading");
    sync();
  }

  /* keyboard: only while the reader is open, and never while typing */
  document.addEventListener("keydown", function (e) {
    if (!ui) return;
    var t = document.activeElement;
    if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); turn(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
    else if (e.key === "Escape") setPref("reading", "scroll");
  }, true);

  var rt;
  window.addEventListener("resize", function () {
    if (!ui) return;
    var a = currentAnchor();
    clearTimeout(rt);
    rt = setTimeout(function () { layout(a); }, 140);
  });

  function sync() {
    var want = root.getAttribute("data-fs-reading") === "pages";
    if (want && !ui) {
      S.anchor = anchorFromScroll();
      S.words = (source.textContent || "").split(/\s+/).length;
      document.documentElement.style.overflow = "hidden";
      build();
    } else if (!want && ui) {
      destroy();
    } else if (want && ui) {
      layout();
    }
  }

  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-fs-reading", "data-fs-size", "data-fs-leading", "data-fs-font", "data-fs-theme", "data-fs-turn"] });
  if (document.readyState !== "loading") sync();
  else document.addEventListener("DOMContentLoaded", sync);
})();
