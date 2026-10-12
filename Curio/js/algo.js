// Profil utilisateur + algorithme de recommandation.
//
// Principe :
//  1. Chaque carte vient d'une SOURCE (tes sujets, similaires, catégories apprises, tendances, presse, découverte).
//     La proportion de chaque source est réglable dans Réglages > Algorithme.
//  2. Dans une source, les candidats sont classés par un SCORE :
//       poids du sous-sujet + affinité avec les catégories apprises + qualité + fraîcheur + bruit d'exploration
//  3. DIVERSITÉ : jamais deux fois le même sous-sujet ni trois fois la même catégorie d'affilée ;
//     chaque lot récupéré ne fournit que quelques cartes. Avec peu de sujets suivis, la découverte augmente.
//  4. Chaque carte vue produit un SIGNAL (temps passé, diapositives lues, j'aime, garder, lecture complète,
//     « pas intéressé »...). Il ajuste les poids des sous-sujets, des catégories d'articles et des journaux.
//  5. Une carte « découverte » qui plaît fait entrer son sujet dans tes intérêts automatiquement.
//
// Le profil est stocké sur l'appareil et, si tu as un compte, sauvegardé sur le serveur (api/account.php).

const Store = (() => {
  const KEY = 'curio.v1';
  const defaults = () => ({
    onboarded: false,
    updated: 0,             // horodatage de la dernière modification (synchronisation serveur)
    lang: 'fr',
    categories: [],         // grandes catégories choisies à l'accueil
    interests: {},          // sous-sujet -> poids (0.1 .. 10)
    custom: [],             // sujets créés depuis la recherche : {id, label, q, hue}
    discovered: {},         // sous-sujet -> score cumulé en mode découverte
    cats: {},               // catégorie d'article -> poids (-5 .. 10)
    press: {},              // journal ou type d'actu -> poids (-5 .. 5)
    seeds: [],              // articles appréciés : {title, topic, s, t}
    seen: {},               // titre -> horodatage
    cursors: {},            // sous-sujet -> profondeur de recherche atteinte
    saved: [],              // {title, desc, thumb, t, url?}
    liked: [],              // titres
    history: [],            // {title, desc, thumb, source, s, t}
    settings: {
      mix: { interets: 30, similaires: 10, categories: 8, actu: 8, presse: 16, variete: 16, decouverte: 12 },
      temperature: 1,       // 0.3 = très ciblé, 2 = très varié
      learnRate: 1,
      surpriseEvery: 7,
      imagesOnly: true,
      minLength: 6000,
      // Notifications (app Android) : un canal par type, heures fixes ou au hasard.
      channels: {
        sujet: { enabled: true, mode: 'fixed', times: ['09:00'], count: 1, from: '09:00', to: '21:00' },
      },
      notifAsked: false,
      region: 'fr',         // 'fr' ou 'monde'
      localShare: 70,       // % de contenu local quand region = fr
      area: '',             // région française pour la presse locale (slug France 3)
      city: '',
    },
    stats: { cards: 0, seconds: 0, days: {}, lastDecay: '' },
  });

  function merge(obj) {
    const d = defaults();
    const st = Object.assign(d, obj || {});
    st.settings = Object.assign(defaults().settings, st.settings || {});
    st.settings.mix = Object.assign(defaults().settings.mix, st.settings.mix || {});
    // Les langues sont parties dans Kalima : plus de cartes « mots à apprendre » dans le fil.
    delete st.settings.mix.langue;
    st.settings.channels = Object.assign(defaults().settings.channels, st.settings.channels || {});
    return st;
  }

  // Un profil par compte sur l'appareil (comme Carnet) : « curio.v1 » sans compte, « curio.v1@pseudo » sinon.
  // Deux personnes sur le même téléphone ne mélangent donc jamais leurs progrès.
  let user = '';
  try { user = localStorage.getItem('curio.user') || ''; } catch {}
  const keyOf = u => (u ? `${KEY}@${u}` : KEY);
  const read = u => { try { return JSON.parse(localStorage.getItem(keyOf(u))); } catch { return null; } };
  let state = merge(Sync.repair(read(user)));

  let timer;
  const listeners = [];
  function write() {
    clearTimeout(timer);
    timer = null;
    try { localStorage.setItem(keyOf(user), JSON.stringify(state)); } catch {}
  }
  function save({ touch = true } = {}) {
    if (touch) state.updated = Date.now();
    clearTimeout(timer);
    timer = setTimeout(() => { write(); listeners.forEach(f => f(state)); }, 300);
  }
  // L'app passe en arrière-plan ou se ferme : écriture immédiate (Android peut tuer l'app juste après).
  const flush = () => { if (timer) { write(); listeners.forEach(f => f(state)); } };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  return {
    get s() { return state; },
    get user() { return user; },
    // Une copie locale existe-t-elle pour ce compte ?
    has(u) { try { return !!localStorage.getItem(keyOf(u)); } catch { return false; } },
    save,
    flush,
    onSave: f => listeners.push(f),
    reset() { state = merge(null); write(); },
    replace(obj, { touch = false } = {}) { state = merge(Sync.repair(obj)); save({ touch }); },
    // Change de compte. adopt = le profil actuel (sans compte) devient celui de ce compte.
    use(u, { adopt = false } = {}) {
      flush();
      const cur = state, was = user;
      user = u || '';
      try { if (user) localStorage.setItem('curio.user', user); else localStorage.removeItem('curio.user'); } catch {}
      state = adopt ? cur : merge(Sync.repair(read(user)));
      write();
      // Le profil sans compte devenu celui du compte n'a plus à rester en double.
      if (adopt && !was && user) try { localStorage.removeItem(KEY); } catch {}
    },
    // Le profil sans compte de cet appareil a-t-il de vrais progrès (points, lectures) ?
    guestProgress() {
      const g = read('');
      if (!g) return null;
      const reads = (g.history || []).length, saved = (g.saved || []).length;
      return reads >= 10 || saved ? { reads, saved } : null;
    },
  };
})();

