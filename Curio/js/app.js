// Interface de Curio : fil vertical infini (cartes) + diapositives horizontales + lecteur + pages.
(() => {
  const VERSION = '1.5.0';
  const APK_URL = 'curio.apk';
  // Les langues ont leur propre app (même serveur, mêmes comptes).
  const KALIMA_URL = '../Kalima/';
  const Native = window.WebApk || null; // présent uniquement dans l'app Android (coquille WebApk)

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = id => `<svg><use href="#i-${id}"/></svg>`;
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const hueOf = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
  const S = () => Store.s;
  const appUrl = title => `${location.origin}${location.pathname}?a=${encodeURIComponent(title)}`;

  function wireImgs(root) {
    $$('img', root).forEach(img => {
      if (img.complete && img.naturalWidth) img.classList.add('ok');
      img.addEventListener('load', () => img.classList.add('ok'), { once: true });
      img.addEventListener('error', () => { img.closest('.pic') ? img.closest('.slide').classList.add('nopic') : img.remove(); }, { once: true });
    });
  }

  function toast(msg, ic = 'check') {
    const t = $('#toast');
    t.innerHTML = `${icon(ic)}<span>${esc(msg)}</span>`;
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.hidden = true), 2600);
  }

  // ---------- Pile de retours (bouton retour Android / navigateur) ----------
  // Chaque calque (vue, lecteur, modale, fil d'un sujet) ajoute une entrée d'historique.
  // La fermeture est toujours synchrone ; le popstate qui suit un retour programmé est ignoré.
  const overlays = [];
  let ignorePop = 0;
  function pushOverlay(close) {
    overlays.push(close);
    history.pushState({ curio: overlays.length }, '');
  }
  function popOverlay() {
    const close = overlays.pop();
    if (!close) return;
    close();
    ignorePop++;
    history.back();
  }
  function unwind() {
    const n = overlays.length;
    if (!n) return;
    while (overlays.length) overlays.pop()();
    ignorePop++;
    history.go(-n);
  }
  window.addEventListener('popstate', () => {
    if (ignorePop) { ignorePop--; return; }
    const close = overlays.pop();
    if (close) close();
  });
  // Appelé par l'app Android : renvoie true si l'app web a géré le retour.
  window.webApkBack = () => {
    if (overlays.length) { popOverlay(); return true; }
    return false;
  };

  function openExternal(url) {
    if (Native && Native.openUrl) Native.openUrl(url); else window.open(url, '_blank', 'noopener');
  }

  async function share(title) {
    const url = appUrl(title);
    const text = `${title}, à découvrir sur Curio`;
    if (Native && Native.share) return Native.share(title, text, url);
    if (navigator.share) { try { await navigator.share({ title, text, url }); } catch {} return; }
    try { await navigator.clipboard.writeText(url); toast('Lien copié'); } catch { prompt('Lien à partager', url); }
  }

  // ---------- Notifications de l'app Android ----------
  // Un canal : « Sujet du jour » (api/daily.php), qui alimente aussi le widget. L'app interroge cette adresse aux
  // heures choisies ; le serveur choisit le sujet selon le profil. (Les langues sont maintenant dans l'app Kalima.)
  let syncTimer, lastChannels = '';
  function channelList() {
    return [['sujet', { label: 'Sujet du jour', help: 'Un article choisi selon tes goûts, avec un court résumé.' }]];
  }
  function dailyFeedUrl() {
    const st = S();
    const top = Object.entries(st.interests)
      .map(([id, w]) => ({ t: Algo.topic(id), w }))
      .filter(x => x.t)
      .sort((a, b) => b.w - a.w)
      .slice(0, 6)
      .map(x => `${Algo.topicQuery(x.t)}~${x.t.label}~${x.w.toFixed(1)}`);
    const qs = new URLSearchParams({ lang: Wiki.lang, region: st.settings.region, min: st.settings.minLength, t: top.join('|') });
    return new URL(`api/daily.php?${qs}`, location.href).href;
  }
  // Réglage commun : « réparties » (N notifications réparties régulièrement dans une plage) ou heures fixes par type.
  function notifSettings() {
    const st = S().settings;
    if (!st.notifPlan) st.notifPlan = { mode: 'spread', from: '09:00', to: '21:00' };
    return st.notifPlan;
  }
  const toMin = t => { const [h, m] = (t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
  const toHM = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
  // Répartition : toutes les notifications de la journée sont espacées régulièrement, en alternant les types.
  function plannedTimes() {
    const plan = notifSettings();
    const ch = S().settings.channels;
    const list = channelList().filter(([id]) => ch[id].enabled);
    const out = Object.fromEntries(list.map(([id]) => [id, []]));
    if (plan.mode === 'fixed') { for (const [id] of list) out[id] = ch[id].times.slice(); return out; }
    const left = Object.fromEntries(list.map(([id]) => [id, Math.max(1, ch[id].count || 1)]));
    const order = [];
    while (Object.values(left).some(n => n > 0)) for (const [id] of list) if (left[id] > 0) { order.push(id); left[id]--; }
    const a = toMin(plan.from), b = Math.max(toMin(plan.to), a + 30);
    const step = (b - a) / order.length;
    order.forEach((id, k) => out[id].push(toHM(a + step * (k + 0.5) - (order.length === 1 ? step / 2 : 0))));
    return out;
  }
  function channelsConfig() {
    const ch = S().settings.channels;
    const times = plannedTimes();
    const list = [];
    for (const [id, meta] of channelList()) {
      const c = ch[id];
      const feedUrl = dailyFeedUrl();
      list.push({ id, label: meta.label, enabled: !!c.enabled, mode: 'fixed', times: (times[id] && times[id].length ? times[id] : c.times),
        feedUrl, icon: '', widget: true, widgets: 'card' });
    }
    return JSON.stringify(list);
  }
  function nativeSync(now = false) {
    if (!Native || !Native.setChannels) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      // L'adresse change avec les goûts : on ne compare que les réglages pour éviter de tout reprogrammer.
      const cfg = channelsConfig();
      const sig = cfg.replace(/"feedUrl":"[^"]*"/g, '');
      if (sig === lastChannels && !now) return;
      lastChannels = sig;
      try { Native.setChannels(cfg); } catch (e) { console.warn(e); }
    }, now ? 10 : 1500);
  }
  // Réponse de l'app après la demande d'autorisation Android.
  window.webApkPermission = (kind, ok) => {
    if (kind !== 'notifications') return;
    toast(ok ? 'Notifications activées' : 'Notifications refusées : modifiable dans les réglages Android', ok ? 'bell' : 'info');
    if (view === 'settings') renderSettings();
  };
  Store.onSave(nativeSync);

  // ---------- Découpage du texte en diapositives ----------
  // Découpage en phrases, sans couper « av. J.-C. », « M. Dupont », « etc. », les initiales…
  const ABBR = /\b(av|apr|env|cf|etc|vol|p|n°|St|Ste|Mt|M|Mme|Mlle|Dr|Pr|Mgr|J\.-C|vs|Inc|Ltd|Jr|Sr|[A-ZÉ])\./g;
  function sentences(text) {
    const safe = (text || '').replace(ABBR, m => m.replace(/\./g, '\u2024'));
    return (safe.match(/[^.!?…]+(?:[.!?…]+["»”)]*\s*|$)/g) || [safe]).map(x => x.replace(/\u2024/g, '.').trim()).filter(Boolean);
  }
  // Résumé court : les premières phrases, dans une limite de caractères.
  function brief(text, maxSent = 2, maxChars = 280) {
    const out = [];
    let len = 0;
    for (const x of sentences(text || '')) {
      if (out.length >= maxSent || (out.length && len + x.length > maxChars)) break;
      out.push(x);
      len += x.length;
    }
    let r = out.join(' ');
    if (r.length > maxChars * 1.4) r = r.slice(0, maxChars).replace(/\s+\S*$/, '') + '…';
    return r;
  }
  function rest(text, skip) { return sentences(text || '').slice(skip).join(' '); }
  function ago(ts) {
    const m = Math.max(1, Math.round((Date.now() / 1000 - ts) / 60));
    if (m < 60) return `il y a ${m} min`;
    const h = Math.round(m / 60);
    return h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
  }
  // Mots-clés d'un titre de presse pour trouver le contexte encyclopédique.
  function newsQuery(title) {
    const words = title.replace(/[«»"“”'’:,;!?.()\[\]–—-]/g, ' ').split(/\s+/).filter(Boolean);
    const proper = words.filter((w, i) => i > 0 && /^[A-ZÉÈÀÂÎÔÛÇ]/.test(w) && w.length > 2);
    if (proper.length) return proper.slice(0, 4).join(' ');
    return words.filter(w => w.length > 5).slice(0, 4).join(' OR ');
  }
  // Titre d'une carte : taille adaptée à la longueur (un titre de presse de 120 caractères tient sans être coupé),
  // et précision d'un titre d'encyclopédie (« Titanic (film, 1997) ») affichée en petit au-dessus.
  function titleHtml(c) {
    let t = c.title, pre = '';
    const m = !c.news && t.match(/^(.{3,}?)\s*\(([^()]{2,40})\)$/);
    if (m) { t = m[1]; pre = m[2]; }
    const n = t.length;
    const size = n > 110 ? 'xs' : n > 80 ? 's' : n > 50 ? 'm' : '';
    return `${pre ? `<span class="pre">${esc(pre)}</span>` : ''}<h2 class="${size}">${esc(t)}</h2>`;
  }
  // ---------- Fil ----------
  // Cartes d'avance gardées sur l'appareil (6 h au plus) pour un démarrage sans attente.
  const Warm = {
    KEY: 'curio.warm.v1',
    put(list) { try { localStorage.setItem(this.KEY, JSON.stringify({ t: Date.now(), list: list.filter(d => d && d.title) })); } catch {} },
    take() {
      try {
        const w = JSON.parse(localStorage.getItem(this.KEY));
        localStorage.removeItem(this.KEY);
        return w && Date.now() - w.t < 6 * 3600e3 ? w.list : [];
      } catch { return []; }
    },
  };
  class FeedView {
    constructor(mode, topicId = null) {
      this.mode = mode;
      this.topicId = topicId;
      this.engine = new FeedEngine({ mode, topicId });
      this.cards = [];
      this.active = -1;
      this.loading = false;
      this.root = el(`<div class="feed" data-mode="${mode}"></div>`);
      // Molette et pavé tactile : un geste = une carte (l'inertie ne fait plus défiler 5 articles).
      let locked = false, stepAt = 0, unlockT;
      this.root.addEventListener('wheel', e => {
        if (e.ctrlKey) return;
        e.preventDefault();
        const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        const d = horiz ? e.deltaX : e.deltaY;
        const now = Date.now();
        clearTimeout(unlockT);
        unlockT = setTimeout(() => (locked = false), Math.max(240, 520 - (now - stepAt)));
        if (locked || Math.abs(d) < 6) return;
        locked = true;
        stepAt = now;
        if (horiz) { const cs = this.cards[this.active]; if (cs) this.go(cs, d > 0 ? 1 : -1); }
        else this.step(d > 0 ? 1 : -1);
      }, { passive: false });
      this.io = new IntersectionObserver(entries => {
        for (const e of entries) if (e.isIntersecting && e.intersectionRatio >= 0.6) this.setActive(+e.target.dataset.i);
      }, { root: this.root, threshold: [0.6] });
    }

    mount(parent) {
      parent.appendChild(this.root);
      // Cartes préparées à la dernière visite : affichées tout de suite, pendant que les suivantes se chargent.
      if (this.mode === 'pourtoi') for (const d of Warm.take()) { if (!S().seen[d.title]) { this.engine.used.add(d.title); this.append(d); } }
      this.loadMore(this.cards.length ? 2 : 3);
    }
    // Les prochaines cartes non vues, gardées pour le prochain lancement.
    keepWarm() { if (this.mode === 'pourtoi') Warm.put(this.cards.slice(this.active + 1, this.active + 7).map(c => c.data)); }
    destroy() { this.leave(); this.io.disconnect(); this.root.remove(); }
    show(on) { this.root.hidden = !on; if (!on) this.leave(); else if (this.cards[this.active]) this.enter(this.cards[this.active]); }

    async loadMore(n) {
      if (this.loading) return;
      this.loading = true;
      const spin = el(`<section class="card loading"><div class="spinner"></div></section>`);
      this.root.appendChild(spin);
      let added = 0;
      try {
        for (let i = 0; i < n; i++) {
          const c = await this.engine.next();
          if (!c) break;
          this.append(c, spin);
          added++;
        }
      } catch (e) { console.warn(e); }
      spin.remove();
      this.loading = false;
      if (!added && !this.cards.length) {
        const err = el(`<section class="card error"><div><p>Impossible de charger des articles.<br>Vérifie ta connexion.</p><button class="btn">${icon('refresh')} Réessayer</button></div></section>`);
        err.querySelector('button').onclick = () => { err.remove(); this.loadMore(3); };
        this.root.appendChild(err);
      }
    }

    append(data, before = null, at = null) {
      const cs = { data, i: 0, slide: 0, maxSlide: 0, dwell: 0, since: 0, ev: {}, committed: false, built: false };
      const node = el(`<section class="card"></section>`);
      cs.el = node;
      if (at === null) {
        cs.i = this.cards.length;
        this.cards.push(cs);
        this.root.insertBefore(node, before);
      } else {
        this.cards.splice(at, 0, cs);
        const ref = this.cards[at + 1] ? this.cards[at + 1].el : null;
        this.root.insertBefore(node, ref);
        this.cards.forEach((c, k) => { c.i = k; c.el.dataset.i = k; });
        if (this.active >= at) this.active++;
      }
      node.dataset.i = cs.i;
      this.io.observe(node);
      if (Math.abs(cs.i - Math.max(this.active, 0)) <= 3) this.build(cs);
      return cs;
    }

    // Insère un article juste après la carte active et le fait défiler.
    insertNext(items, scroll = true) {
      const at = this.active + 1;
      items.forEach((d, k) => { this.engine.used.add(d.title); this.append(d, null, at + k); });
      if (scroll) requestAnimationFrame(() => this.cards[at] && this.cards[at].el.scrollIntoView({ behavior: 'smooth' }));
    }

    setActive(i) {
      if (i === this.active) return;
      const prev = this.cards[this.active];
      if (prev) this.leaveCard(prev);
      this.active = i;
      const cs = this.cards[i];
      if (!cs) return;
      this.enter(cs);
      Algo.markSeen(cs.data.title);
      // Construit les cartes proches, endort les lointaines (mémoire).
      this.cards.forEach((c, k) => {
        if (Math.abs(k - i) <= 3) this.build(c);
        else if (Math.abs(k - i) > 8 && c.built) this.sleep(c);
      });
      // Dans l'app, on prépare plus loin (détails, images) : le défilement ne bute jamais sur un chargement.
      const ahead = Native ? 4 : 2;
      for (let k = i; k <= i + ahead; k++) if (this.cards[k]) { this.details(this.cards[k]); if (this.cards[k].data.thumb) new Image().src = this.cards[k].data.thumb; }
      if (i >= this.cards.length - (Native ? 5 : 3)) this.loadMore(Native ? 6 : 4);
    }

    enter(cs) { cs.el.classList.add('active'); cs.since = performance.now(); }
    leave() { const cs = this.cards[this.active]; if (cs && cs.since) this.leaveCard(cs, true); }
    leaveCard(cs, keepActive = false) {
      if (!keepActive) cs.el.classList.remove('active');
      if (cs.since) { cs.dwell += performance.now() - cs.since; cs.since = 0; }
      if (!cs.committed && cs.dwell > 300) {
        cs.committed = true;
        const { added } = Algo.learn(cs.data, { ...cs.ev, dwell: cs.dwell, slides: cs.maxSlide + 1 });
        if (added) toast(`Ajouté à tes sujets : ${added.label}`, 'spark');
      }
    }
    // Action après que la carte a déjà été prise en compte (like tardif, lecture...).
    boost(cs, key, extra = {}) {
      cs.ev[key] = true;
      Object.assign(cs.ev, extra);
      if (cs.committed) {
        const base = { dwell: 0, slides: 1 };
        const delta = Algo.signal({ ...base, [key]: true, ...extra }) - Algo.signal(base);
        Algo.boost(cs.data, delta);
      }
    }

    sleep(cs) { cs.el.innerHTML = ''; cs.built = false; }

    build(cs) {
      if (cs.built) return;
      cs.built = true;
      const c = cs.data;
      const t = Algo.topic(c.topic);
      const hue = t ? t.hue : hueOf(c.title);
      cs.el.style.setProperty('--h', hue);
      const chip = c.badge ? `<span class="chip" style="--h:${c.badge.hue}">${esc(c.badge.label)}</span>`
        : t ? `<span class="chip" style="--h:${t.hue}">${esc(t.label)}</span>`
        : c.source === 'actu' ? `<span class="chip" style="--h:12">Actualité</span>`
        : `<span class="chip soft">${esc((Algo.SOURCES[c.source] || {}).label || 'Pour toi')}</span>`;
      cs.el.innerHTML = `
        <div class="slides">
          <article class="slide cover ${c.quote ? 'quote' : ''} ${c.contain ? 'contain' : ''}">
            ${c.thumb && c.contain ? `<img class="blur" src="${esc(c.thumb)}" alt="">` : ''}
            ${c.thumb ? `<img class="bg" src="${esc(c.thumb)}" alt="" decoding="async">` : ''}
            <div class="shade"></div>
            <div class="content">
              ${chip}
              ${c.quote ? `<blockquote>${esc(c.quote)}</blockquote><p class="desc">${esc(c.title)}</p>${c.desc ? `<p class="muted small">${esc(c.desc)}</p>` : ''}`
              : `${titleHtml(c)}
              ${c.news ? `<p class="desc">${esc(c.badge.label)} · ${ago(c.date)}</p>` : c.desc ? `<p class="desc">${esc(c.desc)}</p>` : ''}
              <p class="lead ${c.title.length > 70 ? 'short' : ''}">${esc(brief(c.extract, 2, c.title.length > 70 ? 140 : 200))}</p>`}
              ${c.reason ? `<button class="why" data-act="why">${icon('info')}<span>${esc(c.reason)}</span></button>` : ''}
            </div>
            <div class="swipe-hint">Glisse ${icon('back')}</div>
          </article>
        </div>
        <div class="progress"></div>
        <button class="slide-arrow prev" data-nav="-1" aria-label="Diapositive précédente">${icon('back')}</button>
        <button class="slide-arrow next" data-nav="1" aria-label="Diapositive suivante">${icon('back')}</button>
        <aside class="rail">
          <button class="like ${cs.ev.liked || S().liked.includes(c.title) ? 'on' : ''}" data-act="like"><span class="disc">${icon('heart')}</span>J'aime</button>
          <button class="save ${S().saved.some(x => x.title === c.title) ? 'on' : ''}" data-act="save"><span class="disc">${icon('bookmark')}</span>Garder</button>
          <button data-act="read"><span class="disc">${icon('book')}</span>Lire</button>
          <button data-act="share"><span class="disc">${icon('share')}</span>Partager</button>
          <button data-act="more"><span class="disc">${icon('layers')}</span>Plus</button>
        </aside>`;
      wireImgs(cs.el);
      if (cs.el.classList.contains('active')) { /* relance l'animation */ }
      const slides = $('.slides', cs.el);
      slides.addEventListener('scroll', () => {
        const k = Math.round(slides.scrollLeft / slides.clientWidth);
        if (k !== cs.slide) {
          cs.slide = k;
          cs.maxSlide = Math.max(cs.maxSlide, k);
          this.progress(cs);
          if (k >= slides.children.length - 1) this.related(cs);
        }
      }, { passive: true });
      slides.addEventListener('click', e => this.tap(cs, e));
      $$('.slide-arrow', cs.el).forEach(b => (b.onclick = () => this.go(cs, +b.dataset.nav)));
      $('.rail', cs.el).addEventListener('click', e => {
        const b = e.target.closest('[data-act]');
        if (b) this.act(cs, b.dataset.act, b);
      });
      if (cs.details) this.fillSlides(cs);
      this.progress(cs);
    }

    progress(cs) {
      const p = $('.progress', cs.el);
      if (!p) return;
      const n = $('.slides', cs.el).children.length;
      p.innerHTML = n > 1 ? Array.from({ length: n }, (_, k) => `<i class="${k <= cs.slide ? 'done' : ''}"></i>`).join('') : '';
      const prev = $('.slide-arrow.prev', cs.el), next = $('.slide-arrow.next', cs.el);
      if (prev) { prev.disabled = cs.slide <= 0; next.disabled = cs.slide >= n - 1; }
      const hint = $('.swipe-hint', cs.el);
      if (hint) hint.hidden = n <= 1 || cs.maxSlide > 0;
    }

    async details(cs) {
      if (cs.details || cs.detailsP) return;
      const c = cs.data;
      const done = slides => { cs.details = { slides }; if (cs.built) this.fillSlides(cs); };
      if (c.news) {
        // Actu : le contexte encyclopédique pour comprendre l'info.
        cs.detailsP = Wiki.search(newsQuery(c.title), { limit: 6 })
          .then(r => {
            const ctx = r.pages.filter(p => Wiki.usable(p, { imagesOnly: false, minLength: 3000 })).slice(0, 3);
            c.cats = ctx.flatMap(p => p.cats).slice(0, 20);
            done(ctx.map(p => ({ kicker: 'Pour comprendre', title: p.title, text: brief(p.extract, 2, 300), pic: p.thumb ? { src: p.thumb } : null, read: p.title })));
          })
          .catch(() => done([]));
        return;
      }
      if (c.en) {
        // Texte étranger : traduction automatique en diapositive.
        cs.detailsP = Sources.translate(c.extract.slice(0, 480)).then(t => done(t ? [{ kicker: 'Traduction', title: c.title, text: brief(t, 4, 420), pic: null }] : []));
        return;
      }
      if (c.quote) return done([]);
      if (c.noWiki) {
        const more = rest(c.extract, 2);
        return done(more.length > 80 ? [{ kicker: c.title, title: 'En détail', text: brief(more, 3, 360), pic: null }] : []);
      }
      cs.detailsP = Promise.all([Wiki.article(c.title), Wiki.media(c.title)])
        .then(([sections, media]) => {
          const intro = (sections[0] && sections[0].level === 1 ? sections[0].paras : [c.extract]).join(' ');
          const keys = Wiki.keySections(sections, 5);
          const fileOf = u => { try { const m = decodeURIComponent(u).match(/\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/); return m ? m[1] : ''; } catch { return ''; } };
          const thumbName = c.thumb ? fileOf(c.thumb) : '';
          const pics = media.filter(m => !thumbName || fileOf(m.src) !== thumbName);
          const slides = [];
          const after = rest(intro, 2);
          if (after.length > 80) slides.push({ kicker: c.title, title: 'L\'essentiel', text: brief(after, 2, 300), pic: pics.shift() });
          keys.forEach((k, n) => slides.push({ kicker: `${c.title} · ${n + 1}/${keys.length}`, title: k.title, text: brief(k.paras.join(' '), 2, 300), pic: pics.shift(), sec: k.title }));
          done(slides);
        })
        .catch(e => { console.warn(e); cs.detailsP = null; });
    }

    fillSlides(cs) {
      const slides = $('.slides', cs.el);
      if (!slides || slides.children.length > 1) return;
      const c = cs.data;
      let html = cs.details.slides.map(x => this.textSlide(x)).join('');
      html += `
        <article class="slide end">
          <h3>${c.news ? 'Aller plus loin' : 'Pour aller plus loin'}</h3>
          <div class="list rel-list">${c.noWiki ? '' : '<div class="skeleton rel" style="height:70px"></div><div class="skeleton rel" style="height:70px"></div>'}</div>
          <div class="end-actions">
            ${c.word
              ? `<button class="btn primary" data-act="learnadd">${icon('plus')} À réviser</button><button class="btn glass" data-act="learnknow">${icon('check')} Je le connais</button>`
              : c.noWiki
              ? `<button class="btn primary" data-act="wiki">${icon('external')} ${c.news ? 'Lire l\'article · ' + esc(c.badge.label) : 'Voir la source'}</button>`
              : `<button class="btn primary" data-act="read">${icon('book')} Article complet</button><button class="btn glass" data-act="wiki">${icon('external')} Source</button>`}
          </div>
        </article>`;
      slides.insertAdjacentHTML('beforeend', html);
      wireImgs(slides);
      this.progress(cs);
    }

    textSlide({ kicker, title, text, pic, sec = '', read = '' }) {
      return `
        <article class="slide text ${pic ? '' : 'nopic'}">
          <div class="pic">${pic ? `<img src="${esc(pic.src)}" alt="" loading="lazy" decoding="async">${pic.caption ? `<span class="cap">${esc(pic.caption)}</span>` : ''}` : ''}</div>
          <div class="body">
            <span class="kicker">${esc(kicker)}</span>
            <h3>${esc(title)}</h3>
            <div class="clip"><p>${esc(text)}</p></div>
            <button class="more-link" data-act="read" data-sec="${esc(sec)}" data-title="${esc(read)}">En savoir plus ${icon('book')}</button>
          </div>
        </article>`;
    }

    async related(cs) {
      if (cs.relP) return;
      if (cs.data.noWiki) { const b = $('.rel-list', cs.el); if (b) b.innerHTML = ''; return; }
      const box = $('.rel-list', cs.el);
      cs.relP = Wiki.related(cs.data.title, 6).then(list => {
        cs.rel = list.filter(p => p.title !== cs.data.title).slice(0, 4);
        const b = $('.rel-list', cs.el);
        if (!b) return;
        b.innerHTML = cs.rel.length ? cs.rel.map((p, k) => `
          <button class="rel" data-rel="${k}">
            ${p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy">` : '<span class="ph"></span>'}
            <span><b>${esc(p.title)}</b><small>${esc(p.desc || p.extract.slice(0, 90))}</small></span>
          </button>`).join('') : '<p class="muted">Rien de plus pour l\'instant.</p>';
        wireImgs(b);
      }).catch(() => { if (box) box.innerHTML = ''; cs.relP = null; });
    }

    tap(cs, e) {
      const slides = $('.slides', cs.el);
      const actBtn = e.target.closest('[data-act]');
      if (actBtn) return this.act(cs, actBtn.dataset.act, actBtn);
      const rel = e.target.closest('[data-rel]');
      if (rel) {
        const p = cs.rel[+rel.dataset.rel];
        this.boost(cs, 'related');
        this.insertNext([{ ...p, source: 'similaires', topic: cs.data.topic, reason: `Lié à « ${cs.data.title} »` }]);
        return;
      }
      const r = slides.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const now = Date.now();
      if (x > 0.3 && x < 0.7) {
        if (now - (cs.lastTap || 0) < 320) { this.like(cs, e.clientX - r.left, e.clientY - r.top, true); cs.lastTap = 0; }
        else cs.lastTap = now;
        return;
      }
      this.go(cs, x >= 0.7 ? 1 : -1);
    }

    go(cs, d) {
      const slides = $('.slides', cs.el);
      const k = Math.max(0, Math.min(slides.children.length - 1, cs.slide + d));
      slides.scrollTo({ left: k * slides.clientWidth, behavior: 'smooth' });
    }

    step(d) {
      const c = this.cards[this.active + d];
      if (c) c.el.scrollIntoView({ behavior: 'smooth' });
    }

    like(cs, x, y, fromTap = false) {
      const st = S();
      const t = cs.data.title;
      const btn = $('.rail .like', cs.el);
      const on = st.liked.includes(t);
      if (on && fromTap) { this.burst(cs, x, y); return; }
      if (on) { st.liked = st.liked.filter(x => x !== t); btn.classList.remove('on'); Store.save(); return; }
      st.liked.unshift(t);
      if (st.liked.length > 2000) st.liked.length = 2000;
      btn.classList.add('on');
      this.boost(cs, 'liked');
      Store.save();
      if (x !== undefined) this.burst(cs, x, y);
    }
    burst(cs, x, y) {
      const b = el(`<div class="burst" style="left:${x}px;top:${y}px">${icon('heart')}</div>`);
      cs.el.appendChild(b);
      setTimeout(() => b.remove(), 900);
    }

    act(cs, act, btn) {
      const c = cs.data;
      const st = S();
      if (act === 'like') return this.like(cs);
      if (act === 'save') {
        const i = st.saved.findIndex(x => x.title === c.title);
        if (i >= 0) { st.saved.splice(i, 1); btn.classList.remove('on'); toast('Retiré de la bibliothèque', 'bookmark'); }
        else { st.saved.unshift({ title: c.title, desc: c.news ? c.badge.label : c.desc, thumb: c.thumb, url: c.news ? c.sourceUrl : undefined, t: Date.now() }); btn.classList.add('on'); this.boost(cs, 'saved'); toast('Enregistré dans ta bibliothèque', 'bookmark'); }
        Store.save();
        return;
      }
      if (act === 'read' && btn && btn.dataset.title) return Reader.open(btn.dataset.title, { cs, feed: this });
      if (act === 'read' && c.noWiki) return openExternal(c.sourceUrl);
      if (act === 'read') return Reader.open(c.title, { cs, feed: this, section: btn && btn.dataset.sec });
      if (act === 'share') { this.boost(cs, 'shared'); return share(c.title); }
      if (act === 'wiki') return openExternal(c.sourceUrl || Wiki.pageUrl(c.title));
      if (act === 'why') return whyModal(cs, this);
      if (act === 'more') return moreMenu(cs, this);
    }

    notInterested(cs) {
      this.boost(cs, 'notInterested');
      if (!cs.committed) { cs.ev.notInterested = true; }
      toast('Compris, tu en verras moins', 'eyeoff');
      const next = this.cards[cs.i + 1];
      if (next) next.el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ---------- Modales ----------
  function modal(html, onReady) {
    const m = $('#modal');
    $('#modal-card').innerHTML = html;
    m.hidden = false;
    let closed = false;
    const close = () => { if (closed) return; closed = true; m.hidden = true; };
    pushOverlay(close);
    m.onclick = e => { if (e.target === m) popOverlay(); };
    if (onReady) onReady($('#modal-card'), () => { if (!closed) popOverlay(); });
  }

  function whyModal(cs) {
    const c = cs.data;
    const t = Algo.topic(c.topic);
    const aff = Algo.catAffinity(c.cats);
    const src = Algo.SOURCES[c.source] || { label: 'Recherche', help: 'Tu as ouvert cet article toi-même.' };
    const matched = (c.cats || []).filter(x => S().cats[x] !== undefined).sort((a, b) => S().cats[b] - S().cats[a]).slice(0, 6);
    modal(`
      <h3>Pourquoi cet article ?</h3>
      <p>${esc(c.reason || src.help)}</p>
      <table class="signals">
        <tr><td>Source</td><td>${esc(src.label)}</td></tr>
        ${t ? `<tr><td>Sujet · poids</td><td>${esc(t.label)} · ${(S().interests[t.id] ?? 0).toFixed(1)}</td></tr>` : ''}
        <tr><td>Affinité catégories</td><td class="${aff > 0 ? 'pos' : aff < 0 ? 'neg' : ''}">${aff.toFixed(2)}</td></tr>
        <tr><td>Taille de l'article</td><td>${Math.round((c.length || 0) / 1000)} k</td></tr>
      </table>
      ${matched.length ? `<p style="margin-top:12px">Catégories que tu as déjà appréciées : ${matched.map(esc).join(', ')}</p>` : ''}
      <div class="btns" style="margin-top:14px"><button class="btn" data-x>Fermer</button></div>
    `, (card, close) => { $('[data-x]', card).onclick = close; });
  }

  function moreMenu(cs, feed) {
    const c = cs.data;
    const t = Algo.topic(c.topic);
    const follows = t && S().interests[t.id] !== undefined;
    modal(`
      <h3>${esc(c.title)}</h3>
      <button class="menu-item" data-m="no">${icon('eyeoff')} Pas intéressé</button>
      ${t ? `<button class="menu-item" data-m="follow">${icon(follows ? 'minus' : 'plus')} ${follows ? 'Ne plus suivre' : 'Suivre'} « ${esc(t.label)} »</button>` : ''}
      ${t ? `<button class="menu-item" data-m="topic">${icon('compass')} Explorer « ${esc(t.label)} »</button>` : ''}
      <button class="menu-item" data-m="why">${icon('info')} Pourquoi cet article ?</button>
      <button class="menu-item" data-m="wiki">${icon('external')} Voir la source</button>
    `, (card, close) => {
      card.onclick = e => {
        const b = e.target.closest('[data-m]');
        if (!b) return;
        const m = b.dataset.m;
        close();
        setTimeout(() => {
          if (m === 'no') feed.notInterested(cs);
          if (m === 'follow') { toggleInterest(t.id); toast(follows ? `Tu ne suis plus ${t.label}` : `Tu suis ${t.label}`); }
          if (m === 'topic') openTopic(t.id);
          if (m === 'why') whyModal(cs);
          if (m === 'wiki') openExternal(c.sourceUrl || Wiki.pageUrl(c.title));
        }, 60);
      };
    });
  }

  // ---------- Lecteur ----------
  const Reader = {
    async open(title, { cs = null, feed = null, section = '' } = {}) {
      const box = $('#reader');
      const body = $('#reader-body');
      $('#reader-title').textContent = title;
      $('#reader-wiki').href = Wiki.pageUrl(title);
      $('#reader-wiki').onclick = e => { e.preventDefault(); openExternal(Wiki.pageUrl(title)); };
      body.innerHTML = `<div style="display:grid;place-items:center;height:50vh"><div class="spinner"></div></div>`;
      box.hidden = false;
      body.scrollTop = 0;
      const t0 = performance.now();
      if (feed) feed.leave();
      let closed = false;
      pushOverlay(() => {
        if (closed) return;
        closed = true;
        box.hidden = true;
        const sec = (performance.now() - t0) / 1000;
        if (cs && feed) {
          feed.boost(cs, 'read', { readSec: sec });
          feed.enter(cs);
        } else if (sec > 8) {
          Wiki.pages([title]).then(([p]) => p && Algo.learn({ ...p, source: 'recherche', topic: null }, { dwell: 0, slides: 1, read: true, readSec: sec })).catch(() => {});
        }
      });
      $('[data-close]', box).onclick = popOverlay;
      try {
        const [sections, media, info] = await Promise.all([
          Wiki.article(title), Wiki.media(title),
          cs ? Promise.resolve([cs.data]) : Wiki.pages([title]),
        ]);
        const p = info[0] || { title, desc: '', thumb: '' };
        const pics = media.slice();
        const hero = p.thumb || (pics[0] && pics[0].src);
        if (hero && pics[0] && p.thumb) pics.shift();
        let html = hero ? `<img class="reader-hero" src="${esc(hero)}" alt="">` : '';
        const tops = sections.filter(s => s.level === 2);
        html += `<div class="reader"><h1>${esc(p.title)}</h1>${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}`;
        if (tops.length > 2) html += `<div class="toc">${tops.map((s, k) => `<button data-toc="${k}">${esc(s.title)}</button>`).join('')}</div>`;
        let k2 = 0, n = 0;
        for (const s of sections) {
          if (s.level === 2) html += `<h2 id="rs-${k2++}" data-sec="${esc(s.title)}">${esc(s.title)}</h2>`;
          else if (s.level >= 3) html += `<h${Math.min(s.level, 5)}>${esc(s.title)}</h${Math.min(s.level, 5)}>`;
          html += s.paras.map(x => `<p>${esc(x)}</p>`).join('');
          if (s.level === 2 && pics.length && n++ % 2 === 0) {
            const m = pics.shift();
            html += `<figure><img src="${esc(m.src)}" alt="" loading="lazy">${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ''}</figure>`;
          }
        }
        html += `<div class="license"><a href="${esc(Wiki.pageUrl(p.title))}" data-ext>Source</a> · texte <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" data-ext>CC BY-SA</a> · détails dans Réglages › Crédits</div></div>`;
        if (closed) return;
        body.innerHTML = html;
        wireImgs(body);
        body.onclick = e => {
          const tb = e.target.closest('[data-toc]');
          if (tb) $(`#rs-${tb.dataset.toc}`, body).scrollIntoView({ behavior: 'smooth' });
          const a = e.target.closest('a[data-ext]');
          if (a) { e.preventDefault(); openExternal(a.href); }
        };
        if (section) {
          const h = $$('h2', body).find(x => x.dataset.sec === section);
          if (h) setTimeout(() => h.scrollIntoView(), 50);
        }
      } catch (e) {
        body.innerHTML = `<div class="empty">Impossible de charger l'article.</div>`;
      }
    },
  };

  // ---------- Vues ----------
  const feeds = {};
  let mode = 'pourtoi';
  let view = 'feed';

  function showView(v, push = true) {
    if (v === view) return;
    const prevView = view;
    view = v;
    $$('.view').forEach(x => x.classList.toggle('active', x.id === `view-${v}`));
    $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    const f = feeds[mode];
    if (f) f.show(v === 'feed');
    if (v === 'explore') renderExplore();
    if (v === 'library') renderLibrary();
    if (v === 'settings') renderSettings();
    if (push && prevView === 'feed' && v !== 'feed') pushOverlay(() => showView('feed', false));
  }

  function setMode(m) {
    if (m === mode && feeds[m]) return;
    if (feeds[mode]) feeds[mode].show(false);
    mode = m;
    $$('#feed-tabs button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
    if (!feeds[m]) { feeds[m] = new FeedView(m, m === 'topic' ? currentTopic : null); feeds[m].mount($('#feeds')); }
    feeds[m].show(true);
    $('#btn-topic-back').hidden = m !== 'topic';
  }

  let currentTopic = null;
  function openTopic(id) {
    const t = id.startsWith('cat:') ? CATEGORY_BY_ID[id.slice(4)] : Algo.topic(id);
    if (!t) return;
    currentTopic = id;
    const tab = $('#tab-topic');
    tab.textContent = t.label;
    tab.hidden = false;
    const prevMode = mode === 'topic' || !mode ? 'pourtoi' : mode;
    unwind();
    if (view !== 'feed') showView('feed', false);
    if (feeds.topic) { feeds.topic.destroy(); delete feeds.topic; }
    mode = mode === 'topic' ? null : mode;
    setMode('topic');
    pushOverlay(() => closeTopic(prevMode));
  }
  function closeTopic(back = 'pourtoi') {
    if (feeds.topic) { feeds.topic.destroy(); delete feeds.topic; }
    $('#tab-topic').hidden = true;
    mode = null;
    setMode(back);
  }

  async function openArticle(title, { scroll = true } = {}) {
    unwind();
    $('#reader').hidden = true;
    $('#modal').hidden = true;
    if (view !== 'feed') showView('feed', false);
    if (mode !== 'pourtoi') setMode('pourtoi');
    const f = feeds.pourtoi;
    try {
      const [p] = await Wiki.pages([title]);
      if (!p) return toast('Article introuvable', 'info');
      f.insertNext([{ ...p, source: 'recherche', topic: null, reason: 'Tu as choisi cet article' }], scroll);
      Wiki.related(p.title, 4).then(list => {
        const items = list.filter(x => x.title !== p.title && Wiki.usable(x, { imagesOnly: S().settings.imagesOnly }) && !f.engine.used.has(x.title)).slice(0, 3)
          .map(x => ({ ...x, source: 'similaires', topic: null, reason: `Dans la continuité de « ${p.title} »` }));
        const at = f.cards.findIndex(c => c.data.title === p.title);
        items.forEach((d, k) => { f.engine.used.add(d.title); f.append(d, null, at + 1 + k); });
      }).catch(() => {});
    } catch { toast('Connexion impossible', 'info'); }
  }
  // Appelé par l'app Android quand on touche une notification ou le widget.
  window.webApkOpen = url => {
    let q = new URLSearchParams();
    try { q = new URL(url, location.href).searchParams; } catch {}
    if (q.get('a')) openArticle(q.get('a'));
    else unwind();
    return true;
  };

  function toggleInterest(id, on) {
    const st = S();
    const has = st.interests[id] !== undefined;
    if (on === undefined) on = !has;
    if (on && !has) st.interests[id] = 3;
    if (!on && has) delete st.interests[id];
    Store.save();
    return on;
  }

  // ---------- Grille de sujets ----------
  function topicGrid(container, { onTap, compact = false } = {}) {
    const render = () => {
      container.innerHTML = Algo.allTopics().map(t => `
        <div class="topic ${S().interests[t.id] !== undefined ? 'on' : ''}" style="--h:${t.hue}" data-id="${t.id}" role="button" tabindex="0">
          <span class="dot"></span><span class="lbl">${esc(t.label)}</span>
          <button class="tog" data-tog aria-label="Suivre">${icon(S().interests[t.id] !== undefined ? 'check' : 'plus')}</button>
        </div>`).join('');
    };
    render();
    container.onclick = e => {
      const tile = e.target.closest('.topic');
      if (!tile) return;
      const id = tile.dataset.id;
      if (compact || e.target.closest('[data-tog]')) { toggleInterest(id); render(); container.dispatchEvent(new Event('change')); }
      else if (onTap) onTap(id);
    };
    return render;
  }

  // Grille des grandes catégories (avec icônes).
  function categoryGrid(container, { onTap, selectable = false, selected = [] } = {}) {
    const sel = new Set(selected);
    const render = () => {
      container.innerHTML = CATEGORIES.map(c => `
        <button class="cat ${sel.has(c.id) ? 'on' : ''}" style="--h:${c.hue}" data-cat="${c.id}">
          <span class="ic">${icon(c.icon)}</span><span class="lbl">${esc(c.label)}</span>
          ${selectable ? `<span class="tick">${icon('check')}</span>` : ''}
        </button>`).join('');
    };
    render();
    container.onclick = e => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      if (selectable) { sel.has(b.dataset.cat) ? sel.delete(b.dataset.cat) : sel.add(b.dataset.cat); render(); container.dispatchEvent(new CustomEvent('change', { detail: [...sel] })); }
      else if (onTap) onTap(b.dataset.cat);
    };
    return () => [...sel];
  }

  // ---------- Explorer ----------
  let exploreLoaded = false;
  async function renderExplore() {
    categoryGrid($('#explore-cats'), { onTap: id => openTopic('cat:' + id) });
    topicGrid($('#explore-topics'), { onTap: openTopic });
    if (exploreLoaded) return;
    exploreLoaded = true;
    const f = await Wiki.featured(new Date());
    const today = [];
    if (f.tfa) today.push(['À la une', Wiki.fromFeed(f.tfa)]);
    for (const a of ((f.mostread && f.mostread.articles) || []).slice(0, 14)) {
      const p = Wiki.fromFeed(a);
      if (p.thumb && Wiki.usable({ ...p, length: 99999 }, {})) today.push([`${(a.views || 0).toLocaleString('fr-FR')} lectures`, p]);
    }
    $('#explore-today').innerHTML = today.length ? today.map(([k, p]) => `
      <button class="tile" data-open="${esc(p.title)}">
        ${p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy">` : ''}
        <span class="t"><small>${esc(k)}</small><b>${esc(p.title)}</b></span>
      </button>`).join('') : '<p class="muted">Rien pour le moment.</p>';
    const otd = (f.onthisday || []).slice(0, 8);
    $('#explore-onthisday').innerHTML = otd.map(e => {
      const pg = (e.pages || [])[0];
      return pg ? `<button class="row" data-open="${esc(Wiki.fromFeed(pg).title)}"><span class="year">${e.year}</span><span class="tx"><small style="-webkit-line-clamp:3;color:var(--text-2)">${esc(e.text)}</small></span></button>` : '';
    }).join('') || '<p class="muted">Indisponible dans cette langue.</p>';
    wireImgs($('#view-explore'));
  }
  $('#view-explore').addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    if (b) openArticle(b.dataset.open);
  });

  // Recherche
  const sInput = $('#search-input');
  let sTimer;
  sInput.addEventListener('input', () => {
    clearTimeout(sTimer);
    const q = sInput.value.trim();
    $('#search-clear').hidden = !q;
    if (!q) { $('#search-results').hidden = true; $('#explore-home').hidden = false; return; }
    sTimer = setTimeout(() => runSearch(q), 220);
  });
  sInput.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(sTimer); runSearch(sInput.value.trim(), true); sInput.blur(); } });
  $('#search-clear').onclick = () => { sInput.value = ''; sInput.dispatchEvent(new Event('input')); sInput.focus(); };

  async function runSearch(q, full = false) {
    if (!q) return;
    const box = $('#search-results');
    box.hidden = false;
    $('#explore-home').hidden = true;
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const topics = Algo.allTopics().filter(t => norm(t.label).includes(norm(q))).slice(0, 4);
    let results = [];
    try {
      results = full ? (await Wiki.search(q, { limit: 15 })).pages.map(p => ({ title: p.title, desc: p.desc || p.extract.slice(0, 100), thumb: p.thumb }))
        : await Wiki.suggest(q);
    } catch {}
    if (sInput.value.trim() !== q) return;
    const exists = Algo.allTopics().some(t => norm(t.label) === norm(q));
    box.innerHTML = `
      <div class="list" style="margin-top:12px">
        ${topics.map(t => `<button class="row" data-topic="${t.id}"><span class="ph" style="background:hsla(${t.hue},70%,50%,.25);color:hsl(${t.hue},80%,65%)">${icon('compass')}</span><span class="tx"><b>${esc(t.label)}</b><small>Sujet · ouvrir le fil</small></span></button>`).join('')}
        ${results.map(r => `<button class="row" data-open="${esc(r.title)}">${r.thumb ? `<img src="${esc(r.thumb)}" alt="" loading="lazy">` : `<span class="ph">${icon('book')}</span>`}<span class="tx"><b>${esc(r.title)}</b><small>${esc(r.desc)}</small></span></button>`).join('')}
        ${!full ? `<button class="row" data-full="${esc(q)}"><span class="ph">${icon('search')}</span><span class="tx"><b>Tous les résultats pour « ${esc(q)} »</b><small>Recherche dans le texte des articles</small></span></button>` : ''}
        ${!exists ? `<button class="row" data-create="${esc(q)}"><span class="ph">${icon('plus')}</span><span class="tx"><b>Créer le sujet « ${esc(q)} »</b><small>L'ajouter à ton fil Pour toi, comme un thème</small></span></button>` : ''}
      </div>`;
    wireImgs(box);
  }
  $('#search-results').addEventListener('click', e => {
    const t = e.target.closest('[data-topic]');
    if (t) return openTopic(t.dataset.topic);
    const f = e.target.closest('[data-full]');
    if (f) return runSearch(f.dataset.full, true);
    const c = e.target.closest('[data-create]');
    if (c) {
      const label = c.dataset.create.trim();
      const id = 'c_' + label.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      if (!S().custom.some(x => x.id === id)) S().custom.push({ id, label: label[0].toUpperCase() + label.slice(1), q: label, hue: hueOf(label) });
      toggleInterest(id, true);
      toast(`Sujet créé : ${label}`, 'spark');
      openTopic(id);
    }
  });

  // ---------- Bibliothèque ----------
  let libKey = 'saved';
  $('#lib-seg').onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    libKey = b.dataset.k;
    $$('#lib-seg button').forEach(x => x.classList.toggle('on', x === b));
    renderLibrary();
  };
  function renderLibrary() {
    const st = S();
    let items = [];
    if (libKey === 'saved') items = st.saved;
    if (libKey === 'history') items = st.history.slice(0, 200);
    if (libKey === 'liked') items = st.liked.slice(0, 300).map(t => st.saved.find(x => x.title === t) || st.history.find(x => x.title === t) || { title: t });
    const box = $('#lib-list');
    if (!items.length) {
      box.innerHTML = `<div class="empty">${icon(libKey === 'history' ? 'clock' : libKey === 'liked' ? 'heart' : 'bookmark')}<p>${libKey === 'saved' ? 'Touche « Garder » sur une carte pour la retrouver ici.' : libKey === 'liked' ? 'Les articles que tu aimes apparaîtront ici.' : 'Ton historique est vide.'}</p></div>`;
      return;
    }
    box.innerHTML = items.map(x => `
      <div class="row">
        ${x.thumb ? `<img src="${esc(x.thumb)}" alt="" loading="lazy">` : `<span class="ph">${icon('book')}</span>`}
        <button class="tx" ${x.url ? `data-ext="${esc(x.url)}"` : `data-read="${esc(x.title)}"`} style="text-align:left"><b>${esc(x.title)}</b><small>${esc(x.desc || '')}${libKey === 'history' && x.s !== undefined ? ` · signal <span class="${x.s > 0 ? 'pos' : x.s < 0 ? 'neg' : ''}">${x.s > 0 ? '+' : ''}${x.s}</span>` : ''}</small></button>
        ${x.url ? '' : `<button class="icon-btn small end" data-feed="${esc(x.title)}" aria-label="Voir dans le fil">${icon('home')}</button>`}
        ${libKey === 'saved' ? `<button class="icon-btn small end" data-del="${esc(x.title)}" aria-label="Retirer">${icon('trash')}</button>` : ''}
      </div>`).join('');
    wireImgs(box);
  }
  $('#lib-list').addEventListener('click', e => {
    const x = e.target.closest('[data-ext]');
    if (x) return openExternal(x.dataset.ext);
    const r = e.target.closest('[data-read]');
    if (r) return Reader.open(r.dataset.read);
    const f = e.target.closest('[data-feed]');
    if (f) return openArticle(f.dataset.feed);
    const d = e.target.closest('[data-del]');
    if (d) { S().saved = S().saved.filter(x => x.title !== d.dataset.del); Store.save(); renderLibrary(); }
  });

  // ---------- Réglages ----------
  const MIX_COLORS = { interets: '#ff7a50', similaires: '#ffb547', categories: '#b38cff', actu: '#4fc3f7', decouverte: '#4fd08a' };
  const LANGS = { fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch', it: 'Italiano', pt: 'Português' };

  function renderSettings() {
    const st = S();
    const set = st.settings;
    const mixTotal = Object.values(set.mix).reduce((a, b) => a + b, 0) || 1;
    const interests = Object.entries(st.interests).filter(([id]) => Algo.topic(id)).sort((a, b) => b[1] - a[1]);
    const cats = Object.entries(st.cats).sort((a, b) => b[1] - a[1]);
    const pos = cats.filter(([, w]) => w > 0).slice(0, 30);
    const neg = cats.filter(([, w]) => w < 0).sort((a, b) => a[1] - b[1]).slice(0, 12);
    const disc = Object.entries(st.discovered).filter(([id, s]) => Algo.topic(id) && s > 0).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const mins = Math.round(st.stats.seconds / 60);
    const notifOk = Native && Native.setChannels;
    const perm = notifOk && Native.notifPermission ? Native.notifPermission() : true;

    $('#settings').innerHTML = `
      <h1 class="title">Réglages</h1>
      <div class="panel prof">
        <div class="prof-row">
          <span class="avatar">${icon('user')}</span>
          <div class="prof-tx"><b>${Account.user ? esc(Account.user) : Account.expired ? esc(Account.expired) : 'Profil sur cet appareil'}</b><span class="muted small" id="sync-state">${Account.user ? esc(Account.status()) : Account.expired ? 'Session expirée : ta progression est gardée ici, reconnecte-toi pour synchroniser' : 'Crée un profil pour le retrouver sur tous tes appareils'}</span></div>
          ${Account.user ? `<button class="icon-btn" data-acc="sync" aria-label="Synchroniser">${icon('refresh')}</button>` : Account.expired ? `<button class="btn primary" data-acc="login">Me reconnecter</button>` : `<button class="btn primary" data-acc="register">Créer</button>`}
        </div>
        <div class="mini-stats">
          <span><b>${st.stats.cards}</b> articles</span>
          <span><b>${mins}</b> min de lecture</span>
          <span>${icon('flame')}<b>${Algo.streak()}</b> j</span>
        </div>
        ${Account.user ? `<div class="btns acc-btns">
            <button class="btn" data-acc="backups">${icon('clock')} Sauvegardes</button>
            <button class="btn" data-acc="password">${icon('key')} Mot de passe</button>
            ${Account.admin ? `<button class="btn" data-acc="admin">${icon('user')} Administration</button>` : ''}
            <button class="btn" data-acc="logout">Se déconnecter</button>
            <button class="btn danger" data-acc="delete">${icon('trash')} Supprimer le profil</button>
          </div>` : Account.expired ? '' : `<button class="linkish" data-acc="login">J'ai déjà un compte</button>`}
      </div>

      ${!Native ? `
      <div class="apk-banner">
        <svg class="logo"><use href="#i-logo"/></svg>
        <div class="tx"><b>Curio pour Android</b>Notification du sujet du jour, widget d'écran d'accueil, plein écran. Gratuit.</div>
        <a class="btn primary" href="${APK_URL}" download>${icon('download')} APK</a>
      </div>` : ''}


      <a class="kalima-banner" href="${KALIMA_URL}" data-ext>
        <span class="k-logo">ك</span>
        <span class="tx"><b>Apprendre une langue ?</b>Les langues ont maintenant leur propre app : <b>Kalima</b> (anglais, arabe). Même compte, même mot de passe.</span>
        ${icon('back')}
      </a>

      <div class="panel">
        <h2>${icon('bell')} Notifications</h2>
        ${!notifOk ? `<p class="sub">Les notifications sont envoyées par l'app Android, même fermée. Tes réglages ci-dessous sont gardés dans ton profil et appliqués par l'app${Account.user ? '' : ' (crée un profil pour les retrouver dans l\'app)'}.</p><a class="btn" href="${APK_URL}" download style="margin-bottom:8px">${icon('download')} Télécharger l'APK</a>` : ''}
        ${true ? `
          ${notifOk && !perm ? `<div class="perm-warn">${icon('info')}<span>Android bloque les notifications de Curio.</span><button class="btn primary" data-perm>Autoriser</button></div>` : ''}
          ${notifPanel()}
          <p class="sub" style="margin-top:6px">Widget « Curio · Sujet du jour » : appui long sur l'écran d'accueil › Widgets › Curio. Il se redimensionne de 1×1 au plein écran (titre seul, bandeau, colonne, carte, grande carte avec l'image).</p>
        ` : ''}
      </div>


      <div class="panel">
        <h2>${icon('layers')} Mes catégories</h2>
        <p class="sub">Les grands domaines qui t'intéressent. L'algo trouve tout seul, à l'intérieur, ce qui te passionne vraiment.</p>
        <div class="cat-grid small" id="set-cats"></div>
      </div>


      <div class="panel">
        <h2>${icon('compass')} Contenus</h2>
        <div class="switch"><span>Ma zone<div class="help">France : surtout du local, avec du mondial de temps en temps.</div></span><select data-region><option value="fr" ${st.settings.region === 'fr' ? 'selected' : ''}>France</option><option value="monde" ${st.settings.region === 'monde' ? 'selected' : ''}>Monde</option></select></div>
        ${st.settings.region === 'fr' ? `<div class="field">
          <div class="lab">Part de contenu local <span>${st.settings.localShare} %</span></div>
          <input type="range" min="10" max="95" step="5" value="${st.settings.localShare}" data-set="localShare">
          <div class="help">Le reste est mondial. Les cartes « Découverte » restent toujours mondiales.</div>
        </div>` : ''}
        ${st.settings.region === 'fr' ? `
        <div class="switch"><span>Ma région<div class="help">Pour l'actualité locale (France 3 Régions, presse régionale).</div></span>
          <select data-area><option value="">Aucune</option>${REGIONS.map(([k, v]) => `<option value="${k}" ${st.settings.area === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
        <div class="btns"><button class="btn" data-locate>${icon('pin')} Me localiser</button></div>` : ''}
        <div class="switch"><span>Langue des articles</span><select data-lang>${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${st.lang === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      </div>


      <details class="panel fold">
        <summary><h2>${icon('sliders')} Algorithme <span class="muted small">avancé</span></h2></summary>
        <h3 class="fold-h">Sous-sujets appris</h3>
        <p class="sub">Le poids monte quand tu passes du temps sur un sujet, et baisse quand tu le zappes. Tu peux aussi l'ajuster à la main.</p>
        ${interests.length ? interests.map(([id, w]) => {
          const t = Algo.topic(id);
          return `<div class="wrow">
            <span class="name">${esc(t.label)}</span>
            <span class="bar"><i style="width:${w * 10}%;background:hsl(${t.hue},80%,60%)"></i></span>
            <span class="val">${w.toFixed(1)}</span>
            <button class="icon-btn" data-w="${id}" data-d="-1" aria-label="Moins">${icon('minus')}</button>
            <button class="icon-btn" data-w="${id}" data-d="1" aria-label="Plus">${icon('plus')}</button>
            <button class="icon-btn" data-rm="${id}" aria-label="Retirer">${icon('close')}</button>
          </div>`;
        }).join('') : '<p class="muted">Aucun sujet suivi : le fil est en mode découverte totale.</p>'}
        <div class="btns" style="margin-top:12px"><button class="btn" data-go="explore">${icon('plus')} Ajouter des sujets</button></div>
        ${disc.length ? `<p class="sub" style="margin:16px 0 6px">En cours de découverte (ajouté automatiquement à partir de 2.0) :</p><div class="chips">${disc.map(([id, s]) => `<span class="cchip">${esc(Algo.topic(id).label)} · ${s.toFixed(1)}</span>`).join('')}</div>` : ''}
      
        <h3 class="fold-h">Mélange et apprentissage</h3>
        <p class="sub">Chaque carte du fil « Pour toi » est tirée d'une de ces sources. Règle le mélange comme tu veux.</p>
        <div class="mixbar">${Object.entries(set.mix).map(([k, v]) => `<i style="flex:${v};background:${MIX_COLORS[k]}"></i>`).join('')}</div>
        ${Object.entries(Algo.SOURCES).map(([k, s]) => `
          <div class="field">
            <div class="lab"><div><i style="background:${MIX_COLORS[k]}"></i>${s.label}</div><span>${Math.round(set.mix[k] / mixTotal * 100)} %</span></div>
            <input type="range" min="0" max="100" step="1" value="${set.mix[k]}" data-mix="${k}">
            <div class="help">${s.help}</div>
          </div>`).join('')}
        <div class="field">
          <div class="lab">Exploration <span>${set.temperature < 0.7 ? 'Ciblée' : set.temperature > 1.4 ? 'Très variée' : 'Équilibrée'} (${set.temperature.toFixed(1)})</span></div>
          <input type="range" min="0.3" max="2" step="0.1" value="${set.temperature}" data-set="temperature">
          <div class="help">Basse : l'algo reste sur tes sujets favoris. Haute : il pioche plus au hasard parmi tous tes sujets.</div>
        </div>
        <div class="field">
          <div class="lab">Vitesse d'apprentissage <span>× ${set.learnRate.toFixed(2)}</span></div>
          <input type="range" min="0.25" max="2" step="0.25" value="${set.learnRate}" data-set="learnRate">
          <div class="help">À quel point chaque carte modifie tes poids.</div>
        </div>
        <div class="field">
          <div class="lab">Surprise garantie
            <select data-set="surpriseEvery">${[[0, 'Jamais'], [5, 'Toutes les 5 cartes'], [8, 'Toutes les 8 cartes'], [12, 'Toutes les 12 cartes'], [20, 'Toutes les 20 cartes']].map(([v, l]) => `<option value="${v}" ${set.surpriseEvery == v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          </div>
          <div class="help">Force un sujet qui n'a rien à voir, en plus de la part « Découverte ».</div>
        </div>
        <div class="field">
          <div class="lab">Profondeur des articles
            <select data-set="minLength">${[[0, 'Tous'], [3000, 'Courts acceptés'], [6000, 'Moyens et longs'], [15000, 'Approfondis seulement']].map(([v, l]) => `<option value="${v}" ${set.minLength == v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          </div>
        </div>
        <label class="switch"><span>Uniquement des articles illustrés</span><input type="checkbox" data-set="imagesOnly" ${set.imagesOnly ? 'checked' : ''}></label>

        <h2 style="margin-top:18px">Ce que l'algo a appris</h2>
        <p class="sub">Catégories repérées dans tes lectures. Touche la croix pour en oublier une.</p>
        ${pos.length ? `<div class="chips">${pos.map(([c, w]) => `<span class="cchip">${esc(c)} <b class="pos">${w.toFixed(1)}</b><button data-lcat="${esc(c)}" aria-label="Oublier">${icon('close')}</button></span>`).join('')}</div>` : '<p class="muted small">Rien encore : scrolle un peu.</p>'}
        ${neg.length ? `<p class="sub" style="margin:14px 0 6px">À éviter :</p><div class="chips">${neg.map(([c, w]) => `<span class="cchip neg">${esc(c)} <b>${w.toFixed(1)}</b><button data-lcat="${esc(c)}" aria-label="Oublier">${icon('close')}</button></span>`).join('')}</div>` : ''}

        <h2 style="margin-top:18px">Comment une carte est notée</h2>
        <table class="signals">
          <tr><td>Zappée en moins de 1,6 s</td><td class="neg">-0.7</td></tr>
          <tr><td>Regardée 10 à 25 s / plus de 25 s</td><td class="pos">+0.8 / +1.2</td></tr>
          <tr><td>Chaque diapositive lue</td><td class="pos">+0.3</td></tr>
          <tr><td>J'aime</td><td class="pos">+2</td></tr>
          <tr><td>Garder</td><td class="pos">+2.5</td></tr>
          <tr><td>Lire l'article complet</td><td class="pos">+1.5 à +3.5</td></tr>
          <tr><td>Partager / ouvrir un article lié</td><td class="pos">+1.5 / +1</td></tr>
          <tr><td>Pas intéressé</td><td class="neg">-4</td></tr>
        </table>
        <p class="sub" style="margin-top:10px">Le signal ajuste le poids du sujet (× 0.3) et de chaque catégorie de l'article (× 0.25). Les catégories s'estompent de 3 % par jour.</p>
        <div class="btns"><button class="btn danger" data-reset-algo>${icon('refresh')} Réinitialiser l'apprentissage</button></div>
      
      </details>

      <details class="panel fold">
        <summary><h2>${icon('layers')} Compte et données</h2></summary>
        <p class="sub">Exporte ton profil dans un fichier, ou repars de zéro.</p>
        <div class="btns">
          <button class="btn" data-export>${icon('download')} Exporter</button>
          <label class="btn">${icon('plus')} Importer<input type="file" accept="application/json" data-import hidden></label>
          <button class="btn" data-clear-history>${icon('clock')} Effacer l'historique</button>
          <button class="btn danger" data-reset-all>${icon('trash')} Tout effacer</button>
        </div>
      
      </details>

      <details class="panel fold credits">
        <summary><h2>${icon('info')} Crédits & sources</h2></summary>
        <p class="sub" style="margin-top:12px">Curio ne fabrique aucun contenu : tout vient de bases de connaissances libres et ouvertes, citées ici.</p>
        <ul>
          <li><b>Wikipédia</b> : textes des articles, sous licence <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" data-ext>CC BY-SA 4.0</a>. Auteurs : les contributeurs de chaque article (bouton « Source »).</li>
          <li><b>Wikimedia Commons</b> : photos et illustrations, licences libres variées, précisées sur la page de chaque fichier.</li>
          <li><b>iNaturalist</b> : espèces observées récemment près de chez toi (observations citoyennes, données ouvertes).</li>
          <li><b>NASA · Astronomy Picture of the Day</b> : image astronomique du jour, généralement domaine public (crédit indiqué sur chaque image).</li>
          <li><b>API Wikimedia</b> : articles les plus lus du jour, éphémérides, classement thématique.</li>
          <li><b>Presse</b> : titres et chapeaux publiés dans les flux RSS publics de Le Monde, franceinfo, BFMTV, 20 Minutes, Le Figaro, Libération, Le Parisien, HuffPost, France 24, RFI, Futura, Sciences et Avenir, Numerama, France 3 Régions, Ouest-France, La Dépêche et Sud Ouest. Les articles restent la propriété de leurs éditeurs : le bouton « Lire l'article » ouvre leur site.</li>
          <li><b>Wikiquote, Wikivoyage, Wikidata</b> : citations, destinations, œuvres d'art (licences libres, CC0 pour Wikidata).</li>
        </ul>
        <h3 class="fold-h">Espace Langues : d'où viennent les informations</h3>
        <ul>
          <li><b>Définitions, traductions, exemples, prononciation (API), enregistrements audio</b> : Wiktionnaire francophone, extrait par kaikki.org (CC BY-SA). Pour l'arabe, voyelles et translittération : Wiktionnaire anglophone (CC BY-SA).</li>
          <li><b>Choix des mots selon ton niveau</b> : fréquence d'usage des mots, FrequencyWords d'Hermit Dave (sous-titres OpenSubtitles, CC BY-SA 4.0).</li>
          <li><b>Phrases réelles</b> (phrases à trous, à remettre dans l'ordre, à traduire) : Tatoeba (CC BY 2.0 FR).</li>
          <li><b>Textes des cours de lecture</b> : Simple English Wikipedia et Wikipédia (CC BY-SA). <b>Illustrations des mots</b> : images des articles Wikipédia.</li>
          <li><b>Fiches de grammaire anglaise, alphabet et phrases essentielles arabes</b> : rédigés pour Curio.</li>
          <li><b>Traduction automatique</b> d'un texte entier : MyMemory. <b>Voix de secours</b> quand le téléphone n'en a pas : synthèse vocale Google, via le serveur de Curio.</li>
          <li><b>Correction des traductions</b> : comparaison avec la traduction de référence (mots compris, ordre et forme des mots). C'est une aide, pas un correcteur humain.</li>
          <li><b>API Adresse (data.gouv.fr)</b> : trouver ta région quand tu choisis « Me localiser ». Ta position n'est jamais enregistrée.</li>
        </ul>
        <p class="sub">Curio n'est affilié à aucune de ces organisations. Aucune publicité, aucun traceur. Ton profil reste sur ton appareil, et sur le serveur de Curio seulement si tu crées un compte.</p>
      </details>
      <p class="muted small" style="text-align:center;line-height:1.6;margin-top:18px">Curio ${VERSION}${Native && Native.version ? ' · app ' + esc(Native.version()) : ''} · 100 % gratuit</p>`;
    renderSettingsExtras();
  }

  // Panneau de notifications compact : un réglage commun, puis une ligne par type.
  function notifPanel() {
    const plan = notifSettings();
    const ch = S().settings.channels;
    const list = channelList();
    const times = plannedTimes();
    const day = Object.entries(times).flatMap(([id, ts]) => ts.map(t => [t, id])).sort();
    const name = () => 'Sujet';
    return `
      <div class="seg small-seg"><button data-np="spread" class="${plan.mode === 'spread' ? 'on' : ''}">Réparties dans la journée</button><button data-np="fixed" class="${plan.mode === 'fixed' ? 'on' : ''}">Heures fixes</button></div>
      ${plan.mode === 'spread' ? `<div class="switch"><span>Entre</span><span class="range-t"><input type="time" value="${plan.from}" data-np-from> et <input type="time" value="${plan.to}" data-np-to></span></div>` : ''}
      <div class="nlist">${list.map(([id, meta]) => {
        const c = ch[id];
        return `<div class="nrow" data-chan="${id}">
          <label class="ncheck"><input type="checkbox" data-ch="enabled" ${c.enabled ? 'checked' : ''}><span>${icon('news')}<b>${esc(meta.label)}</b></span></label>
          ${!c.enabled ? '' : plan.mode === 'spread'
            ? `<span class="stepper"><button data-ch="dec" aria-label="Moins">${icon('minus')}</button><b>${c.count || 1}</b><button data-ch="inc" aria-label="Plus">${icon('plus')}</button><small>/ jour</small></span>`
            : `<span class="times">${c.times.map((t, k) => `<span class="time-chip"><input type="time" value="${t}" data-ch="time" data-k="${k}">${c.times.length > 1 ? `<button data-ch="deltime" data-k="${k}" aria-label="Retirer">${icon('close')}</button>` : ''}</span>`).join('')}${c.times.length < 6 ? `<button class="icon-btn small" data-ch="addtime" aria-label="Ajouter une heure">${icon('plus')}</button>` : ''}</span>`}
          ${c.enabled && Native && Native.runChannel ? `<button class="icon-btn small" data-ch="test" aria-label="Tester">${icon('bell')}</button>` : ''}
        </div>`;
      }).join('')}</div>
      ${day.length ? `<p class="muted small nplan">${icon('clock')} Aujourd'hui : ${day.map(([t, id]) => `<b>${t.replace(':', ' h ')}</b> ${esc(name(id))}`).join(' · ')}</p>` : ''}`;
  }
  function channelChange(t) {
    const plan = notifSettings();
    if (t.dataset.np) { plan.mode = t.dataset.np; Store.save(); nativeSync(true); renderSettings(); return true; }
    if (t.hasAttribute && (t.hasAttribute('data-np-from') || t.hasAttribute('data-np-to'))) {
      plan[t.hasAttribute('data-np-from') ? 'from' : 'to'] = t.value || plan.from;
      Store.save(); nativeSync(true); renderSettings(); return true;
    }
    const box = t.closest('[data-chan]');
    if (!box) return false;
    const c = S().settings.channels[box.dataset.chan];
    const k = t.dataset.ch;
    if (k === 'enabled') { c.enabled = t.checked; if (t.checked && Native && Native.notifPermission && !Native.notifPermission()) Native.requestNotifPermission(); }
    else if (k === 'inc') c.count = Math.min(6, (c.count || 1) + 1);
    else if (k === 'dec') c.count = Math.max(1, (c.count || 1) - 1);
    else if (k === 'time') c.times[+t.dataset.k] = t.value || '09:00';
    else if (k === 'addtime') c.times.push(c.times.length ? '18:00' : '09:00');
    else if (k === 'deltime') c.times.splice(+t.dataset.k, 1);
    else if (k === 'test') {
      if (!Native) return true;
      if (Native.notifPermission && !Native.notifPermission()) { Native.requestNotifPermission(); return true; }
      nativeSync(true);
      setTimeout(() => Native.runChannel(box.dataset.chan), 400);
      toast('Notification envoyée dans quelques secondes', 'bell');
      return true;
    } else return false;
    c.times = [...new Set(c.times)].sort();
    Store.save();
    nativeSync(true);
    renderSettings();
    return true;
  }

  function renderSettingsExtras() {
    const box = $('#set-cats');
    if (!box) return;
    categoryGrid(box, { selectable: true, selected: S().categories });
    box.addEventListener('change', e => { Algo.setCategories(e.detail); resetFeeds(); });
  }
  const sroot = $('#settings');
  sroot.addEventListener('input', e => {
    const t = e.target;
    const set = S().settings;
    if (t.dataset.mix) { set.mix[t.dataset.mix] = +t.value; Store.save(); patchMix(); }
    if (t.dataset.set === 'localShare') { set.localShare = +t.value; Store.save(); t.parentElement.querySelector('.lab span').textContent = t.value + ' %'; }
    if (t.dataset.set === 'temperature' || t.dataset.set === 'learnRate') {
      set[t.dataset.set] = +t.value;
      Store.save();
      const span = t.parentElement.querySelector('.lab span');
      span.textContent = t.dataset.set === 'learnRate' ? `× ${(+t.value).toFixed(2)}` : `${+t.value < 0.7 ? 'Ciblée' : +t.value > 1.4 ? 'Très variée' : 'Équilibrée'} (${(+t.value).toFixed(1)})`;
    }
  });
  function patchMix() {
    const mix = S().settings.mix;
    const total = Object.values(mix).reduce((a, b) => a + b, 0) || 1;
    $$('.mixbar i', sroot).forEach((i, k) => (i.style.flex = Object.values(mix)[k]));
    $$('[data-mix]', sroot).forEach(r => (r.closest('.field').querySelector('.lab span').textContent = Math.round(mix[r.dataset.mix] / total * 100) + ' %'));
  }
  sroot.addEventListener('change', e => {
    const t = e.target;
    const st = S();
    if (t.dataset.set === 'surpriseEvery' || t.dataset.set === 'minLength') { st.settings[t.dataset.set] = +t.value; Store.save(); resetFeeds(); }
    if (t.dataset.set === 'imagesOnly') { st.settings.imagesOnly = t.checked; Store.save(); resetFeeds(); }
    if ((t.dataset.ch || t.hasAttribute('data-np-from') || t.hasAttribute('data-np-to')) && channelChange(t)) return;
    if (t.dataset.area !== undefined) { st.settings.area = t.value; Store.save(); resetFeeds(); toast(t.value ? 'Actualité locale activée' : 'Actualité locale désactivée', 'pin'); }
    if (t.dataset.region !== undefined) {
      st.settings.region = t.value;
      Store.save();
      exploreLoaded = false;
      resetFeeds();
      renderSettings();
      toast(t.value === 'fr' ? 'Contenus centrés sur la France' : 'Contenus du monde entier', 'compass');
    }
    if (t.dataset.lang !== undefined) {
      st.lang = t.value;
      Wiki.lang = t.value;
      Store.save();
      exploreLoaded = false;
      resetFeeds();
      toast(`Articles en ${LANGS[t.value]}`, 'book');
    }
    if (t.dataset.import !== undefined && t.files[0]) {
      t.files[0].text().then(txt => {
        try { Store.replace(JSON.parse(txt)); Wiki.lang = S().lang; resetFeeds(); renderSettings(); toast('Profil importé'); }
        catch { toast('Fichier invalide', 'info'); }
      });
    }
  });
  sroot.addEventListener('click', e => {
    const st = S();
    const ext = e.target.closest('a[data-ext]');
    if (ext) { e.preventDefault(); return openExternal(ext.href); }
    const acc = e.target.closest('[data-acc]');
    if (acc) return accountAction(acc.dataset.acc);
    if (e.target.closest('[data-locate]')) return locate().then(() => { renderSettings(); resetFeeds(); });
    const b = e.target.closest('button, [data-go]');
    if (!b) return;
    if (b.dataset.w) { st.interests[b.dataset.w] = Algo.clamp(st.interests[b.dataset.w] + +b.dataset.d, 0.1, 10); Store.save(); renderSettings(); }
    else if (b.dataset.rm) { delete st.interests[b.dataset.rm]; Store.save(); renderSettings(); }
    else if (b.dataset.lcat) { delete st.cats[b.dataset.lcat]; Store.save(); b.closest('.cchip').remove(); }
    else if (b.dataset.go) { showView(b.dataset.go, false); }
    else if ((b.dataset.ch || b.dataset.np) && b.tagName === 'BUTTON') { channelChange(b); }
    else if (b.hasAttribute('data-perm')) { Native.requestNotifPermission(); }
    else if (b.hasAttribute('data-export')) {
      const name = `curio-profil-${Algo.today()}.json`;
      if (Native && Native.saveFile) { Native.saveFile(name, 'application/json', JSON.stringify(st)); return; }
      const blob = new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
    else if (b.hasAttribute('data-clear-history')) {
      if (!confirm('Effacer l\'historique ? Les articles déjà vus pourront réapparaître.')) return;
      st.history = []; st.seen = {}; Store.save(); toast('Historique effacé', 'clock');
    }
    else if (b.hasAttribute('data-reset-algo')) {
      if (!confirm('Réinitialiser ce que l\'algo a appris ? Tes sujets sont conservés.')) return;
      st.cats = {}; st.seeds = []; st.discovered = {}; st.cursors = {};
      for (const k in st.interests) st.interests[k] = 3;
      Store.save(); renderSettings(); resetFeeds(); toast('Apprentissage réinitialisé', 'refresh');
    }
    else if (b.hasAttribute('data-reset-all')) {
      if (!confirm('Tout effacer (sujets, bibliothèque, historique, réglages) ?')) return;
      Store.reset(); location.reload();
    }
  });

  function resetFeeds() {
    for (const k of Object.keys(feeds)) { feeds[k].destroy(); delete feeds[k]; }
    $('#tab-topic').hidden = true;
    mode = null;
    setMode('pourtoi');
    if (view !== 'feed') feeds.pourtoi.show(false);
  }

  // ---------- Événements généraux ----------
  $('#tabbar').onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.view === 'feed' && view === 'feed') {
      // Re-toucher « Fil » remonte au prochain article non vu.
      const f = feeds[mode];
      if (f) f.step(1);
      return;
    }
    if (b.dataset.view === 'feed') {
      // Retour au fil : on ferme les calques de vue, en gardant un éventuel fil de sujet.
      while (overlays.length && view !== 'feed') popOverlay();
      if (view !== 'feed') showView('feed', false);
    } else if (view !== 'feed') showView(b.dataset.view, false);
    else showView(b.dataset.view);
  };
  $('#feed-tabs').onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.mode === 'topic') return;
    if (mode === 'topic') popOverlay();
    setMode(b.dataset.mode);
  };
  $('#btn-topic-back').onclick = popOverlay;
  $('#nav-up').onclick = () => feeds[mode] && feeds[mode].step(-1);
  $('#nav-down').onclick = () => feeds[mode] && feeds[mode].step(1);
  $('#btn-search').onclick = () => { showView('explore'); setTimeout(() => sInput.focus(), 50); };

  const keepWarm = () => { if (feeds.pourtoi) feeds.pourtoi.keepWarm(); };
  window.addEventListener('pagehide', keepWarm);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) keepWarm();
    const f = feeds[mode];
    if (!f || view !== 'feed') return;
    if (document.hidden) f.leave();
    else if (f.cards[f.active]) f.enter(f.cards[f.active]);
  });

  document.addEventListener('keydown', e => {
    if (view !== 'feed' || e.target.matches('input, select, textarea') || !$('#reader').hidden) return;
    const f = feeds[mode];
    if (!f) return;
    const cs = f.cards[f.active];
    if (e.key === 'ArrowDown' || e.key === 'j' || e.key === ' ') { e.preventDefault(); f.step(1); }
    if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); f.step(-1); }
    if (cs && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); f.go(cs, e.key === 'ArrowRight' ? 1 : -1); }
    if (cs && e.key === 'l') f.like(cs);
  });

  // ---------- Compte et sauvegarde du profil sur le serveur ----------
  // Comme Carnet : chaque appareil garde sa copie, et les copies sont FUSIONNÉES (js/sync.js) au lieu de s'écraser.
  // Temps réel : l'app garde une requête en attente sur le serveur (account.php?a=wait), qui répond dès qu'un autre
  // appareil a sauvegardé ; la nouvelle version est alors récupérée et fusionnée. En plus : au démarrage, au retour
  // dans l'app et toutes les 45 s (filet de sécurité).
  const lightSeen = st => Object.fromEntries(Object.entries(st.seen || {}).sort((a, b) => b[1] - a[1]).slice(0, 2500));
  const Account = {
    user: Store.user || null,
    lastPush: 0,
    synced: 0,        // version du serveur déjà intégrée
    pushing: false,
    err: '',
    // Jeton de connexion gardé aussi sur l'appareil et envoyé en en-tête : la WebView Android perd parfois ses cookies.
    get tok() { try { return localStorage.getItem('curio.tok') || ''; } catch { return ''; } },
    set tok(v) { try { if (v) localStorage.setItem('curio.tok', v); else localStorage.removeItem('curio.tok'); } catch {} },
    expired: '',      // compte dont la session a expiré : son profil reste affiché, on demande juste de se reconnecter
    rev: '',          // révision du profil sur le serveur (change à chaque sauvegarde, d'ici ou d'ailleurs)
    admin: false,
    waiting: false,
    async call(a, body = {}) {
      const headers = { 'Content-Type': 'application/json' };
      if (this.tok) headers['X-Curio-Token'] = this.tok;
      const r = await fetch(`api/account.php?a=${a}`, { method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(body) });
      let d = {};
      try { d = await r.json(); } catch {}
      if (!r.ok) throw Object.assign(new Error(d.error || 'Serveur injoignable'), { status: r.status, needCode: !!d.needCode });
      if (d.tok) this.tok = d.tok;
      return d;
    },
    status() {
      if (this.err) return 'Synchronisation en attente : ' + this.err;
      return this.lastPush ? `Sauvegardé ${ago(this.lastPush / 1000)}` : 'Sauvegarde automatique activée';
    },
    // Au démarrage : bascule sur le profil du compte connecté, puis fusionne avec le serveur.
    async init() {
      let me;
      try { me = await this.call('me'); } catch { return false; } // hors ligne : on garde la copie de l'appareil
      if (!me.user) {
        // Session perdue : on GARDE le profil du compte sur l'appareil (jamais de bascule vers un profil vide),
        // il se synchronisera dès la reconnexion.
        if (Store.user) { this.user = null; this.expired = Store.user; setTimeout(() => toast(`Reconnecte-toi (${Store.user}) pour synchroniser : ta progression est gardée`, 'cloud'), 1500); }
        return false;
      }
      this.expired = '';
      this.rev = me.rev || '';
      this.admin = !!me.admin;
      if (me.mustChange) setTimeout(() => this.forceNewPassword(), 1200);
      setTimeout(() => this.waitLoop(), 500);
      // Copie du compte déjà sur l'appareil : on la reprend. Sinon (ancienne version, un seul profil), le profil actuel est celui du compte.
      if (Store.user !== me.user) Store.use(me.user, { adopt: !Store.user && !Store.has(me.user) });
      this.user = me.user;
      if (me.updated > this.synced || me.updated !== (S().updated || 0)) return await this.pull();
      return false;
    },
    // Récupère la version du serveur et la fusionne avec celle de l'appareil. Renvoie true si quelque chose a changé ici.
    async pull() {
      const d = await this.call('load');
      return this.absorb(d.profile, d.updated);
    },
    absorb(remote, updated) {
      const before = Sync.sig(S());
      if (!remote) { this.push(true); return false; }
      const local = JSON.parse(JSON.stringify(S()));
      const merged = Sync.merge(local, { ...remote, updated });
      const changedHere = Sync.sig(merged) !== before;
      const needPush = (S().updated || 0) > updated || Sync.sig(merged) !== Sync.sig(Sync.repair({ ...remote, updated }));
      this.synced = updated;
      if (needPush) merged.updated = Math.max(Date.now(), updated + 1);
      Store.replace(merged, { touch: false });
      Wiki.lang = S().lang;
      if (needPush) this.push(true);
      if (changedHere) window.dispatchEvent(new Event('profile-merged'));
      return changedHere;
    },
    // Envoi différé (quelques secondes après la dernière modification).
    push(now = false) {
      if (!this.user) return;
      clearTimeout(this.t);
      this.t = setTimeout(async () => {
        if (this.pushing) return this.push();
        this.pushing = true;
        try {
          for (let k = 0; k < 3; k++) {
            const st = S();
            const r = await this.call('save', { updated: st.updated, profile: { ...st, seen: lightSeen(st) } });
            if (!r.stale) { this.synced = r.updated; if (r.rev) this.rev = r.rev; break; }
            // Un autre appareil a sauvegardé entre-temps : fusion, puis nouvel envoi.
            const local = JSON.parse(JSON.stringify(S()));
            const merged = Sync.merge(local, { ...r.profile, updated: r.updated });
            merged.updated = Math.max(Date.now(), r.updated + 1);
            Store.replace(merged, { touch: false });
            window.dispatchEvent(new Event('profile-merged'));
          }
          this.lastPush = Date.now();
          this.err = '';
        } catch (e) {
          this.err = e.message;
          if (e.status === 401) { this.expired = this.user; this.user = null; }
        }
        this.pushing = false;
        const el = $('#sync-state');
        if (el) el.textContent = this.status();
      }, now ? 50 : 4000);
    },
    // Attente longue : le serveur répond dès qu'un autre appareil a sauvegardé.
    async waitLoop() {
      if (this.waiting || !this.user) return;
      this.waiting = true;
      while (this.user && !document.hidden) {
        try {
          const r = await this.call('wait', { rev: this.rev });
          if (r.rev && r.rev !== this.rev) { this.rev = r.rev; if (!this.pushing) await this.pull(); }
        } catch (e) {
          if (e.status === 401) break;
          await new Promise(res => setTimeout(res, 10000));
        }
      }
      this.waiting = false;
    },
    // Mot de passe provisoire donné par l'administrateur : on en demande un nouveau.
    async forceNewPassword() {
      const old = prompt('Ton mot de passe est provisoire. Entre-le pour en choisir un nouveau :');
      if (!old) return;
      const nw = prompt('Nouveau mot de passe (6 caractères minimum) :');
      if (!nw) return;
      try { await this.call('password', { old, new: nw }); toast('Mot de passe changé', 'key'); } catch (e) { toast(e.message, 'info'); }
    },
    // Retour dans l'app : une version plus récente attend-elle sur le serveur ?
    async check() {
      if (!this.user || this.pushing || document.hidden) return;
      try {
        const me = await this.call('me');
        if (me.user && me.updated > this.synced && me.updated !== S().updated) await this.pull();
      } catch {}
    },
  };
  Store.onSave(() => Account.push());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { Account.check(); Account.waitLoop(); } });
  setInterval(() => Account.check(), 45000);
  // Fermeture de la page : envoi immédiat de la dernière version du profil.
  window.addEventListener('pagehide', () => {
    if (!Account.user || !navigator.sendBeacon || (S().updated || 0) <= Account.synced) return;
    clearTimeout(Account.t);
    const st = S();
    navigator.sendBeacon('api/account.php?a=save', new Blob([JSON.stringify({ updated: st.updated, profile: { ...st, seen: lightSeen(st) } })], { type: 'application/json' }));
  });

  // ---------- Administration : comptes, inscription, codes d'invitation ----------
  function adminPanel() {
    modal(`<h3>Administration</h3><div class="adm"><p class="muted small">Chargement…</p></div><div class="btns"><button class="btn" data-x>Fermer</button></div>`, (card, close) => {
      $('[data-x]', card).onclick = close;
      const box = $('.adm', card);
      const when = t => (t ? new Date(t * 1000).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
      const load = async () => {
        let r;
        try { r = await Account.call('admin'); } catch (e) { box.innerHTML = `<p>${esc(e.message)}</p>`; return; }
        box.innerHTML = `
          <p class="sub"><b>${r.stats.accounts}</b> comptes · <b>${r.stats.active7}</b> actifs sur 7 jours · <b>${r.stats.active1}</b> aujourd'hui</p>
          <label class="switch"><span>Inscription libre (sinon : code d'invitation)</span><input type="checkbox" data-open ${r.openSignup ? 'checked' : ''}></label>
          <div class="btns"><button class="btn" data-code="single">Code à usage unique</button><button class="btn" data-code="open">Code ouvert</button></div>
          ${r.codes.map(c => `<div class="adm-row ${c.disabled ? 'off' : ''}"><span><b>${c.code.slice(0, 4)}-${c.code.slice(4)}</b><small>${c.type === 'open' ? 'ouvert' : 'usage unique'}${c.label ? ' · ' + esc(c.label) : ''} · ${c.uses.length} utilisation(s)</small></span>
            <button class="btn small" data-cup="${c.code}" data-dis="${c.disabled ? 0 : 1}">${c.disabled ? 'Réactiver' : 'Désactiver'}</button><button class="btn small" data-cdel="${c.code}">Suppr.</button></div>`).join('')}
          <h4 style="margin:14px 0 6px">Comptes</h4>
          ${r.accounts.map(u => `<details class="adm-acc"><summary><b>${esc(u.user)}</b>${u.admin ? ' · admin' : ''}${u.disabled ? ' · <span style="color:var(--bad)">bloqué</span>' : ''}<small>vu ${when(u.lastSeen)} · ${u.devices} appareil(s)</small></summary>
            <p class="muted small">Créé ${when(u.created)} · inscription : ${esc(u.code || '?')} · profil ${Math.round(u.size / 1024)} Ko</p>
            ${u.user === Account.user ? '<p class="muted small">C\'est ton compte.</p>' : `<div class="btns">
              <button class="btn small" data-u="${esc(u.user)}" data-op="reset">Mot de passe provisoire</button>
              <button class="btn small" data-u="${esc(u.user)}" data-op="logout">Déconnecter</button>
              <button class="btn small" data-u="${esc(u.user)}" data-op="${u.admin ? 'demote' : 'promote'}">${u.admin ? 'Retirer admin' : 'Rendre admin'}</button>
              <button class="btn small" data-u="${esc(u.user)}" data-op="${u.disabled ? 'enable' : 'disable'}">${u.disabled ? 'Débloquer' : 'Bloquer'}</button>
              <button class="btn small danger" data-u="${esc(u.user)}" data-op="delete">Supprimer</button></div>`}</details>`).join('')}`;
        $('[data-open]', box).onchange = async e => { await Account.call('adminsettings', { openSignup: e.target.checked }).catch(x => toast(x.message, 'info')); };
      };
      box.addEventListener('click', async e => {
        const b = e.target.closest('button');
        if (!b) return;
        try {
          if (b.dataset.code) { const label = prompt('Note pour ce code (facultatif) :') ?? null; if (label === null) return; const r = await Account.call('codecreate', { type: b.dataset.code, label }); prompt('Code créé, à transmettre :', r.code.slice(0, 4) + '-' + r.code.slice(4)); }
          else if (b.dataset.cup) await Account.call('codeupdate', { code: b.dataset.cup, disabled: b.dataset.dis === '1' });
          else if (b.dataset.cdel) { if (!confirm('Supprimer ce code ?')) return; await Account.call('codeupdate', { code: b.dataset.cdel, delete: true }); }
          else if (b.dataset.op) {
            const who = b.dataset.u, op = b.dataset.op;
            const ask = { delete: `Supprimer le compte « ${who} » et son profil ?`, reset: `Donner un mot de passe provisoire à « ${who} » ?`, disable: `Bloquer « ${who} » ?` }[op];
            if (ask && !confirm(ask)) return;
            const r = await Account.call('adminuser', { user: who, op });
            if (r.password) prompt(`Mot de passe provisoire de ${who} (il devra le changer) :`, r.password);
          } else return;
          load();
        } catch (x) { toast(x.message, 'info'); }
      });
      load();
    });
  }

  // Formulaire de compte (création ou connexion), utilisé à l'accueil et dans les réglages.
  function accountForm(container, { mode = 'register', onDone, onSkip } = {}) {
    let needCode = false; // inscription fermée par l'administrateur : code d'invitation demandé
    Account.call('signup').then(r => { if (!r.open && !needCode) { needCode = true; if (mode === 'register') render(); } }).catch(() => {});
    const render = () => {
      container.innerHTML = `
        <form class="acc-form" autocomplete="on">
          <label>Pseudo<input name="user" autocomplete="username" required minlength="2" maxlength="32" autocapitalize="off" spellcheck="false"></label>
          <label>Mot de passe<input name="pass" type="password" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}" required minlength="6"></label>
          ${mode === 'register' && needCode ? '<label>Code d\'invitation<input name="code" autocapitalize="characters" required></label>' : ''}
          <p class="acc-err" hidden></p>
          <button class="btn primary big" type="submit">${mode === 'register' ? 'Créer mon profil' : 'Me connecter'}</button>
          <div class="acc-alt">
            <button type="button" class="linkish" data-switch>${mode === 'register' ? 'J\'ai déjà un compte' : 'Créer un nouveau profil'}</button>
            ${onSkip ? '<button type="button" class="linkish" data-skip>Continuer sans compte</button>' : ''}
          </div>
        </form>`;
      const f = $('form', container);
      f.onsubmit = async e => {
        e.preventDefault();
        const btn = $('button[type=submit]', f);
        const err = $('.acc-err', f);
        btn.disabled = true;
        err.hidden = true;
        try {
          const d = await Account.call(mode, { user: f.user.value, pass: f.pass.value, code: f.code ? f.code.value : '' });
          Account.user = d.user;
          let pulled = false;
          if (mode === 'login') {
            // Le profil sans compte de cet appareil a des progrès : on demande s'il faut les ajouter à ce compte
            // (sinon, quelqu'un d'autre qui se connecte sur ce téléphone récupérerait les progrès d'un autre).
            const g = !Store.user && !Store.has(d.user) && Store.guestProgress();
            const adopt = !!g && confirm(`Ajouter ce qui a été fait sur cet appareil sans compte (${g.reads} lectures, ${g.saved} articles gardés) au profil « ${d.user} » ?\n\nOK : fusionner · Annuler : les laisser hors compte`);
            Store.use(d.user, { adopt });
            Account.synced = 0;
            Account.expired = '';
            pulled = await Account.pull();
          } else { Store.use(d.user, { adopt: true }); Account.push(true); }
          onDone && onDone({ pulled });
        } catch (x) {
          if (x.needCode && !needCode) { needCode = true; const u = f.user.value, pw = f.pass.value; render(); const f2 = $('form', container); f2.user.value = u; f2.pass.value = pw; }
          const f3 = $('form', container), err3 = $('.acc-err', f3);
          err3.textContent = x.message;
          err3.hidden = false;
          $('button[type=submit]', f3).disabled = false;
        }
      };
      $('[data-switch]', f).onclick = () => { mode = mode === 'register' ? 'login' : 'register'; render(); };
      const sk = $('[data-skip]', f);
      if (sk) sk.onclick = onSkip;
    };
    render();
  }

  async function accountAction(a) {
    if (a === 'admin') return adminPanel();
    if (a === 'register' || a === 'login') {
      modal(`<h3>${a === 'register' ? 'Créer mon profil' : 'Connexion'}</h3><p>Ton profil est sauvegardé sur polocrafting.fr. Aucun e-mail demandé.</p><div id="acc-box"></div>`, (card, close) => {
        accountForm($('#acc-box', card), { mode: a, onDone: ({ pulled }) => { close(); toast(`Connecté : ${Account.user}`, 'cloud'); if (pulled) resetFeeds(); renderSettings(); } });
      });
    }
    if (a === 'sync') { Account.synced = 0; Account.pull().then(() => { toast('Synchronisé', 'cloud'); renderSettings(); }).catch(e => toast(e.message, 'info')); }
    if (a === 'password') {
      const old = prompt('Mot de passe actuel :');
      if (!old) return;
      const nw = prompt('Nouveau mot de passe (6 caractères minimum) :');
      if (!nw) return;
      try { await Account.call('password', { old, new: nw }); toast('Mot de passe changé', 'key'); } catch (e) { toast(e.message, 'info'); }
    }
    if (a === 'backups') {
      // Versions précédentes du profil gardées par le serveur : on peut en récupérer une (fusionnée avec l'actuelle, rien n'est perdu).
      let list = [];
      try { list = (await Account.call('backups')).backups; } catch (e) { return toast(e.message, 'info'); }
      modal(`<h3>Sauvegardes du profil</h3>
        <p class="sub">Le serveur garde une copie de ton profil toutes les 3 h (et avant toute perte de données). Récupérer une sauvegarde l'ajoute à ton profil actuel : rien n'est effacé.</p>
        <div class="list">${list.length ? list.map(b => `<button class="row" data-bk="${esc(b.id)}"><span class="tx"><b>${new Date(b.t * 1000).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</b><small>${b.saved} gardés · ${b.reads} lectures · ${b.topics} sujets${/perte/.test(b.id) ? ' · copie faite avant une perte' : ''}</small></span></button>`).join('') : '<p class="muted small">Pas encore de sauvegarde : la première est faite à la prochaine synchronisation.</p>'}</div>
        <div class="btns"><button class="btn" data-x>Fermer</button></div>`, (card, close) => {
        $('[data-x]', card).onclick = close;
        card.querySelectorAll('[data-bk]').forEach(b => (b.onclick = async () => {
          try {
            const d = await Account.call('backup', { id: b.dataset.bk });
            Account.absorb(d.profile, Math.max(d.updated, Account.synced));
            Account.push(true);
            close(); toast('Sauvegarde récupérée et ajoutée à ton profil', 'cloud'); renderSettings();
          } catch (e) { toast(e.message, 'info'); }
        }));
      });
    }
    if (a === 'logout') {
      if (!confirm('Se déconnecter ? Ton profil reste sauvegardé sur ton compte : tu le retrouveras en te reconnectant.')) return;
      Store.flush();
      await Account.call('logout').catch(() => {});
      Account.user = null;
      Account.tok = '';
      Store.use('');
      // Profil sans compte : pas besoin de repasser par l'accueil.
      if (!S().onboarded) { S().onboarded = true; Store.save(); Store.flush(); }
      location.reload();
    }
    if (a === 'delete') {
      const pass = prompt('Pour supprimer ton compte et sa sauvegarde, entre ton mot de passe :');
      if (!pass) return;
      try { await Account.call('delete', { pass }); Account.user = null; Store.use(''); renderSettings(); toast('Compte supprimé', 'trash'); }
      catch (e) { toast(e.message, 'info'); }
    }
  }

  async function locate() {
    toast('Recherche de ta position…', 'pin');
    try {
      const r = await Sources.detectRegion();
      S().settings.area = r.region;
      S().settings.city = r.city;
      Store.save();
      toast(`${r.city ? r.city + ', ' : ''}${(REGIONS.find(x => x[0] === r.region) || [, ''])[1]}`, 'pin');
      return r;
    } catch (e) { toast(e.message, 'info'); return null; }
  }

  // ---------- Accueil (première visite) ----------
  function onboarding(done) {
    const ob = $('#onboarding');
    const box = $('#ob-step');
    const go = $('#ob-go');
    const steps = ['welcome', 'swipe', 'cats', 'zone', 'notif', 'profile'];
    const inApp = !!(Native && Native.setChannels);
    let wantNotif = true;
    let step = 0;
    let cats = S().categories.slice();
    ob.hidden = false;

    const finish = () => {
      S().onboarded = true;
      Store.save();
      ob.hidden = true;
      done();
      if (!Native && /Android/i.test(navigator.userAgent)) setTimeout(() => modal(`
        <h3>Installer l'app Android ?</h3>
        <p>Avec l'app : un sujet du jour en notification, un widget sur l'écran d'accueil et le plein écran. Gratuit, sans pub.</p>
        <div class="btns"><a class="btn primary" href="${APK_URL}" download>${icon('download')} Télécharger l'APK</a><button class="btn" data-x>Plus tard</button></div>
      `, (c, close) => { $('[data-x]', c).onclick = close; }), 5000);
    };

    const render = () => {
      const k = steps[step];
      $('#ob-dots').innerHTML = steps.map((_, n) => `<i class="${n === step ? 'on' : n < step ? 'done' : ''}"></i>`).join('');
      go.hidden = false;
      go.disabled = false;
      box.className = 'ob-inner step-' + k;
      if (k === 'welcome') {
        // Accueil : le fil, montré plutôt qu'expliqué.
        box.innerHTML = `
          <div class="ob-top"><span class="ob-brand"><svg><use href="#i-logo"/></svg>Curio</span><button class="btn ob-signin" data-login>${icon('user')} Se connecter</button></div>
          <h1 class="ob-hero">Le monde,<br><span>une carte à la fois.</span></h1>
          <p class="ob-sub">Science, histoire, nature, actu : un vrai sujet résumé en quelques phrases à chaque glissement, choisi selon tes goûts. Gratuit, sans pub.</p>
          <div class="ob-feats">
            <span>${icon('spark')} Un algorithme qui apprend de toi</span><span>${icon('news')} L'actu, avec le contexte</span>
            <span>${icon('bookmark')} Ta bibliothèque</span><span>${icon('cloud')} Sur tous tes appareils</span>
          </div>
          <a class="kalima-banner" href="${KALIMA_URL}" data-ext>
            <span class="k-logo">ك</span>
            <span class="tx"><b>Tu cherches les langues ?</b>Elles ont maintenant leur propre app : Kalima. Même compte.</span>
            ${icon('back')}
          </a>`;
        go.textContent = 'Commencer';
        const kb = $('.kalima-banner', box);
        if (kb) kb.onclick = e => { e.preventDefault(); openExternal(kb.href); };
        $('[data-login]', box).onclick = () => modal(`<h3>Connexion</h3><p>Retrouve tes sujets, ton apprentissage et ta bibliothèque.</p><div id="acc-box"></div>`, (card, close) => {
          accountForm($('#acc-box', card), { mode: 'login', onDone: ({ pulled }) => {
            close();
            if (!pulled) Algo.setCategories(cats);
            S().onboarded = true;
            toast(`Content de te revoir, ${Account.user}`, 'cloud');
            finish();
          } });
        });
      }
      // Fil choisi : comment il marche (le système de glissements).
      if (k === 'swipe') {
        box.innerHTML = `
          <h2 class="ob-h">Le fil, en deux gestes</h2>
          <div class="how">
            <div><span class="ic">${icon('swipeup')}</span><p><b>Glisse vers le haut</b>Un nouveau sujet à chaque fois : science, histoire, nature, actu…</p></div>
            <div><span class="ic">${icon('swipeleft')}</span><p><b>Glisse sur le côté</b>Pour approfondir : l'essentiel, puis les points clés, en quelques phrases.</p></div>
            <div><span class="ic">${icon('spark')}</span><p><b>L'algo apprend de toi</b>Ce que tu lis, aimes ou zappes affine ton fil. Et de temps en temps, une surprise.</p></div>
            <div><span class="ic">${icon('news')}</span><p><b>L'actu, avec le contexte</b>Les titres de la presse, et de quoi comprendre ce qui se passe.</p></div>
          </div>`;
        go.textContent = 'Continuer';
      }
      if (k === 'cats') {
        box.innerHTML = `
          <h2 class="ob-h">Qu'est-ce qui t'attire ?</h2>
          <p class="lead">Choisis au moins 2 grands domaines. Pas besoin d'être précis : l'algo découvrira ce qui te passionne vraiment.</p>
          <div class="cat-grid" id="ob-cats"></div>`;
        categoryGrid($('#ob-cats'), { selectable: true, selected: cats });
        const upd = () => { go.disabled = cats.length < 2; go.textContent = cats.length < 2 ? `Encore ${2 - cats.length}` : 'Continuer'; };
        $('#ob-cats').addEventListener('change', e => { cats = e.detail; upd(); });
        upd();
      }
      if (k === 'zone') {
        const set = S().settings;
        box.innerHTML = `
          <h2 class="ob-h">Où es-tu ?</h2>
          <p class="lead">Pour te proposer du contenu proche de toi, et l'actualité de ta région. Le reste du monde s'invite quand même régulièrement.</p>
          <div class="zone">
            <button class="zchoice ${set.region === 'fr' ? 'on' : ''}" data-z="fr">${icon('pin')}<b>France</b><span>Surtout du local, du mondial de temps en temps</span></button>
            <button class="zchoice ${set.region === 'monde' ? 'on' : ''}" data-z="monde">${icon('globe')}<b>Monde</b><span>Aucune préférence géographique</span></button>
          </div>
          <div id="ob-area" ${set.region === 'fr' ? '' : 'hidden'}>
            <label class="field-lab">Ma région, pour l'actu locale (facultatif)</label>
            <div class="area-row">
              <select id="ob-area-sel"><option value="">Aucune</option>${REGIONS.map(([v, l]) => `<option value="${v}" ${set.area === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
              <button class="btn" id="ob-locate">${icon('pin')} Me localiser</button>
            </div>
          </div>`;
        box.querySelectorAll('[data-z]').forEach(b => (b.onclick = () => { set.region = b.dataset.z; Store.save(); render(); }));
        $('#ob-area-sel').onchange = e => { set.area = e.target.value; Store.save(); };
        $('#ob-locate').onclick = async () => { const r = await locate(); if (r) $('#ob-area-sel').value = r.region; };
        go.textContent = 'Continuer';
      }
      if (k === 'notif') {
        box.innerHTML = `
          <h2 class="ob-h">Un rappel par jour ?</h2>
          <p class="lead">Curio peut t'envoyer un sujet du jour. Tu choisis les heures (ou au hasard) et le nombre dans les réglages.</p>
          <div class="zone">
            <button class="zchoice ${wantNotif ? 'on' : ''}" data-n="1">${icon('bell')}<b>Oui</b><span>Sujet du jour à 9 h</span></button>
            <button class="zchoice ${!wantNotif ? 'on' : ''}" data-n="0">${icon('close')}<b>Non merci</b><span>Activable plus tard</span></button>
          </div>
          ${!inApp ? `<div class="apk-banner" style="margin-top:6px"><svg class="logo"><use href="#i-logo"/></svg><div class="tx"><b>Les notifications passent par l'app Android</b>Installe-la : elle reprend ton profil et envoie tes rappels, même appli fermée.</div><a class="btn primary" href="${APK_URL}" download>${icon('download')} APK</a></div>` : ''}`;
        box.querySelectorAll('[data-n]').forEach(b => (b.onclick = () => { wantNotif = b.dataset.n === '1'; render(); }));
        go.textContent = 'Continuer';
      }
      if (k === 'profile') {
        go.hidden = true;
        box.innerHTML = `
          <h2 class="ob-h">Crée ton profil</h2>
          <p class="lead">Ton profil garde tes goûts, ce que l'algo a appris et ta bibliothèque, sur tous tes appareils. Juste un pseudo et un mot de passe.</p>
          <div id="ob-acc"></div>`;
        accountForm($('#ob-acc'), {
          onDone: ({ pulled }) => { if (pulled) { S().onboarded = true; } else Algo.setCategories(cats); toast(`Bienvenue ${Account.user}`, 'cloud'); finish(); },
          onSkip: () => { Algo.setCategories(cats); finish(); },
        });
      }
      box.scrollTop = 0;
      ob.scrollTop = 0;
    };

    go.onclick = () => {
      if (steps[step] === 'cats') Algo.setCategories(cats);
      if (steps[step] === 'notif') {
        S().settings.notifAsked = true;
        channelList().forEach(([id]) => (S().settings.channels[id].enabled = wantNotif));
        Store.save();
        if (wantNotif && inApp && Native.requestNotifPermission) Native.requestNotifPermission();
        nativeSync(true);
      }
      if (step < steps.length - 1) { step++; render(); }
    };
    render();
  }

  async function start() {
    // App Android : sans l'autorisation, Android bloque toutes les notifications en silence. On la demande une fois.
    if (Native && Native.notifPermission && !Native.notifPermission() && !S().settings.permAsked) {
      S().settings.permAsked = true;
      Store.save();
      setTimeout(() => Native.requestNotifPermission(), 1500);
    }
    const params = new URLSearchParams(location.search);
    const a = params.get('a');
    if (a) history.replaceState(null, '', location.pathname);
    // Ancien lien de notification « mot du jour » : les langues sont dans Kalima.
    if (params.get('w') || params.get('l')) { history.replaceState(null, '', location.pathname); setTimeout(() => toast('Les langues ont maintenant leur app : Kalima (Réglages)', 'info', 5000), 1200); }
    setMode('pourtoi');
    if (a) {
      const f = feeds.pourtoi;
      Wiki.pages([a]).then(([p]) => {
        if (!p) return;
        f.engine.inject([{ ...p, source: 'recherche', topic: null, reason: 'Ton sujet du jour' }]);
        if (f.cards.length) f.insertNext([f.engine.injected.shift()].filter(Boolean));
      }).catch(() => {});
    }
    nativeSync();
  }

  window.UI = { $, $$, esc, icon, el, toast, modal, pushOverlay, popOverlay, wireImgs, openExternal, Account };
  window.addEventListener('learn-change', () => nativeSync(true));

  // Statistiques de visite (même compteur que les autres applis du site), uniquement en ligne.
  (function trackVisit() {
    if (!['polocrafting.fr', 'www.polocrafting.fr'].includes(location.hostname.toLowerCase())) return;
    let deviceId = null;
    try { deviceId = localStorage.getItem('app_device_id'); } catch {}
    if (!deviceId) {
      deviceId = 'dev-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now();
      try { localStorage.setItem('app_device_id', deviceId); } catch {}
    }
    // text/plain : requête CORS « simple », sans préflight ; le corps reste du JSON lu par track.php.
    fetch('https://polocrafting.fr/track.php', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ deviceId, page: Native ? 'Curio (app)' : 'Curio' }),
    }).catch(() => {});
  })();

  Wiki.lang = S().lang || 'fr';
  Algo.dailyDecay();
  // Profil serveur d'abord (si connecté), puis accueil ou fil.
  Account.init().then(pulled => {
    if (pulled) { Wiki.lang = S().lang || 'fr'; }
    if (S().onboarded) start(); else onboarding(start);
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
