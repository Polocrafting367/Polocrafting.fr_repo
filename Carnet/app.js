'use strict';

// ================= Outils =================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const P = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chevron: '<path d="M7 10l5 5 5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3"/><path d="M16 7l3 3"/><path d="M14 9l2 2"/>',
  send: '<path d="M21 3L10 14"/><path d="M21 3l-6.5 18-3.5-7-7-3.5z"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.2"/><path d="M11 17.5h2"/>',
  tasks: '<circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3l2.6 2.6 5-5.4"/>',
  agenda: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  notes: '<path d="M6 3.5h9l4.5 4.5v12.5H6z"/><path d="M15 3.5V8h4.5M9 13h7M9 16.5h5"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 13h9l1-13M9.5 7V4h5v3"/>',
  pin: '<path d="M9 4h6l-1 6 4 3v2H6v-2l4-3z"/><path d="M12 15v6"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.6 0-.9.7-1.5 1.7-1.5h2a4 4 0 0 0 4-4.2A8 8 0 0 0 12 3.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  repeat: '<path d="M17 3l3 3-3 3"/><path d="M4 12v-2a4 4 0 0 1 4-4h12"/><path d="M7 21l-3-3 3-3"/><path d="M20 12v2a4 4 0 0 1-4 4H4"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  bellPlus: '<path d="M6 16v-5a6 6 0 0 1 7-5.9"/><path d="M18 12v4l1.5 2h-15"/><path d="M10 20.5a2 2 0 0 0 4 0"/><path d="M18.5 3v6M15.5 6h6"/>',
  flame: '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-2.6 1.6-4.3 3-5.8.3 1.4 1 2.4 2 2.9C11 9 12.3 5.8 14.6 3.5c.4 2.9 1.7 4.6 2.8 6.2 1 1.4 1.6 2.9 1.6 4.7C19 18.6 16 21 12 21z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3M12 13v4M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
  minus: '<path d="M5 12h14"/>',
  fit: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  star: '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z"/>',
  archive: '<rect x="3.5" y="4" width="17" height="4.5" rx="1"/><path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5M10 12.5h4"/>',
  unarchive: '<rect x="3.5" y="4" width="17" height="4.5" rx="1"/><path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5M12 17.5v-6M9.5 14l2.5-2.5 2.5 2.5"/>',
  more: '<circle cx="12" cy="5.5" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="12" cy="18.5" r=".8"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  checkbox: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12.5l3 3 5-6"/>',
  bullets: '<path d="M9.5 6h10.5M9.5 12h10.5M9.5 18h10.5"/><circle cx="4.8" cy="6" r=".9"/><circle cx="4.8" cy="12" r=".9"/><circle cx="4.8" cy="18" r=".9"/>',
  numbers: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 4.5l1.5-1V9"/><path d="M3.6 13.2a1.4 1.4 0 0 1 2.7.5c0 1-2.7 2.3-2.7 3.3h2.8"/>',
  code: '<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5"/>',
  quote: '<path d="M5 5v14"/><path d="M9.5 8h10M9.5 12h10M9.5 16h6"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  rows: '<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/>',
  restore: '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4.5h4.5"/>',
  list: '<path d="M8.5 6h11.5M8.5 12h11.5M8.5 18h11.5"/><path d="M4 6h.5M4 12h.5M4 18h.5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  rename: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  sort: '<path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M14 6h6M14 12h4.5M14 18h3"/>',
  masonry: '<rect x="4" y="4" width="7" height="9" rx="1.5"/><rect x="13" y="4" width="7" height="5" rx="1.5"/><rect x="4" y="15" width="7" height="5" rx="1.5"/><rect x="13" y="11" width="7" height="9" rx="1.5"/>',
  compact: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  marker: '<path d="M14.5 4.5l5 5L11 18H6v-5z"/><path d="M4 21h9"/>',
  pdf: '<path d="M6 3.5h9l4.5 4.5v12.5H6z"/><path d="M15 3.5V8h4.5"/><path d="M9 17.5v-5h1.6a1.5 1.5 0 0 1 0 3H9"/>',
  doc: '<path d="M6 3.5h9l4.5 4.5v12.5H6z"/><path d="M15 3.5V8h4.5"/><path d="M8.5 12.5l1.3 5 1.7-3.6 1.7 3.6 1.3-5"/>',
  print: '<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8" rx="2"/><path d="M7 13.5h10v7H7z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.7"/><path d="M20.5 15.5l-4.5-4.5-9.5 8.5"/>',
  brush: '<path d="M14.5 4.5l5 5-7.5 7.5-5-5z"/><path d="M7 12.5c-2 0-3.5 1.6-3.5 3.6 0 1.4-.6 2.4-1 2.9 1 .6 2.4 1 3.7 1 2.4 0 4.3-1.9 4.3-4.3"/>',
  eraser: '<path d="M8.5 20h11"/><path d="M4.6 15.4l9.3-9.3a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12.4 17.6 8.8 20H7.2z"/><path d="M9.5 10.5l5 5"/>',
  bucket: '<path d="M5.5 11.5l6-6 7 7-6 6a2 2 0 0 1-2.8 0l-4.2-4.2a2 2 0 0 1 0-2.8z"/><path d="M5 12h13"/><path d="M20 16s1.8 2.2 1.8 3.3a1.8 1.8 0 0 1-3.6 0c0-1.1 1.8-3.3 1.8-3.3z"/>',
  external: '<path d="M13.5 4.5h6v6"/><path d="M19.5 4.5l-8 8"/><path d="M17.5 13.5v4a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h4"/>',
  columns: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M12 4.5v15"/>',
};
const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

const COLORS = ['', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'brown', 'gray'];
const COLOR_NAMES = { '': 'Aucune', red: 'Rouge', orange: 'Orange', yellow: 'Jaune', green: 'Vert', teal: 'Turquoise', blue: 'Bleu', purple: 'Violet', pink: 'Rose', brown: 'Marron', gray: 'Gris' };
const PATTERNS = [['none', 'Aucun'], ['dots', 'Points'], ['lines', 'Lignes'], ['grid', 'Carreaux'], ['diag', 'Diagonales'], ['waves', 'Vagues']];
// Couleurs principales proposées : celles des thèmes fantaisie, les couleurs proches réunies en une seule
// (les bleus → un bleu profond et un bleu clair ; vert → celui de la Game Boy ; orange → celui d'Android 2.2).
const BLUE = '#1f5bd6', BLUE_LIGHT = '#1da1e6'; // bleu profond (Luna) et bleu clair (Holo)
const ACCENTS = ['#7c4dff', '#a142f4', '#c2185b', '#d93025', '#ff9900', '#306230', '#33ff66', '#00897b', BLUE_LIGHT, BLUE, '#5f6368', '#000000'];
const DAYS = [[1, 'L'], [2, 'M'], [3, 'M'], [4, 'J'], [5, 'V'], [6, 'S'], [0, 'D']];
const DAY_SHORT = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const DAY_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const VIEWS = { notes: 'Notes', gallery: 'Images', calendar: 'Calendrier', agenda: 'Rappels', tasks: 'Tâches', settings: 'Réglages' };
const VIEW_KEYS = Object.keys(VIEWS);
const THEMES = [['auto', 'Auto'], ['light', 'Clair'], ['grey', 'Gris'], ['dim', 'Ardoise'], ['dark', 'Sombre']];
// Aperçus : [fond, surface, accent]
// Thèmes fantaisie (Apparence → Thèmes fantaisie) : un habillage posé sur un thème de base, avec sa propre couleur.
// [clé, nom, thème de base, couleur principale, barre d'état Android, aperçu]
const SKINS = [
  ['glass', 'Liquid Glass', 'light', BLUE_LIGHT, '#e9edf7', 'radial-gradient(at 20% 15%,#8ec5ff,transparent 60%),radial-gradient(at 85% 30%,#d5a6ff,transparent 55%),radial-gradient(at 60% 95%,#ffc39e,transparent 60%),#eef1f8'],
  ['xp', 'Windows XP', 'light', BLUE, '#0a5fd8', 'linear-gradient(#0997ff,#0053ee) 50% 18%/84% 16% no-repeat,linear-gradient(#fff,#fff) 50% 52%/84% 34% no-repeat,linear-gradient(#3c8d2f,#3c8d2f) 0 100%/30% 16% no-repeat,linear-gradient(#2157d6,#2157d6) 0 100%/100% 16% no-repeat,#5a8ee8'],
  ['vista', 'Vista', 'light', BLUE_LIGHT, '#a8dbe0', 'linear-gradient(rgba(40,60,80,.55),rgba(40,60,80,.55)) 50% 26%/84% 40% no-repeat,linear-gradient(#fff,#fff) 50% 38%/72% 20% no-repeat,linear-gradient(#111,#111) 0 100%/100% 16% no-repeat,linear-gradient(160deg,#d8f1ee,#5bb9b0)'],
  ['lion', 'Mac OS X Lion', 'light', BLUE_LIGHT, '#d6d6d6', 'linear-gradient(#ececec,#cfcfcf) 50% 20%/84% 14% no-repeat,linear-gradient(#fff,#fff) 50% 50%/84% 40% no-repeat,linear-gradient(rgba(255,255,255,.7),rgba(255,255,255,.7)) 50% 94%/70% 10% no-repeat,#c9ccd1'],
  ['kitkat', 'Android KitKat', 'dark', BLUE_LIGHT, '#000000', 'linear-gradient(#222 0 22%,#000 22%,#000 76%,#33b5e5 76%,#33b5e5 79%,#222 79%)'],
  ['froyo', 'Android 2.2', 'dark', '#ff9900', '#2a2a2a', 'linear-gradient(#5c5c5c,#2a2a2a 22%,#000 22%,#000 78%,#4a4a4a 78%,#262626)'],
  ['win31', 'Windows 3.1', 'light', BLUE, '#008080', 'linear-gradient(#000080,#000080) 50% 22%/80% 12% no-repeat,linear-gradient(#fff,#fff) 50% 50%/80% 44% no-repeat,linear-gradient(#c0c0c0,#c0c0c0) 50% 92%/80% 14% no-repeat,#008080'],
  ['mac84', 'Macintosh 1984', 'light', '#000000', '#ffffff', 'repeating-linear-gradient(#000 0 1px,#fff 1px 3px) 50% 20%/84% 12% no-repeat,linear-gradient(#fff,#fff) 50% 52%/84% 44% no-repeat,repeating-conic-gradient(#000 0 25%,#fff 0 50%) 0 0/4px 4px'],
  ['ios6', 'iOS 6', 'light', BLUE, '#6d84a2', 'linear-gradient(#b0bccd,#6d84a2) 0 0/100% 20% no-repeat,repeating-linear-gradient(#fff6a8 0 9px,#a8c8e8 9px 10px) 50% 66%/80% 56% no-repeat,repeating-linear-gradient(90deg,#c5ccd4 0 3px,#cbd2d8 3px 6px)'],
  ['metro', 'Windows Phone', 'dark', BLUE_LIGHT, '#000000', 'linear-gradient(#1ba1e2,#1ba1e2) 18% 30%/36% 30% no-repeat,linear-gradient(#e51400,#e51400) 82% 30%/36% 30% no-repeat,linear-gradient(#339933,#339933) 18% 75%/36% 30% no-repeat,linear-gradient(#a200ff,#a200ff) 82% 75%/36% 30% no-repeat,#000'],
  ['gameboy', 'Game Boy', 'light', '#306230', '#9bbc0f', 'linear-gradient(#0f380f,#0f380f) 50% 22%/80% 10% no-repeat,linear-gradient(#8bac0f,#8bac0f) 50% 58%/80% 40% no-repeat,radial-gradient(circle at 82% 88%,#9a2257 0 9%,transparent 10%),#9bbc0f'],
  ['crt', 'Terminal', 'dark', '#33ff66', '#000000', 'repeating-linear-gradient(transparent 0 2px,rgba(0,0,0,.45) 2px 3px),linear-gradient(#33ff66,#33ff66) 18% 30%/50% 6% no-repeat,linear-gradient(#33ff66,#33ff66) 18% 46%/30% 6% no-repeat,linear-gradient(#1a7a33,#1a7a33) 18% 62%/64% 6% no-repeat,#020a04'],
];
// Polices rétro (Game Boy, Macintosh, Terminal) : chargées seulement quand un de ces thèmes est choisi.
const SKIN_FONTS = { gameboy: 'Pixelify+Sans:wght@400;700', mac84: 'Pixelify+Sans:wght@400;700', crt: 'VT323' };
function loadSkinFont(k) {
  const f = SKIN_FONTS[k];
  if (!f || document.querySelector(`link[data-font="${f}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${f}&display=swap`;
  l.dataset.font = f;
  document.head.appendChild(l);
}
const skinOf = t => SKINS.find(x => x[0] === t);
// Couleur principale : celle choisie dans les réglages, sinon celle du thème fantaisie, sinon la couleur par défaut.
const curAccent = () => S.settings.accent || skinOf(S.settings.theme)?.[3] || ACCENTS[0];
const THEME_PV = { light: ['#f6f7f9', '#ffffff'], grey: ['#dcdfe3', '#eaecef'], dim: ['#24282d', '#333940'], dark: ['#111316', '#1f2328'] };
const AVATARS = ['🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐧', '🦉', '🐙', '🦄', '🐢', '🐝', '🐳', '🐞', '🌵', '🍄', '🌻', '🚀', '☕', '🎧', '🎨', '📚', '⚽'];
const AV_BG = ['#ffd8b5', '#e3e3e3', '#d7e3ea', '#ffe0a8', '#fde2b2', '#cdeec0', '#ead7c6', '#d5e6f7', '#e6dccf', '#f8d0dc', '#eadcf8', '#d3efd9',
  '#fff1a8', '#cfe7fb', '#f9d0cc', '#dcefd0', '#f9d6d0', '#fff0b3', '#dde3f5', '#ecdcd0', '#e3e0f7', '#fde0cf', '#d8e8f0', '#dff0d8'];
// Conflits : champs texte fusionnés ligne par ligne, champs "techniques" jamais présentés à l'utilisateur.
const TEXT_FIELDS = new Set(['body', 'details']);
const SOFT_FIELDS = new Set(['doneAt', 'trashedAt', 'createdAt', 'anchor', 'nextDate', 'streak', 'best', 'count', 'hist', 'lastStreak']);
const FIELD_LABEL = { title: 'Titre', body: 'Texte', details: 'Détails', date: 'Date', time: 'Heure', done: 'Terminée', repeat: 'Répétition', days: 'Jours',
  color: 'Couleur', pattern: 'Motif', pinned: 'Épinglée', archived: 'Archivée', trashed: 'Corbeille', list: 'Liste', starred: 'Favori', dur: 'Durée', name: 'Nom', fromNote: 'Note liée' };
const COLL = ['tasks', 'notes', 'lists', 'images']; // images : galerie des images gardées de notes supprimées
const NOTE_FS = { small: '14.5px', normal: '16px', large: '18.5px' };
const REMIND_WINDOW = 6 * 3600e3; // pas de notification pour un rappel raté depuis plus de 6 h
const TRASH_DAYS = 30;

const HELP_HTML = `<div class="help">
  <code>*gras*</code><b>gras</b>
  <code>_italique_</code><i>italique</i>
  <code>~barré~</code><s>barré</s>
  <code>\`code\`</code><span class="md"><code>code</code></span>
  <code>- élément</code><span>liste à puces (ou <code>* </code>)</span>
  <code>1. élément</code><span>liste numérotée</span>
  <code>[ ] élément</code><span>case à cocher (<code>[x]</code> = cochée)</span>
  <code># Titre</code><span>titre de section</span>
  <code>&gt; texte</code><span>citation</span>
  <code>{rouge:texte}</code><span class="tc-rouge">texte en couleur</span>
  <code>{/jaune:texte}</code><span class="hl-jaune">texte surligné</span>
</div><p class="small muted" style="margin-top:8px">La mise en forme s'affiche pendant la frappe. Entrée continue la liste en cours, Entrée sur un élément vide l'arrête. Touche une case pour la cocher, ou la cloche pour en faire une tâche planifiée. Les boutons <b>A</b> (couleur) et surligneur s'appliquent à la sélection, ou à la ligne entière s'il n'y a pas de sélection. Dans la liste, un appui long sur une note permet d'en sélectionner plusieurs.</p>`;

// ================= État =================
let S = emptyState();
let user = null;
// Mode local : pas de compte, rien n'est envoyé au serveur, tout reste sur cet appareil.
// Les noms de compte du serveur commencent par une lettre : ce nom ne peut pas en être un.
const LOCAL = '~local';
const isLocal = () => user === LOCAL;
const uname = () => isLocal() ? 'Cet appareil' : user || '';
let account = { lastSeen: 0, devices: 0 };
let gen = 0, syncing = false, syncAgain = false, pushTimer = null, lastSync = 0, online = true;
let rev = '';        // révision serveur connue (sert à l'attente longue)
let pushOn = false;  // notifications push actives sur cet appareil
let srvStatus = null;
let serverLost = []; // éléments présents sur cet appareil mais perdus sur le serveur (voir applyServer) // { cronAge, pushDevices } : état de l'envoi automatique côté serveur
// Côté utilisateur, on suppose l'envoi automatique actif (seul l'administrateur voit son état réel).
const cronOk = () => !srvStatus || !srvStatus.admin || (srvStatus.cronAge != null && srvStatus.cronAge < 180);
let view = 'notes';
let BASE = { tasks: {}, notes: {}, lists: {}, images: {} }; // dernière version reçue du serveur pour chaque élément (sert à détecter les conflits)
const pendingConf = new Set();                  // conflits en attente d'une réponse de l'utilisateur
let curList = lsGet('rp_list') ?? 'all'; // 'all' | 'starred' | '' (Mes tâches) | id de liste
let noteFilter = 'notes';                  // 'notes' | 'archive' | 'trash'
// Affichage des notes : 'masonry' (dynamique), 'grid' (carrés), 'compact' (une par ligne)
let nLayout = { rows: 'compact' }[lsGet('rp_nlayout')] || lsGet('rp_nlayout') || 'masonry';
if (!['masonry', 'grid', 'compact'].includes(nLayout)) nLayout = 'masonry';
// Même choix d'affichage pour les autres onglets (chacun retient le sien).
const LAYOUTS = [['masonry', 'Dynamique'], ['grid', 'Carrés'], ['compact', 'Liste']];
const lay = Object.fromEntries(Object.entries({ agenda: 'compact', tasks: 'compact', gallery: 'masonry' })
  .map(([k, d]) => [k, LAYOUTS.some(([v]) => v === lsGet('rp_lay_' + k)) ? lsGet('rp_lay_' + k) : d]));
const layOf = k => k === 'notes' ? nLayout : lay[k];
function setLayout(k, v) {
  if (k === 'notes') { nLayout = v; lsSet('rp_nlayout', v); } else { lay[k] = v; lsSet('rp_lay_' + k, v); }
  render();
}
// Boutons Dynamique / Carrés / Liste : identiques dans chaque onglet.
function renderVsegs() {
  for (const el of $$('.vseg[data-lay]')) {
    if (!el.childElementCount) el.innerHTML = LAYOUTS.map(([v, l]) => `<button type="button" data-lv="${v}" title="${l}" aria-label="Affichage : ${l.toLowerCase()}">${icon(v)}</button>`).join('');
    const cur = layOf(el.dataset.lay);
    for (const b of el.children) { b.classList.toggle('on', b.dataset.lv === cur); b.setAttribute('aria-pressed', b.dataset.lv === cur); }
  }
}
// Conteneur des tâches / rappels selon l'affichage choisi.
const tgrid = (k, items) => items.length ? `<div class="tgrid v-${lay[k]}">${items.join('')}</div>` : '';
let selNotes = null; // sélection multiple (Set d'ids) ou null
let justAdded = null; // id du dernier élément créé : animé à son apparition
const flashNew = () => {
  if (!justAdded) return;
  $(`.task[data-id="${justAdded}"], .note[data-id="${justAdded}"]`)?.classList.add('new');
  justAdded = null;
};
let doneOpen = lsGet('rp_done_open') !== '0'; // section « Terminées » ouverte par défaut, choix retenu

function emptyState() { return { tasks: {}, notes: {}, lists: {}, images: {}, fired: {}, settings: {} }; }
function obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
function normalize(st) {
  st = obj(st);
  return { tasks: obj(st.tasks), notes: obj(st.notes), lists: obj(st.lists), images: obj(st.images), fired: obj(st.fired), settings: obj(st.settings) };
}
function uid() { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
function lsDel(k) { try { localStorage.removeItem(k); } catch {} }
const live = k => Object.values(S[k]).filter(x => x && !x.deleted);
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;

const clone = o => JSON.parse(JSON.stringify(o));
// Un élément est "modifié localement" si sa version diffère de la dernière reçue du serveur.
const isDirty = (k, id) => { const b = BASE[k][id]; return !b || b.updatedAt !== S[k][id].updatedAt; };
const dirtyCount = () => COLL.reduce((n, k) => n + Object.keys(S[k]).filter(id => isDirty(k, id)).length, 0);

function save() {
  if (!user) return;
  lsSet('rp_state:' + user, JSON.stringify(S));
  lsSet('rp_base:' + user, JSON.stringify(BASE));
}

let saveTimer = null;
function flushSave() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; save(); } }
// À appeler après chaque modification : sauvegarde locale + envoi au serveur.
// lazy : frappe dans une note → la sauvegarde locale est regroupée (au plus 0,4 s plus tard, ou à la mise en arrière-plan).
function changed(opts = {}) {
  gen++;
  if (opts.lazy) { if (!saveTimer) saveTimer = setTimeout(flushSave, 400); }
  else { clearTimeout(saveTimer); saveTimer = null; save(); }
  setDot('pending');
  clearTimeout(pushTimer);
  pushTimer = setTimeout(sync, opts.delay ?? 250);
  if (!opts.quiet) render();
}

// ================= Serveur =================
async function api(action, data, signal) {
  if (isLocal()) { const e = new Error('Indisponible en mode local'); e.status = 0; throw e; }
  const res = await fetch('api.php?a=' + action, {
    method: 'POST',
    signal,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  });
  let j = {};
  try { j = await res.json(); } catch {}
  if (!res.ok) {
    const e = new Error(j.error || 'Erreur ' + res.status);
    e.status = res.status;
    if (res.status === 401 && action !== 'login') showAuth();
    throw e;
  }
  return j;
}

async function sync() {
  if (!user) return false;
  if (isLocal()) { // rien à envoyer : tout est déjà enregistré sur l'appareil
    rollover();
    save();
    lastSync = Date.now();
    online = true;
    setDot('ok');
    render();
    checkReminders();
    return true;
  }
  if (syncing) { syncAgain = true; return true; }
  let ok = false;
  syncing = true;
  const g = gen;
  // On n'envoie que les éléments modifiés, avec "bv" = la version serveur dont ils dérivent.
  const payload = { fired: S.fired, settings: S.settings }, sent = {};
  for (const k of COLL) {
    payload[k] = {};
    sent[k] = {};
    for (const [id, it] of Object.entries(S[k])) {
      if (pendingConf.has(k + ':' + id) || !isDirty(k, id)) continue;
      const b = BASE[k][id];
      payload[k][id] = b ? { ...it, bv: b.updatedAt } : it;
      sent[k][id] = it.updatedAt;
    }
  }
  try {
    const r = await api('sync', { state: payload });
    applyServer(normalize(r.state), sent);
    if (r.rev) rev = r.rev;
    ok = true;
    flushUploads();
    rollover();
    save();
    lastSync = Date.now();
    online = true;
    setDot(gen === g && !dirtyCount() ? 'ok' : 'pending');
    render();
    refreshEditor();
    checkReminders();
  } catch (e) {
    if (e.status !== 401) { online = false; setDot('off'); renderSide(); }
  } finally {
    syncing = false;
    if (syncAgain) { syncAgain = false; sync(); }
  }
  return ok;
}

// ----- Temps réel : attente longue -----
// Une requête reste en attente sur le serveur et revient dès qu'un autre appareil modifie quelque chose :
// les changements arrivent en moins d'une seconde quand l'appli est ouverte sur plusieurs appareils.
let waiting = false, waitCtl = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitLoop() {
  if (waiting || !user || isLocal()) return;
  waiting = true;
  let fails = 0;
  while (user && !document.hidden) {
    try {
      waitCtl = new AbortController();
      const r = await api('wait', { rev }, waitCtl.signal);
      fails = 0;
      if (r.rev && r.rev !== rev && !(await sync())) await sleep(3000);
    } catch (e) {
      if (e.name === 'AbortError' || e.status === 401) break;
      fails++;
      await sleep(Math.min(30000, 1500 * fails));
    }
  }
  waiting = false;
}
function stopWait() { waitCtl?.abort(); }

// ----- Notifications push (Web Push) -----
const b64ToU8 = s => {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  s += '='.repeat((4 - s.length % 4) % 4);
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
};
// Abonne cet appareil : le serveur pourra le réveiller pour un rappel, même page fermée ou en arrière-plan.
async function enablePush() {
  if (isLocal() || !('serviceWorker' in navigator) || !('PushManager' in window) || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  const { key } = await api('vapid');
  let sub = await reg.pushManager.getSubscription();
  const cur = sub?.options?.applicationServerKey;
  if (sub && cur && btoa(String.fromCharCode(...new Uint8Array(cur))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') !== key) {
    await sub.unsubscribe(); // clé serveur changée
    sub = null;
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(key) });
  await api('pushsub', { sub: sub.toJSON() });
  pushOn = true;
  return true;
}
async function disablePush() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await api('pushunsub', { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); }
  } catch {}
  pushOn = false;
}

// Intègre la réponse du serveur et repère les éléments modifiés des deux côtés.
function applyServer(srv, sent) {
  const conflicts = [];
  // Le serveur renvoie toujours l'état complet. Un élément déjà synchronisé (connu dans BASE), non supprimé ici,
  // qui n'y figure plus a été perdu côté serveur : on le garde pour pouvoir le restaurer depuis cet appareil.
  serverLost = [];
  for (const k of COLL) {
    for (const id of Object.keys(BASE[k])) {
      if (srv[k][id] || !S[k][id] || S[k][id].deleted || pendingConf.has(k + ':' + id)) continue;
      serverLost.push({ k, id });
    }
  }
  for (const k of COLL) {
    for (const [id, T] of Object.entries(srv[k])) {
      const L = S[k][id], B = BASE[k][id];
      if (!L || L.updatedAt === T.updatedAt || !isDirty(k, id)) { S[k][id] = T; BASE[k][id] = clone(T); continue; }
      // Notre envoi a été accepté, mais on a encore modifié l'élément depuis : on repart de cette version.
      if (sent[k][id] === T.updatedAt) { BASE[k][id] = clone(T); continue; }
      if (B && B.updatedAt === T.updatedAt) continue; // rien de nouveau côté serveur
      if (pendingConf.has(k + ':' + id)) continue;
      conflicts.push({ k, id, B: B ? clone(B) : null, T });
    }
  }
  for (const [id, v] of Object.entries(srv.fired)) if (!((S.fired[id] || 0) >= v)) S.fired[id] = v;
  if ((srv.settings.updatedAt || 0) > (S.settings.updatedAt || 0)) S.settings = srv.settings;
  if (conflicts.length) handleConflicts(conflicts);
}

// ================= Conflits =================
// Valeurs "vides" équivalentes (undefined, '', false, 0, []).
const normV = v => (v == null || v === '' || v === false || v === 0 || (Array.isArray(v) && !v.length)) ? null : v;
const eqV = (a, b) => JSON.stringify(normV(a)) === JSON.stringify(normV(b));
const contentKeys = (...objs) => [...new Set(objs.flatMap(o => o ? Object.keys(o) : []))].filter(k => k !== 'updatedAt' && k !== 'id' && k !== 'bv');
const sameContent = (a, b) => contentKeys(a, b).every(k => eqV(a[k], b[k]));

// Plus longue sous-séquence commune de lignes : Map indexA → indexB.
function lcsMap(a, b) {
  const map = new Map();
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) { map.set(s, s); s++; }
  let ea = a.length, eb = b.length;
  while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
  const n = ea - s, m = eb - s;
  if (n && m) {
    if (n * m > 4e6) return null;
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[s + i] === b[s + j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
    for (let i = 0, j = 0; i < n && j < m;) {
      if (a[s + i] === b[s + j]) { map.set(s + i, s + j); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
  }
  for (let k = 0; ea + k < a.length; k++) map.set(ea + k, eb + k);
  return map;
}

// Fusion à 3 sources ligne par ligne (base, cet appareil, l'autre).
// Les changements qui ne se chevauchent pas sont fusionnés ; les autres forment des "blocs en conflit".
// Fusion à 3 sources générique sur des tableaux (lignes ou caractères).
function diff3(b, m, t, refine) {
  const mm = lcsMap(b, m), tm = lcsMap(b, t);
  if (!mm || !tm) return { ok: false, mine: m, theirs: t, both: [...m, ...t], hunks: [{ m, t }] };
  const mine = [], theirs = [], both = [], hunks = [];
  let ib = 0, im = 0, it = 0;
  const same = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
  const chunk = (be, me, te) => {
    const bp = b.slice(ib, be), mp = m.slice(im, me), tp = t.slice(it, te);
    let res = same(mp, tp) ? mp : same(mp, bp) ? tp : same(tp, bp) ? mp : null;
    if (!res && !bp.length) res = [...mp, ...tp]; // ajouts au même endroit des deux côtés : on garde les deux
    if (!res && refine) res = refine(bp, mp, tp); // ex. : même ligne modifiée des deux côtés → essai caractère par caractère
    if (res) { mine.push(...res); theirs.push(...res); both.push(...res); }
    else { hunks.push({ m: mp, t: tp }); mine.push(...mp); theirs.push(...tp); both.push(...mp, ...tp); }
    ib = be; im = me; it = te;
  };
  while (ib < b.length || im < m.length || it < t.length) {
    let k = 0;
    while (ib + k < b.length && mm.get(ib + k) === im + k && tm.get(ib + k) === it + k) k++;
    if (k) {
      const s = b.slice(ib, ib + k);
      mine.push(...s); theirs.push(...s); both.push(...s);
      ib += k; im += k; it += k;
      continue;
    }
    let i = ib;
    while (i < b.length && !(mm.has(i) && tm.has(i))) i++;
    if (i >= b.length) { chunk(b.length, m.length, t.length); break; }
    chunk(i, mm.get(i), tm.get(i));
  }
  return { ok: !hunks.length, mine, theirs, both, hunks };
}

// Fusion de texte : d'abord ligne par ligne ; si les deux ont modifié les mêmes lignes,
// on retente caractère par caractère (deux personnes qui écrivent sur la même ligne en même temps).
function merge3(bs, ms, ts) {
  const byChar = (bp, mp, tp) => {
    const B = Array.from(bp.join('\n')), M = Array.from(mp.join('\n')), T = Array.from(tp.join('\n'));
    if (B.length * Math.max(M.length, T.length) > 4e6) return null;
    const r = diff3(B, M, T);
    return r.ok ? r.mine.join('').split('\n') : null;
  };
  const r = diff3(bs.split('\n'), ms.split('\n'), ts.split('\n'), byChar);
  const j = a => a.join('\n');
  return { ok: r.ok, text: j(r.mine), mine: j(r.mine), theirs: j(r.theirs), both: j(r.both), hunks: r.hunks };
}

// Images : ajouts des deux côtés conservés, suppressions respectées.
function mergeImages(b, m, t) {
  const ids = a => new Set((a || []).map(x => x.id));
  const B = ids(b), T = ids(t), Mi = ids(m);
  const res = (m || []).filter(x => T.has(x.id) || !B.has(x.id));
  for (const x of t || []) if (!Mi.has(x.id) && !B.has(x.id)) res.push(x);
  return res;
}

// Analyse automatique : ce qui peut être fusionné l'est, le reste est à trancher.
function analyzeConflict(B, M, T) {
  if (M.deleted || T.deleted) {
    if (M.deleted && T.deleted) return { auto: T };
    const mod = M.deleted ? T : M;
    // Le côté "modifié" n'a en fait rien changé depuis la base : la suppression l'emporte.
    if (B && !B.deleted && sameContent(mod, B)) return { auto: M.deleted ? M : T };
    return { type: 'delete', mod, here: !!M.deleted };
  }
  const base = B && !B.deleted ? B : null;
  const out = {}, conf = [];
  let merged = 0;
  for (const key of contentKeys(base, M, T)) {
    const b = base?.[key], m = M[key], t = T[key];
    if (key === 'images') { out[key] = mergeImages(b, m, t); if (!eqV(out[key], m)) merged++; continue; }
    if (eqV(m, t)) out[key] = m;
    else if (base && eqV(m, b)) { out[key] = t; merged++; }
    else if (base && eqV(t, b)) out[key] = m;
    else if (SOFT_FIELDS.has(key)) out[key] = M.updatedAt >= T.updatedAt ? m : t;
    else if (TEXT_FIELDS.has(key)) {
      const r = merge3(String(b ?? ''), String(m ?? ''), String(t ?? ''));
      if (r.ok) { out[key] = r.text; merged++; }
      else { out[key] = m; conf.push({ key, m, t, r }); }
    } else { out[key] = m; conf.push({ key, m, t }); }
  }
  return conf.length ? { type: 'fields', out, conf, merged } : { auto: out, merged };
}

function resolveWith(c, item) {
  S[c.k][c.id] = { ...item, id: c.id, updatedAt: Date.now() };
  BASE[c.k][c.id] = clone(c.T); // la prochaine synchro remplacera proprement la version serveur
  pendingConf.delete(c.k + ':' + c.id);
  if (c.k === 'notes' && c.id === curNote) forceEditor();
}

async function handleConflicts(list) {
  let auto = 0;
  const toAsk = [];
  for (const c of list) {
    const a = analyzeConflict(c.B, S[c.k][c.id], c.T);
    if (a.auto) { resolveWith(c, a.auto); auto++; }
    else { pendingConf.add(c.k + ':' + c.id); toAsk.push(c); }
  }
  if (auto) {
    changed({ quiet: !!overlays.length });
    toast(`${plural(auto, 'modification')} faite${auto > 1 ? 's' : ''} sur un autre appareil fusionnée${auto > 1 ? 's' : ''} automatiquement`);
  }
  for (const c of toAsk) await conflictDialog(c);
}

function fmtField(key, v) {
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '—';
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (key === 'color') return COLOR_NAMES[v] || v;
  if (key === 'list') return listName(v);
  if (key === 'date') return fmtDate({ date: v });
  if (key === 'days') return v.map(d => DAY_SHORT[d]).join(', ');
  if (key === 'repeat') return fmtRepeat({ repeat: v, days: [] }) || 'Aucune';
  if (key === 'pattern') return (PATTERNS.find(p => p[0] === v) || [, v])[1];
  if (key === 'fromNote') return S.notes[v]?.title || 'Note';
  return String(v);
}

async function conflictDialog(c) {
  const M = S[c.k][c.id];
  const a = analyzeConflict(c.B, M, c.T); // recalculé : l'élément a pu changer entre-temps
  if (a.auto) { resolveWith(c, a.auto); changed(); return; }
  const what = { tasks: 'La tâche', notes: 'La note', lists: 'La liste' }[c.k];
  const ref = a.mod || M;
  const name = ref.title || ref.name || c.T.title || c.T.name || 'Sans titre';

  if (a.type === 'delete') {
    const r = await dialog({
      title: 'Conflit de synchronisation',
      text: `${what} « ${name} » a été supprimée ${a.here ? 'sur cet appareil' : 'sur un autre appareil'}, mais modifiée ${a.here ? 'sur un autre' : 'sur celui-ci'} entre-temps.`,
      buttons: [{ label: 'Supprimer', value: 'del', danger: true }, { label: 'Garder la version modifiée (recommandé)', value: 'keep', primary: true }],
      col: true,
    });
    resolveWith(c, r?.value === 'del' ? { deleted: true } : { ...a.mod, deleted: false });
    changed();
    return;
  }

  // Recommandation : les deux si du texte est en conflit (rien n'est perdu), sinon la plus récente.
  const hasText = a.conf.some(f => f.r);
  const rec = hasText ? 'both' : M.updatedAt >= c.T.updatedAt ? 'm' : 't';
  const show = (f, side) => f.r ? f.r.hunks.map(h => h[side].join('\n')).join('\n…\n') || '(supprimé)' : fmtField(f.key, f[side]);
  const html = `<div class="conf">
    ${a.merged ? `<div class="conf-auto">${icon('check')}${plural(a.merged, 'modification')} de l'autre appareil déjà fusionnée${a.merged > 1 ? 's' : ''}</div>` : ''}
    ${a.conf.map(f => `<div class="conf-f"><b>${esc(FIELD_LABEL[f.key] || f.key)}</b><div class="conf-cols">
      <div><small>Cet appareil</small>${esc(show(f, 'm'))}</div><div><small>Autre appareil</small>${esc(show(f, 't'))}</div></div></div>`).join('')}
  </div>`;
  const lbl = (v, l) => l + (rec === v ? ' (recommandé)' : '');
  const r = await dialog({
    title: 'Conflit de synchronisation',
    text: `${what} « ${name} » a été modifiée ici et sur un autre appareil. Quelle version garder ?`,
    html,
    buttons: [
      { label: lbl('m', 'Garder cet appareil'), value: 'm', primary: rec === 'm' },
      { label: lbl('t', "Garder l'autre appareil"), value: 't', primary: rec === 't' },
      { label: lbl('both', 'Garder les deux'), value: 'both', primary: rec === 'both' },
    ],
    col: true,
  });
  const choice = r?.value || rec;
  const pick = side => {
    const o = { ...a.out };
    for (const f of a.conf) o[f.key] = f.r ? (side === 'm' ? f.r.mine : f.r.theirs) : f[side];
    return o;
  };
  if (choice !== 'both') { resolveWith(c, pick(choice)); changed(); return; }

  // Les deux : seules les parties modifiées sont dupliquées.
  const o = { ...a.out };
  let dup = false;
  for (const f of a.conf) {
    if (f.r) o[f.key] = f.r.both;
    else if ((f.key === 'title' || f.key === 'name') && c.k !== 'tasks') o[f.key] = [f.m, f.t].filter(Boolean).join(' / ');
    else { o[f.key] = f.m; if (c.k === 'tasks') dup = true; }
  }
  resolveWith(c, o);
  if (dup) {
    const d = pick('t'), now = Date.now();
    d.id = uid();
    S.tasks[d.id] = { ...d, createdAt: now, updatedAt: now };
  }
  changed();
  toast(dup ? 'Les deux versions ont été gardées (tâche dupliquée)' : 'Les deux versions ont été gardées');
}

function setDot(state) {
  $$('.dot').forEach(d => {
    d.className = 'dot ' + state;
    d.title = isLocal() && state !== 'off' ? 'Enregistré sur cet appareil' : { ok: 'Synchronisé', pending: 'Synchronisation…', off: 'Hors ligne — les modifications seront envoyées plus tard' }[state] || '';
  });
}

// ================= Dates =================
const pad = n => String(n).padStart(2, '0');
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function today(off = 0) { const d = new Date(); d.setDate(d.getDate() + off); return ymd(d); }
function dayDiff(s) { const d = new Date(s + 'T00:00'), t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((d - t) / 864e5); }
function dueMs(t) { return t.date && t.time && !t.done ? new Date(t.date + 'T' + t.time).getTime() : 0; }
function isLate(t) { if (!t.date || t.done) return false; return t.time ? dueMs(t) < Date.now() : dayDiff(t.date) < 0; }
const hm = d => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function fmtDate(t) {
  if (!t.date) return '';
  const n = dayDiff(t.date), d = new Date(t.date + 'T00:00');
  let s = n === 0 ? "Aujourd'hui" : n === 1 ? 'Demain' : n === -1 ? 'Hier'
    : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  if (t.time) s += ' · ' + t.time + (t.dur ? '–' + endTime(t) : '');
  return s;
}

// "à l'instant", "il y a 5 min", "aujourd'hui à 14:02", "hier à 21:14", "le 3 sept. à 09:10"
function fmtAgo(ms) {
  if (!ms) return '—';
  const diff = Date.now() - ms, d = new Date(ms), n = dayDiff(ymd(d));
  if (diff < 60e3) return "à l'instant";
  if (diff < 3600e3) return `il y a ${Math.round(diff / 60e3)} min`;
  if (n === 0) return "aujourd'hui à " + hm(d);
  if (n === -1) return 'hier à ' + hm(d);
  return 'le ' + d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }) + ' à ' + hm(d);
}

function fmtRepeat(t) {
  switch (t.repeat) {
    case 'daily': return 'Tous les jours';
    case 'weekly': case 'days': {
      const ds = DAYS.filter(([v]) => (t.days || []).includes(v)).map(([v]) => v);
      if (ds.length === 1) return 'Chaque ' + DAY_LONG[ds[0]];
      if (ds.length === 7) return 'Tous les jours';
      return ds.length ? 'Chaque semaine : ' + ds.map(v => DAY_SHORT[v]).join(', ') : 'Chaque semaine';
    }
    case 'monthly': return 'Chaque mois';
    case 'yearly': return 'Chaque année';
    default: return '';
  }
}

const isRep = t => !!t.repeat && t.repeat !== 'none';
const streaksOn = () => S.settings.streaks !== false; // suivi des séries (actif par défaut)
const weekday = s => new Date((s || today()) + 'T00:00').getDay();
function fmtDay(s) {
  const n = dayDiff(s);
  if (n === 0) return "aujourd'hui";
  if (n === 1) return 'demain';
  return new Date(s + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Les tâches répétitives cochées reviennent (décochées) le jour de leur prochaine occurrence.
function rollover() {
  if (!user) return;
  const td = today();
  let k = 0;
  for (const t of live('tasks')) {
    if (!t.done || !isRep(t) || !t.nextDate || t.nextDate > td) continue;
    S.tasks[t.id] = { ...t, date: t.nextDate, nextDate: '', done: false, doneAt: 0, updatedAt: Date.now() };
    k++;
  }
  if (k) changed({ quiet: true });
}

// Prochaine occurrence d'une tâche répétitive (toujours après aujourd'hui).
function nextDate(t) {
  const d = new Date(t.date + 'T00:00');
  const anchor = t.anchor || d.getDate();
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  stepOcc(t, d, anchor);
  for (let i = 0; d <= t0 && i < 2000; i++) stepOcc(t, d, anchor);
  return ymd(d);
}
// Avance la date `d` (modifiée sur place) à l'occurrence suivante d'une tâche répétitive.
function stepOcc(t, d, anchor) {
  switch (t.repeat) {
    case 'weekly': case 'days':
      if (t.days && t.days.length) do d.setDate(d.getDate() + 1); while (!t.days.includes(d.getDay()));
      else d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setDate(1); d.setMonth(d.getMonth() + 1);
      d.setDate(Math.min(anchor, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
      break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    default: d.setDate(d.getDate() + 1);
  }
}
// Heure de fin d'un rendez-vous qui a une durée.
function endTime(t) {
  if (!t.time || !t.dur) return '';
  const [h, m] = t.time.split(':').map(Number), e = Math.min(24 * 60 - 1, h * 60 + m + t.dur);
  return pad(Math.floor(e / 60)) + ':' + pad(e % 60);
}

// ================= Mise en forme des notes (façon WhatsApp) =================
const RE_CHECK = /^(\s*)\[([ xX])\](?: (.*))?$/;
const RE_BUL = /^(\s*)[-*•] (.*)$/;
const RE_NUM = /^(\s*)(\d+)([.)]) (.*)$/;
const RE_HEAD = /^#{1,3} (.*)$/;
const RE_QUOTE = /^> ?(.*)$/;
// Image placée dans le texte : une ligne « [img:ID] » (le texte éventuel qui suit s'affiche sous l'image).
// Taille facultative : « [img:ID|s] » petite, « |m » moyenne, rien = pleine largeur. Groupes : 1 id, 2 taille, 3 texte qui suit.
const RE_IMG = /^\[img:([a-z][a-z0-9]{3,47})(?:\|([sm]))?\](.*)$/i;
let imgMove = null; // image en cours de déplacement dans le texte (mode déplacement)
const imgMark = (id, size) => `[img:${id}${size === 's' || size === 'm' ? '|' + size : ''}]`;
// Note en deux colonnes : une ligne « [colonne] » marque le début de la 2e colonne (la retirer = une seule colonne).
const COL_MARK = '[colonne]', RE_COL = /^\[colonne\]$/;
const hasCols = body => String(body || '').split('\n').some(l => RE_COL.test(l));
const inlineImgIds = body => new Set(String(body || '').split('\n').map(l => l.match(RE_IMG)?.[1]).filter(Boolean));
const TCOLORS = [['', 'Sans couleur'], ['rouge', 'Rouge'], ['orange', 'Orange'], ['jaune', 'Jaune'], ['vert', 'Vert'], ['bleu', 'Bleu'], ['violet', 'Violet'], ['rose', 'Rose'], ['gris', 'Gris']];
const HLS = [['', 'Sans surlignage'], ['jaune', 'Jaune'], ['vert', 'Vert'], ['bleu', 'Bleu'], ['rose', 'Rose'], ['orange', 'Orange'], ['violet', 'Violet']];
// Couleur et surlignage : {rouge:texte}  {/jaune:texte}  {rouge/jaune:texte}
const RE_TCOLOR = /\{((?:rouge|orange|jaune|vert|bleu|violet|rose|gris)(?:\/(?:jaune|vert|bleu|rose|orange|violet))?|\/(?:jaune|vert|bleu|rose|orange|violet)):([^{}\n]*)\}/g;
const styleCls = sp => { const [fg, bg] = sp.split('/'); return [fg && 'tc-' + fg, bg && 'hl-' + bg].filter(Boolean).join(' '); };
const RE_PREFIX = /^(\s*)(\[[ xX]\] ?|[-*•] |\d+[.)] |#{1,3} |> ?)?/;
const cleanText = s => String(s || '').replace(RE_TCOLOR, '$2').replace(/[*_~`]/g, '').trim();

function fmtMarks(s) {
  const mark = m => new RegExp(`(^|[^\\p{L}\\p{N}${m}])${m}([^\\s${m}](?:[^${m}\\n]*?[^\\s${m}])?)${m}(?![\\p{L}\\p{N}${m}])`, 'gu');
  return s
    .replace(RE_TCOLOR, (_, sp, t) => `<span class="${styleCls(sp)}">${t}</span>`)
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(mark('\\*'), '$1<b>$2</b>')
    .replace(mark('_'), '$1<i>$2</i>')
    .replace(mark('~'), '$1<s>$2</s>');
}

function fmtInline(text, links = true) {
  return String(text).split(/(https?:\/\/[^\s]+)/g).map((p, i) => {
    if (i % 2) return links ? `<a href="${esc(p)}" target="_blank" rel="noopener">${esc(p)}</a>` : `<span class="lnk">${esc(p)}</span>`;
    return fmtMarks(esc(p));
  }).join('');
}

// Rendu ligne par ligne. data-line = index de la ligne dans le texte brut.
function renderBody(body, o = {}) {
  // Images placées dans le texte : absentes des aperçus (seul le texte qui les suit reste).
  let rows = String(body || '').split('\n').map((l, i) => [l, i]).map(([l, i]) => { const m = l.match(RE_IMG); return m ? (m[3] ? [m[3], i] : null) : [l, i]; }).filter(Boolean);
  if (o.compact) {
    // Aperçu : pas de lignes vides en début/fin, et jamais deux lignes vides de suite.
    rows = rows.filter(([l], k) => l.trim() || (k > 0 && rows[k - 1][0].trim()));
    while (rows.length && !rows[0][0].trim()) rows.shift();
    while (rows.length && !rows[rows.length - 1][0].trim()) rows.pop();
  }
  let clipped = false;
  if (o.maxLines && rows.length > o.maxLines) { rows = rows.slice(0, o.maxLines); clipped = true; }
  const ind = s => s ? ` style="padding-left:${Math.min(Math.floor(s.replace(/\t/g, '  ').length / 2), 6) * 1.4}em"` : '';
  const html = rows.map(([l, i]) => {
    let m;
    if (RE_COL.test(l)) return null;
    if ((m = l.match(RE_CHECK))) {
      const on = m[2] !== ' ', txt = m[3] || '';
      let plan = '';
      if (o.plan && cleanText(txt)) {
        const t = linkedTask(o.noteId, txt);
        plan = `<button class="plan ${t ? 'on' : ''}" data-act="nplan" data-line="${i}" title="${t ? 'Voir la tâche liée' : 'Planifier en tâche'}" aria-label="${t ? 'Voir la tâche liée' : 'Planifier en tâche'}">${icon(t ? 'bell' : 'bellPlus')}</button>`;
      }
      return `<div class="ln ck ${on ? 'on' : ''}" data-line="${i}"${ind(m[1])}><button class="cbx" data-act="ncheck" data-line="${i}" aria-label="${on ? 'Décocher' : 'Cocher'}">${on ? icon('check') : ''}</button><span class="lt">${fmtInline(txt, o.links) || '&nbsp;'}</span>${plan}</div>`;
    }
    if ((m = l.match(RE_BUL))) return `<div class="ln bl" data-line="${i}"${ind(m[1])}><span class="mk">•</span><span class="lt">${fmtInline(m[2], o.links)}</span></div>`;
    if ((m = l.match(RE_NUM))) return `<div class="ln bl" data-line="${i}"${ind(m[1])}><span class="mk num">${m[2]}${m[3]}</span><span class="lt">${fmtInline(m[4], o.links)}</span></div>`;
    if ((m = l.match(RE_HEAD))) return `<div class="ln h" data-line="${i}">${fmtInline(m[1], o.links)}</div>`;
    if ((m = l.match(RE_QUOTE))) return `<div class="ln q" data-line="${i}">${fmtInline(m[1], o.links) || '&nbsp;'}</div>`;
    if (!l.trim()) return `<div class="ln empty" data-line="${i}"></div>`;
    return `<div class="ln" data-line="${i}">${fmtInline(l, o.links)}</div>`;
  });
  const more = clipped ? '<div class="ln more">…</div>' : '';
  const k = html.indexOf(null);
  if (k < 0) return html.join('') + more;
  const col = a => `<div class="mcol">${a.filter(x => x !== null).join('')}</div>`;
  return `<div class="mcols">${col(html.slice(0, k))}${col(html.slice(k + 1))}</div>` + more;
}

function linkedTask(noteId, txt) {
  const title = cleanText(txt);
  return title ? live('tasks').find(t => t.fromNote === noteId && t.title === title) : null;
}

// ================= Listes de tâches =================
const listsSorted = () => live('lists').sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
const validList = id => !id || (S.lists[id] && !S.lists[id].deleted);
const taskList = t => validList(t.list) ? (t.list || '') : '';
const listName = id => id && validList(id) ? S.lists[id].name : 'Mes tâches';

function createList(name) {
  const now = Date.now();
  const l = { id: uid(), name: name.trim().slice(0, 80) || 'Liste', createdAt: now, updatedAt: now };
  S.lists[l.id] = l;
  return l;
}

function setList(id) { curList = id; lsSet('rp_list', id); }

async function newList() {
  const name = await ask('Nouvelle liste', '', 'Créer', 'Ex. Courses, Travail…');
  if (!name) return null;
  const l = createList(name);
  setList(l.id);
  changed();
  return l;
}

async function listMenu() {
  const id = curList, real = !!id && validList(id);
  const items = [];
  if (real) items.push({ label: 'Renommer', icon: 'rename', value: 'rename' });
  items.push({ label: 'Copier dans une note (cases à cocher)', icon: 'notes', value: 'tonote' });
  items.push({ label: 'Supprimer les tâches terminées', icon: 'check', value: 'cleardone' });
  if (real) items.push({ label: 'Supprimer la liste', icon: 'trash', value: 'delete', danger: true });
  const r = await menu(listName(id), items);
  if (r === 'rename') {
    const name = await ask('Renommer la liste', S.lists[id].name, 'Renommer');
    if (name) { S.lists[id] = { ...S.lists[id], name: name.slice(0, 80), updatedAt: Date.now() }; changed(); }
  } else if (r === 'tonote') listToNote(id);
  else if (r === 'cleardone') clearDone(t => taskList(t) === id);
  else if (r === 'delete') deleteList(id);
}

async function deleteList(id) {
  const ts = live('tasks').filter(t => taskList(t) === id);
  const r = await dialog({
    title: `Supprimer « ${listName(id)} » ?`,
    text: ts.length ? `Cette liste contient ${plural(ts.length, 'tâche')}.` : 'La liste est vide.',
    buttons: [
      { label: 'Annuler' },
      ...(ts.length ? [{ label: 'Garder les tâches', value: 'keep' }] : []),
      { label: ts.length ? 'Tout supprimer' : 'Supprimer', value: 'all', danger: true },
    ],
  });
  if (!r) return;
  const now = Date.now();
  for (const t of ts) {
    S.tasks[t.id] = r.value === 'all' ? { id: t.id, deleted: true, updatedAt: now } : { ...t, list: '', updatedAt: now };
  }
  S.lists[id] = { id, deleted: true, updatedAt: now };
  setList('all');
  changed();
  toast('Liste supprimée');
}

// Liste de tâches → note avec des cases (les tâches restent liées à la note).
function listToNote(id) {
  const ts = live('tasks').filter(t => taskList(t) === id).sort((a, b) => (a.done - b.done) || sortTasks(a, b));
  if (!ts.length) { toast('La liste est vide'); return; }
  const now = Date.now();
  const n = { id: uid(), title: listName(id), body: ts.map(t => `[${t.done ? 'x' : ' '}] ${t.title}`).join('\n'), color: '', pattern: 'none', pinned: false, createdAt: now, updatedAt: now };
  S.notes[n.id] = n;
  for (const t of ts) if (!t.fromNote) S.tasks[t.id] = { ...t, fromNote: n.id, updatedAt: now };
  changed();
  toast('Note créée', 'Ouvrir', () => { setView('notes'); openNote(n.id); });
}

function clearDone(filter) {
  const done = live('tasks').filter(t => t.done && filter(t));
  if (!done.length) { toast('Aucune tâche terminée'); return; }
  const now = Date.now(), prev = done.map(t => ({ ...t }));
  for (const t of done) S.tasks[t.id] = { id: t.id, deleted: true, updatedAt: now };
  changed();
  toast(`${plural(done.length, 'tâche')} supprimée${done.length > 1 ? 's' : ''}`, 'Annuler', () => {
    const t2 = Date.now();
    for (const t of prev) S.tasks[t.id] = { ...t, updatedAt: t2 };
    changed();
  });
}

// ================= Rendu =================
function render() {
  if (!user) return;
  applyTheme();
  // Note ouverte : la liste derrière n'est pas redessinée à chaque frappe / synchro (fluidité).
  // Elle l'est à la fermeture de la note.
  if (curNote) { renderSide(); return; }
  renderVsegs();
  $$('.view').forEach(el => el.classList.toggle('hidden', el.id !== 'v-' + view));
  $$('.tabs [data-view], .side [data-view], .top-settings').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  $('#title').textContent = VIEWS[view];
  $('#sub').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#fab').classList.toggle('hidden', !!selTasks || !!selImgs || view === 'settings' || (view === 'notes' && (noteFilter === 'trash' || noteFilter === 'images' || !!selNotes)));
  if (view === 'tasks') renderTasks();
  else if (view === 'agenda') renderAgenda();
  else if (view === 'notes') renderNotes();
  else if (view === 'calendar') renderCalendar();
  else if (view === 'gallery') renderGalleryView();
  else renderSettings();
  renderSide();
  flashNew();
  renderSelbar();
}

function setView(v) {
  if (selNotes || selTasks || selImgs) closeOverlay();
  view = VIEWS[v] ? v : 'tasks';
  if (view === 'settings') refreshStatus();
  lsSet('rp_view', view);
  render();
  const sec = $('#v-' + view);
  sec.classList.remove('enter');
  void sec.offsetWidth; // relance l'animation
  sec.classList.add('enter');
  window.scrollTo(0, 0);
}

const cardStyle = c => c ? `style="--card:var(--c-${c})"` : '';

function sortTasks(a, b) {
  if (a.date && b.date) return (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99'));
  if (a.date) return -1;
  if (b.date) return 1;
  return (b.createdAt || 0) - (a.createdAt || 0);
}

function taskHTML(t, o = {}) {
  const meta = [];
  if (t.date && !(t.done && t.nextDate)) {
    const cls = isLate(t) ? 'late' : dayDiff(t.date) === 0 ? 'today' : '';
    meta.push(`<span class="chip ${cls}">${icon(t.time ? 'bell' : 'cal')}${esc(fmtDate(t))}</span>`);
  }
  if (t.done && t.nextDate) meta.push(`<span class="chip back">${icon('restore')}Revient ${esc(fmtDay(t.nextDate))}</span>`);
  else if (isRep(t)) meta.push(`<span class="chip">${icon('repeat')}${esc(fmtRepeat(t))}</span>`);
  if (streaksOn() && isRep(t) && (t.streak || 0) > 1) {
    const risk = isLate(t);
    meta.push(`<span class="chip streak ${risk ? 'risk' : ''}" title="${risk ? 'Série en danger : fais-le vite !' : 'Série en cours'}">${icon('flame')}${t.streak}</span>`);
  }
  if (o.showList && taskList(t)) meta.push(`<span class="chip">${icon('list')}${esc(listName(taskList(t)))}</span>`);
  if (t.fromNote && S.notes[t.fromNote] && !S.notes[t.fromNote].deleted) meta.push(`<span class="chip">${icon('notes')}${esc(S.notes[t.fromNote].title || 'Note')}</span>`);
  const anim = pendingToggle.has(t.id) && !t.done;
  return `<div class="task ${selTasks?.has(t.id) ? 'sel' : ''} ${t.done || anim ? 'done' : ''} ${anim ? 'leaving' : ''} ${t.done && t.nextDate ? 'rep' : ''} ${t.color ? 'colored' : ''}" data-id="${t.id}" ${cardStyle(t.color)}>
    <button class="chk" data-act="toggle" aria-label="${t.done ? 'Marquer non terminée' : 'Terminer'}">${t.done || anim ? icon('check') : ''}</button>
    <div class="tbody" data-act="edit">
      <div class="ttitle">${esc(t.title) || '<span class="muted">Sans titre</span>'}</div>
      ${t.details ? `<div class="tdet">${esc(t.details)}</div>` : ''}
      ${meta.length ? `<div class="tmeta">${meta.join('')}</div>` : ''}
    </div>
    <button class="star ${t.starred ? 'on' : ''}" data-act="star" aria-label="Favori" title="Favori">${icon('star')}</button>
  </div>`;
}

function renderTasks() {
  const lists = listsSorted();
  if (!['all', 'starred', ''].includes(curList) && !validList(curList)) setList('all');
  const all = live('tasks').filter(t => !t.date); // ce qui a une date est dans « Rappels »
  const cnt = f => all.filter(t => !t.done && f(t)).length;
  const pending = g => g.filter(t => !t.done).length;

  const chips = $('#list-chips'), sl = chips.scrollLeft;
  const defs = [['all', 'Toutes', '', cnt(() => true)], ['starred', 'Favoris', 'star', cnt(t => t.starred)], ['', 'Mes tâches', '', cnt(t => !taskList(t))]]
    .concat(lists.map(l => [l.id, l.name, '', cnt(t => taskList(t) === l.id)]));
  chips.innerHTML = defs.map(([id, name, ic, n]) =>
    `<button class="chip-btn ${curList === id ? 'on' : ''}" data-list="${id}">${ic ? icon(ic) : ''}${esc(name)}${n ? ` <span class="n">${n}</span>` : ''}</button>`).join('')
    + `<button class="chip-btn add" data-act="newlist">${icon('plus')}Nouvelle liste</button>`;
  chips.scrollLeft = sl;

  const real = curList !== 'all' && curList !== 'starred';
  $('#list-head').innerHTML = real
    ? `<h2>${esc(listName(curList))}</h2><button class="icon-btn" data-act="listmenu" aria-label="Options de la liste" title="Options de la liste">${icon('more')}</button>`
    : '';
  $('#quick-in').placeholder = real ? `Ajouter à « ${listName(curList)} »…` : 'Ajouter une tâche…';

  const inList = t => curList === 'all' ? true : curList === 'starred' ? t.starred : taskList(t) === curList;
  const ts = all.filter(inList);
  const repDone = t => t.done && t.nextDate;
  const todo = ts.filter(t => !t.done || repDone(t)).sort((a, b) => (a.done - b.done) || sortTasks(a, b));
  const done = ts.filter(t => t.done && !repDone(t)).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));

  let h = '';
  if (curList === 'all') {
    for (const [id, name] of [['', 'Mes tâches'], ...lists.map(l => [l.id, l.name])]) {
      const g = todo.filter(t => taskList(t) === id);
      if (g.length) h += `<button class="group-h" data-list="${id}">${esc(name)} <span class="cnt">${pending(g) || ''}</span></button>${tgrid('tasks', g.map(t => taskHTML(t)))}`;
    }
  } else {
    h = tgrid('tasks', todo.map(t => taskHTML(t, { showList: curList === 'starred' })));
  }
  if (!h) h = `<div class="empty">${icon(curList === 'starred' ? 'star' : 'tasks')}${curList === 'starred' ? 'Aucune tâche favorite.<br>Touche l\'étoile d\'une tâche pour l\'ajouter ici.' : 'Aucune tâche en cours.<br>Ajoute-en une ci-dessus.'}</div>`;
  if (done.length) {
    h += `<details class="done" ${doneOpen ? 'open' : ''}><summary>${icon('check')}Terminées <span class="n">${done.length}</span><span class="grow"></span><span class="hint">${doneOpen ? 'Masquer' : 'Afficher'}</span></summary>
      ${tgrid('tasks', done.map(t => taskHTML(t, { showList: curList === 'all' || curList === 'starred' })))}
      <button class="btn danger-text" data-act="clear-done">Supprimer les tâches terminées</button></details>`;
  }
  // Rappels planifiés de cette liste : ils sont dans l'onglet Rappels, on le signale d'un lien.
  const inListDated = live('tasks').filter(t => t.date && !t.done && inList(t)).length;
  if (inListDated) h += `<button class="to-agenda" data-view="agenda">${icon('agenda')}${plural(inListDated, 'rappel')} planifié${inListDated > 1 ? 's' : ''} ici → voir dans Rappels</button>`;
  $('#task-list').innerHTML = h;
  // Astuce montrée une fois
  if (todo.length && !lsGet('rp_swipe_hint') && matchMedia('(pointer: coarse)').matches) {
    lsSet('rp_swipe_hint', '1');
    setTimeout(() => toast('Astuce : glisse une tâche → pour la terminer, ← pour la supprimer'), 800);
  }
}

function renderAgenda() {
  const ts = live('tasks').filter(t => t.date && (!t.done || (t.nextDate && dayDiff(t.date) <= 0)))
    .sort((a, b) => (a.done - b.done) || sortTasks(a, b));
  const groups = [['late', 'En retard'], ['today', "Aujourd'hui"], ['tomorrow', 'Demain'], ['week', 'Cette semaine'], ['later', 'Plus tard']];
  const by = Object.fromEntries(groups.map(([k]) => [k, []]));
  for (const t of ts) {
    const n = dayDiff(t.date);
    by[t.done ? 'today' : isLate(t) ? 'late' : n === 0 ? 'today' : n === 1 ? 'tomorrow' : n < 7 ? 'week' : 'later'].push(t);
  }
  const h = groups.filter(([k]) => by[k].length)
    .map(([k, label]) => `<div class="group-h ${k === 'late' ? 'late' : ''}">${label} <span class="cnt">${by[k].filter(t => !t.done).length || ''}</span></div>${tgrid('agenda', by[k].map(t => taskHTML(t, { showList: true })))}`).join('');
  const done = live('tasks').filter(t => t.date && t.done && !t.nextDate).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 50);
  let out = h || `<div class="empty">${icon('agenda')}Aucun rappel prévu.<br>Écris par exemple « Dentiste demain 14h » ci-dessus.</div>`;
  const p = dayProgress();
  if (p.total && streaksOn()) {
    const all = p.done === p.total, best = Math.max(0, ...live('tasks').filter(t => isRep(t) && !isLate(t)).map(t => t.streak || 0));
    out = `<div class="day-prog ${all ? 'all' : ''}">
      <div class="dp-top"><b>${all ? 'Journée bouclée' : "Aujourd'hui"}</b><span>${p.done} / ${p.total} fait${p.done > 1 ? 's' : ''}</span>${best > 1 ? `<span class="dp-streak" title="Meilleure série en cours">${icon('flame')}${best}</span>` : ''}</div>
      <div class="dp-bar"><i style="width:${Math.round(p.done / p.total * 100)}%"></i></div>
    </div>` + out;
  }
  if (done.length) {
    out += `<details class="done" ${doneOpen ? 'open' : ''}><summary>${icon('check')}Terminés <span class="n">${done.length}</span><span class="grow"></span><span class="hint">${doneOpen ? 'Masquer' : 'Afficher'}</span></summary>
      ${tgrid('agenda', done.map(t => taskHTML(t, { showList: true })))}</details>`;
  }
  $('#agenda').innerHTML = out;
}

// ================= Calendrier =================
// Les rendez-vous du calendrier sont les rappels : même données, simplement vus par jour, semaine ou mois.
let calMode = ['month', 'week', 'day'].includes(lsGet('rp_calmode')) ? lsGet('rp_calmode') : 'month';
let calSel = today(); // jour sélectionné (sert aussi de repère pour le mois / la semaine affichés)
const HOUR_H = 48;    // hauteur d'une heure en vue semaine / jour
const addDays = (k, n) => { const d = new Date(k + 'T00:00'); d.setDate(d.getDate() + n); return ymd(d); };
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const evVar = t => t.color ? `--ev:var(--c-${t.color});` : '';
// Heure proposée pour un nouveau rendez-vous ce jour-là.
const calSlot = k => k === today() ? nextHour() : { date: k, time: '09:00' };

// Rappels présents entre `from` et `to` (inclus), répétitions comprises.
function calEvents(from, to) {
  const out = [], td = today();
  for (const t of live('tasks')) {
    if (!t.date) continue;
    if (!isRep(t)) { if (t.date >= from && t.date <= to) out.push({ t, date: t.date, done: !!t.done }); continue; }
    // Jours passés où il a été fait (historique des séries)
    for (const h of new Set(t.hist || [])) if (h < t.date && h >= from && h <= to) out.push({ t, date: h, done: true });
    const d = new Date(t.date + 'T00:00'), anchor = t.anchor || d.getDate();
    for (let i = 0; i < 800 && ymd(d) <= to; i++) {
      const k = ymd(d);
      // Occurrences suivantes : seulement à partir d'aujourd'hui (celle en cours reste affichée, même en retard)
      if (k >= from && (i === 0 || k >= td)) out.push({ t, date: k, done: i === 0 && !!t.done, rep: i > 0 });
      stepOcc(t, d, anchor);
    }
  }
  return out.sort((a, b) => (a.date + (a.t.time || '')).localeCompare(b.date + (b.t.time || '')));
}

function renderCalendar() {
  const sel = calSel;
  let from, to, title;
  if (calMode === 'month') {
    const first = sel.slice(0, 8) + '01';
    from = addDays(first, -((weekday(first) + 6) % 7));
    to = addDays(from, 41);
    title = new Date(first + 'T00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  } else if (calMode === 'week') {
    from = addDays(sel, -((weekday(sel) + 6) % 7));
    to = addDays(from, 6);
    const a = new Date(from + 'T00:00'), b = new Date(to + 'T00:00');
    title = a.getMonth() === b.getMonth()
      ? `${a.getDate()} – ${b.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : `${a.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } else {
    from = to = sel;
    title = new Date(sel + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  const byDay = {};
  for (const e of calEvents(from, to)) (byDay[e.date] ||= []).push(e);
  $('#cal-title').textContent = cap(title);
  $$('#cal-modes button').forEach(b => b.classList.toggle('on', b.dataset.cm === calMode));
  $('#cal-today').disabled = sel === today();
  const body = $('#cal-body'), prevScroll = $('#cw-scroll')?.scrollTop;
  body.className = 'cal-body cv-' + calMode;
  body.innerHTML = calMode === 'month' ? monthHTML(from, sel, byDay) : weekHTML(from, calMode === 'day' ? 1 : 7, byDay);
  $('#cal-day').innerHTML = calMode === 'month' ? dayListHTML(sel, byDay[sel] || []) : '';
  const sc = $('#cw-scroll');
  if (sc) sc.scrollTop = prevScroll ?? 7 * HOUR_H - 8; // la journée commence à 7 h
}

function monthHTML(from, sel, byDay) {
  const td = today(), m = sel.slice(0, 7);
  let h = '<div class="cm-head">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span>${d}</span>`).join('') + '</div><div class="cm-grid">';
  for (let i = 0; i < 42; i++) {
    const k = addDays(from, i), es = byDay[k] || [];
    const cls = ['cm-day', k.slice(0, 7) !== m && 'out', k === td && 'td', k === sel && 'sel', k < td && 'past'].filter(Boolean).join(' ');
    h += `<button type="button" class="${cls}" data-cday="${k}"><span class="cm-n">${+k.slice(8)}</span>`
      + es.slice(0, 3).map(e => `<span class="cm-ev ${e.done ? 'done' : ''} ${!e.done && isLate(e.t) && !e.rep ? 'late' : ''}" style="${evVar(e.t)}">${e.t.time ? `<i>${e.t.time}</i> ` : ''}${esc(e.t.title || 'Sans titre')}</span>`).join('')
      + (es.length > 3 ? `<span class="cm-more">+${es.length - 3}</span>` : '') + '</button>';
  }
  return h + '</div>';
}

function dayListHTML(k, es) {
  const n = dayDiff(k);
  const label = n === 0 ? "Aujourd'hui" : n === 1 ? 'Demain' : n === -1 ? 'Hier'
    : cap(new Date(k + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  // Même carte que dans l'onglet Rappels. Les occurrences à venir d'un rappel répétitif sont des aperçus :
  // on peut les ouvrir, mais pas les cocher (seule l'occurrence en cours se coche).
  const rows = es.map(({ t, date, done, rep }) => {
    if (!rep && date === t.date) return taskHTML(t, { showList: true });
    const h = taskHTML({ ...t, date, done, nextDate: '' }, { showList: true });
    return h.replace('class="task ', 'class="task virtual ').replace('data-act="toggle"', 'disabled tabindex="-1"');
  }).join('');
  return `<div class="cd-head"><b>${label}</b><span>${es.length ? plural(es.length, 'rendez-vous').replace(/vouss$/, 'vous') : ''}</span></div>
    ${rows || '<div class="cd-empty">Rien de prévu ce jour-là.</div>'}
    <button type="button" class="cd-add" data-cadd="${k}">${icon('plus')}Ajouter un rendez-vous</button>`;
}

// Place les rendez-vous qui se chevauchent côte à côte.
function laneLayout(es) {
  const items = es.map(e => {
    const [h, m] = e.t.time.split(':').map(Number), s0 = h * 60 + m;
    return { e, s: s0, end: Math.min(1440, s0 + Math.max(30, e.t.dur || 60)) };
  }).sort((a, b) => a.s - b.s || b.end - a.end);
  let group = [], lanes = [], maxEnd = -1;
  const flush = () => { group.forEach(it => { it.n = lanes.length; }); group = []; lanes = []; };
  for (const it of items) {
    if (it.s >= maxEnd) flush();
    let li = lanes.findIndex(end => end <= it.s);
    if (li < 0) { li = lanes.length; lanes.push(0); }
    lanes[li] = it.end; it.lane = li; group.push(it);
    maxEnd = Math.max(maxEnd, it.end);
  }
  flush();
  return items;
}

function weekHTML(from, n, byDay) {
  const td = today(), days = Array.from({ length: n }, (_, i) => addDays(from, i));
  const head = '<div class="cw-head"><span class="cw-gut"></span>' + days.map(k =>
    `<button type="button" class="cw-dh ${k === td ? 'td' : ''}" data-cday="${k}"><small>${DAY_SHORT[weekday(k)]}</small><b>${+k.slice(8)}</b></button>`).join('') + '</div>';
  // Rappels sans heure : bandeau « journée » au-dessus de la grille
  const allDay = days.map(k => (byDay[k] || []).filter(e => !e.t.time));
  const all = allDay.some(a => a.length)
    ? '<div class="cw-all"><span class="cw-gut">Jour</span>' + allDay.map(a => `<div>${a.map(({ t, done }) =>
      `<button type="button" class="cw-aev ${done ? 'done' : ''}" data-cev="${t.id}" style="${evVar(t)}">${esc(t.title || 'Sans titre')}</button>`).join('')}</div>`).join('') + '</div>'
    : '';
  let hours = '';
  for (let hh = 1; hh < 24; hh++) hours += `<span style="top:${hh * HOUR_H}px">${pad(hh)}:00</span>`;
  const now = new Date(), nowY = (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR_H;
  const cols = days.map(k => {
    const evs = laneLayout((byDay[k] || []).filter(e => e.t.time)).map(({ e, s: s0, end, lane, n: ln }) => {
      const hgt = (end - s0) / 60 * HOUR_H - 2;
      return `<button type="button" class="cw-ev ${e.done ? 'done' : ''} ${hgt < 36 ? 'short' : ''}" data-cev="${e.t.id}"
        style="top:${s0 / 60 * HOUR_H + 1}px;height:${hgt}px;left:calc(${lane / ln * 100}% + 1px);width:calc(${100 / ln}% - 3px);${evVar(e.t)}">
        <b>${esc(e.t.title || 'Sans titre')}</b><small>${e.t.time}${e.t.dur ? '–' + endTime(e.t) : ''}</small></button>`;
    }).join('');
    return `<div class="cw-col ${k === td ? 'td' : ''}" data-wday="${k}">${evs}${k === td ? `<i class="cw-now" style="top:${nowY}px"></i>` : ''}</div>`;
  }).join('');
  return head + all + `<div class="cw-scroll" id="cw-scroll"><div class="cw-grid" style="height:${24 * HOUR_H}px;--hh:${HOUR_H}px"><div class="cw-hours">${hours}</div>${cols}</div></div>`;
}

function calMove(dir) {
  if (calMode === 'month') {
    const d = new Date(calSel + 'T00:00'), day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + dir);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    calSel = ymd(d);
  } else calSel = addDays(calSel, dir * (calMode === 'week' ? 7 : 1));
  renderCalendar();
}

{
  let swipeAt = 0;
  $('#cal-prev').addEventListener('click', () => calMove(-1));
  $('#cal-next').addEventListener('click', () => calMove(1));
  $('#cal-today').addEventListener('click', () => { calSel = today(); renderCalendar(); });
  $('#cal-modes').addEventListener('click', e => {
    const b = e.target.closest('[data-cm]');
    if (!b) return;
    calMode = b.dataset.cm;
    lsSet('rp_calmode', calMode);
    renderCalendar();
  });
  $('#v-calendar').addEventListener('click', e => {
    if (Date.now() - swipeAt < 400) return; // fin d'un balayage
    const ev = e.target.closest('[data-cev]'), day = e.target.closest('[data-cday]'), add = e.target.closest('[data-cadd]');
    if (ev) { openTask(ev.dataset.cev); return; }
    if (add) { openTask(null, calSlot(add.dataset.cadd)); return; }
    if (day) {
      // Mois : sélectionne le jour. Semaine : ouvre la vue du jour.
      calSel = day.dataset.cday;
      if (calMode === 'week') { calMode = 'day'; lsSet('rp_calmode', calMode); }
      renderCalendar();
      return;
    }
    // Toucher un créneau libre : nouveau rendez-vous à cette heure (à la demi-heure près).
    const col = e.target.closest('.cw-col');
    if (col) {
      const y = e.clientY - col.getBoundingClientRect().top, m = Math.max(0, Math.min(47, Math.floor(y / (HOUR_H / 2)))) * 30;
      openTask(null, { date: col.dataset.wday, time: pad(Math.floor(m / 60)) + ':' + pad(m % 60) });
    }
  });
  // Balayer à gauche / à droite : période suivante / précédente.
  let st = null;
  $('#cal-body').addEventListener('touchstart', e => { st = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
  $('#cal-body').addEventListener('touchend', e => {
    if (!st) return;
    const dx = e.changedTouches[0].clientX - st.x, dy = e.changedTouches[0].clientY - st.y;
    st = null;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 45) { swipeAt = Date.now(); calMove(dx < 0 ? 1 : -1); }
  }, { passive: true });
}

// ----- Saisie rapide d'un rappel en langage courant : « Dentiste demain 14h », « Appeler maman lundi », « Pain dans 2 h »…
function nextHour() {
  const d = new Date(Date.now() + 3600e3);
  d.setMinutes(0, 0, 0);
  return { date: ymd(d), time: pad(d.getHours()) + ':00' };
}
const WD_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
function parseReminder(text) {
  let s = ' ' + text.trim() + ' ', date = null, time = null, m;
  const cut = re => { const x = s.match(re); if (x) s = s.replace(x[0], ' '); return x; };
  if ((m = cut(/\sdans\s+(\d+)\s*(min(?:ute)?s?|h(?:eures?)?|j(?:ours?)?|semaines?)(?=\s)/i))) {
    const n = +m[1], u = m[2][0].toLowerCase(), d = new Date();
    if (u === 'm') d.setMinutes(d.getMinutes() + n);
    else if (u === 'h') d.setHours(d.getHours() + n);
    else if (u === 'j') d.setDate(d.getDate() + n);
    else d.setDate(d.getDate() + 7 * n);
    date = ymd(d);
    if (u === 'm' || u === 'h') time = pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  if (!time && (m = cut(/\s(?:à\s+|a\s+|vers\s+)?([01]?\d|2[0-3])\s*(?:h|:)\s*([0-5]\d)?(?=\s)/i))) time = pad(+m[1]) + ':' + (m[2] || '00');
  if ((m = cut(/\sapr[eè]s[- ]demain(?=\s)/i))) date = today(2);
  else if ((m = cut(/\sdemain(?=\s)/i))) date = today(1);
  else if ((m = cut(/\saujourd['’]hui(?=\s)/i))) date = today();
  else if ((m = cut(new RegExp(`\\s(${WD_NAMES.join('|')})(?:\\s+prochain)?(?=\\s)`, 'i')))) {
    const wd = WD_NAMES.indexOf(m[1].toLowerCase()), d = new Date();
    d.setDate(d.getDate() + ((wd - d.getDay() + 7) % 7 || 7));
    date = ymd(d);
  } else if ((m = cut(/\s(?:le\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/))) {
    let y = m[3] ? +m[3] : new Date().getFullYear();
    if (y < 100) y += 2000;
    const d = new Date(y, +m[2] - 1, +m[1]);
    if (!m[3] && ymd(d) < today()) d.setFullYear(y + 1);
    date = ymd(d);
  }
  if (!time && (m = cut(/\s(?:ce\s+|le\s+)?(matin|midi|après-midi|apres-midi|soir)(?=\s)/i))) {
    time = { matin: '09:00', midi: '12:00', soir: '19:00' }[m[1].toLowerCase()] || '14:00';
  }
  if (!date) date = time && new Date(today() + 'T' + time) < new Date() ? today(1) : today();
  if (!time) {
    if (date === today()) ({ date, time } = nextHour());
    else time = '09:00';
  }
  let title = s.replace(/\s+/g, ' ').replace(/\s(?:à|a|le|pour)$/i, '').trim();
  title = title ? title[0].toUpperCase() + title.slice(1) : '';
  return { title, date, time };
}
function addQuickReminder() {
  const r = parseReminder($('#rquick-in').value);
  if (!r.title) return;
  const now = Date.now();
  const t = { id: uid(), title: r.title, details: '', date: r.date, time: r.time, repeat: 'none', days: [], color: '', done: false, list: '', starred: false, createdAt: now, updatedAt: now };
  S.tasks[t.id] = t;
  justAdded = t.id;
  $('#rquick-in').value = '';
  $('#rquick-hint').textContent = '';
  changed();
  if ('Notification' in window && Notification.permission === 'default') toast('Rappel ajouté · activer les notifications ?', 'Activer', askNotif);
  else toast('Rappel : ' + fmtDate(t), 'Modifier', () => openTask(t.id));
}

const notesIn = f => live('notes').filter(n => f === 'trash' ? n.trashed : f === 'archive' ? !n.trashed && n.archived : !n.trashed && !n.archived);

function shortDate(ms) {
  const d = new Date(ms);
  if (ymd(d) === today()) return hm(d);
  return d.toLocaleDateString('fr-FR', d.getFullYear() === new Date().getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'numeric', year: '2-digit' });
}

let linkedCount = new Map(); // note → nombre de tâches liées en cours (calculé une fois par affichage)
function noteHTML(n) {
  const body = n.body || '';
  const sel = selNotes ? `<span class="sel-mark">${selNotes.has(n.id) ? icon('check') : ''}</span>` : '';
  const cls = `note pat-${n.pattern || 'none'} ${n.color ? 'colored' : ''} ${selNotes?.has(n.id) ? 'sel' : ''}`;
  const attrs = `data-act="note" data-id="${n.id}" data-t="${esc(cleanText(n.title) || 'Sans titre')}" ${cardStyle(n.color)}`;
  const checks = body.split('\n').map(l => l.match(RE_CHECK)).filter(Boolean);
  const imgs = n.images || [];

  if (nLayout === 'compact') {
    const lines = body.split('\n').filter(l => !RE_IMG.test(l) && !RE_COL.test(l)).map(l => cleanText(l.slice(linePrefixOf(l)[1].length))).filter(Boolean);
    const title = n.title || lines.shift() || (imgs.length ? (imgs[0].kind === 'drawing' ? 'Dessin' : 'Image') : 'Note vide');
    return `<div class="${cls} compact" ${attrs}>${sel}
      ${imgs.length ? `<div class="nc-thumb imgbox"><img data-thumb="${imgs[0].id}" alt=""></div>` : ''}
      <div class="nc-main"><div class="nc-t">${n.pinned ? icon('pin') : ''}<span>${esc(title)}</span></div>${lines[0] ? `<div class="nc-s">${esc(lines[0])}</div>` : ''}</div>
      <div class="nc-meta">${checks.length ? `<span>${icon('checkbox')}${checks.filter(m => m[2] !== ' ').length}/${checks.length}</span>` : ''}<span>${shortDate(n.trashed ? n.trashedAt : n.updatedAt)}</span></div>
    </div>`;
  }
  const linked = linkedCount.get(n.id) || 0;
  const foot = [];
  if (linked) foot.push(`<span class="chip">${icon('bell')}${plural(linked, 'tâche')}</span>`);
  if (n.trashed) foot.push(`<span class="chip">${icon('trash')}${fmtAgo(n.trashedAt)}</span>`);
  const max = nLayout === 'grid' ? 9 : 12;
  const pics = imgs.length
    ? `<div class="n-imgs n${Math.min(imgs.length, 3)}">${imgs.slice(0, 3).map((im, i) => `<div class="imgbox" style="--ar:${im.w || 1} / ${im.h || 1}"><img data-thumb="${im.id}" alt="">${i === 2 && imgs.length > 3 ? `<span class="n-more">+${imgs.length - 3}</span>` : ''}</div>`).join('')}</div>` : '';
  return `<div class="${cls}${imgs.length ? ' has-img' : ''}" ${attrs}>${sel}${pics}
    ${n.pinned ? `<span class="pin-mark">${icon('pin')}</span>` : ''}
    ${n.title ? `<h3>${esc(n.title)}</h3>` : ''}
    ${body.trim() ? `<div class="md">${renderBody(body, { links: false, maxLines: max, compact: true })}</div>` : ''}
    ${!n.title && !body.trim() && !imgs.length ? '<div class="nempty">Note vide</div>' : ''}
    ${lpOn() && !n.trashed && noteUrls(body)[0] ? `<div class="lp-slot lp-slot-card" data-lp="${esc(noteUrls(body)[0])}"></div>` : ''}
    ${foot.length ? `<div class="note-foot">${foot.join('')}</div>` : ''}
  </div>`;
}

function renderNotes() {
  if (noteFilter === 'images') noteFilter = 'notes';
  const counts = { archive: notesIn('archive').length, trash: notesIn('trash').length };
  $('#note-chips').innerHTML = [['notes', 'Notes', 'notes'], ['archive', 'Archives', 'archive'], ['trash', 'Corbeille', 'trash']]
    .map(([f, l, ic]) => `<button class="chip-btn ${noteFilter === f ? 'on' : ''}" data-nfilter="${f}">${icon(ic)}${l}${counts[f] ? ` <span class="n">${counts[f]}</span>` : ''}</button>`).join('');

  const q = $('#nsearch').value.trim().toLowerCase();
  linkedCount = new Map();
  for (const t of live('tasks')) if (t.fromNote && !t.done) linkedCount.set(t.fromNote, (linkedCount.get(t.fromNote) || 0) + 1);
  const ns = notesIn(noteFilter)
    .filter(n => !q || ((n.title || '') + ' ' + (n.body || '')).toLowerCase().includes(q))
    .sort((a, b) => noteFilter === 'trash' ? (b.trashedAt || 0) - (a.trashedAt || 0) : (b.updatedAt || 0) - (a.updatedAt || 0));
  const grid = items => `<div class="grid v-${nLayout}">${items.map(noteHTML).join('')}</div>`;
  let h = '';
  if (noteFilter === 'trash' && ns.length && !selNotes) {
    h += `<div class="trash-info"><span>Les notes sont supprimées définitivement après ${TRASH_DAYS} jours.</span><button class="btn danger-text" data-act="emptytrash">Vider</button></div>`;
  }
  if (noteFilter === 'notes') {
    const pinned = ns.filter(n => n.pinned), other = ns.filter(n => !n.pinned);
    if (pinned.length) h += `<div class="group-h">Épinglées</div>${grid(pinned)}`;
    if (other.length) h += `${pinned.length ? '<div class="group-h">Autres</div>' : ''}${grid(other)}`;
  } else if (ns.length) h += grid(ns);
  const empty = q ? 'Aucune note trouvée.' : { notes: 'Aucune note.<br>Touche + pour en créer une.', archive: 'Aucune note archivée.', trash: 'La corbeille est vide.' }[noteFilter];
  const bar = noteFilter === 'notes' && !selNotes && !q
    ? `<div class="takenote"><button class="tn-main" data-act="newnote">Créer une note…</button>
        <button class="icon-btn" data-act="newlistnote" title="Nouvelle liste à cocher" aria-label="Nouvelle liste à cocher">${icon('checkbox')}</button>
        <button class="icon-btn" data-act="newdraw" title="Nouveau dessin" aria-label="Nouveau dessin">${icon('brush')}</button>
        <label class="icon-btn" for="img-input" title="Nouvelle note avec image" aria-label="Nouvelle note avec image">${icon('image')}</label></div>` : '';
  $('#notes').innerHTML = bar + (ns.length ? h : `<div class="empty">${icon(noteFilter === 'notes' ? 'notes' : noteFilter)}${empty}</div>`);
  $('#notes').classList.toggle('selecting', !!selNotes);
  hydrateImages($('#notes'));
  hydrateLinks($('#notes'));
  renderSelbar();
}

// ================= Onglet Images =================
// Toutes les images des notes (hors corbeille) + celles gardées de notes supprimées.
let galType = ['all', 'photo', 'drawing', 'kept'].includes(lsGet('rp_galtype')) ? lsGet('rp_galtype') : 'all';
// Date d'une image : enregistrée pour les nouvelles, sinon retrouvée dans son identifiant (horodaté).
function imgTime(im, fallback = 0) {
  if (im.at) return im.at;
  const m = /^i([0-9a-z]{8})/.exec(im.id || ''), t = m ? parseInt(m[1], 36) : 0;
  return t > 1.5e12 && t < Date.now() + 864e5 ? t : fallback;
}
function galleryItems() {
  const out = [];
  for (const n of live('notes')) {
    if (n.trashed) continue;
    for (const im of n.images || []) out.push({ ...im, note: n.id, title: n.title || '', at: imgTime(im, n.createdAt || n.updatedAt || 0) });
  }
  for (const im of live('images')) out.push({ ...im, kept: true, title: im.from || '', at: imgTime(im, im.keptAt || 0) });
  return out.sort((a, b) => b.at - a.at);
}
const GAL_TYPES = [['all', 'Tout', 'grid'], ['photo', 'Images', 'image'], ['drawing', 'Dessins', 'brush'], ['kept', 'Gardées', 'archive']];
let galTypes = [];
// Bouton + de l'onglet Images (et bouton flottant) : importer une image ou créer un dessin, dans une nouvelle note.
async function galAdd(anchor) {
  const v = await popMenu(anchor, [{ value: 'img', label: 'Importer une image', icon: 'upload' }, { value: 'draw', label: 'Créer un dessin', icon: 'brush' }]);
  if (v === 'img') $('#img-input').click();
  else if (v === 'draw') { openNote(null); openDraw(null); }
}
function renderGalleryView() {
  const all = galleryItems();
  const byType = { all: all.length, photo: all.filter(x => !x.kept && x.kind !== 'drawing').length, drawing: all.filter(x => !x.kept && x.kind === 'drawing').length, kept: all.filter(x => x.kept).length };
  if (galType === 'kept' && !byType.kept) galType = 'all';
  galTypes = GAL_TYPES.filter(([k]) => k !== 'kept' || byType.kept).map(([value, label, ic]) => ({ value, label, icon: ic, n: byType[value], on: value === galType }));
  const cur = galTypes.find(t => t.on);
  $('#gal-type').innerHTML = `${icon(cur.icon)}${cur.label} <span class="n">${cur.n}</span>${icon('chevron')}`;
  const items = all.filter(x => (galType === 'all' || (galType === 'kept' ? x.kept : !x.kept && (galType === 'drawing') === (x.kind === 'drawing'))));
  let h = '';
  if (galType === 'kept') h += `<div class="trash-info"><span>Images gardées de notes supprimées.</span><button class="btn danger-text" data-act="galclear">Tout supprimer</button></div>`;
  // Regroupées par mois, en mosaïque : paysages sur deux colonnes, portraits sur deux lignes.
  let month = '';
  for (const x of items) {
    const m = x.at ? new Date(x.at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Sans date';
    if (m !== month) { h += `${month ? '</div>' : ''}<div class="gal-month">${cap(m)}</div><div class="gal-grid v-${lay.gallery}">`; month = m; }
    const r = (x.w || 1) / (x.h || 1), shape = lay.gallery !== 'masonry' ? '' : r > 1.45 ? 'wide' : r < 0.7 ? 'tall' : '';
    const key = x.note ? `n:${x.note}:${x.id}` : `k:${x.id}`;
    const kind = x.kind === 'drawing' ? 'Dessin' : 'Image';
    const attrs = `data-gkey="${key}" data-gimg="${x.id}" ${x.note ? `data-gnote="${x.note}"` : 'data-gkept="1"'} aria-label="${kind}${x.title ? ' · ' + esc(x.title) : ''}"`;
    if (lay.gallery === 'compact') {
      const when = x.at ? new Date(x.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      h += `<button type="button" class="gal-tile gal-row ${selImgs?.has(key) ? 'sel' : ''}" ${attrs}>
        <span class="imgbox gr-thumb"><img data-thumb="${x.id}" alt=""></span>
        <span class="gr-main"><span class="gr-t">${esc(x.title) || kind}</span><span class="gr-s">${icon(x.kind === 'drawing' ? 'brush' : x.kept ? 'archive' : 'image')}${x.kept ? 'Gardée' : kind}${when ? ' · ' + when : ''}</span></span>
      </button>`;
      continue;
    }
    h += `<button type="button" class="gal-tile imgbox ${shape} ${selImgs?.has(key) ? 'sel' : ''}" ${attrs}>
      <img data-thumb="${x.id}" alt="">
      ${x.kind === 'drawing' ? `<span class="gal-badge" title="Dessin">${icon('brush')}</span>` : x.kept ? `<span class="gal-badge" title="Gardée d'une note supprimée">${icon('archive')}</span>` : ''}
      ${x.title ? `<span class="gal-cap">${esc(x.title)}</span>` : ''}
    </button>`;
  }
  if (month) h += '</div>';
  if (!items.length) h += `<div class="empty">${icon('image')}${all.length ? 'Aucune image pour ce filtre.' : 'Aucune image pour le moment.<br>Ajoute une image ou un dessin dans une note : elle apparaîtra ici.'}</div>`;
  $('#gallery').innerHTML = h;
  $('#sub').textContent = plural(items.length, 'image');
  hydrateImages($('#gallery'));
}
$('#v-gallery').addEventListener('click', e => {
  const g = e.target.closest('[data-gimg]');
  if (e.target.closest('#gal-type')) {
    popMenu($('#gal-type'), galTypes).then(v => { if (v) { galType = v; lsSet('rp_galtype', v); renderGalleryView(); } });
  } else if (e.target.closest('#gal-add')) galAdd($('#gal-add'));
  else if (g && selLpFired) selLpFired = false;
  else if (g && selImgs) toggleSelItem(g.dataset.gkey);
  else if (g) openViewer(g.dataset.gimg, g.dataset.gnote ? { note: g.dataset.gnote } : { kept: true });
});
// Remplace l'identifiant d'une image placée dans le texte (après modification, l'image a un nouvel identifiant).
const swapImgId = (body, from, to) => String(body || '').replace(new RegExp(`^\\[img:${from}(\\|[sm])?\\]`, 'gm'), `[img:${to}$1]`);
// Supprime une image d'une note qui n'est pas ouverte (depuis l'onglet Images).
function removeNoteImage(noteId, id) {
  const n = S.notes[noteId];
  if (!n) return;
  const prev = n;
  const body = (n.body || '').split('\n').flatMap(l => { const m = l.match(RE_IMG); return m && m[1] === id ? (m[3] ? [m[3]] : []) : [l]; }).join('\n');
  S.notes[noteId] = { ...n, body, images: (n.images || []).filter(x => x.id !== id), updatedAt: Date.now() };
  changed();
  toast('Image supprimée de la note', 'Annuler', () => { S.notes[noteId] = { ...prev, updatedAt: Date.now() }; changed(); });
}
// Image modifiée depuis l'onglet Images : nouvelle note (par défaut) ou remplacement de l'original.
async function saveGalleryEdit(d, v) {
  const ex = d.existing, kind = ex.kind === 'drawing' ? 'drawing' : 'photo';
  const r = await dialog({
    title: 'Enregistrer la modification', col: true,
    text: "Créer une nouvelle note avec l'image modifiée, ou remplacer l'image d'origine ?",
    buttons: [{ label: 'Dans une nouvelle note', primary: true, value: 'new' }, { label: "Remplacer l'original", value: 'replace' }, { label: 'Ne pas enregistrer', danger: true, value: 'drop' }],
  });
  const mode = r?.value || 'new'; // fenêtre fermée sans choisir : nouvelle note, rien n'est perdu
  if (mode === 'drop') return;
  const id = uid(), now = Date.now(), item = { id, kind, w: v.w, h: v.h, at: now };
  await queueImage(id, v.full, v.thumb);
  if (mode === 'new') {
    const src = ex.src?.note ? S.notes[ex.src.note] : null, t = (src?.title || ex.from || '').trim();
    const nid = uid();
    S.notes[nid] = { id: nid, title: t ? `${t} (modifiée)` : 'Image modifiée', body: '', color: '', pattern: 'none', pinned: false, archived: false, images: [item], createdAt: now, updatedAt: now };
    changed();
    toast('Enregistrée dans une nouvelle note', 'Ouvrir', () => { setView('notes'); openNote(nid); });
  } else if (ex.src?.note && S.notes[ex.src.note]) {
    const n = S.notes[ex.src.note];
    S.notes[n.id] = { ...n, images: (n.images || []).map(x => x.id === ex.id ? item : x), body: swapImgId(n.body, ex.id, id), updatedAt: now };
    changed();
    toast('Image remplacée');
  } else {
    const old = S.images[ex.id] || {};
    S.images[ex.id] = { id: ex.id, deleted: true, updatedAt: now }; // l'ancienne version est effacée du serveur
    S.images[id] = { id, w: v.w, h: v.h, kind, from: old.from || '', keptAt: old.keptAt || now, at: now, updatedAt: now };
    changed();
    toast('Image remplacée');
  }
}
function removeGallery(ids) {
  const now = Date.now();
  for (const id of ids) S.images[id] = { id, deleted: true, updatedAt: now }; // le serveur efface aussitôt les fichiers
  changed();
}

// ----- Sélection multiple (appui long sur une note, clic droit ou Ctrl+clic sur PC) -----
function startSelect(id) {
  selNotes = new Set([id]);
  openOverlay('select');
  render();
}
function toggleSel(id) {
  selNotes.has(id) ? selNotes.delete(id) : selNotes.add(id);
  if (!selNotes.size) closeOverlay();
  else render();
}
// Barre de sélection : deux actions principales visibles, le reste dans le menu « Plus ».
const SEL_MORE = {};
function renderSelbar() {
  const tOn = !!selTasks && ['agenda', 'tasks', 'calendar'].includes(view), iOn = !!selImgs && view === 'gallery';
  const on = (!!selNotes && view === 'notes') || tOn || iOn;
  $('#selbar').classList.toggle('hidden', !on);
  if (!on) return;
  const all = ['all', 'checkbox', 'Tout sélectionner'];
  let count, main, more;
  if (tOn) {
    count = selTasks.size;
    main = [['tdone', 'check', 'Terminer / reprendre'], ['tdel', 'trash', 'Supprimer']];
    more = [['tdate', 'cal', 'Changer la date'], ['tstar', 'star', 'Favori'], ['tlist', 'list', 'Changer de liste'], ['tcolor', 'palette', 'Couleur'], all];
  } else if (iOn) {
    count = selImgs.size;
    main = [['ishare', 'share', 'Partager / enregistrer'], ['idel', 'trash', 'Supprimer']];
    more = [['inote', 'notes', 'Nouvelle note avec ces images'], all];
  } else {
    count = selNotes.size;
    const arch = noteFilter === 'archive';
    if (noteFilter === 'trash') { main = [['restore', 'restore', 'Restaurer'], ['purge', 'trash', 'Supprimer définitivement']]; more = [all]; }
    else {
      main = [[arch ? 'unarchive' : 'archive', arch ? 'unarchive' : 'archive', arch ? 'Désarchiver' : 'Archiver'], ['trash', 'trash', 'Mettre à la corbeille']];
      more = [['pin', 'pin', 'Épingler / désépingler'], ['color', 'palette', 'Couleur'], ['share', 'share', 'Partager / exporter'], ['download', 'download', 'Télécharger'], all];
    }
  }
  SEL_MORE.items = more;
  $('#sel-count').textContent = count;
  $('#sel-actions').innerHTML = main.map(([v, ic, l]) => `<button class="icon-btn" data-sel="${v}" title="${l}" aria-label="${l}">${icon(ic)}</button>`).join('')
    + `<button class="icon-btn" data-sel="more" title="Plus d'actions" aria-label="Plus d'actions">${icon('more')}</button>`;
}
async function selMore() {
  const r = await dialog({ items: SEL_MORE.items.map(([v, ic, l]) => ({ label: l, value: v, icon: ic })) });
  if (r) selAction(r.value);
}
function restoreNotes(prev) {
  const t = Date.now();
  for (const n of prev) S.notes[n.id] = { ...n, updatedAt: t };
  changed();
}
async function selAction(v) {
  if (v === 'close') { closeOverlay(); return; }
  if (v === 'more') { selMore(); return; }
  if (selTasks) return selTaskAction(v);
  if (selImgs) return selImgAction(v);
  if (!selNotes) return;
  if (v === 'all') { selNotes = new Set($$('#notes .note[data-id]').map(el => el.dataset.id)); render(); return; }
  const ns = [...selNotes].map(id => S.notes[id]).filter(n => n && !n.deleted);
  const prev = ns.map(n => ({ ...n })), now = Date.now(), k = ns.length;
  const upd = f => { for (const n of ns) S.notes[n.id] = { ...f(n), updatedAt: now }; };
  const undoToast = msg => toast(msg, 'Annuler', () => restoreNotes(prev));
  switch (v) {
    case 'pin': {
      const all = ns.every(n => n.pinned);
      upd(n => ({ ...n, pinned: !all, archived: all ? n.archived : false }));
      undoToast(`${plural(k, 'note')} ${all ? 'désépinglée' : 'épinglée'}${k > 1 ? 's' : ''}`);
      break;
    }
    case 'color': {
      const r = await dialog({
        title: 'Couleur des notes', html: `<div class="swatches">${swatchesHTML(null)}</div>`, buttons: [{ label: 'Annuler' }],
        onClick: (e, pick) => { const b = e.target.closest('.sw'); if (!b) return false; pick({ value: b.dataset.c }); return true; },
      });
      if (!r) return;
      upd(n => ({ ...n, color: r.value }));
      break;
    }
    case 'archive': case 'unarchive': {
      const on = v === 'archive';
      upd(n => ({ ...n, archived: on, pinned: on ? false : n.pinned }));
      undoToast(`${plural(k, 'note')} ${on ? 'archivée' : 'désarchivée'}${k > 1 ? 's' : ''}`);
      break;
    }
    case 'trash':
      upd(n => ({ ...n, trashed: true, trashedAt: now, pinned: false }));
      undoToast(`${plural(k, 'note')} dans la corbeille`);
      break;
    case 'restore':
      upd(n => ({ ...n, trashed: false, trashedAt: 0 }));
      toast(`${plural(k, 'note')} restaurée${k > 1 ? 's' : ''}`);
      break;
    case 'purge':
      if (!await purgeNotes(ns, 'Supprimer définitivement ?', `${plural(k, 'note')} ser${k > 1 ? 'ont' : 'a'} supprimée${k > 1 ? 's' : ''} pour de bon.`)) return;
      break;
    case 'share': case 'download':
      await shareNotes(ns, v === 'download');
      break;
  }
  changed();
  closeOverlay();
}

// ----- Sélection multiple : rappels / tâches et images (appui long, comme pour les notes) -----
let selTasks = null, selImgs = null; // Set d'ids de tâches ; Set de clés d'images (« n:note:image » ou « k:image »)
let selLpFired = false;              // un appui long vient de sélectionner : le « clic » qui suit est ignoré
function startSelItem(kind, key) {
  if (kind === 'task') selTasks = new Set([key]); else selImgs = new Set([key]);
  openOverlay('select');
  render();
}
function toggleSelItem(key, kind = selTasks ? 'task' : 'img') {
  const set = kind === 'task' ? selTasks : selImgs;
  if (!set) return;
  set.has(key) ? set.delete(key) : set.add(key);
  if (!set.size) closeOverlay(); else render();
}
{
  const longPress = (root, sel, kind, keyOf) => {
    let lp = null;
    const cancel = () => { if (lp) { clearTimeout(lp.t); lp = null; } };
    root.addEventListener('pointerdown', e => {
      const el = e.target.closest(sel);
      if (!el || e.button > 0 || e.target.closest('.chk, .star')) return;
      cancel();
      lp = { x: e.clientX, y: e.clientY, t: setTimeout(() => {
        lp = null;
        if (!el.isConnected) return;
        selLpFired = true;
        setTimeout(() => { selLpFired = false; }, 800);
        navigator.vibrate?.(25);
        startDragSel(kind, root, sel, keyOf, el, e);
      }, 450) };
    });
    root.addEventListener('pointermove', e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) cancel(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => root.addEventListener(ev, cancel));
    root.addEventListener('contextmenu', e => {
      const el = e.target.closest(sel);
      if (!el) return;
      e.preventDefault();
      if (e.pointerType === 'mouse' || !('ontouchstart' in window)) { const key = keyOf(el), set = kind === 'task' ? selTasks : selImgs; set ? toggleSelItem(key, kind) : startSelItem(kind, key); }
    });
  };
  for (const id of ['#task-list', '#agenda', '#cal-day']) longPress($(id), '.task[data-id]', 'task', el => el.dataset.id);
  longPress($('#gallery'), '[data-gkey]', 'img', el => el.dataset.gkey);
}
// ----- Appui long puis glisser le doigt : chaque carte survolée est ajoutée à la sélection -----
// (ou retirée, si l'appui long a commencé sur une carte déjà sélectionnée). Pendant le geste, seules les classes
// changent : la carte touchée reste dans la page, sinon le navigateur perdrait le geste et ferait défiler l'écran.
let dragSel = null;
const selSet = kind => kind === 'note' ? selNotes : kind === 'task' ? selTasks : selImgs;
function startDragSel(kind, root, sel, keyOf, el, e) {
  let set = selSet(kind);
  if (!set) {
    set = new Set();
    if (kind === 'note') selNotes = set; else if (kind === 'task') selTasks = set; else selImgs = set;
    openOverlay('select');
  }
  const key = keyOf(el), add = !set.has(key);
  dragSel = { kind, root, sel, keyOf, add, seen: new Set(), pid: e.pointerId, x: e.clientX, y: e.clientY, raf: 0 };
  document.body.classList.add('dragsel');
  dragHit(el);
}
function dragHit(el) {
  const d = dragSel, key = d.keyOf(el);
  if (d.seen.has(key)) return;
  d.seen.add(key);
  const set = selSet(d.kind);
  d.add ? set.add(key) : set.delete(key);
  if (d.seen.size > 1) navigator.vibrate?.(6);
  el.classList.toggle('sel', d.add);
  if (d.kind === 'note') {
    // Les cases rondes n'existent pas encore si la sélection vient de commencer.
    for (const c of $$(d.sel, d.root)) if (!c.querySelector('.sel-mark')) c.insertAdjacentHTML('afterbegin', '<span class="sel-mark"></span>');
    el.querySelector('.sel-mark').innerHTML = d.add ? icon('check') : '';
    d.root.classList.add('selecting');
  }
  renderSelbar();
}
// Toutes les cartes sur le trajet du doigt (même s'il va vite).
function dragTo(x, y) {
  const d = dragSel, n = Math.max(1, Math.ceil(Math.hypot(x - d.x, y - d.y) / 16));
  for (let i = 1; i <= n; i++) {
    const el = document.elementFromPoint(d.x + (x - d.x) * i / n, d.y + (y - d.y) * i / n)?.closest(d.sel);
    if (el && d.root.contains(el)) dragHit(el);
  }
  d.x = x; d.y = y;
}
// Doigt près du haut ou du bas de l'écran : la page défile toute seule.
function dragScroll() {
  const d = dragSel;
  if (!d) return;
  const v = d.y < 90 ? -(90 - d.y) / 5 : d.y > innerHeight - 110 ? (d.y - innerHeight + 110) / 5 : 0;
  if (v) { scrollBy(0, v); dragTo(d.x, d.y); d.raf = requestAnimationFrame(dragScroll); } else d.raf = 0;
}
document.addEventListener('pointermove', e => {
  if (!dragSel || e.pointerId !== dragSel.pid) return;
  dragTo(e.clientX, e.clientY);
  if (!dragSel.raf) dragScroll();
});
document.addEventListener('touchmove', e => { if (dragSel && e.cancelable) e.preventDefault(); }, { passive: false });
['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, e => {
  const d = dragSel;
  if (!d || e.pointerId !== d.pid) return;
  dragSel = null;
  cancelAnimationFrame(d.raf);
  document.body.classList.remove('dragsel');
  if (!selSet(d.kind)?.size) closeOverlay(); else render();
}));

// En sélection, toucher une carte la coche / décoche au lieu de l'ouvrir (écouté avant les autres clics).
document.addEventListener('click', e => {
  const card = e.target.closest('#task-list .task[data-id], #agenda .task[data-id], #cal-day .task[data-id]');
  if (!card) return;
  if (selLpFired) { selLpFired = false; e.stopPropagation(); e.preventDefault(); return; }
  if (selTasks) { e.stopPropagation(); e.preventDefault(); toggleSelItem(card.dataset.id, 'task'); }
}, true);

async function selTaskAction(v) {
  if (v === 'all') {
    const root = view === 'tasks' ? '#task-list' : view === 'agenda' ? '#agenda' : '#cal-day';
    $$(`${root} .task[data-id]`).forEach(el => selTasks.add(el.dataset.id));
    render();
    return;
  }
  const ts = [...selTasks].map(id => S.tasks[id]).filter(t => t && !t.deleted);
  if (!ts.length) { closeOverlay(); return; }
  const prev = ts.map(t => ({ ...t })), now = Date.now(), k = ts.length;
  const upd = f => { for (const t of ts) S.tasks[t.id] = { ...f(S.tasks[t.id]), updatedAt: now }; };
  const undoToast = msg => toast(msg, 'Annuler', () => { for (const t of prev) S.tasks[t.id] = { ...t, updatedAt: Date.now() }; changed(); });
  const word = plural(k, 'élément');
  switch (v) {
    case 'tdone': {
      const allDone = ts.every(t => t.done);
      for (const t of ts) {
        const x = S.tasks[t.id];
        if (!!x.done === !allDone) continue;
        x.done = !allDone;
        x.doneAt = x.done ? now : 0;
        x.nextDate = x.done && isRep(x) && x.date ? nextDate(x) : '';
        if (isRep(x) && x.date) updateStreak(x);
        syncNoteLine(x);
        x.updatedAt = now;
      }
      undoToast(`${word} ${allDone ? 'repris' : 'terminé'}${k > 1 ? 's' : ''}`);
      break;
    }
    case 'tdate': {
      const r = await dialog({
        title: `Date de ${word}`,
        html: `<div class="field-row"><label class="field">Date<input id="sd-date" type="date" value="${esc(ts[0].date || today())}"></label>
          <label class="field">Heure<input id="sd-time" type="time" value="${esc(ts.every(t => t.time === ts[0].time) ? ts[0].time || '' : '')}"></label></div>
          <p class="small muted" style="margin:0">Heure vide : chaque élément garde la sienne.</p>`,
        buttons: [{ label: 'Annuler' }, { label: 'Sans date', value: 'none' }, { label: 'Appliquer', primary: true, value: 'set' }],
        onClick: (e, pick) => {
          const b = e.target.closest('[data-b]');
          if (!b || b.dataset.b === '0') return false;
          pick({ value: b.dataset.b === '1' ? 'none' : 'set', date: $('#sd-date').value, time: $('#sd-time').value });
          return true;
        },
      });
      if (!r) return;
      if (r.value === 'none') upd(t => ({ ...t, date: '', time: '', repeat: 'none', days: [], nextDate: '' }));
      else if (r.date) upd(t => ({ ...t, date: r.date, time: r.time || t.time || '', nextDate: '', done: isRep(t) ? false : t.done }));
      undoToast(r.value === 'none' ? `${word} sans date (dans Tâches)` : `${word} au ${fmtDay(r.date)}`);
      break;
    }
    case 'tstar': {
      const all = ts.every(t => t.starred);
      upd(t => ({ ...t, starred: !all }));
      undoToast(`${word} ${all ? 'retiré' + (k > 1 ? 's' : '') + ' des favoris' : 'en favori'}`);
      break;
    }
    case 'tlist': {
      const r = await dialog({ title: 'Changer de liste', items: [{ label: 'Mes tâches', value: '', icon: 'list' }, ...listsSorted().map(l => ({ label: l.name, value: l.id, icon: 'list' }))] });
      if (!r) return;
      upd(t => ({ ...t, list: r.value }));
      undoToast(`${word} déplacé${k > 1 ? 's' : ''} dans « ${r.value ? listName(r.value) : 'Mes tâches'} »`);
      break;
    }
    case 'tcolor': {
      const r = await dialog({
        title: 'Couleur', html: `<div class="swatches">${swatchesHTML(null)}</div>`, buttons: [{ label: 'Annuler' }],
        onClick: (e, pick) => { const b = e.target.closest('.sw'); if (!b) return false; pick({ value: b.dataset.c }); return true; },
      });
      if (!r) return;
      upd(t => ({ ...t, color: r.value }));
      break;
    }
    case 'tdel':
      for (const t of ts) S.tasks[t.id] = { id: t.id, deleted: true, updatedAt: now };
      undoToast(`${word} supprimé${k > 1 ? 's' : ''}`);
      break;
    default: return;
  }
  changed();
  closeOverlay();
}

async function selImgAction(v) {
  if (v === 'all') { $$('#gallery [data-gkey]').forEach(el => selImgs.add(el.dataset.gkey)); render(); return; }
  const items = [...selImgs].map(key => {
    const [kind, a, b] = key.split(':');
    if (kind === 'k') { const im = S.images[a]; return im && !im.deleted ? { key, id: a, im, kept: true } : null; }
    const n = S.notes[a], im = n?.images?.find(x => x.id === b);
    return im ? { key, id: b, im, note: a } : null;
  }).filter(Boolean);
  if (!items.length) { closeOverlay(); return; }
  const k = items.length;
  switch (v) {
    case 'ishare': {
      try {
        const files = await Promise.all(items.map(async (x, i) => { const bl = await imageBlob(x.id); return new File([bl], `image-${i + 1}.${bl.type.includes('png') ? 'png' : 'jpg'}`, { type: bl.type }); }));
        if (navigator.canShare?.({ files })) { try { await navigator.share({ files }); } catch (e) { if (e.name !== 'AbortError') throw e; } }
        else for (const f of files) await shareFile(f, f.name, f.type);
      } catch { toast('Partage impossible pour le moment'); }
      closeOverlay();
      return;
    }
    case 'inote': {
      const now = Date.now(), nid = uid();
      S.notes[nid] = { id: nid, title: '', body: '', color: '', pattern: 'none', pinned: false, archived: false,
        images: items.map(x => ({ id: x.id, kind: x.im.kind || 'photo', w: x.im.w, h: x.im.h, at: x.im.at || now })), createdAt: now, updatedAt: now };
      changed();
      closeOverlay(() => { setView('notes'); openNote(nid); });
      return;
    }
    case 'idel': {
      if (!await confirmDlg(`Supprimer ${plural(k, 'image')} ?`, 'Les images sont retirées de leurs notes. Les images gardées sont effacées définitivement.', 'Supprimer', true)) return;
      const now = Date.now(), prevNotes = [];
      const byNote = {};
      for (const x of items) if (x.note) (byNote[x.note] ||= new Set()).add(x.id);
      for (const [nid, ids] of Object.entries(byNote)) {
        const n = S.notes[nid];
        prevNotes.push({ ...n });
        const body = (n.body || '').split('\n').flatMap(l => { const m = l.match(RE_IMG); return m && ids.has(m[1]) ? (m[3] ? [m[3]] : []) : [l]; }).join('\n');
        S.notes[nid] = { ...n, body, images: (n.images || []).filter(im => !ids.has(im.id)), updatedAt: now };
      }
      const kept = items.filter(x => x.kept).map(x => x.id);
      if (kept.length) removeGallery(kept); else changed();
      if (prevNotes.length) toast(`${plural(k, 'image')} supprimée${k > 1 ? 's' : ''}`, kept.length ? undefined : 'Annuler', () => { for (const n of prevNotes) S.notes[n.id] = { ...n, updatedAt: Date.now() }; changed(); });
      closeOverlay();
      return;
    }
  }
}

function renderSide() {
  if (!user) return;
  const open = live('tasks').filter(t => !t.done);
  const openTasks = open.filter(t => !t.date);
  const urgent = open.filter(t => t.date && (isLate(t) || dayDiff(t.date) === 0)).length;
  const late = open.filter(isLate).length;
  $('#cnt-tasks').textContent = openTasks.length || '';
  $('#cnt-agenda').textContent = urgent || '';
  $('#cnt-agenda').classList.toggle('alert', late > 0);
  $('#cnt-notes').textContent = notesIn('notes').length || '';
  const badge = $('#badge-agenda');
  badge.textContent = urgent;
  badge.classList.toggle('hidden', !urgent);

  $('#side-lists').innerHTML = [['', 'Mes tâches'], ...listsSorted().map(l => [l.id, l.name])].map(([id, name]) => {
    const n = open.filter(t => taskList(t) === id).length;
    return `<button class="nav-item sub ${view === 'tasks' && curList === id ? 'on' : ''}" data-list="${id}">${icon('list')}<span>${esc(name)}</span><span class="cnt">${n || ''}</span></button>`;
  }).join('') + `<button class="nav-item sub" data-act="newlist">${icon('plus')}<span>Nouvelle liste</span></button>`;

  $('#access-btn').classList.toggle('hidden', !isLocal());
  $('#install-btn').classList.toggle('hidden', isStandalone() || (!installEvt && !isIOS()) || installViews > 3);
  const pend = dirtyCount();
  const status = isLocal() ? 'Mode local · rien sur le serveur' : online ? (lastSync ? 'Synchronisé ' + fmtAgo(lastSync) : 'Connexion…') : 'Hors ligne' + (pend ? ` · ${pend} en attente` : '');
  $('#offline-lbl').textContent = online ? '' : 'Hors ligne' + (pend ? ` · ${pend} modif. en attente` : '');
  $('#me-btn').innerHTML = avatarHTML();
  $('#side-foot').innerHTML = `${avatarHTML()}
    <div style="min-width:0">
      <b>${esc(uname())}</b>
      <div class="row"><span class="dot ${$('#dot').className.replace('dot', '').trim()}"></span>${esc(status)}</div>
      ${isLocal() ? '' : `<div class="row">Dernière connexion ${esc(fmtAgo(account.lastSeen))}</div>`}
      ${!isLocal() && account.devices ? `<div class="row">${plural(account.devices, 'appareil')} connecté${account.devices > 1 ? 's' : ''}</div>` : ''}
    </div>`;
}

function renderSettings() {
  const loc = isLocal();
  $('#s-user').textContent = uname();
  $('#s-local-badge').classList.toggle('hidden', !loc);
  $('#s-local-info').classList.toggle('hidden', !loc);
  $('#s-rename').classList.toggle('hidden', loc);
  $('#logout').textContent = loc ? 'Quitter le mode local' : 'Se déconnecter';
  for (const id of ['s-pw', 's-syncnow', 's-others']) $('#' + id).classList.toggle('hidden', loc);
  $('#s-sec-title').textContent = loc ? 'Données de cet appareil' : 'Compte et sécurité';
  $('#s-delete-txt').textContent = loc ? 'Efface définitivement toutes les notes, tâches, rappels et images enregistrés sur cet appareil.'
    : 'Efface définitivement ton compte et toutes tes données, sur tous les appareils.';
  $('#s-delete-lbl').textContent = loc ? 'Effacer les données locales' : 'Supprimer mon compte';
  $('#s-avatar').innerHTML = avatarHTML('big');
  const th = S.settings.theme || 'auto';
  $('#s-theme').innerHTML = THEMES.map(([v, l]) => {
    const [bg, sf] = THEME_PV[v] || [];
    const pvBg = v === 'auto' ? `linear-gradient(135deg,${THEME_PV.grey[0]} 50%,${THEME_PV.dark[0]} 50%)` : bg;
    const bar = c => `<i style="background:${c || 'rgba(128,128,128,.35)'}"></i>`;
    return `<button type="button" class="theme-tile ${v === th ? 'on' : ''}" data-v="${v}"><span class="pv" style="background:${pvBg}">${bar(sf)}${bar(sf)}<i style="background:var(--accent);width:45%"></i></span>${l}</button>`;
  }).join('');
  const sk = skinOf(th);
  $('#s-skins').innerHTML = SKINS.map(([v, l, , , , pv]) => `<button type="button" class="theme-tile ${v === th ? 'on' : ''}" data-v="${v}"><span class="pv" style="background:${pv}"></span>${l}</button>`).join('');
  if (sk) $('#s-skins-wrap').open = true;
  $('#s-admin-badge').classList.toggle('hidden', !srvStatus?.admin);
  const seg = (id, v) => $$(`#${id} button`).forEach(b => b.classList.toggle('on', b.dataset.v === v));
  seg('s-start', S.settings.start || 'notes');
  seg('s-notesize', S.settings.noteSize || 'normal');
  seg('s-imgpurge', S.settings.imgPurge || 'ask');
  const acc = curAccent();
  // La couleur du thème fantaisie (ou une couleur reprise d'un thème) s'ajoute aux couleurs proposées.
  $('#s-accent').innerHTML = [...new Set([...ACCENTS, ...(sk ? [sk[3]] : []), acc])].map(c => `<button class="sw ${c === acc ? 'on' : ''}" data-accent="${c}" style="background:${c};border-color:transparent" aria-label="Couleur ${c}"></button>`).join('');
  if (document.activeElement !== $('#s-ntfy')) $('#s-ntfy').value = S.settings.ntfy || '';
  if (!$('#s-help').innerHTML) $('#s-help').innerHTML = HELP_HTML;

  let st;
  if (!('Notification' in window)) st = "Notifications non disponibles dans ce navigateur (sur iPhone : ajoute d'abord le site à l'écran d'accueil).";
  else if (loc && Notification.permission === 'granted') st = "Notifications activées. En mode local, sans serveur, elles n'arrivent que quand l'appli est ouverte (même en arrière-plan sur PC).";
  else if (Notification.permission === 'granted' && pushOn) st = 'Notifications activées sur cet appareil, même quand l\'appli est fermée ou en arrière-plan.';
  else if (Notification.permission === 'granted') st = 'Notifications autorisées. Touche « Activer » pour les recevoir aussi quand l\'appli est fermée.';
  else if (Notification.permission === 'denied') st = 'Notifications bloquées : autorise-les dans les réglages du navigateur.';
  else st = 'Notifications pas encore activées sur cet appareil.';
  $('#s-notif-state').textContent = st;
  $('#s-notif').classList.toggle('hidden', !('Notification' in window) || Notification.permission === 'denied' || pushOn || (loc && Notification.permission === 'granted'));
  $('#s-push-test').classList.toggle('hidden', !pushOn);

  $('#s-install-state').textContent = isStandalone()
    ? 'Carnet est installé comme une application sur cet appareil.'
    : installEvt ? 'Installe Carnet comme une vraie application : icône, plein écran, notifications.'
    : isIOS() ? "Sur iPhone : Safari → Partager → Sur l'écran d'accueil."
    : "Installe Carnet depuis le menu du navigateur (⋮ → Installer l'application).";
  $('#s-install').classList.toggle('hidden', isStandalone());
  $('#s-admin').classList.toggle('hidden', !srvStatus?.admin);
  const cs = $('#s-cron-state');
  if (!srvStatus?.admin) cs.textContent = '';
  else if (cronOk()) {
    cs.className = 'small ok-txt';
    cs.textContent = `Envoi automatique des rappels actif (dernier passage il y a ${srvStatus.cronAge} s) · ${plural(srvStatus.pushDevices, 'appareil')} abonné${srvStatus.pushDevices > 1 ? 's' : ''}.`;
  } else {
    cs.className = 'small warn-txt';
    cs.textContent = srvStatus.cronAge == null
      ? "Attention : cron.php n'a jamais tourné : sans lui, les rappels n'arrivent pas quand l'appli est réduite ou fermée (voir LISEZMOI)."
      : `Attention : cron.php ne tourne plus depuis ${Math.round(srvStatus.cronAge / 60)} min : les rappels n'arrivent que quand l'appli est ouverte.`;
  }
  const tasks = live('tasks'), notes = live('notes');
  $('#s-stats').textContent = `${plural(tasks.length, 'tâche')} (${tasks.filter(t => t.done).length} terminées) · ${plural(notes.filter(n => !n.trashed).length, 'note')} · ${plural(live('lists').length, 'liste')}.`;
  // Résumé affiché sur chaque section repliée
  const hint = (k, v) => { const el = $('#sg-' + k); if (el) el.textContent = v; };
  hint('account', loc ? 'Mode local' : user);
  hint('look', (THEMES.find(([v]) => v === th) || sk || [])[1] || '');
  hint('notes', { small: 'Petit', normal: 'Normal', large: 'Grand' }[S.settings.noteSize || 'normal']);
  hint('app', isStandalone() ? 'Installée' : 'Non installée');
  hint('notif', !('Notification' in window) ? 'Indisponible' : pushOn ? 'Activées' : Notification.permission === 'denied' ? 'Bloquées' : 'Désactivées');
  hint('data', plural(tasks.length + notes.length, 'élément'));
  hint('admin', srvStatus?.admin ? (adminData ? plural(adminData.stats.accounts, 'compte') : cronOk() ? 'Cron actif' : 'Cron arrêté') : '');
  hint('rem', streaksOn() ? 'Séries actives' : 'Séries désactivées');
  $('#s-streaks').checked = streaksOn();
  $('#s-linkprev').checked = lpOn();
  $('#s-linkprev').disabled = isLocal();
  $('#s-linkprev-txt').textContent = isLocal() ? "Indisponible en mode local : il faut le serveur pour lire les pages."
    : "Affiche le titre et l'image des sites cités dans les notes. Le serveur de Carnet lit la page du lien pour cela, et l'image vient directement du site.";
  $('#s-imgcheck-wrap').classList.toggle('hidden', isLocal());
}

// Sections des réglages repliables : on retient lesquelles sont ouvertes (Compte et Apparence ouverts par défaut).
{
  let open = ['account', 'look'];
  try { open = JSON.parse(lsGet('rp_sg_open2') || '["account","look"]'); } catch {}
  $$('#v-settings details.sg').forEach(d => {
    d.open = open.includes(d.dataset.sg);
    d.addEventListener('toggle', () => {
      lsSet('rp_sg_open2', JSON.stringify($$('#v-settings details.sg').filter(x => x.open).map(x => x.dataset.sg)));
    });
  });
}

function setSetting(k, v) {
  S.settings = { ...S.settings, [k]: v, updatedAt: Date.now() };
  changed();
}

const darkMQ = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = user ? S.settings.theme || 'auto' : 'dim';
  const sk = skinOf(t);
  // Auto : gris le jour, sombre quand le système est en mode sombre.
  const th = sk ? sk[2] : t === 'auto' ? (darkMQ.matches ? 'dark' : 'grey') : THEME_PV[t] ? t : 'grey';
  const root = document.documentElement;
  root.dataset.theme = th;
  if (sk) { root.dataset.skin = sk[0]; loadSkinFont(sk[0]); } else delete root.dataset.skin;
  root.style.setProperty('--accent', curAccent());
  root.style.setProperty('--note-fs', NOTE_FS[S.settings.noteSize] || NOTE_FS.normal);
  // Barre d'état Android : même couleur que la barre de titre (qui est en couleur « surface »), pas le fond de page.
  $('meta[name=theme-color]').content = sk ? sk[4] : THEME_PV[th][1];
}
darkMQ.addEventListener?.('change', applyTheme);

function swatchesHTML(cur) {
  return COLORS.map(c => `<button type="button" class="sw ${c ? '' : 'none'} ${c === (cur || '') ? 'on' : ''}" data-c="${c}"
    ${c ? `style="background:var(--c-${c})"` : ''} aria-label="${COLOR_NAMES[c]}" title="${COLOR_NAMES[c]}"></button>`).join('');
}

// Couleurs de fond proposées pour l'avatar ('' = couleur d'origine de l'emoji, ou couleur principale pour l'initiale).
const AV_COLORS = ['', '#ffd8b5', '#fff1a8', '#cdeec0', '#cfe7fb', '#eadcf8', '#f8d0dc', '#e3e3e3',
  '#e53935', '#fb8c00', '#43a047', '#00897b', '#1e88e5', '#7c4dff', '#d81b60', '#37474f'];
const isHex = c => /^#[0-9a-f]{6}$/i.test(c || '');
// Texte blanc sur fond foncé, foncé sur fond clair.
const inkOn = c => { const n = parseInt(c.slice(1), 16), l = 0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255); return l > 160 ? '#202124' : '#fff'; };
function avatarStyle(i, bg) {
  if (isHex(bg)) return `background:${bg};color:${inkOn(bg)}`;
  return i != null && AV_BG[i] ? `background:${AV_BG[i]}` : '';
}
function avatarHTML(cls = '') {
  const i = S.settings.avatar, bg = S.settings.avatarBg;
  if (i != null && AVATARS[i]) return `<span class="avatar emoji ${cls}" style="${avatarStyle(i, bg)}">${AVATARS[i]}</span>`;
  return `<span class="avatar ${cls}" style="${avatarStyle(null, bg)}">${esc((uname() || '?')[0])}</span>`;
}

async function pickAvatar() {
  let av = S.settings.avatar ?? null, bg = isHex(S.settings.avatarBg) ? S.settings.avatarBg : '';
  const custom = bg && !AV_COLORS.includes(bg);
  const html = `<div class="av-prev" id="av-prev"></div>
    <div class="row-label">Fond</div>
    <div class="av-colors">${AV_COLORS.map(c => `<button type="button" data-avbg="${c}" class="${c ? '' : 'auto'}" ${c ? `style="background:${c}"` : ''} title="${c ? 'Couleur' : 'Couleur d\'origine'}" aria-label="${c ? 'Couleur ' + c : 'Couleur d\'origine'}"></button>`).join('')}
      <label class="av-custom ${custom ? 'on' : ''}" title="Autre couleur" ${custom ? `style="background:${bg}"` : ''}>${icon('palette')}<input type="color" value="${bg || '#7c4dff'}" aria-label="Autre couleur"></label></div>
    <div class="row-label">Image</div>
    <div class="av-grid"><button type="button" class="letter" data-av="-1" title="Initiale">${esc(uname()[0])}</button>`
    + AVATARS.map((a, i) => `<button type="button" data-av="${i}">${a}</button>`).join('') + '</div>';
  const paint = () => {
    const d = $('#dlg');
    $('#av-prev', d).innerHTML = av != null && AVATARS[av]
      ? `<span class="avatar emoji big" style="${avatarStyle(av, bg)}">${AVATARS[av]}</span>`
      : `<span class="avatar big" style="${avatarStyle(null, bg)}">${esc(uname()[0])}</span>`;
    $$('[data-av]', d).forEach(b => {
      const i = +b.dataset.av;
      b.classList.toggle('on', i < 0 ? av == null : av === i);
      b.style.cssText = i < 0 ? avatarStyle(null, bg) : avatarStyle(i, bg);
    });
    $$('[data-avbg]', d).forEach(b => b.classList.toggle('on', b.dataset.avbg === bg));
    const cu = $('.av-custom', d), isCustom = !!bg && !AV_COLORS.includes(bg);
    cu.classList.toggle('on', isCustom);
    cu.style.background = isCustom ? bg : '';
    cu.style.color = isCustom ? inkOn(bg) : '';
  };
  const p = dialog({
    title: 'Choisis ton avatar', html, buttons: [{ label: 'Annuler' }, { label: 'Valider', primary: true, value: 1 }],
    onClick: e => {
      const a = e.target.closest('[data-av]'), c = e.target.closest('[data-avbg]');
      if (a) { av = +a.dataset.av < 0 ? null : +a.dataset.av; paint(); return true; }
      if (c) { bg = c.dataset.avbg; paint(); return true; }
      return !!e.target.closest('.av-custom');
    },
  });
  $('#dlg .av-custom input').addEventListener('input', e => { bg = e.target.value; paint(); });
  paint();
  if (!(await p)) return;
  S.settings = { ...S.settings, avatar: av, avatarBg: bg, updatedAt: Date.now() };
  changed();
}

async function renameUser() {
  const name = await ask("Nouveau nom d'utilisateur", user, 'Renommer');
  if (!name || name.toLowerCase() === user) return;
  try {
    const r = await api('rename', { user: name });
    const old = user;
    for (const k of ['rp_state:', 'rp_base:', 'rp_account:']) {
      const v = lsGet(k + old);
      if (v != null) { lsSet(k + r.user, v); lsDel(k + old); }
    }
    user = r.user;
    lsSet('rp_last_user', user);
    render();
    toast('Tu es maintenant « ' + user + ' »');
  } catch (e) { toast(e.status ? e.message : 'Impossible hors ligne, réessaie une fois connecté'); }
}

// ================= Toast =================
let toastTimer;
function toast(msg, actLabel, act) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${actLabel ? `<button>${esc(actLabel)}</button>` : ''}`;
  if (actLabel) el.querySelector('button').onclick = () => { el.classList.remove('show'); act(); };
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4500);
}

// ================= Fenêtres superposées + bouton "retour" =================
// Chaque fenêtre ouverte ajoute une entrée d'historique : le bouton retour d'Android la ferme.
const overlays = [];
let afterPop = [];
function openOverlay(kind) {
  overlays.push(kind);
  history.pushState({ ov: overlays.length }, '');
  lockScroll();
}
const lockScroll = () => {
  const on = overlays.some(k => k !== 'select');
  document.documentElement.classList.toggle('noscroll', on);
  document.body.classList.toggle('noscroll', on);
};
// `then` s'exécute une fois la fenêtre réellement fermée.
function closeOverlay(then) {
  if (then) afterPop.push(then);
  if (overlays.length) history.back();
  else runAfterPop();
}
function runAfterPop() { const fns = afterPop; afterPop = []; fns.forEach(f => f()); }
window.addEventListener('popstate', () => {
  const k = overlays.pop();
  if (k === 'sheet') closeSheetNow();
  else if (k === 'editor') closeNoteNow();
  else if (k === 'dialog') closeDialogNow();
  else if (k === 'select') { selNotes = null; selTasks = null; selImgs = null; render(); }
  else if (k === 'draw') closeDrawNow();
  else if (k === 'viewer') closeViewerNow();
  lockScroll();
  runAfterPop();
});

// ================= Dialogues =================
let dlgResolve = null, dlgResult = null;

// o = { title, text, html, input, placeholder, items:[{label,icon,value,danger}], buttons:[{label,value,primary,danger}] }
// Résout avec { value, text } ou null si annulé.
let dlgRemember = false; // case « Se rappeler de mon choix » du dernier dialogue
function dialog(o) {
  return new Promise(res => {
    dlgResolve = res;
    dlgResult = null;
    const d = $('#dlg');
    d.className = 'dlg' + (o.items ? ' menu' : '');
    d.innerHTML = `${o.title ? `<h3>${esc(o.title)}</h3>` : ''}${o.text ? `<p>${esc(o.text)}</p>` : ''}${o.html || ''}
      ${o.input != null ? `<input id="dlg-in" type="${o.inputType || 'text'}" value="${esc(o.input)}" placeholder="${esc(o.placeholder || '')}" enterkeyhint="done">` : ''}
      ${o.items ? `<div class="dlg-items">${o.items.map((it, i) => `<button data-i="${i}" class="${it.danger ? 'danger' : ''}">${it.icon ? icon(it.icon) : ''}<span>${esc(it.label)}</span></button>`).join('')}</div>` : ''}
      ${o.buttons ? `<div class="dlg-btns ${o.col ? 'col' : ''}">${o.buttons.map((b, i) => `<button class="btn ${b.primary ? 'primary' : ''} ${b.danger ? 'danger' : ''}" data-b="${i}">${esc(b.label)}</button>`).join('')}</div>` : ''}`;
    const pick = r => { dlgResult = r; dlgRemember = !!$('#dlg-remember')?.checked; closeOverlay(); };
    d.onclick = e => {
      if (o.onClick && o.onClick(e, pick)) return;
      const it = e.target.closest('[data-i]'), b = e.target.closest('[data-b]');
      if (it) pick({ value: o.items[+it.dataset.i].value });
      else if (b) {
        const bb = o.buttons[+b.dataset.b];
        pick(bb.value == null ? null : { value: bb.value, text: $('#dlg-in')?.value ?? '' });
      }
    };
    const inp = $('#dlg-in');
    if (inp) inp.onkeydown = e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const p = o.buttons.find(b => b.primary);
      if (p) pick({ value: p.value, text: inp.value });
    };
    $('#dlg-backdrop').classList.add('show');
    d.classList.add('show');
    openOverlay('dialog');
    if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 60);
  });
}
function closeDialogNow() {
  $('#dlg').classList.remove('show');
  $('#dlg-backdrop').classList.remove('show');
  const r = dlgResolve;
  dlgResolve = null;
  r?.(dlgResult);
}
$('#dlg-backdrop').addEventListener('click', () => closeOverlay());

async function ask(title, value, okLabel, placeholder) {
  const r = await dialog({ title, input: value, placeholder, buttons: [{ label: 'Annuler' }, { label: okLabel || 'OK', value: 'ok', primary: true }] });
  return r && r.text.trim() ? r.text.trim() : null;
}
async function confirmDlg(title, text, okLabel, danger) {
  const r = await dialog({ title, text, buttons: [{ label: 'Annuler' }, { label: okLabel || 'OK', value: 'ok', primary: !danger, danger }] });
  return !!r;
}
// Petit menu déroulant accroché à un bouton : items = [{ value, label, icon, n, on }]. Renvoie la valeur choisie (ou null).
let popClose = null, popAnchor = null;
function popMenu(anchor, items, head = '') {
  if (popClose) {
    const same = popAnchor === anchor;
    popClose(null);
    if (same) return Promise.resolve(null); // second appui sur le même bouton : referme
  }
  popAnchor = anchor;
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'pop-menu';
    el.setAttribute('role', 'menu');
    el.innerHTML = (head ? `<div class="pop-head">${esc(head)}</div>` : '') + items.map(it => `<button type="button" role="menuitem" class="${it.on ? 'on' : ''}" data-pv="${it.value}">${it.icon ? icon(it.icon) : ''}${it.sw ? `<i class="pop-sw" style="background:${esc(it.sw)}"></i>` : ''}<span class="grow">${esc(it.label)}</span>${it.n != null ? `<span class="n">${it.n}</span>` : ''}${it.on ? icon('check') : ''}</button>`).join('');
    document.body.appendChild(el);
    // Sous le bouton, aligné sur son bord le plus proche ; au-dessus s'il n'y a pas la place en dessous.
    const r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    const left = r.left + w > innerWidth - 8 ? r.right - w : r.left;
    const top = r.bottom + 6 + h > innerHeight - 8 ? r.top - 6 - h : r.bottom + 6;
    el.style.left = Math.max(8, left) + 'px';
    el.style.top = Math.max(8, top) + 'px';
    el.style.transformOrigin = `${left < r.left ? 'right' : 'left'} ${top < r.top ? 'bottom' : 'top'}`;
    anchor.setAttribute('aria-expanded', 'true');
    const outside = e => { if (!el.contains(e.target) && !anchor.contains(e.target)) done(null); };
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); done(null); } };
    const done = v => {
      popClose = popAnchor = null;
      el.remove();
      anchor.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', key, true);
      removeEventListener('scroll', close, true);
      removeEventListener('resize', close);
      resolve(v);
    };
    const close = () => done(null);
    el.addEventListener('click', e => { const b = e.target.closest('[data-pv]'); if (b) done(b.dataset.pv); });
    setTimeout(() => {
      document.addEventListener('pointerdown', outside, true);
      document.addEventListener('keydown', key, true);
      addEventListener('scroll', close, true);
      addEventListener('resize', close);
    });
    popClose = done;
    el.querySelector('button.on, button')?.focus({ preventScroll: true });
  });
}

async function menu(title, items) {
  const r = await dialog({ title, items });
  return r ? r.value : null;
}

// ================= Tâches =================
let edTask = null;

function quickAdd(title) {
  title = title.trim();
  if (!title) return;
  const now = Date.now();
  const real = curList !== 'all' && curList !== 'starred';
  const t = { id: uid(), title, details: '', date: '', time: '', repeat: 'none', days: [], color: '', done: false,
    list: real ? curList : '', starred: curList === 'starred', createdAt: now, updatedAt: now };
  S.tasks[t.id] = t;
  justAdded = t.id;
  changed();
}

function toggleTask(id) {
  const t = S.tasks[id];
  if (!t) return;
  const prev = { ...t };
  const undo = () => { S.tasks[id] = { ...prev, updatedAt: Date.now() }; syncNoteLine(S.tasks[id]); changed(); };
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : 0;
  // Répétitive : reste cochée jusqu'à sa prochaine date, puis revient toute seule.
  t.nextDate = t.done && isRep(t) && t.date ? nextDate(t) : '';
  const sr = isRep(t) && t.date ? updateStreak(t) : null;
  if (t.done) toast(t.nextDate ? doneMsg(t, streaksOn() ? sr : null) : 'Tâche terminée', 'Annuler', undo);
  syncNoteLine(t);
  t.updatedAt = Date.now();
  changed();
  if (t.done && t.date && streaksOn()) checkDayDone();
}

// ----- Séries (inspiré de HAPPY, en plus simple) -----
// Rappel répétitif fait à temps (au plus tard le jour prévu) : la série continue. En retard : elle repart à 1.
function updateStreak(t) {
  const hist = Array.isArray(t.hist) ? [...t.hist] : [];
  if (t.done) {
    const onTime = dayDiff(t.date) >= 0;
    t.lastStreak = t.streak || 0;
    t.streak = onTime ? (t.streak || 0) + 1 : 1;
    const rec = t.streak > (t.best || 0) && t.streak > 1;
    t.best = Math.max(t.best || 0, t.streak);
    t.count = (t.count || 0) + 1;
    hist.push(today());
    t.hist = hist.slice(-120);
    return { onTime, rec, lost: !onTime && t.lastStreak > 1 };
  }
  // Décoché : on revient où on en était.
  const i = hist.lastIndexOf(today());
  if (i >= 0) { hist.splice(i, 1); t.count = Math.max(0, (t.count || 1) - 1); }
  t.hist = hist;
  t.streak = t.lastStreak || 0;
  return null;
}
function doneMsg(t, sr) {
  const back = 'revient ' + fmtDay(t.nextDate);
  if (!sr) return 'Fait ! ' + back[0].toUpperCase() + back.slice(1);
  if (sr.rec) return `Nouveau record : ${t.streak} d'affilée · ${back}`;
  if (sr.lost) return `En retard : série repartie à 1 · ${back}`;
  if (t.streak > 1) return `Série de ${t.streak} · ${back}`;
  return 'Fait ! ' + back[0].toUpperCase() + back.slice(1);
}
// Rappels du jour : ceux prévus aujourd'hui (faits ou non).
function dayProgress() {
  const td = today(), ts = live('tasks').filter(t => t.date === td);
  return { total: ts.length, done: ts.filter(t => t.done).length };
}
function checkDayDone() {
  const p = dayProgress();
  if (p.total >= 2 && p.done === p.total) setTimeout(() => { navigator.vibrate?.([15, 60, 15]); toast("Journée bouclée : tous les rappels d'aujourd'hui sont faits"); }, 900);
}
// Mini-calendrier des 12 dernières semaines (une colonne par semaine, lundi en haut).
function streakHTML(t) {
  if (!isRep(t) || !t.id || !streaksOn()) return '';
  const done = new Set(t.hist || []);
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7 * 11); // lundi, il y a 11 semaines
  const td = today();
  let cells = '';
  for (let i = 0; i < 84; i++, d.setDate(d.getDate() + 1)) {
    const k = ymd(d);
    cells += `<i class="${done.has(k) ? 'on' : ''} ${k === td ? 'td' : ''} ${k > td ? 'fut' : ''}" title="${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}"></i>`;
  }
  const late = isLate(t) && (t.streak || 0) > 1;
  return `<div class="st-nums">
      <span class="${late ? 'risk' : ''}" title="${late ? 'Série en danger' : 'Série en cours'}">${icon('flame')}<b>${t.streak || 0}</b>série</span>
      <span title="Meilleure série">${icon('trophy')}<b>${t.best || 0}</b>record</span>
      <span title="Nombre de fois fait">${icon('check')}<b>${t.count || 0}</b>fait${(t.count || 0) > 1 ? 's' : ''}</span>
    </div>
    <div class="st-cal">${cells}</div>`;
}

// Coche : petite animation + vibration, puis la tâche part dans « Terminées ».
const pendingToggle = new Set();
function animateToggle(btn, id) {
  const t = S.tasks[id];
  if (!t || pendingToggle.has(id)) return;
  pendingToggle.add(id);
  navigator.vibrate?.(12);
  const card = btn.closest('.task');
  if (!t.done) { card?.classList.add('done', 'leaving'); btn.innerHTML = icon('check'); }
  else card?.classList.remove('done');
  btn.classList.add('pop');
  setTimeout(() => { pendingToggle.delete(id); toggleTask(id); }, t.done ? 140 : 340);
}

// Balayage d'une tâche : → la terminer, ← la supprimer (annulable).
let lastSwipe = 0;
function enableSwipe(container) {
  let st = null;
  container.addEventListener('pointerdown', e => {
    const card = e.target.closest('.task[data-id]');
    if (!card || e.button > 0 || e.target.closest('.chk, .star')) return;
    st = { card, id: card.dataset.id, x: e.clientX, y: e.clientY, dx: 0, on: false, pid: e.pointerId };
  });
  container.addEventListener('pointermove', e => {
    if (!st || e.pointerId !== st.pid) return;
    if (dragSel) { st = null; return; } // appui long : on sélectionne, pas de balayage
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.on) {
      if (Math.abs(dy) > 10) { st = null; return; }
      if (Math.abs(dx) < 12) return;
      st.on = true;
      st.card.setPointerCapture?.(e.pointerId);
      st.card.classList.add('swiping');
    }
    st.dx = dx;
    const p = Math.min(1, Math.abs(dx) / (st.card.offsetWidth * 0.35));
    st.card.style.transform = `translateX(${dx}px) rotate(${dx / 60}deg)`;
    st.card.style.background = `color-mix(in srgb, ${dx > 0 ? 'var(--ok)' : 'var(--danger)'} ${Math.round(p * 32)}%, var(--card, var(--surface)))`;
    st.card.style.opacity = String(1 - p * 0.25);
  });
  const end = () => {
    if (!st) return;
    const { card, id, dx, on } = st;
    st = null;
    if (!on) return;
    lastSwipe = Date.now();
    card.classList.remove('swiping');
    const w = card.offsetWidth;
    card.style.transition = 'transform .22s ease, opacity .22s ease, background-color .22s';
    if (Math.abs(dx) > w * 0.35) {
      navigator.vibrate?.(15);
      card.style.transform = `translateX(${dx > 0 ? w : -w}px)`;
      card.style.opacity = '0';
      setTimeout(() => (dx > 0 ? toggleTask(id) : deleteTask(id)), 200);
    } else {
      card.style.transform = '';
      card.style.background = '';
      card.style.opacity = '';
    }
  };
  container.addEventListener('pointerup', end);
  container.addEventListener('pointercancel', end);
}

function toggleStar(id) {
  const t = S.tasks[id];
  if (!t) return;
  S.tasks[id] = { ...t, starred: !t.starred, updatedAt: Date.now() };
  changed();
}

function deleteTask(id) {
  const t = S.tasks[id];
  if (!t) return;
  const prev = { ...t };
  S.tasks[id] = { id, deleted: true, updatedAt: Date.now() };
  changed();
  toast('Tâche supprimée', 'Annuler', () => { S.tasks[id] = { ...prev, updatedAt: Date.now() }; changed(); });
}

function openTask(id, preset = {}) {
  const src = id && S.tasks[id];
  const real = curList !== 'all' && curList !== 'starred';
  edTask = src ? { ...src, days: [...(src.days || [])] }
    : { id: null, title: '', details: '', ...nextHour(), repeat: 'none', days: [], color: '', done: false,
        list: real && view === 'tasks' ? curList : '', starred: view === 'tasks' && curList === 'starred', ...preset };
  if (edTask.repeat === 'days') edTask.repeat = 'weekly';
  $('#t-title').value = edTask.title || '';
  $('#t-details').value = edTask.details || '';
  $('#t-date').value = edTask.date || '';
  $('#t-time').value = edTask.time || '';
  $('#t-end').value = endTime(edTask);
  endStart = edTask.time || '';
  $('#t-repeat').value = edTask.repeat || 'none';
  $('#t-del').classList.toggle('hidden', !src);
  $('#t-more').open = !!(edTask.color || taskList(edTask));
  sheetKind();
  fillListSelect(taskList(edTask));
  const note = edTask.fromNote && S.notes[edTask.fromNote];
  const showFrom = note && !note.deleted && edTask.fromNote !== curNote;
  $('#t-from').classList.toggle('hidden', !showFrom);
  if (showFrom) $('#t-from').innerHTML = `${icon('notes')}<span>Depuis la note « ${esc(note.title || 'Sans titre')} »</span>`;
  renderSheetBits();
  $('#backdrop').classList.add('show');
  $('#sheet').classList.add('show');
  $('#sheet').scrollTop = 0;
  openOverlay('sheet');
  if (!src && !edTask.title) setTimeout(() => $('#t-title').focus(), 250);
}

// En-tête de la fiche : « Nouveau rappel » si une date est choisie, sinon « Nouvelle tâche ».
function sheetKind() {
  const rem = !!$('#t-date').value, isNew = !edTask?.id;
  $('#t-kind').textContent = isNew ? (rem ? 'Nouveau rappel' : 'Nouvelle tâche') : (rem ? 'Rappel' : 'Tâche');
}

function fillListSelect(sel) {
  $('#t-list').innerHTML = '<option value="">Mes tâches</option>'
    + listsSorted().map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')
    + '<option value="__new">+ Nouvelle liste…</option>';
  $('#t-list').value = sel || '';
}

function renderSheetBits() {
  const sh = $('#sheet');
  if (edTask.color) sh.style.setProperty('--card', `var(--c-${edTask.color})`); else sh.style.removeProperty('--card');
  $('#t-colors').innerHTML = swatchesHTML(edTask.color);
  $('#t-star').classList.toggle('on', !!edTask.starred);
  const rep = $('#t-repeat').value;
  $('#t-days').classList.toggle('hidden', rep !== 'weekly');
  $('#t-days').innerHTML = DAYS.map(([v, l]) => `<button type="button" data-day="${v}" class="${edTask.days.includes(v) ? 'on' : ''}">${l}</button>`).join('');
  const st = rep !== 'none' ? streakHTML(edTask) : '';
  $('#t-stats').innerHTML = st;
  $('#t-stats').classList.toggle('hidden', !st);
}

function saveTask() {
  const t = edTask;
  if (!t) return;
  const src0 = t.id ? S.tasks[t.id] : null;
  t.title = $('#t-title').value.trim();
  t.details = $('#t-details').value.trim();
  t.date = $('#t-date').value;
  t.time = $('#t-time').value;
  t.dur = durFrom(t.time, $('#t-end').value);
  t.repeat = $('#t-repeat').value;
  t.list = $('#t-list').value === '__new' ? '' : $('#t-list').value;
  if (!t.title && !t.details) { closeOverlay(); return; }
  if (t.time && !t.date) t.date = today();
  if (t.repeat !== 'none' && !t.date) t.date = today();
  if (t.repeat === 'weekly' && !t.days.length) t.days = [weekday(t.date)];
  if (t.repeat !== 'weekly') t.days = [];
  t.nextDate = t.done && isRep(t) ? nextDate(t) : '';
  if (t.repeat === 'monthly') t.anchor = new Date(t.date + 'T00:00').getDate();
  const now = Date.now();
  if (!t.id) { t.id = uid(); t.createdAt = now; justAdded = t.id; }
  t.updatedAt = now;
  const wasDated = !!(src0 && src0.date);
  S.tasks[t.id] = t;
  closeOverlay();
  changed();
  if (curNote) edRerender();
  else if (view === 'tasks' && t.date && !wasDated) toast('Ajouté aux rappels', 'Voir', () => setView('agenda'));
  else if (view === 'agenda' && !t.date) toast('Déplacé dans les tâches', 'Voir', () => setView('tasks'));
  if (t.time && 'Notification' in window && Notification.permission === 'default') {
    toast('Activer les notifications pour ce rappel ?', 'Activer', askNotif);
  }
}

function closeSheetNow() {
  $('#backdrop').classList.remove('show');
  $('#sheet').classList.remove('show');
  if (document.activeElement?.closest?.('#sheet')) document.activeElement.blur();
  edTask = null;
}

// Tâche cochée ↔ case de la note d'origine.
function syncNoteLine(t) {
  if (!t || !t.fromNote || (t.repeat && t.repeat !== 'none')) return;
  const n = t.fromNote === curNote ? noteObj() : S.notes[t.fromNote];
  if (!n || n.deleted) return;
  const lines = (n.body || '').split('\n');
  const i = lines.findIndex(l => { const m = l.match(RE_CHECK); return m && cleanText(m[3]) === t.title; });
  if (i < 0) return;
  const on = lines[i].match(RE_CHECK)[2] !== ' ';
  if (on === !!t.done) return;
  lines[i] = lines[i].replace(/\[[ xX]\]/, t.done ? '[x]' : '[ ]');
  setNoteBody(n.id, lines.join('\n'));
}

// ================= Notes =================
// L'éditeur est une zone "contenteditable" : le texte brut (avec *gras*, [ ] cases…) reste la
// source de vérité, et il est ré-affiché mis en forme à chaque frappe, marqueurs visibles mais discrets.
let curNote = null, draft = null, lastEdInput = 0;
let edText = '', composing = false, refreshRetry = null;
const noteObj = () => S.notes[curNote] || draft;
const edEl = () => $('#ed-body');

function openNote(id, startBody = '') {
  let n = id && S.notes[id];
  draft = null;
  if (!n) {
    const now = Date.now();
    n = draft = { id: uid(), title: '', body: '', color: '', pattern: 'none', pinned: false, archived: noteFilter === 'archive', createdAt: now, updatedAt: now };
  }
  curNote = n.id;
  edLastSel = null;
  $('#ed-title').value = n.title || '';
  edEl().dataset.id = n.id;
  edFull = true;
  edRender(n.body || '', null);
  edScroller().scrollTop = 0;
  closeEdPanels(false);
  histReset();
  renderEdImages();
  renderEdLinks();
  setTrashMode(!!n.trashed);
  edSlideIn();
  document.body.classList.add('ed-open');
  openOverlay('editor');
  styleEditor();
  if (draft && startBody) edRender(startBody, null);
  if (draft) setTimeout(() => { edEl().focus(); edSetSel(startBody.length); }, 60);
}

// ----- Rendu "en direct" : chaque caractère du texte brut reste présent dans le DOM -----
function liveInline(text) {
  return String(text).split(/(https?:\/\/[^\s]+)/g).map((p, i) => {
    if (i % 2) return `<span class="lnk">${esc(p)}</span>`;
    const mk = (m, c = '') => `<span class="mk${c}">${m}</span>`;
    const mark = m => new RegExp(`(^|[^\\p{L}\\p{N}${m}])${m}([^\\s${m}](?:[^${m}\\n]*?[^\\s${m}])?)${m}(?![\\p{L}\\p{N}${m}])`, 'gu');
    return esc(p)
      .replace(RE_TCOLOR, (_, sp, t) => `${mk('{' + sp + ':', ' c')}<span class="${styleCls(sp)}">${t}</span>${mk('}', ' c')}`)
      .replace(/`([^`\n]+)`/g, (_, t) => `${mk('`')}<code>${t}</code>${mk('`')}`)
      .replace(mark('\\*'), (_, a, t) => `${a}${mk('*')}<b>${t}</b>${mk('*')}`)
      .replace(mark('_'), (_, a, t) => `${a}${mk('_')}<i>${t}</i>${mk('_')}`)
      .replace(mark('~'), (_, a, t) => `${a}${mk('~')}<s>${t}</s>${mk('~')}`);
  }).join('');
}

// Préfixe de ligne → [type, longueur]. Le préfixe est affiché comme un élément non modifiable
// (case, puce…) : le curseur ne peut pas s'y glisser et Retour arrière l'enlève d'un coup.
function linePrefixOf(l) {
  let m;
  if ((m = l.match(/^(\s*)\[([ xX])\] ?/))) return ['ck', m[0], m[1], m[2] !== ' '];
  if ((m = l.match(/^(\s*)[-*•] /))) return ['bl', m[0], m[1]];
  if ((m = l.match(/^(\s*)\d+[.)] /))) return ['nm', m[0], m[1]];
  if ((m = l.match(/^#{1,3} /))) return ['h', m[0], ''];
  if ((m = l.match(/^> ?/))) return ['q', m[0], ''];
  return ['', '', ''];
}

// Une chaîne HTML par ligne (la position de la ligne n'y figure pas : une ligne inchangée garde le même HTML).
function liveLines(text, noteId) {
  const imgs = (noteId === curNote ? noteObj() : S.notes[noteId])?.images || [];
  let cols = 0;
  return text.split('\n').map(l => {
    if (RE_COL.test(l)) {
      // Bloc non modifiable, comme une image : seul le premier marque le passage à la 2e colonne.
      return `<div class="ln colln${cols++ ? '' : ' brk'}"><span class="colmk" contenteditable="false" data-raw="${COL_MARK}" data-act="colmenu" title="Début de la 2e colonne"></span><br></div>`;
    }
    const im = l.match(RE_IMG), img = im && imgs.find(x => x.id === im[1]);
    if (img) {
      // Bloc non modifiable : son texte brut (data-raw) est « [img:ID] ». Déjà chargée : affichée tout de suite (pas de clignotement).
      const src = fullUrl.get(img.id) || hqSeen.get(img.id);
      const sz = (im[2] || 'f').toLowerCase();
      return `<div class="ln imgln${imgMove === img.id ? ' moving' : ''}"><span class="inimg sz-${sz}" contenteditable="false" data-raw="${imgMark(img.id, sz)}" data-img="${img.id}">`
        + `<span class="imgbox ${src ? '' : 'lq'}" style="--ar:${img.w} / ${img.h}"><img ${src ? `src="${src}" data-ok="1" data-hq="1"` : ''} data-full="${img.id}" alt=""></span></span>`
        + (im[3] ? liveInline(im[3]) : '<br>') + '</div>';
    }
    const [kind, pre, ind, on] = linePrefixOf(l);
    const rest = l.slice(pre.length);
    const indent = ind ? ` style="margin-left:${Math.min(Math.floor(ind.replace(/\t/g, '  ').length / 2), 6) * 22}px"` : '';
    let h = pre ? `<span class="pfx pfx-${kind}" contenteditable="false"${kind === 'ck' ? ' data-act="ncheck"' : ''}${indent}>${esc(pre)}</span>` : '';
    h += liveInline(rest);
    if (kind === 'ck' && cleanText(rest)) {
      const t = linkedTask(noteId, rest);
      h += `<span class="plan ${t ? 'on' : ''}" contenteditable="false" data-skip data-act="nplan" title="${t ? 'Voir la tâche liée' : 'Planifier en tâche'}">${icon(t ? 'bell' : 'bellPlus')}</span>`;
    }
    if (!rest) h += '<br>';
    return `<div class="ln${kind ? ' ' + kind : ''}${on ? ' on' : ''}">${h}</div>`;
  });
}

// Lignes touchées par le navigateur depuis le dernier rendu (frappe, correcteur, saisie composée…) :
// elles sont toujours redessinées ; les autres sont gardées telles quelles si leur HTML n'a pas changé.
let edLinesHTML = null, edFull = true;
const edDirty = new Set();
function edMuts(records) {
  const el = edEl();
  for (const r of records) {
    let n = r.target;
    if (n === el) { edFull = true; continue; }
    while (n && n.parentNode !== el) n = n.parentNode;
    if (n) edDirty.add(n); else edFull = true;
  }
}
const edObserver = new MutationObserver(edMuts);
edObserver.observe(edEl(), { childList: true, characterData: true, subtree: true });

// scroll = false : la vue ne bouge pas (case cochée, modification venue d'un autre appareil…).
const edScroller = () => $('#ed-main');
function edRender(text, sel, scroll = true) {
  const el = edEl(), sc = edScroller(), top = sc.scrollTop;
  edText = text;
  const lines = liveLines(text, curNote), old = edLinesHTML, kids = el.children;
  edMuts(edObserver.takeRecords());
  if (!old || edFull || el.childNodes.length !== old.length || kids.length !== old.length) {
    el.innerHTML = lines.join('');
  } else {
    // Seul le bloc de lignes modifiées est remplacé : pas de clignotement, images et curseur stables.
    const same = (i, j) => old[i] === lines[j] && !edDirty.has(kids[i]);
    let a = 0, b = 0;
    while (a < old.length && a < lines.length && same(a, a)) a++;
    while (b < old.length - a && b < lines.length - a && same(old.length - 1 - b, lines.length - 1 - b)) b++;
    if (a < old.length - b || a < lines.length - b) {
      const ref = kids[old.length - b] || null;
      for (let i = old.length - b - 1; i >= a; i--) kids[i].remove();
      const tpl = document.createElement('template');
      tpl.innerHTML = lines.slice(a, lines.length - b).join('');
      el.insertBefore(tpl.content, ref);
    }
  }
  edObserver.takeRecords(); // nos propres changements ne comptent pas
  edLinesHTML = lines;
  edFull = false;
  edDirty.clear();
  if (el.querySelector('.inimg img:not([data-ok])')) hydrateImages(el);
  el.classList.toggle('is-empty', !text);
  el.classList.toggle('cols2', hasCols(text));
  sc.scrollTop = top;
  if (sel) edSetSel(sel.s, sel.e, scroll);
}
function edRerender() { if (curNote) edRender(edText, document.activeElement === edEl() ? edGetSel() : null, false); }

// ----- Texte brut ↔ DOM -----
function nodeText(n) {
  let t = '';
  for (const c of n.childNodes) {
    if (c.nodeType === 3) t += c.data;
    else if (c.nodeType === 1 && c.hasAttribute('data-raw')) t += c.dataset.raw; // image dans le texte
    else if (c.nodeType === 1 && c.tagName !== 'BR' && !c.hasAttribute('data-skip')) t += nodeText(c);
  }
  return t;
}
// Une ligne = un <div> ; des nœuds "libres" consécutifs (insérés par le navigateur) forment aussi une ligne.
function containerText(root) {
  const lines = [];
  let run = null;
  for (const c of root.childNodes) {
    if (c.nodeType === 1 && (c.tagName === 'DIV' || c.tagName === 'P')) {
      if (run !== null) { lines.push(run); run = null; }
      lines.push(nodeText(c));
    } else if (c.nodeType === 1 && c.tagName === 'BR') {
      lines.push(run ?? '');
      run = null;
    } else {
      run = (run ?? '') + (c.nodeType === 3 ? c.data : c.hasAttribute?.('data-skip') ? '' : nodeText(c));
    }
  }
  if (run !== null) lines.push(run);
  return lines.join('\n').replace(/ /g, ' ').replace(/​/g, '');
}
const edGetText = () => containerText(edEl());

// Position (en caractères du texte brut) d'un point du DOM.
function posOf(node, off) {
  const root = edEl();
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(node, off);
  const tmp = document.createElement('div');
  tmp.appendChild(r.cloneContents());
  let p = containerText(tmp).length;
  if (node === root && off > 0 && off < root.childNodes.length) p++; // curseur entre deux lignes
  return p;
}
function edGetSel() {
  const sel = getSelection();
  if (!sel.rangeCount || !edEl().contains(sel.anchorNode)) return null;
  const a = posOf(sel.anchorNode, sel.anchorOffset), b = posOf(sel.focusNode, sel.focusOffset);
  return { s: Math.min(a, b), e: Math.max(a, b) };
}
// Point du DOM correspondant à une position du texte brut.
function pointAt(pos) {
  const root = edEl();
  const lines = edText.split('\n');
  let li = 0;
  while (li < lines.length - 1 && pos > lines[li].length) { pos -= lines[li].length + 1; li++; }
  const div = root.children[li];
  if (!div) return [root, root.childNodes.length];
  let acc = 0, found = null;
  const walk = n => {
    for (const c of n.childNodes) {
      if (found) return;
      if (c.nodeType === 3) {
        if (pos <= acc + c.data.length) { found = [c, pos - acc]; return; }
        acc += c.data.length;
      } else if (c.nodeType === 1 && !c.hasAttribute('data-skip') && c.tagName !== 'BR') {
        if (c.getAttribute('contenteditable') === 'false') {
          const len = nodeText(c).length;
          if (pos <= acc + len) { found = [c.parentNode, [...c.parentNode.childNodes].indexOf(c) + 1]; return; }
          acc += len;
        } else walk(c);
      }
    }
  };
  walk(div);
  if (found) return found;
  // fin de ligne : avant un éventuel bouton "planifier" / <br>
  const last = [...div.childNodes].findIndex(c => c.nodeType === 1 && (c.hasAttribute('data-skip') || c.tagName === 'BR'));
  return [div, last < 0 ? div.childNodes.length : last];
}
function edSetSel(s, e = s, scroll = true) {
  const sc = edScroller(), top = sc.scrollTop;
  const [sn, so] = pointAt(s), [en, eo] = e === s ? [sn, so] : pointAt(e);
  const r = document.createRange();
  try { r.setStart(sn, so); r.setEnd(en, eo); } catch { return; }
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  markCurLine();
  if (scroll) caretIntoView(r);
  else sc.scrollTop = top;
}
// Ligne où se trouve le curseur : ses marqueurs de mise en forme sont affichés.
function markCurLine() {
  const el = edEl(), sel = getSelection();
  let n = sel.rangeCount && el.contains(sel.anchorNode) ? sel.anchorNode : null;
  while (n && n.parentNode !== el) n = n.parentNode;
  for (const d of el.querySelectorAll('.ln.cur')) if (d !== n) d.classList.remove('cur');
  if (n?.classList) n.classList.add('cur');
}
document.addEventListener('selectionchange', () => { if (curNote) markCurLine(); });

function caretIntoView(r) {
  const el = edScroller(), rect = r.getBoundingClientRect(), box = el.getBoundingClientRect();
  if (!rect.height) return;
  if (rect.bottom > box.bottom - 12) el.scrollTop += rect.bottom - box.bottom + 40;
  else if (rect.top < box.top + 4) el.scrollTop -= box.top - rect.top + 40;
}

// ----- Enregistrement -----
// Toute modification de la note passe par ici : elle est enregistrée immédiatement.
function touchNote(mut) {
  const n = noteObj();
  if (!n) return;
  if (n.trashed) { askRestore(); return; }
  mut(n);
  n.updatedAt = Date.now();
  if (draft) justAdded = n.id;
  S.notes[n.id] = n;
  draft = null;
  changed({ quiet: true, delay: 350, lazy: true });
  styleEditor();
}

let styleKey = '';
function styleEditor() {
  const n = noteObj();
  if (!n) return;
  // La palette et les boutons ne sont reconstruits que si l'aspect de la note a changé (pas à chaque frappe).
  const key = [n.id, n.color, n.pattern, n.pinned, n.archived].join('|');
  if (key === styleKey) { updateEdStatus(); return; }
  styleKey = key;
  const ed = $('#editor');
  PATTERNS.forEach(([p]) => ed.classList.remove('pat-' + p));
  ed.classList.add('pat-' + (n.pattern || 'none'));
  if (n.color) ed.style.setProperty('--card', `var(--c-${n.color})`); else ed.style.removeProperty('--card');
  $('#ed-pin').classList.toggle('on', !!n.pinned);
  $('#ed-archive').innerHTML = icon(n.archived ? 'unarchive' : 'archive');
  $('#ed-archive').title = n.archived ? 'Désarchiver' : 'Archiver';
  $('#ed-colors').innerHTML = swatchesHTML(n.color);
  $('#ed-pats').innerHTML = PATTERNS.map(([p, l]) => `<button type="button" class="pt pat-${p} ${p === (n.pattern || 'none') ? 'on' : ''}" data-p="${p}" aria-label="${l}" title="${l}"></button>`).join('');
  updateEdStatus();
}

function updateEdStatus() {
  const n = noteObj();
  if (!n) return;
  const body = n.body || '';
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const parts = [plural(body.length, 'caractère'), plural(words, 'mot')];
  if (!draft) parts.push(ymd(new Date(n.updatedAt)) === today() ? hm(new Date(n.updatedAt)) : new Date(n.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
  $('#ed-status').textContent = parts.join(' · ');
  $('#ed-status').title = draft ? '' : 'Modifiée ' + fmtAgo(n.updatedAt);
}

function onTitleInput() {
  lastEdInput = Date.now();
  touchNote(n => { n.title = $('#ed-title').value; });
  histRecord(false);
}

// Frappe dans le texte : on relit le DOM, on enregistre, puis on ré-affiche mis en forme
// (sauf pendant une saisie "composée" du clavier mobile, pour ne pas la casser).
function onBodyInput(rerender) {
  const text = edGetText();
  const sel = edGetSel();
  if (text !== edText) {
    edText = text;
    lastEdInput = Date.now();
    touchNote(n => { n.body = text; });
    histRecord(false);
  }
  if (rerender) edRender(text, sel);
  edEl().classList.toggle('is-empty', !text);
}

// Après une modification faite par le code (mise en forme, case cochée…).
function edProgrammatic() {
  lastEdInput = Date.now();
  touchNote(n => { n.title = $('#ed-title').value; n.body = edText; });
  histRecord(true);
  if ($('#ed-imgs').dataset.ids !== topImages(noteObj()).map(x => x.id).join()) renderEdImages();
}

function setNoteBody(id, body) {
  if (id === curNote) {
    const sel = document.activeElement === edEl() ? edGetSel() : null;
    edRender(body, sel, false);
    edProgrammatic();
  } else {
    const n = S.notes[id];
    if (!n) return;
    S.notes[id] = { ...n, body, updatedAt: Date.now() };
    changed();
  }
}

// ----- Annuler / rétablir -----
let hist = [], hi = 0, lastRec = 0;
function edSnapshot() {
  const sel = document.activeElement === edEl() ? edGetSel() : null;
  return { title: $('#ed-title').value, body: edText, s: sel?.s ?? edText.length, e: sel?.e ?? edText.length };
}
function histReset() { hist = [edSnapshot()]; hi = 0; lastRec = 0; updateUndoBtns(); }
function histRecord(force) {
  const st = edSnapshot(), top = hist[hi];
  if (top && top.title === st.title && top.body === st.body) return;
  const now = Date.now();
  // La frappe continue (< 1,2 s) est regroupée en une seule étape.
  if (!force && hi > 0 && now - lastRec < 1200) hist[hi] = st;
  else {
    hist = hist.slice(0, hi + 1);
    hist.push(st);
    if (hist.length > 300) hist.shift();
    hi = hist.length - 1;
  }
  lastRec = force ? 0 : now;
  updateUndoBtns();
}
function histApply(st) {
  $('#ed-title').value = st.title;
  edRender(st.body, document.activeElement === edEl() ? { s: st.s, e: st.e } : null);
  touchNote(n => { n.title = st.title; n.body = st.body; });
  lastRec = 0;
  updateUndoBtns();
}
function undo() { if (hi > 0) histApply(hist[--hi]); }
function redo() { if (hi < hist.length - 1) histApply(hist[++hi]); }
function updateUndoBtns() {
  $('#ed-undo').disabled = hi <= 0;
  $('#ed-redo').disabled = hi >= hist.length - 1;
}

// ----- Édition du texte -----
function curSel() {
  const s = document.activeElement === edEl() ? edGetSel() : null;
  return s || { s: edText.length, e: edText.length };
}

// Remplace [start, end[ du texte brut par str, puis place le curseur (ou sélectionne [selS, selE]).
function edReplace(start, end, str, selS, selE) {
  const v = edText;
  const text = v.slice(0, start) + str + v.slice(end);
  if (document.activeElement !== edEl()) edEl().focus({ preventScroll: true });
  const p = start + str.length;
  edRender(text, { s: selS ?? p, e: selE ?? selS ?? p });
  edProgrammatic();
}

function wrap(mark) {
  const v = edText, L = mark.length;
  let { s, e } = curSel();
  while (s < e && /\s/.test(v[s])) s++;
  while (e > s && /\s/.test(v[e - 1])) e--;
  const sel = v.slice(s, e);
  if (sel.includes('\n')) {
    // Plusieurs lignes : chaque ligne est mise en forme séparément.
    const out = sel.split('\n').map(l => {
      const pre = l.match(RE_PREFIX)[0], c = l.slice(pre.length);
      return c.trim() ? pre + mark + c + mark : l;
    }).join('\n');
    edReplace(s, e, out, s, s + out.length);
  } else if (v.slice(s - L, s) === mark && v.slice(e, e + L) === mark) {
    edReplace(s - L, e + L, sel, s - L, e - L);
  } else if (sel.length > 2 * L && sel.startsWith(mark) && sel.endsWith(mark)) {
    edReplace(s, e, sel.slice(L, -L), s, e - 2 * L);
  } else if (!sel) {
    // Pas de sélection : met en forme le mot sous le curseur, sinon insère la paire.
    let ws = s, we = s;
    while (ws > 0 && /[\p{L}\p{N}]/u.test(v[ws - 1])) ws--;
    while (we < v.length && /[\p{L}\p{N}]/u.test(v[we])) we++;
    if (we > ws) edReplace(ws, we, mark + v.slice(ws, we) + mark, s + L);
    else edReplace(s, s, mark + mark, s + L);
  } else {
    edReplace(s, e, mark + sel + mark, s + L, e + L);
  }
}

// Style d'une ligne, caractère par caractère : couleur (fg) et surlignage (bg).
// map[i] = position "sans marqueurs" du caractère brut i.
function parseStyles(line) {
  const re = new RegExp(RE_TCOLOR.source, 'g');
  let plain = '', i = 0, m;
  const fg = [], bg = [], map = [];
  const keep = (f, b) => { map[i] = plain.length; plain += line[i]; fg.push(f); bg.push(b); i++; };
  while ((m = re.exec(line))) {
    while (i < m.index) keep('', '');
    const [f, b = ''] = m[1].split('/');
    const open = m[1].length + 2; // "{spec:"
    for (let k = 0; k < open; k++) map[i + k] = plain.length;
    i += open;
    const end = i + m[2].length;
    while (i < end) keep(f, b);
    map[i++] = plain.length; // "}"
  }
  while (i < line.length) keep('', '');
  map[line.length] = plain.length;
  return { plain, fg, bg, map };
}
function serializeStyles(plain, fg, bg) {
  let out = '';
  for (let i = 0; i < plain.length;) {
    let j = i;
    while (j < plain.length && fg[j] === fg[i] && bg[j] === bg[i]) j++;
    const t = plain.slice(i, j), spec = fg[i] + (bg[i] ? '/' + bg[i] : '');
    out += spec ? `{${spec}:${t}}` : t;
    i = j;
  }
  return out;
}

// Couleur du texte (which = 'fg') ou surlignage ('bg') : la sélection, ou toute la ligne courante
// s'il n'y a pas de sélection ('' = retirer). Les styles ne s'imbriquent jamais : ils sont découpés proprement.
function applyStyle(which, val) {
  const v = edText;
  const { s, e } = curSel();
  const ls = v.lastIndexOf('\n', s - 1) + 1;
  let le = v.indexOf('\n', e);
  if (le < 0) le = v.length;
  let off = ls;
  const out = v.slice(ls, le).split('\n').map(line => {
    const st = parseStyles(line);
    const pre = st.map[line.match(RE_PREFIX)[0].length];
    let a = pre, b = st.plain.length;
    if (s !== e) {
      if (s >= off) a = Math.max(pre, st.map[s - off]);
      if (e <= off + line.length) b = st.map[e - off];
    }
    for (let k = a; k < b; k++) st[which][k] = val;
    off += line.length + 1;
    return serializeStyles(st.plain, st.fg, st.bg);
  }).join('\n');
  if (s === e) edReplace(ls, le, out, ls + out.split('\n')[0].length);
  else edReplace(ls, le, out, ls, ls + out.length);
}

// Active / désactive un préfixe de ligne (case, puce, numéro, titre, citation) sur les lignes sélectionnées.
function linePrefix(kind) {
  const v = edText;
  let { s, e } = curSel();
  if (e > s && v[e - 1] === '\n') e--;
  const ls = v.lastIndexOf('\n', s - 1) + 1;
  let le = v.indexOf('\n', e);
  if (le < 0) le = v.length;
  const kindOf = p => !p ? '' : p[0] === '[' ? 'check' : /\d/.test(p[0]) ? 'num' : p[0] === '#' ? 'head' : p[0] === '>' ? 'quote' : 'bullet';
  const lines = v.slice(ls, le).split('\n').map(l => {
    const m = l.match(RE_PREFIX);
    return { ind: m[1], pre: m[2] || '', body: l.slice(m[0].length) };
  });
  const multi = lines.length > 1;
  const skip = p => multi && !p.body.trim();
  const all = lines.every(p => skip(p) || kindOf(p.pre) === kind);
  let k = 0;
  const out = lines.map(p => {
    if (all || skip(p)) return p.ind + (all ? '' : p.pre) + p.body;
    k++;
    const pre = { check: '[ ] ', num: k + '. ', head: '# ', quote: '> ', bullet: '- ' }[kind];
    return p.ind + pre + p.body;
  }).join('\n');
  edReplace(ls, le, out);
}

// Entrée : continue la liste en cours, ou l'arrête si l'élément est vide.
function handleEnter() {
  const v = edText;
  const { s, e } = curSel();
  const ls = v.lastIndexOf('\n', s - 1) + 1;
  const m = s === e ? v.slice(ls, s).match(/^(\s*)(\[[ xX]\] ?|[-*•] |(\d+)([.)]) |> )/) : null;
  if (!m) { edReplace(s, e, '\n'); return; }
  let le = v.indexOf('\n', s);
  if (le < 0) le = v.length;
  if (!(v.slice(ls + m[0].length, le)).trim()) { edReplace(ls, le, m[1]); return; }
  let p = m[2];
  if (p[0] === '[') p = '[ ] ';
  else if (m[3]) p = (+m[3] + 1) + m[4] + ' ';
  edReplace(s, s, '\n' + m[1] + p);
}

// Retour arrière en début de ligne : enlève d'abord le préfixe (case, puce…), puis fusionne avec la ligne du dessus.
function handleBackspace() {
  const v = edText;
  const { s, e } = curSel();
  if (s !== e) { edReplace(s, e, ''); return true; }
  const ls = v.lastIndexOf('\n', s - 1) + 1;
  const pre = linePrefixOf(v.slice(ls, v.indexOf('\n', ls) < 0 ? v.length : v.indexOf('\n', ls)))[1];
  if (pre && s === ls + pre.length) { edReplace(ls, s, ''); return true; }
  if (s === ls && s > 0) {
    // Juste sous la séparation des colonnes : on l'enlève entière (retour à une colonne).
    const ps = v.lastIndexOf('\n', s - 2) + 1;
    edReplace(RE_COL.test(v.slice(ps, s - 1)) ? ps : s - 1, s, '');
    return true;
  }
  return false; // cas normal : le navigateur s'en charge
}

function insertDate() {
  const { s, e } = curSel();
  edReplace(s, e, new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
}

// ----- Cases à cocher dans les notes -----
function toggleCheckLine(id, i) {
  const n = id === curNote ? noteObj() : S.notes[id];
  if (n?.trashed && id === curNote) { askRestore(); return; }
  if (!n || n.trashed) return;
  const lines = (n.body || '').split('\n');
  const m = lines[i]?.match(RE_CHECK);
  if (!m) return;
  const on = m[2] === ' ';
  lines[i] = lines[i].replace(/\[[ xX]\]/, on ? '[x]' : '[ ]');
  setNoteBody(n.id, lines.join('\n'));
  const t = linkedTask(n.id, m[3]);
  if (t && (!t.repeat || t.repeat === 'none') && !!t.done !== on) {
    S.tasks[t.id] = { ...t, done: on, doneAt: on ? Date.now() : 0, updatedAt: Date.now() };
    changed({ quiet: id === curNote });
  }
}

function planLine(id, i) {
  const n = noteObj();
  const m = (n?.body || '').split('\n')[i]?.match(RE_CHECK);
  if (!m) return;
  const title = cleanText(m[3]);
  if (!title) return;
  const t = linkedTask(id, title);
  if (t) { openTask(t.id); return; }
  const l = live('lists').find(x => x.name.toLowerCase() === cleanText(n.title).toLowerCase());
  openTask(null, { title, fromNote: id, list: l ? l.id : '' });
}

// Toutes les cases non cochées → tâches, regroupées dans une liste au nom de la note.
async function checksToTasks() {
  const n = noteObj();
  const items = (n.body || '').split('\n').map(l => l.match(RE_CHECK))
    .filter(m => m && m[2] === ' ' && cleanText(m[3]) && !linkedTask(n.id, m[3])).map(m => cleanText(m[3]));
  if (!items.length) { toast('Toutes les cases sont déjà des tâches'); return; }
  const name = cleanText(n.title) || 'Liste';
  const r = await dialog({
    title: `Créer ${plural(items.length, 'tâche')} ?`,
    text: `Elles seront regroupées dans la liste « ${name} ». Cocher une tâche cochera aussi la case dans la note.`,
    buttons: [{ label: 'Annuler' }, { label: 'Créer', value: 'ok', primary: true }],
  });
  if (!r) return;
  const l = live('lists').find(x => x.name.toLowerCase() === name.toLowerCase()) || createList(name);
  const now = Date.now();
  items.forEach((title, k) => {
    const id = uid();
    S.tasks[id] = { id, title, details: '', date: '', time: '', repeat: 'none', days: [], color: n.color || '', done: false, list: l.id, fromNote: n.id, createdAt: now - k, updatedAt: now };
  });
  if (!S.notes[n.id]) S.notes[n.id] = n;
  changed({ quiet: true });
  edRerender();
  toast(`${plural(items.length, 'tâche')} ajoutée${items.length > 1 ? 's' : ''} à « ${l.name} »`, 'Voir', () => closeOverlay(() => { setList(l.id); setView('tasks'); }));
}

function mapChecks(fn) {
  const n = noteObj();
  const lines = (n.body || '').split('\n');
  setNoteBody(n.id, fn(lines).join('\n'));
}

async function noteMenu() {
  const n = noteObj();
  if (!n) return;
  if (n.trashed) {
    const r = await menu(n.title || 'Note', [
      { label: 'Restaurer', icon: 'restore', value: 'restore' },
      { label: 'Partager / exporter (PDF, Word…)', icon: 'share', value: 'share' },
      { label: 'Télécharger (image, PDF, Word…)', icon: 'download', value: 'download' },
      { label: 'Supprimer définitivement', icon: 'trash', value: 'purge', danger: true },
    ]);
    if (r === 'restore') restoreCurNote();
    else if (r === 'share') shareNotes([n]);
    else if (r === 'download') shareNotes([n], true);
    else if (r === 'purge') purgeCurNote();
    return;
  }
  const checks = (n.body || '').split('\n').map(l => l.match(RE_CHECK)).filter(Boolean);
  const anyOn = checks.some(m => m[2] !== ' '), anyOff = checks.some(m => m[2] === ' ');
  const items = [];
  if (anyOff) items.push({ label: 'Transformer les cases en tâches', icon: 'bellPlus', value: 'totasks' });
  if (anyOn) {
    items.push({ label: 'Déplacer les cases cochées en bas', icon: 'sort', value: 'sortchecked' });
    items.push({ label: 'Tout décocher', icon: 'restore', value: 'uncheck' });
    items.push({ label: 'Supprimer les cases cochées', icon: 'checkbox', value: 'delchecked' });
  }
  items.push(
    { label: hasCols(n.body) ? 'Une seule colonne' : 'Deux colonnes', icon: 'columns', value: 'cols' },
    { label: 'Dupliquer', icon: 'copy', value: 'dup' },
    { label: 'Partager / exporter (PDF, Word…)', icon: 'share', value: 'share' },
    { label: 'Télécharger (image, PDF, Word…)', icon: 'download', value: 'download' },
    { label: 'Aide mise en forme', icon: 'edit', value: 'help' },
    { label: 'Mettre à la corbeille', icon: 'trash', value: 'trash', danger: true },
  );
  const r = await menu(n.title || 'Note', items);
  switch (r) {
    case 'cols': toggleCols(); break;
    case 'totasks': checksToTasks(); break;
    case 'uncheck': mapChecks(ls => ls.map(l => RE_CHECK.test(l) ? l.replace(/\[[xX]\]/, '[ ]') : l)); break;
    case 'delchecked': mapChecks(ls => ls.filter(l => { const m = l.match(RE_CHECK); return !m || m[2] === ' '; })); break;
    case 'sortchecked': mapChecks(ls => {
      // Réordonne uniquement les lignes-cases : non cochées d'abord, cochées ensuite.
      const idx = ls.map((l, i) => RE_CHECK.test(l) ? i : -1).filter(i => i >= 0);
      const ordered = [...idx.filter(i => ls[i].match(RE_CHECK)[2] === ' '), ...idx.filter(i => ls[i].match(RE_CHECK)[2] !== ' ')].map(i => ls[i]);
      const out = [...ls];
      idx.forEach((i, k) => { out[i] = ordered[k]; });
      return out;
    }); break;
    case 'dup': {
      const now = Date.now(), c = { ...n, id: uid(), title: (n.title ? n.title + ' ' : '') + '(copie)', pinned: false, createdAt: now, updatedAt: now };
      S.notes[c.id] = c;
      changed({ quiet: true });
      toast('Note dupliquée', 'Ouvrir', () => closeOverlay(() => openNote(c.id)));
      break;
    }
    case 'share': shareNotes([n]); break;
    case 'download': shareNotes([n], true); break;
    case 'help': dialog({ title: 'Mise en forme', html: HELP_HTML, buttons: [{ label: 'OK', value: 'ok', primary: true }] }); break;
    case 'trash': trashNote(); break;
  }
}

// Deux colonnes : la 2e commence après la ligne du curseur (ou à la fin de la note).
function toggleCols() {
  const ls = edText.split('\n');
  if (ls.some(l => RE_COL.test(l))) { edSetText(ls.filter(l => !RE_COL.test(l)).join('\n')); toast('Une seule colonne'); return; }
  const i = edLastSel ? edText.slice(0, edLastSel.s).split('\n').length : ls.length;
  ls.splice(i, 0, COL_MARK);
  if (i === ls.length - 1) ls.push('');
  edSetText(ls.join('\n'));
}

function closeNoteNow() {
  if (imgMove) { imgMove = null; $('#ed-move').classList.add('hidden'); }
  hideLinkPop();
  const n = S.notes[curNote];
  if (n && !n.deleted && !(n.title || '').trim() && !(n.body || '').trim() && !(n.images || []).length) {
    S.notes[curNote] = { id: curNote, deleted: true, updatedAt: Date.now() };
    changed({ quiet: true });
  }
  curNote = null;
  draft = null;
  if (document.activeElement?.closest?.('#editor')) document.activeElement.blur();
  edSlideOut();
  document.body.classList.remove('ed-open');
  render();
}

// ----- Sur téléphone, la note s'ouvre en volet : elle glisse depuis la droite et y repart en se fermant -----
const phoneMQ = matchMedia('(max-width:899px)'), calmMQ = matchMedia('(prefers-reduced-motion: reduce)');
const slides = () => phoneMQ.matches && !calmMQ.matches;
let edSlideTimer = null;
const edDim = v => document.body.style.setProperty('--ed-dim', v);
function edSlideIn() {
  const ed = $('#editor');
  clearTimeout(edSlideTimer);
  document.body.classList.remove('ed-closing');
  ed.classList.remove('hidden', 'ed-anim');
  if (!slides()) { ed.style.transform = ''; return; }
  ed.style.transform = 'translateX(100%)';
  edDim(0);
  void ed.offsetWidth; // point de départ appliqué avant l'animation
  ed.classList.add('ed-anim');
  ed.style.transform = '';
  edDim(1);
}
function edSlideOut() {
  const ed = $('#editor');
  const done = () => { ed.classList.add('hidden'); ed.classList.remove('ed-anim'); ed.style.transform = ''; document.body.classList.remove('ed-closing'); };
  if (!slides() || ed.classList.contains('hidden')) { done(); return; }
  document.body.classList.add('ed-closing');
  ed.classList.add('ed-anim');
  ed.style.transform = 'translateX(100%)';
  edDim(0);
  clearTimeout(edSlideTimer);
  edSlideTimer = setTimeout(done, 300);
}

// ----- Note dans la corbeille : lecture seule, restauration en un geste -----
function setTrashMode(on) {
  $('#editor').classList.toggle('trashed', on);
  edEl().contentEditable = on ? 'false' : 'true';
  $('#ed-title').readOnly = on;
  $('#ed-trashbar').classList.toggle('hidden', !on);
  if (on) closeEdPanels(false);
}
let askingRestore = false;
async function askRestore() {
  if (askingRestore || !S.notes[curNote]?.trashed) return;
  askingRestore = true;
  const r = await dialog({
    title: 'Restaurer cette note ?',
    text: 'Elle est dans la corbeille. Restaure-la pour pouvoir la modifier.',
    buttons: [{ label: 'Annuler' }, { label: 'Restaurer et modifier', value: 'ok', primary: true }],
  });
  askingRestore = false;
  if (r) restoreCurNote(true);
}
function restoreCurNote(focus) {
  const n = S.notes[curNote];
  if (!n) return;
  S.notes[curNote] = { ...n, trashed: false, trashedAt: 0, updatedAt: Date.now() };
  changed({ quiet: true });
  setTrashMode(false);
  styleEditor();
  toast('Note restaurée');
  if (focus) { edEl().focus(); edSetSel(edText.length); }
}
// Suppression définitive de notes. Si elles contiennent des images, on propose de les garder
// dans la galerie « Images » ; sinon leurs fichiers sont effacés du serveur tout de suite.
// `auto` (corbeille de plus de 30 jours) : pas de question, les images sont gardées.
async function purgeNotes(ns, title, text, auto = false) {
  const imgs = ns.flatMap(n => (n.images || []).map(im => ({ ...im, from: n.title || '' })));
  let keep = auto;
  const pref = S.settings.imgPurge || 'ask'; // Réglages → Notes : demander / supprimer / garder
  if (!auto && imgs.length && pref === 'ask') {
    const one = imgs.length === 1;
    const r = await dialog({
      title, col: true,
      text: `${text} ${ns.length > 1 ? 'Elles contiennent' : 'Elle contient'} ${one ? 'une image' : imgs.length + ' images'} : ${one ? 'la garder' : 'les garder'} dans la galerie « Images » ou tout supprimer ?`,
      html: '<label class="remember"><input type="checkbox" id="dlg-remember"> Se rappeler de mon choix</label>',
      buttons: [{ label: one ? "Garder l'image" : 'Garder les images', primary: true, value: 'keep' }, { label: 'Tout supprimer', danger: true, value: 'drop' }, { label: 'Annuler' }],
      onClick: () => false,
    });
    if (!r) return false;
    keep = r.value === 'keep';
    if (dlgRemember) { setSetting('imgPurge', r.value); toast('Choix retenu : modifiable dans Réglages → Notes'); }
  } else {
    if (!auto && !await confirmDlg(title, text, 'Supprimer', true)) return false;
    if (!auto && imgs.length) keep = pref === 'keep';
  }
  const now = Date.now();
  if (keep) for (const im of imgs) S.images[im.id] = { id: im.id, w: im.w, h: im.h, kind: im.kind || 'image', from: im.from, keptAt: now, updatedAt: now };
  for (const n of ns) S.notes[n.id] = { id: n.id, deleted: true, updatedAt: now };
  changed({ quiet: auto });
  if (!auto) toast(keep && imgs.length ? `Supprimée${ns.length > 1 ? 's' : ''} · images gardées dans « Images »` : `${plural(ns.length, 'note')} supprimée${ns.length > 1 ? 's' : ''} définitivement`);
  return true;
}

async function purgeCurNote() {
  const n = noteObj();
  if (!n || !await purgeNotes([n], 'Supprimer définitivement ?', 'Cette note sera supprimée pour de bon.')) return;
  closeOverlay();
}

// Remplace le contenu de l'éditeur par la version enregistrée (après résolution d'un conflit).
function forceEditor() {
  const n = S.notes[curNote];
  if (!n) return;
  if (n.deleted) { closeOverlay(); return; }
  $('#ed-title').value = n.title || '';
  edSetBodyKeepCaret(n.body || '');
  histRecord(true);
  styleEditor();
}

// Remplace le texte en gardant le curseur au "même endroit" (décalé si du texte a été ajouté avant lui).
function edSetBodyKeepCaret(body) {
  const focused = document.activeElement === edEl();
  const sel = focused ? edGetSel() : null;
  if (sel) {
    const old = edText;
    let pre = 0;
    while (pre < old.length && pre < body.length && old[pre] === body[pre]) pre++;
    const shift = p => p <= pre ? p : Math.max(pre, p + body.length - old.length);
    edRender(body, { s: shift(sel.s), e: shift(sel.e) }, false);
  } else edRender(body, null);
}

// Après une synchro : met à jour la note ouverte si elle a changé ailleurs.
function refreshEditor() {
  if (!curNote || !S.notes[curNote]) return;
  const n = S.notes[curNote];
  if (n.deleted) { closeOverlay(); toast('Note supprimée sur un autre appareil'); return; }
  // Modification venue d'un autre appareil : appliquée tout de suite, curseur conservé.
  // Seule une saisie "composée" en cours (clavier mobile) la fait patienter un instant.
  if (composing) { clearTimeout(refreshRetry); refreshRetry = setTimeout(refreshEditor, 600); }
  else {
    const ti = $('#ed-title');
    let upd = false;
    if (ti.value !== (n.title || '') && document.activeElement !== ti) { ti.value = n.title || ''; upd = true; }
    if (edText !== (n.body || '')) { edSetBodyKeepCaret(n.body || ''); upd = true; }
    if ($('#ed-imgs').dataset.ids !== topImages(n).map(x => x.id).join()) renderEdImages();
    if (upd) histRecord(true);
  }
  styleEditor();
}

function trashNote() {
  const n = noteObj();
  if (!n) return;
  if (!S.notes[n.id]) { closeOverlay(); return; }
  S.notes[n.id] = { ...n, trashed: true, trashedAt: Date.now(), pinned: false, updatedAt: Date.now() };
  changed({ quiet: true });
  closeOverlay();
  toast('Note placée dans la corbeille', 'Annuler', () => {
    S.notes[n.id] = { ...S.notes[n.id], trashed: false, updatedAt: Date.now() };
    changed();
  });
}

function toggleArchive() {
  const n = noteObj();
  if (!n) return;
  const on = !n.archived;
  touchNote(x => { x.archived = on; if (on) x.pinned = false; });
  closeOverlay();
  toast(on ? 'Note archivée' : 'Note désarchivée', 'Annuler', () => {
    S.notes[n.id] = { ...S.notes[n.id], archived: !on, updatedAt: Date.now() };
    changed();
  });
}

async function trashNoteDialog(id) {
  const n = S.notes[id];
  const r = await dialog({
    title: n.title || 'Note sans titre',
    text: 'Cette note est dans la corbeille.',
    buttons: [{ label: 'Annuler' }, { label: 'Supprimer définitivement', value: 'del', danger: true }, { label: 'Restaurer', value: 'restore', primary: true }],
  });
  if (!r) return;
  if (r.value === 'del') {
    if ((n.images || []).length) await purgeNotes([n], 'Supprimer définitivement ?', 'Cette note sera supprimée pour de bon.');
    else { S.notes[id] = { id, deleted: true, updatedAt: Date.now() }; changed(); toast('Note supprimée définitivement'); }
    return;
  }
  S.notes[id] = { ...n, trashed: false, trashedAt: 0, updatedAt: Date.now() };
  changed();
  toast('Note restaurée');
}

async function emptyTrash() {
  const ns = notesIn('trash');
  await purgeNotes(ns, 'Vider la corbeille ?', `${plural(ns.length, 'note')} ser${ns.length > 1 ? 'ont' : 'a'} supprimée${ns.length > 1 ? 's' : ''} définitivement.`);
}

function purgeTrash() {
  const lim = Date.now() - TRASH_DAYS * 864e5;
  const old = live('notes').filter(n => n.trashed && (n.trashedAt || 0) < lim);
  if (old.length) purgeNotes(old, '', '', true);
}

// ================= Images des notes =================
// Deux versions par image, créées sur l'appareil puis envoyées au serveur :
//  - qualité normale (1600 px max, compressée) : affichée quand on ouvre la note ou l'image ;
//  - miniature très compressée (360 px) : aperçus de la liste, gardée dans IndexedDB → instantanée, même hors ligne.
// À l'affichage : miniature d'abord (floutée), remplacée par la version normale dès qu'elle est téléchargée.
const idb = (() => {
  let dbp = null;
  const open = () => dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('rappels-images', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('pending'); r.result.createObjectStore('thumbs'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => { dbp = null; rej(r.error); };
  });
  const run = async (store, mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, mode), q = fn(tx.objectStore(store));
      tx.oncomplete = () => res(q && q.result);
      tx.onerror = () => rej(tx.error);
    });
  };
  return {
    get: (st, k) => run(st, 'readonly', o => o.get(k)),
    put: (st, k, v) => run(st, 'readwrite', o => o.put(v, k)),
    del: (st, k) => run(st, 'readwrite', o => o.delete(k)),
    keys: st => run(st, 'readonly', o => o.getAllKeys()),
  };
})();

const thumbUrl = new Map(), thumbReq = new Map(); // miniatures prêtes (objectURL) / en cours de chargement
const hqSeen = new Map(); // images déjà affichées en pleine qualité : réaffichées sans clignoter
const fullUrl = new Map();                        // versions normales créées sur cet appareil (pas encore envoyées)
const fileUrl = (id, thumb) => `api.php?a=file&id=${id}${thumb ? '&v=t' : ''}`;

function getThumb(id) {
  if (thumbUrl.has(id)) return Promise.resolve(thumbUrl.get(id));
  if (!thumbReq.has(id)) {
    thumbReq.set(id, (async () => {
      let blob = await idb.get('thumbs', id).catch(() => null);
      if (!blob) {
        if (isLocal()) throw new Error('indisponible');
        const r = await fetch(fileUrl(id, true), { credentials: 'same-origin' });
        if (!r.ok) throw new Error('indisponible');
        blob = await r.blob();
        idb.put('thumbs', id, blob).catch(() => {});
      }
      const u = URL.createObjectURL(blob);
      thumbUrl.set(id, u);
      return u;
    })().finally(() => thumbReq.delete(id)));
  }
  return thumbReq.get(id);
}

// Remplit les <img data-thumb> (miniature seule) et <img data-full> (miniature puis qualité normale).
// Image pas encore disponible (envoi en cours depuis un autre appareil…) : emplacement animé et nouvel essai.
function hydrateImages(root) {
  root.querySelectorAll('img[data-thumb]:not([data-ok]), img[data-full]:not([data-ok])').forEach(el => loadInto(el, 0));
}
async function loadInto(el, attempt) {
  el.dataset.ok = '1';
  const full = !!el.dataset.full, id = el.dataset.full || el.dataset.thumb, box = el.parentElement;
  let shown = false;
  try { const t = await getThumb(id); if (!el.dataset.hq) el.src = t; shown = true; } catch {}
  const src = full && (fullUrl.get(id) || (isLocal() ? '' : fileUrl(id))); // local : pas d'original → miniature seule
  if (src) {
    const hi = new Image();
    hi.src = src;
    try { await hi.decode(); el.src = src; el.dataset.hq = '1'; shown = true; box.classList.remove('lq'); hqSeen.set(id, src); } catch { if (!shown) shown = false; }
    if (!el.dataset.hq && attempt < 8) return retryImg(el, attempt, shown);
  }
  box.classList.toggle('loading', !shown);
  if (!shown && attempt < 8) retryImg(el, attempt, shown);
}
function retryImg(el, attempt, shown) {
  el.parentElement.classList.toggle('loading', !shown);
  setTimeout(() => { if (el.isConnected) loadInto(el, attempt + 1); }, 1500 * 2 ** Math.min(attempt, 4));
}

// Deux versions compressées à partir d'une image ou d'un canvas (fond blanc pour la transparence).
async function makeVersions(src, sw, sh, png) {
  const draw = max => {
    const k = Math.min(1, max / Math.max(sw, sh)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(sw * k));
    c.height = Math.max(1, Math.round(sh * k));
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, c.width, c.height);
    x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, c.width, c.height);
    return c;
  };
  const blob = (c, type, q) => new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('image')), type, q));
  const big = draw(1600);
  return { full: await blob(big, png ? 'image/png' : 'image/jpeg', 0.82), thumb: await blob(draw(360), 'image/jpeg', 0.5), w: big.width, h: big.height };
}
async function loadBitmap(file) {
  try { return await createImageBitmap(file); } catch {}
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();
  return img;
}

// Image ajoutée sur cet appareil : affichée tout de suite, envoyée dès que possible (même plus tard si hors ligne).
async function queueImage(id, full, thumb) {
  fullUrl.set(id, URL.createObjectURL(full));
  thumbUrl.set(id, URL.createObjectURL(thumb));
  await idb.put('thumbs', id, thumb).catch(() => {});
  await idb.put('pending', id, { user, full, thumb, thumbSent: false }).catch(() => {});
  flushUploads();
}
async function uploadBlob(id, blob, thumb) {
  const r = await fetch(`api.php?a=upload&id=${id}${thumb ? '&v=t' : ''}`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob,
  });
  if (!r.ok) throw new Error('envoi');
}
let flushing = false;
async function flushUploads() {
  if (flushing || !user || isLocal()) return;
  flushing = true;
  try {
    for (const id of await idb.keys('pending')) {
      const p = await idb.get('pending', id);
      if (!p || p.user !== user) continue;
      if (!p.thumbSent) { await uploadBlob(id, p.thumb, true); p.thumbSent = true; await idb.put('pending', id, p); } // miniature d'abord : aperçu rapide ailleurs
      await uploadBlob(id, p.full, false);
      await idb.del('pending', id);
    }
  } catch { /* nouvel essai à la prochaine synchronisation */ }
  flushing = false;
}
// Mode local : les images restent pour toujours dans « pending » (jamais envoyées).
// Au démarrage, on efface celles qu'aucune note ni la galerie n'utilise plus.
async function gcLocalImages() {
  try {
    const used = new Set(Object.keys(S.images).filter(id => !S.images[id]?.deleted));
    for (const n of live('notes')) for (const im of n.images || []) if (im?.id) used.add(im.id);
    for (const id of await idb.keys('pending')) {
      const p = await idb.get('pending', id);
      if (p?.user === LOCAL && !used.has(id)) { await idb.del('pending', id); await idb.del('thumbs', id).catch(() => {}); }
    }
  } catch {}
}
// Au démarrage : images pas encore envoyées → visibles depuis l'appareil.
async function restorePending() {
  if (isLocal()) await gcLocalImages();
  try {
    for (const id of await idb.keys('pending')) {
      const p = await idb.get('pending', id);
      if (p?.user === user && !fullUrl.has(id)) { fullUrl.set(id, URL.createObjectURL(p.full)); thumbUrl.set(id, URL.createObjectURL(p.thumb)); }
    }
  } catch {}
  flushUploads();
}

async function addImages(files) {
  if (!curNote) openNote(null);
  if (noteObj()?.trashed) { askRestore(); return; }
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    try {
      const src = await loadBitmap(f);
      const v = await makeVersions(src, src.width, src.height, false);
      const id = uid();
      await queueImage(id, v.full, v.thumb);
      touchNote(n => { n.images = [...(n.images || []), { id, kind: 'photo', w: v.w, h: v.h, at: Date.now() }]; });
    } catch { toast('Impossible de lire cette image'); }
  }
  renderEdImages();
}

// Images « fixées en haut » : toutes celles qui ne sont pas placées dans le texte.
const topImages = n => { const inl = inlineImgIds(n?.body); return (n?.images || []).filter(x => !inl.has(x.id)); };
function renderEdImages() {
  const el = $('#ed-imgs'), imgs = topImages(noteObj());
  el.dataset.ids = imgs.map(x => x.id).join();
  el.className = 'ed-imgs n' + Math.min(imgs.length, 3);
  el.innerHTML = imgs.map(im => `<button type="button" class="imgbox lq" data-img="${im.id}" style="--ar:${im.w} / ${im.h}" aria-label="${im.kind === 'drawing' ? 'Dessin' : 'Image'}"><img data-full="${im.id}" alt=""></button>`).join('');
  hydrateImages(el);
}

// ----- Visionneuse -----
let viewing = null;
// src : absent = note ouverte dans l'éditeur ; { note: id } = image d'une note (onglet Images) ; { kept: true } = image gardée.
function openViewer(id, src = null) {
  if (!fillViewer(id, src)) return;
  $('#viewer').classList.remove('hidden');
  openOverlay('viewer');
}
function fillViewer(id, src) {
  const n = src?.note ? S.notes[src.note] : src?.kept ? null : noteObj();
  const im = src?.kept ? S.images[id] : n?.images?.find(x => x && x.id === id);
  if (!im || im.deleted) return false;
  viewing = { ...im, src, gallery: !!src };
  $('#viewer').classList.toggle('gal-mode', !!src);
  $('#v-open').classList.toggle('hidden', !src?.note);
  $('#v-title').textContent = !src ? '' : n ? n.title || 'Note sans titre' : im.from ? `Gardée de « ${im.from} »` : 'Image gardée';
  if (im.low) $('#v-title').textContent += ($('#v-title').textContent ? ' · ' : '') + 'restaurée en basse définition';
  // Autres images de la même note : bande de miniatures pour passer de l'une à l'autre.
  const sibs = src?.note ? n.images || [] : [];
  $('#v-strip').classList.toggle('hidden', sibs.length < 2);
  $('#v-strip').innerHTML = sibs.length < 2 ? '' : sibs.map(x => `<button type="button" class="imgbox ${x.id === id ? 'on' : ''}" data-vs="${x.id}" aria-label="Image"><img data-thumb="${x.id}" alt=""></button>`).join('');
  if (sibs.length > 1) hydrateImages($('#v-strip'));
  const box = $('#v-box');
  box.className = 'imgbox lq';
  box.innerHTML = `<img data-full="${id}" alt="">`;
  $('#v-edit').classList.toggle('hidden', !!n?.trashed); // toute image se modifie (dessin par-dessus)
  $('#v-place').classList.toggle('hidden', !!n?.trashed);
  $('#v-del').classList.toggle('hidden', !!n?.trashed);
  vZoom.fit();
  const img = box.querySelector('img');
  img.addEventListener('load', fitViewerImg); // aperçu flou puis pleine qualité : recalé à chaque fois
  hydrateImages(box);
  checkOriginal(id);
  return true;
}
// Original absent du serveur (seule la miniature reste sur l'appareil) : on le dit au lieu d'afficher une image floue sans explication.
async function checkOriginal(id) {
  if (fullUrl.has(id) || isLocal() || !navigator.onLine) return;
  try {
    const r = await fetch(fileUrl(id), { method: 'HEAD', credentials: 'same-origin' });
    if (r.status !== 404 || viewing?.id !== id) return;
    const loc = await localImage(id);
    if (loc.full || loc.thumb) toast(`Cette image a été perdue sur le serveur. Cet appareil en a une copie${loc.full ? '' : ' en basse définition'}.`, 'Restaurer', () => restoreImages([{ id, s: { full: false, thumb: false }, loc, kind: loc.full ? 'full' : 'low' }]));
    else toast("L'original de cette image n'existe plus sur le serveur : seule la miniature est disponible.");
  } catch {}
}
// ================= Restauration des images depuis cet appareil =================
// Une image perdue sur le serveur peut encore être sur le téléphone : version normale gardée par le service worker,
// ou seulement la miniature (IndexedDB). On la renvoie au serveur ; à défaut de mieux, la miniature devient l'image.
async function localImage(id) {
  let full = null, thumb = null;
  try {
    const c = await caches.open('rappels-images');
    const f = await c.match(new URL(fileUrl(id), location.href).href), t = await c.match(new URL(fileUrl(id, true), location.href).href);
    if (f?.ok) full = await f.blob();
    if (t?.ok) thumb = await t.blob();
  } catch {}
  if (!thumb) thumb = await idb.get('thumbs', id).catch(() => null);
  return { full, thumb };
}
function allImageIds() {
  const ids = new Set(live('images').map(x => x.id));
  for (const n of live('notes')) for (const im of n.images || []) if (im?.id) ids.add(im.id);
  return [...ids];
}
// kind : 'full' (copie normale sur l'appareil), 'low' (seulement la miniature), 'thumb' (seule la miniature manque), 'none' (introuvable)
async function scanImages() {
  const ids = allImageIds(), st = {};
  for (let i = 0; i < ids.length; i += 1000) Object.assign(st, (await api('imgstatus', { ids: ids.slice(i, i + 1000) })).images);
  const pend = new Set(await idb.keys('pending').catch(() => [])); // pas encore envoyées : pas perdues
  const items = [];
  for (const id of ids) {
    const s = st[id];
    if (!s || (s.full && s.thumb) || pend.has(id)) continue;
    const loc = await localImage(id);
    const kind = s.full ? 'thumb' : loc.full ? 'full' : loc.thumb ? 'low' : 'none';
    items.push({ id, s, loc, kind });
  }
  return items;
}
async function restoreImages(items) {
  const todo = items.filter(x => x.kind !== 'none');
  let ok = 0, low = 0;
  toast(`Restauration de ${plural(todo.length, 'image')}…`);
  for (const it of todo) {
    try {
      if (!it.s.full) await uploadBlob(it.id, it.loc.full || it.loc.thumb, false);
      if (!it.s.thumb) {
        let t = it.loc.thumb;
        if (!t) { // miniature recréée depuis l'image normale
          const src = await loadBitmap(it.loc.full || await imageBlob(it.id));
          t = (await makeVersions(src, src.width, src.height, false)).thumb;
        }
        await uploadBlob(it.id, t, true);
      }
      if (it.kind === 'low') { markLowRes(it.id); low++; }
      thumbUrl.delete(it.id); hqSeen.delete(it.id);
      ok++;
    } catch {}
  }
  render();
  if (curNote) renderEdImages();
  const fail = todo.length - ok;
  toast(`${plural(ok, 'image')} restaurée${ok > 1 ? 's' : ''}${low ? ` (dont ${low} en basse définition)` : ''}${fail ? ` · ${fail} en échec, réessaie plus tard` : ''}`);
}
// L'image restaurée depuis la miniature est signalée (visible dans la visionneuse), pour ne pas surprendre.
function markLowRes(id) {
  const now = Date.now();
  for (const n of live('notes')) {
    if (!(n.images || []).some(im => im.id === id)) continue;
    S.notes[n.id] = { ...n, images: n.images.map(im => im.id === id ? { ...im, low: true } : im), updatedAt: now };
  }
  if (S.images[id] && !S.images[id].deleted) S.images[id] = { ...S.images[id], low: true, updatedAt: now };
  changed({ quiet: true });
}
// Vérification complète : éléments (notes, tâches, listes, images gardées) et fichiers d'images.
async function checkRestore(manual = false) {
  if (isLocal() || !user) return;
  if (manual && !(await sync())) { toast('Vérification impossible hors ligne'); return; }
  let imgs;
  try { imgs = await scanImages(); }
  catch (e) { if (manual) toast(e.status ? e.message : 'Vérification impossible hors ligne'); return; }
  const items = serverLost.slice();
  const fix = items.length + imgs.filter(x => x.kind !== 'none').length;
  renderRestoreHint(items, imgs);
  if (!manual) {
    if (fix && !restoreAsked) {
      restoreAsked = true;
      toast(`${plural(fix, 'élément')} perdu${fix > 1 ? 's' : ''} sur le serveur, récupérable${fix > 1 ? 's' : ''} depuis cet appareil`, 'Voir', () => restoreDialog(items, imgs));
    }
    return;
  }
  if (!items.length && !imgs.length) { toast('Tout est bien sur le serveur'); return; }
  restoreDialog(items, imgs);
}
let restoreAsked = false; // proposé au plus une fois par session (le rappel reste dans Réglages → Données)
function renderRestoreHint(items, imgs) {
  const n = items.length + imgs.filter(x => x.kind !== 'none').length;
  const el = $('#s-restore-hint');
  el.classList.toggle('hidden', !n);
  el.textContent = n ? `${plural(n, 'élément')} de cet appareil manque${n > 1 ? 'nt' : ''} sur le serveur.` : '';
}
async function restoreDialog(items, imgs) {
  const n = k => imgs.filter(x => x.kind === k).length;
  const by = k => items.filter(x => x.k === k).length;
  const fix = items.length + imgs.length - n('none');
  const row = (c, label) => c ? `<li><b>${c}</b><span>${label}</span></li>` : '';
  const html = `<p>Le serveur a perdu des données que cet appareil a encore en mémoire. Les renvoyer au serveur ?</p><ul class="rs-list">
    ${row(by('notes'), plural(by('notes'), 'note').replace(/^\d+ /, ''))}
    ${row(by('tasks'), plural(by('tasks'), 'tâche').replace(/^\d+ /, '') + ' / rappels')}
    ${row(by('lists'), plural(by('lists'), 'liste').replace(/^\d+ /, ''))}
    ${row(by('images'), 'image(s) gardée(s) dans la galerie')}
    ${row(n('full'), 'image(s) en qualité normale (copie gardée sur cet appareil)')}
    ${row(n('low'), "image(s) en basse définition : seule la miniature est sur cet appareil, elle remplacera l'image")}
    ${row(n('thumb'), "miniature(s) à recréer (l'image elle-même est intacte)")}
    ${row(n('none'), "image(s) introuvable(s) : ni le serveur ni cet appareil ne l'ont. Un autre appareil l'a peut-être encore")}
  </ul>`;
  const r = await dialog({
    title: 'Restaurer depuis cet appareil', html,
    buttons: fix ? [{ label: 'Plus tard' }, { label: `Restaurer ${fix}`, primary: true, value: 1 }] : [{ label: 'OK' }],
  });
  if (!r) return;
  // Éléments : on oublie la version serveur connue, ils repartent comme des nouveautés à la prochaine synchro.
  for (const { k, id } of items) if (S[k][id]) { delete BASE[k][id]; S[k][id] = { ...S[k][id], updatedAt: Date.now() }; }
  if (items.length) { save(); await sync(); }
  if (imgs.some(x => x.kind !== 'none')) await restoreImages(imgs);
  else if (items.length) toast(`${plural(items.length, 'élément')} restauré${items.length > 1 ? 's' : ''} sur le serveur`);
  renderRestoreHint(serverLost, []);
}

// ================= Aperçu des liens (option, désactivée par défaut) =================
// Le serveur lit le titre et l'image de la page ; le résultat est gardé sur l'appareil.
const lpOn = () => !!S.settings.linkPreview && !isLocal();
const lpPending = new Map();
let lpStore = null;
function lpCache() {
  if (!lpStore) { try { lpStore = JSON.parse(lsGet('rp_lp') || '{}'); } catch { lpStore = {}; } }
  return lpStore;
}
function getPreview(url) {
  const c = lpCache()[url];
  if (c && Date.now() - c.t < 7 * 864e5) return Promise.resolve(c.d);
  if (!lpPending.has(url)) {
    lpPending.set(url, api('linkpreview', { url }).then(d => {
      lpStore[url] = { d, t: Date.now() };
      lpStore = Object.fromEntries(Object.entries(lpStore).sort((a, b) => b[1].t - a[1].t).slice(0, 150));
      lsSet('rp_lp', JSON.stringify(lpStore));
      return d;
    }).finally(() => lpPending.delete(url)));
  }
  return lpPending.get(url);
}
const noteUrls = body => [...new Set((String(body || '').match(/https?:\/\/[^\s]+/g) || []).map(u => u.replace(/[.,;:!?)\]}»"']+$/, '')))];
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
function lpHTML(d, inCard) {
  const host = hostOf(d.url), tag = inCard ? 'div' : 'a';
  const href = inCard ? '' : ` href="${esc(d.url)}" target="_blank" rel="noopener noreferrer"`;
  return `<${tag} class="lp${inCard ? ' lp-card' : ''}"${href}>
    ${d.image ? `<img class="lp-img" src="${esc(d.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
    <span class="lp-txt"><b>${esc(d.title || host)}</b>${!inCard && d.desc ? `<span class="lp-desc">${esc(d.desc)}</span>` : ''}
      <span class="lp-host">${icon('external')}${esc(d.site || host)}</span></span>
  </${tag}>`;
}
// Remplit les emplacements [data-lp] (une adresse chacun).
function hydrateLinks(root) {
  if (!lpOn()) return;
  root.querySelectorAll('[data-lp]:not([data-ok])').forEach(el => {
    el.dataset.ok = '1';
    getPreview(el.dataset.lp).then(d => {
      if (!el.isConnected || !(d.title || d.image)) return;
      el.innerHTML = lpHTML(d, el.classList.contains('lp-slot-card'));
    }).catch(() => {});
  });
}
let edLinksTimer = null;
function renderEdLinks() {
  const el = $('#ed-links');
  const urls = lpOn() ? noteUrls(edText).slice(0, 4) : [];
  if (el.dataset.urls === urls.join(' ')) return;
  el.dataset.urls = urls.join(' ');
  el.innerHTML = urls.map(u => `<div class="lp-slot" data-lp="${esc(u)}"></div>`).join('');
  hydrateLinks(el);
}

$('#v-strip').addEventListener('click', e => { const b = e.target.closest('[data-vs]'); if (b && viewing) fillViewer(b.dataset.vs, viewing.src); });
$('#v-open').addEventListener('click', () => { const nid = viewing?.src?.note; if (nid) closeOverlay(() => { setView('notes'); openNote(nid); }); });
function closeViewerNow() { $('#viewer').classList.add('hidden'); $('#v-box').innerHTML = ''; viewing = null; }
// L'image prend exactement la place disponible (sans bandes), c'est elle qu'on zoome.
function fitViewerImg() {
  const img = $('#v-box img'), body = $('#v-body');
  if (!img?.naturalWidth) return;
  const W = body.clientWidth - 16, H = body.clientHeight - 16, k = Math.min(W / img.naturalWidth, H / img.naturalHeight);
  img.style.width = Math.round(img.naturalWidth * k) + 'px';
  img.style.height = Math.round(img.naturalHeight * k) + 'px';
  vZoom.clamp();
}
async function imageBlob(id) {
  const r = await fetch(fullUrl.get(id) || fileUrl(id), { credentials: 'same-origin' });
  if (!r.ok) throw new Error('image');
  return r.blob();
}
function removeImage(id) {
  const n = noteObj();
  const prev = [...(n?.images || [])], prevBody = edText;
  if (inlineImgIds(edText).has(id)) setImagePlace(id, 'top');
  touchNote(x => { x.images = (x.images || []).filter(im => im.id !== id); });
  renderEdImages();
  toast('Image supprimée', 'Annuler', () => {
    touchNote(x => { x.images = prev; });
    if (prevBody !== edText) { edRender(prevBody, null, false); edProgrammatic(); }
    renderEdImages();
  });
}
// Dernière position du curseur dans le texte : c'est là qu'une image vient se placer.
let edLastSel = null;
document.addEventListener('selectionchange', () => { if (curNote && document.activeElement === edEl()) edLastSel = edGetSel(); });
// 'top' : fixée en haut de la note ; 'text' : sur sa propre ligne, sous la ligne du curseur.
// Ligne de l'image dans le texte (-1 : fixée en haut) et sa taille.
function imgLine(id, text = edText) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) { const m = lines[i].match(RE_IMG); if (m && m[1] === id) return { i, size: (m[2] || 'f').toLowerCase(), rest: m[3] }; }
  return { i: -1, size: 'f', rest: '' };
}
function edSetText(text) { if (text !== edText) { edRender(text, null, false); edProgrammatic(); } }
// 'top' : fixée en haut de la note ; 'text' : sur sa propre ligne, sous la ligne du curseur.
function setImagePlace(id, where, size) {
  const cur = imgLine(id);
  size = size || cur.size;
  // On la retire d'abord du texte (en gardant le texte qui la suivait sur la même ligne).
  const out = [];
  for (const l of edText.split('\n')) { const m = l.match(RE_IMG); if (m && m[1] === id) { if (m[3]) out.push(m[3]); } else out.push(l); }
  let text = out.join('\n');
  if (where === 'text') {
    const mark = imgMark(id, size);
    const pos = Math.min(edLastSel?.e ?? text.length, text.length);
    let end = text.indexOf('\n', pos);
    if (end < 0) end = text.length;
    const start = text.lastIndexOf('\n', pos - 1) + 1;
    if (!text.slice(start, end).trim() && text) text = text.slice(0, start) + mark + text.slice(end); // ligne vide : remplacée
    else text = text ? text.slice(0, end) + '\n' + mark + text.slice(end) : mark;
  }
  edSetText(text);
}
// Change la taille sans déplacer l'image (si elle est en haut, elle vient dans le texte).
function setImageSize(id, size) {
  const cur = imgLine(id);
  if (cur.i < 0) { setImagePlace(id, 'text', size); return; }
  const lines = edText.split('\n');
  lines[cur.i] = imgMark(id, size) + cur.rest;
  edSetText(lines.join('\n'));
}
async function pickImagePlace(id) {
  const seg = (k, opts, v) => `<div class="seg" data-ip="${k}">${opts.map(([o, l]) => `<button type="button" data-v="${o}" class="${o === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const paint = () => {
    const c = imgLine(id), d = $('#dlg');
    $$('[data-ip="pos"] button', d).forEach(b => b.classList.toggle('on', b.dataset.v === (c.i < 0 ? 'top' : 'text')));
    $$('[data-ip="size"] button', d).forEach(b => b.classList.toggle('on', c.i >= 0 && b.dataset.v === c.size));
    $('[data-ipmove]', d).disabled = c.i < 0;
  };
  const c0 = imgLine(id);
  const r = await dialog({
    title: "Position de l'image",
    html: `<div class="row-label">Position</div>${seg('pos', [['top', 'Fixée en haut'], ['text', 'Dans le texte']], c0.i < 0 ? 'top' : 'text')}
      <div class="row-label">Taille dans le texte</div>${seg('size', [['s', 'Petite'], ['m', 'Moyenne'], ['f', 'Pleine largeur']], c0.i < 0 ? '' : c0.size)}
      <button type="button" class="btn ip-move" data-ipmove ${c0.i < 0 ? 'disabled' : ''}>${icon('sort')}Déplacer entre les lignes</button>`,
    buttons: [{ label: 'Terminé', primary: true }],
    onClick: (e, pick) => {
      const p = e.target.closest('[data-ip="pos"] [data-v]'), z = e.target.closest('[data-ip="size"] [data-v]');
      if (p) { setImagePlace(id, p.dataset.v); paint(); return true; }
      if (z) { setImageSize(id, z.dataset.v); paint(); return true; }
      if (e.target.closest('[data-ipmove]:not(:disabled)')) { pick({ value: 'move' }); return true; }
      return false;
    },
  });
  if (r?.value === 'move') startImgMove(id);
}

// ----- Mode déplacement : l'image monte ou descend d'une ligne à chaque appui -----
function startImgMove(id) {
  if (imgLine(id).i < 0) return;
  document.activeElement?.blur?.(); // pas de clavier pendant le déplacement
  imgMove = id;
  $('#ed-move').classList.remove('hidden');
  edRerender();
  imgMoveView();
}
function stopImgMove() {
  imgMove = null;
  $('#ed-move').classList.add('hidden');
  edRerender();
}
function imgMoveView() {
  const el = $(`#ed-body .inimg[data-img="${imgMove}"]`);
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const { i } = imgLine(imgMove), n = edText.split('\n').length;
  $('#ed-move [data-mv="up"]').disabled = i <= 0;
  $('#ed-move [data-mv="down"]').disabled = i >= n - 1;
}
function moveImg(dir) {
  const { i } = imgLine(imgMove);
  const lines = edText.split('\n'), j = i + dir;
  if (i < 0 || j < 0 || j >= lines.length) return;
  [lines[i], lines[j]] = [lines[j], lines[i]];
  edSetText(lines.join('\n'));
  imgMoveView();
}
$('#ed-move').addEventListener('click', e => {
  const b = e.target.closest('[data-mv]');
  if (!b) return;
  if (b.dataset.mv === 'up') moveImg(-1);
  else if (b.dataset.mv === 'down') moveImg(1);
  else stopImgMove();
});
$('#ed-imgs').addEventListener('click', e => {
  const b = e.target.closest('[data-img]');
  if (!b) return;
  if (imgLpFired) { imgLpFired = false; return; } // c'était un appui long
  openViewer(b.dataset.img);
});
$('#v-close').addEventListener('click', () => closeOverlay());
$('#v-del').addEventListener('click', async () => {
  const { id, src } = viewing;
  if (src?.kept) { if (await confirmDlg("Supprimer l'image ?", 'Elle sera effacée définitivement.', 'Supprimer', true)) closeOverlay(() => removeGallery([id])); return; }
  if (src?.note && src.note !== curNote) { closeOverlay(() => removeNoteImage(src.note, id)); return; }
  closeOverlay(() => removeImage(id));
});

$('#v-edit').addEventListener('click', () => { const im = viewing; closeOverlay(() => openDraw(im)); });
$('#v-place').addEventListener('click', () => { const id = viewing.id; closeOverlay(() => pickImagePlace(id)); });
// Appui long sur une image de la note : mode déplacement (une image fixée en haut vient d'abord dans le texte).
let imgLpFired = false;
{
  let lp = null;
  const cancel = () => { if (lp) { clearTimeout(lp.t); lp = null; } };
  const targetOf = e => e.target.closest('#ed-body .inimg[data-img], #ed-imgs [data-img]');
  for (const sel of ['#ed-body', '#ed-imgs']) {
    const el = $(sel);
    el.addEventListener('pointerdown', e => {
      const b = targetOf(e);
      if (!b || e.button > 0 || noteObj()?.trashed) return;
      cancel();
      lp = { x: e.clientX, y: e.clientY, t: setTimeout(() => {
        lp = null;
        imgLpFired = true;
        setTimeout(() => { imgLpFired = false; }, 800); // si aucun « clic » ne suit, le prochain toucher reste normal
        navigator.vibrate?.(20);
        const id = b.dataset.img;
        if (imgLine(id).i < 0) setImagePlace(id, 'text');
        startImgMove(id);
      }, 450) };
    });
    el.addEventListener('pointermove', e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) cancel(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, cancel));
    el.addEventListener('contextmenu', e => { if (targetOf(e)) e.preventDefault(); }); // pas de menu « Enregistrer l'image »
  }
}
// Toucher une image placée dans le texte : visionneuse (sauf juste après un appui long).
$('#ed-body').addEventListener('click', e => {
  const b = e.target.closest('.inimg[data-img]');
  if (!b) return;
  e.preventDefault();
  if (imgLpFired) { imgLpFired = false; return; }
  openViewer(b.dataset.img);
});
$('#v-share').addEventListener('click', async () => {
  try {
    const b = await imageBlob(viewing.id);
    await shareFile(b, (viewing.kind === 'drawing' ? 'dessin' : 'image') + (b.type === 'image/png' ? '.png' : '.jpg'), b.type);
  } catch { toast('Image indisponible pour le moment'); }
});
$('#v-dl').addEventListener('click', async () => {
  try {
    const b = await imageBlob(viewing.id);
    downloadFile(b, (viewing.kind === 'drawing' ? 'dessin' : 'image') + (b.type === 'image/png' ? '.png' : '.jpg'));
  } catch { toast('Image indisponible pour le moment'); }
});
$('#img-input').addEventListener('change', e => { const f = [...e.target.files]; e.target.value = ''; if (f.length) addImages(f); });
$('#ed-draw').addEventListener('click', () => openDraw(null));

// ================= Zoom (visionneuse et dessin) =================
// Pincer à deux doigts, double-toucher, molette (PC) ou la bulle − / + / Ajuster.
// `pan1` : un seul doigt fait glisser l'image quand elle est agrandie (pas en dessin, où un doigt dessine).
function makeZoom(box, el, pill, { pan1 = true, max = 6 } = {}) {
  let s = 1, x = 0, y = 0;
  const pts = new Map();
  let g = null; // geste en cours
  const apply = () => { el.style.transform = s === 1 && !x && !y ? '' : `translate(${x}px,${y}px) scale(${s})`; pill.querySelector('[data-z="pct"]').textContent = Math.round(s * 100) + ' %'; pill.classList.toggle('zoomed', s > 1.01); };
  // Garde l'image dans le cadre : centrée si plus petite, bords jamais à l'intérieur sinon.
  const clamp = () => {
    if (s <= 1.001) { s = 1; x = 0; y = 0; apply(); return; }
    const b = box.getBoundingClientRect(), r = el.getBoundingClientRect();
    const bl = r.left - x, bt = r.top - y, w = r.width, h = r.height; // position sans déplacement
    x = w <= b.width ? b.left + (b.width - w) / 2 - bl : Math.min(b.left - bl, Math.max(b.right - w - bl, x));
    y = h <= b.height ? b.top + (b.height - h) / 2 - bt : Math.min(b.top - bt, Math.max(b.bottom - h - bt, y));
    apply();
  };
  const zoomAt = (ns, cx, cy) => {
    ns = Math.min(max, Math.max(1, ns));
    const r = el.getBoundingClientRect(), lx = (cx - r.left) / s, ly = (cy - r.top) / s;
    x += cx - lx * ns - r.left; y += cy - ly * ns - r.top; s = ns;
    clamp();
  };
  const center = () => { const b = box.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
  pill.innerHTML = `<button type="button" data-z="out" aria-label="Dézoomer" title="Dézoomer">${icon('minus')}</button><button type="button" data-z="pct" title="Taille réelle ajustée">100 %</button><button type="button" data-z="in" aria-label="Zoomer" title="Zoomer">${icon('plus')}</button><button type="button" data-z="fit" aria-label="Ajuster" title="Ajuster à l'écran">${icon('fit')}</button>`;
  pill.addEventListener('pointerdown', e => e.stopPropagation(), true);
  pill.addEventListener('click', e => {
    const z = e.target.closest('[data-z]')?.dataset.z;
    if (z === 'in') zoomAt(s * 1.5, ...center());
    else if (z === 'out') zoomAt(s / 1.5, ...center());
    else if (z === 'fit' || z === 'pct') { s = 1; clamp(); }
  });
  box.addEventListener('wheel', e => { e.preventDefault(); zoomAt(s * Math.exp(-e.deltaY / 300), e.clientX, e.clientY); }, { passive: false });
  let lastTap = 0;
  box.addEventListener('pointerdown', e => {
    if (e.target.closest('.zoom-pill')) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      g = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s, mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2 };
    } else if (pts.size === 1 && pan1) {
      // Double-toucher : agrandit à cet endroit, ou revient à l'écran entier.
      if (Date.now() - lastTap < 300) { zoomAt(s > 1.01 ? 1 : 2.5, e.clientX, e.clientY); lastTap = 0; }
      else lastTap = Date.now();
      g = s > 1.01 ? { px: e.clientX, py: e.clientY } : null;
    }
  }, true);
  box.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (!g) return;
    if (pts.size >= 2 && g.d) {
      const [a, b] = [...pts.values()], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      x += mx - g.mx; y += my - g.my; g.mx = mx; g.my = my; // glisser à deux doigts
      zoomAt(g.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / g.d, mx, my);
    } else if (pts.size === 1 && g.px != null) {
      x += e.clientX - g.px; y += e.clientY - g.py; g.px = e.clientX; g.py = e.clientY;
      clamp();
    }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2 && g?.d) g = null; if (!pts.size) g = null; };
  box.addEventListener('pointerup', up);
  box.addEventListener('pointercancel', up);
  apply();
  return { fit() { s = 1; x = 0; y = 0; apply(); }, clamp, get touches() { return pts.size; }, get scale() { return s; } };
}
const vZoom = makeZoom($('#v-body'), $('#v-box'), $('#v-zoom'));
const dZoom = makeZoom($('#draw-area'), $('#draw-stage'), $('#draw-zoom'), { pan1: false, max: 5 });

// ================= Dessin =================
// Volontairement simple : stylo, surligneur, gomme, seau, 3 tailles, 10 couleurs, annuler / rétablir.
// Noir et blanc d'abord, puis gris et couleurs ; la rangée défile horizontalement.
const DRAW_COLORS = ['#000000', '#ffffff', '#5f6368', '#bdc1c6',
  '#b71c1c', '#e53935', '#f06292', '#d81b60', '#8e24aa', '#7c4dff', '#3949ab', '#1e88e5', '#4fc3f7', '#00897b',
  '#43a047', '#9ccc65', '#fdd835', '#ffb300', '#fb8c00', '#f4511e', '#8d6e63', '#5d4037', '#ffccbc', '#fff9c4'];
const DRAW_SIZES = { pen: [3, 7, 16], marker: [16, 30, 50], eraser: [16, 34, 70], fill: [0, 0, 0] };
let D = null;

async function openDraw(existing) {
  if (!existing?.src && noteObj()?.trashed) { askRestore(); return; }
  // Ferme le clavier de la note avant de mesurer : sinon la zone de dessin est calculée
  // sur la moitié de l'écran (et devient horizontale sur téléphone).
  document.activeElement?.blur?.();
  $('#draw').classList.remove('hidden');
  openOverlay('draw');
  const prev = D || {};
  D = { tool: prev.tool || 'pen', color: prev.color || '#000000', size: prev.size ?? 1, undo: [], redo: [], dirty: false, existing, pts: null };
  renderDrawTools(); // la barre d'outils d'abord : la zone de dessin prend la place restante
  dZoom.fit();
  let img = null;
  if (existing) {
    img = new Image();
    img.src = fullUrl.get(existing.id) || fileUrl(existing.id);
    try { await img.decode(); } catch { img = null; }
  }
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const cv = $('#draw-cv'), ov = $('#draw-ov');
  D.ctx = cv.getContext('2d', { willReadFrequently: true });
  D.octx = ov.getContext('2d');
  if (img) {
    for (const c of [cv, ov]) { c.width = img.naturalWidth; c.height = img.naturalHeight; }
    D.ctx.drawImage(img, 0, 0);
    drawLayout();
  } else drawBlank();
  renderDrawTools();
}
// Page blanche à la taille exacte de la zone disponible (verticale sur téléphone).
function drawBlank() {
  const area = $('#draw-area'), dpr = Math.min(2, devicePixelRatio || 1);
  const W = Math.max(50, Math.round(area.clientWidth * dpr)), H = Math.max(50, Math.round(area.clientHeight * dpr));
  for (const c of [$('#draw-cv'), $('#draw-ov')]) { c.width = W; c.height = H; }
  D.ctx.fillStyle = '#fff';
  D.ctx.fillRect(0, 0, W, H);
  drawLayout();
}
// Affiche le dessin en entier dans la zone (sans le déformer).
function drawLayout() {
  const area = $('#draw-area'), cv = $('#draw-cv');
  const fit = Math.min(area.clientWidth / cv.width, area.clientHeight / cv.height);
  const stage = $('#draw-stage');
  stage.style.width = cv.width * fit + 'px';
  stage.style.height = cv.height * fit + 'px';
  dZoom.clamp();
}
// L'écran change de taille (clavier qui se ferme, rotation) : page encore vierge → on la recrée, sinon on recadre.
{
  let tm;
  const onResize = () => {
    clearTimeout(tm);
    tm = setTimeout(() => {
      if (!D?.ctx || $('#draw').classList.contains('hidden') || D.pts) return;
      if (!D.existing && !D.dirty && !D.undo.length) drawBlank(); else drawLayout();
    }, 120);
  };
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
}

function renderDrawTools() {
  // Boutons créés une seule fois, puis seulement mis à jour : remplacer un bouton pendant qu'on le touche
  // fait perdre l'appui (il fallait toucher deux fois un outil).
  if (!$('#draw-tools').firstChild) {
    const tools = [['pen', 'edit', 'Stylo'], ['marker', 'marker', 'Surligneur'], ['eraser', 'eraser', 'Gomme'], ['fill', 'bucket', 'Seau de remplissage']];
    $('#draw-tools').innerHTML = tools.map(([t, ic, l]) => `<button type="button" class="icon-btn" data-dt="${t}" title="${l}" aria-label="${l}">${icon(ic)}</button>`).join('')
      + '<span class="tsep"></span>'
      + [6, 11, 18].map((px, i) => `<button type="button" class="dsize" data-ds="${i}" title="Taille ${i + 1}" aria-label="Taille ${i + 1}"><i style="width:${px}px;height:${px}px"></i></button>`).join('');
    $('#draw-colors').innerHTML = DRAW_COLORS.map(c => `<button type="button" class="dcol" data-dc="${c}" style="background:${c}" aria-label="Couleur ${c}"></button>`).join('')
      + `<label class="dcol dcustom" title="Autre couleur" aria-label="Autre couleur">${icon('palette')}<input type="color" value="#000000"></label>`;
    $('#draw-colors input[type=color]').addEventListener('input', e => {
      D.color = e.target.value;
      if (D.tool === 'eraser') D.tool = 'pen';
      renderDrawTools();
    });
  }
  $$('#draw-tools [data-dt]').forEach(b => b.classList.toggle('on', b.dataset.dt === D.tool));
  $$('#draw-tools [data-ds]').forEach(b => { b.classList.toggle('on', +b.dataset.ds === D.size); b.disabled = D.tool === 'fill'; });
  $$('#draw-colors [data-dc]').forEach(b => b.classList.toggle('on', b.dataset.dc === D.color));
  const cu = $('#draw-colors .dcustom'), isCu = !DRAW_COLORS.includes(D.color);
  cu.classList.toggle('on', isCu);
  cu.style.background = isCu ? D.color : '';
  $('#draw-colors').classList.toggle('dim', D.tool === 'eraser');
  $('#draw-undo').disabled = !D.undo.length;
  $('#draw-redo').disabled = !D.redo.length;
}

// Position dans le dessin, zoom compris ; D.k = pixels du dessin par pixel d'écran.
const drawPt = e => { const ov = $('#draw-ov'), r = ov.getBoundingClientRect(); D.k = ov.width / r.width; return [(e.clientX - r.left) * D.k, (e.clientY - r.top) * D.k]; };
// Deux doigts posés : on annule le trait commencé par le premier, c'est un zoom.
function drawAbort() {
  if (D) D.fillPt = null;
  if (!D?.pts) return;
  const snap = D.undo.pop();
  if (snap) D.ctx.putImageData(snap, 0, 0);
  D.octx.clearRect(0, 0, D.octx.canvas.width, D.octx.canvas.height);
  D.pts = null;
}
function drawSnap() {
  const c = D.ctx.canvas;
  D.undo.push(D.ctx.getImageData(0, 0, c.width, c.height));
  if (D.undo.length > 15) D.undo.shift();
  D.redo = [];
}

// Remplissage "seau" (par lignes, avec tolérance pour les bords adoucis des traits).
function floodFill(x, y, hex) {
  const ctx = D.ctx, W = ctx.canvas.width, H = ctx.canvas.height;
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const img = ctx.getImageData(0, 0, W, H), d = img.data;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const i0 = (y * W + x) * 4, t0 = d[i0], t1 = d[i0 + 1], t2 = d[i0 + 2];
  if (Math.abs(t0 - r) + Math.abs(t1 - g) + Math.abs(t2 - b) < 10) return false;
  const match = i => Math.abs(d[i] - t0) + Math.abs(d[i + 1] - t1) + Math.abs(d[i + 2] - t2) <= 90;
  const seen = new Uint8Array(W * H), stack = [x, y];
  while (stack.length) {
    const py = stack.pop();
    let px = stack.pop(), p = py * W + px;
    while (px > 0 && !seen[p - 1] && match((p - 1) * 4)) { px--; p--; }
    let up = false, down = false;
    for (; px < W && !seen[p] && match(p * 4); px++, p++) {
      seen[p] = 1;
      const k = p * 4;
      d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255;
      if (py > 0) { const q = p - W; if (!seen[q] && match(q * 4)) { if (!up) { stack.push(px, py - 1); up = true; } } else up = false; }
      if (py < H - 1) { const q = p + W; if (!seen[q] && match(q * 4)) { if (!down) { stack.push(px, py + 1); down = true; } } else down = false; }
    }
  }
  ctx.putImageData(img, 0, 0);
  return true;
}

{
  const ov = $('#draw-ov');
  ov.addEventListener('pointerdown', e => {
    if (!D || e.button > 0) return;
    e.preventDefault();
    if (dZoom.touches > 1) { drawAbort(); return; }
    ov.setPointerCapture?.(e.pointerId);
    const p = drawPt(e);
    if (D.tool === 'fill') { D.fillPt = p; return; } // appliqué au lever du doigt (sauf si c'était un zoom)
    drawSnap();
    D.pts = [p];
    D.pid = e.pointerId;
    const c = D.tool === 'marker' ? D.octx : D.ctx;
    c.lineCap = c.lineJoin = 'round';
    c.lineWidth = DRAW_SIZES[D.tool][D.size] * D.k;
    c.strokeStyle = c.fillStyle = D.tool === 'eraser' ? '#fff' : D.color;
    ov.style.opacity = D.tool === 'marker' ? '.4' : '1';
    c.beginPath();
    c.arc(p[0], p[1], c.lineWidth / 2, 0, Math.PI * 2);
    c.fill();
  });
  ov.addEventListener('pointermove', e => {
    if (!D?.pts || e.pointerId !== D.pid) return;
    if (dZoom.touches > 1) { drawAbort(); return; }
    const c = D.tool === 'marker' ? D.octx : D.ctx;
    for (const ev of e.getCoalescedEvents?.() || [e]) {
      const p = drawPt(ev), q = D.pts[D.pts.length - 1];
      D.pts.push(p);
      if (D.tool !== 'marker') { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(p[0], p[1]); c.stroke(); }
    }
    if (D.tool === 'marker') {
      // Trait redessiné d'un seul tenant : pas de zones plus foncées là où il se recoupe.
      c.clearRect(0, 0, c.canvas.width, c.canvas.height);
      c.beginPath();
      c.moveTo(D.pts[0][0], D.pts[0][1]);
      for (const p of D.pts) c.lineTo(p[0], p[1]);
      c.stroke();
    }
  });
  const end = () => {
    if (D?.fillPt) {
      const p = D.fillPt;
      D.fillPt = null;
      drawSnap();
      if (floodFill(p[0], p[1], D.color)) D.dirty = true; else D.undo.pop();
      renderDrawTools();
      return;
    }
    if (!D?.pts) return;
    if (D.tool === 'marker') {
      D.ctx.globalAlpha = 0.4;
      D.ctx.drawImage(D.octx.canvas, 0, 0);
      D.ctx.globalAlpha = 1;
      D.octx.clearRect(0, 0, D.octx.canvas.width, D.octx.canvas.height);
    }
    D.pts = null;
    D.dirty = true;
    renderDrawTools();
  };
  ov.addEventListener('pointerup', end);
  ov.addEventListener('pointercancel', end);
  $('#draw-tools').addEventListener('click', e => {
    const t = e.target.closest('[data-dt]'), sz = e.target.closest('[data-ds]');
    if (t) D.tool = t.dataset.dt;
    if (sz) D.size = +sz.dataset.ds;
    renderDrawTools();
  });
  $('#draw-colors').addEventListener('click', e => {
    const b = e.target.closest('[data-dc]');
    if (!b) return;
    D.color = b.dataset.dc;
    if (D.tool === 'eraser') D.tool = 'pen';
    renderDrawTools();
  });
  const swap = (from, to) => {
    if (!D[from].length) return;
    const c = D.ctx.canvas;
    D[to].push(D.ctx.getImageData(0, 0, c.width, c.height));
    D.ctx.putImageData(D[from].pop(), 0, 0);
    D.dirty = true;
    renderDrawTools();
  };
  $('#draw-undo').addEventListener('click', () => swap('undo', 'redo'));
  $('#draw-redo').addEventListener('click', () => swap('redo', 'undo'));
  $('#draw-clear').addEventListener('click', () => {
    drawSnap();
    D.ctx.fillStyle = '#fff';
    D.ctx.fillRect(0, 0, D.ctx.canvas.width, D.ctx.canvas.height);
    D.dirty = true;
    renderDrawTools();
  });
  $('#draw-back').addEventListener('click', () => closeOverlay());
}

// Fermeture = enregistrement automatique (comme Keep).
async function closeDrawNow() {
  $('#draw').classList.add('hidden');
  const d = D;
  if (!d?.dirty) return;
  d.dirty = false;
  const cv = d.ctx.canvas;
  // Photo modifiée : reste une photo (JPEG, plus léger) ; dessin : PNG.
  const kind = d.existing && d.existing.kind !== 'drawing' ? 'photo' : 'drawing';
  try {
    const v = await makeVersions(cv, cv.width, cv.height, kind === 'drawing');
    if (d.existing?.src) { await saveGalleryEdit(d, v); return; } // modifiée depuis l'onglet Images
    const id = uid();
    await queueImage(id, v.full, v.thumb);
    touchNote(n => {
      const imgs = [...(n.images || [])], item = { id, kind, w: v.w, h: v.h, at: Date.now() };
      const i = d.existing ? imgs.findIndex(x => x.id === d.existing.id) : -1;
      if (i >= 0) imgs[i] = item; else imgs.push(item);
      n.images = imgs;
    });
    // Image placée dans le texte : elle garde sa place avec son nouvel identifiant.
    if (d.existing && inlineImgIds(edText).has(d.existing.id)) { edRender(swapImgId(edText, d.existing.id, id), null, false); edProgrammatic(); }
    renderEdImages();
  } catch { toast("L'image n'a pas pu être enregistrée"); }
}

// ================= Partage / export : texte, PDF, Word, impression =================
const FG_HEX = { rouge: 'D93025', orange: 'D56200', jaune: 'A67C00', vert: '188038', bleu: '1A73E8', violet: '8E24AA', rose: 'C2185B', gris: '6B7280' };
const HL_HEX = { jaune: 'FFF176', vert: 'C5E1A5', bleu: 'B3E5FC', rose: 'F8BBD0', orange: 'FFCC80', violet: 'E1BEE7' };
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Texte d'une ligne → morceaux stylés { t, b, i, s, code, fg, bg, link } (réutilise le rendu des notes).
function inlineRuns(text) {
  const root = new DOMParser().parseFromString(`<div>${fmtInline(text, false)}</div>`, 'text/html').body.firstChild;
  const out = [];
  const walk = (node, st) => {
    for (const c of node.childNodes) {
      if (c.nodeType === 3) { if (c.data) out.push({ ...st, t: c.data }); continue; }
      if (c.nodeType !== 1) continue;
      const x = { ...st };
      if (c.tagName === 'B') x.b = true;
      if (c.tagName === 'I') x.i = true;
      if (c.tagName === 'S') x.s = true;
      if (c.tagName === 'CODE') x.code = true;
      for (const cl of c.classList) {
        if (cl.startsWith('tc-')) x.fg = cl.slice(3);
        else if (cl.startsWith('hl-')) x.bg = cl.slice(3);
        else if (cl === 'lnk') x.link = true;
      }
      walk(c, x);
    }
  };
  walk(root, {});
  return out;
}
// Note → blocs (une ligne = un bloc).
function noteBlocks(body) {
  const ind = s => Math.min(Math.floor((s || '').replace(/\t/g, '  ').length / 2), 6);
  return String(body || '').split('\n').filter(l => !RE_COL.test(l)).map(l => {
    let m;
    if ((m = l.match(RE_CHECK))) return { kind: 'ck', on: m[2] !== ' ', ind: ind(m[1]), runs: inlineRuns(m[3] || '') };
    if ((m = l.match(RE_BUL))) return { kind: 'bl', ind: ind(m[1]), runs: inlineRuns(m[2]) };
    if ((m = l.match(RE_NUM))) return { kind: 'nm', num: m[2] + m[3], ind: ind(m[1]), runs: inlineRuns(m[4]) };
    if ((m = l.match(RE_HEAD))) return { kind: 'h', ind: 0, runs: inlineRuns(m[1]) };
    if ((m = l.match(RE_QUOTE))) return { kind: 'q', ind: 0, runs: inlineRuns(m[1]) };
    return { kind: l.trim() ? 'p' : 'empty', ind: 0, runs: inlineRuns(l) };
  });
}
const runsText = runs => runs.map(r => r.t).join('');

function notePlainText(n) {
  const lines = noteBlocks(n.body).map(b => {
    const pad = '   '.repeat(b.ind), t = runsText(b.runs);
    return { ck: `${pad}${b.on ? '☑' : '☐'} ${t}`, bl: `${pad}• ${t}`, nm: `${pad}${b.num} ${t}`, h: `▌${t}`, q: `> ${t}`, p: t, empty: '' }[b.kind];
  });
  return (n.title ? n.title + '\n\n' : '') + lines.join('\n').trim();
}

// ----- Word (.docx) : un vrai fichier Office, fabriqué sur place -----
const xmlEsc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
function docxRun(r, x = {}) {
  const p = []; // ordre imposé par le format Word
  if (r.code) p.push('<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New" w:cs="Courier New"/>');
  if (r.b || x.b) p.push('<w:b/>');
  if (r.i || x.i) p.push('<w:i/>');
  if (r.s || x.s) p.push('<w:strike/>');
  const col = r.fg ? FG_HEX[r.fg] : r.link ? '7C4DFF' : x.color;
  if (col) p.push(`<w:color w:val="${col}"/>`);
  if (x.sz) p.push(`<w:sz w:val="${x.sz}"/><w:szCs w:val="${x.sz}"/>`);
  if (r.link) p.push('<w:u w:val="single"/>');
  if (r.bg) p.push(`<w:shd w:val="clear" w:color="auto" w:fill="${HL_HEX[r.bg]}"/>`);
  return `<w:r>${p.length ? `<w:rPr>${p.join('')}</w:rPr>` : ''}<w:t xml:space="preserve">${xmlEsc(r.t)}</w:t></w:r>`;
}
function docxPara(b) {
  if (b.kind === 'empty') return '<w:p/>';
  let pre = '', bdr = '', x = {};
  if (b.kind === 'ck') { pre = (b.on ? '☒' : '☐') + ' '; if (b.on) x = { s: true, color: '888888' }; }
  if (b.kind === 'bl') pre = '•  ';
  if (b.kind === 'nm') pre = b.num + ' ';
  if (b.kind === 'h') x = { b: true, sz: 30 };
  if (b.kind === 'q') { x = { i: true, color: '666666' }; bdr = '<w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="BBBBBB"/></w:pBdr>'; }
  const left = b.ind * 360 + (b.kind === 'q' ? 240 : 0);
  const pPr = `<w:pPr>${bdr}<w:spacing w:before="${b.kind === 'h' ? 120 : 0}" w:after="${b.kind === 'h' ? 80 : 40}"/>${left ? `<w:ind w:left="${left}"/>` : ''}</w:pPr>`;
  return `<w:p>${pPr}${pre ? docxRun({ t: pre }, { color: x.color }) : ''}${b.runs.map(r => docxRun(r, x)).join('')}</w:p>`;
}
async function notesDocx(ns) {
  const media = [];
  const picXml = (rid, k, w, h) => {
    const EMU = 9525, maxW = 6 * 914400; // 6 pouces de large maximum
    let cx = w * EMU, cy = h * EMU;
    if (cx > maxW) { cy = Math.round(cy * maxW / cx); cx = maxW; }
    return `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${k}" name="Image ${k}"/>`
      + `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">`
      + `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${k}" name="image${k}"/><pic:cNvPicPr/></pic:nvPicPr>`
      + `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
      + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>`
      + `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
  };
  const parts = [];
  for (const [i, n] of ns.entries()) {
    let x = i ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : '';
    if (n.title) x += `<w:p><w:pPr><w:spacing w:after="200"/></w:pPr>${docxRun({ t: n.title, b: true }, { sz: 36 })}</w:p>`;
    for (const im of n.images || []) {
      try {
        const { buf, png } = await imageData(im.id);
        const k = media.length + 1, rid = 'rIdImg' + k;
        media.push({ name: `word/media/image${k}.${png ? 'png' : 'jpeg'}`, data: buf, rid, target: `media/image${k}.${png ? 'png' : 'jpeg'}` });
        x += picXml(rid, k, im.w, im.h);
      } catch { /* image indisponible : ignorée */ }
    }
    parts.push(x + noteBlocks(n.body).map(docxPara).join(''));
  }
  const body = parts.join('');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main', R = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zipStore([
    { name: '[Content_Types].xml', data: `${head}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>` },
    { name: '_rels/.rels', data: `${head}<Relationships xmlns="${R}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: 'word/_rels/document.xml.rels', data: `${head}<Relationships xmlns="${R}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${media.map(m => `<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${m.target}"/>`).join('')}</Relationships>` },
    { name: 'word/styles.xml', data: `${head}<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="40" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>` },
    { name: 'word/document.xml', data: `${head}<w:document xmlns:w="${W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>` },
    ...media.map(m => ({ name: m.name, data: m.data })),
  ], DOCX_MIME);
}

// Archive ZIP sans compression (suffisant pour un .docx).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(d) { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC_TABLE[(c ^ d[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files, type) {
  const enc = new TextEncoder(), parts = [], central = [];
  let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
    h.setUint16(12, 0x21, true); // date 1980-01-01
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
    h.setUint16(26, name.length, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + data.length;
  }
  const size = central.reduce((n, x) => n + x.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, size, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type });
}

// ----- PDF : mise en page ligne par ligne avec jsPDF (chargé à la demande, gardé pour le hors ligne) -----
let jsPDFp = null;
function loadJsPDF() {
  if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
  return jsPDFp ||= new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    sc.crossOrigin = 'anonymous';
    sc.onload = () => window.jspdf ? res(window.jspdf.jsPDF) : rej(new Error('PDF indisponible'));
    sc.onerror = () => { jsPDFp = null; sc.remove(); rej(new Error('PDF indisponible hors ligne, essaie « Imprimer »')); };
    document.head.appendChild(sc);
  });
}
// Les polices standard du PDF ne connaissent que l'alphabet latin (accents compris) : le reste (emoji…) est retiré.
const WIN_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const pdfSafe = s => String(s).replace(/\t/g, '  ').replace(/[^\x20-\x7e\xa0-\xff]/g, c => WIN_EXTRA.includes(c) ? c : '');

async function notesPDF(ns) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 50;
  let y = M;
  const font = (r, o) => {
    const b = r.b || o.b, i = r.i || o.i;
    doc.setFont(r.code ? 'courier' : 'helvetica', b && i ? 'bolditalic' : b ? 'bold' : i ? 'italic' : 'normal');
  };
  // Paragraphe avec retour à la ligne automatique ; o = { size, x0, b, i, s, color, prefix(base), after(top, bottom) }
  function para(runs, o = {}) {
    const size = o.size || 11, lh = size * 1.45, x0 = o.x0 ?? M, maxX = W - M;
    doc.setFontSize(size);
    if (y + lh > H - M) { doc.addPage(); y = M; }
    const top = y;
    let base = y + size, x = x0;
    const newLine = () => { base += lh; x = x0; if (base > H - M) { doc.addPage(); base = M + size; } };
    const draw = (tk, t, w) => {
      if (tk.bg) { doc.setFillColor('#' + HL_HEX[tk.bg]); doc.rect(x - 1, base - size * 0.8, w + 2, size * 1.08, 'F'); }
      const col = '#' + (tk.fg ? FG_HEX[tk.fg] : tk.link ? '7C4DFF' : o.color || '1F2328');
      doc.setTextColor(col);
      doc.text(t, x, base);
      if (tk.s || o.s) { doc.setDrawColor(col); doc.setLineWidth(0.7); doc.line(x, base - size * 0.3, x + w, base - size * 0.3); }
      if (tk.link) { doc.setDrawColor(col); doc.setLineWidth(0.5); doc.line(x, base + 1.5, x + w, base + 1.5); }
      x += w;
    };
    o.prefix?.(base, size);
    for (const r of runs) {
      for (const t of pdfSafe(r.t).split(/(\s+)/)) {
        if (!t) continue;
        font(r, o);
        const w = doc.getTextWidth(t);
        if (/^\s+$/.test(t)) { if (x > x0) x += w; continue; }
        if (x + w > maxX && x > x0) newLine();
        if (w <= maxX - x0) { draw(r, t, w); continue; }
        // Mot plus long que la ligne (lien…) : coupé où il faut.
        let part = '';
        for (const ch of t) {
          if (x + doc.getTextWidth(part + ch) > maxX && part) { draw(r, part, doc.getTextWidth(part)); newLine(); part = ''; }
          part += ch;
        }
        if (part) draw(r, part, doc.getTextWidth(part));
      }
    }
    y = base + lh - size;
    o.after?.(top, y);
    y += 2;
  }
  for (const [i, n] of ns.entries()) {
    if (i) { doc.addPage(); y = M; }
    if (n.title) { para([{ t: n.title, b: true }], { size: 18 }); y += 8; }
    // Images et dessins de la note (le texte, lui, reste du vrai texte sélectionnable)
    for (const im of n.images || []) {
      try {
        const { data, png } = await imageData(im.id);
        let w = W - 2 * M, h = w * im.h / im.w;
        if (h > 340) { h = 340; w = h * im.w / im.h; }
        if (y + h > H - M) { doc.addPage(); y = M; }
        doc.addImage(data, png ? 'PNG' : 'JPEG', M, y, w, h);
        y += h + 10;
      } catch { /* image indisponible : ignorée */ }
    }
    for (const b of noteBlocks(n.body)) {
      if (b.kind === 'empty') { y += 9; continue; }
      const x0 = M + b.ind * 18 + (['ck', 'bl', 'nm'].includes(b.kind) ? 20 : 0) + (b.kind === 'q' ? 12 : 0);
      const o = { x0 };
      if (b.kind === 'h') { o.size = 14; o.b = true; y += 4; }
      if (b.kind === 'q') {
        Object.assign(o, { i: true, color: '666666' });
        o.after = (a, z) => { doc.setDrawColor('#BBBBBB'); doc.setLineWidth(2); doc.line(x0 - 9, a + 2, x0 - 9, z - 2); };
      }
      if (b.kind === 'bl') o.prefix = (base, size) => { doc.setFillColor('#6B7280'); doc.circle(x0 - 11, base - size * 0.33, 1.9, 'F'); };
      if (b.kind === 'nm') o.prefix = (base) => { doc.setFont('helvetica', 'normal'); doc.setTextColor('#6B7280'); doc.text(b.num, x0 - 5, base, { align: 'right' }); };
      if (b.kind === 'ck') {
        if (b.on) Object.assign(o, { s: true, color: '888888' });
        o.prefix = (base, size) => {
          const sz = size * 0.9, bx = x0 - 19, by = base - sz + 1;
          doc.setLineWidth(1);
          doc.setDrawColor('#6B7280');
          if (b.on) {
            doc.setFillColor('#6B7280');
            doc.rect(bx, by, sz, sz, 'FD');
            doc.setDrawColor('#FFFFFF');
            doc.setLineWidth(1.5);
            doc.lines([[sz * 0.22, sz * 0.24], [sz * 0.4, -sz * 0.5]], bx + sz * 0.2, by + sz * 0.5);
          } else doc.rect(bx, by, sz, sz);
        };
      }
      para(b.runs, o);
    }
  }
  return doc.output('blob');
}

// Image d'une note en données (pour PDF / Word).
async function imageData(id) {
  const blob = await imageBlob(id);
  const buf = new Uint8Array(await blob.arrayBuffer());
  const png = buf[0] === 0x89 && buf[1] === 0x50;
  const data = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
  return { data, buf, png };
}

// ----- Impression (et "Enregistrer en PDF" du navigateur) -----
async function printNotes(ns) {
  const area = $('#print-area');
  area.innerHTML = ns.map(n => `<article class="print-note">${n.title ? `<h1>${esc(n.title)}</h1>` : ''}
    ${(n.images || []).map(im => `<img class="print-img" src="${fullUrl.get(im.id) || fileUrl(im.id)}" alt="">`).join('')}
    <div class="md">${renderBody(n.body, { links: true })}</div></article>`).join('');
  document.body.classList.add('printing');
  await Promise.all([...area.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
  const done = () => { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 50);
}

const fileBase = s => cleanText(s).replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) || 'Note';
// Fichier : partagé directement vers une appli (WhatsApp, mail…) si possible, sinon téléchargé.
async function shareFile(blob, name, type) {
  const file = new File([blob], name, { type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  downloadFile(blob, name);
}
function downloadFile(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('Fichier enregistré : ' + name);
}

// dl = true : mêmes formats, mais enregistrés sur l'appareil au lieu d'être partagés.
async function shareNotes(ns, dl = false) {
  if (!ns.length) return;
  loadJsPDF().catch(() => {}); // préchargé pendant que l'utilisateur choisit
  const one = ns.length === 1, verb = dl ? 'Télécharger' : 'Partager';
  const img = one ? [{ label: 'Image de la note (fond au choix)', icon: 'image', value: 'img' }] : [];
  const r = await menu(one ? `${verb} « ${ns[0].title || 'Note'} »` : `${verb} ${ns.length} notes`, dl ? [
    ...img,
    { label: 'PDF (mise en forme conservée)', icon: 'pdf', value: 'pdf' },
    { label: 'Word .docx (modifiable)', icon: 'doc', value: 'docx' },
    { label: 'Texte .txt', icon: 'notes', value: 'txt' },
    { label: 'Imprimer', icon: 'print', value: 'print' },
  ] : [
    { label: 'Texte (message, mail…)', icon: 'share', value: 'text' },
    ...img,
    { label: 'PDF (mise en forme conservée)', icon: 'pdf', value: 'pdf' },
    { label: 'Word .docx (modifiable)', icon: 'doc', value: 'docx' },
    { label: 'Imprimer', icon: 'print', value: 'print' },
    { label: 'Copier le texte', icon: 'copy', value: 'copy' },
  ]);
  if (!r) return;
  const base = fileBase(one ? ns[0].title || 'Note' : 'Notes');
  const text = ns.map(notePlainText).join('\n\n———\n\n');
  const out = (blob, name, type) => dl ? downloadFile(blob, name) : shareFile(blob, name, type);
  try {
    if (r === 'img') { await noteImageDialog(ns[0]); return; }
    if (r === 'txt') { downloadFile(new Blob([text], { type: 'text/plain;charset=utf-8' }), base + '.txt'); return; }
    if (r === 'text' && navigator.share) {
      const data = { title: one ? ns[0].title || 'Note' : 'Notes', text };
      const files = [];
      for (const n of ns) for (const im of n.images || []) {
        try { const b = await imageBlob(im.id); files.push(new File([b], `image-${files.length + 1}.${b.type === 'image/png' ? 'png' : 'jpg'}`, { type: b.type })); } catch {}
      }
      if (files.length && navigator.canShare?.({ files })) data.files = files;
      await navigator.share(data);
    }
    else if (r === 'text' || r === 'copy') { await navigator.clipboard.writeText(text); toast('Texte copié'); }
    else if (r === 'print') printNotes(ns);
    else if (r === 'docx') await out(await notesDocx(ns), base + '.docx', DOCX_MIME);
    else if (r === 'pdf') { toast('Création du PDF…'); await out(await notesPDF(ns), base + '.pdf', 'application/pdf'); }
  } catch (e) {
    if (e?.name !== 'AbortError') toast(e?.message || 'Partage impossible');
  }
}

// ----- Image de la note : dessinée comme le PDF (gras, couleurs, cases, listes…), sur le fond choisi -----
const IMG_BG = { '': '#ffffff', red: '#fbd5d0', orange: '#fde2c2', yellow: '#fff3b0', green: '#d6f0c8', teal: '#c8ece6', blue: '#d0e4fb', purple: '#e3d6f7', pink: '#f9d3e6', brown: '#e9dccf', gray: '#e4e6e9' };
const IMG_BG_MORE = ['#202124', '#1d2a44', '#2d1f47', '#123a2c'];
const FG_DARK = { rouge: 'f28b82', orange: 'fcad70', jaune: 'fdd663', vert: '81c995', bleu: '8ab4f8', violet: 'd7aefb', rose: 'ff8bcb', gris: 'bdc1c6' };
async function noteImage(n, bg) {
  const W = 1080, M = 72, S = 34, ink = inkOn(bg), dark = ink === '#fff';
  const muted = dark ? 'rgba(255,255,255,.6)' : 'rgba(32,33,36,.55)', link = dark ? '#8ab4f8' : '#1a73e8';
  const pics = [];
  for (const im of n.images || []) { try { pics.push(await createImageBitmap(await imageBlob(im.id))); } catch { /* indisponible */ } }
  const blocks = noteBlocks(n.body);
  while (blocks[0]?.kind === 'empty') blocks.shift();
  while (blocks.at(-1)?.kind === 'empty') blocks.pop();
  const c = document.createElement('canvas');
  let ctx, draw, y;
  const font = (r, o, size) => `${r.i || o.i ? 'italic ' : ''}${r.b || o.b ? 700 : 400} ${size}px ${r.code ? 'ui-monospace,Menlo,Consolas,monospace' : 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'}`;
  const hline = (x, yy, w, col, lw) => { ctx.fillStyle = col; ctx.fillRect(x, yy, w, lw); };
  function para(runs, o = {}) {
    const size = o.size || S, lh = size * 1.45, x0 = o.x0 ?? M, maxX = W - M, top = y;
    let base = y + size, x = x0;
    const put = (r, t, w) => {
      if (draw) {
        if (r.bg) { ctx.fillStyle = '#' + HL_HEX[r.bg]; ctx.fillRect(x - 2, base - size * 0.86, w + 4, size * 1.14); }
        if (r.code) { ctx.fillStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.07)'; ctx.fillRect(x - 3, base - size * 0.86, w + 6, size * 1.14); }
        const col = r.fg ? '#' + (dark && !r.bg ? FG_DARK : FG_HEX)[r.fg] : r.bg ? '#202124' : r.link ? link : o.color || ink;
        ctx.font = font(r, o, size);
        ctx.fillStyle = col;
        ctx.fillText(t, x, base);
        if (r.s || o.s) hline(x, base - size * 0.32, w, col, 2);
        if (r.link) hline(x, base + 4, w, col, 1.5);
      }
      x += w;
    };
    if (draw) o.prefix?.(base, size);
    for (const r of runs) {
      ctx.font = font(r, o, size);
      for (const t of r.t.split(/(\s+)/)) {
        if (!t) continue;
        const w = ctx.measureText(t).width;
        if (/^\s+$/.test(t)) { if (x > x0) x += w; continue; }
        if (x + w > maxX && x > x0) { base += lh; x = x0; }
        if (w <= maxX - x0) { put(r, t, w); continue; }
        let part = ''; // mot plus long que la ligne (lien…) : coupé où il faut
        for (const ch of t) {
          if (x + ctx.measureText(part + ch).width > maxX && part) { put(r, part, ctx.measureText(part).width); base += lh; x = x0; part = ''; ctx.font = font(r, o, size); }
          part += ch;
        }
        if (part) put(r, part, ctx.measureText(part).width);
      }
    }
    y = base + lh - size;
    if (draw) o.after?.(top, y);
    y += 4;
  }
  function layout() {
    y = M;
    if (n.title) { para([{ t: n.title, b: true }], { size: S * 1.45 }); y += 16; }
    for (const p of pics) {
      let w = W - 2 * M, h = w * p.height / p.width;
      if (h > 1000) { h = 1000; w = h * p.width / p.height; }
      if (draw) { ctx.save(); ctx.beginPath(); ctx.roundRect(M, y, w, h, 18); ctx.clip(); ctx.drawImage(p, M, y, w, h); ctx.restore(); }
      y += h + 24;
    }
    for (const b of blocks) {
      if (b.kind === 'empty') { y += S * 0.6; continue; }
      const x0 = M + b.ind * S * 1.1 + (['ck', 'bl', 'nm'].includes(b.kind) ? S * 1.25 : 0) + (b.kind === 'q' ? S * 0.7 : 0);
      const o = { x0 };
      if (b.kind === 'h') { o.size = S * 1.22; o.b = true; y += 8; }
      if (b.kind === 'q') { Object.assign(o, { i: true, color: muted }); o.after = (a, z) => hline(x0 - S * 0.55, a + 4, 5, muted, z - a - 8); }
      if (b.kind === 'bl') o.prefix = (base, size) => { ctx.fillStyle = muted; ctx.beginPath(); ctx.arc(x0 - S * 0.68, base - size * 0.33, size * 0.13, 0, 7); ctx.fill(); };
      if (b.kind === 'nm') o.prefix = base => { ctx.font = font({}, {}, S); ctx.fillStyle = muted; ctx.textAlign = 'right'; ctx.fillText(b.num, x0 - S * 0.3, base); ctx.textAlign = 'left'; };
      if (b.kind === 'ck') {
        if (b.on) Object.assign(o, { s: true, color: muted });
        o.prefix = (base, size) => {
          const z = size * 0.86, bx = x0 - S * 1.2, by = base - z + 2;
          ctx.lineWidth = 3; ctx.strokeStyle = muted; ctx.fillStyle = muted;
          ctx.beginPath(); ctx.roundRect(bx, by, z, z, 6);
          if (!b.on) { ctx.stroke(); return; }
          ctx.fill();
          ctx.strokeStyle = bg; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(bx + z * 0.22, by + z * 0.52); ctx.lineTo(bx + z * 0.42, by + z * 0.72); ctx.lineTo(bx + z * 0.78, by + z * 0.3); ctx.stroke();
        };
      }
      para(b.runs, o);
    }
    return Math.min(16000, Math.ceil(y + M - 8)); // limite de taille des images du navigateur
  }
  c.width = W; c.height = 1;
  ctx = c.getContext('2d'); draw = false;
  const H = layout();
  c.height = H;
  ctx = c.getContext('2d'); draw = true;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  layout();
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('Image impossible')), 'image/png'));
}
async function noteImageDialog(n) {
  let bg = IMG_BG[n.color || ''] || '#ffffff', url = '', k = 0;
  const cols = [...new Set([bg, ...Object.values(IMG_BG), ...IMG_BG_MORE])];
  const mark = el => $$('#dlg .ni-sw .sw').forEach(x => x.classList.toggle('on', x === el));
  const refresh = async () => {
    const my = ++k;
    try {
      const b = await noteImage(n, bg);
      if (my !== k || !$('#ni-img')) return;
      URL.revokeObjectURL(url);
      url = URL.createObjectURL(b);
      $('#ni-img').src = url;
    } catch { /* l'aperçu suivant remplacera */ }
  };
  const done = dialog({
    title: 'Image de la note',
    html: `<div class="ni-prev"><img id="ni-img" alt="Aperçu"></div>
      <div class="swatches ni-sw">${cols.map(c => `<button type="button" class="sw ${c === bg ? 'on' : ''}" data-bg="${c}" style="background:${c}" aria-label="Fond ${c}" title="Fond"></button>`).join('')}
      <label class="sw ni-pick" title="Autre couleur" aria-label="Autre couleur"><input type="color" id="ni-color" value="${bg}"></label></div>`,
    buttons: [{ label: 'Annuler' }, { label: 'Partager', value: 'share' }, { label: 'Télécharger', value: 'dl', primary: true }],
    onClick: e => {
      const b = e.target.closest('[data-bg]');
      if (!b) return false;
      bg = b.dataset.bg;
      mark(b);
      refresh();
      return true;
    },
  });
  $('#ni-color').addEventListener('input', e => { bg = e.target.value; mark(e.target.closest('.sw')); refresh(); });
  refresh();
  const r = await done;
  k++;
  URL.revokeObjectURL(url);
  if (!r) return;
  try {
    const blob = await noteImage(n, bg), name = fileBase(n.title || 'Note') + '.png';
    r.value === 'dl' ? downloadFile(blob, name) : await shareFile(blob, name, 'image/png');
  } catch (e) { if (e?.name !== 'AbortError') toast('Image impossible'); }
}

// ================= Installation (vraie application, pas un raccourci) =================
let installEvt = null;
// Le bouton « Installer » de l'en-tête n'apparaît qu'aux 3 premières ouvertures (il reste dans Réglages).
const installViews = (() => { const n = (+lsGet('rp_install_views') || 0) + 1; lsSet('rp_install_views', String(n)); return n; })();
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// Pas de preventDefault : Chrome affiche sa bannière d'installation habituelle ;
// on garde aussi l'événement pour nos boutons "Installer".
window.addEventListener('beforeinstallprompt', e => {
  installEvt = e;
  if (user) render();
});
window.addEventListener('appinstalled', () => { installEvt = null; toast('Carnet est installé'); render(); });

async function installApp() {
  lsSet('rp_install_views', '99'); // utilisé : on ne le remontre plus dans l'en-tête
  if (installEvt) {
    installEvt.prompt();
    const { outcome } = await installEvt.userChoice;
    installEvt = null;
    if (outcome === 'accepted') toast('Installation en cours…');
    render();
    return;
  }
  const steps = isIOS()
    ? `<ol class="steps"><li>Ouvre ce site dans <b>Safari</b></li><li>Touche <b>Partager</b> (le carré avec une flèche)</li><li>Choisis <b>Sur l'écran d'accueil</b></li><li>Lance ensuite <b>Carnet</b> depuis l'écran d'accueil (nécessaire pour les notifications)</li></ol>`
    : `<ol class="steps"><li>Ouvre le menu <b>⋮</b> de Chrome</li><li>Touche <b>Installer l'application</b>, ou <b>Ajouter à l'écran d'accueil</b> puis <b>Installer</b> (pas « Créer un raccourci »)</li></ol><p class="small muted">Si seul « raccourci » est proposé : supprime l'ancien raccourci (Rappels ou Carnet), ferme l'onglet, puis rouvre le site.</p>`;
  dialog({ title: isIOS() ? 'Installer sur iPhone' : "Installer l'application", html: steps, buttons: [{ label: 'OK', value: 'ok', primary: true }] });
}
// Propose l'installation une seule fois.
function maybeOfferInstall() {
  if (!user || isStandalone() || lsGet('rp_install_asked') || (!installEvt && !isIOS())) return;
  lsSet('rp_install_asked', '1');
  setTimeout(() => toast('Installer Carnet comme une vraie application ?', 'Installer', installApp), 1500);
}

// Raccourcis de l'icône (appui long) : ?new=note / ?new=task
function handleLaunch() {
  const n = new URLSearchParams(location.search).get('new');
  if (!n || !user) return;
  history.replaceState(null, '', location.pathname);
  if (n === 'note') { setView('notes'); openNote(null); }
  else if (n === 'task') { setView('tasks'); openTask(null); }
  else if (n === 'share') importShare();
}

// Contenu partagé depuis une autre appli (voir sw.js) → nouvelle note : titre, texte, lien et images.
async function importShare() {
  let meta = null;
  const files = [];
  try {
    const c = await caches.open('rappels-share');
    const r = await c.match('share/meta');
    if (!r) return;
    meta = await r.json();
    for (let i = 0; i < (meta.n || 0); i++) {
      const f = await c.match('share/file' + i);
      if (f) { const b = await f.blob(); files.push(new File([b], meta.names?.[i] || `image-${i + 1}`, { type: b.type })); }
    }
    for (const k of await c.keys()) await c.delete(k);
  } catch { return; }
  let text = sharedToNote(meta.text || '');
  const url = (meta.url || '').trim();
  if (url && !text.includes(url)) text = text ? text + '\n' + url : url;
  let title = (meta.title || '').trim();
  if (title && text.startsWith(title)) title = ''; // certaines applis répètent le titre dans le texte
  setView('notes');
  openNote(null);
  $('#ed-title').value = title;
  if (text) edRender(text, null);
  if (title || text) edProgrammatic();
  if (files.length) await addImages(files);
  document.activeElement?.blur?.(); // on montre la note, sans ouvrir le clavier
  toast('Nouvelle note créée depuis le partage');
}
// Mise en forme la plus courante (Markdown, listes à puces) → celle des notes.
function sharedToNote(t) {
  return String(t).replace(/\r\n?/g, '\n')
    .replace(/\*\*([^*\n]+)\*\*/g, '*$1*')          // **gras** → *gras*
    .replace(/__([^_\n]+)__/g, '*$1*')                  // __gras__ → *gras*
    .replace(/~~([^~\n]+)~~/g, '~$1~')                  // ~~barré~~ → ~barré~
    .replace(/^(\s*)[-*+] \[( |x|X)\] /gm, '$1[$2] ')  // - [ ] tâche → case à cocher
    .replace(/^(\s*)[•◦▪‣·–] ?/gm, '$1- ')              // puces typographiques → liste
    .replace(/^#{4,6} /gm, '### ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function refreshStatus() {
  try { srvStatus = await api('status'); if (view === 'settings') renderSettings(); if (srvStatus.admin && $('#s-admin').open) loadAdmin(); } catch {}
}

// ================= Rappels / notifications =================
async function askNotif() {
  if (!('Notification' in window)) { toast('Notifications non disponibles ici'); return; }
  const p = await Notification.requestPermission();
  if (p !== 'granted') { toast('Notifications refusées'); render(); return; }
  if (isLocal()) { toast("Notifications activées (uniquement quand l'appli est ouverte)"); render(); return; }
  try {
    await enablePush();
    await refreshStatus();
    toast('Notifications activées sur cet appareil');
  } catch (e) {
    toast('Notifications activées (uniquement quand l\'appli est ouverte sur cet appareil)');
  }
  render();
}

function checkReminders() {
  if (!user) return;
  // Si ntfy est configuré, le serveur s'occupe des rappels quand l'appli est en arrière-plan.
  if (document.hidden && (S.settings.ntfy || (pushOn && cronOk()))) return;
  const now = Date.now();
  let any = false;
  for (const t of live('tasks')) {
    const due = dueMs(t);
    if (!due || due > now || (S.fired[t.id] || 0) >= due) continue;
    S.fired[t.id] = due;
    any = true;
    if (now - due < REMIND_WINDOW) notify(t);
  }
  if (any) changed({ quiet: !!overlays.length });
}

async function notify(t) {
  const title = t.title || 'Rappel';
  toast('⏰ ' + title);
  navigator.vibrate?.([200, 100, 200]);
  // Appli ouverte à l'écran : le bandeau suffit, pas de notification système en plus.
  if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body: t.details || fmtDate(t), tag: t.id, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', renotify: false, vibrate: [200, 100, 200] };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch {}
}

// ================= Import / export =================
function exportData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
  a.download = `carnet-${isLocal() ? 'local' : user}-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importData(file) {
  let data;
  try { data = normalize(JSON.parse(await file.text())); } catch { toast('Fichier invalide'); return; }
  const now = Date.now();
  let k = 0;
  for (const c of COLL) {
    for (const [id, it] of Object.entries(data[c])) {
      if (!it || it.deleted || !/^[a-z][a-z0-9]{3,47}$/i.test(id)) continue;
      const cur = S[c][id];
      if (!cur || cur.deleted || (it.updatedAt || 0) > (cur.updatedAt || 0)) { S[c][id] = { ...it, id, updatedAt: now }; k++; }
    }
  }
  changed();
  toast(`${plural(k, 'élément')} importé${k > 1 ? 's' : ''}`);
}

// ================= Connexion =================
let authMode = 'login';

function showAuth() {
  user = null;
  lsDel('rp_last_user');
  S = emptyState();
  BASE = { tasks: {}, notes: {}, lists: {}, images: {} };
  applyTheme();
  $('#app').classList.add('hidden');
  $('#auth').classList.remove('hidden');
}

function startApp(name) {
  user = name;
  lsSet('rp_last_user', name);
  try { S = normalize(JSON.parse(lsGet('rp_state:' + name) || '{}')); } catch { S = emptyState(); }
  try { account = JSON.parse(lsGet('rp_account:' + name) || '{}'); } catch { account = {}; }
  try { BASE = JSON.parse(lsGet('rp_base:' + name) || '{}'); } catch { BASE = {}; }
  for (const k of COLL) BASE[k] = obj(BASE[k]);
  const start = S.settings.start || 'notes';
  view = start === 'last' ? (VIEWS[lsGet('rp_view')] ? lsGet('rp_view') : 'notes') : start;
  $('#auth').classList.add('hidden');
  $('#app').classList.remove('hidden');
  purgeTrash();
  rollover();
  render();
  restorePending();
}

function setAccount(r) {
  account = { lastSeen: (r.lastSeen || 0) * 1000, devices: r.devices || 0 };
  lsSet('rp_account:' + user, JSON.stringify(account));
}

$('#auth-seg').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  authMode = b.dataset.mode;
  $$('#auth-seg button').forEach(x => x.classList.toggle('on', x === b));
  const reg = authMode === 'register';
  $('#a-code-wrap').classList.toggle('hidden', !reg);
  $('#a-askcode').classList.toggle('hidden', !reg || signupOpen);
  if (reg) loadSignup();
  $('#a-pass').autocomplete = reg ? 'new-password' : 'current-password';
  $('#a-submit').textContent = reg ? 'Créer mon compte' : 'Se connecter';
  $('#a-err').textContent = '';
});

$('#auth-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#a-submit');
  btn.disabled = true;
  $('#a-err').textContent = '';
  try {
    const r = await api(authMode, { user: $('#a-user').value, pass: $('#a-pass').value, code: $('#a-code').value });
    $('#a-pass').value = $('#a-code').value = '';
    startApp(r.user);
    api('me').then(m => { setAccount(m); render(); }).catch(() => {});
    refreshStatus(); // admin ou non : sans attendre un rechargement
    sync().then(() => { setTimeout(() => checkRestore(false), 1500); waitLoop(); }); // compte recréé sur le serveur : données à renvoyer ?
  } catch (err) {
    $('#a-err').textContent = err.status ? err.message : 'Serveur injoignable';
  } finally {
    btn.disabled = false;
  }
});

// ================= Événements =================
let lpFired = false; // un appui long vient de se produire : on ignore le "clic" qui suit
document.addEventListener('click', e => {
  const card = e.target.closest('#notes .note[data-id]');
  if (card && lpFired) { lpFired = false; return; }
  if (card && selNotes) { toggleSel(card.dataset.id); return; }
  if (card && (e.ctrlKey || e.metaKey)) { startSelect(card.dataset.id); return; }
  const sb = e.target.closest('[data-sel]');
  if (sb) { selAction(sb.dataset.sel); return; }
  const lb = e.target.closest('[data-list]');
  if (lb) { setList(lb.dataset.list); setView('tasks'); return; }
  const nf = e.target.closest('[data-nfilter]');
  if (nf) { noteFilter = nf.dataset.nfilter; render(); return; }
  // Carte de tâche : toucher n'importe où (hors case et étoile) l'ouvre.
  const a = e.target.closest('[data-act]') || e.target.closest('.tgrid .task[data-id]')?.querySelector('.tbody');
  if (!a) return;
  if (Date.now() - lastSwipe < 400 && a.closest('.task')) return; // fin d'un balayage, pas un clic
  const id = a.closest('[data-id]')?.dataset.id;
  // Dans l'éditeur, la ligne est sa position dans le texte (les lignes ne sont pas toutes redessinées).
  const ln = a.closest('#ed-body > .ln');
  const line = ln ? [...edEl().children].indexOf(ln) : +a.dataset.line;
  switch (a.dataset.act) {
    case 'toggle': animateToggle(a, id); break;
    case 'star': navigator.vibrate?.(8); toggleStar(id); break;
    case 'edit': openTask(id); break;
    case 'note': openNote(id); break;
    case 'ncheck': toggleCheckLine(id, line); break;
    case 'nplan': planLine(id, line); break;
    case 'colmenu': popMenu(a, [{ value: 'one', label: 'Revenir à une colonne', icon: 'columns' }]).then(v => { if (v) toggleCols(); }); break;
    case 'newlist': newList(); break;
    case 'newnote': openNote(null); break;
    case 'newlistnote': openNote(null, '[ ] '); break;
    case 'newdraw': openNote(null); openDraw(null); break;
    case 'listmenu': listMenu(); break;
    case 'emptytrash': emptyTrash(); break;
    case 'galclear': (async () => {
      const ids = live('images').map(x => x.id);
      if (await confirmDlg('Supprimer toutes les images ?', `${plural(ids.length, 'image')} ser${ids.length > 1 ? 'ont' : 'a'} effacée${ids.length > 1 ? 's' : ''} définitivement.`, 'Tout supprimer', true)) removeGallery(ids);
    })(); break;
    case 'clear-done': clearDone(t => curList === 'all' || (curList === 'starred' ? t.starred : taskList(t) === curList)); break;
  }
});
document.addEventListener('toggle', e => {
  if (!e.target.matches?.('details.done')) return;
  doneOpen = e.target.open;
  lsSet('rp_done_open', doneOpen ? '1' : '0');
  const h = e.target.querySelector('.hint');
  if (h) h.textContent = doneOpen ? 'Masquer' : 'Afficher';
}, true);

$$('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
$('#fab').addEventListener('click', () => {
  if (view === 'notes') openNote(null);
  else if (view === 'agenda') openTask(null, nextHour());
  else if (view === 'calendar') openTask(null, calSlot(calSel));
  else if (view === 'gallery') galAdd($('#fab'));
  else openTask(null, { date: '', time: '' });
});
$('#quick').addEventListener('submit', e => { e.preventDefault(); quickAdd($('#quick-in').value); $('#quick-in').value = ''; });
$('#rquick').addEventListener('submit', e => { e.preventDefault(); addQuickReminder(); });
// Aperçu de ce qui sera compris pendant la frappe
$('#rquick-in').addEventListener('input', () => {
  const v = $('#rquick-in').value.trim();
  const r = v ? parseReminder(v) : null;
  $('#rquick-hint').innerHTML = r?.title ? `${icon('bell')}<b>${esc(r.title)}</b> · ${esc(fmtDate(r))}` : '';
});
$('#nsearch').addEventListener('input', renderNotes);
$$('.vseg[data-lay]').forEach(el => el.addEventListener('click', e => {
  const b = e.target.closest('[data-lv]');
  if (b) setLayout(el.dataset.lay, b.dataset.lv);
}));
// Appui long sur une note : sélection multiple. (Clic droit sur PC.)
{
  const el = $('#notes');
  let lp = null, lastPtr = 'mouse';
  const cancel = () => { if (lp) { clearTimeout(lp.t); lp = null; } };
  el.addEventListener('pointerdown', e => {
    lastPtr = e.pointerType;
    lpFired = false;
    const c = e.target.closest('.note[data-id]');
    if (!c || e.button > 0) return;
    cancel();
    lp = { x: e.clientX, y: e.clientY, t: setTimeout(() => {
      lp = null;
      if (!c.isConnected) return;
      lpFired = true;
      navigator.vibrate?.(25);
      startDragSel('note', el, '.note[data-id]', x => x.dataset.id, c, e);
    }, 450) };
  });
  el.addEventListener('pointermove', e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) cancel(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, cancel));
  el.addEventListener('contextmenu', e => {
    const c = e.target.closest('.note[data-id]');
    if (!c) return;
    e.preventDefault();
    if (lastPtr === 'mouse') selNotes ? toggleSel(c.dataset.id) : startSelect(c.dataset.id);
  });
}

// Feuille tâche
$('#backdrop').addEventListener('click', () => closeOverlay());
$('#t-cancel').addEventListener('click', () => closeOverlay());
$('#t-save').addEventListener('click', saveTask);
$('#t-title').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveTask(); } });
$('#sheet').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveTask(); } });
$('#t-del').addEventListener('click', () => { const id = edTask.id; closeOverlay(() => deleteTask(id)); });
$('#t-star').addEventListener('click', () => { edTask.starred = !edTask.starred; renderSheetBits(); });
$('#t-from').addEventListener('click', () => { const nid = edTask.fromNote; closeOverlay(() => { setView('notes'); openNote(nid); }); });
$('#t-repeat').addEventListener('change', () => {
  // "Toutes les semaines" : le jour de la date choisie (ou aujourd'hui) est présélectionné, modifiable.
  if ($('#t-repeat').value === 'weekly' && !edTask.days.length) edTask.days = [weekday($('#t-date').value)];
  renderSheetBits();
});
$('#t-list').addEventListener('change', async e => {
  if (e.target.value !== '__new') { edTask.list = e.target.value; return; }
  const name = await ask('Nouvelle liste', '', 'Créer', 'Ex. Courses, Travail…');
  if (name && edTask) { const l = createList(name); changed({ quiet: true }); edTask.list = l.id; }
  if (edTask) fillListSelect(edTask.list);
});
$('#t-colors').addEventListener('click', e => { const b = e.target.closest('.sw'); if (!b) return; edTask.color = b.dataset.c; renderSheetBits(); });
$('#t-days').addEventListener('click', e => {
  const b = e.target.closest('[data-day]');
  if (!b) return;
  const v = +b.dataset.day;
  edTask.days = edTask.days.includes(v) ? edTask.days.filter(x => x !== v) : [...edTask.days, v];
  renderSheetBits();
});
['input', 'change'].forEach(ev => $('#t-date').addEventListener(ev, sheetKind));
// Heure de fin : si on déplace le début, la fin suit en gardant la même durée.
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const durFrom = (a, b) => a && b && toMin(b) > toMin(a) ? toMin(b) - toMin(a) : 0;
let endStart = '';
$('#t-time').addEventListener('change', () => {
  const a = $('#t-time').value, d = durFrom(endStart, $('#t-end').value);
  if (a && d) $('#t-end').value = endTime({ time: a, dur: d });
  if (!a) $('#t-end').value = '';
  endStart = a;
});
$('#t-quick').addEventListener('click', () => setTimeout(sheetKind));
$('#t-quick').addEventListener('click', e => {
  const q = e.target.closest('[data-q]')?.dataset.q;
  if (!q) return;
  if (q === 'clear') { $('#t-date').value = ''; $('#t-time').value = ''; }
  else if (q === 'notime') $('#t-time').value = '';
  else if (q === 'monday') { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); $('#t-date').value = ymd(d); }
  else if (q === '+1h') {
    const d = new Date(Date.now() + 3600e3);
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
    $('#t-date').value = ymd(d);
    $('#t-time').value = pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  else $('#t-date').value = today(+q);
  $('#t-time').dispatchEvent(new Event('change')); // l'heure de fin suit
});

// Éditeur de note
$('#ed-backdrop').addEventListener('click', () => closeOverlay());
$('#ed-back').addEventListener('click', () => closeOverlay());
$('#ed-more').addEventListener('click', noteMenu);
$('#ed-archive').addEventListener('click', toggleArchive);
$('#ed-pin').addEventListener('click', () => touchNote(n => { n.pinned = !n.pinned; if (n.pinned) n.archived = false; }));
$('#ed-title').addEventListener('input', onTitleInput);
$('#ed-trashbar').addEventListener('click', e => {
  const b = e.target.closest('[data-tb]');
  if (b?.dataset.tb === 'restore') restoreCurNote();
  else if (b?.dataset.tb === 'purge') purgeCurNote();
});
// Geste retour : faire glisser la note vers la droite. Elle suit le doigt en laissant voir la liste ;
// lâchée après le tiers de l'écran (ou lancée), elle se ferme, sinon elle reprend sa place.
{
  const ed = $('#editor');
  let g = null;
  ed.addEventListener('touchstart', e => {
    g = null;
    if (!slides() || e.touches.length !== 1 || overlays.at(-1) !== 'editor') return;
    if (e.target.closest('.ed-tools, .ed-pop, .ed-link, .ed-move, .ed-imgs, .inimg')) return;
    const t = e.touches[0];
    g = { x0: t.clientX, y0: t.clientY, t0: e.timeStamp, x: 0, v: 0, lx: t.clientX, lt: e.timeStamp, on: false };
  }, { passive: true });
  ed.addEventListener('touchmove', e => {
    if (!g || e.touches.length !== 1) { g = null; return; }
    const t = e.touches[0], dx = t.clientX - g.x0, dy = t.clientY - g.y0;
    if (!g.on) {
      // Pas après un appui long (sélection de texte), ni en défilant, ni vers la gauche.
      if (Math.abs(dy) > 12 || dx < -12 || e.timeStamp - g.t0 > 350 || !getSelection().isCollapsed) { g = null; return; }
      if (dx < 18 || dx < Math.abs(dy) * 2) return;
      g.on = true;
      g.x0 = t.clientX;
      ed.classList.remove('ed-anim');
      document.body.classList.add('ed-drag');
    }
    if (e.cancelable) e.preventDefault();
    g.v = (t.clientX - g.lx) / Math.max(1, e.timeStamp - g.lt);
    g.lx = t.clientX; g.lt = e.timeStamp;
    g.x = Math.max(0, t.clientX - g.x0);
    ed.style.transform = `translateX(${g.x}px)`;
    edDim(1 - g.x / ed.offsetWidth);
  }, { passive: false });
  const end = () => {
    const st = g;
    g = null;
    if (!st?.on) return;
    document.body.classList.remove('ed-drag');
    if (st.x > ed.offsetWidth / 3 || (st.v > 0.45 && st.x > 30)) closeOverlay();
    else { ed.classList.add('ed-anim'); ed.style.transform = ''; edDim(1); }
  };
  ed.addEventListener('touchend', end);
  ed.addEventListener('touchcancel', end);
}
// Note dans la corbeille : toucher le texte ou taper au clavier propose de la restaurer.
['#ed-body', '#ed-title'].forEach(sel => $(sel).addEventListener('click', e => {
  if (S.notes[curNote]?.trashed && !e.target.closest('[data-act]')) askRestore();
}));
document.addEventListener('keydown', e => {
  if (!curNote || !S.notes[curNote]?.trashed || overlays.at(-1) !== 'editor') return;
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); askRestore(); }
});
$('#ed-title').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); edEl().focus(); edSetSel(0); }
  else edShortcuts(e);
});

// Saisie dans le texte de la note
const body = edEl();
body.addEventListener('compositionstart', () => { composing = true; });
body.addEventListener('compositionend', () => { composing = false; onBodyInput(true); });
body.addEventListener('input', e => { onBodyInput(!(composing || e.isComposing)); });
body.addEventListener('beforeinput', e => {
  switch (e.inputType) {
    // Seulement si l'action du navigateur peut être annulée : sinon on le laisse faire (évite les lignes en double).
    case 'insertParagraph': case 'insertLineBreak':
      if (e.cancelable) { e.preventDefault(); handleEnter(); }
      break;
    case 'deleteContentBackward':
      if (e.cancelable && !composing && handleBackspace()) e.preventDefault();
      break;
    case 'historyUndo': e.preventDefault(); undo(); break;
    case 'historyRedo': e.preventDefault(); redo(); break;
    case 'formatBold': e.preventDefault(); wrap('*'); break;
    case 'formatItalic': e.preventDefault(); wrap('_'); break;
    case 'insertFromDrop': e.preventDefault(); break;
    default: if (e.inputType.startsWith('format')) e.preventDefault(); // pas de mise en forme "riche" du navigateur
  }
});
body.addEventListener('keydown', edShortcuts); // Entrée / Retour arrière : gérés par "beforeinput" ci-dessus
// Coller : une image devient une image de la note, le reste toujours en texte brut.
body.addEventListener('paste', e => {
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
  if (files.length) { e.preventDefault(); addImages(files); return; }
  e.preventDefault();
  const t = (e.clipboardData?.getData('text/plain') || '').replace(/\r\n?/g, '\n');
  const { s, e: end } = curSel();
  edReplace(s, end, t);
});
// Copier / couper : texte brut aussi (avec les marqueurs, pour garder la mise en forme).
['copy', 'cut'].forEach(ev => body.addEventListener(ev, e => {
  const sel = edGetSel();
  if (!sel || sel.s === sel.e) return;
  e.preventDefault();
  e.clipboardData.setData('text/plain', edText.slice(sel.s, sel.e));
  if (ev === 'cut') edReplace(sel.s, sel.e, '');
}));
// Cases et cloches dans le texte : ne pas déplacer le curseur en les touchant.
['pointerdown', 'mousedown'].forEach(ev => body.addEventListener(ev, e => { if (e.target.closest('[data-act]')) e.preventDefault(); }));

// Liens dans le texte : les toucher place le curseur (le lien reste du texte modifiable)
// et affiche une bulle « Ouvrir le lien ». Ctrl+clic (Cmd+clic) l'ouvre directement.
let edLinkUrl = '';
const linkUrl = a => a.textContent.replace(/[.,;:!?)\]}»"']+$/, '');
function hideLinkPop() { if (edLinkUrl) { edLinkUrl = ''; $('#ed-link').classList.add('hidden'); } }
function showLinkPop(a, y) {
  edLinkUrl = linkUrl(a);
  const pop = $('#ed-link'), box = $('#editor').getBoundingClientRect();
  const rs = [...a.getClientRects()], r = rs.find(x => y >= x.top && y <= x.bottom) || rs[0];
  if (!r) return;
  pop.classList.remove('hidden');
  const w = pop.offsetWidth, h = pop.offsetHeight;
  const below = r.bottom - box.top + 6, above = r.top - box.top - h - 6;
  pop.style.top = (below + h > box.height - 60 && above > 50 ? above : below) + 'px';
  pop.style.left = Math.max(8, Math.min(box.width - w - 8, r.left - box.left + r.width / 2 - w / 2)) + 'px';
}
body.addEventListener('click', e => {
  const a = e.target.closest('.lnk');
  if (!a) { hideLinkPop(); return; }
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); window.open(linkUrl(a), '_blank', 'noopener'); return; }
  showLinkPop(a, e.clientY);
});
body.addEventListener('input', hideLinkPop);
body.addEventListener('input', () => { clearTimeout(edLinksTimer); edLinksTimer = setTimeout(renderEdLinks, 900); });
edScroller().addEventListener('scroll', hideLinkPop, { passive: true });
$('#ed-link').addEventListener('pointerdown', e => e.preventDefault()); // garde le curseur dans le texte
$('#ed-link').addEventListener('click', async e => {
  const b = e.target.closest('[data-lk]'), url = edLinkUrl;
  if (!b || !url) return;
  hideLinkPop();
  if (b.dataset.lk === 'open') window.open(url, '_blank', 'noopener');
  else { try { await navigator.clipboard.writeText(url); toast('Lien copié'); } catch { toast('Copie impossible'); } }
});

function edShortcuts(e) {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
  else if (e.target === body && k === 'b') { e.preventDefault(); wrap('*'); }
  else if (e.target === body && k === 'i') { e.preventDefault(); wrap('_'); }
  else if (e.target === body && k === 'u') { e.preventDefault(); } // pas de souligné
}
// Panneaux de l'éditeur (un seul ouvert à la fois). Couleurs, surlignage et fond de note se ferment
// dès qu'on touche ailleurs ; la ligne de mise en forme (Aa) reste jusqu'à ce qu'on la referme.
const ED_PANELS = { fmt: '#ed-fmt', tcolor: '#ed-tcolors', hl: '#ed-hls', palette: '#ed-panel' };
function edPanel(name) {
  for (const [k, sel] of Object.entries(ED_PANELS)) {
    const show = k === name && $(sel).classList.contains('hidden');
    $(sel).classList.toggle('hidden', !show);
    $(`#ed-tools [data-tool="${k}"]`)?.classList.toggle('on', show);
  }
}
function closeEdPanels(keepFmt = true) {
  for (const [k, sel] of Object.entries(ED_PANELS)) {
    if (keepFmt && k === 'fmt') continue;
    $(sel).classList.add('hidden');
    $(`#ed-tools [data-tool="${k}"]`)?.classList.remove('on');
  }
}
document.addEventListener('pointerdown', e => {
  if (!curNote || e.target.closest('.ed-pop, #ed-tools')) return;
  closeEdPanels();
});
// Garde le focus (et la sélection) dans le texte quand on touche la barre d'outils.
['pointerdown', 'mousedown'].forEach(ev => ['#ed-tools', '#ed-fmt', '#ed-tcolors', '#ed-hls'].forEach(id => $(id).addEventListener(ev, e => { if (e.target.closest('button')) e.preventDefault(); })));
function onTool(e) {
  const t = e.target.closest('[data-tool]')?.dataset.tool;
  switch (t) {
    case 'fmt': case 'tcolor': case 'hl': case 'palette': edPanel(t); break;
    case 'undo': undo(); break;
    case 'redo': redo(); break;
    case 'bold': wrap('*'); break;
    case 'italic': wrap('_'); break;
    case 'strike': wrap('~'); break;
    case 'code': wrap('`'); break;
    case 'date': insertDate(); break;
    case 'check': case 'bullet': case 'num': case 'head': case 'quote': linePrefix(t); break;
  }
}
$('#ed-tools').addEventListener('click', onTool);
$('#ed-fmt').addEventListener('click', onTool);
const hint = '<span class="small muted tc-hint">Sélection, ou ligne entière</span>';
$('#ed-tcolors').innerHTML = TCOLORS.map(([c, l]) => `<button type="button" class="tsw ${c ? 'tc-bg-' + c : 'none'}" data-tc="${c}" title="${l}" aria-label="${l}">${c ? 'A' : ''}</button>`).join('') + hint;
$('#ed-hls').innerHTML = HLS.map(([c, l]) => `<button type="button" class="tsw hlsw ${c ? 'hl-' + c : 'none'}" data-hl="${c}" title="${l}" aria-label="${l}">${c ? 'ab' : ''}</button>`).join('') + hint;
$('#ed-tcolors').addEventListener('click', e => { const b = e.target.closest('[data-tc]'); if (b) { applyStyle('fg', b.dataset.tc); closeEdPanels(); } });
$('#ed-hls').addEventListener('click', e => { const b = e.target.closest('[data-hl]'); if (b) { applyStyle('bg', b.dataset.hl); closeEdPanels(); } });
$('#ed-colors').addEventListener('click', e => { const b = e.target.closest('.sw'); if (b) touchNote(n => { n.color = b.dataset.c; }); });
$('#ed-pats').addEventListener('click', e => { const b = e.target.closest('.pt'); if (b) touchNote(n => { n.pattern = b.dataset.p; }); });

// Réglages
$('#s-theme').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSetting('theme', b.dataset.v); });
$('#s-skins').addEventListener('click', async e => {
  const b = e.target.closest('button');
  if (!b) return;
  setSetting('theme', b.dataset.v);
  // Couleur principale choisie qui ne va pas avec ce thème : petite bulle sous la vignette pour proposer la sienne.
  const sk = skinOf(b.dataset.v), mine = S.settings.accent;
  if (!sk || !mine || mine.toLowerCase() === sk[3].toLowerCase()) return;
  const tile = $(`#s-skins [data-v="${sk[0]}"]`) || b;
  const v = await popMenu(tile, [
    { value: 'theme', label: `Prendre celle de ${sk[1]}`, sw: sk[3] },
    { value: 'keep', label: 'Garder la mienne', sw: mine },
  ], 'Ta couleur principale ne correspond pas à ce thème');
  if (v === 'theme') setSetting('accent', sk[3]);
});
$('#s-start').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSetting('start', b.dataset.v); });
$('#s-avatar').addEventListener('click', pickAvatar);
$('#s-streaks').addEventListener('change', e => setSetting('streaks', e.target.checked));
$('#s-linkprev').addEventListener('change', e => { setSetting('linkPreview', e.target.checked); if (curNote) renderEdLinks(); });
$('#s-imgcheck').addEventListener('click', () => { toast('Vérification…'); checkRestore(true); });
$('#s-rename').addEventListener('click', renameUser);
$('#me-btn').addEventListener('click', () => setView('settings'));
$('#s-notesize').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSetting('noteSize', b.dataset.v); });
$('#s-imgpurge').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSetting('imgPurge', b.dataset.v); });
$('#s-accent').addEventListener('click', e => { const b = e.target.closest('[data-accent]'); if (b) setSetting('accent', b.dataset.accent); });
$('#s-notif').addEventListener('click', askNotif);
$('#s-install').addEventListener('click', installApp);
$('#install-btn').addEventListener('click', installApp);
$('#s-push-test').addEventListener('click', async () => {
  try { await api('pushtest'); toast('Test envoyé : la notification doit arriver dans quelques secondes'); }
  catch (err) { toast(err.message); }
});
$('#s-ntfy-gen').addEventListener('click', () => {
  $('#s-ntfy').value = 'rappels-' + user.replace(/[^a-z0-9]/g, '') + '-' + Math.random().toString(36).slice(2, 10);
});
$('#s-ntfy-save').addEventListener('click', () => {
  const v = $('#s-ntfy').value.trim();
  if (v && !/^[A-Za-z0-9_-]{1,64}$/.test(v)) { toast('Sujet invalide : lettres, chiffres, - et _ uniquement'); return; }
  setSetting('ntfy', v);
  toast(v ? 'Sujet ntfy enregistré' : 'ntfy désactivé');
});
$('#s-ntfy-test').addEventListener('click', async () => {
  try { await api('ntfytest', { topic: $('#s-ntfy').value.trim() }); toast('Test envoyé, vérifie ton appli ntfy'); }
  catch (err) { toast(err.message); }
});
$('#s-syncnow').addEventListener('click', () => sync());
$('#s-others').addEventListener('click', async () => {
  if (!await confirmDlg('Déconnecter les autres appareils ?', 'Seul cet appareil restera connecté.', 'Déconnecter', true)) return;
  try { await api('logoutothers'); account.devices = 1; setAccount({ lastSeen: account.lastSeen / 1000, devices: 1 }); render(); toast('Autres appareils déconnectés'); }
  catch (err) { toast(err.message); }
});
$('#s-export').addEventListener('click', exportData);
$('#s-import').addEventListener('click', () => $('#s-import-file').click());
$('#s-import-file').addEventListener('change', e => { const f = e.target.files[0]; if (f) importData(f); e.target.value = ''; });
$('#s-pw').addEventListener('click', async () => {
  const r = await dialog({
    title: 'Changer le mot de passe',
    html: `<div class="stack" style="margin:0">
      <input id="pw-old" type="password" placeholder="Mot de passe actuel" autocomplete="current-password">
      <input id="pw-new" type="password" placeholder="Nouveau mot de passe (6 caractères min.)" autocomplete="new-password"></div>`,
    buttons: [{ label: 'Annuler' }, { label: 'Changer', primary: true, value: 1 }],
    onClick: (e, pick) => {
      if (!e.target.closest('[data-b="1"]')) return false;
      pick({ value: 1, old: $('#pw-old').value, nw: $('#pw-new').value });
      return true;
    },
  });
  if (!r) return;
  try {
    await api('password', { old: r.old, new: r.nw });
    setAccount({ lastSeen: account.lastSeen / 1000, devices: 1 });
    toast('Mot de passe changé (autres appareils déconnectés)');
  } catch (err) { toast(err.status ? err.message : 'Impossible hors ligne'); }
});
async function leaveAccount(serverCall) {
  const name = user;
  if (isLocal()) { flushSave(); showAuth(); return; } // les données restent sur l'appareil
  await disablePush();
  stopWait();
  try { await serverCall(); } catch {}
  lsDel('rp_state:' + name);
  lsDel('rp_account:' + name);
  lsDel('rp_base:' + name);
  showAuth();
}
$('#logout').addEventListener('click', async () => {
  if (isLocal()) {
    if (await confirmDlg('Quitter le mode local ?', 'Tes données restent sur cet appareil : tu les retrouves en rouvrant en local.', 'Quitter')) leaveAccount();
    return;
  }
  if (!await confirmDlg('Se déconnecter ?', 'Tes données restent sur le serveur.', 'Se déconnecter', true)) return;
  leaveAccount(() => api('logout'));
});
// Suppression définitive : mot de passe demandé, puis tout est effacé du serveur (notes, tâches, images).
$('#s-delete').addEventListener('click', async () => {
  if (isLocal()) { wipeLocal(); return; }
  const r = await dialog({
    title: 'Supprimer mon compte ?',
    text: `Le compte « ${user} » et toutes ses données (notes, tâches, rappels, images) seront effacés définitivement, sur tous les appareils. Pense à exporter tes données avant.`,
    input: '', inputType: 'password', placeholder: 'Mot de passe pour confirmer',
    buttons: [{ label: 'Annuler' }, { label: 'Supprimer définitivement', danger: true, primary: true, value: 1 }],
  });
  if (!r || !r.text) return;
  try {
    await api('deleteaccount', { pass: r.text });
  } catch (err) { toast(err.status ? err.message : 'Impossible hors ligne, réessaie une fois connecté'); return; }
  await leaveAccount(async () => {});
  toast('Compte supprimé');
});

// Inscription libre (réglée par l'administrateur) : le code devient facultatif.
let signupOpen = false;
async function loadSignup() {
  try { signupOpen = !!(await api('signup')).open; } catch { return; }
  $('#a-code-lbl').textContent = signupOpen ? "Code d'invitation (facultatif)" : "Code d'invitation";
  $('#a-code').placeholder = signupOpen ? 'Laisse vide si tu n\'en as pas' : 'XXXX-XXXX';
  $('#a-askcode').classList.toggle('hidden', signupOpen || authMode !== 'register');
}

// ================= Contact (même format que le formulaire de BD → tableau de bord /contact) =================
const CONTACT_TYPES = [['code', 'Demande de code pour créer un compte'], ['bug', 'Bug / erreur'], ['idee', 'Idée / amélioration'], ['remarque', 'Remarque'], ['autre', 'Autre']];
const CONTACT_PH = {
  code: "Présente-toi en quelques mots : qui es-tu, comment as-tu connu Carnet ? Tu recevras un code pour créer ton compte.",
  bug: "Décris le problème : ce que tu faisais, ce qui s'est passé…",
  idee: "Décris ton idée…", remarque: 'Ton message…', autre: 'Ton message…',
};
async function contactForm(type = 'bug') {
  const html = `<div class="ct-form">
    <label class="field">Objet<select id="ct-type">${CONTACT_TYPES.map(([v, l]) => `<option value="${v}" ${v === type ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="field">Message<textarea id="ct-msg" rows="5"></textarea></label>
    <label class="field"><span id="ct-contact-lbl"></span><input id="ct-contact" autocomplete="email" placeholder="Nom, e-mail…"></label>
    <p class="err" id="ct-err"></p>
  </div>`;
  const paint = () => {
    const t = $('#ct-type').value;
    $('#ct-msg').placeholder = CONTACT_PH[t];
    $('#ct-contact-lbl').textContent = t === 'code' ? 'E-mail ou contact pour recevoir le code' : 'Contact (facultatif)';
  };
  let sending = false;
  const p = dialog({
    title: type === 'code' ? (isLocal() ? 'Demander un accès au serveur' : 'Demander un code') : 'Nous contacter', html,
    buttons: [{ label: 'Annuler' }, { label: 'Envoyer', primary: true, value: 1 }],
    onClick: (e, pick) => {
      if (!e.target.closest('[data-b="1"]')) return false;
      if (sending) return true;
      const t = $('#ct-type').value, msg = $('#ct-msg').value.trim(), contact = $('#ct-contact').value.trim();
      const err = $('#ct-err');
      if (t === 'code' && !contact) { err.textContent = 'Indique un moyen de te répondre pour recevoir le code.'; $('#ct-contact').focus(); return true; }
      if (!msg && t !== 'code') { err.textContent = 'Écris un message.'; $('#ct-msg').focus(); return true; }
      sending = true;
      const btn = e.target.closest('[data-b="1"]');
      btn.disabled = true; btn.textContent = 'Envoi…'; err.textContent = '';
      sendContact({ type: t, message: msg || 'Demande de code pour créer un compte Carnet.', contact })
        .then(() => { pick({ value: 1 }); toast(t === 'code' ? 'Demande envoyée : tu recevras ton code par le contact indiqué' : 'Message envoyé, merci !'); })
        .catch(() => { err.textContent = "Envoi impossible pour le moment. Vérifie ta connexion et réessaie."; btn.disabled = false; btn.textContent = 'Envoyer'; sending = false; });
      return true;
    },
  });
  $('#ct-type').addEventListener('change', paint);
  $('.ct-form').addEventListener('input', () => { $('#ct-err').textContent = ''; });
  paint();
  setTimeout(() => (type === 'code' ? $('#ct-contact') : $('#ct-msg'))?.focus(), 80);
  return p;
}
async function sendContact({ type, message, contact }) {
  const r = await fetch('/contact_save.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appTitle: 'Carnet', type, message, contact,
      deviceId: lsGet('app_device_id') || 'Inconnu', timestamp: Date.now(), userAgent: navigator.userAgent,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.success) throw new Error(j.message || 'envoi');
}
$('#a-askcode').addEventListener('click', () => contactForm('code'));
$('#s-contact').addEventListener('click', () => contactForm('bug'));
$('#s-bug').addEventListener('click', () => contactForm('bug'));
$('#access-btn').addEventListener('click', () => contactForm('code'));

// ================= Administration : codes d'invitation et comptes =================
let adminData = null, adminLoading = false;
const fmtCode = c => c.length === 8 ? c.slice(0, 4) + '-' + c.slice(4) : c;
const fmtSecDay = sec => sec ? new Date(sec * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
async function loadAdmin() {
  if (adminLoading || !srvStatus?.admin || isLocal()) return;
  adminLoading = true;
  try { adminData = await api('admincodes'); renderAdmin(); }
  catch (e) { $('#s-codes').innerHTML = `<p class="small muted">${esc(e.status ? e.message : 'Hors ligne : statistiques indisponibles')}</p>`; }
  adminLoading = false;
}
function renderAdmin() {
  const d = adminData;
  if (!d) return;
  const st = d.stats, acc = Object.fromEntries(d.accounts.map(a => [a.user, a]));
  const tile = (n, l) => `<div class="adm-tile"><b>${n}</b><span>${l}</span></div>`;
  $('#s-adm-stats').innerHTML = tile(st.accounts, plural(st.accounts, 'compte').replace(/^\d+ /, ''))
    + tile(st.active1, 'actifs 24 h') + tile(st.active7, 'actifs 7 j') + tile(st.active30, 'actifs 30 j')
    + tile(st.codes, plural(st.codes, 'code').replace(/^\d+ /, '')) + tile(st.uses, plural(st.uses, 'inscription').replace(/^\d+ /, ''));
  $('#s-codes').innerHTML = d.codes.length ? d.codes.map(c => {
    const used = c.uses.length, single = c.type === 'single';
    const state = c.disabled ? ['off', 'Désactivé'] : single && used ? ['used', 'Utilisé'] : ['ok', 'Disponible'];
    const uses = c.uses.slice().reverse().map(u => {
      const a = acc[u.user];
      return `<li><span class="adm-av">${esc(u.user[0])}</span><span class="grow"><b>${esc(u.user)}</b>
        <small>Inscrit le ${fmtSecDay(u.at)} · ${a ? 'vu ' + fmtAgo(a.lastSeen * 1000) : 'compte supprimé'}</small></span></li>`;
    }).join('');
    return `<div class="adm-code ${c.disabled ? 'disabled' : ''}" data-code="${esc(c.code)}">
      <div class="adm-code-top">
        <button type="button" class="adm-code-val" data-cact="copy" title="Copier le code">${esc(fmtCode(c.code))}${icon('copy')}</button>
        <span class="adm-badge ${state[0]}">${state[1]}</span>
        <span class="grow"></span>
        <button type="button" class="icon-btn" data-cact="more" title="Options" aria-label="Options" data-code="${esc(c.code)}">${icon('more')}</button>
      </div>
      <div class="adm-meta">${single ? 'Usage unique' : 'Ouvert à tous'}${c.label ? ' · ' + esc(c.label) : ''} · créé le ${fmtSecDay(c.created)}</div>
      <div class="adm-uses"><b>${plural(used, 'utilisation')}</b>${used ? `<ul>${uses}</ul>` : ''}</div>
    </div>`;
  }).join('') : '<p class="small muted">Aucun code pour le moment.</p>';
  $('#s-accounts').innerHTML = d.accounts.map(a => `<div class="adm-acc">
      <span class="adm-av">${esc(a.user[0])}</span>
      <span class="grow"><b>${esc(a.user)}</b>${a.admin ? '<span class="admin-badge">Admin</span>' : ''}
        <small>Vu ${fmtAgo(a.lastSeen * 1000)} · ${plural(a.devices, 'appareil')}</small>
        <small>Inscrit le ${fmtSecDay(a.created)} · ${a.code === 'admin' ? 'code administrateur' : a.code === 'libre' ? 'inscription libre' : a.code ? 'code ' + esc(fmtCode(a.code)) : 'avant les codes'}</small></span>
    </div>`).join('');
  $('#sg-admin').textContent = plural(st.accounts, 'compte');
  $('#s-opensignup').checked = !!d.openSignup;
}
async function newCode() {
  let type = 'single';
  const html = `<div class="seg" id="nc-type"><button type="button" data-v="single" class="on">Usage unique</button><button type="button" data-v="open">Ouvert à tous</button></div>
    <p class="small muted" id="nc-help"></p>
    <input id="nc-label" placeholder="Note (facultatif) : pour qui, pourquoi…" maxlength="80">`;
  const help = () => { $('#nc-help').textContent = type === 'single' ? 'Une seule personne peut créer un compte avec ce code.' : "Autant de comptes que tu veux, jusqu'à ce que tu le désactives."; };
  const p = dialog({
    title: "Nouveau code d'invitation", html, buttons: [{ label: 'Annuler' }, { label: 'Créer', primary: true, value: 1 }],
    onClick: e => {
      const b = e.target.closest('#nc-type button');
      if (!b) return false;
      type = b.dataset.v;
      $$('#nc-type button').forEach(x => x.classList.toggle('on', x === b));
      help();
      return true;
    },
  });
  help();
  const r = await p;
  if (!r) return;
  try {
    const { code } = await api('codecreate', { type, label: $('#nc-label')?.value || '' }); // le contenu du dialogue reste en place après sa fermeture
    await loadAdmin();
    copyCode(code);
  } catch (e) { toast(e.status ? e.message : 'Impossible hors ligne'); }
}
function copyCode(code) {
  const t = fmtCode(code);
  navigator.clipboard?.writeText(t).then(() => toast(`Code ${t} copié`), () => toast(`Code : ${t}`));
}
async function codeMenu(code, anchor) {
  const c = adminData?.codes.find(x => x.code === code);
  if (!c) return;
  const v = await popMenu(anchor, [
    { value: 'copy', label: 'Copier le code', icon: 'copy' },
    { value: 'label', label: 'Modifier la note', icon: 'rename' },
    { value: 'toggle', label: c.disabled ? 'Réactiver' : 'Désactiver', icon: c.disabled ? 'restore' : 'close' },
    { value: 'delete', label: 'Supprimer', icon: 'trash' },
  ]);
  try {
    if (v === 'copy') copyCode(code);
    else if (v === 'label') {
      const l = await ask('Note du code', c.label, 'Enregistrer', 'Pour qui, pourquoi…');
      if (l == null) return;
      await api('codeupdate', { code, label: l });
    } else if (v === 'toggle') await api('codeupdate', { code, disabled: !c.disabled });
    else if (v === 'delete') {
      const txt = c.uses.length ? "Les comptes déjà créés avec ce code sont gardés, mais son historique d'utilisation sera perdu." : 'Il ne pourra plus servir.';
      if (!await confirmDlg(`Supprimer le code ${fmtCode(code)} ?`, txt, 'Supprimer', true)) return;
      await api('codedelete', { code });
    } else return;
    loadAdmin();
  } catch (e) { toast(e.status ? e.message : 'Impossible hors ligne'); }
}
$('#s-code-new').addEventListener('click', newCode);
$('#s-opensignup').addEventListener('change', async e => {
  const on = e.target.checked;
  if (on && !await confirmDlg('Inscription libre ?', "N'importe qui pourra créer un compte sans code. Tu peux la couper à tout moment.", 'Activer')) { e.target.checked = false; return; }
  try { await api('adminsettings', { openSignup: on }); toast(on ? 'Inscription libre activée : plus besoin de code' : 'Code de nouveau obligatoire pour créer un compte'); loadAdmin(); }
  catch (err) { e.target.checked = !on; toast(err.status ? err.message : 'Impossible hors ligne'); }
});
$('#s-adm-refresh').addEventListener('click', loadAdmin);
$('#s-codes').addEventListener('click', e => {
  const b = e.target.closest('[data-cact]');
  if (!b) return;
  const code = b.closest('[data-code]').dataset.code;
  if (b.dataset.cact === 'copy') copyCode(code); else codeMenu(code, b);
});
$('#s-admin').addEventListener('toggle', () => { if ($('#s-admin').open) loadAdmin(); });

// Mode local : tout effacer de cet appareil (état, images), puis retour à l'écran de connexion.
async function wipeLocal() {
  if (!await confirmDlg('Effacer les données locales ?', 'Toutes les notes, tâches, rappels et images de cet appareil seront effacés définitivement. Pense à exporter avant.', 'Tout effacer', true)) return;
  try {
    for (const id of await idb.keys('pending')) {
      const p = await idb.get('pending', id);
      if (p?.user === LOCAL) { await idb.del('pending', id); await idb.del('thumbs', id).catch(() => {}); }
    }
  } catch {}
  for (const k of ['rp_state:', 'rp_base:', 'rp_account:']) lsDel(k + LOCAL);
  showAuth();
  toast('Données locales effacées');
}

// Mode local depuis l'écran de connexion.
$('#a-local').addEventListener('click', () => {
  startApp(LOCAL);
  sync();
  handleLaunch();
  maybeOfferInstall();
  if (!lsGet('rp_local_seen')) {
    lsSet('rp_local_seen', '1');
    toast('Mode local : tout reste sur cet appareil, rien ne passe par le serveur');
  }
});

// Onde au toucher sur les boutons.
// Ajoutée au « click » et non au toucher : sur iPhone, un élément qui apparaît pendant le toucher
// fait croire à un menu au survol, et le premier appui ne déclenche alors pas le bouton.
const RIPPLE_SEL = '.btn, .icon-btn, .chip-btn, .nav-item, .tabs button, .fab, .dlg-items button, .theme-tile, .vseg button, .quick-dates button, .seg button';
document.addEventListener('click', e => {
  const el = e.target.closest?.(RIPPLE_SEL);
  if (!el || el.disabled || !el.isConnected) return;
  const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
  const x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2; // clavier : centre
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${x - r.left - d / 2}px;top:${y - r.top - d / 2}px`;
  el.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
});
enableSwipe($('#task-list'));
enableSwipe($('#agenda'));

// Raccourcis clavier (PC)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlays.length) { e.preventDefault(); closeOverlay(); return; }
  if (overlays.length || !user || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); if (view === 'settings') setView('tasks'); $('#fab').click(); }
  else if (e.key === '/') {
    e.preventDefault();
    if (view === 'notes') $('#nsearch').focus();
    else { setView('tasks'); $('#quick-in').focus(); }
  }
  else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) setView(VIEW_KEYS[+e.key - 1]);
});

// Clavier virtuel : l'éditeur prend la hauteur visible, et suit la partie visible
// quand le téléphone décale la page pour montrer le curseur.
if (window.visualViewport) {
  const f = () => {
    const st = document.documentElement.style;
    st.setProperty('--vvh', visualViewport.height + 'px');
    st.setProperty('--vvt', Math.max(0, visualViewport.offsetTop) + 'px');
  };
  visualViewport.addEventListener('resize', f);
  visualViewport.addEventListener('scroll', f);
  f();
}
// Éditeur et dessin en plein écran : seul le contenu défile, jamais la fenêtre entière
// (sinon, sur téléphone, on faisait glisser toute la note et on voyait l'appli en dessous).
for (const sel of ['#editor', '#draw']) {
  $(sel).addEventListener('touchmove', e => {
    if (e.touches.length > 1) return; // zoom à deux doigts
    const sc = e.target.closest('.ed-main, .ed-tools, .ed-pop, .draw-row');
    const canScroll = sc && (sc.scrollHeight > sc.clientHeight + 1 || sc.scrollWidth > sc.clientWidth + 1);
    if (!canScroll && e.cancelable) e.preventDefault();
  }, { passive: false });
}

// Synchro auto : au retour sur l'appli, en ligne, et toutes les 15 s.
// Appli mise en arrière-plan (Android la fige vite) : tout est enregistré et envoyé tout de suite.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    flushSave();
    if (user && dirtyCount()) { clearTimeout(pushTimer); sync(); }
    stopWait();
    return;
  }
  if (user) { rollover(); sync(); render(); waitLoop(); }
});
window.addEventListener('online', () => { sync(); waitLoop(); });
window.addEventListener('pagehide', flushSave);
setInterval(() => { if (!document.hidden) { sync(); waitLoop(); } }, 60000); // filet de sécurité
setInterval(checkReminders, 20000);
// Rafraîchit "Aujourd'hui / En retard" et les "il y a…".
setInterval(() => { rollover(); if (!document.hidden && !overlays.length) render(); }, 60000);

// ================= Statistiques de visite =================
// Une visite par ouverture, seulement sur le site en ligne (jamais en local sur un poste de dev).
// Jamais en mode local : on a promis que rien ne passe par le serveur.
const TRACK_ALLOWED_HOSTS = ['polocrafting.fr', 'www.polocrafting.fr'];
function trackVisit(pageName = 'Carnet') {
  if (!TRACK_ALLOWED_HOSTS.includes(location.hostname.toLowerCase()) || isLocal() || lsGet('rp_last_user') === LOCAL) return;
  // Identifiant d'appareil anonyme, partagé avec les autres applis du site (même clé que MasterPaint).
  let deviceId = lsGet('app_device_id');
  if (!deviceId) {
    deviceId = 'dev-' + Math.random().toString(36).slice(2, 11) + '-' + Date.now();
    lsSet('app_device_id', deviceId);
  }
  // text/plain : requête CORS « simple », sans préflight ; le corps reste du JSON lu par track.php.
  fetch('https://polocrafting.fr/track.php', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ deviceId, page: pageName }),
  }).catch(() => {});
}

// ================= Démarrage =================
$$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });

(async function boot() {
  if ('serviceWorker' in navigator) {
    // Nouvelle version : le service worker se met à jour tout seul, on propose de recharger.
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (had) toast("Nouvelle version de l'appli installée", 'Recharger', () => location.reload());
    });
    navigator.serviceWorker.register('sw.js').then(reg => {
      const check = () => reg.update().catch(() => {});
      setInterval(check, 30 * 60e3);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    }).catch(() => {});
  }
  const last = lsGet('rp_last_user');
  if (last === LOCAL) { startApp(LOCAL); sync(); handleLaunch(); maybeOfferInstall(); return; } // aucun appel au serveur
  trackVisit('Carnet');
  if (last) { startApp(last); handleLaunch(); } // affichage immédiat depuis le cache local, même hors ligne
  try {
    const r = await api('me');
    if (r.user !== user) startApp(r.user);
    setAccount(r);
    await sync();
    waitLoop();
    handleLaunch();
    maybeOfferInstall();
    refreshStatus();
    setTimeout(() => checkRestore(false), 3000); // à chaque ouverture : données perdues sur le serveur ?
    if ('Notification' in window && Notification.permission === 'granted') enablePush().then(() => renderSettings && render()).catch(() => {});
  } catch (e) {
    if (!last && e.status !== 401) showAuth();
    else if (e.status !== 401) { online = false; setDot('off'); renderSide(); }
  }
})();
