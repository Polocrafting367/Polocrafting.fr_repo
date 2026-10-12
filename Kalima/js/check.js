// Correction des réponses écrites.
//
// Principe : on ne compte pas faux une réponse juste formulée autrement.
//  - plusieurs formulations écrites à la main pour chaque phrase ([a|b], « || ») ;
//  - contractions anglaises équivalentes (I'm = I am, don't = do not…) et orthographe britannique / américaine ;
//  - synonymes (content/src/synonyms.txt) : acceptés, avec la formulation la plus courante en rappel ;
//  - fautes de frappe : acceptées et signalées ; accents et majuscules : jamais comptés ;
//  - en français : « ne » facultatif, élisions (j'/je), terminaison de verbe un peu différente = presque juste.
// Verdict : exact, accepted (juste, avec remarques), close (presque : compte à moitié), wrong.
const Check = (() => {
  const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Arabe : sans voyelles brèves ni tatweel, alifs unifiés.
  const arNorm = s => s.replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  function norm(s) {
    return arNorm(strip(String(s || '')).toLowerCase())
      .replace(/[’‘`´]/g, "'").replace(/œ/g, 'oe').replace(/æ/g, 'ae')
      .replace(/[^\p{L}\p{N}'\s-]/gu, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // [a|b] → toutes les combinaisons (64 au plus) ; [a|] = mot facultatif.
  function expand(s) {
    let out = [''];
    const re = /\[([^\]]*)\]|([^[]+)/g;
    let m;
    while ((m = re.exec(s))) {
      const opts = m[1] !== undefined ? m[1].split('|') : [m[2]];
      const next = [];
      for (const a of out) for (const o of opts) { next.push(a + o); if (next.length > 64) break; }
      out = next;
    }
    return out.map(x => x.replace(/\s+/g, ' ').replace(/\s+([,.!?;:])/g, '$1').trim());
  }
  const expandAll = list => [...new Set(list.flatMap(expand))];

  // ---------- Anglais ----------
  const EN_CONTR = [
    [/\bcan't\b/g, 'can not'], [/\bcannot\b/g, 'can not'], [/\bwon't\b/g, 'will not'], [/\bshan't\b/g, 'shall not'],
    [/\b(\w+)n't\b/g, '$1 not'], [/\bi'm\b/g, 'i am'], [/\b(\w+)'re\b/g, '$1 are'], [/\b(\w+)'ve\b/g, '$1 have'],
    [/\b(\w+)'ll\b/g, '$1 will'], [/\b(\w+)'d\b/g, '$1 would'], [/\blet's\b/g, 'let us'],
    [/\b(he|she|it|that|what|there|here|who|where|how|this)'s\b/g, '$1 is'],
  ];
  const UK_US = { colour: 'color', colours: 'colors', favourite: 'favorite', neighbour: 'neighbor', neighbours: 'neighbors', neighbourhood: 'neighborhood',
    behaviour: 'behavior', honour: 'honor', humour: 'humor', centre: 'center', theatre: 'theater', metre: 'meter', grey: 'gray', programme: 'program',
    travelling: 'traveling', travelled: 'traveled', cancelled: 'canceled', practise: 'practice', jewellery: 'jewelry', mum: 'mom', ok: 'okay', alright: 'all right' };
  function enWord(t) {
    if (UK_US[t]) return UK_US[t];
    // organise / organize, realised / realized…
    return t.replace(/^(\w{3,})is(e|es|ed|ing|ation)$/, '$1iz$2');
  }
  // ---------- Français ----------
  const FR_ELI = { j: 'je', l: 'le', c: 'ce', d: 'de', n: 'ne', qu: 'que', s: 'se', m: 'me', t: 'te' };
  const FR_SOFT = new Set(['ne', 'n']); // « je sais pas » = « je ne sais pas »

  function tokens(s, lang) {
    let t = norm(s);
    if (lang === 'en') { for (const [re, r] of EN_CONTR) t = t.replace(re, r); t = t.replace(/'s\b/g, ' s'); }
    if (lang === 'fr') t = t.replace(/\b(j|l|c|d|n|qu|s|m|t)'/g, (_, a) => FR_ELI[a] + ' ');
    let out = t.replace(/'/g, ' ').split(' ').filter(Boolean);
    if (lang === 'en') out = out.map(enWord);
    return out;
  }

  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m || !n) return m || n;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const typoOk = (a, b) => { const L = Math.max(a.length, b.length); if (L < 4) return false; return lev(a, b) <= (L >= 8 ? 2 : 1); };

  // Comparaison de deux mots : [score, raison].
  function wordMatch(r, a, lang, syn) {
    if (r === a) return [1, ''];
    const g = syn && syn.get(r);
    if (g && g.has(a)) return [0.95, 'syn'];
    // Synonyme conjugué de la même façon (started / began non, mais started / commenced, cherche / recherche).
    if (syn && (lang === 'en' || lang === 'fr')) {
      const [rb, re] = split(r, lang), [ab, ae] = split(a, lang);
      const gb = syn.get(rb) || syn.get(rb + 'e') || syn.get(rb + 'er');
      if (re === ae && re && gb && [ab, ab + 'e', ab + 'er'].some(x => gb.has(x))) return [0.95, 'syn'];
    }
    // Terminaison grammaticale différente (works / work, regardé / regarder) : ce n'est pas une faute de frappe.
    const ends = lang === 'en' ? ['es', 's', 'ed', 'd', 'ing', 'ies', 'ied'] : lang === 'fr' ? ['ees', 'ee', 'es', 'e', 'er', 'ez', 'ent', 'ons', 's', 'x', 'ais', 'ait', 'ai'] : null;
    if (ends) {
      const stems = t => new Set([t, ...ends.filter(e => t.endsWith(e) && t.length - e.length >= 2).map(e => t.slice(0, -e.length))]);
      const sa = stems(a);
      if ([...stems(r)].some(x => sa.has(x))) return [0.6, 'form'];
    }
    if (typoOk(r, a)) return [0.9, 'typo'];
    // Même verbe, autre terminaison (mange / mangeons, went / goes) : presque.
    if (lang === 'fr' && r.length >= 5 && a.length >= 5 && r.slice(0, 4) === a.slice(0, 4)) return [0.6, 'form'];
    if (lang === 'en' && r.length >= 4 && a.length >= 4 && r.slice(0, 3) === a.slice(0, 3) && lev(r, a) <= 3) return [0.55, 'form'];
    return [0, ''];
  }

  // Alignement mot à mot (programmation dynamique) entre la référence et la réponse.
  function align(ref, ans, lang, syn) {
    const m = ref.length, n = ans.length;
    const miss = t => (lang === 'fr' && FR_SOFT.has(t) ? 0.15 : 1);
    const D = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    const P = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
    for (let i = 1; i <= m; i++) { D[i][0] = D[i - 1][0] + miss(ref[i - 1]); P[i][0] = 'del'; }
    for (let j = 1; j <= n; j++) { D[0][j] = D[0][j - 1] + 1; P[0][j] = 'ins'; }
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      const [s] = wordMatch(ref[i - 1], ans[j - 1], lang, syn);
      const opts = [[D[i - 1][j - 1] + (1 - s) * (s ? 1 : 1.6), 'sub'], [D[i - 1][j] + miss(ref[i - 1]), 'del'], [D[i][j - 1] + 1, 'ins']];
      opts.sort((x, y) => x[0] - y[0]);
      D[i][j] = opts[0][0]; P[i][j] = opts[0][1];
    }
    // Chemin : statut de chaque mot attendu et de chaque mot donné.
    const refSt = new Array(m).fill('miss'), ansSt = new Array(n).fill('extra'), notes = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      const p = P[i][j];
      if (p === 'sub') {
        const [s, why] = wordMatch(ref[i - 1], ans[j - 1], lang, syn);
        const stt = s >= 1 ? 'ok' : s >= 0.85 ? why : s > 0 ? 'form' : 'bad';
        refSt[i - 1] = stt; ansSt[j - 1] = stt;
        if (stt === 'syn' || stt === 'typo' || stt === 'form') notes.unshift([stt, ans[j - 1], ref[i - 1]]);
        i--; j--;
      } else if (p === 'del') { if (lang === 'fr' && FR_SOFT.has(ref[i - 1])) refSt[i - 1] = 'soft'; i--; }
      else { j--; }
    }
    const score = Math.max(0, 1 - D[m][n] / Math.max(m, n, 1));
    return { score, refSt, ansSt, notes, cost: D[m][n] };
  }

  /**
   * refs : formulations acceptées (déjà développées ou non), answer : texte de l'utilisateur,
   * lang : langue de la réponse ('en', 'fr', 'ar'), syn : Map des synonymes de cette langue.
   */
  // Tournures de plusieurs mots (« look for » / « search for », « je sais pas » / « je ne sais pas ») : si la référence
  // en contient une et la réponse une autre du même groupe, on remplace celle de la réponse avant de comparer.
  // Terminaison d'un mot conjugué ou accordé (searching / search, cherchons / chercher) : base + terminaison.
  const ENDS = { en: ['ing', 'ed', 'es', 's'], fr: ['ons', 'ez', 'ent', 'ées', 'és', 'ée', 'é', 'er', 'es', 'e', 's'] };
  function split(t, lang) {
    for (const e of ENDS[lang] || []) if (t.endsWith(e) && t.length - e.length >= 3) return [t.slice(0, -e.length).replace(/(.)\1$/, '$1').replace(/e$/, ''), e];
    return [t.replace(/e$/, ''), ''];
  }
  const base = (t, lang) => split(t, lang)[0];
  // Position d'une suite de mots, à la terminaison près ; renvoie aussi si une terminaison diffère.
  function findSeq(arr, seq, lang) {
    for (let i = 0; i + seq.length <= arr.length; i++) {
      if (seq.every((t, k) => arr[i + k] === t || base(arr[i + k], lang) === base(t, lang))) return i;
    }
    return -1;
  }
  // Tournures de plusieurs mots (« look for » / « search for », « je sais pas » / « je ne sais pas ») : si la référence
  // en contient une et la réponse une autre du même groupe, on remplace celle de la réponse (par la forme exacte de la
  // référence) avant de comparer. Terminaison différente (searched for / looking for) : « presque ».
  function phraseSyn(ref, ans, syn, lang) {
    const notes = [];
    let form = false;
    if (!syn || !syn.multi) return { ans, notes, form };
    let out = ans;
    for (const g of syn.multi) {
      const want = g.find(p => findSeq(ref, p, lang) >= 0);
      if (!want) continue;
      const rAt = findSeq(ref, want, lang);
      const rTok = ref.slice(rAt, rAt + want.length);
      const has = findSeq(out, want, lang) >= 0;
      for (const p of g) {
        // Une tournure plus courte déjà contenue dans celle attendue (« tu » dans « est-ce que tu ») n'est pas remplacée.
        if (p === want || (has && p.length <= want.length)) continue;
        const at = findSeq(out, p, lang);
        if (at < 0) continue;
        const aTok = out.slice(at, at + p.length);
        // Terminaisons ajoutées par rapport à la tournure telle qu'écrite dans le groupe (searching / search) :
        // elles doivent être les mêmes des deux côtés (searching for ⇢ looking for oui, searched for ⇢ looking for non).
        const added = (toks, form) => toks.map((t, k) => (t === form[k] ? '' : split(t, lang)[1])).filter(Boolean).join('|');
        const bad = added(aTok, p) !== added(rTok, want);
        if (bad) form = true;
        out = [...out.slice(0, at), ...rTok, ...out.slice(at + p.length)];
        notes.push(bad ? ['pform', aTok.join(' '), rTok.join(' ')] : ['syn', p.raw || p.join(' '), want.raw || want.join(' ')]);
        break;
      }
    }
    return { ans: out, notes, form };
  }

  function sentence(refs, answer, lang, syn) {
    const variants = expandAll(refs);
    const ans0 = tokens(answer, lang);
    if (!ans0.length) return { level: 'wrong', ok: false, best: variants[0], empty: true };
    let best = null;
    for (const v of variants) {
      const ref = tokens(v, lang);
      const ps = phraseSyn(ref, ans0, syn, lang);
      const ans = ps.ans;
      const a = align(ref, ans, lang, syn);
      a.notes = [...ps.notes, ...a.notes];
      if (ps.notes.length && a.score >= 0.999) a.score = 0.998; // juste, mais pas la formulation attendue
      if (ps.form) a.phraseForm = true;
      a.text = v; a.ref = ref; a.ans = ans;
      if (!best || a.score > best.score) best = a;
      if (a.score === 1) break;
    }
    const hardT = best.ref.filter((t, k) => best.refSt[k] === 'miss' || best.refSt[k] === 'bad');
    const formN = best.refSt.filter(s => s === 'form').length;
    const extra = best.ansSt.filter(s => s === 'extra').length;
    let level;
    if (best.phraseForm && best.score >= 0.99) level = 'close';
    else if (best.score >= 0.999) level = 'exact';
    else if (best.score >= 0.998) level = 'accepted';
    else if (!hardT.length && !formN && extra <= 1) level = 'accepted';    // synonymes, fautes de frappe, « ne » oublié
    // Presque : bon sens, mais une forme de verbe ou un petit mot (article, préposition) de travers.
    // Un mot de sens différent (chaud / froid) reste faux.
    else if ((!hardT.length && formN <= 2) || (hardT.length === 1 && hardT[0].length <= 3 && !formN && best.ref.length >= 4)) level = 'close';
    else level = 'wrong';
    return { level, ok: level === 'exact' || level === 'accepted', half: level === 'close', best: best.text, ref: best.ref, refSt: best.refSt, ans: best.ans, answer, ansSt: best.ansSt, notes: best.notes, score: best.score };
  }

  // Un seul mot (ou une expression courte) : articles et « to » facultatifs.
  function word(accepted, answer, lang, syn) {
    const clean = s => {
      let t = tokens(s, lang);
      if (lang === 'en') { while (t.length > 1 && ['the', 'a', 'an', 'to'].includes(t[0])) t = t.slice(1); }
      if (lang === 'fr') { while (t.length > 1 && ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'se'].includes(t[0])) t = t.slice(1); }
      return t.join(' ').replace(/\s*\(.*?\)\s*/g, ' ').trim();
    };
    const a = clean(answer);
    if (!a) return { level: 'wrong', ok: false, best: accepted[0], empty: true };
    const opts = accepted.flatMap(x => [x, ...x.split(/[,/]| ou /)]).map(x => [x.trim(), clean(x.replace(/\(.*?\)/g, ''))]).filter(x => x[1]);
    for (const [orig, c] of opts) if (c === a) return { level: orig === accepted[0] ? 'exact' : 'accepted', ok: true, best: accepted[0], given: orig };
    const aRaw = tokens(answer, lang).join(' ');
    for (const [orig, c] of opts) {
      const cRaw = tokens(orig, lang).join(' ');
      for (const [k, v] of [[c, a], [cRaw, aRaw], [cRaw, a], [c, aRaw]]) { const g = syn && syn.get(k); if (g && g.has(v)) return { level: 'accepted', ok: true, best: accepted[0], notes: [['syn', answer.trim(), orig]] }; }
    }
    for (const [, c] of opts) if (typoOk(c, a)) return { level: 'accepted', ok: true, best: accepted[0], notes: [['typo', a, c]] };
    for (const [, c] of opts) if (c.length >= 5 && a.length >= 5 && lev(c, a) <= 2) return { level: 'close', ok: false, half: true, best: accepted[0] };
    return { level: 'wrong', ok: false, best: accepted[0] };
  }

  // Phrase colorée : mots justes, presque justes, manquants.
  function diffHtml(r) {
    if (!r.ref) return esc(r.best);
    return r.ref.map((t, k) => {
      const s = r.refSt[k];
      const cls = s === 'ok' ? '' : s === 'miss' || s === 'bad' ? 'd-miss' : s === 'soft' ? 'd-soft' : 'd-near';
      return cls ? `<mark class="${cls}">${esc(t)}</mark>` : esc(t);
    }).join(' ');
  }
  function notesText(r) {
    const out = [];
    const given = String(r.answer || '').split(/[\s,.!?;:]+/);
    const origA = t => (t.includes(' ') ? t : given.find(w => norm(w) === t || norm(w).replace(/^\w+'/, '') === t) || t);
    // Mot attendu tel qu'il est écrit (avec ses accents), retrouvé dans la phrase de référence.
    const words = String(r.best || '').split(/[\s,.!?;:]+/);
    const orig = t => words.find(w => norm(w) === t || norm(w).endsWith(' ' + t) || norm(w).replace(/^\w+'/, '') === t) || t;
    for (const [k, a, b0] of r.notes || []) {
      const b = orig(b0);
      if (k === 'syn') out.push(`« ${origA(a)} » est accepté ; on dit plus souvent « ${b} ».`);
      else if (k === 'typo') out.push(`Petite faute de frappe : « ${b} ».`);
      else if (k === 'pform') out.push(`Bonne tournure, mais pas la bonne forme : on attendait « ${b0.split(' ').map(orig).join(' ')} ».`);
      else if (k === 'form') out.push(`Bon mot, mauvaise forme : « ${b} » (et non « ${origA(a)} »).`);
    }
    if (r.refSt && r.refSt.includes('soft')) out.push('À l\'écrit, on garde le « ne » de la négation.');
    return [...new Set(out)];
  }

  return { norm, expand, expandAll, tokens, sentence, word, diffHtml, notesText, lev, arNorm };
})();
