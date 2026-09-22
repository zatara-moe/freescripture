/* Free Scripture — keyboard shortcuts
   Site-wide layer. Chapter-specific behavior (prev/next chapter) only
   fires when the chapter-foot nav exists on the page, so this file is
   safe to load on every page without checking the route first.

   Design rule: shortcuts never fire while the user is typing. Every
   handler checks the active element first. Escape and the "?" overlay
   are the discoverability fix — without them, everything below is
   invisible to a first-time user, keyboard shortcuts or not. */
(function () {
  function typing() {
    var el = document.activeElement;
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function go(url) { if (url) window.location.href = url; }

  function chapterNav(which) {
    var foot = document.querySelector('.chapter-foot__nav');
    if (!foot) return;
    if (which === 'next') {
      var next = foot.querySelector('a.next');
      if (next) go(next.getAttribute('href'));
    } else {
      var prev = null;
      [].forEach.call(foot.querySelectorAll('a'), function (a) {
        if (!a.classList.contains('next')) prev = a;
      });
      if (prev) go(prev.getAttribute('href'));
    }
  }

  function toggleHelp(show) {
    var modal = document.getElementById('shortcuts-help');
    if (!modal) return;
    var wantOpen = show === undefined ? modal.hidden : show;
    modal.hidden = !wantOpen;
    if (wantOpen) {
      var closeBtn = modal.querySelector('[data-shortcuts-close]');
      if (closeBtn) closeBtn.focus();
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Escape always closes the help overlay if it's open, regardless
    // of typing state.
    if (e.key === 'Escape') {
      var modal = document.getElementById('shortcuts-help');
      if (modal && !modal.hidden) { toggleHelp(false); e.preventDefault(); }
      return;
    }

    if (typing()) return;

    switch (e.key) {
      case '?':
        toggleHelp();
        e.preventDefault();
        break;
      case '/':
        e.preventDefault();
        go('/search/');
        break;
      case 'ArrowLeft':
        chapterNav('prev');
        break;
      case 'ArrowRight':
        chapterNav('next');
        break;
      case 'd':
      case 'D': {
        var btn = document.querySelector('[data-prefs-open]');
        if (btn) btn.click();
        break;
      }
      case 't':
      case 'T': {
        var toggle = document.querySelector('[data-theme-toggle]');
        if (toggle) toggle.click();
        break;
      }
      case 'g':
      case 'G': {
        var focusToggle = document.querySelector('[data-fs-quick="focus"][data-val="on"]');
        var focusExit = document.querySelector('.focus-exit');
        var isFocused = document.documentElement.getAttribute('data-fs-focus') === 'on';
        if (isFocused && focusExit) focusExit.click();
        else if (focusToggle) focusToggle.click();
        break;
      }
    }
  });

  // Wire the help overlay's own close controls once the DOM is ready.
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-shortcuts-close]')) toggleHelp(false);
    if (e.target.closest('[data-shortcuts-open]')) toggleHelp(true);
    // Click on the dimmed backdrop (the modal element itself, not its content) closes it.
    if (e.target.id === 'shortcuts-help') toggleHelp(false);
  });

  /* ---- First-visit tip: teaches swipe/arrow chapter navigation the
     first time someone lands on a chapter page. Shown once, ever,
     tracked in localStorage. Auto-dismisses; also closable by hand. ---- */
  function maybeShowTip() {
    var foot = document.querySelector('.chapter-foot__nav');
    if (!foot) return; // not a chapter page
    var tip = document.getElementById('nav-tip');
    if (!tip) return;
    var KEY = 'fs-seen-nav-tip';
    try {
      if (localStorage.getItem(KEY)) return;
      localStorage.setItem(KEY, '1');
    } catch (e) { return; }
    tip.hidden = false;
    var timer = setTimeout(function () { tip.hidden = true; }, 6000);
    tip.addEventListener('click', function (e) {
      if (e.target.closest('[data-tip-close]')) {
        clearTimeout(timer);
        tip.hidden = true;
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeShowTip);
  } else {
    maybeShowTip();
  }
})();
