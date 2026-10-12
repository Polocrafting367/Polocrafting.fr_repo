// Outils communs : échappement, icônes, messages, feuilles plein écran, appels au serveur.
const DAY = 864e5;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
// Date locale (et non UTC : la journée change à minuit, heure du téléphone).
const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => ymd();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function toast(msg, ic = 'info', ms = 2600) {
  const box = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${icon(ic)}<span>${esc(msg)}</span>`;
  box.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, ms);
}

// Feuilles (écrans par-dessus) : le bouton retour d'Android et du navigateur les ferme une par une.
const sheets = [];
let skipPop = 0; // retours d'historique déclenchés par l'app elle-même
function openSheet(html, { cls = '', onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'sheet ' + cls;
  el.innerHTML = html;
  $('#app').appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  const entry = { el, onClose };
  sheets.push(entry);
  history.pushState({ sheet: sheets.length }, '');
  el.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
  return el;
}
function closeSheet(fromHistory = false) {
  const s = sheets.pop();
  if (!s) return false;
  s.el.classList.remove('in');
  setTimeout(() => s.el.remove(), 220);
  if (s.onClose) s.onClose();
  if (!fromHistory) { skipPop++; history.back(); }
  return true;
}
addEventListener('popstate', () => { if (skipPop) { skipPop--; return; } if (sheets.length) closeSheet(true); });
// App Android : bouton retour.
window.webApkBack = () => (sheets.length ? (closeSheet(), true) : false);

function confirmBox(text, { ok = 'Confirmer', cancel = 'Annuler', danger = false } = {}) {
  return new Promise(resolve => {
    const el = openSheet(`<div class="dialog"><p>${esc(text)}</p><div class="row end">
      <button class="btn ghost" data-no>${esc(cancel)}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes>${esc(ok)}</button></div></div>`,
    { cls: 'modal', onClose: () => resolve(false) });
    $('[data-no]', el).onclick = () => closeSheet();
    $('[data-yes]', el).onclick = () => { const s = sheets[sheets.length - 1]; s.onClose = null; closeSheet(); resolve(true); };
  });
}
function promptBox(text, { value = '', type = 'text', ok = 'Valider', placeholder = '' } = {}) {
  return new Promise(resolve => {
    const el = openSheet(`<form class="dialog"><p>${esc(text)}</p><input class="input" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off">
      <div class="row end"><button type="button" class="btn ghost" data-no>Annuler</button><button class="btn primary">${esc(ok)}</button></div></form>`,
    { cls: 'modal', onClose: () => resolve(null) });
    const inp = $('input', el);
    setTimeout(() => inp.focus(), 150);
    $('[data-no]', el).onclick = () => closeSheet();
    $('form', el).onsubmit = e => { e.preventDefault(); const s = sheets[sheets.length - 1]; s.onClose = null; closeSheet(); resolve(inp.value); };
  });
}

// Appel au serveur. Le jeton part aussi en en-tête : la WebView Android perd parfois ses cookies.
async function api(action, body = {}, { timeout = 20000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const tok = (Store.account && Store.account.tok) || '';
    const r = await fetch(`api/api.php?a=${action}`, {
      method: 'POST', credentials: 'same-origin', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', ...(tok ? { 'X-Kalima-Token': tok } : {}) },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || `Erreur ${r.status}`); e.status = r.status; throw e; }
    return data;
  } finally { clearTimeout(t); }
}

function timeAgo(t) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'à l\'instant';
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  const d = Math.round(s / 86400);
  return d === 1 ? 'hier' : d < 30 ? `il y a ${d} jours` : new Date(t).toLocaleDateString('fr-FR');
}
