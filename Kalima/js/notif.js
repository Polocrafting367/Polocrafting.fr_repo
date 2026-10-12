// Notifications « mot du jour », pour TOUTES les langues apprises, comme dans Curio.
//
// Réglages (settings.notif) : activées ou non ; nombre de mots par jour pour chaque langue (0 à 5) ;
//   « réparties » : toutes les notifications de la journée espacées régulièrement dans une plage horaire, en alternant
//   les langues ; « heures fixes » : des heures choisies pour chaque langue.
// Le planning du jour (settings.notifPlan = {langue: ["09:30", …]}) est enregistré dans le profil :
//   - app Android : un canal par langue (WebApk.setChannels), et chaque langue est proposée quand on pose un widget ;
//   - sans l'APK (navigateur, appli installée depuis le navigateur) : le serveur envoie des notifications web aux
//     appareils abonnés, à ces heures-là (api/cron.php, comme les rappels de Carnet).
const Notif = (() => {
  const DEF_TIMES = ['12:30', '18:30', '09:00', '15:30', '20:30'];
  const toMin = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
  const toHM = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
  const langs = () => (Store.settings().active || []).filter(c => Content.LANGS[c]);

  function settings() {
    const n = { on: true, mode: 'spread', from: '09:00', to: '21:00', langs: {}, ...(Store.settings().notif || {}) };
    n.langs = { ...(n.langs || {}) };
    langs().forEach((c, k) => {
      const l = n.langs[c] || { count: 1 };
      const times = (l.times || []).slice();
      while (times.length < 5) times.push(DEF_TIMES[(times.length + k) % DEF_TIMES.length]);
      n.langs[c] = { count: Math.max(0, Math.min(5, +l.count || 0)), times };
    });
    return n;
  }

  // Planning de la journée : {langue: ["HH:MM", …]} (heures triées).
  function plan(n = settings()) {
    const out = {};
    const act = langs().filter(c => n.langs[c] && n.langs[c].count > 0);
    for (const c of act) out[c] = [];
    if (n.mode === 'fixed') { for (const c of act) out[c] = n.langs[c].times.slice(0, n.langs[c].count).sort(); return out; }
    const left = Object.fromEntries(act.map(c => [c, n.langs[c].count]));
    const order = [];
    while (Object.values(left).some(x => x > 0)) for (const c of act) if (left[c] > 0) { order.push(c); left[c]--; }
    const a = toMin(n.from), b = Math.max(toMin(n.to), a + 30);
    const step = (b - a) / Math.max(1, order.length);
    order.forEach((c, k) => out[c].push(toHM(a + step * (k + 0.5) - (order.length === 1 ? step / 2 : 0))));
    return out;
  }

  // Enregistre les réglages et le planning (lu par le serveur pour les notifications web), puis prévient l'APK.
  function save(n) {
    Store.setSettings({ notif: n, notifPlan: n.on ? plan(n) : {} });
    native();
  }

  // ---------- App Android ----------
  let lastCfg = '';
  function native() {
    if (!window.WebApk || !WebApk.setChannels) return;
    const n = settings(), p = plan(n);
    const base = location.href.split(/[?#]/)[0].replace(/index\.html$/, '');
    const first = Store.settings().lang || langs()[0];
    const list = langs().map(c => {
      const L = Content.LANGS[c];
      const times = p[c] && p[c].length ? p[c] : ['08:00'];
      const lv = Engine.levelInfo(c).code;
      return {
        id: 'mot-' + c, label: `Mot du jour · ${L.name}`, enabled: !!n.on && !!(p[c] && p[c].length), mode: 'fixed', times,
        feedUrl: `${base}api/word.php?l=${c}&lvl=${lv}&times=${times.map(t => t.replace(':', '')).join(',')}`,
        icon: 'learn', widgets: c === first ? 'card' : '', widgetSource: `${L.flag}  ${L.name}`,
      };
    });
    const cfg = JSON.stringify(list);
    if (cfg === lastCfg) return;
    lastCfg = cfg;
    try { WebApk.setChannels(cfg); } catch {}
  }
  const inApp = () => !!(window.WebApk && WebApk.setChannels);

  // ---------- Notifications web (sans l'APK) ----------
  const pushOk = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && location.protocol === 'https:';
  const b64ToU8 = s => { const p = '='.repeat((4 - s.length % 4) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map(c => c.charCodeAt(0))); };
  async function pushState() {
    if (!pushOk()) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    try { const reg = await navigator.serviceWorker.ready; return (await reg.pushManager.getSubscription()) ? 'on' : 'off'; } catch { return 'off'; }
  }
  async function pushEnable() {
    if (!pushOk()) throw new Error('Ce navigateur ne gère pas les notifications (sur iPhone : ajoute d\'abord Kalima à l\'écran d\'accueil).');
    if (await Notification.requestPermission() !== 'granted') throw new Error('Notifications refusées dans le navigateur.');
    const { key } = await api('vapid');
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(key) });
    await api('pushsub', { sub: sub.toJSON() });
    save({ ...settings(), on: true });
  }
  async function pushDisable() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) { await api('pushunsub', { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); }
  }

  return { settings, plan, save, native, inApp, pushOk, pushState, pushEnable, pushDisable, toMin };
})();
