<?php
// ================== CONFIGURATION CURIO ==================

// Dossier de stockage (créé automatiquement). Les fichiers commencent par "<?php exit;" : jamais lisibles depuis le web.
const DATA_DIR = __DIR__ . '/../data';

// Code qui crée un compte administrateur (Réglages › Administration).
const INVITE_CODE = 'Curio-3b81e0d5';

// Comptes administrateurs (en plus de ceux créés avec INVITE_CODE). Vide = le premier compte créé.
const ADMIN_USERS = ['polocrafting'];

// Inscription libre tant que l'administrateur ne la coupe pas.
const OPEN_SIGNUP_DEFAULT = true;

// Nom du cookie de connexion.
const COOKIE_NAME = 'curio_tok';

// Taille maximale d'un profil sauvegardé (octets).
const MAX_PROFILE = 2000000;

// Durée de cache des flux d'actualité (secondes).
const NEWS_TTL = 900;

const TIMEZONE = 'Europe/Paris';
