// Écrans : accueil (Aujourd'hui), mots, progrès, réglages ; test de niveau, alphabet arabe, fiche d'un mot.
const Views = (() => {
  const LANGS = Content.LANGS;
  const cur = () => Store.settings().lang;
  const active = () => (Store.settings().active || []).filter(c => LANGS[c]);

  // ---------- Barre de langue ----------
  function langBar() {
    const a = active();
    return `<div class="langbar">${a.map(c => `<button class="lang-chip ${c === cur() ? 'on' : ''}" data-lang="${c}">${LANGS[c].flag}<span>${LANGS[c].name}</span></button>`).join('')}
      <button class="lang-chip add" data-addlang aria-label="Langues">${icon('plus')}</button></div>`;
  }

  // ---------- Accueil ----------
  async function home(el) {
    const code = cur();
    if (!code) return chooseLangs(el, true);
    let d;
    try { d = await Content.load(code); } catch { el.innerHTML = `${langBar()}<div class="empty">${icon('cloud')}<p>Contenu indisponible : vérifie ta connexion.</p><button class="btn" data-reload>Réessayer</button></div>`; return; }
    const st = Engine.stats(code, d);
    const lv = Engine.levelInfo(code);
    const l = Engine.L(code);
    const goal = +Store.settings().goal || 60;
    const xp = Store.xpDay();
    const res = Store.resume(code);
    const streak = Engine.streak();
    const ar = code === 'ar';
    const alphaDone = ar ? Object.values(l.alpha || {}).filter(p => p >= 70).length : 0;
    const groups = ar ? d.alphabet.groups.length : 0;
    const newLeft = Math.max(0, (+Store.settings().newPerDay || 12) - (l.newDay && l.newDay.d === today() ? l.newDay.n : 0));
    const wotd = wordOfDay(d, code);
    const pi = Engine.pathInfo(code, d);
    const pst = Engine.pathOn(code, d) && !res ? pi.steps[pi.next] : null;
    el.innerHTML = `
      ${langBar()}
      <div class="home-grid"><div class="home-a">
      <section class="hero" style="--hue:${LANGS[code].hue}">
        <div class="hero-top">
          <div class="goal-ring" style="--p:${Math.min(100, Math.round(100 * xp / goal))}"><b>${xp}</b><small>/ ${goal}</small></div>
          <div class="hero-txt">
            <span class="kicker">${LANGS[code].flag} ${LANGS[code].name}${LANGS[code].beta ? ' (bêta)' : ''} · ${lv.placed ? `niveau ${lv.code}` : 'niveau à trouver'}</span>
            <h2>${xp >= goal ? 'Objectif du jour atteint' : xp ? 'Continue sur ta lancée' : 'Prêt pour aujourd\'hui ?'}</h2>
            <p class="muted">${icon('flame', 'sm')} ${plural(streak, 'jour', 'jours')} de suite · ${st.due ? `${plural(st.due, 'élément', 'éléments')} à revoir` : 'rien en retard'}</p>
          </div>
        </div>
        ${res ? `<button class="btn primary big wide" data-resume>${icon('play')} Reprendre (${res.queue.length - res.i} restants)</button>
          <button class="link small" data-drop>Abandonner cet exercice</button>`
        : pst ? `<button class="btn primary big wide" data-path-step="${pi.next}">${icon('play')} ${esc(stepTitle(d, pst))}</button>
          <p class="muted small center">Premiers pas · étape ${pi.next + 1} sur ${pi.steps.length} · <button class="link small" data-path-list>voir le parcours</button></p>`
        : `<button class="btn primary big wide" data-start="daily">${icon('play')} Session du jour</button>
          <p class="muted small center">${[st.due ? plural(Math.min(st.due, 6), 'révision', 'révisions') : '', newLeft ? 'nouveaux mots' : '', 'phrases à ton niveau'].filter(Boolean).join(' · ')} · environ ${Math.round((+Store.settings().sessionLen || 12) / 3)} min</p>`}
      </section>
      <section class="tiles4">
        <button class="tile4" data-start="review" ${st.due ? '' : 'data-empty'}>${icon('repeat')}<b>Réviser</b><small>${st.due ? plural(st.due, 'élément', 'éléments') : 'à jour'}</small></button>
        <button class="tile4" data-start="words">${icon('plus-circle')}<b>Nouveaux mots</b><small>${newLeft ? `${newLeft} pour aujourd'hui` : 'quota atteint, encore ?'}</small></button>
        <button class="tile4" data-start="sentences">${icon('chat')}<b>${ar ? 'Expressions' : 'Phrases'}</b><small>${ar ? 'parler au quotidien' : `formuler ${Content.inLang(code)}`}</small></button>
        ${ar ? `<button class="tile4" data-alpha>${icon('alef')}<b>Alphabet</b><small>${alphaDone}/${groups} étapes</small></button>`
        : `<button class="tile4" data-level>${icon('level')}<b>Niveau ${lv.code}</b><small>${esc(lv.name)}</small></button>`}
      </section>
      </div><div class="home-b">
      ${!lv.placed ? `<section class="card accent">
          <h3>${icon('level')} Trouvons ton niveau</h3>
          <p>Quelques questions, de plus en plus difficiles. À la première hésitation, on vérifie si c'est juste ce mot ou si on a atteint ton niveau. Environ 2 minutes.</p>
          <div class="row">${pi.steps.length ? '<button class="btn ghost" data-beginner>Je débute complètement</button>' : ''}<button class="btn primary grow" data-place>Commencer le test</button></div>
        </section>` : ''}
      ${wotd ? `<section class="card wotd" data-word="${esc(wotd.key)}">
        <span class="kicker">Mot du jour</span>
        <div class="wotd-w">${ar ? `<span class="ar">${esc(wotd.w)}</span><span class="tl">${esc(wotd.tl)}</span>` : `<b>${esc(wotd.w)}</b>`}<button class="say" data-say="${esc(wotd.w)}" aria-label="Écouter">${icon('volume')}</button></div>
        <p>${esc(wotd.fr[0])}</p>
        <p class="muted small">${esc(wotd.ex[0].replace(/\*/g, ''))}</p>
      </section>` : ''}
      <section class="card level-card" data-level>
        <div class="row between"><b>${icon('level', 'sm')} Niveau ${lv.code} · ${esc(lv.name)}</b><span class="muted small">${st.known} connus</span></div>
        <div class="lvl-track">${Content.LEVELS.map((L, i) => `<span class="${i < Engine.band(lv.lv) ? 'full' : i === Engine.band(lv.lv) ? 'cur' : ''}" style="--f:${i === Engine.band(lv.lv) ? lv.frac : 1}"><i></i><small>${L}</small></span>`).join('')}</div>
      </section>
      </div></div>`;
  }

  // Mots qui valent la peine d'être mis en avant : noms, verbes, adjectifs, adverbes, expressions, et pas les mots
  // transparents (« stress » = stress). Même filtre dans api/word.php.
  const wotdList = (d, b) => d.levelWords[b].filter(w => w.ex && ['n', 'v', 'adj', 'adv', 'phr'].includes(w.p) && Check.norm(w.fr[0]) !== Check.norm(w.w));
  // Mot du jour : le même pour tout le monde ce jour-là, au niveau de chacun (comme le widget).
  function wordOfDay(d, code) {
    const list = wotdList(d, Engine.band(Engine.L(code).lv));
    if (!list || !list.length) return null;
    let h = 0;
    for (const c of today()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return list[h % list.length];
  }

  // ---------- Choix des langues ----------
  function chooseLangs(el, first = false) {
    const a = active();
    el.innerHTML = `
      <section class="welcome">
        ${first ? `<img class="logo-big" src="icons/icon-192.png" alt=""><h1>Bienvenue sur Kalima</h1><p class="muted">Quelle langue veux-tu apprendre ? Tu peux en suivre plusieurs.</p>` : '<h2>Mes langues</h2>'}
        <div class="lang-pick">${Object.entries(LANGS).map(([c, L]) => `
          <button class="lang-opt ${a.includes(c) ? 'on' : ''}" data-pick="${c}">
            <span class="flag">${L.flag}</span><b>${L.name}${L.beta ? ' <span class="beta">bêta</span>' : ''}</b><small ${L.rtl ? 'dir="rtl"' : ''}>${L.native}</small>${icon('check', 'tick')}
          </button>`).join('')}</div>
        <p class="muted small">Anglais et arabe : contenus écrits et relus à la main. <b>Bêta</b> : vocabulaire repris d'un dictionnaire automatique, avec de vraies phrases ; il peut rester des erreurs de traduction.</p>
        <button class="btn primary big wide" data-langs-ok ${a.length ? '' : 'disabled'}>Continuer</button>
      </section>`;
  }

  // ---------- Test de niveau (crescendo) ----------
  async function placement(code) {
    const d = await Content.load(code);
    const p = Engine.placementStart(code);
    const ar = code === 'ar';
    const box = openSheet(`<div class="ses"><header class="ses-top"><button class="icon-btn" data-close aria-label="Fermer">${icon('close')}</button>
      <div class="place-lv"><small>Niveau estimé</small><b>—</b></div><span class="muted small place-n"></span></header>
      <main class="ses-body"></main><footer class="ses-foot"></footer></div>`, { cls: 'full' });
    const body = $('.ses-body', box), foot = $('.ses-foot', box);
    box.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) Audio2.say(b.dataset.say, code); });
    const right = [], wrong = [];
    function ask() {
      const x = Engine.placementPick(d, p);
      p.asked.push(x.key);
      $('.place-lv b', box).textContent = p.best >= 0 ? Engine.placementEstimate(p) : '—';
      $('.place-n', box).textContent = `${p.n + 1}`;
      const isW = x.kind === 'w';
      const tg = isW ? x.w : Content.first(x);
      const ans = isW ? x.fr[0] : Content.firstFr(x);
      const others = isW ? Content.distractors(d, x, 3).map(o => o.fr[0]) : Content.sentDistractors(d, x, 3).map(o => Content.firstFr(o));
      const opts = shuffle([ans, ...others]);
      body.innerHTML = `<div class="q"><p class="q-label">${isW ? 'Que veut dire ce mot ?' : 'Que veut dire cette phrase ?'}</p>
        <div class="q-main">${ar ? `<span class="ar ar-big" dir="rtl">${esc(tg)}</span><span class="tl">${esc(x.tl)}</span>` : `<span class="${isW ? 'tg-big' : 'tg'}">${esc(tg)}</span>`}<button class="say" data-say="${esc(tg)}">${icon('volume')}</button></div></div>
        <div class="choices">${opts.map(o => `<button class="choice" data-o="${esc(o)}">${esc(o)}</button>`).join('')}<button class="choice dk" data-o="">Je ne sais pas</button></div>`;
      foot.innerHTML = '';
      Audio2.auto('show', tg, code);
      $$('.choice', body).forEach(b => (b.onclick = () => {
        const ok = b.dataset.o === ans;
        $$('.choice', body).forEach(c => { c.disabled = true; if (c.dataset.o === ans) c.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        (ok ? right : wrong).push(x.key);
        const done = Engine.placementAnswer(p, ok);
        setTimeout(() => (done ? finish() : ask()), ok ? 450 : 1100);
      }));
    }
    function finish() {
      const LV = Content.LEVELS[Engine.band(p.lv)];
      // Mots réussis : connus. Mots ratés : à apprendre en premier.
      for (const k of right) if (d.byId.get(k).kind === 'w') Engine.markKnown(k);
      const l = Engine.L(code);
      Store.setLang(code, { lv: p.lv, placed: true, toLearn: [...new Set([...wrong.filter(k => d.byId.get(k).kind === 'w'), ...(l.toLearn || [])])].slice(0, 40), placedAt: Date.now() });
      body.innerHTML = `<div class="end"><div class="end-badge">${LV}</div><h2>Niveau ${LV} · ${Content.LEVEL_NAMES[LV]}</h2>
        <p class="muted">${p.n} questions. Les mots et phrases proposés partent de là, et le niveau s'ajuste tout seul pendant les sessions :
        il monte quand tout va bien, et redescend un peu si plusieurs mots différents du même niveau posent problème.</p></div>`;
      foot.innerHTML = `<button class="btn primary big wide" data-go>Commencer une session</button>`;
      $('[data-go]', foot).onclick = async () => { closeSheet(); await sleep(260); Session.start(code, 'daily'); };
      App.refresh();
    }
    ask();
  }

  // ---------- Parcours « premiers pas » ----------
  const stepTitle = (d, st) => (st.alpha !== undefined ? `Alphabet : ${d.alphabet.groups[st.alpha].title.replace(/^./, c => c.toLowerCase())}` : st.title);
  const stepSub = (d, st) => (st.alpha !== undefined ? (d.alphabet.groups[st.alpha].letters || ['بَ', 'بِ', 'بُ']).join(' ') : st.sub);
  async function pathList(code) {
    const d = await Content.load(code);
    const pi = Engine.pathInfo(code, d);
    openSheet(`<div class="page"><header class="page-top"><button class="icon-btn" data-close aria-label="Retour">${icon('back')}</button><h2>Premiers pas</h2><span></span></header>
      <div class="page-body">
        <p class="muted">Un ou deux mots à la fois : on les découvre, on les entend, on les retrouve parmi ceux déjà vus.${code === 'ar' ? ' Les lettres arrivent deux par deux entre les mots.' : ''}</p>
        <div class="alpha-list">${pi.steps.map((st, k) => {
          const done = Engine.pathDone(code, st);
          return `<button class="alpha-step ${done ? 'done' : k === pi.next ? 'next' : ''}" data-path-step="${k}">
            <span class="step-n">${k + 1}</span><span><b>${esc(stepTitle(d, st))}</b><small ${st.alpha !== undefined ? 'class="ar"' : ''}>${esc(stepSub(d, st))}</small></span>${done ? icon('check') : icon('chev')}</button>`;
        }).join('')}</div>
      </div></div>`, { cls: 'full' });
  }
  async function pathStep(code, k) {
    const d = await Content.load(code);
    const st = (d.path || [])[k];
    if (!st) return;
    if (st.alpha !== undefined) return alphaLesson(st.alpha, code);
    if (sheets.length) { while (sheets.length) closeSheet(); await sleep(260); }
    Session.path(code, k);
  }

  // ---------- Alphabet arabe ----------
  const forms = x => x.join ? [x.l, x.l + 'ـ', 'ـ' + x.l + 'ـ', 'ـ' + x.l] : [x.l, x.l, 'ـ' + x.l, 'ـ' + x.l];
  async function alphabet() {
    const d = await Content.load('ar');
    const A = d.alphabet;
    const l = Engine.L('ar');
    const nextK = A.groups.findIndex((g, k) => !((l.alpha || {})[k] >= 70));
    openSheet(`<div class="page"><header class="page-top"><button class="icon-btn" data-close aria-label="Retour">${icon('back')}</button><h2>Alphabet arabe</h2><span></span></header>
      <div class="page-body">
        <p class="muted">L'arabe s'écrit de droite à gauche. Deux ou trois lettres à la fois ; le vocabulaire n'attend pas : la transcription
        latine est affichée tant que tu ne lis pas encore.</p>
        <div class="alpha-list">${A.groups.map((g, k) => {
          const pct = (l.alpha || {})[k] || 0;
          return `<button class="alpha-step ${pct >= 70 ? 'done' : k === nextK ? 'next' : ''}" data-alpha-step="${k}">
            <span class="ar alpha-l">${g.vowels ? 'بَ بِ بُ' : g.letters.join(' ')}</span><span><b>${esc(g.title)}</b><small>${pct ? `${pct} %` : k === nextK ? 'À faire maintenant' : ''}</small></span>${pct >= 70 ? icon('check') : icon('chev')}</button>`;
        }).join('')}</div>
      </div></div>`, { cls: 'full' });
  }
  async function alphaLesson(k, inPath = null) {
    const d = await Content.load('ar');
    const A = d.alphabet;
    const g = A.groups[k];
    const L = c => A.letters.find(x => x.l === c);
    const letters = g.vowels ? [] : g.letters.map(L);
    const el = openSheet(`<div class="page"><header class="page-top"><button class="icon-btn" data-close aria-label="Retour">${icon('back')}</button><h2>Étape ${k + 1}</h2><span></span></header>
      <div class="page-body lesson">
        <h3>${esc(g.title)}</h3><p class="muted">${esc(g.tip)}</p>
        ${g.vowels ? `<div class="letters">${A.vowels.map(v => `<div class="letter"><b class="ar big-l">بـ${v.mark}</b><span><b>${esc(v.name)}</b> · ${esc(v.sound)}</span><button class="say" data-say="${'ب' + v.mark}">${icon('volume')}</button></div>`).join('')}</div>`
        : `<div class="letters">${letters.map(x => `<div class="letter">
            <b class="ar big-l">${x.l}</b>
            <span><b>${esc(x.name)}</b> · « ${esc(x.fr)} »<br><small class="muted">${esc(x.sound)}</small></span>
            <button class="say" data-say="${x.nameAr}">${icon('volume')}</button>
            <div class="forms ar">${forms(x).map((f, i) => `<span><b>${f}</b><small>${['seule', 'début', 'milieu', 'fin'][i]}</small></span>`).join('')}</div>
            <div class="exw"><span class="ar">${x.ex[0]}</span> <span class="muted">${esc(x.ex[1])} · ${esc(x.ex[2])}</span> <button class="say small" data-say="${x.ex[0]}">${icon('volume')}</button></div>
          </div>`).join('')}</div>`}
        <button class="btn primary big wide" data-quiz>${icon('play')} S'entraîner</button>
      </div></div>`, { cls: 'full' });
    el.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) Audio2.say(b.dataset.say, 'ar'); });
    $('[data-quiz]', el).onclick = async () => {
      const known = A.groups.slice(0, k + 1).flatMap(gg => gg.letters || []).map(L);
      const info = x => `<div class="fb-word"><b class="ar" style="font-size:40px">${x.l}</b><span><b>${esc(x.name)}</b> · « ${esc(x.fr)} »</span></div><div class="forms ar">${forms(x).map((f, i) => `<span><b>${f}</b><small>${['seule', 'début', 'milieu', 'fin'][i]}</small></span>`).join('')}</div>`;
      const items = [];
      if (g.vowels) {
        for (const v of A.vowels.slice(0, 3)) for (const base of shuffle(known.filter(x => x.join)).slice(0, 2)) {
          const syl = base.l + v.mark, fr0 = base.fr.split(' ')[0];
          const ans = fr0 + v.fr;
          const opts = shuffle([...new Set([ans, ...A.vowels.slice(0, 3).filter(o => o !== v).map(o => fr0 + o.fr)])]);
          items.push({ label: 'Comment se lit cette syllabe ?', html: `<p class="ar huge">${syl}</p>`, options: opts, answer: ans, say: syl, autoSay: false, info: `<p class="ar" style="font-size:40px">${syl}</p><p>${ans}</p>` });
        }
      } else {
        for (const x of letters) {
          // Pièges : d'abord les lettres déjà vues, complétées par d'autres pour avoir 4 choix.
          const others = shuffle(known.filter(o => o !== x)).slice(0, 3);
          if (others.length < 3) others.push(...shuffle(A.letters.filter(o => o !== x && !others.includes(o) && o.fr !== x.fr)).slice(0, 3 - others.length));
          items.push({ label: 'Quel son fait cette lettre ?', html: `<p class="ar huge">${x.l}</p>`, options: shuffle([x.fr, ...others.map(o => o.fr)]), answer: x.fr, info: info(x), say: x.nameAr, autoSay: false });
          items.push({ label: 'Écoute et choisis la lettre', html: `<div class="listen"><button class="say huge" data-say="${x.nameAr}">${icon('volume')}</button></div>`, options: shuffle([x.l, ...others.map(o => o.l)]), answer: x.l, say: x.nameAr, arOpts: true, info: info(x) });
          const pos = 1 + Math.floor(Math.random() * 3);
          items.push({ label: `Quelle lettre ? (en ${['', 'début', 'milieu', 'fin'][pos]} de mot)`, html: `<p class="ar huge">${forms(x)[pos]}</p>`, options: shuffle([x.name, ...others.map(o => o.name)]), answer: x.name, info: info(x), say: x.nameAr, autoSay: false });
        }
        // Révision d'une lettre des étapes précédentes.
        const prev = shuffle(known.filter(x => !letters.includes(x))).slice(0, 2);
        for (const x of prev) {
          const others = shuffle(known.filter(o => o !== x)).slice(0, 3);
          items.push({ label: 'Révision : quel son ?', html: `<p class="ar huge">${x.l}</p>`, options: shuffle([x.fr, ...others.map(o => o.fr)]), answer: x.fr, info: info(x), say: x.nameAr, autoSay: false });
        }
      }
      while (sheets.length) closeSheet();
      await sleep(260);
      Session.custom('ar', shuffle(items), {
        path: inPath, alpha: k,
        onEnd: s => {
          const pct = Math.round(100 * (s.score || 0) / Math.max(1, s.queue.length));
          const l2 = Engine.L('ar');
          Store.setLang('ar', { alpha: { ...(l2.alpha || {}), [k]: Math.max(pct, (l2.alpha || {})[k] || 0) } });
          s.pct = pct;
        },
        endHtml: s => `<p class="muted">${s.pct >= 70 ? 'Étape réussie ! La suivante est débloquée.' : 'Encore un essai pour valider l\'étape (70 % de bonnes réponses).'}</p>`,
      });
    };
  }

  // ---------- Mots ----------
  let wordsFilter = 'learning', wordsQ = '';
  async function words(el) {
    const code = cur();
    if (!code) return chooseLangs(el, true);
    const d = await Content.load(code);
    const ar = code === 'ar';
    el.innerHTML = `${langBar()}
      <div class="search"><input class="input" id="wq" placeholder="${ar ? 'Chercher (arabe, transcription ou français)' : `Chercher (${LANGS[code].name.toLowerCase()} ou français)`}" value="${esc(wordsQ)}" autocomplete="off">${icon('search')}</div>
      <div class="filters">${[['learning', 'En cours'], ['known', 'Connus'], ['due', 'À revoir'], ['all', 'Tout le dictionnaire']].map(([k, l]) => `<button class="${wordsFilter === k ? 'on' : ''}" data-filter="${k}">${l}</button>`).join('')}</div>
      <div class="wlist"></div>`;
    const list = $('.wlist', el);
    const render = () => {
      const q = Check.norm(wordsQ);
      const now = Date.now();
      let xs = [...d.words, ...d.sentences];
      if (q) xs = xs.filter(x => Check.norm(x.kind === 'w' ? x.w : Content.first(x)).includes(q) || (x.tl && Check.norm(x.tl).includes(q)) || x.fr.some(f => Check.norm(f).includes(q)));
      else if (wordsFilter !== 'all') xs = xs.filter(x => { const it = Store.item(x.key); if (!it) return false; return wordsFilter === 'known' ? it.st >= Engine.KNOWN : wordsFilter === 'due' ? it.due <= now : it.st < Engine.KNOWN; });
      if (!xs.length) { list.innerHTML = `<div class="empty">${icon('book')}<p>${q ? 'Aucun résultat.' : wordsFilter === 'due' ? 'Rien à revoir : tout est à jour.' : 'Rien ici pour le moment : lance une session !'}</p></div>`; return; }
      list.innerHTML = xs.slice(0, 200).map(x => {
        const it = Store.item(x.key);
        const stg = it ? it.st : -1;
        return `<button class="wrow" data-word="${esc(x.key)}">
          <span class="wrow-w">${x.kind === 'w' ? (ar ? `<span class="ar">${esc(x.w)}</span> <small class="tl">${esc(x.tl)}</small>` : `<b>${esc(x.w)}</b>`) : `<span>${esc(Content.first(x))}</span>`}
          <small class="muted">${esc(x.kind === 'w' ? x.fr.slice(0, 2).join(', ') : Content.firstFr(x))}</small></span>
          <span class="lv-tag">${x.l}</span><span class="dots" title="Palier ${Math.max(0, stg)}">${[1, 3, 5].map(n => `<i class="${stg >= n ? 'on' : ''}"></i>`).join('')}</span></button>`;
      }).join('') + (xs.length > 200 ? `<p class="muted small center">${xs.length - 200} de plus : affine ta recherche.</p>` : '');
    };
    render();
    $('#wq', el).oninput = e => { wordsQ = e.target.value; clearTimeout(words.t); words.t = setTimeout(render, 150); };
    $$('[data-filter]', el).forEach(b => (b.onclick = () => { wordsFilter = b.dataset.filter; $$('[data-filter]', el).forEach(x => x.classList.toggle('on', x === b)); render(); }));
  }

  async function wordSheet(key) {
    const code = key.split(':')[0];
    const d = await Content.load(code);
    const x = d.byId.get(key);
    if (!x) return;
    const it = Store.item(key);
    const ar = code === 'ar';
    const tg = x.kind === 'w' ? x.w : Content.first(x);
    const stg = it ? it.st : -1;
    const el = openSheet(`<div class="page"><header class="page-top"><button class="icon-btn" data-close aria-label="Retour">${icon('back')}</button><h2>${x.kind === 'w' ? 'Mot' : 'Phrase'}</h2><span class="lv-tag">${x.l}</span></header>
      <div class="page-body">
        <div class="ws-w">${ar ? `<span class="ar ar-big">${esc(tg)}</span>` : `<span class="${x.kind === 'w' ? 'tg-big' : 'tg'}">${esc(tg)}</span>`}<button class="say big" data-say="${esc(tg)}">${icon('volume')}</button></div>
        ${x.tl ? `<p class="tl big">${esc(x.tl)}</p>` : ''}
        <p class="intro-tr">${esc(x.kind === 'w' ? x.fr[0] : Content.firstFr(x))}</p>
        ${x.kind === 'w' && x.fr.length > 1 ? `<p class="muted">Autres traductions acceptées : ${x.fr.slice(1).map(esc).join(', ')}</p>` : ''}
        ${x.kind === 's' && (x.tg.length > 1 || x.tg[0].includes('[')) ? `<p class="muted">Formulations acceptées : ${Check.expandAll(x.tg).slice(0, 6).map(esc).join(' · ')}</p>` : ''}
        ${x.kind === 'w' && x.ex ? `<div class="intro-ex">${ar ? `<p class="ar">${esc(x.ex[0]).replace(/\*([^*]+)\*/, '<b>$1</b>')} <button class="say small" data-say="${esc(x.ex[0].replace(/\*/g, ''))}">${icon('volume')}</button></p><p class="tl">${esc(x.extl)}</p>` : `<p>${esc(x.ex[0]).replace(/\*([^*]+)\*/, '<b>$1</b>')} <button class="say small" data-say="${esc(x.ex[0].replace(/\*/g, ''))}">${icon('volume')}</button></p>`}<p class="muted">${esc(x.ex[1])}</p></div>` : ''}
        ${x.xs && x.xs.length ? `<h4>Autres phrases</h4>${x.xs.map(([e, f]) => `<div class="ws-ex"><p>${esc(e).replace(/\*([^*]+)\*/, '<b>$1</b>')} <button class="say small" data-say="${esc(e.replace(/\*/g, ''))}">${icon('volume')}</button></p><p class="muted">${esc(f)}</p></div>`).join('')}<p class="muted small">Phrases : Tatoeba (CC BY 2.0 FR).</p>` : ''}
        ${x.tip ? `<p class="fb-tip">${icon('bulb')}<span>${esc(x.tip)}</span></p>` : ''}
        <div class="ws-state">${stg < 0 ? 'Pas encore appris' : stg >= Engine.MASTER ? 'Maîtrisé' : stg >= Engine.KNOWN ? 'Connu' : 'En cours d\'apprentissage'}${it && it.due ? ` · prochaine révision ${it.due <= Date.now() ? 'maintenant' : new Date(it.due).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}</div>
        <div class="col">
          ${stg < 0 ? '<button class="btn primary wide" data-ws="learn">Ajouter à mes révisions</button>' : ''}
          ${stg < Engine.KNOWN ? '<button class="btn ghost wide" data-ws="known">Je le connais déjà</button>' : ''}
          ${stg >= 0 ? '<button class="btn ghost wide" data-ws="reset">Recommencer ce mot à zéro</button>' : ''}
        </div>
      </div></div>`, { cls: 'full' });
    el.addEventListener('click', e => {
      const s = e.target.closest('[data-say]');
      if (s) return Audio2.say(s.dataset.say, code);
      const b = e.target.closest('[data-ws]');
      if (!b) return;
      if (b.dataset.ws === 'learn') { Engine.introduce(key); toast('Ajouté à tes révisions', 'plus'); }
      if (b.dataset.ws === 'known') { Engine.markKnown(key); toast('Marqué comme connu', 'check'); }
      if (b.dataset.ws === 'reset') { Store.delItem(key); toast('Remis à zéro', 'repeat'); }
      closeSheet(); App.refresh();
    });
  }

  // ---------- Progrès ----------
  async function progress(el) {
    const code = cur();
    if (!code) return chooseLangs(el, true);
    const d = await Content.load(code);
    Engine.snapshot(code, d);
    const st = Engine.stats(code, d);
    const lv = Engine.levelInfo(code);
    const l = Engine.L(code);
    const days = Store.xpDays();
    const last = [...Array(14)].map((_, k) => { const t = new Date(); t.setDate(t.getDate() - 13 + k); return ymd(t); });
    const max = Math.max(10, ...last.map(x => days[x] || 0));
    const curve = Object.entries(l.curve || {}).sort();
    const goal = +Store.settings().goal || 60;
    el.innerHTML = `${langBar()}
      <section class="stats3">
        <div><b>${st.known}</b><small>connus</small></div>
        <div><b>${st.learning}</b><small>en cours</small></div>
        <div><b>${st.master}</b><small>maîtrisés</small></div>
      </section>
      <section class="card">
        <div class="row between"><b>Niveau ${lv.code} · ${esc(lv.name)}</b><button class="link small" data-place>Refaire le test</button></div>
        <div class="lvl-track">${Content.LEVELS.map((L, i) => `<span class="${i < Engine.band(lv.lv) ? 'full' : i === Engine.band(lv.lv) ? 'cur' : ''}" style="--f:${i === Engine.band(lv.lv) ? lv.frac : 1}"><i></i><small>${L}</small></span>`).join('')}</div>
        <p class="muted small">Le niveau monte quand les nouveaux mots et phrases passent bien, et redescend un peu si plusieurs éléments différents d'un même niveau posent problème.</p>
      </section>
      <section class="card">
        <div class="row between"><b>Points, 14 derniers jours</b><span class="muted small">${icon('flame', 'sm')} ${plural(Engine.streak(), 'jour', 'jours')}</span></div>
        <div class="bars">${last.map(x => `<span title="${x} : ${days[x] || 0}" class="${(days[x] || 0) >= goal ? 'hit' : ''}" style="--h:${Math.round(100 * (days[x] || 0) / max)}%"><i></i><small>${+x.slice(8)}</small></span>`).join('')}</div>
      </section>
      ${curve.length > 1 ? `<section class="card"><b>Mots connus</b>${lineChart(curve)}</section>` : ''}
      <section class="card"><b>Par niveau</b>
        ${Content.LEVELS.map((L, i) => { const ws = d.levelWords[i]; if (!ws.length) return ''; const k = ws.filter(w => (Store.item(w.key) || {}).st >= Engine.KNOWN).length; return `<div class="lvrow"><span>${L}</span><div class="meter"><i style="width:${Math.round(100 * k / ws.length)}%"></i></div><small>${k}/${ws.length}</small></div>`; }).join('')}
      </section>
      <p class="muted small center">Total : ${Store.xpTotal()} points</p>`;
  }
  function lineChart(curve) {
    const W = 320, H = 110, P = 6;
    const vals = curve.map(c => c[1]);
    const mx = Math.max(...vals, 5), mn = Math.min(...vals, 0);
    const pts = vals.map((v, i) => [P + i * (W - 2 * P) / Math.max(1, vals.length - 1), H - P - (v - mn) * (H - 2 * P) / Math.max(1, mx - mn)]);
    return `<svg class="line" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="M${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join('L')}" /></svg>
      <div class="row between muted small"><span>${curve[0][0].slice(5)}</span><span>${vals[vals.length - 1]} mots</span></div>`;
  }

  // ---------- Réglages ----------
  function settings(el) {
    const s = Store.settings();
    const a = Store.account || {};
    const audio = s.audio || 'discret';
    const opt = (name, val, label, cur2) => `<button class="seg-b ${String(cur2) === String(val) ? 'on' : ''}" data-set="${name}" data-val="${val}">${label}</button>`;
    el.innerHTML = `
      <h2 class="page-h">Réglages</h2>
      <section class="card">
        <h3>${icon('volume', 'sm')} Prononciation</h3>
        <div class="audio-modes">
          ${[['muet', 'Muet', 'Rien ne se lit tout seul. Le haut-parleur reste là.'], ['discret', 'Discret', 'Nouveaux mots, écoute, et la bonne réponse.'], ['bavard', 'Bavard', 'Lit tout ce qui s\'affiche dans la langue, à chaque fois.']]
            .map(([v, l, t]) => `<button class="mode ${audio === v ? 'on' : ''}" data-set="audio" data-val="${v}">${icon(v === 'muet' ? 'mute' : v === 'discret' ? 'volume' : 'volume-loud')}<b>${l}</b><small>${t}</small></button>`).join('')}
        </div>
        <div class="set-row"><span>Vitesse de la voix</span><div class="seg">${opt('rate', 0.75, 'Lente', s.rate || 0.9)}${opt('rate', 0.9, 'Normale', s.rate || 0.9)}${opt('rate', 1.05, 'Rapide', s.rate || 0.9)}</div></div>
        <button class="link small" data-testvoice>Tester la voix</button>
      </section>
      <section class="card">
        <h3>${icon('target', 'sm')} Rythme</h3>
        <div class="set-row"><span>Longueur des sessions</span><div class="seg">${opt('sessionLen', 8, 'Courte', s.sessionLen || 12)}${opt('sessionLen', 12, 'Normale', s.sessionLen || 12)}${opt('sessionLen', 20, 'Longue', s.sessionLen || 12)}</div></div>
        <div class="set-row"><span>Nouveaux mots par jour</span><div class="seg">${opt('newPerDay', 6, '6', s.newPerDay || 12)}${opt('newPerDay', 12, '12', s.newPerDay || 12)}${opt('newPerDay', 20, '20', s.newPerDay || 12)}</div></div>
        <div class="set-row"><span>Objectif du jour</span><div class="seg">${opt('goal', 30, '30 pts', s.goal || 60)}${opt('goal', 60, '60', s.goal || 60)}${opt('goal', 120, '120', s.goal || 60)}</div></div>
        ${active().includes('ar') ? `<div class="set-row"><span>Transcription de l'arabe</span><div class="seg">${opt('tl', 'auto', 'Tant que besoin', s.tl || 'auto')}${opt('tl', 'always', 'Toujours', s.tl || 'auto')}${opt('tl', 'never', 'Jamais', s.tl || 'auto')}</div></div>` : ''}
      </section>
      <section class="card">
        <h3>${icon('globe', 'sm')} Langues</h3>
        <p class="muted small">${active().map(c => LANGS[c].flag + ' ' + LANGS[c].name).join(' · ') || 'Aucune'}</p>
        <button class="btn ghost wide" data-addlang>Choisir mes langues</button>
      </section>
      <section class="card">
        <h3>${icon('sun', 'sm')} Apparence</h3>
        <div class="set-row"><span>Thème</span><div class="seg">${opt('theme', 'light', 'Clair', s.theme || 'light')}${opt('theme', 'dark', 'Sombre', s.theme || 'light')}${opt('theme', 'auto', 'Comme le téléphone', s.theme || 'light')}</div></div>
      </section>
      ${window.WebApk ? notifCard(s) : ''}
      <section class="card">
        <h3>${icon('user', 'sm')} Compte</h3>
        ${a.local ? `<p>Mode local : tes progrès restent sur cet appareil, sans synchronisation.</p><button class="btn primary wide" data-account="login">Créer un compte ou se connecter</button>`
        : `<p><b>${esc(a.user || '')}</b>${a.admin ? ' · administrateur' : ''}</p>
          <p class="muted small sync-state">${syncText()}</p>
          <div class="col">
            <button class="btn ghost wide" data-account="sync">${icon('refresh')} Synchroniser maintenant</button>
            <button class="btn ghost wide" data-account="backups">Sauvegardes</button>
            <button class="btn ghost wide" data-account="password">Changer le mot de passe</button>
            <button class="btn ghost wide" data-account="rename">Changer de pseudo</button>
            <button class="btn ghost wide" data-account="others">Déconnecter mes autres appareils</button>
            <button class="btn ghost wide" data-account="logout">Se déconnecter</button>
            <button class="link small danger" data-account="delete">Supprimer mon compte</button>
          </div>`}
      </section>
      ${a.admin ? `<section class="card"><h3>${icon('shield', 'sm')} Administration</h3><p class="muted small">Comptes, inscriptions, codes d'invitation.</p><button class="btn ghost wide" data-admin>Ouvrir l'administration</button></section>` : ''}
      ${!window.WebApk ? `<section class="card"><h3>${icon('phone', 'sm')} Application Android</h3><p class="muted small">Notifications et widget « mot du jour » (de 1×2 à plein écran).</p><a class="btn ghost wide" href="kalima.apk" download>${icon('download')} Télécharger l'APK</a></section>` : ''}
      <section class="card"><h3>${icon('chat', 'sm')} Aide et contact</h3>
        <p class="muted small">Une traduction fausse, une phrase bizarre, un bug, une idée : dis-le, tout est lu.</p>
        <div class="col"><button class="btn ghost wide" data-contact="traduction">Signaler une erreur de traduction</button><button class="btn ghost wide" data-contact="bug">Nous contacter</button></div></section>
      <section class="card credits"><h3>${icon('info', 'sm')} À propos</h3>
        <p class="muted small">Kalima (كلمة, « mot » en arabe). Vocabulaire et phrases écrits et relus à la main, du plus courant au plus rare.
        Prononciation : voix du téléphone, ou synthèse vocale en ligne. Gratuit, sans publicité.</p></section>`;
  }
  const syncText = () => Store.authLost ? 'Session expirée : reconnecte-toi (tes progrès sont gardés sur l\'appareil).' : !Store.online ? 'Hors ligne : les progrès partiront au retour du réseau.' : Store.pending ? 'Synchronisation en cours…' : 'Synchronisé sur tous tes appareils.';

  // Notification « mot du jour » de l'app Android : simple. Activée ou non, 1 à 3 par jour, heures, langue, test.
  function notifCard(s) {
    const n = notifSettings();
    const blocked = window.WebApk && WebApk.notifPermission && !WebApk.notifPermission();
    const langs = active();
    return `<section class="card"><h3>${icon('bell', 'sm')} Mot du jour</h3>
      <div class="set-row"><span><b>Notifications</b><br><small class="muted">Un mot de ton niveau, sa traduction et une phrase.</small></span><button class="switch ${n.on ? 'on' : ''}" data-notif="on"><i></i></button></div>
      ${n.on && blocked ? `<div class="warn-box">${icon('alert')}<span>Android bloque les notifications de Kalima.</span><button class="btn small primary" data-notif="perm">Autoriser</button></div>` : ''}
      ${n.on ? `<div class="set-row"><span>Par jour</span><div class="seg">${[1, 2, 3].map(k => `<button class="seg-b ${n.count === k ? 'on' : ''}" data-notif="count" data-val="${k}">${k}</button>`).join('')}</div></div>
        <div class="set-row"><span>${n.count > 1 ? 'Heures' : 'Heure'}</span><span class="times">${n.times.slice(0, n.count).map((t, k) => `<input class="input time" type="time" value="${esc(t)}" data-notif="time" data-k="${k}">`).join('')}</span></div>
        ${langs.length > 1 ? `<div class="set-row"><span>Langue</span><select class="input sel" data-notif="lang">${langs.map(c => `<option value="${c}" ${c === n.lang ? 'selected' : ''}>${LANGS[c].flag} ${LANGS[c].name}</option>`).join('')}</select></div>` : ''}
        <button class="btn ghost wide" data-notif="test">${icon('bell')} Recevoir un mot maintenant</button>` : ''}
      <p class="muted small">Widget : appui long sur l'écran d'accueil › Widgets › Kalima. Il se redimensionne de 1×1 au plein écran et change de mot chaque jour.</p></section>`;
  }
  function notifSettings() {
    const n = { on: true, count: 1, times: ['18:30', '12:30', '09:00'], lang: '', ...(Store.settings().notif || {}) };
    while (n.times.length < 3) n.times.push(['18:30', '12:30', '09:00'][n.times.length]);
    if (!active().includes(n.lang)) n.lang = Store.settings().lang || active()[0] || 'en';
    return n;
  }

  // ---------- Compte : actions ----------
  async function accountAction(k) {
    try {
      if (k === 'login') return App.showLogin();
      if (k === 'sync') { await Store.sync(); toast(Store.online ? 'Synchronisé' : 'Hors ligne pour le moment', Store.online ? 'check' : 'cloud'); return App.refresh(); }
      if (k === 'logout') { if (await confirmBox('Se déconnecter de cet appareil ? Tes progrès restent sur ton compte.', { ok: 'Se déconnecter' })) { await Store.logout(); App.showWelcome(); } return; }
      if (k === 'others') { await api('logoutothers'); return toast('Les autres appareils sont déconnectés', 'check'); }
      if (k === 'password') {
        const old = await promptBox('Mot de passe actuel', { type: 'password' }); if (old === null) return;
        const nw = await promptBox('Nouveau mot de passe (6 caractères minimum)', { type: 'password' }); if (!nw) return;
        await api('password', { old, new: nw }); return toast('Mot de passe changé', 'check');
      }
      if (k === 'rename') {
        const nw = await promptBox('Nouveau pseudo', { value: Store.account.user }); if (!nw) return;
        const r = await api('rename', { user: nw }); Store.setAccount({ ...Store.account, user: r.user }); toast('Pseudo changé', 'check'); return App.refresh();
      }
      if (k === 'delete') {
        const p = await promptBox('Supprimer définitivement ton compte et tes progrès ? Entre ton mot de passe pour confirmer.', { type: 'password', ok: 'Supprimer' }); if (!p) return;
        await api('deleteaccount', { pass: p }); Store.setAccount(null); return App.showWelcome();
      }
      if (k === 'backups') return backups();
    } catch (e) { toast(e.message, 'alert'); }
  }
  async function backups() {
    const r = await api('backups');
    const el = openSheet(`<div class="page"><header class="page-top"><button class="icon-btn" data-close aria-label="Retour">${icon('back')}</button><h2>Sauvegardes</h2><span></span></header>
      <div class="page-body"><p class="muted">Le serveur garde une copie de tes progrès toutes les 3 heures (30 copies), et toujours avant une modification qui ferait perdre des mots ou des points.
      Restaurer <b>ajoute</b> la sauvegarde à tes progrès actuels (rien de récent n'est perdu).</p>
      ${r.backups.length ? r.backups.map(b => `<div class="brow"><span><b>${new Date(b.t * 1000).toLocaleString('fr-FR')}</b><small>${b.items} éléments · ${b.xp} points${b.id.includes('perte') ? ' · avant une perte' : ''}</small></span><button class="btn ghost small" data-restore="${esc(b.id)}">Restaurer</button></div>`).join('') : '<p class="muted">Aucune sauvegarde pour le moment.</p>'}
      </div></div>`, { cls: 'full' });
    el.addEventListener('click', async e => {
      const b = e.target.closest('[data-restore]');
      if (!b) return;
      if (!await confirmBox('Restaurer cette sauvegarde ? Elle sera fusionnée avec tes progrès actuels.', { ok: 'Restaurer' })) return;
      try { const r2 = await api('restore', { id: b.dataset.restore }); Store.replaceState(r2.state, r2.rev); toast('Sauvegarde restaurée', 'check'); closeSheet(); App.refresh(); } catch (err) { toast(err.message, 'alert'); }
    });
  }

  // ---------- Administration ----------
  async function admin() {
    const el = openSheet(`<div class="page"><header class="page-top"><button class="icon-btn" data-close aria-label="Retour">${icon('back')}</button><h2>Administration</h2><span></span></header><div class="page-body"><p class="muted">Chargement…</p></div></div>`, { cls: 'full' });
    const body = $('.page-body', el);
    async function load() {
      let r;
      try { r = await api('admin'); } catch (e) { body.innerHTML = `<p>${esc(e.message)}</p>`; return; }
      const me = Store.account.user;
      body.innerHTML = `
        <section class="stats3"><div><b>${r.stats.accounts}</b><small>comptes</small></div><div><b>${r.stats.active7}</b><small>actifs 7 j</small></div><div><b>${r.stats.active1}</b><small>aujourd'hui</small></div></section>
        <section class="card"><div class="set-row"><span><b>Inscription libre</b><br><small class="muted">Sinon, un code d'invitation est demandé.</small></span><button class="switch ${r.openSignup ? 'on' : ''}" data-open><i></i></button></div></section>
        <section class="card"><h3>Codes d'invitation</h3>
          <div class="row"><button class="btn ghost grow" data-code="single">Code à usage unique</button><button class="btn ghost grow" data-code="open">Code ouvert</button></div>
          ${r.codes.map(c => `<div class="brow ${c.disabled ? 'off' : ''}"><span><b class="mono">${c.code.slice(0, 4)}-${c.code.slice(4)}</b><small>${c.type === 'open' ? 'ouvert' : 'usage unique'}${c.label ? ' · ' + esc(c.label) : ''} · ${c.uses.length} utilisation(s)${c.uses.length ? ' : ' + c.uses.map(u => esc(u.user)).join(', ') : ''}</small></span>
            <button class="btn ghost small" data-cup="${c.code}" data-dis="${c.disabled ? 0 : 1}">${c.disabled ? 'Réactiver' : 'Désactiver'}</button><button class="icon-btn small" data-cdel="${c.code}" aria-label="Supprimer">${icon('trash')}</button></div>`).join('') || '<p class="muted small">Aucun code.</p>'}
        </section>
        <section class="card"><h3>Comptes</h3>
          ${r.accounts.map(u => `<details class="acc"><summary><span><b>${esc(u.user)}</b>${u.admin ? ' <span class="tag">admin</span>' : ''}${u.disabled ? ' <span class="tag bad">bloqué</span>' : ''}<small>vu ${timeAgo(u.lastSeen * 1000)} · ${u.items} éléments · ${u.xp} pts · ${(u.langs || []).map(c => (LANGS[c] || {}).flag || c).join(' ')}</small></span></summary>
            <p class="muted small">Créé le ${new Date(u.created * 1000).toLocaleDateString('fr-FR')} · ${u.devices} appareil(s) connecté(s) · inscription : ${esc(u.code || '?')}</p>
            ${u.user === me ? '<p class="muted small">C\'est ton compte.</p>' : `<div class="row wrap">
              <button class="btn ghost small" data-u="${esc(u.user)}" data-op="reset">Mot de passe provisoire</button>
              <button class="btn ghost small" data-u="${esc(u.user)}" data-op="logout">Déconnecter</button>
              <button class="btn ghost small" data-u="${esc(u.user)}" data-op="${u.admin ? 'demote' : 'promote'}">${u.admin ? 'Retirer admin' : 'Rendre admin'}</button>
              <button class="btn ghost small" data-u="${esc(u.user)}" data-op="${u.disabled ? 'enable' : 'disable'}">${u.disabled ? 'Débloquer' : 'Bloquer'}</button>
              <button class="btn danger small" data-u="${esc(u.user)}" data-op="delete">Supprimer</button></div>`}
          </details>`).join('')}
        </section>`;
    }
    body.addEventListener('click', async e => {
      const t = e.target.closest('button');
      if (!t) return;
      try {
        if (t.matches('[data-open]')) { await api('adminsettings', { openSignup: !t.classList.contains('on') }); }
        else if (t.dataset.code) { const label = await promptBox('Note pour ce code (facultatif)', { placeholder: 'ex. : pour Sarah' }); if (label === null) return; const r = await api('codecreate', { type: t.dataset.code, label }); await promptBox('Code créé : à transmettre', { value: r.code.slice(0, 4) + '-' + r.code.slice(4), ok: 'OK' }); }
        else if (t.dataset.cup) { await api('codeupdate', { code: t.dataset.cup, disabled: t.dataset.dis === '1' }); }
        else if (t.dataset.cdel) { if (!await confirmBox('Supprimer ce code ?', { danger: true, ok: 'Supprimer' })) return; await api('codeupdate', { code: t.dataset.cdel, delete: true }); }
        else if (t.dataset.op) {
          const who = t.dataset.u, op = t.dataset.op;
          const ask = { delete: `Supprimer le compte « ${who} » et toute sa progression ?`, reset: `Donner un mot de passe provisoire à « ${who} » ? Ses appareils seront déconnectés.`, disable: `Bloquer « ${who} » ?` }[op];
          if (ask && !await confirmBox(ask, { danger: op === 'delete', ok: 'Confirmer' })) return;
          const r = await api('adminuser', { user: who, op });
          if (r.password) await promptBox(`Mot de passe provisoire de ${who} (il devra le changer) :`, { value: r.password, ok: 'OK' });
        } else return;
        load();
      } catch (err) { toast(err.message, 'alert'); }
    });
    load();
  }

  // ---------- Contact (même formulaire que Carnet : arrive dans le tableau de bord /contact du site) ----------
  const CONTACT_TYPES = [['traduction', 'Erreur de traduction ou de phrase'], ['bug', 'Bug / erreur'], ['idee', 'Idée / amélioration'], ['code', 'Demande de code pour créer un compte'], ['remarque', 'Remarque'], ['autre', 'Autre']];
  const CONTACT_PH = {
    traduction: 'Quel mot ou quelle phrase ? Quelle traduction serait la bonne ?', bug: 'Décris le problème : ce que tu faisais, ce qui s\'est passé…',
    idee: 'Décris ton idée…', code: 'Présente-toi en quelques mots : tu recevras un code pour créer ton compte.', remarque: 'Ton message…', autre: 'Ton message…',
  };
  function contactForm(type = 'bug', context = '') {
    const el = openSheet(`<div class="page"><header class="page-top"><button class="icon-btn" data-close aria-label="Retour">${icon('back')}</button><h2>${type === 'code' ? 'Demander un code' : 'Nous contacter'}</h2><span></span></header>
      <form class="page-body col">
        <label class="lab">Objet<select class="input" name="type">${CONTACT_TYPES.map(([v, l]) => `<option value="${v}" ${v === type ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        ${context ? `<p class="ctx">${esc(context)}</p>` : ''}
        <label class="lab">Message<textarea class="input" name="message" rows="6"></textarea></label>
        <label class="lab"><span class="ct-lbl"></span><input class="input" name="contact" autocomplete="email" placeholder="Nom, e-mail…" value="${esc(Store.account && Store.account.user ? Store.account.user : '')}"></label>
        <p class="err" hidden></p>
        <button class="btn primary big wide">Envoyer</button>
      </form></div>`, { cls: 'full' });
    const f = $('form', el), err = $('.err', el);
    const paint = () => { f.message.placeholder = CONTACT_PH[f.type.value]; $('.ct-lbl', el).textContent = f.type.value === 'code' ? 'E-mail ou contact pour recevoir le code' : 'Contact (facultatif)'; };
    f.type.onchange = paint; paint();
    setTimeout(() => f.message.focus(), 200);
    f.onsubmit = async e => {
      e.preventDefault();
      const t = f.type.value, message = f.message.value.trim(), contact = f.contact.value.trim();
      if (t === 'code' && !contact) { err.textContent = 'Indique un moyen de te répondre pour recevoir le code.'; err.hidden = false; return; }
      if (!message && t !== 'code') { err.textContent = 'Écris un message.'; err.hidden = false; return; }
      const b = $('button.primary', f); b.disabled = true; b.textContent = 'Envoi…';
      try {
        const r = await fetch('/contact_save.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          appTitle: 'Kalima', type: t, message: (context ? `[${context}]\n` : '') + (message || 'Demande de code pour créer un compte Kalima.'), contact,
          user: (Store.account && Store.account.user) || '', lang: cur() || '', deviceId: Store.dev, timestamp: Date.now(), userAgent: navigator.userAgent }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.success) throw new Error();
        closeSheet(); toast(t === 'code' ? 'Demande envoyée : tu recevras ton code par le contact indiqué' : 'Message envoyé, merci !', 'check');
      } catch { err.textContent = 'Envoi impossible pour le moment. Vérifie ta connexion et réessaie.'; err.hidden = false; b.disabled = false; b.textContent = 'Envoyer'; }
    };
  }

  return { notifSettings, contactForm, home, words, progress, settings, chooseLangs, placement, alphabet, alphaLesson, pathList, pathStep, wordSheet, accountAction, admin, syncText };
})();
