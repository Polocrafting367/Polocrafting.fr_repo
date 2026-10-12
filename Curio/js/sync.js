// Fusion de profils entre appareils, sans rien perdre (même principe que Carnet).
//
// Les deux versions (cet appareil, serveur) sont fusionnées au lieu de s'écraser :
//  - historique « vu » : union (le plus récent de chaque article) ;
//  - le reste du profil (sujets, réglages, bibliothèque…) : la version la plus récente gagne
//    (un article retiré de la bibliothèque ne doit pas revenir).
// (Les anciennes données de langues restent telles quelles dans le profil : elles ont été reprises par Kalima.)
const Sync = (() => {
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  // L'ancien serveur changeait {} en [] : un tableau là où on attend un objet est remis en objet.
  const asObj = v => (isObj(v) ? v : Array.isArray(v) ? Object.assign({}, ...v.map((x, i) => (x === null || x === undefined ? {} : { [i]: x }))) : {});
  const asArr = v => (Array.isArray(v) ? v : []);

  // Identifiant de cet appareil (partagé avec la mesure d'audience du site).
  let dev = '';
  try { dev = localStorage.getItem('app_device_id') || ''; } catch {}
  if (!dev) {
    dev = 'dev-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now();
    try { localStorage.setItem('app_device_id', dev); } catch {}
  }

  function repair(st) {
    if (!isObj(st)) return st;
    for (const k of ['interests', 'discovered', 'cats', 'press', 'seen', 'cursors']) if (k in st) st[k] = asObj(st[k]);
    for (const k of ['saved', 'liked', 'history', 'seeds', 'categories']) if (k in st) st[k] = asArr(st[k]);
    if (st.stats) st.stats.days = asObj(st.stats.days);
    return st;
  }

  const maxBy = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) if (!(k in o) || v > o[k]) o[k] = v; return o; };
  // a = cet appareil, b = serveur.
  function merge(a, b) {
    if (!isObj(b)) return a;
    if (!isObj(a)) return b;
    repair(a); repair(b);
    const newer = (b.updated || 0) > (a.updated || 0) ? b : a;
    const o = { ...newer };
    o.seen = maxBy(asObj(a.seen), asObj(b.seen));
    o.updated = Math.max(a.updated || 0, b.updated || 0);
    return o;
  }

  // Empreinte légère pour savoir si une fusion a changé quelque chose.
  const sig = st => { try { return (st.updated || 0) + ':' + Object.keys(st.seen || {}).length + ':' + asArr(st.saved).length + ':' + asArr(st.liked).length + ':' + JSON.stringify(st.interests || {}).length; } catch { return ''; } };

  return { dev, repair, merge, sig, asObj };
})();
