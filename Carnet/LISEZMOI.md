# Carnet

Tâches, rappels et notes, synchronisés entre appareils. PHP 7.4+ et aucune base de données.

## Installation
1. Copier le dossier sur le serveur (`https://polocrafting.fr/rappels/`).
2. Le serveur doit pouvoir **écrire** dans ce dossier : `data/` est créé automatiquement.
3. **HTTPS obligatoire** pour les notifications et l'installation sur le téléphone.
4. Modifier `config.php` : `INVITE_CODE`, `CRON_KEY`, `APP_URL`, et éventuellement `ADMIN_USERS`.
5. **Administration** : le premier compte créé (ou ceux listés dans `ADMIN_USERS`) voit dans Réglages une carte
   « Administration » : état de l'envoi automatique des rappels (cron) et options avancées (ntfy).
   Les autres utilisateurs ne voient rien de technique.

## Installer l'application
- **Android (Chrome)** : l'appli propose elle-même de s'installer (ou Réglages → Application → Installer).
  Sinon, menu ⋮ → **Installer l'application**. Elle s'installe comme une vraie appli : icône, plein écran,
  présente dans la liste des applis. Appui long sur l'icône : « Nouvelle note » / « Nouvelle tâche ».
  Icône dans un carré blanc : c'est un simple raccourci (ou une installation ancienne). Le supprimer de l'écran
  d'accueil, puis réinstaller avec Chrome → menu ⋮ → **Installer l'application** (pas « Ajouter à l'écran d'accueil »).
- **iPhone** : Safari → Partager → **Sur l'écran d'accueil**, puis toujours lancer Carnet depuis cette icône.
- **PC (Chrome / Edge)** : icône d'installation dans la barre d'adresse.

## Notifications (Android, iPhone, PC)
1. Réglages → Notifications → « Activer sur cet appareil » (à faire sur chaque appareil), puis « Envoyer un test ».
2. Les rappels arrivent en **notification push**, même appli réduite ou fermée.
   **Indispensable** : quand l'appli est réduite, le téléphone la met en pause ; c'est le serveur qui envoie
   la notification, grâce à `cron.php` lancé toutes les minutes. Réglages → Notifications indique s'il tourne.
   `* * * * * php /chemin/rappels/cron.php`
   Sans accès cron, utiliser cron-job.org avec `https://polocrafting.fr/rappels/cron.php?key=CRON_KEY`.
   (Quand l'appli est ouverte au premier plan sur un appareil, c'est lui qui déclenche aussi l'envoi.)
3. PHP a besoin des extensions **openssl** et **curl** (ou de `allow_url_fopen`), présentes sur presque tous les hébergeurs.
4. Sur iPhone, les notifications push ne marchent qu'avec le site ajouté à l'écran d'accueil (iOS 16.4 ou plus).
5. Alternative : l'appli **ntfy** (Réglages → Notifications, section ntfy).

## Temps réel entre appareils
Quand l'appli est ouverte sur plusieurs appareils, les modifications s'affichent sur les autres en moins d'une seconde.
Chaque appareil garde une requête en attente sur le serveur (`api.php?a=wait`, environ 25 s), qui répond dès qu'il y a du nouveau.
Sur un serveur très limité en processus PHP, prévoir au moins 2 processus par appareil ouvert.

## Hors ligne, mises à jour et conflits
- L'appli fonctionne sans réseau. Les modifications sont gardées sur l'appareil et envoyées dès le retour de la connexion (l'en-tête affiche « Hors ligne · N modif. en attente »).
- Après une mise à jour des fichiers sur le serveur, l'appli se met à jour toute seule et propose de recharger la page.
  Si tu modifies `app.js` ou `app.css`, change le `?v=` dans `index.html` et `sw.js`, ainsi que `CACHE` dans `sw.js`.
- Si un élément a été modifié sur deux appareils en même temps :
  - les changements qui ne se chevauchent pas sont fusionnés automatiquement (ex. deux cases différentes cochées) ;
  - sinon, l'appli montre les deux versions et propose : garder cet appareil, garder l'autre, ou garder les deux.
    Dans ce dernier cas, seules les lignes modifiées sont dupliquées.

## Codes d'invitation et administration
- Le code `INVITE_CODE` de `config.php` reste valable : un compte créé avec lui devient **administrateur**.
- Réglages → Administration → **Inscription libre** : créer un compte sans code (désactivé par défaut).
- Réglages → Administration : créer des codes **à usage unique** ou **ouverts à tous**, les désactiver ou les supprimer.
  Pour chaque code : nombre d'utilisations, comptes créés avec, dernière connexion de chacun. Plus la liste de tous les comptes.
  Les codes sont dans `data/codes.json.php`.
- Écran « Créer un compte » → **Pas de code ? Demander un code** : le formulaire (même format que celui de BD) envoie la demande
  à `/contact_save.php`, à la racine du site ; elle arrive dans le tableau de bord `/contact`. Réglages → Aide et contact utilise le même formulaire.

## Données perdues sur le serveur
Si le serveur perd des notes, tâches, listes ou images (fichier effacé, compte recréé…) qu'un appareil a encore en mémoire,
Carnet le détecte à chaque ouverture et propose de les renvoyer (aussi : Réglages → Données → Vérifier et restaurer).
Une image dont l'appareil n'a plus que la miniature revient en basse définition (signalé dans la visionneuse).

## Aperçu des liens
Réglages → Notes → Aperçu des liens (désactivé par défaut) : titre et image des sites cités dans les notes.
Le serveur lit la page (extension PHP **curl** nécessaire), seulement pour les adresses publiques ; résultat gardé 7 jours dans `data/linkcache/`.

## Mode local (sans compte)
- Écran de connexion → **Ouvrir en local** : l'appli s'ouvre sans compte, et aucune donnée ne passe par le serveur
  (pas d'appel à `api.php`). Seuls les fichiers de l'appli (HTML, JS, CSS) sont téléchargés, puis gardés en cache.
- Les notes, tâches et rappels restent dans le navigateur (localStorage), et les images dans IndexedDB, sur cet appareil uniquement.
- Pas de synchronisation, et pas de notifications push : un rappel ne s'affiche que si l'appli est ouverte.
- Réglages → Compte → **Quitter le mode local** : retour à l'écran de connexion, et les données restent sur l'appareil.
  « Effacer les données locales » efface tout. Exporter / Importer fonctionnent comme avec un compte.

## Données
- `data/users.json.php` : comptes (mots de passe hachés en bcrypt).
- `data/users/<nom>.json.php` : tâches et notes de chaque utilisateur.
- `data/files/<nom>/` : images et dessins des notes (deux versions par image : normale et miniature).
  Illisibles directement depuis le web ; les images supprimées sont effacées après 7 jours.
  Chaque image est déjà compressée par l'appareil (1600 px max) : le `post_max_size` par défaut de PHP (8 Mo) suffit.
- Pour sauvegarder, il suffit de copier le dossier `data/`.
