<?php
// Sujet du jour pour la notification et le widget de l'app Android (coquille WebApk).
// Appelé par l'app : api/daily.php?lang=fr&region=fr&min=6000&t=requete~Libellé~poids|...
// Réponse : {"title","body","image","url","label"}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$lang = preg_match('/^[a-z]{2,3}$/', $_GET['lang'] ?? '') ? $_GET['lang'] : 'fr';
$region = ($_GET['region'] ?? 'fr') === 'monde' ? 'monde' : 'fr';
$min = max(0, min(30000, (int)($_GET['min'] ?? 6000)));
$topics = [];
foreach (explode('|', (string)($_GET['t'] ?? '')) as $chunk) {
    $p = explode('~', $chunk);
    if (count($p) >= 2 && trim($p[0]) !== '') {
        $topics[] = ['q' => mb_substr(trim($p[0]), 0, 200), 'label' => mb_substr(trim($p[1]), 0, 60), 'w' => max(0.1, (float)($p[2] ?? 1))];
    }
}
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$appUrl = $scheme . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';

function fetch_json(string $url) {
    $ua = 'CurioDaily/1.0 (https://polocrafting.fr/Curio/)';
    if (function_exists('curl_init')) {
        $c = curl_init($url);
        curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_USERAGENT => $ua, CURLOPT_FOLLOWLOCATION => true]);
        $body = curl_exec($c);
        curl_close($c);
    } else {
        $body = @file_get_contents($url, false, stream_context_create(['http' => ['header' => "User-Agent: $ua\r\n", 'timeout' => 15]]));
    }
    return $body ? json_decode($body, true) : null;
}

function first_sentences(string $t, int $max = 170): string {
    $t = trim(preg_replace('/\s+/', ' ', preg_replace('/\(\s*[;,]?\s*\)/', '', $t)));
    if (mb_strlen($t) <= $max) return $t;
    $cut = mb_substr($t, 0, $max);
    $dot = mb_strrpos($cut, '. ');
    return $dot > 60 ? mb_substr($cut, 0, $dot + 1) : rtrim($cut) . '…';
}

function usable(array $p, int $min): bool {
    if (empty($p['thumbnail']) || isset($p['pageprops']['disambiguation'])) return false;
    if (preg_match('/^(Liste |Chronologie |List of |\d{1,4}$)/u', $p['title'])) return false;
    return ($p['length'] ?? 0) >= $min && mb_strlen($p['extract'] ?? '') > 140;
}

function pick_weighted(array $items) {
    $total = array_sum(array_column($items, 'w'));
    $r = mt_rand() / mt_getrandmax() * $total;
    foreach ($items as $it) { $r -= $it['w']; if ($r <= 0) return $it; }
    return end($items);
}

$api = "https://$lang.wikipedia.org/w/api.php";
$result = null;

// 1 fois sur 5 (ou sans sujets) : un article très lu aujourd'hui.
if (!$topics || mt_rand(1, 5) === 1) {
    $d = new DateTime('yesterday');
    $feed = fetch_json("https://$lang.wikipedia.org/api/rest_v1/feed/featured/" . $d->format('Y/m/d'));
    $arts = array_values(array_filter($feed['mostread']['articles'] ?? [], function ($a) {
        return !empty($a['thumbnail']) && !preg_match('/^(Liste|List of)/u', $a['normalizedtitle'] ?? $a['title']) && mb_strlen($a['extract'] ?? '') > 140;
    }));
    if ($arts) {
        $a = $arts[mt_rand(0, min(9, count($arts) - 1))];
        $result = ['title' => $a['normalizedtitle'] ?? str_replace('_', ' ', $a['title']), 'desc' => $a['description'] ?? '', 'extract' => $a['extract'], 'image' => $a['thumbnail']['source'], 'label' => 'Actualité'];
    }
}

for ($try = 0; !$result && $topics && $try < 4; $try++) {
    $t = pick_weighted($topics);
    $q = $t['q'];
    $local = $region === 'fr' && mt_rand(1, 100) <= 70;
    if ($local) $q .= ' France';
    $params = http_build_query([
        'action' => 'query', 'format' => 'json', 'formatversion' => 2, 'generator' => 'search', 'gsrsearch' => $q,
        'gsrlimit' => 20, 'gsroffset' => mt_rand(0, 120), 'gsrnamespace' => 0, 'redirects' => 1,
        'prop' => 'pageimages|extracts|description|info|pageprops', 'piprop' => 'thumbnail', 'pithumbsize' => 800,
        'exintro' => 1, 'explaintext' => 1, 'exlimit' => 20, 'ppprop' => 'disambiguation',
    ]);
    $data = fetch_json("$api?$params");
    $pages = array_values(array_filter($data['query']['pages'] ?? [], function ($p) use ($min) { return usable($p, $min); }));
    if ($pages) {
        $p = $pages[mt_rand(0, count($pages) - 1)];
        $result = ['title' => $p['title'], 'desc' => $p['description'] ?? '', 'extract' => $p['extract'], 'image' => $p['thumbnail']['source'], 'label' => $t['label']];
    }
}

if (!$result) { http_response_code(503); echo json_encode(['error' => 'indisponible']); exit; }

$body = first_sentences($result['extract'], 110);
echo json_encode([
    'title' => 'Sujet du jour · ' . $result['title'],
    'body' => $body,
    'image' => $result['image'],
    'url' => $appUrl . '?a=' . rawurlencode($result['title']),
    'label' => $result['label'],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
