<?php
// ================== CONFIGURATION ==================

// Code demandé pour créer un compte. Change-le quand tu veux.
const INVITE_CODE = 'Qefe47722002';

// Dossier de stockage (créé automatiquement). Les fichiers sont en .php
// et commencent par "<?php exit;" : ils ne sont donc jamais lisibles depuis le web.
const DATA_DIR = __DIR__ . '/data';

// Fuseau horaire utilisé pour les rappels envoyés par le serveur.
const TIMEZONE = 'Europe/Paris';

// Notifications "appli fermée" via ntfy (https://ntfy.sh).
const NTFY_SERVER = 'https://ntfy.sh';

// Adresse du site (optionnel) : ouverte quand on touche une notification ntfy.
const APP_URL = 'https://polocrafting.fr/rappels/';

// Contact transmis aux services de notification push (Google, Apple, Mozilla) :
// l'adresse du site, ou 'mailto:ton@email.fr'.
const PUSH_CONTACT = 'https://polocrafting.fr/rappels/';

// Clé pour lancer cron.php depuis le web : cron.php?key=...
// (inutile si tu lances cron.php en ligne de commande). Change-la.
const CRON_KEY = 'cb0e8221229b8da0864851aaa522e152';

// Comptes qui voient la carte « Administration » dans les Réglages (état des rappels, options avancées).
// Vide = le premier compte créé.
const ADMIN_USERS = [];

// Nom du cookie de connexion.
const COOKIE_NAME = 'rappels_tok';
