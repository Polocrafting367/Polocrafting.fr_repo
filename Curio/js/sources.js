// Sources ouvertes complémentaires à l'encyclopédie.
const Sources = (() => {
  const INAT_PLACE_FRANCE = 6753;
  const INAT_TAXA = {
    animaux: 'Mammalia,Aves,Reptilia,Amphibia,Insecta,Arachnida',
    plantes: 'Plantae,Fungi',
    ocean: 'Actinopterygii,Mollusca',
  };
  const ucfirst = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const pad = n => String(n).padStart(2, '0');
  const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Espèces réellement observées ces dernières semaines (en France ou dans le monde), contenu encyclopédique associé.
  async function inat(topicId, local) {
    const iconic = INAT_TAXA[topicId];
    if (!iconic) return [];
    const d1 = isoDay(new Date(Date.now() - 45 * 864e5));
    const page = 1 + Math.floor(Math.random() * 6);
    const url = `https://api.inaturalist.org/v1/observations/species_counts?locale=${Wiki.lang}&per_page=25&page=${page}` +
      `&quality_grade=research&d1=${d1}&iconic_taxa=${iconic}${local ? `&place_id=${INAT_PLACE_FRANCE}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const counts = new Map();
    const names = [];
    for (const r of data.results || []) {
      const t = r.taxon || {};
      const name = t.preferred_common_name ? ucfirst(t.preferred_common_name) : t.name;
      if (!name) continue;
      names.push(name);
      counts.set(name.toLowerCase(), r.count);
    }
    const pages = await Wiki.pages(names.slice(0, 20));
    return pages.map(p => {
      const n = counts.get(p.title.toLowerCase());
      const where = local ? 'en France' : 'dans le monde';
      return {
        ...p,
        badge: { label: local ? 'Nature près de toi' : 'Nature', hue: 120 },
        reason: n ? `Observé ${n.toLocaleString('fr-FR')} fois ${where} ces dernières semaines` : `Observé récemment ${where}`,
      };
    });
  }

  // Image astronomique du jour (NASA). Mise en cache pour la journée.
  async function apod() {
    const key = 'curio.apod.' + isoDay(new Date());
    try { const c = localStorage.getItem(key); if (c) return JSON.parse(c); } catch {}
    try {
      // Clé de démonstration publique : limitée, d'où le cache d'une journée et l'échec silencieux.
      const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true', { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      const a = await res.json();
      const img = a.media_type === 'image' ? a.url : a.thumbnail_url;
      if (!img) return null;
      const card = {
        title: a.title,
        desc: 'Image astronomique du jour' + (a.copyright ? ` · © ${a.copyright.trim()}` : ' · NASA'),
        extract: a.explanation || '',
        thumb: img,
        length: 99999,
        cats: [],
        noWiki: true,
        topic: 'espace',
        sourceUrl: `https://apod.nasa.gov/apod/ap${a.date.slice(2).replace(/-/g, '')}.html`,
        badge: { label: 'NASA', hue: 250 },
        reason: Wiki.lang === 'en' ? 'Astronomy Picture of the Day' : 'Image du jour de la NASA (texte original en anglais)',
      };
      try { localStorage.setItem(key, JSON.stringify(card)); } catch {}
      return card;
    } catch { return null; }
  }

  // Actualités de la presse (agrégées par api/news.php sur le serveur, avec cache).
  let newsP = null, newsAt = 0, newsRegion = null;
  function news(region) {
    if (!newsP || Date.now() - newsAt > 10 * 60e3 || region !== newsRegion) {
      newsRegion = region;
      newsAt = Date.now();
      newsP = fetch(`api/news.php?region=${encodeURIComponent(region || '')}`)
        .then(r => (r.ok ? r.json() : { items: [] }))
        .then(d => d.items || [])
        .catch(() => { newsAt = 0; return []; });
    }
    return newsP;
  }

  // Région administrative à partir de la position (API Adresse de l'État, ouverte et gratuite).
  const REGION_BY_NAME = {
    'auvergne-rhone-alpes': 'auvergne-rhone-alpes', 'bourgogne-franche-comte': 'bourgogne-franche-comte', 'bretagne': 'bretagne',
    'centre-val-de-loire': 'centre-val-de-loire', 'corse': 'corse', 'grand-est': 'grand-est', 'hauts-de-france': 'hauts-de-france',
    'ile-de-france': 'paris-ile-de-france', 'normandie': 'normandie', 'nouvelle-aquitaine': 'nouvelle-aquitaine', 'occitanie': 'occitanie',
    'pays-de-la-loire': 'pays-de-la-loire', 'provence-alpes-cote-d-azur': 'provence-alpes-cote-d-azur',
  };
  const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  function detectRegion() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Géolocalisation indisponible'));
      navigator.geolocation.getCurrentPosition(async pos => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const r = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}&limit=1`);
          const d = await r.json();
          const ctx = d.features && d.features[0] && d.features[0].properties.context; // "29, Finistère, Bretagne"
          const name = ctx ? ctx.split(',').pop().trim() : '';
          const region = REGION_BY_NAME[slug(name)];
          if (!region) return reject(new Error('Position hors de France'));
          resolve({ region, city: d.features[0].properties.city || '' });
        } catch (e) { reject(e); }
      }, () => reject(new Error('Position refusée')), { timeout: 12000, maximumAge: 3600e3 });
    });
  }

  // ---------- Formats variés (pour que le fil ne ressemble pas qu'à une encyclopédie) ----------
  const mw = async (host, params) => {
    const qs = new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params });
    const r = await fetch(`https://${host}/w/api.php?${qs}`);
    return r.json();
  };
  const strip = h => { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };

  // Citation (Wikiquote) sur un thème ou un auteur.
  async function citation(keyword) {
    const host = `${Wiki.lang}.wikiquote.org`;
    const s = await mw(host, { action: 'query', list: 'search', srsearch: keyword, srlimit: '15', srnamespace: '0' });
    const hits = ((s.query && s.query.search) || []).sort(() => Math.random() - 0.5);
    for (const h of hits.slice(0, 3)) {
      const d = await mw(host, { action: 'parse', page: h.title, prop: 'text', disableeditsection: '1' });
      const html = d.parse && d.parse.text;
      if (!html) continue;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const quotes = [...doc.querySelectorAll('.citation')].map(el => {
        const ref = el.nextElementSibling && el.nextElementSibling.matches('.ref, ul') ? strip(el.nextElementSibling.innerHTML) : '';
        return { text: strip(el.innerHTML), ref };
      }).filter(q => q.text.length > 40 && q.text.length < 280);
      if (!quotes.length) continue;
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      const isTheme = /^Thème/i.test(h.title);
      const author = isTheme ? (q.ref.split(',')[0] || '') : h.title;
      let thumb = '';
      if (author) { try { const [p] = await Wiki.pages([author]); thumb = p ? p.thumb : ''; } catch {} }
      return {
        title: author || h.title.replace(/^Thème\s*:\s*/i, ''), quote: q.text, desc: q.ref.slice(0, 140), extract: q.text, thumb, length: 0, cats: [],
        noWiki: true, sourceUrl: `https://${host}/wiki/${encodeURIComponent(h.title)}`, badge: { label: 'Citation', hue: 280 },
        reason: `Une citation autour de « ${keyword} »`, cat: 'citation',
      };
    }
    return null;
  }

  // Destination (Wikivoyage).
  async function voyage(local) {
    const host = `${Wiki.lang}.wikivoyage.org`;
    const d = await mw(host, { action: 'query', generator: 'search', gsrsearch: local ? 'France ville' : 'ville pays', gsrlimit: '20', gsroffset: String(Math.floor(Math.random() * 300)), gsrnamespace: '0',
      prop: 'extracts|pageimages|info', exintro: '1', explaintext: '1', exlimit: '20', piprop: 'thumbnail', pithumbsize: '1080' });
    const pages = ((d.query && d.query.pages) || []).filter(p => p.thumbnail && (p.extract || '').length > 200 && p.length > 8000);
    if (!pages.length) return null;
    const p = pages[Math.floor(Math.random() * pages.length)];
    return {
      title: p.title, desc: 'Destination', extract: p.extract.replace(/\s+/g, ' ').trim(), thumb: p.thumbnail.source, length: p.length, cats: [],
      sourceUrl: `https://${host}/wiki/${encodeURIComponent(p.title)}`, badge: { label: 'Voyage', hue: 190 }, reason: local ? 'Une destination à découvrir en France' : 'Une destination à découvrir', cat: 'voyage',
    };
  }

  // Image du jour (Wikimedia Commons).
  async function pictureOfDay(day = 0) {
    const f = await Wiki.featured(new Date(Date.now() - day * 864e5));
    const im = f.image;
    if (!im || !im.thumbnail) return null;
    const desc = strip((im.description && (im.description.html || im.description.text)) || '');
    return {
      title: desc.split(/[.,;:(]/)[0].slice(0, 80) || 'Image du jour', desc: (im.artist && strip(im.artist.html || im.artist.text || '')).slice(0, 80),
      extract: desc, thumb: (im.image && im.image.width <= 2400 ? im.image.source : im.thumbnail.source), length: 0, cats: [], noWiki: true,
      sourceUrl: im.file_page, badge: { label: 'Image du jour', hue: 45 }, reason: 'La photo du jour de Wikimedia Commons', cat: 'image', en: im.description && im.description.lang && im.description.lang !== Wiki.lang,
    };
  }

  // Œuvre d'art célèbre (Wikidata : tableaux, titres et auteurs en français, images Wikimedia Commons).
  // La liste est gardée une semaine sur l'appareil.
  async function artworks() {
    const key = 'curio.art.' + Wiki.lang;
    try { const c = JSON.parse(localStorage.getItem(key)); if (c && Date.now() - c.t < 7 * 864e5 && c.list.length) return c.list; } catch {}
    const q = `SELECT ?item ?itemLabel ?creatorLabel ?image WHERE { ?item wdt:P31 wd:Q3305213; wdt:P18 ?image; wikibase:sitelinks ?sl. FILTER(?sl > 12) OPTIONAL{?item wdt:P170 ?creator} SERVICE wikibase:label { bd:serviceParam wikibase:language "${Wiki.lang},en". } } LIMIT 900`;
    const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), { signal: AbortSignal.timeout(12000) });
    const d = await r.json();
    const list = d.results.bindings.filter(b => !/^Q\d+$/.test(b.itemLabel.value))
      .map(b => [b.itemLabel.value, b.creatorLabel ? b.creatorLabel.value : '', b.image.value.replace(/^http:/, 'https:')]);
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), list })); } catch {}
    return list;
  }
  async function artwork() {
    let list = [];
    try { list = await artworks(); } catch {}
    if (!list.length) {
      // Repli si Wikidata est saturé : tableaux trouvés par la recherche encyclopédique.
      const r = await Wiki.search('articletopic:visual-arts tableau huile toile', { offset: Math.floor(Math.random() * 300) });
      const p = r.pages.find(x => x.thumb && x.extract.length > 120);
      return p ? { ...p, contain: true, badge: { label: 'Œuvre d\'art', hue: 330 }, cat: 'art', reason: 'Une œuvre à connaître' } : null;
    }
    for (let k = 0; k < 4; k++) {
      const [title, artist, img] = list[Math.floor(Math.random() * list.length)];
      const [p] = await Wiki.pages([title]).catch(() => []);
      const base = { thumb: img + '?width=1000', contain: true, badge: { label: 'Œuvre d\'art', hue: 330 }, cat: 'art', reason: 'Une œuvre célèbre à connaître', artist };
      if (p && p.extract.length > 120 && !p.disambig) return { ...p, ...base, desc: [artist, p.desc].filter(Boolean).join(' · ') };
    }
    return null;
  }

  // Image de la NASA (photothèque publique).
  async function nasaImage() {
    const q = ['nebula', 'galaxy', 'mars surface', 'jupiter', 'saturn', 'earth from space', 'astronaut', 'aurora', 'supernova', 'moon', 'hubble', 'james webb'][Math.floor(Math.random() * 12)];
    const r = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page=${1 + Math.floor(Math.random() * 5)}`);
    const d = await r.json();
    const items = ((d.collection && d.collection.items) || []).filter(i => i.links && i.links[0] && i.data && i.data[0] && (i.data[0].description || '').length > 120);
    if (!items.length) return null;
    const it = items[Math.floor(Math.random() * items.length)];
    const meta = it.data[0];
    return {
      title: meta.title, desc: `NASA · ${(meta.date_created || '').slice(0, 4)}`, extract: strip(meta.description).slice(0, 900),
      thumb: it.links[0].href.replace('~thumb', '~medium'), length: 0, cats: [], noWiki: true, en: true, topic: 'espace',
      sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(meta.nasa_id)}`, badge: { label: 'NASA', hue: 250 }, reason: 'Photothèque de la NASA', cat: 'nasa',
    };
  }

  // Traduction d'un texte étranger (MyMemory, gratuit).
  const trCache = {};
  function translate(text, from = 'en') {
    const k = from + text.slice(0, 80);
    if (!trCache[k]) {
      trCache[k] = fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${from}|${Wiki.lang}`)
        .then(r => r.json()).then(d => { const t = d.responseData && d.responseData.translatedText; const el = document.createElement('textarea'); el.innerHTML = t || ''; return el.value; })
        .catch(() => '');
    }
    return trCache[k];
  }

  return { inat, apod, news, detectRegion, citation, voyage, pictureOfDay, artwork, nasaImage, translate, INAT_TAXA };
})();
