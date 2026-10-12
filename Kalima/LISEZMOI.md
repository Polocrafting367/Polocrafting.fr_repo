# Kalima

Apprendre l'anglais et l'arabe (standard), plus 7 langues en bêta, un mot après l'autre. Exercices courts, phrases simples à ton niveau,
synchronisé sur tous tes appareils. PHP 7.4+ et aucune base de données. Kalima (كلمة) veut dire « mot » en arabe.

## Installation
1. Copier le dossier sur le serveur : `https://polocrafting.fr/Kalima/` (le K majuscule compte : c'est l'adresse de l'APK).
2. Le serveur doit pouvoir **écrire** dans ce dossier : `data/` (comptes, progression, sauvegardes, sons) est créé tout seul.
3. PHP avec `curl` (pour la prononciation de secours).
4. `api/config.php` : `INVITE_CODE` (crée un compte administrateur), `ADMIN_USERS`, `OPEN_SIGNUP_DEFAULT`.
5. Temps réel entre appareils : comme Carnet, chaque appareil ouvert garde une requête en attente (~25 s) sur
   `api/api.php?a=wait`. Prévoir au moins 2 processus PHP par appareil ouvert.

Les comptes **Curio** existants se connectent avec le même pseudo et le même mot de passe : le compte Kalima est
créé à la première connexion, et les mots d'anglais (et d'arabe) déjà connus dans Curio sont repris, avec le niveau.
(Kalima lit pour cela `../Curio/data/` sur le même serveur, en lecture seule.)

## Structure
| Fichier | Rôle |
|---|---|
| `index.html`, `css/app.css` | Interface (mobile d'abord, thème clair et sombre) |
| `js/util.js` | Outils : feuilles plein écran (bouton retour), messages, appels au serveur |
| `js/store.js` | État de l'utilisateur sur l'appareil + synchronisation élément par élément |
| `js/content.js` | Chargement des contenus, choix des pièges des QCM |
| `js/check.js` | Correction des réponses écrites (synonymes, fautes de frappe, contractions, « presque ») |
| `js/audio.js` | Prononciation : modes muet / discret / bavard, voix du téléphone ou du serveur, micro |
| `js/engine.js` | Révision espacée, niveau, test de niveau crescendo, composition des sessions |
| `js/session.js` | Déroulé d'une session : présentation des mots, exercices, correction, bilan |
| `js/views.js` | Écrans : accueil, mots, progrès, réglages, alphabet arabe, compte, administration |
| `js/app.js` | Démarrage, onglets, connexion, notifications et widget de l'app Android |
| `api/api.php` | Comptes, synchronisation, attente temps réel, sauvegardes, administration |
| `api/word.php` | Mot du jour (notification et widget de l'app Android), toutes langues |
| `tools/mine-examples.py`, `tools/import-beta.py` | Phrases Tatoeba pour l'anglais ; langues bêta |
| `api/tts.php` | Prononciation de secours quand le téléphone n'a pas de voix (souvent l'arabe), sons gardés dans `data/tts/` |
| `content/src/*.txt` | **Contenus écrits à la main** (voir ci-dessous) |
| `content/en.json`, `content/ar.json` | Contenus construits par `tools/build-content.py` |
| `kalima.apk` | App Android (construite avec WebApk) |

## Les contenus (le plus important)
Tout est écrit et relu à la main, rien n'est aspiré d'un dictionnaire automatique :
- `en-words-*.txt` : ~1 500 mots anglais, de A1 à C1 (y compris l'oral familier et quelques mots vulgaires, signalés). Pour chaque mot : la traduction **de l'usage
  le plus courant** en premier, puis les autres traductions acceptées, et une phrase d'exemple simple de son niveau.
- `en-sentences.txt` : ~235 phrases du quotidien, par niveau et par thème, avec plusieurs formulations acceptées
  (`[big|large]`, `[any|]` = mot facultatif, `||` = autre phrase entière) et une astuce de grammaire.
- `ar-words*.txt` : ~440 mots d'arabe standard, entièrement vocalisés, avec transcription lisible et exemple ;
  `ar-examples.txt` : ~110 phrases en plus pour les mots les plus courants.
- `en-examples.tsv` : **~5 200 phrases d'exemple en plus** pour ~1 330 mots anglais, tirées de Tatoeba (traductions faites par
  des humains) par `tools/mine-examples.py`, avec des filtres stricts : phrase courte, tous les autres mots déjà connus au
  niveau du mot, traduction qui contient bien le mot (bon sens : « thanks to » = « grâce à » est écarté), pas de passé
  simple ni de régionalismes. Les textes à trous tirent au hasard parmi toutes les phrases d'un mot.
- `ar-phrases.txt` : ~85 expressions de tous les jours, **telles qu'on les dit vraiment** (« au revoir » = مع السلامة
  maʿa s-salâma), avec une astuce d'usage.
