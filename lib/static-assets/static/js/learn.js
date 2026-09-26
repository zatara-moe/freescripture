/* Free Scripture: learning features.
   Used on story pages, the home page, and the Memorize page.

   Story pages
     Steps           Story, Meaning, For you, Memorize. One step at a time.
     Verse panel     Tap a verse number to see the Bible's exact words.
     Word help       The first time a hard word appears, it is underlined.
                     Tapping it shows the plain meaning. Display can turn it off.
     Listen          Reads the current step aloud, one paragraph at a time,
                     with the paragraph highlighted. Pause, speed, stop.
     Memorize        Three ways to practice one line. No grades.
   Home page         "Your next step": keep reading, and lines due for practice.
   Memorize page     Every saved line, with practice.

   Everything is saved on this device only (localStorage). No account. */
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

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MEM_KEY = "fs-memorize";
  var DAY = 86400000;

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  /* ---- Reading paths: shared helpers ---- */
  function doneMap() { return store("fs-done") || {}; }
  function markDone(slug) { var d = doneMap(); if (!d[slug]) { d[slug] = Date.now(); store("fs-done", d); } }
  function pathState(p) {
    var d = doneMap(), count = 0, nextIdx = -1;
    p.steps.forEach(function (s, i) { if (d[s.slug]) count++; else if (nextIdx < 0) nextIdx = i; });
    return { count: count, nextIdx: nextIdx, complete: nextIdx < 0 };
  }
  function readPaths() {
    var el = document.getElementById("paths-data");
    if (!el) return [];
    try { return JSON.parse(el.textContent) || []; } catch (e) { return []; }
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function scrollToEl(node) {
    if (!node) return;
    var top = node.getBoundingClientRect().top + window.pageYOffset - 84;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------------- Memorize list (shared) ---------------- */
  function memList() { return store(MEM_KEY) || []; }
  function memSave(item, knewIt) {
    var list = memList();
    var old = null;
    list = list.filter(function (x) { if (x.slug === item.slug) { old = x; return false; } return true; });
    var level = old ? old.level || 0 : 0;
    level = knewIt ? level + 1 : 0;
    var days = knewIt ? [3, 7, 14, 30][Math.min(level - 1, 3)] : 1;
    item.level = level;
    item.due = Date.now() + days * DAY;
    list.unshift(item);
    store(MEM_KEY, list);
    return days;
  }
  function dayName(date) {
    var d = Math.round((date - Date.now()) / DAY);
    if (d <= 1) return "tomorrow";
    try { return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); } catch (e) { return "in " + d + " days"; }
  }
  function dueText(due) {
    var d = Math.ceil((due - Date.now()) / DAY);
    if (d <= 0) return "Ready to practice now";
    return "Ready to practice " + (d === 1 ? "tomorrow" : "on " + dayName(new Date(due)));
  }
  /* A calendar reminder, made on this device. No account, nothing sent anywhere. */
  function calendarFile(date, ref, url) {
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var d = date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate());
    var d2 = new Date(date.getTime() + DAY);
    var e = d2.getFullYear() + pad(d2.getMonth() + 1) + pad(d2.getDate());
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Free Scripture//Memorize//EN", "BEGIN:VEVENT",
      "UID:" + Date.now() + "@freescripture.org", "DTSTAMP:" + d + "T090000", "DTSTART;VALUE=DATE:" + d, "DTEND;VALUE=DATE:" + e,
      "SUMMARY:Practice " + ref.replace(/[,;]/g, " "), "DESCRIPTION:One minute of practice: " + url, "URL:" + url,
      "BEGIN:VALARM", "TRIGGER:PT9H", "ACTION:DISPLAY", "DESCRIPTION:Practice your Bible line", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "practice-reminder.ics";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------------- Practice: three ways, no grades ---------------- */
  function words(text) { return text.split(/\s+/).filter(Boolean); }
  function letters(text) {
    return words(text).map(function (w) {
      var m = w.match(/^([^A-Za-z]*)([A-Za-z])[A-Za-z'’]*([^A-Za-z]*)$/);
      return m ? m[1] + m[2] + m[3] : w;
    }).join(" ");
  }
  function shuffle(arr, seed) {
    var a = arr.slice(), s = seed || 7;
    for (var i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor((s / 233280) * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function practice(box, lineEl, mem, onUsed) {
    var mode = "letters";
    var state = { peek: false, gap: [null, null], order: [] };
    var all = words(mem.text);
    var tiles = shuffle(all.map(function (_, i) { return i; }), mem.text.length);
    if (tiles.join() === all.map(function (_, i) { return i; }).join()) tiles.reverse();
    var used = false;
    function mark() { if (!used) { used = true; if (onUsed) onUsed(); } }

    function gapLine() {
      var out = mem.text;
      mem.gaps.forEach(function (g, i) {
        var val = state.gap[i];
        var span = '<span class="mem__blank' + (val ? " is-filled" : "") + '">' + (val ? esc(val) : "_____") + "</span>";
        out = out.replace(g, "\u0000" + i + "\u0000");
        out = out.replace("\u0000" + i + "\u0000", span);
      });
      return out;
    }

    function render() {
      var tabs = [["letters", "First letters"], ["gaps", "Fill the gaps"], ["order", "Put in order"]].map(function (t) {
        return '<button type="button" class="seg__btn" data-mode="' + t[0] + '" aria-pressed="' + (mode === t[0]) + '">' + t[1] + "</button>";
      }).join("");
      var body = "";
      if (mode === "letters") {
        lineEl.innerHTML = esc(state.peek ? mem.text : letters(mem.text));
        lineEl.classList.toggle("is-letters", !state.peek);
        body = '<p class="mem__how">Say the line out loud. Each letter is the start of a word.</p>' +
          '<button type="button" class="btn btn--line" data-peek>' + (state.peek ? "Hide the words" : "Show the words") + "</button>";
      } else if (mode === "gaps") {
        lineEl.classList.remove("is-letters");
        lineEl.innerHTML = gapLine();
        body = mem.gaps.map(function (g, i) {
          // Three choices: the right word, its decoy, and the other decoy.
          var other = mem.decoys[1 - i] || mem.decoys[0];
          var opts = [g, mem.decoys[i]];
          if (other && opts.indexOf(other) < 0) opts.push(other);
          opts = shuffle(opts, i + 3);
          return '<p class="mem__how">' + (i === 0 ? "First" : "Second") + ' missing word:</p><div class="chips">' + opts.map(function (o) {
            return '<button type="button" class="chip-btn" data-gap="' + i + '" data-word="' + esc(o) + '" aria-pressed="' + (state.gap[i] === o) + '">' + esc(o) + "</button>";
          }).join("") + "</div>";
        }).join("");
        if (state.gap[0] && state.gap[1]) {
          var right = state.gap[0] === mem.gaps[0] && state.gap[1] === mem.gaps[1];
          body += '<p class="mem__check">' + (right ? "That matches the verse." : "Compare with the verse: " + esc(mem.text)) + "</p>";
        }
      } else {
        lineEl.classList.remove("is-letters");
        var built = state.order.map(function (i) { return all[i]; }).join(" ");
        lineEl.innerHTML = built ? esc(built) : '<span class="mem__placeholder">Tap the words below in order.</span>';
        body = '<div class="chips">' + tiles.map(function (i) {
          var isUsed = state.order.indexOf(i) >= 0;
          return '<button type="button" class="chip-btn' + (isUsed ? " is-used" : "") + '" data-tile="' + i + '"' + (isUsed ? " disabled" : "") + ">" + esc(all[i]) + "</button>";
        }).join("") + "</div>" +
          '<div class="mem__row"><button type="button" class="btn btn--line" data-reset>Start over</button>';
        if (state.order.length === all.length) {
          body += '<span class="mem__check">' + (built === mem.text ? "That matches the verse." : "Close. Compare with the verse, then try again.") + "</span>";
        }
        body += "</div>";
      }
      box.innerHTML = '<div class="seg" role="group" aria-label="Ways to practice">' + tabs + "</div>" + body;
    }

    box.addEventListener("click", function (e) {
      var t = e.target.closest("button");
      if (!t || !box.contains(t)) return;
      if (t.hasAttribute("data-mode")) { mode = t.getAttribute("data-mode"); state.peek = false; }
      else if (t.hasAttribute("data-peek")) { state.peek = !state.peek; mark(); }
      else if (t.hasAttribute("data-gap")) { state.gap[+t.getAttribute("data-gap")] = t.getAttribute("data-word"); mark(); }
      else if (t.hasAttribute("data-tile")) { var i = +t.getAttribute("data-tile"); if (state.order.indexOf(i) < 0) state.order.push(i); mark(); }
      else if (t.hasAttribute("data-reset")) { state.order = []; }
      else return;
      render();
      var again = box.querySelector('[data-mode="' + mode + '"]');
      if (t.hasAttribute("data-mode") && again) again.focus();
    });
    render();
  }

  function share(text, url, btn) {
    var full = text + (url ? " " + url : "");
    if (navigator.share) { navigator.share({ text: text, url: url }).catch(function () {}); return; }
    var done = function () { if (btn) { var o = btn.textContent; btn.textContent = "Copied. Paste it anywhere."; setTimeout(function () { btn.textContent = o; }, 2500); } };
    if (navigator.clipboard) navigator.clipboard.writeText(full).then(done, function () {});
  }

  /* ================= STORY PAGE ================= */
  var dataEl = document.getElementById("story-data");
  var page = $(".story-v2");
  if (dataEl && page) {
    var data = {};
    try { data = JSON.parse(dataEl.textContent); } catch (e) {}
    page.classList.add("js");

    /* ---- Steps ---- */
    var panels = $$("[data-step-panel]", page);
    var tabs = $$("[data-step]", page);
    var order = panels.map(function (p) { return p.getAttribute("data-step-panel"); });
    var labels = { story: "Story", meaning: "Meaning", foryou: "For you", memorize: "Memorize" };
    var current = null;

    function showStep(id, opts) {
      if (order.indexOf(id) < 0) id = order[0];
      current = id;
      var idx = order.indexOf(id);
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-step-panel") !== id; });
      tabs.forEach(function (t, i) {
        var on = t.getAttribute("data-step") === id;
        t.setAttribute("aria-current", on ? "step" : "false");
        t.classList.toggle("is-done", i <= idx);
      });
      if (history.replaceState) history.replaceState(null, "", "#step-" + id);
      store("fs-last", { url: data.url, label: data.title, step: labels[id] });
      stopListening();
      if (!opts || opts.scroll !== false) scrollToEl($("[data-steps]", page));
      if (id === "memorize") { setupMemorize(); markDone(data.slug); showPathNext(); }
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function (e) { e.preventDefault(); showStep(t.getAttribute("data-step")); });
    });
    $$("[data-step-go]", page).forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); showStep(b.getAttribute("data-step-go")); });
    });
    $$("[data-go-scene]", page).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var target = document.querySelector(a.getAttribute("href"));
        if (current !== "story") showStep("story", { scroll: false });
        scrollToEl(target);
      });
    });
    var start = (location.hash.match(/^#step-(\w+)/) || [])[1];
    var startScene = (location.hash.match(/^#scene-(\d+)/) || [])[1];
    showStep(start || "story", { scroll: !!start });
    if (startScene) {
      var sc = document.getElementById("scene-" + startScene);
      if (sc) setTimeout(function () { scrollToEl(sc); }, 60);
    }

    /* ---- Remember the scene you reached, so you can take a break ---- */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting || current !== "story") return;
          var n = +en.target.id.replace("scene-", "");
          if (n > 1) store("fs-last", { url: data.url, label: data.title, step: "Story", scene: n });
        });
      }, { rootMargin: "0px 0px -60% 0px" });
      $$(".story-scene[id]", page).forEach(function (h) { io.observe(h); });
    }

    /* ---- Your turn: one answer open at a time ---- */
    $$("[data-pick]", page).forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        $$("[data-pick]", d.parentNode).forEach(function (o) { if (o !== d) o.open = false; });
      });
    });

    /* ---- Reading path: bar at the top, next step at the end ---- */
    var activePath = null;
    (function () {
      var paths = data.paths || [];
      if (!paths.length) return;
      var q = (location.search.match(/[?&]path=([a-z0-9-]+)/) || [])[1];
      if (q) store("fs-path", q);
      var want = q || store("fs-path");
      activePath = paths.filter(function (p) { return p.slug === want; })[0] || null;
      if (!activePath) return;
      var idx = activePath.steps.map(function (s) { return s.slug; }).indexOf(data.slug);
      var bar = $("[data-path-bar]", page);
      if (!bar || idx < 0) { activePath = null; return; }
      bar.href = activePath.url;
      $("[data-path-bar-title]", bar).textContent = activePath.title + " · Story " + (idx + 1) + " of " + activePath.steps.length;
      var d = doneMap();
      $("[data-path-bar-dots]", bar).innerHTML = activePath.steps.map(function (s, i) {
        return '<span class="path-bar__dot' + (d[s.slug] ? " is-done" : "") + (i === idx ? " is-here" : "") + '"></span>';
      }).join("");
      bar.hidden = false;
      if (current === "memorize") showPathNext();
    })();
    function showPathNext() {
      var card = $("[data-path-next]", page);
      if (!card || !activePath) return;
      var steps = activePath.steps;
      var idx = steps.map(function (s) { return s.slug; }).indexOf(data.slug);
      var st = pathState(activePath);
      var nxt = null;
      for (var i = idx + 1; i < steps.length; i++) { if (!doneMap()[steps[i].slug]) { nxt = { s: steps[i], n: i + 1 }; break; } }
      if (!nxt && st.nextIdx >= 0) nxt = { s: steps[st.nextIdx], n: st.nextIdx + 1 };
      if (nxt) {
        card.href = nxt.s.url;
        $("[data-path-next-kicker]", card).textContent = "Next in your path: " + activePath.title;
        $("[data-path-next-name]", card).textContent = nxt.s.title;
        $("[data-path-next-meta]", card).textContent = "Story " + nxt.n + " of " + steps.length + " · " + nxt.s.shows;
      } else {
        card.href = activePath.url;
        $("[data-path-next-kicker]", card).textContent = "You finished all " + steps.length + " stories";
        $("[data-path-next-name]", card).textContent = activePath.title;
        $("[data-path-next-meta]", card).textContent = "See the path and what to read next";
      }
      card.hidden = false;
    }

    /* ---- Verse panel ---- */
    var panel = $("[data-verse-panel]", page);
    var body = $("[data-verse-body]", page);
    var backdrop = el("div", { "class": "verse-backdrop", hidden: "" });
    document.body.appendChild(backdrop);
    var lastChip = null;
    function isSheet() { return window.matchMedia("(max-width: 999px)").matches; }
    function openVerses(keys, para, chip) {
      $$(".rp.is-selected", page).forEach(function (p) { p.classList.remove("is-selected"); });
      if (para) para.classList.add("is-selected");
      var html = "";
      if (para) {
        var clone = para.cloneNode(true);
        $$(".vchip", clone).forEach(function (c) { c.remove(); });
        html += '<div class="verse-panel__story"><span class="verse-panel__kicker">In the story</span><p>' + esc(clone.textContent.trim()) + "</p></div>";
      }
      keys.forEach(function (k) {
        var t = data.verses && data.verses[k];
        if (!t) return;
        html += '<div class="verse-panel__verse"><span class="verse-panel__ref">' + esc(data.book + " " + k) + "</span><p>" + esc(t) + "</p></div>";
      });
      body.innerHTML = html;
      lastChip = chip || null;
      if (isSheet()) {
        panel.classList.add("is-open");
        backdrop.hidden = false;
        document.body.classList.add("sheet-open");
        var close = $("[data-verse-close]", panel);
        if (close) close.focus();
      }
    }
    function closeVerses() {
      panel.classList.remove("is-open");
      backdrop.hidden = true;
      document.body.classList.remove("sheet-open");
      if (lastChip) lastChip.focus();
    }
    page.addEventListener("click", function (e) {
      var chip = e.target.closest(".vchip[data-v]");
      if (chip) {
        e.preventDefault();
        openVerses(chip.getAttribute("data-v").split(","), chip.closest(".rp"), chip);
        return;
      }
      var para = e.target.closest(".rp[data-v]");
      if (para && !e.target.closest("a, button") && !String(window.getSelection && window.getSelection())) {
        var v = para.getAttribute("data-v");
        if (v) openVerses(v.split(","), para, $(".vchip", para));
      }
    });
    backdrop.addEventListener("click", closeVerses);
    var closeBtn = $("[data-verse-close]", page);
    if (closeBtn) closeBtn.addEventListener("click", closeVerses);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { if (panel.classList.contains("is-open")) closeVerses(); hideWord(); }
    });

    /* ---- First visit tip ---- */
    var tip = $("[data-first-tip]", page);
    if (tip && !store("fs-tip-story")) {
      tip.hidden = false;
      $("[data-first-tip-ok]", tip).addEventListener("click", function () { tip.hidden = true; store("fs-tip-story", 1); });
    }

    /* ---- Word help ---- */
    var bubble = el("div", { "class": "word-bubble", role: "dialog", "aria-live": "polite", hidden: "" });
    document.body.appendChild(bubble);
    var bubbleFor = null;
    function hideWord() { bubble.hidden = true; if (bubbleFor) bubbleFor.setAttribute("aria-expanded", "false"); bubbleFor = null; }
    function showWord(btn) {
      var w = data.words[+btn.getAttribute("data-word")];
      if (!w) return;
      if (bubbleFor === btn) { hideWord(); return; }
      hideWord();
      bubble.innerHTML = '<span class="word-bubble__word">' + esc(w.word) + '</span><span class="word-bubble__meaning">' + esc(w.meaning) + "</span>";
      bubble.hidden = false;
      var r = btn.getBoundingClientRect();
      var bw = Math.min(320, window.innerWidth - 32);
      bubble.style.width = bw + "px";
      var left = Math.min(Math.max(16, r.left + window.pageXOffset - 12), window.pageXOffset + window.innerWidth - bw - 16);
      bubble.style.left = left + "px";
      bubble.style.top = (r.bottom + window.pageYOffset + 8) + "px";
      btn.setAttribute("aria-expanded", "true");
      bubbleFor = btn;
    }
    function addWordHelp() {
      if (!data.words || root.getAttribute("data-fs-words") === "off") return;
      var all = $$("[data-step-panel] p, [data-step-panel] li, [data-step-panel] td", page);
      // The open page first, then the closed drawers, so a word's help is never hidden away.
      wordHelpIn(all.filter(function (n) { return !n.closest("[data-drawer]"); }));
      $$("[data-drawer]", page).forEach(function (d) {
        wordHelpIn(all.filter(function (n) { return d.contains(n); }));
      });
    }
    function wordHelpIn(scope) {
      var seen = {};
      data.words.forEach(function (w, wi) {
        w.match.forEach(function (form) {
          if (seen[wi]) return;
          var re = new RegExp("(^|[^A-Za-z])(" + form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?![A-Za-z])");
          for (var s = 0; s < scope.length && !seen[wi]; s++) {
            var walker = document.createTreeWalker(scope[s], NodeFilter.SHOW_TEXT, {
              acceptNode: function (n) {
                return n.parentNode.closest("button, a, .term, .story-imagine__label, h2, h3") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
              }
            });
            var node;
            while ((node = walker.nextNode())) {
              var m = node.nodeValue.match(re);
              if (!m) continue;
              var at = m.index + m[1].length;
              var after = node.splitText(at);
              after.splitText(m[2].length);
              var b = el("button", { type: "button", "class": "term", "data-word": String(wi), "aria-expanded": "false", "aria-label": m[2] + ", show meaning" });
              b.textContent = m[2];
              after.parentNode.replaceChild(b, after);
              seen[wi] = true;
              break;
            }
          }
        });
      });
    }
    addWordHelp();
    document.addEventListener("click", function (e) {
      var t = e.target.closest(".term[data-word]");
      if (t) { e.preventDefault(); e.stopPropagation(); showWord(t); return; }
      if (!e.target.closest(".word-bubble")) hideWord();
    }, true);
    window.addEventListener("resize", hideWord);

    /* ---- Listen ---- */
    var synth = window.speechSynthesis;
    var listenBtn = $("[data-listen]", page);
    var listenLabel = $("[data-listen-label]", page);
    var bar = $("[data-listen-bar]", page);
    var status = $("[data-listen-status]", page);
    var toggle = $("[data-listen-toggle]", page);
    var queue = [], qi = 0, rate = 1, playing = false, paused = false;
    function textOf(n) {
      var c = n.cloneNode(true);
      $$(".vchip, .story-scene__num", c).forEach(function (x) { x.remove(); });
      return c.textContent.replace(/\s+/g, " ").trim();
    }
    function clearReading() { $$(".is-reading", page).forEach(function (n) { n.classList.remove("is-reading"); }); }
    function speakNext() {
      if (!playing) return;
      if (qi >= queue.length) { stopListening(); if (status) status.textContent = "Finished this step."; return; }
      var n = queue[qi];
      clearReading();
      n.classList.add("is-reading");
      if (n.getBoundingClientRect().top > window.innerHeight * 0.7 || n.getBoundingClientRect().top < 60) scrollToEl(n);
      if (status) status.textContent = "Reading part " + (qi + 1) + " of " + queue.length;
      var u = new SpeechSynthesisUtterance(textOf(n));
      u.rate = rate;
      var voices = synth.getVoices();
      var v = voices.filter(function (x) { return /^en(-|_)US/i.test(x.lang) && x.localService; })[0] || voices.filter(function (x) { return /^en/i.test(x.lang); })[0];
      if (v) u.voice = v;
      u.onend = function () { if (playing && !paused) { qi++; speakNext(); } };
      synth.speak(u);
    }
    function startListening() {
      if (!synth) { if (status) { bar.hidden = false; status.textContent = "This browser can't read aloud. Try Chrome, Edge, or Safari."; } return; }
      var p = panels.filter(function (x) { return !x.hidden; })[0];
      queue = $$(".step__title, h3, p, li", p).filter(function (n) { return !n.closest(".mem, .finish, .step__head, .step__hint, details:not([open])") || n.classList.contains("step__title"); }).filter(function (n) { return textOf(n); });
      qi = 0; playing = true; paused = false;
      bar.hidden = false;
      listenBtn.setAttribute("aria-pressed", "true");
      if (listenLabel) listenLabel.textContent = "Listening";
      if (toggle) toggle.textContent = "Pause";
      synth.cancel();
      speakNext();
    }
    function stopListening() {
      if (!playing && bar && bar.hidden) return;
      playing = false; paused = false;
      if (synth) synth.cancel();
      clearReading();
      if (bar) bar.hidden = true;
      if (listenBtn) listenBtn.setAttribute("aria-pressed", "false");
      if (listenLabel) listenLabel.textContent = "Listen";
    }
    if (listenBtn) listenBtn.addEventListener("click", function () { playing ? stopListening() : startListening(); });
    if (toggle) toggle.addEventListener("click", function () {
      if (!playing) return;
      if (paused) { paused = false; toggle.textContent = "Pause"; synth.cancel(); speakNext(); }
      else { paused = true; toggle.textContent = "Resume"; synth.cancel(); }
    });
    var stopBtn = $("[data-listen-stop]", page);
    if (stopBtn) stopBtn.addEventListener("click", stopListening);
    $$("[data-speed]", page).forEach(function (b) {
      b.addEventListener("click", function () {
        rate = parseFloat(b.getAttribute("data-speed"));
        $$("[data-speed]", page).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        if (playing && !paused) { synth.cancel(); speakNext(); }
      });
    });
    window.addEventListener("beforeunload", function () { if (synth) synth.cancel(); });

    /* ---- Memorize ---- */
    var memReady = false;
    function setupMemorize() {
      if (memReady || !data.memorize) return;
      memReady = true;
      var mem = data.memorize;
      var saveBox = $("[data-mem-save]", page);
      practice($("[data-mem-practice]", page), $("[data-mem-line]", page), mem, function () { saveBox.hidden = false; });
      var out = $("[data-mem-saved]", page);
      function save(knew) {
        var days = memSave({ slug: data.slug, title: data.title, url: data.url, ref: mem.ref, part: !!mem.part, text: mem.text, gaps: mem.gaps, decoys: mem.decoys }, knew);
        var when = new Date(Date.now() + days * DAY);
        out.innerHTML = "Added to your <a href=\"/memorize/\">Memorize list</a>. It will be ready to practice on " + dayName(when) + ". " +
          '<button type="button" class="linkish" data-cal>Add a reminder to my calendar</button>';
        var cal = $("[data-cal]", out);
        if (cal) cal.addEventListener("click", function () { calendarFile(when, mem.ref, location.origin + "/memorize/"); });
      }
      $("[data-mem-got]", page).addEventListener("click", function () { save(true); });
      $("[data-mem-again]", page).addEventListener("click", function () { save(false); });
    }
    var shareBtn = $("[data-share-line]", page);
    if (shareBtn && data.memorize) shareBtn.addEventListener("click", function () {
      share("“" + data.memorize.text + "” (" + data.memorize.ref + ")", location.origin + data.url, shareBtn);
    });
  }

  /* ================= HOME PAGE ================= */
  var next = $("[data-home-next]");
  if (next) {
    var last = store("fs-last");
    var due = memList().filter(function (x) { return x.due <= Date.now(); });
    var html = "";
    var hp = readPaths().filter(function (p) { return p.slug === store("fs-path"); })[0];
    var hpState = hp ? pathState(hp) : null;
    var skipLast = false;
    if (hp && !hpState.complete && hpState.count > 0) {
      var ns = hp.steps[hpState.nextIdx];
      var sameAsLast = last && last.url && ns.url.indexOf(last.url) === 0;
      skipLast = !!sameAsLast;
      var h2 = sameAsLast && last.scene ? "#scene-" + last.scene : "";
      html += '<a class="next-row" href="' + esc(ns.url) + h2 + '">' +
        '<span class="next-row__kicker">Your reading path: ' + esc(hp.title) + '</span><span class="next-row__title">' + esc(ns.title) + "</span>" +
        '<span class="next-row__meta">Story ' + (hpState.nextIdx + 1) + " of " + hp.steps.length + " · " + hpState.count + " done</span></a>";
    }
    if (last && last.url && !skipLast) {
      var hash = last.scene ? "#scene-" + last.scene : last.step ? "#step-" + { "Story": "story", "Meaning": "meaning", "For you": "foryou", "Memorize": "memorize" }[last.step] : "";
      html += '<a class="next-row" href="' + esc(last.url) + hash + '">' +
        '<span class="next-row__kicker">Keep reading</span><span class="next-row__title">' + esc(last.label || "Your last page") + "</span>" +
        (last.step ? '<span class="next-row__meta">You were on: ' + esc(last.step) + (last.scene ? ", scene " + last.scene : "") + "</span>" : "") + "</a>";
    }
    if (due.length) {
      html += '<a class="next-row" href="/memorize/"><span class="next-row__kicker">Practice</span><span class="next-row__title">' +
        (due.length === 1 ? "1 line is ready to practice" : due.length + " lines are ready to practice") + '</span><span class="next-row__meta">About 1 minute</span></a>';
    }
    if (html) {
      $("[data-home-next-list]").innerHTML = html;
      next.hidden = false;
      var startHere = $("[data-start-here]");
      if (startHere && last && last.url) startHere.hidden = true;
    }
  }

  /* ================= PATH PAGE ================= */
  var pathPage = $("[data-path-page]");
  if (pathPage) {
    var pp = readPaths().filter(function (p) { return p.slug === pathPage.getAttribute("data-path-page"); })[0];
    if (pp) {
      var ps = pathState(pp), dm = doneMap();
      $$("[data-step-story]", pathPage).forEach(function (li) {
        var slug = li.getAttribute("data-step-story");
        var i = pp.steps.map(function (s) { return s.slug; }).indexOf(slug);
        var status = $("[data-step-status]", li);
        if (dm[slug]) { li.classList.add("is-done"); if (status) status.textContent = "Done"; }
        else if (i === ps.nextIdx && ps.count > 0) { li.classList.add("is-next"); if (status) status.textContent = "Up next"; }
      });
      $$("[data-seg]", pathPage).forEach(function (s) { if (dm[s.getAttribute("data-seg")]) s.classList.add("is-done"); });
      var prog = $("[data-path-progress]", pathPage);
      if (prog && ps.count > 0) {
        $("[data-path-count]", prog).textContent = ps.count + " of " + pp.steps.length + " stories done";
        prog.hidden = false;
      }
      var go = $("[data-path-go]", pathPage);
      if (go && ps.complete) {
        go.textContent = "Read the first story again";
        go.href = pp.steps[0].url;
        go.classList.remove("btn--primary"); go.classList.add("btn--line");
        var after = $("[data-path-after]", pathPage);
        if (after) after.hidden = false;
      } else if (go && ps.count > 0) {
        go.textContent = "Keep going: " + pp.steps[ps.nextIdx].title;
        go.href = pp.steps[ps.nextIdx].url;
      }
      $$("a[href*='?path=']", pathPage).forEach(function (a) { a.addEventListener("click", function () { store("fs-path", pp.slug); }); });
    }
  }

  /* ================= MEMORIZE PAGE ================= */
  var listBox = $("[data-mem-list]");
  if (listBox) {
    var render = function () {
      var list = memList();
      var empty = $("[data-mem-empty]");
      if (empty) empty.hidden = list.length > 0;
      listBox.innerHTML = list.map(function (m, i) {
        return '<li class="mem-item">' +
          '<div class="mem__card"><span class="mem__ref">' + (m.part ? "From " : "") + esc(m.ref) + ' · <a href="' + esc(m.url) + '">' + esc(m.title) + '</a></span><p class="mem__line" data-line="' + i + '">' + esc(m.text) + "</p></div>" +
          '<p class="mem-item__due">' + dueText(m.due) + "</p>" +
          '<div class="mem-item__btns"><button type="button" class="btn btn--primary" data-practice="' + i + '">Practice now</button>' +
          '<button type="button" class="btn btn--quiet" data-remove="' + i + '">Remove</button></div>' +
          '<div class="mem__practice" data-box="' + i + '" hidden></div>' +
          '<div class="mem__save-btns" data-save="' + i + '" hidden><button type="button" class="btn btn--primary" data-knew="' + i + '">I know it</button><button type="button" class="btn btn--line" data-tomorrow="' + i + '">Practice again tomorrow</button></div>' +
          "</li>";
      }).join("");
    };
    listBox.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var list = memList();
      if (b.hasAttribute("data-practice")) {
        var i = +b.getAttribute("data-practice");
        var box = $('[data-box="' + i + '"]', listBox);
        box.hidden = false;
        b.hidden = true;
        practice(box, $('[data-line="' + i + '"]', listBox), { text: list[i].text, gaps: list[i].gaps || pickGaps(list[i].text), decoys: list[i].decoys || ["God", "love"] }, function () { $('[data-save="' + i + '"]', listBox).hidden = false; });
      } else if (b.hasAttribute("data-remove")) {
        list.splice(+b.getAttribute("data-remove"), 1); store(MEM_KEY, list); render();
      } else if (b.hasAttribute("data-knew") || b.hasAttribute("data-tomorrow")) {
        var k = +(b.getAttribute("data-knew") || b.getAttribute("data-tomorrow"));
        memSave(list[k], b.hasAttribute("data-knew")); render();
      }
    });
    render();
  }
  function pickGaps(text) {
    var ws = words(text).map(function (w) { return w.replace(/[^A-Za-z'’]/g, ""); }).filter(function (w) { return w.length > 3; });
    ws.sort(function (a, b) { return b.length - a.length; });
    return [ws[0] || "", ws[1] || ""];
  }
  });
})();
