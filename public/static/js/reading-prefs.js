/* Free Scripture — reading preferences panel.
   Senior-first: large controls, plain labels, one setting per row.
   Contract: saves to localStorage 'fs-prefs' and sets data-fs-<key> on
   <html>. Keys: size, leading, layout, font. A tiny inline bootstrap in
   the page <head> applies saved prefs before paint; this file builds the
   panel and handles changes. */
(function () {
  "use strict";

  var STORAGE_KEY = "fs-prefs";
  var DEFAULTS = {
    size: "default",
    leading: "default",
    layout: "verses",
    font: "default",
  };

  var OPTIONS = [
    { key: "size", label: "Text size", choices: [
      { val: "default", label: "Standard" },
      { val: "large", label: "Large" },
      { val: "xlarge", label: "Largest" },
    ]},
    { key: "leading", label: "Space between lines", choices: [
      { val: "tight", label: "Snug" },
      { val: "default", label: "Standard" },
      { val: "loose", label: "Airy" },
    ]},
    { key: "layout", label: "Verse layout", choices: [
      { val: "verses", label: "One per line" },
      { val: "flowing", label: "Flowing" },
    ]},
    { key: "font", label: "Reading font", choices: [
      { val: "default", label: "Standard" },
      { val: "lexend", label: "Lexend" },
      { val: "opendyslexic", label: "OpenDyslexic" },
    ]},
  ];

  function loadPrefs() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return Object.assign({}, DEFAULTS, parsed);
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function savePrefs(prefs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
  }
  function applyPrefs(prefs) {
    var root = document.documentElement;
    Object.keys(DEFAULTS).forEach(function (key) {
      var val = prefs[key];
      if (val && val !== DEFAULTS[key]) root.setAttribute("data-fs-" + key, val);
      else root.removeAttribute("data-fs-" + key);
    });
  }

  var prefs = loadPrefs();
  applyPrefs(prefs);

  var panel = null, overlay = null;

  function buildPanel() {
    overlay = document.createElement("div");
    overlay.className = "prefs-overlay";
    overlay.hidden = true;
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });

    panel = document.createElement("div");
    panel.className = "prefs-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Reading settings");

    var head = document.createElement("div");
    head.className = "prefs-head";
    var title = document.createElement("h2");
    title.className = "prefs-title";
    title.textContent = "Reading settings";
    var closeBtn = document.createElement("button");
    closeBtn.className = "prefs-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close settings");
    closeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    closeBtn.addEventListener("click", close);
    head.appendChild(title);
    head.appendChild(closeBtn);
    panel.appendChild(head);

    OPTIONS.forEach(function (opt) {
      var row = document.createElement("div");
      row.className = "prefs-row";
      var lab = document.createElement("div");
      lab.className = "prefs-label";
      lab.textContent = opt.label;
      row.appendChild(lab);
      var group = document.createElement("div");
      group.className = "prefs-choices";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", opt.label);
      opt.choices.forEach(function (choice) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "prefs-choice";
        btn.textContent = choice.label;
        btn.setAttribute("data-key", opt.key);
        btn.setAttribute("data-val", choice.val);
        var active = prefs[opt.key] === choice.val;
        btn.setAttribute("aria-pressed", active ? "true" : "false");
        if (active) btn.classList.add("is-active");
        btn.addEventListener("click", function () {
          prefs[opt.key] = choice.val;
          applyPrefs(prefs);
          savePrefs(prefs);
          [].forEach.call(group.querySelectorAll(".prefs-choice"), function (b) {
            var on = b.getAttribute("data-val") === choice.val;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
          });
        });
        group.appendChild(btn);
      });
      row.appendChild(group);
      panel.appendChild(row);
    });

    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "prefs-reset";
    reset.textContent = "Reset to standard";
    reset.addEventListener("click", function () {
      prefs = Object.assign({}, DEFAULTS);
      applyPrefs(prefs);
      savePrefs(prefs);
      [].forEach.call(panel.querySelectorAll(".prefs-choice"), function (b) {
        var on = prefs[b.getAttribute("data-key")] === b.getAttribute("data-val");
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    });
    panel.appendChild(reset);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function open() {
    if (!overlay) buildPanel();
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    var first = panel.querySelector(".prefs-close");
    if (first) first.focus();
    document.addEventListener("keydown", onKey);
  }
  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    var opener = document.querySelector("[data-prefs-open]");
    if (opener) opener.focus();
  }
  function onKey(e) { if (e.key === "Escape") close(); }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-prefs-open]");
    if (opener) { e.preventDefault(); open(); }
  });
})();

/* --- Back to top (long chapters) --- */
(function () {
  "use strict";
  if (!document.querySelector(".chapter-text")) return;
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "back-to-top";
  btn.setAttribute("aria-label", "Back to top of chapter");
  btn.tabIndex = -1;
  btn.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg><span>Top</span>';
  btn.addEventListener("click", function () {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
  document.body.appendChild(btn);
  var shown = false;
  function onScroll() {
    var should = window.scrollY > 1200;
    if (should !== shown) {
      shown = should;
      btn.classList.toggle("is-visible", shown);
      btn.tabIndex = shown ? 0 : -1;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
