// Catalogue des sujets. `q` = requête CirrusSearch (moteur de Wikipédia).
// `articletopic:` utilise la classification thématique automatique de Wikimedia (toutes langues).
// `hue` sert à colorer la pastille du sujet.
const TOPICS = [
  { id: 'espace',       label: 'Espace & astronomie',     hue: 250, q: 'articletopic:space' },
  { id: 'physique',     label: 'Physique',                hue: 210, q: 'articletopic:physics' },
  { id: 'chimie',       label: 'Chimie',                  hue: 160, q: 'articletopic:chemistry' },
  { id: 'animaux',      label: 'Animaux',                 hue: 35,  q: 'articletopic:biology animal', en: 'articletopic:biology animal' },
  { id: 'plantes',      label: 'Plantes & nature',        hue: 110, q: 'articletopic:biology plante', en: 'articletopic:biology plant' },
  { id: 'sante',        label: 'Corps humain & santé',    hue: 0,   q: 'articletopic:medicine-and-health' },
  { id: 'psycho',       label: 'Psychologie & cerveau',   hue: 300, q: 'psychologie OR cerveau OR cognitif', en: 'psychology OR brain OR cognitive' },
  { id: 'maths',        label: 'Mathématiques',           hue: 190, q: 'articletopic:mathematics' },
  { id: 'info',         label: 'Informatique',            hue: 200, q: 'articletopic:computing' },
  { id: 'ia',           label: 'Intelligence artificielle', hue: 270, q: '"intelligence artificielle" OR "apprentissage automatique"', en: '"artificial intelligence" OR "machine learning"' },
  { id: 'tech',         label: 'Technologie & inventions', hue: 220, q: 'articletopic:technology' },
  { id: 'ingenierie',   label: 'Ingénierie',              hue: 25,  q: 'articletopic:engineering' },
  { id: 'terre',        label: 'Terre & climat',          hue: 140, q: 'articletopic:earth-and-environment' },
  { id: 'ocean',        label: 'Océans',                  hue: 195, q: 'océan OR "vie marine" OR abysses', en: 'ocean OR "marine life" OR deep sea' },
  { id: 'volcans',      label: 'Volcans & séismes',       hue: 10,  q: 'volcan OR séisme OR tsunami', en: 'volcano OR earthquake OR tsunami' },
  { id: 'histoire',     label: 'Histoire',                hue: 30,  q: 'articletopic:history' },
  { id: 'antiquite',    label: 'Antiquité',               hue: 45,  q: 'articletopic:history antiquité', en: 'articletopic:history ancient' },
  { id: 'moyenage',     label: 'Moyen Âge',               hue: 20,  q: 'articletopic:history "Moyen Âge"', en: 'articletopic:history "Middle Ages"' },
  { id: 'guerres',      label: 'Guerres & batailles',     hue: 5,   q: 'articletopic:military-and-warfare' },
  { id: 'ww2',          label: 'Seconde Guerre mondiale', hue: 15,  q: '"Seconde Guerre mondiale" articletopic:military-and-warfare', en: '"World War II" articletopic:military-and-warfare' },
  { id: 'archeo',       label: 'Archéologie',             hue: 40,  q: 'archéologie OR "site archéologique"', en: 'archaeology OR "archaeological site"' },
  { id: 'mytho',        label: 'Mythologie',              hue: 280, q: 'articletopic:philosophy-and-religion mythologie', en: 'articletopic:philosophy-and-religion mythology' },
  { id: 'philo',        label: 'Philosophie',             hue: 260, q: 'articletopic:philosophy-and-religion philosophie', en: 'articletopic:philosophy-and-religion philosophy' },
  { id: 'religions',    label: 'Religions',               hue: 50,  q: 'articletopic:philosophy-and-religion religion' },
  { id: 'eco',          label: 'Économie & entreprises',  hue: 130, q: 'articletopic:business-and-economics' },
  { id: 'politique',    label: 'Politique',               hue: 230, q: 'articletopic:politics-and-government' },
  { id: 'societe',      label: 'Société',                 hue: 320, q: 'articletopic:society' },
  { id: 'geo',          label: 'Pays & géographie',       hue: 150, q: 'articletopic:geographical pays', en: 'articletopic:geographical country' },
  { id: 'villes',       label: 'Villes du monde',         hue: 180, q: 'articletopic:geographical ville', en: 'articletopic:geographical city' },
  { id: 'archi',        label: 'Architecture',            hue: 35,  q: 'articletopic:architecture' },
  { id: 'peinture',     label: 'Peinture & arts',         hue: 330, q: 'articletopic:visual-arts peinture', en: 'articletopic:visual-arts painting' },
  { id: 'musique',      label: 'Musique',                 hue: 290, q: 'articletopic:music' },
  { id: 'cinema',       label: 'Cinéma',                  hue: 350, q: 'articletopic:films' },
  { id: 'series',       label: 'Séries & télévision',     hue: 340, q: 'articletopic:television' },
  { id: 'litterature',  label: 'Littérature',             hue: 25,  q: 'articletopic:literature' },
  { id: 'bd',           label: 'BD & manga',              hue: 55,  q: 'articletopic:comics-and-anime' },
  { id: 'langues',      label: 'Langues',                 hue: 170, q: 'articletopic:linguistics' },
  { id: 'figures',      label: 'Grandes figures',         hue: 40,  q: 'articletopic:biography' },
  { id: 'femmes',       label: "Femmes de l'histoire",    hue: 310, q: 'articletopic:women' },
  { id: 'sport',        label: 'Sport',                   hue: 100, q: 'articletopic:sports' },
  { id: 'jv',           label: 'Jeux vidéo',              hue: 275, q: 'articletopic:video-games' },
  { id: 'gastronomie',  label: 'Gastronomie',             hue: 20,  q: 'articletopic:food-and-drink' },
  { id: 'transport',    label: 'Transports & aviation',   hue: 205, q: 'articletopic:transportation' },
  { id: 'mode',         label: 'Mode',                    hue: 325, q: 'articletopic:fashion' },
  { id: 'mysteres',     label: 'Mystères & énigmes',      hue: 265, q: 'énigme OR mystère OR inexpliqué OR disparition', en: 'mystery OR unexplained OR disappearance' },
  { id: 'crimes',       label: 'Affaires criminelles',    hue: 0,   q: '"affaire criminelle" OR "affaire judiciaire" OR braquage', en: '"criminal case" OR heist OR "murder case"' },
];

