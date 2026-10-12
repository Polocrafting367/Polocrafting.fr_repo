// Contenus relus à la main (content/*.json, générés par tools/build-content.py).
// Mots : traduction principale = l'usage le plus courant, puis les autres traductions acceptées.
// Phrases : courtes, classées par niveau, avec plusieurs formulations acceptées.
const Content = (() => {
  const LANGS = {
    en: { name: 'Anglais', flag: '🇬🇧', tts: 'en-GB', hue: 205, native: 'English' },
    ar: { name: 'Arabe', flag: '🇩🇿', tts: 'ar-SA', hue: 150, rtl: true, native: 'العربية' },
    // Bêta : reprises des anciens dictionnaires de Curio (moins fiables, pas encore relues à la main).
    es: { name: 'Espagnol', flag: '🇪🇸', tts: 'es-ES', hue: 20, native: 'Español', beta: true },
    de: { name: 'Allemand', flag: '🇩🇪', tts: 'de-DE', hue: 45, native: 'Deutsch', beta: true },
    it: { name: 'Italien', flag: '🇮🇹', tts: 'it-IT', hue: 130, native: 'Italiano', beta: true },
    pt: { name: 'Portugais', flag: '🇵🇹', tts: 'pt-PT', hue: 160, native: 'Português', beta: true },
    nl: { name: 'Néerlandais', flag: '🇳🇱', tts: 'nl-NL', hue: 25, native: 'Nederlands', beta: true },
    ru: { name: 'Russe', flag: '🇷🇺', tts: 'ru-RU', hue: 0, native: 'Русский', beta: true },
    tr: { name: 'Turc', flag: '🇹🇷', tts: 'tr-TR', hue: 350, native: 'Türkçe', beta: true },
  };
  // « en anglais », « en arabe »… pour les consignes.
  const inLang = code => 'en ' + LANGS[code].name.toLowerCase();
  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const LEVEL_NAMES = { A1: 'Débutant', A2: 'Élémentaire', B1: 'Intermédiaire', B2: 'Avancé', C1: 'Autonome' };
  const VERSION = 6;
  const cache = {};

  function load(code) {
    if (!cache[code]) {
      cache[code] = fetch(`content/${code}.json?v=${VERSION}`).then(r => { if (!r.ok) throw new Error('contenu'); return r.json(); }).then(d => {
        d.code = code;
        d.byId = new Map();
        for (const w of d.words) { w.kind = 'w'; w.key = `${code}:w:${w.id}`; w.lv = LEVELS.indexOf(w.l); d.byId.set(w.key, w); }
        for (const s of d.sentences) { s.kind = 's'; s.key = `${code}:s:${s.id}`; s.lv = LEVELS.indexOf(s.l); d.byId.set(s.key, s); }
        for (const v of d.irregular || []) { v.kind = 'v'; v.key = `${code}:v:${v.b}`; v.lv = 1; d.byId.set(v.key, v); }
        // Mots de chaque niveau, dans l'ordre du fichier (du plus courant au plus rare).
        d.levelWords = LEVELS.map((_, i) => d.words.filter(w => w.lv === i));
        d.levelSent = LEVELS.map((_, i) => d.sentences.filter(s => s.lv === i));
        d.synIndex = {};
        // Synonymes et tournures équivalentes, écrits comme la correction découpe les réponses (contractions, accents…).
        // m.multi : groupes qui contiennent une tournure de plusieurs mots (remplacée en bloc avant la comparaison).
        for (const [lg, groups] of Object.entries(d.syn || {})) {
          const m = d.synIndex[lg] = new Map();
          m.multi = [];
          for (const g0 of groups) {
            const g = [...new Set(g0.map(w => Check.tokens(w, lg).join(' ')).filter(Boolean))];
            if (g.length < 2) continue;
            for (const w of g) m.set(w, new Set([...(m.get(w) || []), ...g]));
            if (g.some(w => w.includes(' '))) {
              const raw = new Map(g0.map(w => [Check.tokens(w, lg).join(' '), w]));
              m.multi.push(g.map(w => Object.assign(w.split(' '), { raw: raw.get(w) || w })).sort((a, b) => b.length - a.length));
            }
          }
        }
        return d;
      }).catch(e => { delete cache[code]; throw e; });
    }
    return cache[code];
  }

  // Affichage
  const main = w => w.fr[0];
  const tl = x => x.tl || '';
  const first = s => Check.expand(s.tg[0])[0];
  const firstFr = s => Check.expand(s.fr[0])[0];

  // Sens d'un élément, pour les QCM : toutes ses traductions, sans les précisions entre parenthèses
  // (« bonjour (réponse) » = « bonjour »), avec leurs synonymes français (« salut » / « bonjour »).
  function meanings(d, x) {
    if (x._m) return x._m;
    const syn = (d.synIndex || {}).fr;
    const out = new Set();
    for (const f of x.fr || []) for (const v of Check.expand(f)) {
      const t = Check.norm(v.replace(/\(.*?\)/g, ' '));
      if (!t) continue;
      out.add(t);
      if (syn && syn.get(t)) for (const y of syn.get(t)) out.add(Check.norm(y));
    }
    return (x._m = out);
  }
  // Deux réponses qui pourraient être justes toutes les deux : même sens, ou l'une contient l'autre à un ou deux mots
  // près (« merci » / « merci beaucoup », « je vais bien » / « je vais bien, Dieu merci »), ou même texte.
  function clash(d, x, o) {
    if (o === x) return true;
    if (Check.norm(x.kind === 's' ? first(x) : x.w || '') === Check.norm(o.kind === 's' ? first(o) : o.w || '')) return true;
    const a = meanings(d, x), b = meanings(d, o);
    for (const m of a) {
      if (b.has(m)) return true;
      const ma = m.split(' ');
      for (const n of b) {
        const nb = n.split(' ');
        const [s, l] = ma.length <= nb.length ? [ma, nb] : [nb, ma];
        if (l.length - s.length <= 2 && s.every(w => l.includes(w))) return true;
      }
    }
    return false;
  }
  // Choix « faux » pour un QCM : même nature, niveau proche, et jamais une autre réponse juste.
  function distractors(d, w, n = 3, field = 'fr') {
    const near = d.words.filter(o => o.p === w.p && Math.abs(o.lv - w.lv) <= 1);
    const out = [];
    const seen = new Set([field === 'fr' ? Check.norm(main(w)) : w.w]);
    for (const o of [...shuffle(near), ...shuffle(d.words.filter(o => !near.includes(o)))]) {
      const k = field === 'fr' ? Check.norm(main(o)) : o.w;
      if (seen.has(k) || clash(d, w, o) || out.some(y => clash(d, y, o))) continue;
      seen.add(k); out.push(o);
      if (out.length >= n) break;
    }
    return out;
  }
  function sentDistractors(d, s, n = 3) {
    const near = d.sentences.filter(o => Math.abs(o.lv - s.lv) <= 1);
    const out = [];
    for (const o of [...shuffle(near), ...shuffle(d.sentences.filter(o => !near.includes(o)))]) {
      if (clash(d, s, o) || out.some(y => clash(d, y, o))) continue;
      out.push(o);
      if (out.length >= n) break;
    }
    return out;
  }

  return { LANGS, LEVELS, LEVEL_NAMES, load, main, tl, first, firstFr, distractors, sentDistractors, inLang, clash };
})();
