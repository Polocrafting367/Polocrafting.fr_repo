// Moteur d'apprentissage : progression de chaque mot, niveau, composition des sessions.
//
// Révision espacée par paliers : 0 (vu) → 1 j → 3 j → 7 j → 16 j → 35 j → 80 j → 180 j.
//   Juste = palier suivant ; presque = même palier, revu demain ; faux = deux paliers en arrière, revu tout de suite.
//   Un mot est « connu » à partir du palier 3 (une semaine), « maîtrisé » au palier 5.
//
// Niveau (lv, de 0 à 5 : A1 = 0 à 1, A2 = 1 à 2…) :
//   - placé par le test de niveau « crescendo » (on monte tant que ça va, on redescend d'un cran à la première erreur
//     pour voir si c'est juste ce mot : un autre mot du même niveau réussi = on remonte ; raté aussi = plafond trouvé) ;
//   - ajusté pendant les sessions selon le même principe : une erreur sur un mot de ton niveau fait proposer un mot
//     un peu plus facile, puis un autre du même niveau ; deux erreurs différentes au même niveau = le niveau baisse un peu.
//
// Sessions : chaque élément apparaît au plus 3 fois (présentation + 2 exercices), et une session présente toujours
// plusieurs nouveaux mots à la fois : jamais 10 exercices sur un seul mot. S'il n'y a pas assez de matière, la session
// est simplement plus courte.
const Engine = (() => {
  const { LEVELS } = Content;
  const IV = [0, 1, 3, 7, 16, 35, 80, 180];
  const KNOWN = 3, MASTER = 5;

  // ---------- Langue ----------
  function L(code) {
    const l = Store.lang(code) || {};
    return { lv: 0, placed: false, toLearn: [], curve: {}, alpha: {}, newDay: {}, ...l };
  }
  const band = lv => clamp(Math.floor(lv), 0, 4);
  function levelInfo(code) {
    const l = L(code);
    const b = band(l.lv);
    return { code: LEVELS[b], name: Content.LEVEL_NAMES[LEVELS[b]], frac: clamp(l.lv - b, 0, 1), lv: l.lv, placed: l.placed };
  }
  function setLv(code, lv) { Store.setLang(code, { lv: clamp(Math.round(lv * 100) / 100, 0, 4.99) }); }

  // ---------- Progression d'un élément ----------
  function grade(key, res) { // res : 'ok' | 'close' | 'ko'
    const it = Store.item(key) || { st: 0, ok: 0, ko: 0, seen: 0 };
    const now = Date.now();
    const n = { ...it, seen: (it.seen || 0) + 1, last: now };
    if (res === 'ok') { n.st = Math.min(IV.length - 1, (it.st || 0) + 1); n.ok = (it.ok || 0) + 1; n.due = now + IV[n.st] * DAY; }
    else if (res === 'close') { n.st = it.st || 0; n.due = now + DAY; }
    else { n.st = Math.max(0, (it.st || 0) - 2); n.ko = (it.ko || 0) + 1; n.due = now + 10 * 60e3; }
    Store.setItem(key, n);
    return n;
  }
  function introduce(key) { if (!Store.item(key)) Store.setItem(key, { st: 0, ok: 0, ko: 0, seen: 0, due: Date.now(), added: Date.now() }); }
  function markKnown(key) { Store.setItem(key, { ...(Store.item(key) || { ok: 0, ko: 0, seen: 0 }), st: KNOWN + 1, due: Date.now() + IV[KNOWN + 1] * DAY, last: Date.now(), known: 1 }); }
  const stage = key => (Store.item(key) ? Store.item(key).st || 0 : -1);

  function stats(code, d) {
    let known = 0, learning = 0, due = 0, master = 0;
    const now = Date.now();
    for (const [k, v] of Store.items(code + ':')) {
      if (!d.byId.has(k)) continue;
      if (v.st >= KNOWN) known++; else learning++;
      if (v.st >= MASTER) master++;
      if ((v.due || 0) <= now) due++;
    }
    return { known, learning, due, master, total: d.words.length + d.sentences.length };
  }
  function snapshot(code, d) {
    const l = L(code);
    const s = stats(code, d);
    if ((l.curve || {})[today()] !== s.known) Store.setLang(code, { curve: { ...(l.curve || {}), [today()]: s.known } });
  }
  function streak() {
    const days = Store.xpDays();
    let n = 0;
    const d = new Date();
    if (!days[ymd(d)]) d.setDate(d.getDate() - 1); // la série tient jusqu'à ce soir
    while (days[ymd(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // ---------- Choix des éléments ----------
  // Nouveaux mots autour du niveau : 70 % au niveau, 20 % juste en dessous, 10 % au-dessus ;
  // dans un niveau, du plus courant au plus rare. Les mots repérés au test (« à apprendre ») passent d'abord.
  function pickNew(d, code, n, { exclude = new Set(), bandOverride = null } = {}) {
    const l = L(code);
    const out = [];
    const fresh = w => !Store.item(w.key) && !exclude.has(w.key) && !out.includes(w);
    if (bandOverride === null) for (const k of l.toLearn || []) { const w = d.byId.get(k); if (w && w.kind === 'w' && fresh(w) && out.length < n) out.push(w); }
    const b = bandOverride ?? band(l.lv);
    const gaps = bandOverride === null ? gapLevels(code) : [];
    let guard = 0;
    while (out.length < n && guard++ < 50) {
      const r = Math.random();
      // Lacune repérée par les contrôles : un nouveau mot sur quatre vient de ce niveau-là.
      const tb = bandOverride !== null ? b : gaps.length && Math.random() < 0.25 ? pick(gaps) : clamp(r < 0.7 ? b : r < 0.9 ? b - 1 : b + 1, 0, 4);
      // Au hasard parmi le premier tiers des mots libres du niveau (A1-A2 : classés du plus courant au plus rare).
      const free = d.levelWords[tb].filter(fresh);
      let pool = free.slice(0, Math.max(8, Math.ceil(free.length / 3)));
      if (!pool.length) pool = [b, b - 1, b + 1, b - 2, b + 2, 0, 1, 2, 3, 4].filter(x => x >= 0 && x <= 4).map(x => d.levelWords[x].filter(fresh).slice(0, 4)).find(p => p.length) || [];
      if (!pool.length) break;
      out.push(pick(pool));
    }
    return out;
  }
  // ---------- Contrôles des niveaux inférieurs ----------
  // Même avec un niveau élevé (C1…), quelques mots jamais vus des niveaux plus faciles (A et B) sont vérifiés de temps
  // en temps, au hasard, par une seule question sans présentation : réussi = mot connu, raté = le mot est à apprendre.
  // Un mot raté fait ajouter, plus loin dans la session, un autre mot de ce niveau et un du niveau au-dessus :
  //   - réussis : c'était un cas à part ;
  //   - plusieurs ratés au même niveau (au moins 2 sur les derniers, 40 % ou plus) : vraie lacune. Les sessions
  //     suivantes contrôlent davantage ce niveau et celui au-dessus, et y prennent une partie des nouveaux mots,
  //     jusqu'à ce que les contrôles repassent au vert. Le niveau général, lui, ne change pas.
  function ctrlStat(code, lv) {
    const last = ((L(code).ctrl || {})[lv] || {}).last || [];
    const ko = last.filter(x => !x).length;
    return { last, ko, state: !ko ? 'ok' : ko >= 2 && ko / last.length >= 0.4 ? 'gap' : 'doubt' };
  }
  function gapLevels(code) {
    const b = band(L(code).lv);
    return [0, 1, 2, 3].filter(v => v < b && ctrlStat(code, v).state === 'gap');
  }
  function recordCtrl(code, lv, ok) {
    const c = { ...(L(code).ctrl || {}) };
    const cur = c[lv] || { last: [] };
    c[lv] = { last: [...cur.last, ok ? 1 : 0].slice(-6), t: Date.now() };
    Store.setLang(code, { ctrl: c });
  }
  // Type de question d'un contrôle : écrire le mot (anglais) ou le retrouver parmi 4 (les autres langues).
  const ctrlType = (x, code) => (code === 'en' && Math.random() < 0.5 ? 'type-tg' : x.ex || code === 'ar' ? 'mcq-tg' : 'mcq-fr');
  function ctrlWord(d, code, lv, exclude) {
    const pool = d.levelWords[lv].filter(w => !Store.item(w.key) && !exclude.has(w.key) && w.p !== 'phr');
    return pool.length ? pick(pool) : null;
  }
  function controls(d, code, exclude) {
    const b = band(L(code).lv);
    if (b < 1) return [];
    const lvls = [];
    // Rarement et au hasard : 0, 1 ou 2 contrôles par session, sur un niveau plus facile quelconque.
    const r = Math.random();
    for (let k = r < 0.35 ? 0 : r < 0.8 ? 1 : 2; k > 0; k--) lvls.push(Math.floor(Math.random() * b));
    // Niveaux où un mot a buté : ce niveau et celui au-dessus, encore un peu.
    for (let v = 0; v < b; v++) {
      const st = ctrlStat(code, v).state;
      if (st === 'ok') continue;
      lvls.push(v);
      if (v + 1 <= b && (st === 'gap' || Math.random() < 0.5)) lvls.push(Math.min(b, v + 1));
    }
    const out = [];
    for (const v of shuffle(lvls).slice(0, 4)) {
      const w = ctrlWord(d, code, v, exclude);
      if (!w) continue;
      exclude.add(w.key);
      out.push({ key: w.key, t: ctrlType(w, code), verify: 1, ctrl: 1, gap: 3 });
    }
    return out;
  }

  // Phrases : jamais au-dessus du niveau (sauf de temps en temps quand on en est proche), d'abord celles du niveau.
  function pickSentences(d, code, n, exclude = new Set(), bandOverride = null) {
    const l = L(code);
    const b = bandOverride ?? band(l.lv);
    const now = Date.now();
    const due = d.sentences.filter(s => !exclude.has(s.key) && Store.item(s.key) && Store.item(s.key).due <= now && s.lv <= b + 1)
      .sort((x, y) => Store.item(x.key).due - Store.item(y.key).due);
    const out = due.slice(0, Math.ceil(n / 2));
    let guard = 0;
    while (out.length < n && guard++ < 40) {
      const r = Math.random();
      const up = l.lv - b > 0.7 && r < 0.1;
      const tb = clamp(up ? b + 1 : r < 0.6 ? b : b - 1 - Math.floor(Math.random() * 2), 0, 4);
      const pool = d.levelSent[tb].filter(s => !Store.item(s.key) && !exclude.has(s.key) && !out.includes(s));
      if (!pool.length) {
        const any = d.sentences.filter(s => s.lv <= b && !Store.item(s.key) && !exclude.has(s.key) && !out.includes(s));
        if (!any.length) break;
        out.push(pick(any)); continue;
      }
      out.push(pick(pool.slice(0, 8)));
    }
    return out;
  }
  function dueItems(d, code, kind) {
    const now = Date.now();
    return Store.items(`${code}:${kind}:`).filter(([k, v]) => d.byId.has(k) && (v.due || 0) <= now).sort((a, b) => a[1].due - b[1].due).map(([k]) => d.byId.get(k));
  }

  // ---------- Type d'exercice selon l'élément et son palier ----------
  // Surtout des QCM (choisir la traduction) : facile, rapide, et on apprend en lisant les choix. L'écrit arrive
  // quand le mot est bien installé. Les étiquettes à remettre dans l'ordre ne servent plus qu'au défi final.
  function exType(x, st, code, nth = 0) {
    const ar = code === 'ar';
    if (x.kind === 'v') return 'irr';
    if (x.kind === 'w') {
      // Mot sans phrase d'exemple (langues bêta) : pas de texte à trous.
      if (!x.ex) return st <= 0 ? (nth === 0 ? 'mcq-fr' : 'mcq-tg') : pick(st >= 3 && !ar ? ['type-tg', 'listen-fr', 'mcq-tg'] : ['mcq-tg', 'listen-fr', 'mcq-fr']);
      if (st <= 0) return nth === 0 ? 'mcq-fr' : 'mcq-tg';
      if (st === 1) return pick(['mcq-tg', 'listen-fr', 'mcq-fr', 'mcq-tg']);
      if (ar && arNovice(code)) return pick(['mcq-tg', 'listen-fr', 'mcq-fr']);
      if (st === 2) return pick(ar ? ['listen-fr', 'mcq-tg', 'cloze-bank'] : ['mcq-tg', 'cloze-bank', 'listen-fr', 'mcq-fr']);
      return pick(ar ? ['listen-fr', 'mcq-tg', 'cloze-bank'] : ['type-tg', 'cloze-bank', 'mcq-tg', 'listen-fr', 'cloze-type']);
    }
    // Phrases : comprendre (QCM), puis retrouver la bonne formulation (QCM), puis l'écrire soi-même (anglais).
    if (st <= 0) return nth === 0 ? 'mcq-fr' : ar ? 'listen-fr' : 'mcq-tg';
    if (st === 1) return pick(['mcq-tg', 'listen-fr', 'mcq-fr']);
    if (st === 2) return pick(ar ? ['listen-fr', 'mcq-tg'] : ['mcq-tg', 'listen-fr', 'type-tg']);
    return pick(ar ? ['listen-fr', 'mcq-tg'] : ['type-tg', 'mcq-tg', 'type-fr']);
  }
  // Phrase assez courte pour les étiquettes : au-delà, on passe plus de temps à les ranger qu'à apprendre.
  const short = (x, code) => { const n = Content.first(x).split(/\s+/).length; return code === 'ar' ? n >= 2 && n <= 4 : n >= 3 && n <= 6; };

  // Répartit les exercices : un même élément jamais deux fois de suite (écart d'au moins `gap`).
  function arrange(groups) {
    // groups : [[ex, ex, ex] par élément] ; on entrelace en respectant l'ordre interne de chaque groupe.
    const out = [];
    const lastAt = new Map();
    const q = groups.map(g => g.slice());
    let guard = 0;
    while (q.some(g => g.length) && guard++ < 500) {
      const ready = q.filter(g => g.length && (!lastAt.has(g[0].key) || out.length - lastAt.get(g[0].key) >= (g[0].gap || 3)));
      const g = ready.length ? ready.sort((a, b) => b.length - a.length)[Math.random() < 0.6 ? 0 : Math.floor(Math.random() * ready.length)]
        : q.filter(x => x.length).sort((a, b) => (lastAt.get(a[0].key) ?? -9) - (lastAt.get(b[0].key) ?? -9))[0];
      const ex = g.shift();
      lastAt.set(ex.key, out.length);
      out.push(ex);
    }
    return out;
  }

  // ---------- Composition d'une session ----------
  // kind : 'daily' (mélange), 'review', 'words' (nouveaux mots), 'sentences' (formulation), 'irregular'.
  async function buildSession(code, kind = 'daily') {
    const d = await Content.load(code);
    const s = Store.settings();
    const N = +s.sessionLen || 12;
    const l = L(code);
    const used = new Set();
    const groups = [];
    const day = l.newDay && l.newDay.d === today() ? l.newDay.n : 0;
    // « Nouveaux mots » demandé exprès : au moins 5, même quota du jour atteint.
    const newLeft = kind === 'words' ? Math.max(5, (+s.newPerDay || 12) - day) : Math.max(0, (+s.newPerDay || 12) - day);

    // 1. Révisions (un exercice chacune).
    const dueW = dueItems(d, code, 'w'), dueS = dueItems(d, code, 's');
    const revShare = kind === 'review' ? N : kind === 'daily' ? Math.ceil(N * 0.45) : Math.ceil(N * 0.2);
    const revs = [];
    for (const x of (kind === 'sentences' ? dueS : kind === 'words' ? dueW : interleave(dueW, dueS))) { if (revs.length >= revShare) break; revs.push(x); }
    for (const x of revs) { used.add(x.key); groups.push([{ key: x.key, t: exType(x, stage(x.key), code) }]); }
    let slots = N - revs.length;
    if (kind === 'review') return finish(code, kind, groups, d);

    // 2. Phrases (formulation) : environ un tiers de la session, la moitié en mode « phrases ».
    const sentShare = kind === 'sentences' ? slots : kind === 'words' ? 0 : Math.round(slots * (code === 'ar' ? 0.3 : 0.4));
    if (sentShare > 0) {
      const list = pickSentences(d, code, Math.ceil(sentShare / 1.6), used);
      for (const x of list) {
        used.add(x.key);
        const st = stage(x.key);
        const g = [];
        if (code === 'ar' && st < 0) g.push({ key: x.key, t: 'intro', gap: 1 });
        g.push({ key: x.key, t: exType(x, st, code, 0), gap: 2 });
        if (st < 1) g.push({ key: x.key, t: exType(x, st, code, 1), gap: 4 });
        groups.push(g);
        slots -= g.filter(e => e.t !== 'intro').length;
      }
    }
    // 3. Nouveaux mots : présentation, puis 2 exercices plus loin. Au moins 3 mots si possible.
    if (kind !== 'sentences' && slots > 0 && newLeft > 0) {
      const n = clamp(Math.ceil(slots / 2), Math.min(3, newLeft), newLeft);
      const fresh = pickNew(d, code, n, { exclude: used });
      for (const w of fresh) {
        used.add(w.key);
        groups.push([{ key: w.key, t: 'intro', gap: 1 }, { key: w.key, t: exType(w, 0, code, 0), gap: 2 }, { key: w.key, t: exType(w, 0, code, 1), gap: 4 }]);
      }
    }
    // 3 bis. Contrôle de quelques mots plus faciles, jamais vus (voir controls).
    if (kind === 'daily' || kind === 'words') for (const c of controls(d, code, used)) groups.push([c]);
    // 4. Encore de la place : d'autres révisions (sans dépasser la longueur prévue).
    let count = groups.reduce((a, g) => a + g.filter(e => e.t !== 'intro').length, 0);
    for (const x of interleave(dueW, dueS)) { if (count >= N) break; if (used.has(x.key)) continue; used.add(x.key); groups.push([{ key: x.key, t: exType(x, stage(x.key), code) }]); count++; }
    // 5. Anglais : de temps en temps un verbe irrégulier courant, s'il fait partie des mots appris.
    if (code === 'en' && kind !== 'words' && l.lv >= 1 && Math.random() < 0.3) {
      const v = (d.irregular || []).filter(v => Store.item(`en:w:${v.b}`) || Store.item(`en:w:${v.b}.v`));
      const due = v.filter(x => !Store.item(x.key) || Store.item(x.key).due <= Date.now());
      if (due.length) groups.push([{ key: pick(due).key, t: 'irr' }]);
    }
    return finish(code, kind, groups, d);
  }
  function interleave(a, b) { const out = []; for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) out.push(a[i]); if (b[i]) out.push(b[i]); } return out; }
  function finish(code, kind, groups, d) {
    const queue = arrange(groups);
    const boss = kind !== 'words' && !arNovice(code) && bossOf(d, code, queue);
    if (boss) queue.push(boss);
    return { code, kind, queue, i: 0, done: [], started: Date.now(), xp: 0, probe: null, fails: {} };
  }
  // Défi final : UNE phrase courte à reconstruire avec les étiquettes, prise dans la session (ou déjà vue).
  function bossOf(d, code, queue) {
    if (!d.sentences.length) return null;
    const inSes = [...new Set(queue.map(e => e.key))].map(k => d.byId.get(k)).filter(x => x && x.kind === 's' && short(x, code));
    const seen = inSes.length ? inSes : d.sentences.filter(x => short(x, code) && stage(x.key) >= 1);
    return seen.length ? { key: pick(seen).key, t: 'tiles-tg', boss: 1 } : null;
  }

  // ---------- Parcours « premiers pas » (content/src/<langue>-path.txt) ----------
  // La courbe mot par mot : un mot présenté, tout de suite une question à 2 choix, le mot suivant, un rappel du
  // précédent, quelques mots des étapes d'avant, puis « comment dit-on ? ». Chaque mot nouveau : 3 questions au plus,
  // même quand l'étape n'en a qu'un (pas de série d'exercices identiques sur un seul mot).
  // Vrai débutant en arabe : moins de 4 étapes d'alphabet réussies. Il ne lit pas encore : la prononciation en lettres
  // latines passe devant l'écriture arabe, et pas d'exercice où il faudrait lire une phrase en arabe.
  const arNovice = code => code === 'ar' && Object.values(L('ar').alpha || {}).filter(p => p >= 70).length < 4;
  const pathKeys = (code, st) => (st.items || []).map(k => `${code}:${k}`);
  function pathDone(code, st) {
    const l = L(code);
    return st.alpha !== undefined ? ((l.alpha || {})[st.alpha] || 0) >= 70 : !!(l.path || {})[st.id];
  }
  function pathInfo(code, d) {
    const steps = d.path || [];
    const next = steps.findIndex(st => !pathDone(code, st));
    return { steps, next, done: steps.filter(st => pathDone(code, st)).length };
  }
  // Le parcours se propose tant qu'il n'est pas fini et qu'on est débutant.
  const pathOn = (code, d) => { const p = pathInfo(code, d); return p.steps.length > 0 && p.next >= 0 && band(L(code).lv) === 0; };
  async function buildPath(code, idx) {
    const d = await Content.load(code);
    const steps = d.path || [];
    const st = steps[idx];
    const news = pathKeys(code, st).filter(k => d.byId.has(k));
    const before = steps.slice(0, idx).filter(x => x.items && pathDone(code, x));
    const olds = before.slice(-4).flatMap(x => pathKeys(code, x)).filter(k => d.byId.has(k) && !news.includes(k));
    const q = [];
    const fresh = k => stage(k) < KNOWN;
    // Un mot : présenté, reconnu parmi 2, entendu parmi 2. Deux mots : chacun reconnu parmi 2, puis entendus parmi 3.
    news.forEach((k, i) => {
      if (fresh(k)) q.push({ key: k, t: 'intro' }, { key: k, t: 'mcq-fr', nc: 2 });
      if (news.length === 1) q.push({ key: k, t: 'listen-fr', nc: 2 });
      else if (i > 0) q.push({ key: news[i - 1], t: 'listen-fr', nc: 3 });
    });
    if (news.length > 1) q.push({ key: news[news.length - 1], t: 'listen-fr', nc: 3 });
    for (const k of shuffle(olds).slice(0, news.length > 1 ? 2 : 3)) q.push({ key: k, t: pick(['listen-fr', 'mcq-tg', 'mcq-fr']), nc: 3 });
    for (const k of shuffle(news.slice())) q.push({ key: k, t: 'mcq-tg', nc: Math.min(3, 2 + olds.length + news.length - 1) });
    // Pièges d'abord parmi ce qui a déjà été vu (« oui » contre « non ») : on révise en répondant.
    const pool = [...news, ...before.flatMap(x => pathKeys(code, x))];
    return { code, kind: 'path', step: st.id, title: st.title, pool, queue: q, i: 0, done: [], started: Date.now(), xp: 0, probe: null, fails: {} };
  }

  // Après une réponse : ajustement du niveau et, au besoin, un élément de vérification ajouté plus loin.
  async function adapt(sess, ex, res, prev = 0) {
    const d = await Content.load(sess.code);
    const x = d.byId.get(ex.key);
    if (!x || x.kind === 'v' || ex.t === 'intro' || sess.kind === 'path' || ex.boss) return;
    if (ex.ctrl) {
      recordCtrl(sess.code, x.lv, res === 'ok');
      // Raté : un autre mot de ce niveau, puis un du niveau au-dessus (sans dépasser le sien), plus loin.
      if (res !== 'ok' && !ex.ctrl2) {
        const used = new Set(sess.queue.map(e => e.key));
        const b = band(L(sess.code).lv);
        [x.lv, Math.min(b, x.lv + 1)].forEach((v, k) => {
          const w = ctrlWord(d, sess.code, v, used);
          if (!w) return;
          used.add(w.key);
          sess.queue.splice(Math.min(sess.queue.length, sess.i + 2 + 2 * k), 0, { key: w.key, t: ctrlType(w, sess.code), verify: 1, ctrl: 1, ctrl2: 1 });
        });
      }
      return;
    }
    const l = L(sess.code);
    const b = band(l.lv);
    // Seuls les éléments encore jeunes renseignent sur le niveau : un mot ancien raté, c'est de l'oubli,
    // et une session de révision ne sert pas à placer.
    if (res !== 'ok' && (prev >= 2 || sess.kind === 'review')) return;
    if (res === 'ok') {
      if (x.lv >= b) setLv(sess.code, l.lv + (x.lv > b ? 0.06 : 0.03));
      return;
    }
    if (res === 'close' || x.lv > b) return;
    const fails = sess.fails[x.lv] || (sess.fails[x.lv] = []);
    if (!fails.includes(ex.key)) fails.push(ex.key);
    if (fails.length >= 2) {
      // Deux éléments différents ratés au même niveau : c'est le niveau, pas le mot.
      setLv(sess.code, l.lv - 0.25);
      sess.fails[x.lv] = [];
      return;
    }
    // Première erreur : un élément un peu plus facile tout de suite, puis un autre du même niveau un peu plus loin.
    const used = new Set(sess.queue.map(e => e.key));
    const easy = x.lv === 0 ? [] : x.kind === 'w' ? pickNew(d, sess.code, 1, { exclude: used, bandOverride: Math.max(0, x.lv - 1) }) : pickSentences(d, sess.code, 1, used, Math.max(0, x.lv - 1));
    const same = x.kind === 'w' ? pickNew(d, sess.code, 1, { exclude: new Set([...used, ...easy.map(e => e.key)]), bandOverride: x.lv }) : pickSentences(d, sess.code, 1, new Set([...used, ...easy.map(e => e.key)]), x.lv);
    const at = sess.i + 1;
    const ins = [];
    // Mots (et expressions arabes) : présentés d'abord ; phrases anglaises : directement en exercice.
    const withIntro = y => y.kind === 'w' || sess.code === 'ar';
    const probe = (y, nth) => [...(withIntro(y) ? [{ key: y.key, t: 'intro', probe: 1 }] : []), { key: y.key, t: exType(y, 0, sess.code, nth), probe: 1 }];
    for (const y of easy) ins.push(...probe(y, 0));
    sess.queue.splice(at, 0, ...ins);
    for (const y of same) sess.queue.splice(Math.min(sess.queue.length, at + ins.length + 2), 0, ...probe(y, 0));
  }

  // ---------- Test de niveau « crescendo » ----------
  // 10 demi-niveaux (A1 début, A1 fin, A2 début…). On monte d'un cran à chaque bonne réponse (de deux au début
  // tant que tout est juste). À la première erreur : une question un cran plus bas, puis un AUTRE mot du niveau raté.
  //   - réussi : ce n'était que ce mot, on continue de monter ;
  //   - raté : deux erreurs à ce niveau, c'est le plafond. Le niveau retenu est le dernier réussi.
  function placementStart(code) { return { code, b: 0, n: 0, fails: {}, best: -1, streak: 0, ret: null, asked: [], max: 24 }; }
  function placementPick(d, p) {
    const lvl = Math.floor(p.b / 2);
    const words = d.levelWords[lvl].filter(w => !p.asked.includes(w.key) && w.p !== 'phr');
    const half = Math.ceil(words.length / 2);
    const pool = p.b % 2 === 0 ? words.slice(0, half) : words.slice(half);
    // Anglais : une question sur trois porte sur le sens d'une phrase (formulation).
    if (d.code === 'en' && p.n % 3 === 2) {
      const sp = d.levelSent[lvl].filter(s => !p.asked.includes(s.key));
      if (sp.length) return pick(sp);
    }
    return pick(pool.length ? pool : words.length ? words : d.levelWords[lvl]);
  }
  function placementAnswer(p, ok) {
    p.n++;
    if (ok) {
      p.best = Math.max(p.best, p.b);
      p.streak++;
      if (p.ret !== null) { p.b = p.ret; p.ret = null; }          // retour au niveau raté, avec un autre mot
      else p.b += (!Object.keys(p.fails).length && p.streak >= 2 && p.b < 6) ? 2 : 1;
    } else {
      p.streak = 0;
      p.fails[p.b] = (p.fails[p.b] || 0) + 1;
      if (p.fails[p.b] >= 2) return placementEnd(p);
      if (p.ret === null) { p.ret = p.b; p.b = Math.max(0, p.b - 1); }   // un cran plus bas pour vérifier
      else { p.ret = null; p.b = Math.max(0, p.b - 1); }                 // raté aussi plus bas : on redescend
    }
    if (p.b > 9) { p.best = 9; return placementEnd(p); }
    if (p.n >= p.max) return placementEnd(p);
    return null;
  }
  function placementEnd(p) {
    p.done = true;
    // Dernier demi-niveau réussi : B1 réussi jusqu'au bout = « B1 (haut) », pas B2.
    p.lv = clamp((p.best + 0.6) / 2, 0, 4.99);
    return p;
  }
  const placementEstimate = p => LEVELS[clamp(Math.floor(Math.max(p.best, 0) / 2), 0, 4)];

  // Reprise d'une progression Curio (une fois, à la première connexion d'un ancien compte).
  async function importCurio() {
    const imp = Store.settings().import;
    if (!imp) return;
    for (const code of Object.keys(Content.LANGS)) {
      const words = imp[code];
      if (!words) continue;
      const d = await Content.load(code);
      const byWord = new Map(d.words.map(w => [Check.norm(code === 'ar' ? Check.arNorm(w.w) : w.w), w]));
      let n = 0;
      for (const [w, how] of Object.entries(words)) {
        if (w === '@front') continue;
        const hit = byWord.get(Check.norm(w));
        if (!hit || Store.item(hit.key)) continue;
        if (how === 'known') markKnown(hit.key); else { introduce(hit.key); }
        n++;
      }
      const front = +words['@front'] || 0;
      const lv = front >= 4500 ? 4.2 : front >= 2500 ? 3.2 : front >= 1200 ? 2.2 : front >= 500 ? 1.2 : 0.3;
      if (!L(code).placed) Store.setLang(code, { lv, placed: front > 0 });
      const active = Store.settings().active || [];
      if (!active.includes(code)) Store.setSettings({ active: [...active, code], lang: Store.settings().lang || code });
    }
    const s = { ...Store.settings() };
    delete s.import;
    Store.setSettings({ ...s, import: null });
  }

  return { L, levelInfo, setLv, grade, introduce, markKnown, stage, stats, snapshot, streak, buildSession, adapt, exType,
    placementStart, placementPick, placementAnswer, placementEstimate, importCurio, pickNew, KNOWN, MASTER, IV, band,
    pathInfo, pathOn, pathDone, buildPath, arNovice, ctrlStat, gapLevels };
})();
