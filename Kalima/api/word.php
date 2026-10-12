<?php
// Mot du jour : notification et widget de l'app Android.
// GET word.php?l=en&lvl=B1&k=0  ->  {"title","body","label","url","image"}
// k = rang de la notification dans la journée (0 = le « mot du jour » de l'app ; 1, 2… = d'autres mots du même niveau).
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$l = (string)($_GET['l'] ?? 'en');
$c = word_card(isset(WORD_LANGS[$l]) ? $l : 'en', (string)($_GET['lvl'] ?? 'A1'), max(0, min(9, (int)($_GET['k'] ?? 0))), app_url());
if (!$c) { http_response_code(503); echo json_encode(['error' => 'contenu absent']); exit; }
unset($c['text']);
echo json_encode($c, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
