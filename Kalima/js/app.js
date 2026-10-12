// Démarrage, onglets, écran de connexion, notifications et widget de l'app Android.
const App = (() => {
  let tab = 'home';
  const main = () => $('#main');
  const TABS = { home: Views.home, words: Views.words, progress: Views.progress, settings: Views.settings };

  function applyTheme() {
    // Clair par défaut ; sombre au choix, ou « auto » (suit le téléphone).
    const t = (Store.account && Store.settings().theme) || 'light';
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
  }

  let refreshT = null;
  function refresh() {
    clearTimeout(refreshT);
    refreshT = setTimeout(async () => {
      if (!Store.account) return;
      applyTheme();
      $$('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      const el = main();
      const y = el.scrollTop;
      await TABS[tab](el);
      el.scrollTop = y;
      banner();
    }, 30);
  }
  function go(t) { tab = t; main().scrollTop = 0; refresh(); }

  function banner() {
    const b = $('#banner');
    if (Store.account && Store.authLost) { b.innerHTML = `${icon('alert')}<span>Session expirée : tes progrès sont gardés ici.</span><button class="btn small" data-relog>Se reconnecter</button>`; b.hidden = false; }
    else b.hidden = true;
  }

  // ---------- Connexion ----------
  let signupOpen = true;
  // ---------- Accueil en étapes (avant connexion) ----------
  // Bienvenue → langues → niveau → comment ça marche → rythme → compte. Les choix sont gardés dans
  // « kalima.onboard » et appliqués au profil dès la création du compte (ou en mode sans compte).
  const OB_KEY = 'kalima.onboard';
  const obRead = () => { try { return JSON.parse(localStorage.getItem(OB_KEY)) || {}; } catch { return {}; } };
  const obSave = o => { try { localStorage.setItem(OB_KEY, JSON.stringify(o)); } catch {} };
  const STEPS = ['welcome', 'langs', 'level', 'how', 'pace', 'account'];
  function showWelcome(step = 'welcome') {
    document.body.classList.add('logged-out');
    document.documentElement.dataset.theme = 'light';
    const ob = { langs: [], levels: {}, pace: 12, audio: 'discret', ...obRead() };
    const k = STEPS.indexOf(step);
    const go = st => showWelcome(st);
    const dots = `<div class="ob-dots">${STEPS.map((x, n) => `<i class="${n === k ? 'on' : n < k ? 'done' : ''}"></i>`).join('')}</div>`;
    const back = k > 0 ? `<button class="icon-btn" data-ob-back aria-label="Retour">${icon('back')}</button>` : '<span></span>';
    const L = Content.LANGS;
    let body = '', foot = '';
    if (step === 'welcome') {
      body = `
        <div class="ob-brand"><img src="icons/icon-192.png" alt=""><span>Kalima</span></div>
        <h1 class="ob-hero">Apprends une langue,<br><em>un mot après l'autre.</em></h1>
        <p class="ob-lead">Quelques minutes par jour, des phrases simples à ton niveau, et la prononciation de chaque mot. Gratuit, sans publicité.</p>
        <div class="ob-flags">${Object.values(L).map(x => `<span>${x.flag}</span>`).join('')}</div>`;
      foot = `<div class="row"><button class="btn ghost big grow" data-goto="login">Connexion</button><button class="btn primary big grow" data-ob-next>Continuer</button></div>
        <button class="link muted small" data-local>Essayer sans compte</button>`;
    }
    if (step === 'langs') {
      body = `<h2 class="ob-h">Quelle langue veux-tu apprendre ?</h2><p class="ob-lead">Tu peux en choisir plusieurs, et en ajouter plus tard.</p>
        <div class="lang-pick">${Object.entries(L).map(([c, x]) => `<button class="lang-opt ${ob.langs.includes(c) ? 'on' : ''}" data-ob-lang="${c}">
          <span class="flag">${x.flag}</span><b>${x.name}${x.beta ? ' <span class="beta">bêta</span>' : ''}</b><small ${x.rtl ? 'dir="rtl"' : ''}>${x.native}</small>${icon('check', 'tick')}</button>`).join('')}</div>
        <p class="muted small">Anglais et arabe : contenus écrits et relus à la main. Bêta : vocabulaire plus large mais moins vérifié.</p>`;
      foot = `<button class="btn primary big wide" data-ob-next ${ob.langs.length ? '' : 'disabled'}>Continuer</button>`;
    }
    if (step === 'level') {
      const LV = [['zero', 'Je débute', 'Je ne connais presque rien'], ['bases', 'J\'ai des bases', 'Je comprends des phrases simples'], ['bien', 'Je me débrouille', 'Je comprends l\'essentiel']];
      body = `<h2 class="ob-h">Ton niveau aujourd'hui</h2><p class="ob-lead">Si tu as des bases, un petit test (2 minutes) trouvera ton niveau exact.</p>
        ${ob.langs.map(c => `<div class="ob-lv"><b>${L[c].flag} ${L[c].name}</b><div class="ob-lv-opts">${LV.map(([v, t, d]) => `<button class="${(ob.levels[c] || 'zero') === v ? 'on' : ''}" data-ob-lv="${c}" data-v="${v}"><b>${t}</b><small>${d}</small></button>`).join('')}</div></div>`).join('')}`;
      foot = `<button class="btn primary big wide" data-ob-next>Continuer</button>`;
    }
    if (step === 'how') {
      body = `<h2 class="ob-h">Comment ça marche</h2>
        <div class="ob-demo" aria-hidden="true">
          <div class="d-top"><span class="d-bar"><i></i></span><span class="d-xp">+10</span></div>
          <small>Que veut dire ce mot ?</small>
          <b class="d-word">house <span class="d-say">${icon('volume')}</span></b>
          <div class="d-opt">voiture</div><div class="d-opt good">maison ${icon('check')}</div>
        </div>
        <ul class="ob-how">
          <li><b>1</b><span><strong>Des sessions courtes</strong>Nouveaux mots, phrases du quotidien, et révisions : environ 4 minutes.</span></li>
          <li><b>2</b><span><strong>Ton niveau, toujours</strong>Ça monte quand tout va bien, ça ralentit quand un niveau résiste.</span></li>
          <li><b>3</b><span><strong>Juste avant d'oublier</strong>Chaque mot revient au bon moment pour rester en mémoire.</span></li>
        </ul>`;
      foot = `<button class="btn primary big wide" data-ob-next>Continuer</button>`;
    }
    if (step === 'pace') {
      body = `<h2 class="ob-h">Ton rythme</h2><p class="ob-lead">Tout se change ensuite dans les réglages.</p>
        <p class="ob-q">Combien de temps par session ?</p>
        <div class="ob-choices">${[[8, '3 min', 'Tranquille'], [12, '4 min', 'Normal'], [20, '7 min', 'Intensif']].map(([v, t, d]) => `<button class="${ob.pace === v ? 'on' : ''}" data-ob-pace="${v}"><b>${t}</b><small>${d}</small></button>`).join('')}</div>
        <p class="ob-q">La prononciation</p>
        <div class="ob-choices">${[['muet', 'mute', 'Muet'], ['discret', 'volume', 'Discret'], ['bavard', 'volume-loud', 'Bavard']].map(([v, ic, t]) => `<button class="${ob.audio === v ? 'on' : ''}" data-ob-audio="${v}">${icon(ic)}<b>${t}</b></button>`).join('')}</div>
        <p class="muted small">Muet : rien ne se lit tout seul. Discret : nouveaux mots et bonnes réponses. Bavard : tout est lu. Réglable aussi pendant la leçon.</p>`;
      foot = `<button class="btn primary big wide" data-ob-next>Continuer</button>`;
    }
    if (step === 'account') return showLogin('register', true);
    main().innerHTML = `<section class="ob ob-${step}"><div class="ob-top">${back}${k > 0 ? dots : ''}<span></span></div><div class="ob-body">${body}</div><div class="ob-foot">${foot}</div></section>`;
    const box = main();
    box.onclick = e => {
      const t = e.target;
      if (t.closest('[data-ob-back]')) return go(STEPS[k - 1]);
      if (t.closest('[data-ob-next]')) { obSave(ob); return go(STEPS[k + 1]); }
      const lg = t.closest('[data-ob-lang]');
      if (lg) { const c = lg.dataset.obLang; ob.langs = ob.langs.includes(c) ? ob.langs.filter(x => x !== c) : [...ob.langs, c]; obSave(ob); return go('langs'); }
      const lv = t.closest('[data-ob-lv]');
      if (lv) { ob.levels[lv.dataset.obLv] = lv.dataset.v; obSave(ob); return go('level'); }
      const pc = t.closest('[data-ob-pace]');
      if (pc) { ob.pace = +pc.dataset.obPace; obSave(ob); return go('pace'); }
      const au = t.closest('[data-ob-audio]');
      if (au) { ob.audio = au.dataset.obAudio; obSave(ob); if (ob.audio !== 'muet') Audio2.say('Hello!', 'en'); return go('pace'); }
      const gt = t.closest('[data-goto]');
      if (gt) return showLogin(gt.dataset.goto);
      if (t.closest('[data-local]')) { obSave(ob); Store.goLocal(); start(); }
    };
    main().scrollTop = 0;
  }
  // Choix de l'accueil appliqués au profil (une fois). Un compte existant qui a déjà ses langues n'est pas modifié.
  function applyOnboarding() {
    const ob = obRead();
    try { localStorage.removeItem(OB_KEY); } catch {}
    if (!ob.langs || !ob.langs.length) return;
    const s = Store.settings();
    if ((s.active || []).length) return;
    Store.setSettings({ active: ob.langs, lang: ob.langs[0], sessionLen: ob.pace || 12, audio: ob.audio || 'discret', newPerDay: ob.pace >= 20 ? 20 : ob.pace <= 8 ? 6 : 12, goal: 60, tl: 'auto' });
    for (const c of ob.langs) if ((ob.levels || {})[c] === 'zero' || !(ob.levels || {})[c]) Store.setLang(c, { lv: 0, placed: true });
  }

  async function showLogin(mode = 'login', fromOb = false) {
    document.body.classList.add('logged-out');
    document.documentElement.dataset.theme = 'light';
    const prev = Store.account && !Store.account.local ? Store.account.user : '';
    main().innerHTML = `
      <section class="login">
        <button class="icon-btn back-w" data-welcome aria-label="Retour">${icon('back')}</button>
        <img class="logo-big" src="icons/icon-192.png" alt="">
        <h1>${fromOb ? 'Crée ton compte' : 'Kalima'}</h1>
        <p class="muted">Apprendre une langue, un mot après l'autre.</p>
        <div class="seg wide"><button class="seg-b ${mode === 'login' ? 'on' : ''}" data-mode="login">Connexion</button><button class="seg-b ${mode === 'register' ? 'on' : ''}" data-mode="register">Créer un compte</button></div>
        <form class="col">
          <input class="input" name="user" placeholder="Pseudo" autocomplete="username" autocapitalize="off" value="${esc(prev)}" required>
          <input class="input" name="pass" type="password" placeholder="Mot de passe" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required>
          ${mode === 'register' && !signupOpen ? `<input class="input" name="code" placeholder="Code d'invitation" autocapitalize="characters" required><button type="button" class="link small" data-askcode>Pas de code ? Demander un code</button>` : ''}
          <p class="err" hidden></p>
          <button class="btn primary big wide">${mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
        </form>
        ${mode === 'login' ? '<p class="muted small center">Tu avais un compte Curio ? Même pseudo, même mot de passe : ta progression en langues est reprise.</p>' : ''}
        <p class="muted small center">Ton compte garde tes progrès sur tous tes appareils. Juste un pseudo et un mot de passe, aucun e-mail.</p>
        ${fromOb ? '<button class="link muted" data-oblocal>Continuer sans compte</button>' : ''}
      </section>`;
    $$('[data-mode]').forEach(b => (b.onclick = () => showLogin(b.dataset.mode, fromOb)));
    $('[data-welcome]').onclick = () => showWelcome(fromOb ? 'pace' : 'welcome');
    const ol = $('[data-oblocal]');
    if (ol) ol.onclick = () => { Store.goLocal(); start(); };
    const ask = $('[data-askcode]');
    if (ask) ask.onclick = () => Views.contactForm('code');
    $('form', main()).onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const btn = $('button.primary', e.target);
      const err = $('.err', e.target);
      btn.disabled = true; err.hidden = true;
      try {
        if (mode === 'login') await Store.login(f.get('user'), f.get('pass'));
        else await Store.register(f.get('user'), f.get('pass'), f.get('code') || '');
        start();
      } catch (ex) { err.textContent = ex.message || 'Connexion impossible'; err.hidden = false; btn.disabled = false; }
    };
    if (mode === 'register') api('signup').then(r => { if (signupOpen !== !!r.open) { signupOpen = !!r.open; showLogin('register', fromOb); } }).catch(() => {});
  }

  // ---------- Démarrage ----------
  async function start() {
    document.body.classList.remove('logged-out');
    applyTheme();
    const s = Store.settings();
    if (!s.audio) Store.setSettings({ audio: 'discret', sessionLen: 12, newPerDay: 12, goal: 60, tl: 'auto' });
    if (s.import) await Engine.importCurio().catch(() => {});
    applyOnboarding();
    tab = 'home';
    refresh();
    if (Store.account && !Store.account.local) {
      Store.sync();
      Store.checkSession().then(r => { if (r && r.mustChange) mustChange(); });
    }
    setupNative();
    // App Android : sans l'autorisation, Android bloque le mot du jour en silence. On la demande une fois.
    if (window.WebApk && WebApk.notifPermission && !WebApk.notifPermission() && !Store.settings().permAsked) {
      Store.setSettings({ permAsked: true });
      setTimeout(() => WebApk.requestNotifPermission(), 2500);
    }
    deepLink();
  }
  async function mustChange() {
    toast('Ton mot de passe est provisoire : choisis-en un nouveau', 'key', 4000);
    const old = await promptBox('Mot de passe provisoire reçu', { type: 'password' }); if (old === null) return;
    const nw = await promptBox('Ton nouveau mot de passe (6 caractères minimum)', { type: 'password' }); if (!nw) return;
    try { await api('password', { old, new: nw }); toast('Mot de passe changé', 'check'); } catch (e) { toast(e.message, 'alert'); }
  }

  // Liens profonds (notification, widget) : ?go=session&l=en, ?word=en:w:house
  function deepLink(url = location.href) {
    const u = new URL(url, location.href);
    const l = u.searchParams.get('l');
    if (l && Content.LANGS[l] && (Store.settings().active || []).includes(l)) Store.setSettings({ lang: l });
    const goTo = u.searchParams.get('go'), w = u.searchParams.get('word');
    if (goTo || w) history.replaceState(null, '', location.pathname);
    if (goTo === 'session') setTimeout(() => Session.start(Store.settings().lang, 'daily'), 300);
    if (w) setTimeout(() => Views.wordSheet(w), 300);
  }
  window.webApkOpen = url => deepLink(url);
  // Réponse d'Android à la demande d'autorisation des notifications.
  window.webApkPermission = (kind, ok) => {
    if (kind !== 'notifications') return;
    toast(ok ? 'Notifications activées' : 'Notifications refusées : modifiable dans les réglages Android', ok ? 'bell' : 'info');
    refresh();
  };

  // App Android : rappel quotidien + widget « mot du jour » (le widget est alimenté chaque jour, même rappel coupé).
  function setupNative() {
    if (!window.WebApk || !WebApk.setChannels) return;
    const s = Store.settings();
    const code = s.lang || (s.active || [])[0];
    if (!code) return;
    const n = Views.notifSettings();
    const lc = n.lang || code;
    const lv = Engine.levelInfo(lc).code;
    const base = location.href.split(/[?#]/)[0].replace(/index\.html$/, '');
    try {
      WebApk.setChannels(JSON.stringify([{
        id: 'mot', label: 'Mot du jour', enabled: !!n.on, mode: 'fixed', times: n.times.slice(0, n.count).sort(),
        feedUrl: `${base}api/word.php?l=${lc}&lvl=${lv}`, widget: true, widgets: 'card', icon: 'learn',
      }]));
    } catch {}
  }

  function bind() {
    document.addEventListener('click', async e => {
      const t = e.target;
      const tb = t.closest('.tabbar button');
      if (tb) return go(tb.dataset.tab);
      const say = t.closest('[data-say]');
      if (say && !t.closest('.sheet')) { e.preventDefault(); return Audio2.say(say.dataset.say, Store.settings().lang); }
      if (t.closest('[data-relog]')) return showLogin();
      const lang = t.closest('[data-lang]');
      if (lang) { Store.setSettings({ lang: lang.dataset.lang }); setupNative(); return refresh(); }
      if (t.closest('[data-addlang]')) { tab = 'home'; return Views.chooseLangs(main()); }
      const pk = t.closest('[data-pick]');
      if (pk) {
        const a = new Set(Store.settings().active || []);
        a.has(pk.dataset.pick) ? a.delete(pk.dataset.pick) : a.add(pk.dataset.pick);
        Store.setSettings({ active: [...a] });
        pk.classList.toggle('on');
        $('[data-langs-ok]').disabled = !a.size;
        return;
      }
      if (t.closest('[data-langs-ok]')) {
        const a = Store.settings().active || [];
        if (!a.includes(Store.settings().lang)) Store.setSettings({ lang: a[0] });
        setupNative();
        return refresh();
      }
      const code = Store.settings().lang;
      const st = t.closest('[data-start]');
      if (st) {
        if (Store.resume(code) && !await confirmBox('Tu as un exercice pas fini. Le remplacer par un nouveau ?', { ok: 'Nouveau', cancel: 'Garder' })) return;
        return Session.start(code, st.dataset.start);
      }
      if (t.closest('[data-resume]')) return Session.resume(code);
      if (t.closest('[data-drop]')) { if (await confirmBox('Abandonner cet exercice ? Les points gagnés sont gardés.', { ok: 'Abandonner' })) { Store.setResume(code, null); refresh(); } return; }
      if (t.closest('[data-place]')) return Views.placement(code);
      if (t.closest('[data-beginner]')) { Store.setLang(code, { lv: 0, placed: true }); refresh(); return Views.pathStep(code, 0); }
      if (t.closest('[data-path-list]')) return Views.pathList(code);
      const ps = t.closest('[data-path-step]');
      if (ps) {
        if (Store.resume(code) && !await confirmBox('Tu as un exercice pas fini. Le remplacer ?', { ok: 'Remplacer', cancel: 'Garder' })) return;
        return Views.pathStep(code, +ps.dataset.pathStep);
      }
      if (t.closest('[data-alpha]')) return Views.alphabet();
      const as = t.closest('[data-alpha-step]');
      if (as) return Views.alphaLesson(+as.dataset.alphaStep);
      if (t.closest('[data-level]') && tab === 'home') return go('progress');
      const w = t.closest('[data-word]');
      if (w) return Views.wordSheet(w.dataset.word);
      if (t.closest('[data-reload]')) return refresh();
      const set = t.closest('[data-set]');
      if (set) {
        const v = isNaN(+set.dataset.val) ? set.dataset.val : +set.dataset.val;
        Store.setSettings({ [set.dataset.set]: v });
        if (set.dataset.set === 'audio' && v !== 'muet') Audio2.say(code === 'ar' ? 'مَرْحَبًا' : 'Hello!', code || 'en');
        return refresh();
      }
      if (t.closest('[data-testvoice]')) return Audio2.say(code === 'ar' ? 'السَّلَامُ عَلَيْكُمْ، كَيْفَ حَالُكَ؟' : 'Hello! How are you today?', code || 'en');
      const ac = t.closest('[data-account]');
      if (ac) return Views.accountAction(ac.dataset.account);
      if (t.closest('[data-admin]')) return Views.admin();
      const ct = t.closest('[data-contact]');
      if (ct) return Views.contactForm(ct.dataset.contact);
      const nt = t.closest('[data-notif]');
      if (nt && nt.tagName === 'BUTTON') {
        const n = Views.notifSettings();
        const k = nt.dataset.notif;
        if (k === 'on') { n.on = !n.on; if (n.on && window.WebApk && WebApk.notifPermission && !WebApk.notifPermission()) WebApk.requestNotifPermission(); }
        if (k === 'count') n.count = +nt.dataset.val;
        if (k === 'perm') { WebApk.requestNotifPermission && WebApk.requestNotifPermission(); return; }
        if (k === 'test') { setupNative(); try { WebApk.runChannel('mot'); toast('Mot du jour envoyé', 'bell'); } catch { toast('Mets à jour l\'app Android', 'alert'); } return; }
        Store.setSettings({ notif: n }); setupNative(); return refresh();
      }
    });
    document.addEventListener('change', e => {
      if (e.target.matches('[data-notif="time"]')) { const n = Views.notifSettings(); n.times[+e.target.dataset.k] = e.target.value || n.times[+e.target.dataset.k]; Store.setSettings({ notif: n }); setupNative(); }
      if (e.target.matches('[data-notif="lang"]')) { const n = Views.notifSettings(); n.lang = e.target.value; Store.setSettings({ notif: n }); setupNative(); }
    });
    Store.on('remote', () => { if (!Session.active && !sheets.length) refresh(); });
    Store.on('status', () => { banner(); const s = $('.sync-state'); if (s) s.textContent = Views.syncText(); });
  }

  function boot() {
    bind();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
    if (!Store.account) showWelcome(); else start();
    // Statistiques de visite du site (comme les autres applis), uniquement sur polocrafting.fr.
    if (/polocrafting\.fr$/.test(location.hostname)) {
      // text/plain : requête CORS « simple », sans préflight ; le corps reste du JSON lu par track.php.
      fetch('https://polocrafting.fr/track.php', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ deviceId: Store.dev, page: window.WebApk ? 'Kalima (app)' : 'Kalima' }) }).catch(() => {});
    }
  }

  return { boot, refresh, go, showLogin, showWelcome };
})();
App.boot();
