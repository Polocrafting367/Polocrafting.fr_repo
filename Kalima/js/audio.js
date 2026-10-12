// Prononciation. Trois modes, comme les annonces d'un GPS :
//   muet     : rien ne se lit tout seul (le haut-parleur reste disponible) ;
//   discret  : nouveaux mots, exercices d'écoute, et la bonne réponse une fois trouvée ;
//   bavard   : tout ce qui s'affiche dans la langue apprise est lu, à chaque fois (question, choix touchés, correction).
// Voix du téléphone si elle existe pour la langue, sinon son généré par le serveur (api/tts.php, mis en cache).
const Audio2 = (() => {
  let el = null, queue = Promise.resolve(), seq = 0;
  const mode = () => (Store.settings().audio || 'discret');
  const rate = () => +(Store.settings().rate || 0.9);
  const voiceFor = code => {
    if (!('speechSynthesis' in window)) return null;
    const want = Content.LANGS[code].tts.toLowerCase(), base = want.split('-')[0];
    const vs = speechSynthesis.getVoices();
    return vs.find(v => v.lang.toLowerCase().replace('_', '-') === want) || vs.find(v => v.lang.toLowerCase().startsWith(base)) || null;
  };
  if ('speechSynthesis' in window) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); }

  function stop() { seq++; try { speechSynthesis.cancel(); } catch {} if (el) { el.pause(); el = null; } }

  // Lit un texte ; renvoie une promesse résolue à la fin de la lecture.
  function say(text, code, { slow = false } = {}) {
    if (!text) return Promise.resolve();
    stop();
    const my = seq;
    const clean = String(text).replace(/\*/g, '').replace(/\[([^|\]]*)\|[^\]]*\]/g, '$1');
    return new Promise(resolve => {
      const v = voiceFor(code);
      if (v) {
        const u = new SpeechSynthesisUtterance(clean);
        u.voice = v; u.lang = v.lang; u.rate = rate() * (slow ? 0.7 : 1);
        u.onend = u.onerror = () => resolve();
        speechSynthesis.speak(u);
        setTimeout(resolve, 9000);
        return;
      }
      try {
        el = new Audio(`api/tts.php?l=${Content.LANGS[code].tts.split('-')[0]}&q=${encodeURIComponent(clean.slice(0, 200))}`);
        el.playbackRate = slow ? 0.75 : Math.min(1.1, rate() + 0.1);
        el.onended = el.onerror = () => resolve();
        el.play().catch(() => resolve());
        setTimeout(resolve, 12000);
      } catch { resolve(); }
      if (my !== seq) resolve();
    });
  }
  // Lecture automatique selon le mode : 'new' (nouveau mot), 'listen' (exercice d'écoute), 'answer' (bonne réponse), 'show' (affichage).
  function auto(kind, text, code) {
    const m = mode();
    if (m === 'muet' && kind !== 'listen') return Promise.resolve();
    if (m === 'discret' && kind === 'show') return Promise.resolve();
    return say(text, code);
  }
  const chatty = () => mode() === 'bavard';

  // Répète à voix haute : reconnaissance vocale du navigateur, si elle existe.
  function listen(expected, code) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return Promise.resolve(null);
    stop();
    return new Promise(resolve => {
      const rec = new SR();
      rec.lang = Content.LANGS[code].tts;
      rec.maxAlternatives = 5;
      const target = Check.norm(expected);
      rec.onresult = e => {
        const alts = [...e.results[0]].map(x => Check.norm(x.transcript));
        resolve({ ok: alts.some(a => a === target || (target.length > 3 && Check.lev(a, target) <= Math.ceil(target.length / 5))), heard: e.results[0][0].transcript });
      };
      rec.onerror = () => resolve(null);
      rec.onend = () => resolve(null);
      try { rec.start(); } catch { resolve(null); }
    });
  }
  const canListen = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { say, auto, stop, listen, canListen, mode, chatty };
})();