const TOPIC_BY_ID = Object.fromEntries(TOPICS.map(t => [t.id, t]));

// Grandes catégories proposées à l'accueil. L'algorithme découvre ensuite, à l'intérieur,
// les sous-sujets qui t'intéressent vraiment (leurs poids évoluent séparément).
const CATEGORIES = [
  { id: 'sciences',   label: 'Sciences & espace',      icon: 'atom',    hue: 230, topics: ['espace', 'physique', 'chimie', 'maths'] },
  { id: 'nature',     label: 'Nature & animaux',       icon: 'leaf',    hue: 120, topics: ['animaux', 'plantes', 'ocean', 'terre', 'volcans'] },
  { id: 'histoire',   label: 'Histoire',               icon: 'column',  hue: 30,  topics: ['histoire', 'antiquite', 'moyenage', 'guerres', 'ww2', 'archeo'] },
  { id: 'arts',       label: 'Arts & culture',         icon: 'palette', hue: 330, topics: ['peinture', 'archi', 'musique', 'litterature', 'mode'] },
  { id: 'ecrans',     label: 'Cinéma, séries & jeux',  icon: 'film',    hue: 350, topics: ['cinema', 'series', 'jv', 'bd'] },
  { id: 'tech',       label: 'Technologie',            icon: 'cpu',     hue: 200, topics: ['info', 'ia', 'tech', 'ingenierie', 'transport'] },
  { id: 'societe',    label: 'Société & monde',        icon: 'globe',   hue: 160, topics: ['politique', 'eco', 'societe', 'geo', 'villes', 'langues'] },
  { id: 'humain',     label: 'Corps & esprit',         icon: 'pulse',   hue: 0,   topics: ['sante', 'psycho'] },
  { id: 'idees',      label: 'Philo, mythes & religions', icon: 'feather', hue: 270, topics: ['philo', 'religions', 'mytho'] },
  { id: 'figures',    label: 'Grandes figures',        icon: 'user',    hue: 45,  topics: ['figures', 'femmes'] },
  { id: 'mysteres',   label: 'Mystères & faits divers', icon: 'key',    hue: 285, topics: ['mysteres', 'crimes'] },
  { id: 'sport',      label: 'Sport',                  icon: 'trophy',  hue: 100, topics: ['sport'] },
  { id: 'gastro',     label: 'Gastronomie',            icon: 'utensils', hue: 20, topics: ['gastronomie'] },
];
const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
for (const c of CATEGORIES) for (const t of c.topics) if (TOPIC_BY_ID[t]) TOPIC_BY_ID[t].cat = c.id;

// Régions pour l'actualité locale (flux France 3 Régions + presse régionale).
const REGIONS = [
  ['auvergne-rhone-alpes', 'Auvergne-Rhône-Alpes'], ['bourgogne-franche-comte', 'Bourgogne-Franche-Comté'],
  ['bretagne', 'Bretagne'], ['centre-val-de-loire', 'Centre-Val de Loire'], ['corse', 'Corse'],
  ['grand-est', 'Grand Est'], ['hauts-de-france', 'Hauts-de-France'], ['paris-ile-de-france', 'Île-de-France'],
  ['normandie', 'Normandie'], ['nouvelle-aquitaine', 'Nouvelle-Aquitaine'], ['occitanie', 'Occitanie'],
  ['pays-de-la-loire', 'Pays de la Loire'], ['provence-alpes-cote-d-azur', "Provence-Alpes-Côte d'Azur"],
];
