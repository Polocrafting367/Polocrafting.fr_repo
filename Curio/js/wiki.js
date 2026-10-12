// Accès à Wikipédia : API MediaWiki (recherche, extraits, catégories) + API REST (médias, fil du jour).
// Toutes les réponses passent par un cache mémoire + une file limitée pour respecter les quotas de Wikimedia.
const Wiki = (() => {
  let lang = 'fr';
  const cache = new Map();
  const MAX_PARALLEL = 3;
  let running = 0;
  const queue = [];

  const base = () => `https://${lang}.wikipedia.org`;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function slot() {
    if (running < MAX_PARALLEL) { running++; return Promise.resolve(); }
    return new Promise(r => queue.push(r));
  }
  function release() {
    const next = queue.shift();
    if (next) next(); else running--;
  }

  async function getJSON(url, { ttl = 10 * 60e3 } = {}) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.t < ttl) return hit.p;
    const p = (async () => {
      await slot();
      try {
        for (let attempt = 0; attempt < 4; attempt++) {
          let res;
          try { res = await fetch(url); } catch (e) { if (attempt === 3) throw e; await sleep(800 * (attempt + 1)); continue; }
          if (res.status === 429 || res.status >= 500) { await sleep(1500 * (attempt + 1) ** 2); continue; }
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return await res.json();
        }
        throw new Error('Wikipédia ne répond pas');
      } finally { release(); }
    })();
    cache.set(url, { t: Date.now(), p });
    p.catch(() => cache.delete(url));
    if (cache.size > 400) cache.delete(cache.keys().next().value);
    return p;
  }

  function api(params, opts) {
    const qs = new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params });
    return getJSON(`${base()}/w/api.php?${qs}`, opts);
  }

  const https = u => (u && u.startsWith('//') ? 'https:' + u : u);
  const BAD_TITLE = /^(Liste |Chronologie |Liste_|Années? |\d{1,4}(?: av\. J\.-C\.)?$|List of |Timeline of |\d{4} en |\d{4} in )/;

  function normalize(p) {
    return {
      title: p.title,
      desc: p.description || '',
      extract: cleanText(p.extract || ''),
      thumb: p.thumbnail ? https(p.thumbnail.source) : '',
      length: p.length || 0,
      cats: (p.categories || []).map(c => c.title.replace(/^[^:]+:/, '')),
      disambig: !!(p.pageprops && 'disambiguation' in p.pageprops),
    };
  }

  function cleanText(t) {
    return t
      .replace(/\(\s*[;,]?\s*\)/g, '')
      .replace(/\s+([,.;:])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  // Recherche + contenu en une seule requête (jusqu'à 20 pages).
  async function search(q, { offset = 0, limit = 20 } = {}) {
    const d = await api({
      action: 'query', generator: 'search', gsrsearch: q, gsrlimit: String(limit), gsroffset: String(offset),
      gsrnamespace: '0', redirects: '1',
      prop: 'pageimages|extracts|description|info|pageprops|categories',
      piprop: 'thumbnail', pithumbsize: '1080', exintro: '1', explaintext: '1', exlimit: '20',
      ppprop: 'disambiguation', clshow: '!hidden', cllimit: '500',
    });
    const pages = (d.query && d.query.pages) || [];
    pages.sort((a, b) => (a.index || 0) - (b.index || 0));
    const total = d.query && d.query.searchinfo ? d.query.searchinfo.totalhits : undefined;
    return { pages: pages.map(normalize), total, more: !!d.continue };
  }

  // Pages précises par titres (max 20).
  async function pages(titles) {
    if (!titles.length) return [];
    const d = await api({
      action: 'query', titles: titles.slice(0, 20).join('|'), redirects: '1',
      prop: 'pageimages|extracts|description|info|pageprops|categories',
      piprop: 'thumbnail', pithumbsize: '1080', exintro: '1', explaintext: '1', exlimit: '20',
      ppprop: 'disambiguation', clshow: '!hidden', cllimit: '500',
    });
    return ((d.query && d.query.pages) || []).filter(p => !p.missing).map(normalize);
  }

  function usable(p, { minLength = 0, imagesOnly = true } = {}) {
    if (p.disambig || BAD_TITLE.test(p.title)) return false;
    if (imagesOnly && !p.thumb) return false;
    if (p.extract.length < 140) return false;
    return p.length >= minLength;
  }

  const SKIP_SECTIONS = /^(Notes?|Références?|Notes et références|Voir aussi|Bibliographie|Liens externes|Annexes|Articles connexes|Sources?|Filmographie|Discographie|Galerie|Liens internes|See also|References|Notes|External links|Further reading|Bibliography|Gallery)$/i;

  // Article complet découpé en sections (texte brut).
  async function article(title) {
    const d = await api({
      action: 'query', titles: title, redirects: '1', prop: 'extracts',
      explaintext: '1', exsectionformat: 'wiki',
    }, { ttl: 60 * 60e3 });
    const p = d.query && d.query.pages && d.query.pages[0];
    const text = (p && p.extract) || '';
    const lines = text.split('\n');
    const sections = [];
    let cur = { title: '', level: 1, text: [] };
    for (const line of lines) {
      const m = line.match(/^(={2,6})\s*(.*?)\s*\1\s*$/);
      if (m) {
        sections.push(cur);
        cur = { title: m[2], level: m[1].length, text: [] };
      } else if (line.trim()) cur.text.push(line.trim());
    }
    sections.push(cur);
    const out = sections
      .map(s => ({ title: s.title, level: s.level, paras: s.text.map(cleanText).filter(Boolean) }))
      .filter(s => s.paras.length);
    // On coupe tout ce qui suit la première section de références.
    const cut = out.findIndex(s => s.level === 2 && SKIP_SECTIONS.test(s.title));
    return cut > 0 ? out.slice(0, cut) : out.filter(s => !SKIP_SECTIONS.test(s.title));
  }

  // Sections principales (niveau 2) avec leurs sous-sections fusionnées : sert aux diapositives.
  function keySections(sections, max = 6) {
    const groups = [];
    for (const s of sections) {
      if (s.level <= 1) continue;
      if (s.level === 2 || !groups.length) groups.push({ title: s.title, paras: [...s.paras] });
      else groups[groups.length - 1].paras.push(...s.paras);
    }
    return groups.filter(g => g.paras.join(' ').length > 160).slice(0, max);
  }

  // Images de l'article (hors icônes, logos, cartes vectorielles).
  async function media(title) {
    try {
      const d = await getJSON(`${base()}/api/rest_v1/page/media-list/${encodeURIComponent(title.replace(/ /g, '_'))}`, { ttl: 60 * 60e3 });
      return (d.items || [])
        .filter(i => i.type === 'image' && i.srcset && i.srcset.length && !/\.(svg)$/i.test(i.title || '') && !/(icon|logo|flag|drapeau|blason|signature|symbol|map)/i.test(i.title || ''))
        .map(i => ({ src: https(i.srcset[i.srcset.length - 1].src), caption: i.caption ? cleanText(i.caption.text || '') : '' }));
    } catch { return []; }
  }

  async function related(title, limit = 6) {
    const r = await search(`morelike:"${title.replace(/"/g, '')}"`, { limit });
    return r.pages.filter(p => usable(p, { imagesOnly: false }));
  }

  // Fil du jour : plus lus, éphéméride, article labellisé, image du jour.
  async function featured(date = new Date()) {
    const ymd = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('/');
    try {
      return await getJSON(`${base()}/api/rest_v1/feed/featured/${ymd}`, { ttl: 30 * 60e3 });
    } catch { return {}; }
  }

  function fromFeed(a) {
    return {
      title: (a.titles && a.titles.normalized) || a.normalizedtitle || a.title.replace(/_/g, ' '),
      desc: a.description || '',
      extract: cleanText(a.extract || ''),
      thumb: a.thumbnail ? https(a.originalimage && a.originalimage.width <= 1600 ? a.originalimage.source : a.thumbnail.source) : '',
      length: 99999,
      cats: [],
      disambig: a.type === 'disambiguation',
    };
  }

  async function suggest(prefix) {
    if (!prefix.trim()) return [];
    const d = await api({
      action: 'query', generator: 'prefixsearch', gpssearch: prefix, gpslimit: '8', gpsnamespace: '0', redirects: '1',
      prop: 'pageimages|description', piprop: 'thumbnail', pithumbsize: '120',
    }, { ttl: 5 * 60e3 });
    return ((d.query && d.query.pages) || [])
      .sort((a, b) => a.index - b.index)
      .map(p => ({ title: p.title, desc: p.description || '', thumb: p.thumbnail ? https(p.thumbnail.source) : '' }));
  }

  return {
    get lang() { return lang; },
    set lang(l) { lang = l; cache.clear(); },
    pageUrl: t => `${base()}/wiki/${encodeURIComponent(t.replace(/ /g, '_'))}`,
    search, pages, usable, article, keySections, media, related, featured, fromFeed, suggest, cleanText,
  };
})();
