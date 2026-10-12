<?php
// Envoie les notifications « mot du jour » aux navigateurs abonnés (sans l'APK), même appli fermée.
// À lancer toutes les minutes :
//   * * * * * php /chemin/vers/Kalima/api/cron.php
// ou, sans accès cron, via un service web (ex. cron-job.org) : https://polocrafting.fr/Kalima/api/cron.php?key=CRON_KEY
declare(strict_types=1);
require __DIR__ . '/lib.php';

if (PHP_SAPI !== 'cli' && !hash_equals(CRON_KEY, (string)($_GET['key'] ?? ''))) { http_response_code(403); exit('forbidden'); }
@touch(data_dir() . '/.cron');
@touch(data_dir() . '/.cron-ext'); // preuve que le vrai cron tourne (affichée dans l'administration)
$sent = run_word_pushes();
echo PHP_SAPI === 'cli' ? "$sent notification(s) envoyée(s)\n" : "ok $sent";