const Algo = (() => {
  const S = () => Store.s;
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => ymd(new Date()); // date locale
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const gumbel = () => -Math.log(-Math.log(Math.random() + 1e-9) + 1e-9);

  function topic(id) {
    return TOPIC_BY_ID[id] || S().custom.find(c => c.id === id);
  }
  function allTopics() { return [...TOPICS, ...S().custom]; }
  function catOf(topicId) { const t = topic(topicId); return t ? (t.cat || t.id) : null; }
  function topicQuery(t) {
    if (!t) return '';
    if (Wiki.lang === 'fr') return t.q;
    return t.en || t.q.split(' ').filter(w => w.startsWith('articletopic:')).join(' ') || t.label;
  }

  // Choix des grandes catégories : tous leurs sous-sujets démarrent au même poids, l'algo trie ensuite.
  function setCategories(ids) {
    const st = S();
    st.categories = ids;
    const keep = new Set(ids.flatMap(id => (CATEGORY_BY_ID[id] || { topics: [] }).topics));
    for (const id of keep) if (st.interests[id] === undefined) st.interests[id] = 2;
    for (const id of Object.keys(st.interests)) {
      if (TOPIC_BY_ID[id] && !keep.has(id) && st.interests[id] <= 2.2) delete st.interests[id];
    }
    Store.save();
  }

  // Déclin quotidien : les goûts appris s'estompent doucement pour que l'algo reste vivant.
  function dailyDecay() {
    const st = S().stats;
    const d = today();
    if (st.lastDecay === d) return;
    const days = st.lastDecay ? Math.min(30, Math.round((Date.parse(d) - Date.parse(st.lastDecay)) / 864e5)) : 0;
    if (days > 0) {
      const f = Math.pow(0.97, days);
      for (const c in S().cats) {
        S().cats[c] *= f;
        if (Math.abs(S().cats[c]) < 0.05) delete S().cats[c];
      }
      for (const c in S().press) S().press[c] *= f;
      S().seeds = S().seeds.filter(x => Date.now() - x.t < 21 * 864e5);
    }
    st.lastDecay = d;
    Store.save({ touch: false });
  }

  function weightedPick(entries) { // [[clé, poids], ...]
    const total = entries.reduce((a, [, w]) => a + Math.max(0, w), 0);
    if (total <= 0) return entries.length ? entries[Math.floor(Math.random() * entries.length)][0] : null;
    let r = Math.random() * total;
    for (const [k, w] of entries) { r -= Math.max(0, w); if (r <= 0) return k; }
    return entries[entries.length - 1][0];
  }

  function pickInterest(exclude = []) {
    const T = S().settings.temperature;
    let entries = Object.entries(S().interests).filter(([id]) => topic(id));
    const filtered = entries.filter(([id]) => !exclude.includes(id) && !exclude.includes(catOf(id)));
    if (filtered.length) entries = filtered;
    return weightedPick(entries.map(([id, w]) => [id, Math.pow(Math.max(w, 0.05), 1 / T)]));
  }

  function catAffinity(cats) {
    if (!cats || !cats.length) return 0;
    let sum = 0, n = 0;
    for (const c of cats) if (S().cats[c] !== undefined) { sum += S().cats[c]; n++; }
    return n ? clamp(sum / Math.sqrt(cats.length), -3, 3) : 0;
  }

  function score(c) {
    const st = S();
    let s;
    if (c.news) {
      const ageH = (Date.now() / 1000 - (c.date || 0)) / 3600;
      s = 1 - Math.min(1.5, ageH / 24) + (st.press[c.source] || 0) * 0.5 + (st.press['kind:' + c.kind] || 0) * 0.5 + (c.local ? 0.6 : 0);
      if (st.settings.region === 'monde') s += ['monde', 'science', 'savoir', 'tech'].includes(c.kind) ? 0.9 : -0.6;
    } else {
      const tw = c.topic && st.interests[c.topic] !== undefined ? st.interests[c.topic] : 1;
      s = 0.7 * Math.log1p(Math.max(0, tw)) + 0.45 * catAffinity(c.cats) + Math.min(0.5, (c.length || 0) / 80000);
    }
    return s + st.settings.temperature * 0.6 * gumbel();
  }

  // Signal d'engagement d'une carte → nombre entre -4 et +6.
  function signal(e) {
    let s = 0;
    const sec = e.dwell / 1000;
    if (sec < 1.6 && e.slides <= 1) s -= 0.7;
    else if (sec < 4) s -= 0.1;
    else if (sec < 10) s += 0.3;
    else if (sec < 25) s += 0.8;
    else s += 1.2;
    s += Math.min(5, Math.max(0, e.slides - 1)) * 0.3;
    if (e.liked) s += 2;
    if (e.saved) s += 2.5;
    if (e.read) s += 1.5 + Math.min(2, (e.readSec || 0) / 60);
    if (e.shared) s += 1.5;
    if (e.related) s += 1;
    if (e.notInterested) s -= 4;
    return clamp(s, -4, 6);
  }

  function learn(card, e) {
    const s = signal(e);
    const st = S();
    const added = apply(card, s);
    st.history.unshift({ title: card.title, desc: card.desc, thumb: card.thumb, source: card.source, url: card.news ? card.sourceUrl : undefined, s: Math.round(s * 10) / 10, t: Date.now() });
    if (st.history.length > 400) st.history.length = 400;
    st.stats.cards++;
    st.stats.seconds += Math.round(e.dwell / 1000 + (e.readSec || 0));
    st.stats.days[today()] = (st.stats.days[today()] || 0) + 1;
    Store.save();
    return { s, added };
  }

  // Signal supplémentaire sur une carte déjà comptée (like tardif, lecture complète...).
  function boost(card, delta) {
    if (!delta) return null;
    const h = S().history.find(x => x.title === card.title);
    if (h) h.s = Math.round((h.s + delta) * 10) / 10;
    const added = apply(card, delta);
    Store.save();
    return added;
  }

  function apply(card, s) {
    const st = S();
    const lr = st.settings.learnRate;
    let added = null;
    if (card.news) {
      st.press[card.source] = clamp((st.press[card.source] || 0) + lr * 0.2 * s, -5, 5);
      st.press['kind:' + card.kind] = clamp((st.press['kind:' + card.kind] || 0) + lr * 0.15 * s, -5, 5);
    }
    if (card.topic) {
      if (st.interests[card.topic] !== undefined) {
        st.interests[card.topic] = clamp(st.interests[card.topic] + lr * 0.3 * s, 0.1, 10);
      } else if (topic(card.topic)) {
        st.discovered[card.topic] = (st.discovered[card.topic] || 0) + s;
        if (st.discovered[card.topic] >= 2) {
          st.interests[card.topic] = 1.5;
          delete st.discovered[card.topic];
          added = topic(card.topic);
        }
      }
    }
    for (const c of (card.cats || []).slice(0, 20)) {
      st.cats[c] = clamp((st.cats[c] || 0) + lr * 0.25 * s, -5, 10);
      if (Math.abs(st.cats[c]) < 0.05) delete st.cats[c];
    }
    const keys = Object.keys(st.cats);
    if (keys.length > 500) keys.sort((a, b) => Math.abs(st.cats[a]) - Math.abs(st.cats[b])).slice(0, keys.length - 500).forEach(k => delete st.cats[k]);
    if (s >= 1 && card.title && !card.news) {
      st.seeds = st.seeds.filter(x => x.title !== card.title);
      st.seeds.push({ title: card.title, topic: card.topic, s, t: Date.now() });
      if (st.seeds.length > 40) st.seeds.sort((a, b) => b.s - a.s).length = 40;
    }
    return added;
  }

  function markSeen(title) {
    const seen = S().seen;
    seen[title] = Date.now();
    const keys = Object.keys(seen);
    if (keys.length > 5000) keys.sort((a, b) => seen[a] - seen[b]).slice(0, 1000).forEach(k => delete seen[k]);
  }

  function streak() {
    let n = 0;
    const d = new Date();
    if (!S().stats.days[today()]) d.setDate(d.getDate() - 1);
    while (S().stats.days[ymd(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  const SOURCES = {
    interets:   { label: 'Tes sujets',          help: 'Articles des sujets que tu suis, choisis selon leur poids.' },
    similaires: { label: 'Similaires',          help: 'Articles proches de ceux que tu as aimés ou lus longtemps.' },
    categories: { label: 'Catégories apprises', help: 'Thèmes précis repérés dans tes lectures.' },
    actu:       { label: 'Tendances',           help: 'Les sujets les plus lus du jour et les éphémérides.' },
    variete:    { label: 'Formats variés',      help: 'Citations, destinations de voyage, image du jour, œuvres d\'art, photos de la NASA.' },
    presse:     { label: 'Presse',              help: 'Actualité des journaux (nationale, et locale si tu as choisi ta région), avec le contexte pour comprendre.' },
    decouverte: { label: 'Découverte',          help: 'Sujets qui n\'ont rien à voir. S\'ils te plaisent, ils rejoignent tes intérêts.' },
  };

  return { topic, allTopics, catOf, topicQuery, setCategories, dailyDecay, pickInterest, score, signal, learn, boost, markSeen, streak, weightedPick, catAffinity, SOURCES, rand, clamp, today };
})();

// Moteur d'un fil (instancié pour « Pour toi », « Actu » et le fil d'un sujet ou d'une catégorie).
class FeedEngine {
  constructor({ mode = 'pourtoi', topicId = null } = {}) {
    this.mode = mode;
    this.topicId = topicId;
    this.pools = { interets: [], similaires: [], categories: [], actu: [], presse: [], variete: [], decouverte: [] };
    this.inflight = {};
    this.used = new Set();
    this.recent = [];       // [{topic, cat, source, inat}] des dernières cartes
    this.count = 0;
    this.injected = [];
    this.actuDay = 0;
  }

  get st() { return Store.s; }
  opts() { return { minLength: this.st.settings.minLength, imagesOnly: this.st.settings.imagesOnly }; }

  accept(p) {
    return Wiki.usable(p, this.opts()) && !this.used.has(p.title) && !this.st.seen[p.title];
  }

  mixFor() {
    if (this.mode === 'actu') return { presse: 72, actu: 28 };
    if (this.mode === 'topic') return { interets: 85, similaires: 15 };
    const mix = { ...this.st.settings.mix };
    // Les tendances de l'encyclopédie française sont très centrées sur la France : moins présentes en mode Monde.
    if (this.st.settings.region === 'monde') mix.actu = Math.round(mix.actu / 2);
    // Peu de sujets suivis : on renouvelle davantage.
    const n = Object.keys(this.st.interests).length;
    if (n < 6) mix.decouverte += (6 - n) * 6;
    return mix;
  }

  // Sous-sujets autorisés dans le fil d'un sujet ou d'une catégorie.
  scope() {
    if (this.mode !== 'topic') return null;
    if (this.topicId.startsWith('cat:')) return (CATEGORY_BY_ID[this.topicId.slice(4)] || { topics: [] }).topics;
    return [this.topicId];
  }

  chooseSource() {
    const surprise = this.st.settings.surpriseEvery;
    if (this.mode === 'pourtoi' && surprise > 0 && this.count > 0 && this.count % surprise === 0) return 'decouverte';
    let src = Algo.weightedPick(Object.entries(this.mixFor()));
    if (src === 'similaires' && !this.seeds().length) src = this.mode === 'actu' ? 'presse' : 'interets';
    if (src === 'categories' && !this.topCats().length) src = 'interets';
    if (src === 'interets' && this.mode === 'pourtoi' && !Object.keys(this.st.interests).length) src = 'decouverte';
    return src;
  }

  seeds() {
    const scope = this.scope();
    return scope ? this.st.seeds.filter(x => scope.includes(x.topic)) : this.st.seeds;
  }
  topCats() {
    return Object.entries(this.st.cats).filter(([, w]) => w > 0.4).sort((a, b) => b[1] - a[1]).slice(0, 25);
  }
  recentKeys(n) {
    return this.recent.slice(-n).flatMap(r => [r.topic, r.cat]).filter(Boolean);
  }

  async fill(src) {
    if (this.inflight[src]) return this.inflight[src];
    this.inflight[src] = this._fill(src).catch(e => console.warn('fill', src, e)).finally(() => { this.inflight[src] = null; });
    return this.inflight[src];
  }

  async _fill(src) {
    const st = this.st;
    const pool = this.pools[src];
    // Ajoute au plus `max` cartes d'un lot : un lot = un seul thème, on ne veut pas l'enchaîner.
    const add = (pages, meta, max = 4) => {
      let n = 0;
      for (const p of pages) {
        if (n >= max) break;
        if (!this.accept(p) || pool.some(x => x.title === p.title)) continue;
        pool.push({ ...p, source: src, ...meta(p), ...(p.reason ? { reason: p.reason } : {}) });
        n++;
      }
    };

    if (src === 'interets') {
      const scope = this.scope();
      const id = scope ? scope[Math.floor(Math.random() * scope.length)] : Algo.pickInterest(this.recentKeys(2));
      const t = Algo.topic(id);
      if (!t) return;
      // Zone France : une part réglable des cartes est centrée sur la France, le reste est mondial.
      const local = st.settings.region === 'fr' && Math.random() * 100 < st.settings.localShare;
      // Mode Monde : une bonne part des articles est tirée vers une autre région du monde.
      const WORLD = [['africa', 'Afrique'], ['asia', 'Asie'], ['east-asia', 'Asie de l\'Est'], ['south-asia', 'Asie du Sud'], ['south-america', 'Amérique du Sud'],
        ['north-america', 'Amérique du Nord'], ['oceania', 'Océanie'], ['eastern-europe', 'Europe de l\'Est'], ['central-asia', 'Asie centrale']];
      const world = st.settings.region === 'monde' && Math.random() < 0.6 ? WORLD[Math.floor(Math.random() * WORLD.length)] : null;
      const where = local ? ' · France' : world ? ` · ${world[1]}` : '';
      if (Sources.INAT_TAXA[id] && Math.random() < 0.3) {
        try {
          const list = await Sources.inat(id, local);
          add(list.sort(() => Math.random() - 0.5), () => ({ topic: id, inat: true }), 2);
          if (pool.length) return;
        } catch {}
      }
      const depth = st.cursors[id] || 40;
      // 1 fois sur 4 : uniquement des articles labellisés (qualité reconnue).
      const quality = Wiki.lang === 'fr' && Math.random() < 0.25;
      let q = Algo.topicQuery(t);
      if (local) q += Wiki.lang === 'fr' ? ' France' : ' France OR French';
      if (world) q += ' articletopic:' + world[0];
      if (quality) q += Math.random() < 0.5 ? ' hastemplate:"Article_de_qualité"' : ' hastemplate:"Bon_article"';
      const offset = quality ? Math.floor(Algo.rand(0, 40)) : Math.floor(Algo.rand(0, depth));
      const r = await Wiki.search(q, { offset });
      if (!quality) st.cursors[id] = Math.min(Math.max(depth + 25, 40), r.total || 3000, 3000);
      add(r.pages.sort(() => Math.random() - 0.5), () => ({ topic: id, reason: `Parce que tu suis « ${t.label} »${where}` + (quality ? ' · article de qualité' : '') }), 3);
    }

    else if (src === 'similaires') {
      const seeds = this.seeds();
      if (!seeds.length) return;
      const seed = Algo.weightedPick(seeds.map(x => [x, x.s * Math.exp(-(Date.now() - x.t) / (5 * 864e5))]));
      const r = await Wiki.search(`morelike:"${seed.title.replace(/"/g, '')}"`, { offset: Math.floor(Algo.rand(0, 15)) });
      add(r.pages, () => ({ topic: seed.topic, reason: `Parce que tu as aimé « ${seed.title} »` }), 2);
    }

    else if (src === 'categories') {
      const cats = this.topCats();
      if (!cats.length) return;
      const cat = Algo.weightedPick(cats);
      const r = await Wiki.search(`incategory:"${cat.replace(/"/g, '')}"`, { offset: Math.floor(Algo.rand(0, 20)) });
      add(r.pages.sort(() => Math.random() - 0.5), () => ({ topic: null, cat: 'c:' + cat, reason: `Tu explores « ${cat} »` }), 2);
    }

    else if (src === 'variete') {
      const st2 = this.st;
      const local = st2.settings.region === 'fr' && Math.random() * 100 < st2.settings.localShare;
      const ids = Object.keys(st2.interests).filter(id => Algo.topic(id));
      const kw = ids.length ? Algo.topic(ids[Math.floor(Math.random() * ids.length)]).label.split(/[ &,]+/)[0] : 'savoir';
      const makers = [
        [() => Sources.citation(kw), 3],
        [() => Sources.voyage(local), 2],
        [() => Sources.pictureOfDay(Math.floor(Math.random() * 20)), 2],
        [() => Sources.artwork(), st2.categories.includes('arts') ? 3 : 1],
        [() => Sources.nasaImage(), st2.categories.includes('sciences') ? 3 : 1],
      ];
      const tries = makers.sort(() => Math.random() - 0.5).sort((a, b) => b[1] * Math.random() - a[1] * Math.random()).slice(0, 2);
      for (const [make] of tries) {
        try {
          const c = await make();
          if (c && !this.used.has(c.title) && !st2.seen[c.title] && !pool.some(x => x.title === c.title)) pool.push({ ...c, source: 'variete', topic: c.topic || null });
        } catch {}
      }
    }

    else if (src === 'presse') {
      const area = st.settings.region === 'fr' ? st.settings.area : '';
      const items = await Sources.news(area);
      const hues = { actu: 12, monde: 200, science: 160, tech: 260, local: 140 };
      for (const it of items) {
        if (pool.length >= 40) break;
        if (this.used.has(it.title) || st.seen[it.title] || pool.some(x => x.title === it.title)) continue;
        if (st.settings.imagesOnly && !it.image) continue;
        if (st.settings.region === 'monde' && it.local) continue;
        pool.push({
          title: it.title, desc: '', extract: it.summary, thumb: it.image, length: 0, cats: [],
          news: true, noWiki: true, kind: it.kind, local: it.local, date: it.date, sourceUrl: it.link,
          source: 'presse', topic: null, cat: 'presse:' + it.kind,
          badge: { label: it.source, hue: hues[it.kind] || 12 },
          reason: it.local ? `Près de chez toi · ${it.source}` : `À la une · ${it.source}`,
        });
      }
    }

    else if (src === 'actu') {
      // Remonte jour après jour : aujourd'hui, hier, avant-hier...
      for (let tries = 0; tries < 3 && pool.length < 6; tries++) {
        const day = this.actuDay++;
        if (day > 14) break;
        const date = new Date(Date.now() - day * 864e5);
        const f = await Wiki.featured(date);
        const items = [];
        if (day === 0 && Math.random() < 0.8) {
          const a = await Sources.apod();
          if (a && !this.used.has(a.title) && !st.seen[a.title]) pool.push({ ...a, source: 'actu' });
        }
        if (f.tfa && day === 0) items.push([f.tfa, 'Article à la une aujourd\'hui']);
        for (const a of (f.mostread && f.mostread.articles) || []) items.push([a, day === 0 ? `Tendance : ${a.views ? a.views.toLocaleString('fr-FR') + ' lectures' : 'très lu'} aujourd'hui` : `Très lu le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`]);
        for (const e of ((f.onthisday || []).slice(0, 12))) {
          const pg = (e.pages || []).find(p => p.thumbnail);
          if (pg) items.push([pg, `Ce jour-là, en ${e.year} : ${e.text}`]);
        }
        const pages = items.map(([a, reason]) => ({ ...Wiki.fromFeed(a), reason }));
        const full = new Map();
        for (let i = 0; i < pages.length; i += 20) {
          try { (await Wiki.pages(pages.slice(i, i + 20).map(p => p.title))).forEach(p => full.set(p.title, p)); } catch {}
        }
        for (const p of pages) {
          const fp = full.get(p.title);
          const merged = fp ? { ...p, cats: fp.cats, length: fp.length, extract: fp.extract || p.extract, disambig: fp.disambig } : p;
          if (!Wiki.usable(merged, { ...this.opts(), minLength: Math.min(2500, this.opts().minLength) })) continue;
          if (this.used.has(merged.title) || st.seen[merged.title] || pool.some(x => x.title === merged.title)) continue;
          pool.push({ ...merged, source: 'actu', topic: null, cat: 'tendance' });
        }
      }
    }

    else if (src === 'decouverte') {
      const notMine = Algo.allTopics().filter(t => st.interests[t.id] === undefined);
      if (notMine.length && Math.random() < 0.6) {
        const t = notMine[Math.floor(Math.random() * notMine.length)];
        const r = await Wiki.search(Algo.topicQuery(t), { offset: Math.floor(Algo.rand(0, 80)) });
        add(r.pages.sort(() => Math.random() - 0.5), () => ({ topic: t.id, reason: `Découverte : « ${t.label} », rien à voir avec tes sujets` }), 2);
      } else {
        const q = Wiki.lang === 'fr' ? 'hastemplate:"Article_de_qualité"' : 'hastemplate:"Featured_article"';
        const r = await Wiki.search(q, { offset: Math.floor(Algo.rand(0, 2000)) });
        add(r.pages, () => ({ topic: null, cat: 'surprise', reason: 'Découverte : un article d\'exception, au hasard' }), 3);
      }
    }
  }

  // Insère des articles en tête (recherche, articles liés, lien de notification).
  inject(items) {
    for (const it of items.slice().reverse()) if (!this.used.has(it.title)) this.injected.unshift(it);
  }

  // Une carte est-elle trop proche des précédentes ?
  tooSimilar(c) {
    const cat = c.cat || Algo.catOf(c.topic) || c.source;
    const last = this.recent[this.recent.length - 1];
    if (!last) return false;
    if (c.topic && c.topic === last.topic) return true;
    if (c.inat && last.inat) return true;
    // Pas la même catégorie que l'une des deux dernières cartes.
    return this.recent.slice(-2).some(r => r.cat === cat);
  }

  async next() {
    if (this.injected.length) return this.take(this.injected.shift());
    let fallback = null;
    for (let attempt = 0; attempt < 7; attempt++) {
      const src = attempt < 5 ? this.chooseSource() : (this.mode === 'actu' ? 'presse' : 'decouverte');
      if (this.pools[src].length < 3) {
        const p = this.fill(src);
        // Une source lente (réseau, service saturé) ne doit jamais bloquer le fil : 7 s maximum.
        if (!this.pools[src].length) await Promise.race([p, new Promise(r => setTimeout(r, 7000))]);
      }
      const cands = this.pools[src].filter(c => !this.used.has(c.title));
      if (!cands.length) continue;
      let best = null, bestS = -Infinity;
      for (const c of cands) {
        const s = Algo.score(c) - (this.tooSimilar(c) ? 5 : 0);
        if (s > bestS) { bestS = s; best = c; }
      }
      if (this.tooSimilar(best) && attempt < 6) { fallback = fallback || best; continue; }
      this.pools[src] = this.pools[src].filter(c => c !== best);
      return this.take(best);
    }
    if (fallback) {
      for (const k in this.pools) this.pools[k] = this.pools[k].filter(c => c !== fallback);
      return this.take(fallback);
    }
    return null;
  }

  take(c) {
    this.used.add(c.title);
    this.count++;
    this.recent.push({ topic: c.topic, cat: c.cat || Algo.catOf(c.topic) || c.source, inat: !!c.inat });
    if (this.recent.length > 10) this.recent.shift();
    return c;
  }
}
