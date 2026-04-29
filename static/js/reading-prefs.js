/* freescripture.org — reading preferences
   Persistent reader-controlled toggles for chapter pages.
   Stored in localStorage under fs-prefs.
   Applied to <html> as data-fs-* attributes (so CSS can react).

   No frameworks, no tracking. Degrades gracefully.
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'fs-prefs';
  var DEFAULTS = {
    font: 'default',     // default | sans | dyslexic
    size: 'default',     // smaller | default | larger | largest
    leading: 'default',  // default | generous | roomy
    layout: 'flowing',   // flowing | verse-per-line
    italics: 'on'        // on | off
  };

  // --- Persistence ---
  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      var parsed = JSON.parse(raw);
      // Merge with defaults so new keys appear if we add them later
      return Object.assign({}, DEFAULTS, parsed);
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      // Quota exceeded or storage unavailable — fail silently
    }
  }

  // --- Apply prefs to <html> ---
  function applyPrefs(prefs) {
    var root = document.documentElement;
    Object.keys(prefs).forEach(function (key) {
      var attr = 'data-fs-' + key;
      var val = prefs[key];
      if (!val || val === DEFAULTS[key]) {
        root.removeAttribute(attr);
      } else {
        root.setAttribute(attr, val);
      }
    });
  }

  // Apply ASAP — before the panel is built — to avoid a flash.
  // (chapter.js loads with defer; this script also loads with defer
  //  and runs after DOM but before the user sees rendered content.)
  var prefs = loadPrefs();
  applyPrefs(prefs);

  // --- Build the panel UI ---
  // Only built on chapter pages (we look for the chapter-text element).
  function build() {
    if (!document.querySelector('.chapter-text')) return;

    // Floating settings button
    var btn = document.createElement('button');
    btn.className = 'reading-prefs-btn';
    btn.setAttribute('aria-label', 'Reading preferences');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M4 7h10"/>' +
      '<path d="M4 12h16"/>' +
      '<path d="M4 17h7"/>' +
      '<circle cx="17" cy="7" r="2.2" fill="currentColor"/>' +
      '<circle cx="13" cy="17" r="2.2" fill="currentColor"/>' +
      '</svg>';
    document.body.appendChild(btn);

    // Panel
    var panel = document.createElement('div');
    panel.className = 'reading-prefs-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Reading preferences');
    panel.innerHTML = panelHTML();
    document.body.appendChild(panel);

    // Wire button to toggle panel
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('reading-prefs-panel--open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      // When opening, hide the floating button so it doesn't peek through
      btn.style.display = open ? 'none' : 'flex';
    });

    // Close button
    panel.querySelector('.reading-prefs-panel__close').addEventListener('click', function () {
      panel.classList.remove('reading-prefs-panel--open');
      btn.setAttribute('aria-expanded', 'false');
      btn.style.display = 'flex';
    });

    // Click outside closes panel
    document.addEventListener('click', function (e) {
      if (!panel.classList.contains('reading-prefs-panel--open')) return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      panel.classList.remove('reading-prefs-panel--open');
      btn.setAttribute('aria-expanded', 'false');
      btn.style.display = 'flex';
    });

    // Escape key closes panel
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('reading-prefs-panel--open')) {
        panel.classList.remove('reading-prefs-panel--open');
        btn.setAttribute('aria-expanded', 'false');
        btn.style.display = 'flex';
        btn.focus();
      }
    });

    // Wire pills
    panel.addEventListener('click', function (e) {
      var pill = e.target.closest('.reading-prefs-pill');
      if (!pill) return;
      var group = pill.getAttribute('data-group');
      var value = pill.getAttribute('data-value');
      if (!group || !value) return;
      prefs[group] = value;
      applyPrefs(prefs);
      savePrefs(prefs);
      updatePillStates(panel);
    });

    // Reset
    panel.querySelector('.reading-prefs-reset').addEventListener('click', function () {
      prefs = Object.assign({}, DEFAULTS);
      applyPrefs(prefs);
      savePrefs(prefs);
      updatePillStates(panel);
    });

    updatePillStates(panel);
  }

  function panelHTML() {
    return [
      '<div class="reading-prefs-panel__head">',
      '  <h2 class="reading-prefs-panel__title">Reading</h2>',
      '  <button class="reading-prefs-panel__close" aria-label="Close">&times;</button>',
      '</div>',

      '<div class="reading-prefs-group">',
      '  <span class="reading-prefs-group__label">Font</span>',
      '  <div class="reading-prefs-group__btns">',
      '    <button class="reading-prefs-pill" data-group="font" data-value="default">Default</button>',
      '    <button class="reading-prefs-pill reading-prefs-pill--font-sans" data-group="font" data-value="sans">Sans</button>',
      '    <button class="reading-prefs-pill reading-prefs-pill--font-dyslexic" data-group="font" data-value="dyslexic">OpenDyslexic</button>',
      '  </div>',
      '</div>',

      '<div class="reading-prefs-group">',
      '  <span class="reading-prefs-group__label">Text size</span>',
      '  <div class="reading-prefs-group__btns">',
      '    <button class="reading-prefs-pill" data-group="size" data-value="smaller">A</button>',
      '    <button class="reading-prefs-pill" data-group="size" data-value="default" style="font-size:1rem;">A</button>',
      '    <button class="reading-prefs-pill" data-group="size" data-value="larger" style="font-size:1.15rem;">A</button>',
      '    <button class="reading-prefs-pill" data-group="size" data-value="largest" style="font-size:1.3rem;">A</button>',
      '  </div>',
      '</div>',

      '<div class="reading-prefs-group">',
      '  <span class="reading-prefs-group__label">Line spacing</span>',
      '  <div class="reading-prefs-group__btns">',
      '    <button class="reading-prefs-pill" data-group="leading" data-value="default">Default</button>',
      '    <button class="reading-prefs-pill" data-group="leading" data-value="generous">Generous</button>',
      '    <button class="reading-prefs-pill" data-group="leading" data-value="roomy">Roomy</button>',
      '  </div>',
      '</div>',

      '<div class="reading-prefs-group">',
      '  <span class="reading-prefs-group__label">Layout</span>',
      '  <div class="reading-prefs-group__btns">',
      '    <button class="reading-prefs-pill" data-group="layout" data-value="flowing">Flowing</button>',
      '    <button class="reading-prefs-pill" data-group="layout" data-value="verse-per-line">One verse per line</button>',
      '  </div>',
      '</div>',

      '<div class="reading-prefs-group">',
      '  <span class="reading-prefs-group__label">Italics for translator additions</span>',
      '  <div class="reading-prefs-group__btns">',
      '    <button class="reading-prefs-pill" data-group="italics" data-value="on">On</button>',
      '    <button class="reading-prefs-pill" data-group="italics" data-value="off">Off</button>',
      '  </div>',
      '</div>',

      '<button class="reading-prefs-reset">Reset to defaults</button>'
    ].join('');
  }

  function updatePillStates(panel) {
    panel.querySelectorAll('.reading-prefs-pill').forEach(function (pill) {
      var group = pill.getAttribute('data-group');
      var value = pill.getAttribute('data-value');
      if (prefs[group] === value) {
        pill.setAttribute('aria-pressed', 'true');
      } else {
        pill.removeAttribute('aria-pressed');
      }
    });
  }

  if (document.readyState !== 'loading') build();
  else document.addEventListener('DOMContentLoaded', build);
})();
