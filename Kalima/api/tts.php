<?php
// Prononciation (relais audio) : utilisé quand le téléphone n'a pas de voix pour la langue (souvent l'arabe,
// et la WebView de l'app Android). Le son est mis en cache sur le serveur.
// GET tts.php?l=ar&q=texte  ->  audio/mpeg
declare(strict_types=1);
require __DIR__ . '/lib.php';

$langs = ['en', 'es', 'de', 'it', 'ar', 'fr', 'pt', 'nl', 'ru', 'tr'];
$l = in_array($_GET['l'] ?? '', $langs, true) ? $_GET['l'] : 'en';
$q = trim((string)($_GET['q'] ?? ''));
if ($q === '' || mb_strlen($q) > 200) { http_response_code(400); exit; }

$file = data_dir('tts') . '/' . $l . '-' . sha1($q) . '.mp3';
if (!is_file($file)) {
    $url = 'https://translate.google.com/translate_tts?' . http_build_query(['ie' => 'UTF-8', 'client' => 'tw-ob', 'tl' => $l, 'q' => $q]);
    $c = curl_init($url);
    curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_USERAGENT => 'Mozilla/5.0']);
    $mp3 = curl_exec($c);
    $code = curl_getinfo($c, CURLINFO_HTTP_CODE);
    curl_close($c);
    if (!$mp3 || $code !== 200) { http_response_code(502); exit; }
    file_put_contents($file, $mp3);
}
header('Content-Type: audio/mpeg');
header('Cache-Control: public, max-age=2592000');
header('Content-Length: ' . filesize($file));
readfile($file);
