/* freescripture.org — chapter page interactions
   No frameworks. No tracking. Degrades gracefully.
*/
(function () {
  'use strict';

  /* ---- Translation switcher: preserve verse anchor on click ---- */
  /* When a reader is on /kjv/john/3#v16 and clicks the "WEB" button in the
     switcher (which links to /web/john/3), we want them to land on
     /web/john/3#v16, not /web/john/3. This intercepts the click and adds
     the current page's hash to the destination. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('a.trans-switch__btn[data-trans-switch]');
    if (!btn) return;
    var hash = window.location.hash;
    if (!hash || !hash.startsWith('#v')) return;
    e.preventDefault();
    window.location.href = btn.getAttribute('href') + hash;
  });

  /* ---- Verse anchor highlighting ---- */
  function highlightAnchoredVerse() {
    var hash = window.location.hash;
    if (!hash || !hash.startsWith('#v')) return;
    var el = document.getElementById(hash.slice(1));
    if (!el) return;
    el.classList.add('verse--highlight');
    setTimeout(function () {
      el.classList.remove('verse--highlight');
    }, 3000);
  }

  window.addEventListener('hashchange', highlightAnchoredVerse);
  if (document.readyState !== 'loading') highlightAnchoredVerse();
  else document.addEventListener('DOMContentLoaded', highlightAnchoredVerse);

  /* Click verse number to copy a link to that verse */
  document.addEventListener('click', function (e) {
    var num = e.target.closest('.verse__num');
    if (!num) return;
    e.preventDefault();
    var verse = num.closest('.verse');
    if (!verse) return;
    var url = window.location.origin + window.location.pathname + '#' + verse.id;

    // Update hash for sharing
    history.replaceState(null, '', '#' + verse.id);
    highlightAnchoredVerse();

    // Try to copy
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        flashTooltip(num, 'Link copied');
      }).catch(function () {});
    }
  });

  function flashTooltip(target, message) {
    var tip = document.createElement('span');
    tip.textContent = message;
    tip.style.cssText = 'position:absolute;background:#2a1f15;color:#f4ecd8;font-family:DM Mono,monospace;font-size:0.7rem;padding:4px 8px;border-radius:2px;text-transform:uppercase;letter-spacing:0.08em;pointer-events:none;z-index:50;transform:translate(-50%,-130%);transition:opacity 400ms ease;opacity:0;';
    var rect = target.getBoundingClientRect();
    tip.style.top = (rect.top + window.scrollY) + 'px';
    tip.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
    document.body.appendChild(tip);
    requestAnimationFrame(function () { tip.style.opacity = '1'; });
    setTimeout(function () {
      tip.style.opacity = '0';
      setTimeout(function () { tip.remove(); }, 500);
    }, 1400);
  }

  /* ---- TTS (browser SpeechSynthesis) ---- */
  var ttsBtn = document.querySelector('[data-action="tts"]');
  var ttsLabel = ttsBtn ? ttsBtn.querySelector('.action-btn__text') : null;
  var utterance = null;
  var ttsState = 'idle'; // idle | playing | paused

  function setTTSLabel(text) {
    if (ttsLabel) ttsLabel.textContent = text;
  }

  function ttsStop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    ttsState = 'idle';
    if (ttsBtn) ttsBtn.setAttribute('aria-pressed', 'false');
    setTTSLabel('Listen');
  }

  function ttsStart() {
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support speech synthesis.');
      return;
    }
    var textEl = document.querySelector('.chapter-text');
    if (!textEl) return;

    // Strip verse numbers from spoken text
    var clone = textEl.cloneNode(true);
    clone.querySelectorAll('.verse__num').forEach(function (n) { n.remove(); });
    var text = clone.textContent.replace(/\s+/g, ' ').trim();

    utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Prefer an English voice
    var voices = window.speechSynthesis.getVoices();
    var en = voices.find(function (v) { return v.lang && v.lang.startsWith('en'); });
    if (en) utterance.voice = en;

    utterance.onend = ttsStop;
    utterance.onerror = ttsStop;

    window.speechSynthesis.speak(utterance);
    ttsState = 'playing';
    if (ttsBtn) ttsBtn.setAttribute('aria-pressed', 'true');
    setTTSLabel('Stop');
  }

  if (ttsBtn) {
    ttsBtn.addEventListener('click', function () {
      if (ttsState === 'idle') ttsStart();
      else ttsStop();
    });
    // Pre-load voices on Chrome
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = function () {};
    }
  }

  // Stop TTS when leaving the page
  window.addEventListener('beforeunload', ttsStop);

  /* ---- Copy link button ---- */
  var copyBtn = document.querySelector('[data-action="copy-link"]');
  if (copyBtn) {
    var copyLabel = copyBtn.querySelector('.action-btn__text');
    copyBtn.addEventListener('click', function () {
      var url = window.location.origin + window.location.pathname;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () {
          if (copyLabel) {
            var orig = copyLabel.textContent;
            copyLabel.textContent = 'Copied';
            setTimeout(function () { copyLabel.textContent = orig; }, 1600);
          }
        });
      } else {
        // Fallback for older browsers
        var tmp = document.createElement('input');
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (e) {}
        tmp.remove();
        if (copyLabel) {
          copyLabel.textContent = 'Copied';
          setTimeout(function () { copyLabel.textContent = 'Copy link'; }, 1600);
        }
      }
    });
  }

  var shareBtn = document.querySelector('[data-action="share"]');
  if (shareBtn) {
    if (!navigator.share) {
      shareBtn.style.display = 'none';
    } else {
      shareBtn.addEventListener('click', function () {
        var title = document.title;
        var url = window.location.origin + window.location.pathname;
        navigator.share({ title: title, url: url }).catch(function () {});
      });
    }
  }
})();
