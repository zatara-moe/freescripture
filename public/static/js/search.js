/* freescripture.org — search
   Parses verse references ("John 3:16", "Genesis 1") for direct jumps,
   falls back to a phrase search across the prebuilt index.
*/
(function () {
  'use strict';

  var input = document.getElementById('search-input');
  var resultsEl = document.getElementById('search-results');
  var statusEl = document.getElementById('search-status');
  if (!input || !resultsEl) return;

  // Per-translation index cache. Each translation is fetched the first time
  // it's needed and held in memory for subsequent searches.
  var indexCache = {};       // {kjv: [...verses], web: [...], bbe: [...]}
  var indexPromises = {};    // {kjv: Promise, ...} — in-flight fetches

  // Book name aliases for parsing references
  var BOOK_ALIASES = {
    'gen': 'Genesis', 'genesis': 'Genesis',
    'ex': 'Exodus', 'exo': 'Exodus', 'exodus': 'Exodus',
    'lev': 'Leviticus', 'leviticus': 'Leviticus',
    'num': 'Numbers', 'numbers': 'Numbers',
    'deut': 'Deuteronomy', 'deuteronomy': 'Deuteronomy', 'dt': 'Deuteronomy',
    'josh': 'Joshua', 'joshua': 'Joshua',
    'judg': 'Judges', 'judges': 'Judges',
    'ruth': 'Ruth',
    '1sam': '1 Samuel', '1samuel': '1 Samuel', '1 sam': '1 Samuel', '1 samuel': '1 Samuel',
    '2sam': '2 Samuel', '2samuel': '2 Samuel', '2 sam': '2 Samuel', '2 samuel': '2 Samuel',
    '1kings': '1 Kings', '1 kings': '1 Kings', '1ki': '1 Kings',
    '2kings': '2 Kings', '2 kings': '2 Kings', '2ki': '2 Kings',
    '1chron': '1 Chronicles', '1 chronicles': '1 Chronicles', '1ch': '1 Chronicles',
    '2chron': '2 Chronicles', '2 chronicles': '2 Chronicles', '2ch': '2 Chronicles',
    'ezra': 'Ezra',
    'neh': 'Nehemiah', 'nehemiah': 'Nehemiah',
    'esth': 'Esther', 'esther': 'Esther',
    'job': 'Job',
    'ps': 'Psalms', 'psa': 'Psalms', 'psalm': 'Psalms', 'psalms': 'Psalms',
    'prov': 'Proverbs', 'proverbs': 'Proverbs', 'pr': 'Proverbs',
    'eccl': 'Ecclesiastes', 'ecclesiastes': 'Ecclesiastes', 'ec': 'Ecclesiastes',
    'song': 'Song of Solomon', 'songs': 'Song of Solomon', 'song of solomon': 'Song of Solomon', 'sos': 'Song of Solomon',
    'isa': 'Isaiah', 'isaiah': 'Isaiah',
    'jer': 'Jeremiah', 'jeremiah': 'Jeremiah',
    'lam': 'Lamentations', 'lamentations': 'Lamentations',
    'ezek': 'Ezekiel', 'ezekiel': 'Ezekiel', 'eze': 'Ezekiel',
    'dan': 'Daniel', 'daniel': 'Daniel',
    'hos': 'Hosea', 'hosea': 'Hosea',
    'joel': 'Joel',
    'amos': 'Amos',
    'obad': 'Obadiah', 'obadiah': 'Obadiah', 'ob': 'Obadiah',
    'jonah': 'Jonah',
    'mic': 'Micah', 'micah': 'Micah',
    'nah': 'Nahum', 'nahum': 'Nahum',
    'hab': 'Habakkuk', 'habakkuk': 'Habakkuk',
    'zeph': 'Zephaniah', 'zephaniah': 'Zephaniah',
    'hag': 'Haggai', 'haggai': 'Haggai',
    'zech': 'Zechariah', 'zechariah': 'Zechariah',
    'mal': 'Malachi', 'malachi': 'Malachi',
    'matt': 'Matthew', 'matthew': 'Matthew', 'mt': 'Matthew',
    'mark': 'Mark', 'mk': 'Mark', 'mr': 'Mark',
    'luke': 'Luke', 'lk': 'Luke', 'lu': 'Luke',
    'john': 'John', 'jn': 'John', 'jhn': 'John',
    'acts': 'Acts', 'ac': 'Acts',
    'rom': 'Romans', 'romans': 'Romans', 'ro': 'Romans',
    '1cor': '1 Corinthians', '1 corinthians': '1 Corinthians', '1co': '1 Corinthians',
    '2cor': '2 Corinthians', '2 corinthians': '2 Corinthians', '2co': '2 Corinthians',
    'gal': 'Galatians', 'galatians': 'Galatians',
    'eph': 'Ephesians', 'ephesians': 'Ephesians',
    'phil': 'Philippians', 'philippians': 'Philippians', 'php': 'Philippians',
    'col': 'Colossians', 'colossians': 'Colossians',
    '1thess': '1 Thessalonians', '1 thessalonians': '1 Thessalonians', '1th': '1 Thessalonians',
    '2thess': '2 Thessalonians', '2 thessalonians': '2 Thessalonians', '2th': '2 Thessalonians',
    '1tim': '1 Timothy', '1 timothy': '1 Timothy', '1ti': '1 Timothy',
    '2tim': '2 Timothy', '2 timothy': '2 Timothy', '2ti': '2 Timothy',
    'titus': 'Titus',
    'philem': 'Philemon', 'philemon': 'Philemon', 'phm': 'Philemon',
    'heb': 'Hebrews', 'hebrews': 'Hebrews',
    'jas': 'James', 'james': 'James', 'jm': 'James',
    '1pet': '1 Peter', '1 peter': '1 Peter', '1pe': '1 Peter',
    '2pet': '2 Peter', '2 peter': '2 Peter', '2pe': '2 Peter',
    '1john': '1 John', '1 john': '1 John', '1jn': '1 John',
    '2john': '2 John', '2 john': '2 John', '2jn': '2 John',
    '3john': '3 John', '3 john': '3 John', '3jn': '3 John',
    'jude': 'Jude',
    'rev': 'Revelation', 'revelation': 'Revelation', 'apocalypse': 'Revelation',
    // Apocrypha
    '1esd': '1 Esdras', '1 esdras': '1 Esdras', '1esdras': '1 Esdras',
    '2esd': '2 Esdras', '2 esdras': '2 Esdras', '2esdras': '2 Esdras',
    '4ezra': '2 Esdras', '4 ezra': '2 Esdras',
    'tob': 'Tobit', 'tobit': 'Tobit', 'tobias': 'Tobit',
    'jdt': 'Judith', 'judith': 'Judith',
    'gkesther': 'Esther (Greek)', 'addesther': 'Esther (Greek)', 'addesth': 'Esther (Greek)',
    'esthergreek': 'Esther (Greek)', 'greek esther': 'Esther (Greek)',
    'wis': 'Wisdom of Solomon', 'wisdom': 'Wisdom of Solomon',
    'wisdomofsolomon': 'Wisdom of Solomon', 'wisdom of solomon': 'Wisdom of Solomon',
    'sir': 'Sirach', 'sirach': 'Sirach', 'ecclesiasticus': 'Sirach', 'ecclus': 'Sirach',
    'bar': 'Baruch', 'baruch': 'Baruch',
    'azar': 'The Song of the Three Holy Children',
    'song of the three': 'The Song of the Three Holy Children',
    'song of three': 'The Song of the Three Holy Children',
    'pr azar': 'The Song of the Three Holy Children',
    'sus': 'Susanna', 'susanna': 'Susanna',
    'bel': 'Bel and the Dragon', 'bel and the dragon': 'Bel and the Dragon',
    'man': 'Prayer of Manasseh', 'pr man': 'Prayer of Manasseh',
    'manasseh': 'Prayer of Manasseh', 'prayer of manasseh': 'Prayer of Manasseh',
    '1macc': '1 Maccabees', '1 maccabees': '1 Maccabees', '1mac': '1 Maccabees',
    '2macc': '2 Maccabees', '2 maccabees': '2 Maccabees', '2mac': '2 Maccabees'
  };

  function bookSlug(name) {
    // Match the Python build script: drop parens, spaces -> hyphens.
    return name.toLowerCase()
      .replace(/[()]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function parseReference(q) {
    // Match: "John 3", "John 3:16", "1 John 4:8", "1Cor 13:4"
    var m = q.trim().match(/^(\d?\s?[a-zA-Z]+(?:\s+of\s+\w+)?)\s+(\d+)(?::(\d+))?$/);
    if (!m) return null;
    var bookKey = m[1].toLowerCase().replace(/\s+/g, '').replace(/\s+/g, ' ').trim();
    var bookKeyAlt = m[1].toLowerCase().trim();
    var book = BOOK_ALIASES[bookKey] || BOOK_ALIASES[bookKeyAlt];
    if (!book) return null;
    return {
      book: book,
      chapter: parseInt(m[2], 10),
      verse: m[3] ? parseInt(m[3], 10) : null
    };
  }

  function loadIndex(translation) {
    if (indexCache[translation]) return Promise.resolve(indexCache[translation]);
    if (indexPromises[translation]) return indexPromises[translation];
    indexPromises[translation] = fetch('/static/search-index-' + translation + '.json')
      .then(function (r) {
        if (!r.ok) throw new Error('Search index not found');
        return r.json();
      })
      .then(function (data) {
        indexCache[translation] = data;
        delete indexPromises[translation];
        return data;
      });
    return indexPromises[translation];
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function highlightMatch(text, terms) {
    var safe = escapeHtml(text);
    terms.forEach(function (t) {
      if (!t) return;
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      safe = safe.replace(re, '<mark>$1</mark>');
    });
    return safe;
  }

  function renderResults(items, queryTerms) {
    if (!items.length) {
      resultsEl.innerHTML = '<p class="search-empty">Nothing found. Try a different word or a verse reference like <em>John 3:16</em>.</p>';
      return;
    }
    var html = items.slice(0, 80).map(function (r) {
      var url = '/' + (r.translation || 'kjv') + '/' + bookSlug(r.book) + '/' + r.chapter + '#v' + r.verse;
      return '<div class="search-result">' +
        '<div class="search-result__ref"><a href="' + url + '">' +
          escapeHtml(r.book) + ' ' + r.chapter + ':' + r.verse +
        '</a></div>' +
        '<div class="search-result__text">' + highlightMatch(r.text, queryTerms) + '</div>' +
      '</div>';
    }).join('');
    resultsEl.innerHTML = html;
  }

  // Read translation preference from ?t= query, default to KJV.
  function currentTranslation() {
    var params = new URLSearchParams(window.location.search);
    var t = (params.get('t') || 'kjv').toLowerCase();
    if (['kjv', 'web', 'bbe'].indexOf(t) === -1) t = 'kjv';
    return t;
  }

  function search(q) {
    q = (q || '').trim();
    if (!q) {
      resultsEl.innerHTML = '';
      statusEl.textContent = '';
      return;
    }

    // First try as a verse reference
    var ref = parseReference(q);
    if (ref) {
      var trans = currentTranslation();
      // Apocrypha is only available in KJV
      var APOCRYPHA_BOOKS = ['1 Esdras', '2 Esdras', 'Tobit', 'Judith',
        'Esther (Greek)', 'Wisdom of Solomon', 'Sirach', 'Baruch',
        'The Song of the Three Holy Children', 'Susanna',
        'Bel and the Dragon', 'Prayer of Manasseh',
        '1 Maccabees', '2 Maccabees'];
      if (APOCRYPHA_BOOKS.indexOf(ref.book) !== -1) trans = 'kjv';
      var url = '/' + trans + '/' + bookSlug(ref.book) + '/' + ref.chapter;
      if (ref.verse) url += '#v' + ref.verse;
      statusEl.textContent = 'Jumping to ' + ref.book + ' ' + ref.chapter +
        (ref.verse ? ':' + ref.verse : '') + '...';
      window.location.href = url;
      return;
    }

    // Otherwise full-text search
    var trans = currentTranslation();
    var alreadyCached = !!indexCache[trans];
    statusEl.textContent = alreadyCached
      ? 'Searching ' + trans.toUpperCase() + '...'
      : 'Loading ' + trans.toUpperCase() + ' search index...';
    loadIndex(trans).then(function (idx) {
      var lower = q.toLowerCase();
      var terms = lower.split(/\s+/).filter(function (t) { return t.length > 1; });

      // Archaic English equivalents — when a user types modern English,
      // also accept the KJV's archaic forms.
      var ARCHAIC_MAP = {
        'you':    ['thou', 'thee', 'ye'],
        'your':   ['thy', 'thine'],
        'yours':  ['thine'],
        'yourself': ['thyself'],
        'are':    ['art'],
        'have':   ['hast', 'hath'],
        'has':    ['hath'],
        'do':     ['dost', 'doth'],
        'does':   ['doth'],
        'said':   ['saith'],
        'know':   ['knoweth', 'knowest'],
        'shall':  ['shalt'],
        'will':   ['wilt'],
        'go':     ['goeth', 'goest'],
        'come':   ['cometh', 'comest'],
        'see':    ['seeth', 'seest'],
        'love':   ['loveth', 'lovest'],
        'neighbor': ['neighbour'],
        'savior':  ['saviour'],
        'honor':   ['honour'],
        'labor':   ['labour']
      };

      // Build per-term variant arrays. A verse matches if it contains
      // any one of the variants for every term.
      var termVariants = terms.map(function (t) {
        var variants = [t];
        if (ARCHAIC_MAP[t]) variants = variants.concat(ARCHAIC_MAP[t]);
        // Also reverse — if user types archaic, accept modern equivalents
        Object.keys(ARCHAIC_MAP).forEach(function (modern) {
          if (ARCHAIC_MAP[modern].indexOf(t) !== -1 && variants.indexOf(modern) === -1) {
            variants.push(modern);
          }
        });
        return variants;
      });

      var matches = [];
      // Index is now scoped to the current translation — no per-entry tr field.
      for (var i = 0; i < idx.length; i++) {
        var v = idx[i];
        var t = v.t.toLowerCase();
        var allMatch = termVariants.every(function (variants) {
          return variants.some(function (variant) {
            return t.indexOf(variant) !== -1;
          });
        });
        if (allMatch) {
          matches.push({ book: v.b, chapter: v.c, verse: v.v, text: v.t, translation: trans });
          if (matches.length >= 200) break;
        }
      }

      // Build a flat term list for highlighting (all variants used)
      var highlightTerms = [];
      termVariants.forEach(function (vs) {
        vs.forEach(function (v) {
          if (highlightTerms.indexOf(v) === -1) highlightTerms.push(v);
        });
      });

      statusEl.textContent = matches.length === 0 ? 'No matches.' :
        matches.length === 1 ? '1 match' :
        (matches.length >= 200 ? 'First 200 matches' : matches.length + ' matches');
      renderResults(matches, highlightTerms);
    }).catch(function (err) {
      statusEl.textContent = '';
      resultsEl.innerHTML = '<p class="search-empty">Search index could not be loaded. Please try again later.</p>';
    });
  }

  // Debounce
  var debounceTimer = null;
  input.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      search(input.value);
    }, 220);
  });

  // Submit on Enter
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceTimer);
      search(input.value);
    }
  });

  // Pre-fill from URL ?q=
  var params = new URLSearchParams(window.location.search);
  var initialQ = params.get('q');
  if (initialQ) {
    input.value = initialQ;
    search(initialQ);
  }
  input.focus();
})();
