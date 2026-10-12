// Déroulé d'une session d'exercices (plein écran) : présentation des nouveaux mots, exercices, correction, bilan.
// Chaque réponse est enregistrée tout de suite (progression + exercice en cours, synchronisés) : on peut fermer
// l'app et reprendre exactement au même endroit, sur ce téléphone ou un autre.
const Session = (() => {
  let S = null;        // session en cours
  let D = null;        // contenu de la langue
  let box = null;      // feuille plein écran
  let answered = false;

  const code = () => S.code;
  const isAr = () => S.code === 'ar';
  const syn = lang => (D.synIndex || {})[lang];
  // Transcription latine de l'arabe : toujours, jamais, ou tant que l'élément n'est pas connu.
  function showTl(key) {
    const m = Store.settings().tl || 'auto';
    if (m === 'always') return true;
    if (m === 'never') return false;
    return Engine.stage(key) < Engine.KNOWN;
  }
  const tgText = x => (x.kind === 's' ? Content.first(x) : x.w);
  const tgHtml = (x, key, big = false) => isAr()
    ? `<span class="ar ${big ? 'ar-big' : ''}" dir="rtl">${esc(tgText(x))}</span>${showTl(key) || Engine.arNovice('ar') ? `<span class="tl ${big && Engine.arNovice('ar') ? 'big' : ''}">${esc(x.tl)}</span>` : ''}`
    : `<span class="tg ${big ? 'tg-big' : ''}">${esc(tgText(x))}</span>`;
  const sayBtn = (text, cls = '') => `<button class="say ${cls}" data-say="${esc(text)}" aria-label="Écouter">${icon('volume')}</button>`;

  // ---------- Son, réglable dans la leçon (comme les annonces d'un GPS) ----------
  const MODES = [['muet', 'mute', 'Muet', 'rien ne se lit tout seul'], ['discret', 'volume', 'Discret', 'nouveaux mots, écoute, bonne réponse'], ['bavard', 'volume-loud', 'Bavard', 'tout est lu, à chaque fois']];
  const modeIcon = () => (MODES.find(m => m[0] === Audio2.mode()) || MODES[1])[1];
  const audioBtn = () => `<button class="icon-btn amode" data-amode aria-label="Son">${icon(modeIcon())}</button>`;
  function audioMenu(btn) {
    const old = $('.amenu', box);
    if (old) return old.remove();
    const m = document.createElement('div');
    m.className = 'amenu';
    m.innerHTML = MODES.map(([v, ic, l, t]) => `<button class="${Audio2.mode() === v ? 'on' : ''}" data-av="${v}">${icon(ic)}<span><b>${l}</b><small>${t}</small></span></button>`).join('');
    $('.ses', box).appendChild(m);
    m.onclick = e => {
      const b = e.target.closest('[data-av]');
      if (!b) return;
      Store.setSettings({ audio: b.dataset.av });
      if (b.dataset.av === 'muet') Audio2.stop();
      btn.innerHTML = icon(modeIcon());
      m.remove();
      toast(`Son : ${MODES.find(x => x[0] === b.dataset.av)[2]}`, MODES.find(x => x[0] === b.dataset.av)[1], 1400);
    };
  }

  // ---------- Ouverture ----------
  async function start(code, kind = 'daily', saved = null) {
    try { D = await Content.load(code); } catch { toast('Contenu indisponible hors ligne pour le moment', 'cloud'); return; }
    // Débutant : tant que les premiers pas ne sont pas finis, les nouveautés viennent du parcours, dans l'ordre.
    if (!saved && kind !== 'review' && Engine.pathOn(code, D)) return Views.pathStep(code, Engine.pathInfo(code, D).next);
    S = saved || await Engine.buildSession(code, kind);
    if (!S.queue.length) { toast(kind === 'review' ? 'Rien à réviser pour le moment' : 'Tout est à jour, bravo !', 'check'); return; }
    box = openSheet(`
      <div class="ses">
        <header class="ses-top">
          <button class="icon-btn" data-quit aria-label="Fermer">${icon('close')}</button>
          <div class="bar"><i></i></div>
          ${audioBtn()}<span class="ses-xp">${icon('spark')}<b>0</b></span>
        </header>
        <main class="ses-body"></main>
        <footer class="ses-foot"></footer>
      </div>`, { cls: 'full', onClose: () => { Audio2.stop(); S && S.queue && S.i < S.queue.length && saveResume(); S = null; App.refresh(); } });
    $('[data-quit]', box).onclick = () => closeSheet();
    box.addEventListener('click', e => {
      const am = e.target.closest('[data-amode]');
      if (am) return audioMenu(am);
      if (!e.target.closest('.amenu')) { const m = $('.amenu', box); if (m) m.remove(); }
      const b = e.target.closest('[data-say]');
      if (b) { e.stopPropagation(); Audio2.say(b.dataset.say, S.code, { slow: b.dataset.slow === '1' }); }
    });
    next(true);
  }
  // Étape du parcours « premiers pas ».
  async function path(code, idx) { start(code, 'path', await Engine.buildPath(code, idx)); }
  function resume(code) { const r = Store.resume(code); if (r && r.queue) start(code, r.kind, { ...r, fails: r.fails || {} }); }
  function saveResume() {
    if (!S || S.custom) return;
    const left = S.queue.length - S.i;
    if (left <= 0) return Store.setResume(S.code, null);
    Store.setResume(S.code, { kind: S.kind, queue: S.queue, i: S.i, done: S.done.slice(-60), started: S.started, xp: S.xp, fails: S.fails, step: S.step, title: S.title, pool: S.pool });
  }

  function progress() {
    const real = S.queue.filter(e => e.t !== 'intro');
    const doneN = S.queue.slice(0, S.i).filter(e => e.t !== 'intro').length;
    $('.bar i', box).style.width = `${Math.round(100 * doneN / Math.max(1, real.length))}%`;
    $('.ses-xp b', box).textContent = S.xp;
  }

  // ---------- Exercice suivant ----------
  function next(first = false) {
    if (!S) return;
    if (!first) S.i++;
    if (S.i >= S.queue.length) return end();
    answered = false;
    progress();
    const ex = S.queue[S.i];
    const body = $('.ses-body', box), foot = $('.ses-foot', box);
    foot.innerHTML = '';
    foot.className = 'ses-foot';
    body.scrollTop = 0;
    if (ex.custom) return renderCustom(ex, body, foot);
    const x = D.byId.get(ex.key);
    if (!x) return next();
    if (/cloze/.test(ex.t) && !x.ex) ex.t = 'mcq-tg';
    const R = RENDER[ex.t] || RENDER['mcq-fr'];
    body.innerHTML = '';
    R(ex, x, body, foot);
    // Contrôle d'un mot plus facile que le niveau : on le dit, pour que ce ne soit pas une surprise.
    if (ex.ctrl) body.insertAdjacentHTML('afterbegin', `<span class="kicker ctrl">${icon('check')} Petit contrôle · ${x.l}</span>`);
  }

  // Pied de page : bouton Valider / Continuer.
  function footBtn(foot, label, fn, cls = 'primary') {
    foot.innerHTML = `<button class="btn ${cls} big wide">${label}</button>`;
    $('button', foot).onclick = fn;
  }

  // ---------- Correction ----------
  // res : 'ok' | 'close' | 'ko' ; info : { answer (html), notes [], tip, say (texte cible à lire) }
  function feedback(ex, x, res, info = {}) {
    if (answered) return;
    answered = true;
    const foot = $('.ses-foot', box);
    const verify = ex.verify;
    // Points : plus pour un exercice écrit.
    const typed = /type|cloze-type|irr/.test(ex.t);
    const pts = res === 'ok' ? (typed ? 15 : 10) : res === 'close' ? 5 : 0;
    if (ex.key && !ex.custom) {
      const prev = Engine.stage(ex.key);
      if (verify && res === 'ok') Engine.markKnown(ex.key);
      else Engine.grade(ex.key, res);
      Engine.adapt(S, ex, res, prev);
    }
    addXp(pts);
    S.done.push({ key: ex.key, t: ex.t, res });
    // Une erreur : l'élément revient une fois plus loin (s'il ne revient pas déjà), sans jamais dépasser 3 passages.
    if (res === 'ko' && ex.key && !ex.custom) {
      const uses = S.queue.filter(e => e.key === ex.key && e.t !== 'intro').length;
      const later = S.queue.slice(S.i + 1).some(e => e.key === ex.key);
      if (!later && uses < 3) S.queue.splice(Math.min(S.queue.length, S.i + 4), 0, { key: ex.key, t: x.kind === 'w' ? (isAr() ? 'mcq-tg' : 'mcq-fr') : 'mcq-tg', nc: ex.nc, retry: 1 });
    }
    saveResume();
    const title = res === 'ok' ? pick(['Bravo !', 'Exact !', 'Parfait !', 'Bien joué !']) : res === 'close' ? 'Presque !' : 'Pas tout à fait';
    const notes = (info.notes || []).map(n => `<p class="fb-note">${icon('info')}<span>${esc(n)}</span></p>`).join('');
    foot.className = `ses-foot fb fb-${res}`;
    foot.innerHTML = `
      <div class="fb-head">${icon(res === 'ok' ? 'check' : res === 'close' ? 'half' : 'close')}<b>${title}</b>${pts ? `<span class="fb-pts">+${pts}</span>` : ''}</div>
      ${info.answer ? `<div class="fb-ans">${res === 'ok' ? '' : '<small>Réponse attendue</small>'}${info.answer}</div>` : ''}
      ${notes}
      ${info.tip ? `<p class="fb-tip">${icon('bulb')}<span>${esc(info.tip)}</span></p>` : ''}
      <button class="btn big wide ${res === 'ok' ? 'good' : res === 'close' ? 'warn' : 'bad'}" data-next>Continuer</button>
      ${x && !ex.custom ? '<button class="link small report" data-report>Signaler une erreur dans cet exercice</button>' : ''}`;
    const rep = $('[data-report]', foot);
    if (rep) rep.onclick = () => Views.contactForm('traduction', `${Content.LANGS[S.code].name} · ${x.kind === 'w' ? x.w + ' = ' + x.fr.join(', ') : x.kind === 's' ? Content.first(x) + ' = ' + Content.firstFr(x) : x.b} · exercice ${ex.t}`);
    $('[data-next]', foot).onclick = () => { Audio2.stop(); next(); };
    setTimeout(() => { const b = $('[data-next]', foot); b && b.focus(); }, 50);
    if (info.say) Audio2.auto(res === 'ok' ? 'answer' : 'show', info.say, S.code).then(() => {}, () => {});
    if (res !== 'ok' && info.say && Audio2.mode() === 'discret') Audio2.say(info.say, S.code);
    if (navigator.vibrate && res === 'ko') navigator.vibrate(60);
  }

  function addXp(n) {
    if (!n) return;
    const before = Store.xpDay();
    const goal = +Store.settings().goal || 60;
    Store.addXp(n);
    S.xp += n;
    if (before < goal && before + n >= goal) { Store.addXp(20); S.xp += 20; toast('Objectif du jour atteint : +20', 'flame'); }
    progress();
  }

  // ---------- Briques d'affichage ----------
  function choices(body, opts, answer, { onPick, ar = false, sayOpts = false } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'choices' + (ar ? ' ar-choices' : '');
    wrap.innerHTML = opts.map((o, k) => `<button class="choice" data-k="${k}">${o.html || esc(o.label)}</button>`).join('');
    body.appendChild(wrap);
    $$('.choice', wrap).forEach(b => (b.onclick = () => {
      if (answered) { const o = opts[+b.dataset.k]; if (o.say) Audio2.say(o.say, S.code); return; }
      const o = opts[+b.dataset.k];
      const ok = o.label === answer;
      $$('.choice', wrap).forEach(c => { const oo = opts[+c.dataset.k]; if (oo.label === answer) c.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      wrap.classList.add('done');
      onPick(ok, o);
    }));
    return wrap;
  }
  function typeBox(body, foot, { placeholder = 'Ta réponse', lang = 'en', onCheck, dk = true }) {
    const f = document.createElement('div');
    f.className = 'typebox';
    f.innerHTML = `<textarea class="input answer" rows="2" placeholder="${esc(placeholder)}" autocomplete="off" autocapitalize="off" spellcheck="false" ${lang === 'ar' ? 'dir="rtl"' : ''}></textarea>`;
    body.appendChild(f);
    const ta = $('textarea', f);
    setTimeout(() => ta.focus(), 120);
    const go = () => { if (answered) return; const v = ta.value.trim(); if (!v) return; ta.disabled = true; onCheck(v); };
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } });
    foot.innerHTML = `<div class="row">${dk ? '<button class="btn ghost" data-dk>Je ne sais pas</button>' : ''}<button class="btn primary big grow" data-go>Valider</button></div>`;
    $('[data-go]', foot).onclick = go;
    const dkb = $('[data-dk]', foot);
    if (dkb) dkb.onclick = () => { if (!answered) { ta.disabled = true; onCheck(''); } };
    return ta;
  }
  // Étiquettes à remettre dans l'ordre.
  function tiles(body, foot, words, extra, { lang, onCheck }) {
    const wrap = document.createElement('div');
    wrap.className = 'tiles' + (lang === 'ar' ? ' ar-tiles' : '');
    const all = shuffle([...words, ...extra].map((w, k) => ({ w, k })));
    wrap.innerHTML = `<div class="tiles-line" ${lang === 'ar' ? 'dir="rtl"' : ''}></div><div class="tiles-bank" ${lang === 'ar' ? 'dir="rtl"' : ''}>${all.map(t => `<button class="tile" data-k="${t.k}">${esc(t.w)}</button>`).join('')}</div>`;
    body.appendChild(wrap);
    const line = $('.tiles-line', wrap), bank = $('.tiles-bank', wrap);
    wrap.addEventListener('click', e => {
      const t = e.target.closest('.tile');
      if (!t || answered) return;
      if (t.parentElement === bank) {
        const c = t.cloneNode(true); c.dataset.from = t.dataset.k; line.appendChild(c); t.classList.add('used'); t.disabled = true;
        if (Audio2.chatty() && lang !== 'fr') Audio2.say(t.textContent, S.code);
      } else { const o = $(`.tile[data-k="${t.dataset.from}"]`, bank); if (o) { o.classList.remove('used'); o.disabled = false; } t.remove(); }
      $('[data-go]', foot).disabled = !line.children.length;
    });
    foot.innerHTML = `<div class="row"><button class="btn ghost" data-dk>Je ne sais pas</button><button class="btn primary big grow" data-go disabled>Valider</button></div>`;
    $('[data-go]', foot).onclick = () => { if (!answered) onCheck($$('.tile', line).map(t => t.textContent).join(' ')); };
    $('[data-dk]', foot).onclick = () => { if (!answered) onCheck(''); };
  }
  // Découpe d'une phrase en étiquettes (la ponctuation reste collée au mot).
  // Sans ponctuation ni majuscule de début de phrase : les étiquettes ne doivent pas trahir l'ordre (« I » reste « I »).
  const splitWords = (s, lang) => s.split(/\s+/).map(w => w.replace(/^[¿¡«"“]+|[.,!?;:…»"”؟،]+$/g, '')).filter(Boolean)
    .map((w, k) => (k > 0 || lang === 'ar' || !common(w, lang)) ? w : w[0].toLowerCase() + w.slice(1));
  // Premier mot d'une phrase : en minuscule s'il s'agit d'un mot courant (pas « Paris », ni « I »).
  const FUNC = new Set('the a an do does did is are was were be have has had can could would will should must may might what where when who why how which this that these those there here it he she we they you my your his her its our their let please if so not no yes and but or because as at in on for to of with from by about after before never always often sometimes nobody everyone everything something nothing un une le la les l j je tu il elle on nous vous ils elles c ce ça cette mon ma mes ton ta tes son sa ses qu que qui quand où comment pourquoi est-ce il y d de du des pas ne n merci bonjour'.split(' '));
  function common(w, lang) {
    if (w === 'I' || /^I'/.test(w) || w.slice(1) !== w.slice(1).toLowerCase()) return false;
    const lw = w.toLowerCase().replace(/'.*$/, '');
    if (FUNC.has(lw)) return true;
    if (lang !== 'fr') { if (!D._lower) D._lower = new Set(D.words.map(x => x.w.toLowerCase())); return D._lower.has(w.toLowerCase()); }
    return lang === 'fr' && !/^(Paris|Londres|Lyon|Marseille|France|Japon|Espagne|Rome|Tom|Sarah)$/.test(w);
  }
  function extraTiles(sent, lang, n = 3) {
    const own = new Set(splitWords(lang === 'fr' ? Content.firstFr(sent) : Content.first(sent), lang).map(w => Check.norm(w)));
    const pool = Content.sentDistractors(D, sent, 6).flatMap(o => splitWords(lang === 'fr' ? Content.firstFr(o) : Content.first(o), lang));
    return shuffle(pool.filter(w => !own.has(Check.norm(w)) && w.length > 1)).filter((w, k, a) => a.findIndex(y => Check.norm(y) === Check.norm(w)) === k).slice(0, n);
  }
  function question(body, label, html = '') {
    const q = document.createElement('div');
    q.className = 'q';
    q.innerHTML = `<p class="q-label">${esc(label)}</p>${html}`;
    body.appendChild(q);
    return q;
  }
  // Mauvaises réponses d'un QCM : ex.nc choix en tout (4 par défaut). Dans un parcours, d'abord parmi ce qu'on a
  // déjà vu (« oui » contre « non ») ; jamais deux réponses justes (même traduction ou même texte).
  const frOf = o => (o.kind === 'w' ? o.fr[0] : Content.firstFr(o));
  function wrongs(ex, x) {
    const n = (ex.nc || 4) - 1;
    const out = [];
    const shown = new Set([Check.norm(frOf(x)), Check.norm(tgText(x))]);
    const add = o => {
      if (!o || out.length >= n || Content.clash(D, x, o) || out.some(y => Content.clash(D, y, o))) return;
      const f = Check.norm(frOf(o)), t = Check.norm(tgText(o));
      if (shown.has(f) || shown.has(t)) return;
      shown.add(f); shown.add(t); out.push(o);
    };
    for (const k of shuffle((S.pool || []).slice())) add(D.byId.get(k));
    // Mots et expressions mélangés pour l'arabe (« bonjour » peut être l'un ou l'autre) : les pièges aussi.
    const more = x.kind === 'w' ? Content.distractors(D, x, n + 3) : Content.sentDistractors(D, x, n + 3);
    for (const o of more) add(o);
    return out;
  }

  // Phrase d'un texte à trous : l'exemple principal au début, puis une des autres phrases du mot (Tatoeba),
  // pour ne pas toujours revoir la même. Le choix est gardé dans l'exercice (reprise sur un autre appareil).
  function pickEx(ex, x) {
    const all = [[x.ex[0], x.ex[1], x.t, x.extl], ...(x.xs || [])];
    if (ex.xi === undefined) ex.xi = Engine.stage(ex.key) <= 0 || all.length === 1 ? 0 : Math.floor(Math.random() * all.length);
    const [s, fr, t, tl] = all[Math.min(ex.xi, all.length - 1)];
    return { s, fr, t, tl };
  }
  // Exemple avec la cible en gras.
  const exHtml = (s, mark = 'b') => esc(s).replace(/\*([^*]+)\*/, `<${mark}>$1</${mark}>`);
  const plain = s => s.replace(/\*/g, '');
  const frList = w => w.fr.slice(0, 3).map(esc).join(', ');

  // Bonne réponse à afficher et à lire pour un élément.
  function answerOf(x, key) {
    if (x.kind === 'w') return { answer: `<div class="fb-word">${tgHtml(x, key)} <span class="fb-eq">=</span> <b>${frList(x)}</b>${sayBtn(x.w)}</div>${x.ex ? `<p class="fb-ex">${isAr() ? `<span class="ar" dir="rtl">${exHtml(x.ex[0])}</span>` : exHtml(x.ex[0])}<br><span class="muted">${esc(x.ex[1])}</span></p>` : ''}`, say: x.w };
    const tg = Content.first(x);
    return { answer: `<div class="fb-sent">${isAr() ? `<span class="ar" dir="rtl">${esc(tg)}</span><span class="tl">${esc(x.tl)}</span>` : esc(tg)}${sayBtn(tg)}</div><p class="muted">${esc(Content.firstFr(x))}</p>`, say: tg, tip: x.tip };
  }

  // ---------- Exercices ----------
  const RENDER = {
    // Présentation d'un nouveau mot (ou d'une expression arabe).
    intro(ex, x, body, foot) {
      const isW = x.kind === 'w';
      const tg = tgText(x);
      body.innerHTML = `
        <div class="intro">
          <span class="kicker">${ex.probe ? 'Un mot de plus' : isW ? 'Nouveau mot' : 'Nouvelle expression'} · ${x.l}</span>
          <div class="intro-w">${isAr() ? `<span class="ar ar-big" dir="rtl">${esc(tg)}</span>` : `<span class="tg-big">${esc(tg)}</span>`}${sayBtn(tg, 'big')}</div>
          ${isAr() ? `<p class="tl ${Engine.arNovice('ar') ? 'huge' : 'big'}">${esc(x.tl)}</p>` : ''}
          ${isAr() && Engine.arNovice('ar') && S.kind === 'path' && Engine.pathInfo('ar', D).done < 3 ? `<p class="muted small">Écoute (${icon('volume', 'sm')}) et répète. Pas besoin de lire l'écriture arabe pour l'instant : la prononciation est écrite en lettres latines juste au-dessus.</p>` : ''}
          ${isW ? `<p class="pos">${POS[x.p] || ''}</p>` : ''}
          <p class="intro-tr">${esc(x.fr[0])}</p>
          ${x.fr.length > 1 ? `<p class="muted">aussi : ${x.fr.slice(1, 4).map(esc).join(', ')}</p>` : ''}
          ${isW && x.ex && !Engine.arNovice(S.code) ? `<div class="intro-ex">${isAr() ? `<p class="ar" dir="rtl">${exHtml(x.ex[0])} ${sayBtn(plain(x.ex[0]), 'small')}</p><p class="tl">${esc(x.extl)}</p>` : `<p>${exHtml(x.ex[0])} ${sayBtn(plain(x.ex[0]), 'small')}</p>`}<p class="muted">${esc(x.ex[1])}</p></div>` : ''}
          ${x.tip ? `<p class="fb-tip">${icon('bulb')}<span>${esc(x.tip)}</span></p>` : ''}
          ${Audio2.canListen() ? `<button class="btn ghost small" data-rep>${icon('mic')} Répète à voix haute</button><p class="rep-res muted small"></p>` : ''}
        </div>`;
      foot.innerHTML = `<div class="row"><button class="btn ghost" data-know>Je le connais déjà</button><button class="btn primary big grow" data-go>Continuer</button></div>`;
      Engine.introduce(ex.key);
      addXp(2);
      Audio2.auto('new', tg, S.code).then(() => { if (Audio2.chatty() && isW && x.ex && S && S.queue[S.i] === ex) Audio2.say(plain(x.ex[0]), S.code); });
      const rep = $('[data-rep]', body);
      if (rep) rep.onclick = async () => {
        rep.disabled = true; $('.rep-res', body).textContent = 'Je t\'écoute…';
        const r = await Audio2.listen(tg, S.code);
        rep.disabled = false;
        $('.rep-res', body).textContent = !r ? 'Je n\'ai rien entendu, réessaie.' : r.ok ? 'Bien prononcé !' : `J'ai entendu « ${r.heard} ». Réécoute et réessaie.`;
      };
      $('[data-go]', foot).onclick = () => { S.done.push({ key: ex.key, t: 'intro', res: 'seen' }); saveResume(); next(); };
      // « Je le connais » : on vérifie avec une seule question plus difficile, au lieu des exercices prévus.
      $('[data-know]', foot).onclick = () => {
        const later = S.queue.slice(S.i + 1).filter(e => e.key === ex.key);
        for (const e of later) S.queue.splice(S.queue.indexOf(e), 1);
        S.queue.splice(Math.min(S.queue.length, S.i + 2), 0, { key: ex.key, t: isW ? (isAr() ? 'mcq-tg' : pick(['type-tg', 'cloze-type'])) : (isAr() ? 'mcq-tg' : 'type-tg'), verify: 1 });
        S.done.push({ key: ex.key, t: 'intro', res: 'seen' });
        next();
      };
    },

    // Mot / phrase dans la langue apprise → sens en français.
    'mcq-fr'(ex, x, body) {
      const isW = x.kind === 'w';
      question(body, isW ? 'Que veut dire ce mot ?' : isAr() ? 'Que veut dire cette expression ?' : 'Que veut dire cette phrase ?', `<div class="q-main">${tgHtml(x, ex.key, true)}${sayBtn(tgText(x))}</div>`);
      const others = wrongs(ex, x).map(frOf);
      const ans = frOf(x);
      const opts = shuffle([ans, ...others]).map(l => ({ label: l }));
      Audio2.auto('show', tgText(x), S.code);
      choices(body, opts, ans, { onPick: ok => feedback(ex, x, ok ? 'ok' : 'ko', { ...answerOf(x, ex.key), always: true }) });
    },
    // Français → mot / phrase dans la langue apprise.
    'mcq-tg'(ex, x, body) {
      const isW = x.kind === 'w';
      question(body, isW ? 'Comment dit-on…' : isAr() ? 'Comment dit-on…' : 'Quelle est la bonne phrase ?', `<div class="q-main"><span class="${isW ? 'fr-big' : 'fr-sent'}">${esc(frOf(x))}</span></div>`);
      const others = wrongs(ex, x);
      const nov = Engine.arNovice(S.code);
      const mk = o => ({ label: o.key, say: tgText(o), html: !isAr() ? esc(tgText(o)) : nov ? `<b class="tl-main">${esc(o.tl)}</b><small class="ar" dir="rtl">${esc(tgText(o))}</small>`
        : `<span class="ar" dir="rtl">${esc(tgText(o))}</span>${showTl(ex.key) ? `<small class="tl">${esc(o.tl)}</small>` : ''}` });
      const opts = shuffle([x, ...others].map(mk));
      choices(body, opts, x.key, { ar: isAr() && !nov, onPick: ok => feedback(ex, x, ok ? 'ok' : 'ko', answerOf(x, ex.key)) });
      if (Audio2.chatty()) $$('.choice', body).forEach(b => b.addEventListener('pointerdown', () => { if (!answered) Audio2.say(opts[+b.dataset.k].say, S.code); }));
    },
    // Écoute → sens.
    'listen-fr'(ex, x, body) {
      const tg = tgText(x);
      question(body, x.kind === 'w' ? 'Écoute : que veut dire ce mot ?' : isAr() ? 'Écoute : que veut dire cette expression ?' : 'Écoute : que veut dire cette phrase ?', `<div class="listen">${sayBtn(tg, 'huge')}<button class="say slow" data-say="${esc(tg)}" data-slow="1" aria-label="Plus lentement">${icon('turtle')}</button></div>`);
      const others = wrongs(ex, x).map(frOf);
      const ans = frOf(x);
      Audio2.auto('listen', tg, S.code);
      choices(body, shuffle([ans, ...others]).map(l => ({ label: l })), ans, { onPick: ok => feedback(ex, x, ok ? 'ok' : 'ko', { ...answerOf(x, ex.key), always: true }) });
    },
    // Écoute → écrire le mot.
    'listen-type'(ex, x, body, foot) {
      question(body, 'Écoute et écris le mot', `<div class="listen">${sayBtn(x.w, 'huge')}<button class="say slow" data-say="${esc(x.w)}" data-slow="1" aria-label="Plus lentement">${icon('turtle')}</button></div>`);
      Audio2.auto('listen', x.w, S.code);
      typeBox(body, foot, { placeholder: 'Le mot entendu', lang: S.code, onCheck: v => {
        const r = Check.word([x.w], v, S.code, syn(S.code));
        feedback(ex, x, r.ok ? 'ok' : r.half ? 'close' : 'ko', { ...answerOf(x, ex.key), notes: Check.notesText(r) });
      } });
    },
    // Phrase à trous, avec des choix.
    'cloze-bank'(ex, x, body) {
      const { s, fr, t, tl } = pickEx(ex, x);
      const parts = s.split(/\*[^*]+\*/);
      question(body, 'Complète la phrase', `<div class="q-main sent ${isAr() ? 'ar' : ''}" ${isAr() ? 'dir="rtl"' : ''}>${esc(parts[0])}<span class="blank">_____</span>${esc(parts[1] || '')}</div><p class="muted">${esc(fr)}</p>`);
      const others = Content.distractors(D, x, 3, 'w').map(o => o.t || o.w);
      const opts = shuffle([t, ...others].filter((v, k, a) => a.indexOf(v) === k)).map(l => ({ label: l, say: l, html: isAr() ? `<span class="ar" dir="rtl">${esc(l)}</span>` : esc(l) }));
      if (Audio2.chatty()) Audio2.say(plain(s).replace(t, '…'), S.code);
      // Correction : la phrase complète (et sa transcription pour l'arabe).
      const full = `<p class="fb-ex">${isAr() ? `<span class="ar" dir="rtl">${exHtml(s)}</span>${tl ? `<span class="tl">${esc(tl)}</span>` : ''}` : exHtml(s)}<br><span class="muted">${esc(fr)}</span></p>`;
      choices(body, opts, t, { ar: isAr(), onPick: ok => feedback(ex, x, ok ? 'ok' : 'ko', { ...answerOf(x, ex.key), answer: answerOf(x, ex.key).answer.replace(/<p class="fb-ex">[\s\S]*<\/p>$/, '') + full, say: plain(s) }) });
    },
    // Phrase à trous, à écrire.
    'cloze-type'(ex, x, body, foot) {
      const { s, fr, t } = pickEx(ex, x);
      const parts = s.split(/\*[^*]+\*/);
      question(body, 'Complète la phrase', `<div class="q-main sent">${esc(parts[0])}<span class="blank">${esc(t[0])}…</span>${esc(parts[1] || '')}</div><p class="muted">${esc(fr)}</p>`);
      typeBox(body, foot, { placeholder: 'Le mot manquant', lang: S.code, onCheck: v => {
        const r = Check.word([t], v, S.code, syn(S.code));
        feedback(ex, x, r.ok ? 'ok' : r.half ? 'close' : 'ko', { ...answerOf(x, ex.key), say: plain(s), notes: Check.notesText(r) });
      } });
    },
    // Écrire dans la langue apprise : un mot, ou une phrase (formulation libre, synonymes acceptés).
    'type-tg'(ex, x, body, foot) {
      if (x.kind === 'w') {
        question(body, 'Comment dit-on…', `<div class="q-main"><span class="fr-big">${esc(x.fr[0])}</span></div>${x.p === 'v' ? '<p class="muted small">(un verbe)</p>' : ''}`);
        typeBox(body, foot, { placeholder: Content.inLang(S.code).replace(/^e/, 'E'), lang: S.code, onCheck: v => {
          const r = Check.word([x.w], v, S.code, syn(S.code));
          feedback(ex, x, r.ok ? 'ok' : r.half ? 'close' : 'ko', { ...answerOf(x, ex.key), notes: Check.notesText(r) });
        } });
        return;
      }
      const fr = Content.firstFr(x);
      question(body, `Traduis ${Content.inLang(S.code)}`, `<div class="q-main"><span class="fr-sent">${esc(fr)}</span></div><p class="muted small">Plusieurs formulations sont acceptées.</p>`);
      typeBox(body, foot, { placeholder: `Ta phrase ${Content.inLang(S.code)}`, lang: S.code, onCheck: v => sentFeedback(ex, x, Check.sentence(x.tg, v, S.code, syn(S.code)), S.code) });
    },
    // Écrire en français.
    'type-fr'(ex, x, body, foot) {
      const tg = Content.first(x);
      question(body, 'Traduis en français', `<div class="q-main"><span class="tg">${esc(tg)}</span>${sayBtn(tg)}</div>`);
      Audio2.auto('show', tg, S.code);
      typeBox(body, foot, { placeholder: 'Ta phrase en français', lang: 'fr', onCheck: v => sentFeedback(ex, x, Check.sentence(x.fr, v, 'fr', syn('fr')), 'fr') });
    },
    // Reconstruire la phrase avec des étiquettes.
    'tiles-tg'(ex, x, body, foot) {
      const tg = Content.first(x);
      question(body, isAr() ? 'Construis la phrase en arabe' : `Traduis ${Content.inLang(S.code)}`, `${ex.boss ? `<span class="kicker boss">${icon('flame')} Défi final</span>` : ''}<div class="q-main"><span class="fr-sent">${esc(Content.firstFr(x))}</span></div>`);
      tiles(body, foot, splitWords(tg, S.code), extraTiles(x, S.code, isAr() ? 1 : 2), { lang: S.code, onCheck: v => sentFeedback(ex, x, Check.sentence(x.tg, v, S.code, syn(S.code)), S.code) });
    },
    'tiles-fr'(ex, x, body, foot) {
      const tg = Content.first(x);
      question(body, 'Traduis en français', `<div class="q-main"><span class="tg">${esc(tg)}</span>${sayBtn(tg)}</div>`);
      Audio2.auto('show', tg, S.code);
      tiles(body, foot, splitWords(Content.firstFr(x), 'fr'), extraTiles(x, 'fr', 3), { lang: 'fr', onCheck: v => sentFeedback(ex, x, Check.sentence(x.fr, v, 'fr', syn('fr')), 'fr') });
    },
    // Dictée : écouter et reconstruire.
    'listen-tiles'(ex, x, body, foot) {
      const tg = Content.first(x);
      question(body, 'Écoute et reconstruis la phrase', `<div class="listen">${sayBtn(tg, 'huge')}<button class="say slow" data-say="${esc(tg)}" data-slow="1" aria-label="Plus lentement">${icon('turtle')}</button></div>`);
      Audio2.auto('listen', tg, S.code);
      tiles(body, foot, splitWords(tg, S.code), extraTiles(x, S.code, 2), { lang: S.code, onCheck: v => sentFeedback(ex, x, Check.sentence(x.tg, v, S.code, syn(S.code)), S.code) });
    },
    // Verbe irrégulier (anglais) : une forme à écrire, rappel des trois formes à la correction.
    irr(ex, v, body, foot) {
      const want = Math.random() < 0.5 ? 'p' : 'pp';
      question(body, want === 'p' ? 'Le prétérit (passé simple) de…' : 'Le participe passé de…', `<div class="q-main"><span class="tg-big">to ${esc(v.b)}</span>${sayBtn(v.b)}</div><p class="muted">${esc(v.fr)}${want === 'pp' ? ' · I have …' : ' · Yesterday I …'}</p>`);
      typeBox(body, foot, { placeholder: want === 'p' ? 'Prétérit' : 'Participe passé', lang: 'en', onCheck: val => {
        const ok = v[want].split('/').some(f => Check.norm(f) === Check.norm(val));
        feedback(ex, v, ok ? 'ok' : 'ko', { answer: `<div class="irr3">${[['Base', v.b], ['Prétérit', v.p], ['Participe', v.pp]].map(([l, f]) => `<span><small>${l}</small><b>${esc(f)}</b></span>`).join('')}</div>`, say: `${v.b}, ${v.p.replace('/', ', ')}, ${v.pp}`, always: true });
      } });
    },
  };
  const POS = { n: 'nom', v: 'verbe', adj: 'adjectif', adv: 'adverbe', prep: 'préposition', pron: 'pronom', conj: 'conjonction', det: 'déterminant', int: 'interjection', num: 'nombre', q: 'mot interrogatif', phr: 'expression' };

  function sentFeedback(ex, x, r, lang) {
    const res = r.ok ? 'ok' : r.half ? 'close' : 'ko';
    const tgLang = lang !== 'fr';
    const tg = Content.first(x);
    const shown = tgLang ? r.best : r.best;
    const html = `<div class="fb-sent ${lang === 'ar' ? 'ar' : ''}" ${lang === 'ar' ? 'dir="rtl"' : ''}>${r.level === 'exact' ? esc(shown) : r.ref ? Check.diffHtml(r) : esc(shown)}${tgLang ? sayBtn(tg) : ''}</div>
      ${lang === 'ar' ? `<p class="tl">${esc(x.tl)}</p>` : ''}
      <p class="muted">${esc(tgLang ? Content.firstFr(x) : tg)}</p>
      ${r.level === 'accepted' && Check.norm(r.best) !== Check.norm(tgLang ? tg : Content.firstFr(x)) ? `<p class="muted small">Formulation la plus courante : ${esc(tgLang ? tg : Content.firstFr(x))}</p>` : ''}`;
    const notes = Check.notesText(r);
    if (r.level === 'close' && !notes.length) notes.push('Le sens y est, il manque juste un petit mot ou une forme.');
    feedback(ex, x, res, { answer: html, notes, tip: x.tip, say: tg, always: true });
  }

  // ---------- Exercices « libres » (alphabet arabe, test de niveau) ----------
  function renderCustom(ex, body, foot) {
    const c = ex.custom;
    body.innerHTML = '';
    question(body, c.label, c.html || '');
    if (c.say && c.autoSay !== false) Audio2.auto('listen', c.say, 'ar');
    choices(body, c.options.map(o => ({ label: o, html: c.arOpts ? `<span class="ar" dir="rtl">${esc(o)}</span>` : esc(o) })), c.answer, {
      ar: c.arOpts, onPick: ok => { S.score = (S.score || 0) + (ok ? 1 : 0); feedback(ex, null, ok ? 'ok' : 'ko', { answer: c.info, say: c.say, always: true }); },
    });
  }
  function custom(code, items, meta) {
    Content.load(code).then(d => {
      D = d;
      S = { code, kind: 'custom', custom: true, queue: items.map(c => ({ custom: c, key: null })), i: 0, done: [], xp: 0, score: 0, meta, started: Date.now(), fails: {} };
      box = openSheet(`<div class="ses"><header class="ses-top"><button class="icon-btn" data-quit aria-label="Fermer">${icon('close')}</button><div class="bar"><i></i></div>${audioBtn()}<span class="ses-xp">${icon('spark')}<b>0</b></span></header><main class="ses-body"></main><footer class="ses-foot"></footer></div>`,
        { cls: 'full', onClose: () => { Audio2.stop(); S = null; App.refresh(); } });
      $('[data-quit]', box).onclick = () => closeSheet();
      box.addEventListener('click', e => {
        const am = e.target.closest('[data-amode]');
        if (am) return audioMenu(am);
        if (!e.target.closest('.amenu')) { const m = $('.amenu', box); if (m) m.remove(); }
        const b = e.target.closest('[data-say]'); if (b) Audio2.say(b.dataset.say, code, { slow: b.dataset.slow === '1' });
      });
      next(true);
    });
  }

  // ---------- Bilan ----------
  async function end() {
    const s = S;
    Store.setResume(s.code, null);
    const body = $('.ses-body', box), foot = $('.ses-foot', box);
    foot.className = 'ses-foot';
    $('.bar i', box).style.width = '100%';
    if (s.custom && s.meta && s.meta.onEnd) s.meta.onEnd(s);
    const graded = s.done.filter(r => r.res !== 'seen');
    const ok = graded.filter(r => r.res === 'ok').length, close = graded.filter(r => r.res === 'close').length;
    const pct = graded.length ? Math.round(100 * (ok + close / 2) / graded.length) : 100;
    const learned = [...new Set(s.done.filter(r => r.t === 'intro').map(r => r.key))].map(k => D.byId.get(k)).filter(Boolean);
    const missed = [...new Set(graded.filter(r => r.res === 'ko' && r.key).map(r => r.key))].map(k => D.byId.get(k)).filter(Boolean);
    if (!s.custom) Engine.snapshot(s.code, D);
    if (!s.custom && learned.length) {
      const l = Engine.L(s.code);
      const nd = l.newDay && l.newDay.d === today() ? l.newDay.n : 0;
      Store.setLang(s.code, { newDay: { d: today(), n: nd + learned.length }, toLearn: (l.toLearn || []).filter(k => !learned.some(w => w.key === k)) });
    }
    // Parcours : l'étape est faite (et on propose tout de suite la suivante).
    let nextStep = -1;
    const inPath = s.kind === 'path' || !!(s.meta && s.meta.path);
    if (s.kind === 'path' && pct >= 50) {
      const l = Engine.L(s.code);
      Store.setLang(s.code, { path: { ...(l.path || {}), [s.step]: Date.now() } });
    }
    if (inPath) nextStep = Engine.pathInfo(s.code, D).next;
    const nst = nextStep >= 0 ? D.path[nextStep] : null;
    const lv = Engine.levelInfo(s.code);
    const label = x => x.kind === 'w' ? (isAr() ? `<span class="ar">${esc(x.w)}</span> <small class="tl">${esc(x.tl)}</small>` : esc(x.w)) : esc(Content.first(x));
    body.innerHTML = `
      <div class="end">
        <div class="end-ring" style="--p:${pct}"><b>${pct}%</b><small>de réussite</small></div>
        <h2>${pct >= 90 ? 'Excellent !' : pct >= 70 ? 'Très bien !' : pct >= 50 ? 'Bon travail' : 'On continue, ça rentre !'}</h2>
        <div class="end-stats">
          <span>${icon('spark')}<b>+${s.xp}</b> points</span>
          <span>${icon('flame')}<b>${Engine.streak()}</b> jour${Engine.streak() > 1 ? 's' : ''} de suite</span>
          ${!s.custom ? `<span>${icon('level')}<b>${lv.code}</b> ${esc(lv.name)}</span>` : ''}
        </div>
        ${learned.length ? `<h4>Nouveaux mots</h4><div class="chips">${learned.map(x => `<span class="chip">${label(x)}</span>`).join('')}</div>` : ''}
        ${missed.length ? `<h4>À revoir bientôt</h4><div class="chips">${missed.map(x => `<span class="chip bad">${label(x)}</span>`).join('')}</div>` : ''}
        ${s.custom && s.meta && s.meta.endHtml ? s.meta.endHtml(s) : ''}
        ${s.kind === 'path' && pct < 50 ? '<p class="muted">Refais cette étape une fois avant de passer à la suite : elle sera plus facile maintenant.</p>' : inPath ? `<p class="muted">${nst ? `Étape suivante : <b>${esc(nst.alpha !== undefined ? D.alphabet.groups[nst.alpha].title : nst.title)}</b>` : 'Parcours terminé : la session du jour prend le relais.'}</p>` : ''}
      </div>`;
    foot.innerHTML = inPath
      ? `<div class="row"><button class="btn ghost" data-close>Terminer</button>${nst ? `<button class="btn primary big grow" data-step>${D.path[nextStep].id === s.step || (s.meta && s.meta.alpha === nst.alpha) ? 'Recommencer' : 'Étape suivante'}</button>` : ''}</div>`
      : `<div class="row">${!s.custom ? '<button class="btn ghost" data-more>Encore une session</button>' : ''}<button class="btn primary big grow" data-close>Terminer</button></div>`;
    const stp = $('[data-step]', foot);
    if (stp) stp.onclick = async () => { closeSheet(); await sleep(260); Views.pathStep(s.code, nextStep); };
    const more = $('[data-more]', foot);
    if (more) more.onclick = async () => { const c = s.code; closeSheet(); await sleep(260); start(c, s.kind === 'review' ? 'daily' : s.kind); };
    S = { ...s, i: s.queue.length }; // plus rien à reprendre
  }

  return { start, path, resume, custom, get active() { return !!S; }, get current() { return S && S.queue[S.i]; }, get queue() { return S && S.queue; } };
})();
