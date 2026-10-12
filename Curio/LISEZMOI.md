# Curio

Fil infini pour apprendre : des sujets réels, résumés en quelques phrases, illustrés et choisis par un algorithme
qui apprend de toi. 100 % gratuit, sans pub. PHP 7.4+ et aucune base de données.

**Les langues ont maintenant leur propre app : [Kalima](../Kalima/)** (anglais et arabe, contenus relus à la main).
Même compte, même mot de passe ; la progression de Curio y est reprise à la première connexion.

## Installation
1. Copier le dossier sur le serveur : `https://polocrafting.fr/Curio/` (le C majuscule compte : c'est l'adresse de l'APK).
2. Le serveur doit pouvoir **écrire** dans ce dossier : `data/` (comptes, profils, cache des actualités) est créé tout seul.
3. PHP avec `curl` et `SimpleXML` (présents sur presque tous les hébergeurs).
4. `curio.apk` est servi depuis ce dossier : le site propose de le télécharger.

Le dossier `data/` n'existe pas encore : il sera créé par le serveur au premier compte.

## Structure
| Fichier | Rôle |
|---|---|
| `index.html`, `css/app.css` | Interface (mobile d'abord, mise en page PC à partir de 900 px) |
| `js/topics.js` | Catégories, sous-sujets, régions |
| `js/wiki.js` | Accès à l'encyclopédie (cache, file d'attente, respect des quotas) |
| `js/sources.js` | Autres sources : iNaturalist, NASA, Wikiquote, Wikivoyage, Wikidata, presse, traduction |
| `js/sync.js` | Fusion des profils entre appareils (historique uni, le reste : la version la plus récente) |
| `js/algo.js` | Profil (un par compte sur l'appareil), apprentissage, moteur du fil |
| `js/app.js` | Fil, lecteur, explorer, bibliothèque, réglages, accueil, compte |
| `api/account.php` | Comptes et sauvegarde du profil (même principe que Carnet) |
| `api/news.php` | Agrégateur des flux RSS de presse (cache 15 min) |
| `api/daily.php` | Sujet du jour (notification et widget de l'app) |
| `Illu.png` | Illustration de présentation (galerie) |

## L'algorithme en bref
- Chaque carte vient d'une **source** : tes sujets, similaires, catégories apprises, tendances, presse, formats variés
  (citations, voyages, œuvres, NASA…), découverte. Le mélange se règle dans Réglages › Algorithme.
- Le temps passé, les diapositives lues, J'aime, Garder, Lire, Partager et « Pas intéressé » donnent un **signal**
  qui ajuste le poids des sous-sujets, des catégories d'articles et des journaux.
- **Diversité** : jamais la même catégorie que l'une des deux cartes précédentes ; peu de sujets suivis = plus de découverte.
- **France / Monde** : en mode France, environ 70 % des cartes sont centrées sur la France (réglable), presse locale selon la région.
- Une carte « découverte » qui plaît fait entrer son sujet dans tes intérêts.

## Nouveautés 1.5
- **Langues retirées** : elles sont dans l'app Kalima (lien dans Réglages et sur l'écran d'accueil). L'ancien code
  (espace Langues, dictionnaires, outils) est rangé dans `Archives/Curio-langues-2026-10-12/` à la racine du site.
- **Synchronisation en temps réel**, comme Carnet : chaque appareil ouvert attend sur `account.php?a=wait`, qui répond dès
  qu'un autre appareil a sauvegardé (moins d'une seconde). Prévoir au moins 2 processus PHP par appareil ouvert.
- **Administration** (Réglages, pour les administrateurs : `ADMIN_USERS` dans `api/config.php`, ou un compte créé avec
  `INVITE_CODE`) : inscription libre ou sur invitation, codes d'invitation, liste des comptes, mot de passe provisoire,
  déconnexion, blocage, rôle administrateur, suppression.
- **Widget** « Curio · Sujet du jour » redimensionnable de 1×1 au plein écran (titre seul, bandeau, colonne, carte, grande carte).

## Nouveautés 1.4
- **Sauvegarde** : le serveur garde le profil en JSON brut (avant, `{}` devenait `[]` et des données disparaissaient
  à la réouverture). Les profils abîmés sont réparés au chargement.
- **Synchronisation façon Carnet** : les copies de chaque appareil sont fusionnées. Un profil par compte sur l'appareil.

## Notifications (app Android)
Un canal **Sujet du jour**, réglable dans Réglages › Notifications : heures fixes ou réparties dans une plage horaire.
L'app interroge `api/daily.php` aux heures choisies : rien à configurer côté serveur. Le même sujet alimente le widget.

## Sources et licences
Encyclopédie et Wikimedia Commons (CC BY-SA et licences libres), Wikiquote, Wikivoyage, Wikidata (CC0),
iNaturalist,
NASA (domaine public), MyMemory (traduction), API Adresse (data.gouv.fr), flux RSS publics de la presse
(titres et chapeaux, l'article s'ouvre chez l'éditeur). La liste complète est dans Réglages › Crédits & sources.

## L'APK
Construit avec la coquille générique `../WebApk` :
```
cd ../WebApk
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ANDROID_HOME=~/Android/Sdk bash build.sh apps/curio/curio.properties
```
Pour une nouvelle version : augmenter `app.versionCode` (et `app.version`) dans `curio.properties`.
Version 1.2.0 (code 3) : rappels programmés (`WebApk.notifyLater` / `cancelLater`), widget redimensionnable
(petit, moyen, grand), texte de notification en gras, icône « langues » (deux bulles A / ع).
Version 1.3.0 (code 4) : deux widgets indépendants, « Curio · Sujet du jour » et « Curio · Mot du jour » (langue choisie
dans Réglages › Notifications) ; le mot change chaque jour même si sa notification est coupée ; noms des widgets
correctement accentués (config lue en UTF-8).
Version 1.3.1 (code 5) : cookies de session écrits sur le disque à chaque passage en arrière-plan (les déconnexions venaient de là).
Version 1.5.0 (code 6) : un seul widget, « Curio · Sujet du jour », redimensionnable de 1×1 au plein écran ; plus de
notification « mot du jour » (les langues sont dans Kalima). Un ancien widget « Mot du jour » déjà posé est à retirer.

## Comptes : ce qui protège la progression
- Session perdue (cookie effacé par Android) : le profil du compte RESTE affiché sur l'appareil, l'app demande juste de se
  reconnecter. Le jeton de connexion est aussi envoyé en en-tête `X-Curio-Token` (secours si le cookie a disparu).
- Le serveur garde une copie du profil toutes les 3 h (30 copies) et toujours avant une version qui perdrait des articles
  gardés, des sujets ou des lectures (`data/backups/<pseudo>/`). Réglages › profil › Sauvegardes pour en récupérer une.
La clé de signature `curio.jks` et son mot de passe sont dans `../WebApk/apps/curio/` : **à sauvegarder**, sans elle
impossible de publier une mise à jour installable par-dessus l'ancienne.

## Statistiques de visite
Comme Carnet : un appel à `https://polocrafting.fr/track.php` à chaque ouverture (page « Curio », ou « Curio (app) » dans l'APK),
uniquement sur polocrafting.fr, avec le même identifiant d'appareil anonyme que les autres applis du site.
