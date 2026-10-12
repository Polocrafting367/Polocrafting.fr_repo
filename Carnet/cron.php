<?php
// Envoie les rappels (Web Push + ntfy), même si l'appli est fermée.
// À lancer toutes les minutes :
//   * * * * * php /chemin/vers/rappels/cron.php
// ou, sans accès cron, via un service web (ex. cron-job.org) :
//   https://ton-site/rappels/cron.php?key=CRON_KEY
declare(strict_types=1);
require __DIR__ . '/lib.php';

if (PHP_SAPI !== 'cli' && !hash_equals(CRON_KEY, (string)($_GET['key'] ?? ''))) {
    http_response_code(403);
    exit('forbidden');
}

@touch(data_dir() . '/.cron');
@touch(data_dir() . '/.cron-ext'); // preuve que le vrai cron tourne (affichée dans Réglages)
$sent = run_reminders();

if (PHP_SAPI === 'cli') echo "$sent rappel(s) envoyé(s)\n";
else echo "ok $sent";