- `ar-letters.json` : l'alphabet (lettres, formes, sons), en 14 étapes de 2 ou 3 lettres.
- `ar-path.txt`, `en-path.txt` : le parcours **« Premiers pas »** pour un vrai débutant (étapes de 1 à 3 mots ou
  expressions déjà présents dans les fichiers ci-dessus ; en arabe, les étapes d'alphabet `alpha|n` s'intercalent).
- `synonyms.txt` : ~1 000 groupes de mots **et de tournures** interchangeables, dans toutes les langues ([en], [fr], [ar] et
  chaque langue bêta), acceptés dans les réponses écrites avec la formulation la plus courante en rappel (« no idea » pour
  « I don't know », « est-ce que tu viens » pour « tu viens », « carro » pour « coche »). Les tournures de plusieurs mots
  sont reconnues même conjuguées (« searching for » = « looking for » ; « searched for » = presque). Ne mettre que de
  vrais équivalents : make/do, savoir/connaître, très/trop restent des erreurs. `build-content.py` les recopie aussi
  dans les fichiers des langues bêta.

**Langues bêta** (espagnol, allemand, italien, portugais, néerlandais, russe, turc) : `tools/import-beta.py` reprend les
anciens dictionnaires de Curio (`Archives/Curio-langues-2026-10-12/`) : 1 500 mots chacune, des milliers de phrases
Tatoeba (mêmes filtres) et 300 phrases à traduire. Affichées avec la mention « bêta » : il peut rester des erreurs.
Sources nécessaires : `~/.cache/curio-lexicon` (fréquences, exports Tatoeba).

Pour ajouter ou corriger : modifier le `.txt`, puis `python3 tools/build-content.py` (il vérifie les erreurs :
champs manquants, mot cible `*…*` absent de l'exemple, doublons), puis augmenter `VERSION` dans `js/content.js`
et `CONTENT` dans `sw.js`.

## Comment ça apprend
- **Révision espacée par paliers** : vu → 1 j → 3 j → 7 j → 16 j → 35 j → 80 j → 180 j. Juste = palier suivant,
  presque = même palier revu demain, faux = deux paliers en arrière. « Connu » à partir d'une semaine.
- **Sessions** (courte 8, normale 12, longue 20) : révisions dues, environ un tiers de **phrases** (formulation), et
  plusieurs nouveaux mots à la fois. **Un même mot ou une même phrase n'apparaît jamais plus de 3 fois** dans une session
  (présentation + 2 exercices) : s'il n'y a pas assez de matière, la session est simplement plus courte.
- **Premiers pas** (anglais et arabe, proposé sur l'accueil tant qu'on est en A1 et qu'il n'est pas fini) : la courbe
  mot par mot. Un mot présenté (avec son exemple), tout de suite une question à 2 choix, le mot suivant, un rappel du
  précédent, 2 ou 3 mots des étapes d'avant, puis « comment dit-on ? ». Les pièges sont pris parmi les mots déjà vus
  (« oui » contre « non »). 3 questions au plus par mot nouveau, même quand l'étape n'en a qu'un. Étape validée à 50 %.
  Tant que le parcours n'est pas fini (débutant), « Session du jour » mène à l'étape suivante : rien de nouveau hors parcours.
  Arabe, vrai débutant (moins de 4 étapes d'alphabet) : étapes d'UN mot au début, prononciation en lettres latines en
  grand (et dans les choix, avant l'écriture arabe), pas de phrase d'exemple en arabe, pas de texte à trous ni d'étiquettes.
- **QCM sans ambiguïté** : jamais deux choix justes. Les traductions sont comparées sans les précisions entre parenthèses
  (« bonjour » / « bonjour (réponse) »), avec les synonymes français (« bonjour » / « salut ») et quand l'une contient
  l'autre (« merci » / « merci beaucoup »).
- **Exercices** : surtout des **QCM** (choisir la traduction, dans les deux sens, à l'écrit et à l'écoute), texte à trous à
  choix ; l'écrit arrive quand le mot est bien installé. Les phrases se travaillent aussi en QCM (« que veut dire cette
  phrase ? », « quelle est la bonne phrase ? »), puis à écrire (anglais). Les **étiquettes** à remettre dans l'ordre ne
  servent plus qu'au **défi final** de la session : une seule phrase courte (3 à 6 mots en anglais, 2 à 4 en arabe).
- **Correction tolérante** : synonymes acceptés (avec la formulation la plus courante en rappel), contractions
  (I'm / I am), orthographe britannique ou américaine, fautes de frappe, accents. Bon mot mal conjugué ou petit mot
  oublié = « presque » (compte à moitié). Un mot de sens différent reste faux.
- **Verbes irréguliers** : seulement les 30 plus courants, de temps en temps, et seulement pour des verbes déjà appris.
- **Contrôles des niveaux inférieurs** (toutes les langues, dès A2) : même avec un niveau élevé, 0 à 2 fois par session
  et au hasard, un mot jamais vu d'un niveau plus facile est vérifié par une seule question (« Petit contrôle · A2 »).
  Réussi = connu ; raté = à apprendre, et la session ajoute un autre mot de ce niveau et un du niveau au-dessus pour voir
  si c'est un cas à part. Au moins 2 ratés sur les derniers contrôles d'un niveau (40 % ou plus) = vraie lacune : les
  sessions suivantes contrôlent davantage ce niveau et celui au-dessus et y prennent un quart des nouveaux mots, jusqu'à
  ce que les contrôles repassent au vert. Le niveau général ne baisse pas pour autant.
- **Niveau** : test « crescendo » (on monte tant que ça va ; à la première erreur, une question un cran plus bas, puis un
  autre mot du niveau raté : réussi = c'était juste ce mot, on remonte ; raté = plafond trouvé). Pendant les sessions,
  même principe : une erreur fait proposer un élément plus facile puis un autre du même niveau ; deux erreurs
  différentes au même niveau font baisser le niveau un peu ; les réussites le font monter.
- **Arabe** : vocabulaire disponible dès le début (transcription affichée tant que le mot n'est pas connu), alphabet en
  parallèle ; expressions orales présentées d'abord à l'écoute.
- **Prononciation** : *Muet* (rien de lu tout seul), *Discret* (nouveaux mots, écoute, bonne réponse), *Bavard* (tout ce
  qui s'affiche dans la langue est lu, à chaque fois). Réglable directement **pendant la leçon** (bouton haut-parleur en
  haut, comme les annonces d'un GPS) ou dans les Réglages. Vitesse réglable, bouton « tortue » pour réécouter lentement.
- **Signaler une erreur** : sous chaque correction, un lien ouvre le formulaire de contact déjà rempli (mot, phrase,
  type d'exercice). Réglages › Aide et contact : même formulaire que Carnet, les messages arrivent dans `/contact`
  (`/contact_save.php`, dossier `contact/Kalima/`).
- **Apparence** : thème clair par défaut ; sombre ou « comme le téléphone » dans les Réglages.
- **Accueil** en étapes avant connexion : bienvenue (boutons « Connexion » et « Continuer »), langues à apprendre,
  niveau de départ par langue, fonctionnement, rythme (durée des sessions, prononciation), puis création du compte
  (ou essai sans compte). Les choix sont appliqués au nouveau profil.
- **Grand écran** : accueil sur deux colonnes à partir de 1100 px.
- Vitrine du site : `showcase/Kalima_0/` (même page en 1920, 1440, 1024, 768 et téléphone) ; `Illu.png` pour la galerie.

## Comptes, synchronisation, administration
- Données de chaque compte : `data/users/<pseudo>.json.php`. Chaque mot, réglage, langue et exercice en cours porte sa
  date de modification : seuls les éléments modifiés partent, le serveur garde le plus récent de chacun. Les points sont
  comptés par appareil et additionnés. Hors ligne : tout reste sur l'appareil et part au retour du réseau.
- Sauvegardes : une copie toutes les 3 h (30 gardées) et toujours avant une perte, dans `data/backups/<pseudo>/`.
  Réglages › Compte › Sauvegardes pour en restaurer une (fusionnée avec l'état actuel).
- Mode local (« Continuer sans compte ») : tout reste sur l'appareil ; repris par le compte à la première connexion.
- **Administration** (Réglages, pour les administrateurs) : inscription libre ou sur invitation, codes d'invitation
  (usage unique ou ouverts), liste des comptes (dernière visite, appareils, progression), mot de passe provisoire,
  déconnexion, blocage, rôle administrateur, suppression.

## L'APK
```
cd ../WebApk
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ANDROID_HOME=~/Android/Sdk bash build.sh apps/kalima/kalima.properties
```
Version 1.0.0 (code 1) : notification « mot du jour », widget « Kalima · Mot du jour » redimensionnable de 1×1 au plein écran
(titre seul, bandeau 2×1, colonne 1×2, carte, grande carte).
Version 1.1.0 (code 2) : icône « carte de vocabulaire » avec ك. Mot du jour réglable simplement dans Réglages :
activé ou non, 1 à 3 par jour avec leurs heures, langue, bouton « Recevoir un mot maintenant » ; l'autorisation Android
est demandée au premier lancement.
Version 1.2.0 (code 3) : icône de notification refaite (carte pleine avec le ك découpé, lisible en tout petit).
La clé de signature `apps/kalima/kalima.jks` et son mot de passe (dans `kalima.properties`) sont **à sauvegarder**.
Pour une nouvelle version : augmenter `app.versionCode` (et `app.version`).

## Statistiques de visite
Comme Carnet et Curio : un appel à `https://polocrafting.fr/track.php` à chaque ouverture (« Kalima », ou « Kalima (app) »).
