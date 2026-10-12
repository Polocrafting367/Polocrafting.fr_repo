// État de l'utilisateur, gardé sur l'appareil et synchronisé avec le serveur (même principe que Carnet).
//
//   settings  réglages                         (le plus récent gagne)
//   langs     {code: niveau, alphabet…}       (le plus récent gagne, langue par langue)
//   items     {"en:w:house": progression}     (élément par élément : seuls les éléments modifiés partent)
//   xp        {appareil: {jour: points}}      (chaque appareil a son compteur ; le total est la somme)
//   resume    {code: exercice en cours}
//
// Chaque élément modifié porte « u » (date en ms) et part au serveur à la prochaine synchronisation ;
// le serveur garde la version la plus récente de chacun et renvoie l'état complet. Deux appareils qui
// travaillent en même temps ne s'écrasent donc jamais. Hors ligne, les modifications attendent sur l'appareil.
// Synchronisation : après chaque modification (1,5 s), au retour dans l'app, et en temps réel grâce à une
// requête en attente sur le serveur (api.php?a=wait) qui répond dès qu'un autre appareil a écrit.
const Store = (() => {
  const MAPS = ['langs', 'items', 'resume'];
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  // Identifiant anonyme de l'appareil (compteur de points, mesure d'audience du site).
  let dev = '';
  try { dev = localStorage.getItem('app_device_id') || ''; } catch {}
  if (!dev) { dev = 'dev-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now(); try { localStorage.setItem('app_device_id', dev); } catch {} }

  let account = read('kalima.account'); // {user, tok, admin} ou {local: true}
  let st = null, dirty = null, rev = '';
  const empty = () => ({ settings: {}, langs: {}, items: {}, xp: {}, resume: {} });
  const emptyDirty = () => ({ settings: false, langs: {}, items: {}, resume: {} });
  const key = () => 'kalima.state.' + (account ? (account.local ? '~local' : account.user) : '~none');

  function clean(s) {
    s = isObj(s) ? s : {};
    const o = { settings: isObj(s.settings) ? s.settings : {}, xp: isObj(s.xp) ? s.xp : {} };
    for (const k of MAPS) o[k] = isObj(s[k]) ? s[k] : {};
    for (const d of Object.keys(o.xp)) if (!isObj(o.xp[d])) delete o.xp[d];
    return o;
  }
  function load() {
    const saved = read(key());
    st = clean(saved && saved.st);
    dirty = saved && saved.dirty ? { ...emptyDirty(), ...saved.dirty } : emptyDirty();
    rev = (saved && saved.rev) || '';
  }
  let saveT = null;
  function persist() {
    clearTimeout(saveT); saveT = null;
    if (!write(key(), { st, dirty, rev })) {
      // Stockage plein : on retire les éléments supprimés, puis on réessaie.
      for (const [k, v] of Object.entries(st.items)) if (v.del) delete st.items[k];
      write(key(), { st, dirty, rev });
    }
  }
  addEventListener('pagehide', () => { if (saveT) persist(); });
  function touch() {
    if (!saveT) saveT = setTimeout(persist, 400);
    scheduleSync();
    for (const f of listeners.change) f();
  }

  // ---------- Lecture / écriture ----------
  const settings = () => st.settings;
  function setSettings(patch) { Object.assign(st.settings, patch, { u: Date.now() }); dirty.settings = true; touch(); }
  const lang = code => st.langs[code] || null;
  function setLang(code, patch) { st.langs[code] = { ...(st.langs[code] || {}), ...patch, u: Date.now() }; dirty.langs[code] = 1; touch(); }
  const item = id => { const v = st.items[id]; return v && !v.del ? v : null; };
  function setItem(id, v) { st.items[id] = { ...v, u: Date.now() }; dirty.items[id] = 1; touch(); }
  function delItem(id) { st.items[id] = { u: Date.now(), del: 1 }; dirty.items[id] = 1; touch(); }
  function items(prefix) { const out = []; for (const [k, v] of Object.entries(st.items)) if (!v.del && k.startsWith(prefix)) out.push([k, v]); return out; }
  const resume = code => { const r = st.resume[code]; return r && !r.done ? r : null; };
  function setResume(code, v) { st.resume[code] = v ? { ...v, u: Date.now() } : { u: Date.now(), done: 1 }; dirty.resume[code] = 1; touch(); }

  // Points : uniquement dans le compteur de cet appareil.
  function addXp(n) {
    const mine = st.xp[dev] || (st.xp[dev] = {});
    mine[today()] = (mine[today()] || 0) + n;
    touch();
  }
  function xpDay(d = today()) { let n = 0; for (const per of Object.values(st.xp)) n += +per[d] || 0; return n; }
  function xpTotal() { let n = 0; for (const per of Object.values(st.xp)) for (const v of Object.values(per)) n += +v || 0; return n; }
  function xpDays() { const o = {}; for (const per of Object.values(st.xp)) for (const [d, v] of Object.entries(per)) o[d] = (o[d] || 0) + (+v || 0); return o; }

  // ---------- Synchronisation ----------
  const listeners = { change: [], remote: [], status: [] };
  const on = (ev, f) => listeners[ev].push(f);
  let syncT = null, syncing = false, again = false, online = true, waiting = false, authLost = false;
  const canSync = () => account && !account.local && account.tok && !authLost;
  function scheduleSync(ms = 1500) { if (!canSync()) return; clearTimeout(syncT); syncT = setTimeout(sync, ms); }
  const hasDirty = () => dirty.settings || MAPS.some(k => Object.keys(dirty[k]).length);
  function status(s) { for (const f of listeners.status) f(s); }

  async function sync() {
    if (!canSync()) return;
    if (syncing) { again = true; return; }
    syncing = true; clearTimeout(syncT);
    const sending = dirty;
    dirty = emptyDirty();
    const payload = { xp: { [dev]: st.xp[dev] || {} } };
    if (sending.settings) payload.settings = st.settings;
    for (const k of MAPS) { payload[k] = {}; for (const id of Object.keys(sending[k])) if (st[k][id]) payload[k][id] = st[k][id]; }
    try {
      const r = await api('sync', { state: payload });
      const before = JSON.stringify(st);
      const merged = clean(r.state);
      // Modifié pendant l'envoi : la version locale reste (et repartira).
      if (dirty.settings) merged.settings = st.settings;
      for (const k of MAPS) for (const id of Object.keys(dirty[k])) if (st[k][id]) merged[k][id] = st[k][id];
      merged.xp[dev] = { ...(merged.xp[dev] || {}) };
      for (const [d, n] of Object.entries(st.xp[dev] || {})) if (n > (merged.xp[dev][d] || 0)) merged.xp[dev][d] = n;
      st = merged;
      rev = r.rev || rev;
      online = true;
      persist();
      status('ok');
      if (JSON.stringify(st) !== before) for (const f of listeners.remote) f();
      if (!waiting) waitLoop();
    } catch (e) {
      // Rien n'est perdu : les éléments repartiront au prochain essai.
      dirty.settings = dirty.settings || sending.settings;
      for (const k of MAPS) Object.assign(dirty[k], sending[k]);
      persist();
      if (e.status === 401) { authLost = true; status('auth'); }
      else { online = false; status('offline'); scheduleSync(15000); }
    } finally {
      syncing = false;
      if (again || hasDirty()) { again = false; if (online && !authLost) scheduleSync(800); }
    }
  }

  // Attente longue : le serveur répond dès qu'un autre appareil a écrit.
  async function waitLoop() {
    if (waiting) return;
    waiting = true;
    while (canSync() && document.visibilityState === 'visible') {
      try {
        const r = await api('wait', { rev }, { timeout: 40000 });
        if (r.rev && r.rev !== rev) await sync();
      } catch (e) { if (e.status === 401) { authLost = true; status('auth'); break; } await sleep(10000); }
    }
    waiting = false;
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { sync(); } else if (saveT) persist(); });
  addEventListener('online', () => sync());
  setInterval(() => { if (document.visibilityState === 'visible') sync(); }, 60000);

  // ---------- Compte ----------
  function setAccount(a) {
    if (saveT) persist();
    account = a;
    authLost = false;
    write('kalima.account', a);
    load();
    for (const f of listeners.change) f();
  }
  async function login(user, pass) {
    const r = await api('login', { user, pass });
    // Les données locales sans compte (mode local) sont reprises par le compte à la première connexion.
    const localKey = 'kalima.state.~local';
    const local = account && account.local ? read(localKey) : null;
    setAccount({ user: r.user, tok: r.tok, admin: !!r.admin });
    if (local && local.st && !Object.keys(st.items).length) adoptLocal(local.st);
    await sync();
    return r;
  }
  async function register(user, pass, code) {
    const r = await api('register', { user, pass, code });
    const local = account && account.local ? read('kalima.state.~local') : null;
    setAccount({ user: r.user, tok: r.tok, admin: !!r.admin });
    if (local && local.st) adoptLocal(local.st);
    await sync();
    return r;
  }
  function adoptLocal(s) {
    s = clean(s);
    st.settings = { ...s.settings, u: Date.now() }; dirty.settings = true;
    for (const k of MAPS) for (const [id, v] of Object.entries(s[k])) { st[k][id] = v; dirty[k][id] = 1; }
    st.xp[dev] = { ...(s.xp[dev] || {}) };
    for (const [d, per] of Object.entries(s.xp)) if (d !== dev) for (const [day, n] of Object.entries(per)) st.xp[dev][day] = (st.xp[dev][day] || 0) + n;
    persist();
  }
  async function logout() {
    if (canSync() && hasDirty()) await sync().catch(() => {});
    try { await api('logout'); } catch {}
    setAccount(null);
  }
  function goLocal() { setAccount({ local: true }); }
  // Après une restauration de sauvegarde : l'état du serveur remplace tout.
  function replaceState(s, r) { st = clean(s); dirty = emptyDirty(); rev = r || rev; persist(); for (const f of listeners.remote) f(); }
  async function checkSession() {
    if (!account || account.local) return null;
    try {
      const r = await api('me');
      if (!r.user) { authLost = true; status('auth'); return r; }
      if (r.user !== account.user || !!r.admin !== !!account.admin) setAccount({ ...account, user: r.user, admin: !!r.admin });
      return r;
    } catch { return null; }
  }

  load();
  return {
    get account() { return account; }, get st() { return st; }, get dev() { return dev; }, get pending() { return hasDirty(); },
    get online() { return online; }, get authLost() { return authLost; },
    settings, setSettings, lang, setLang, item, setItem, delItem, items, resume, setResume,
    addXp, xpDay, xpTotal, xpDays, sync, on, login, register, logout, goLocal, setAccount, replaceState, checkSession, persist,
  };
})();
