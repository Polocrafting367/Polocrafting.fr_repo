<?php
// ================== CONFIGURATION KALIMA ==================

// Dossier de stockage (créé automatiquement). Les fichiers commencent par "<?php exit;" : jamais lisibles depuis le web.
const DATA_DIR = __DIR__ . '/../data';

// Code qui crée un compte administrateur. Change-le quand tu veux.
const INVITE_CODE = 'Kalima-7fd2a9c4';

// Comptes administrateurs (en plus de ceux créés avec INVITE_CODE). Vide = le premier compte créé.
const ADMIN_USERS = ['polocrafting'];

// Inscription libre au premier lancement (l'administrateur peut la couper : Réglages › Administration).
const OPEN_SIGNUP_DEFAULT = true;

// Comptes Curio : un compte Curio existant peut se connecter à Kalima avec le même mot de passe
// (le compte Kalima est créé à la première connexion et la progression d'anglais est reprise).
const CURIO_DATA = __DIR__ . '/../../Curio/data';

// Nom du cookie de connexion.
const COOKIE_NAME = 'kalima_tok';

// Taille maximale des données envoyées en une fois (octets).
const MAX_BODY = 3000000;

const TIMEZONE = 'Europe/Paris';

// Notifications web (sans l'APK) : contact transmis aux services de push (Google, Apple, Mozilla).
const PUSH_CONTACT = 'https://polocrafting.fr/Kalima/';

// Clé pour lancer api/cron.php depuis le web (cron.php?key=...) si le serveur n'a pas de vrai cron. Change-la.
const CRON_KEY = '6f1c2b9e0d4a47c3a8e25b71f09d3c64';
