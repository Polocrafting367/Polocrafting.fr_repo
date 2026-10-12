<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
date_default_timezone_set(TIMEZONE);

// Préfixe de chaque fichier de données : empêche leur lecture via le navigateur.
const GUARD = "<?php exit; ?>\n";

function json_out($data, int $code = 200): void
{
    if (PHP_SAPI !== 'cli') http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function data_dir(string $sub = ''): string
{
    $dir = DATA_DIR . ($sub !== '' ? '/' . $sub : '');
    if (!is_dir($dir) && !@mkdir($dir, 0770, true)) {
        error_log('[kalima] impossible de créer ' . $dir . ' (droits d\'écriture ?)');
        json_out(['error' => 'Service momentanément indisponible, réessaie plus tard.'], 500);
    }
    if (!is_file(DATA_DIR . '/.htaccess')) {
        @file_put_contents(DATA_DIR . '/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
        @file_put_contents(DATA_DIR . '/index.html', '');
    }
    return $dir;
}

function decode_data(string $raw): array
{
    if (strncmp($raw, GUARD, strlen(GUARD)) === 0) $raw = substr($raw, strlen(GUARD));
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

function load_file(string $path): array
{
    if (!is_file($path)) return [];
    $fp = fopen($path, 'r');
    if (!$fp) return [];
    flock($fp, LOCK_SH);
    $raw = (string)stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return decode_data($raw);
}

// Lecture + modification + écriture sous verrou. $fn reçoit les données par référence ; s'il renvoie false, rien n'est écrit.
// $encode transforme les données avant écriture (ex. : garder {} pour les collections vides).
function update_file(string $path, callable $fn, ?callable $encode = null)
{
    $fp = fopen($path, 'c+');
    if (!$fp) {
        error_log('[kalima] écriture impossible : ' . $path);
        json_out(['error' => 'Service momentanément indisponible, réessaie plus tard.'], 500);
    }
    flock($fp, LOCK_EX);
    $data = decode_data((string)stream_get_contents($fp));
    $result = $fn($data);
    if ($result !== false) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, GUARD . json_encode($encode ? $encode($data) : $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        fflush($fp);
    }
    flock($fp, LOCK_UN);
    fclose($fp);
    return $result;
}

// ---------- Comptes / session ----------

function users_file(): string { return data_dir() . '/users.json.php'; }
function state_file(string $name): string { return data_dir('users') . '/' . $name . '.json.php'; }
function rev_file(string $name): string { return data_dir('users') . '/' . $name . '.rev'; }
function codes_file(): string { return data_dir() . '/codes.json.php'; }
function backup_dir(string $name): string { return data_dir('backups/' . $name); }

function norm_user($name): string { return strtolower(trim((string)$name)); }
function valid_user(string $name): bool { return (bool)preg_match('/^[a-z][a-z0-9._-]{1,31}$/', $name); }
const BAD_NAME = 'Pseudo invalide : 2 à 32 caractères, commence par une lettre (lettres, chiffres, . _ -)';

function cookie_opts(int $expires): array
{
    // Cookie posé pour tout le dossier de l'app (et pas seulement /api/).
    $path = rtrim(dirname(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/api/x.php'))), '/') . '/';
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    return ['expires' => $expires, 'path' => $path, 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax'];
}
function set_auth_cookie(string $tok): void { if (PHP_SAPI !== 'cli') setcookie(COOKIE_NAME, $tok, cookie_opts(time() + 3650 * 86400)); }
function clear_auth_cookie(): void { if (PHP_SAPI !== 'cli') setcookie(COOKIE_NAME, '', cookie_opts(time() - 3600)); }

function current_token(): ?string
{
    // Cookie, ou à défaut l'en-tête X-Kalima-Token : la WebView Android perd parfois ses cookies quand l'app est tuée.
    $tok = $_COOKIE[COOKIE_NAME] ?? ($_SERVER['HTTP_X_KALIMA_TOKEN'] ?? '');
    return is_string($tok) && preg_match('/^[a-f0-9]{64}$/', $tok) ? $tok : null;
}

function current_user(): ?string
{
    $tok = current_token();
    if ($tok === null) return null;
    $h = hash('sha256', $tok);
    foreach (load_file(users_file()) as $name => $u) if (isset($u['tokens'][$h])) return (string)$name;
    return null;
}

function require_user(): string
{
    $u = current_user();
    if ($u === null) json_out(['error' => 'Non connecté', 'auth' => false], 401);
    return $u;
}

function add_token(string $name, string $tok): void
{
    update_file(users_file(), function (array &$users) use ($name, $tok) {
        if (!isset($users[$name])) return false;
        $t = $users[$name]['tokens'] ?? [];
        $t[hash('sha256', $tok)] = time();
        arsort($t);
        $users[$name]['tokens'] = array_slice($t, 0, 20, true);
        return true;
    });
}

// Dernière activité connue d'un compte.
function user_last_seen(array $u): int
{
    $t = (int)($u['seen'] ?? 0);
    foreach ($u['tokens'] ?? [] as $ts) $t = max($t, (int)$ts);
    return $t ?: (int)($u['created'] ?? 0);
}

// Administrateur : compte créé avec INVITE_CODE ou marqué admin, listé dans ADMIN_USERS, ou à défaut le premier compte.
function is_admin(string $name, ?array $users = null): bool
{
    $users = $users ?? load_file(users_file());
    $u = $users[$name] ?? null;
    if (!$u) return false;
    if (!empty($u['admin'])) return true;
    if (ADMIN_USERS) return in_array($name, ADMIN_USERS, true);
    uasort($users, fn($a, $b) => ($a['created'] ?? 0) <=> ($b['created'] ?? 0));
    return array_key_first($users) === $name;
}

function require_admin(): string
{
    $name = require_user();
    if (!is_admin($name)) json_out(['error' => 'Réservé à l\'administrateur'], 403);
    return $name;
}

function server_settings(): array
{
    $s = load_file(data_dir() . '/server.json.php');
    if (!array_key_exists('openSignup', $s)) $s['openSignup'] = OPEN_SIGNUP_DEFAULT;
    return $s;
}

// ---------- Codes d'invitation ----------
// 'single' : utilisable une seule fois ; 'open' : sans limite.
function norm_code($code): string { return preg_replace('/[^A-Z0-9]/', '', strtoupper((string)$code)); }
function new_code(array $codes): string
{
    $abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    do {
        $c = '';
        for ($i = 0; $i < 8; $i++) $c .= $abc[random_int(0, strlen($abc) - 1)];
    } while (isset($codes[$c]));
    return $c;
}

// ---------- Compte Curio (même serveur) ----------
// Un ancien compte Curio peut se connecter avec son mot de passe : le compte Kalima est créé à ce moment-là.
function curio_user(string $name, string $pass): ?array
{
    $f = CURIO_DATA . '/users.json.php';
    if (!is_file($f)) return null;
    $u = decode_data((string)file_get_contents($f))[$name] ?? null;
    return $u && password_verify($pass, (string)($u['hash'] ?? '')) ? $u : null;
}

// Mots d'anglais et d'arabe de l'ancien profil Curio : [langue => [mot => 'known'|'learning']].
function curio_words(string $name): array
{
    $f = CURIO_DATA . '/profiles/' . $name . '.json.php';
    if (!is_file($f)) return [];
    $d = decode_data((string)file_get_contents($f));
    $out = [];
    foreach (($d['profile']['learn']['langs'] ?? []) as $code => $l) {
        if (!in_array($code, ['en', 'ar', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'tr'], true) || !is_array($l)) continue;
        foreach (array_keys(is_array($l['known'] ?? null) ? $l['known'] : []) as $w) $out[$code][(string)$w] = 'known';
        foreach ((is_array($l['words'] ?? null) ? $l['words'] : []) as $w => $s) {
            $out[$code][(string)$w] = ((int)($s['int'] ?? 0) >= 7) ? 'known' : 'learning';
        }
        if (isset($l['front'])) $out[$code]['@front'] = (int)$l['front'];
    }
    return $out;
}

// ---------- Données & synchronisation ----------
// État d'un compte :
//   settings  {u, ...}                    réglages (le plus récent gagne)
//   langs     {code: {u, ...}}            niveau, parcours, alphabet… par langue (le plus récent gagne)
//   items     {"en:house": {u, ...}}      progression de chaque mot / phrase (élément par élément, le plus récent gagne)
//   xp        {appareil: {jour: points}}  compteurs par appareil : ils ne font que monter, on garde le maximum
//   resume    {code: {u, ...}}            exercice en cours par langue
// « u » = date de modification (ms). Deux appareils qui travaillent en même temps ne s'écrasent jamais :
// seuls les éléments modifiés partent, et chacun garde sa version la plus récente.
const MAPS = ['langs', 'items', 'resume'];

function clean_state($st): array
{
    $st = is_array($st) ? $st : [];
    $out = ['settings' => is_array($st['settings'] ?? null) ? $st['settings'] : []];
    foreach (MAPS as $k) {
        $out[$k] = [];
        foreach ((is_array($st[$k] ?? null) ? $st[$k] : []) as $id => $v) if (is_array($v)) $out[$k][(string)$id] = $v;
    }
    $out['xp'] = [];
    foreach ((is_array($st['xp'] ?? null) ? $st['xp'] : []) as $dev => $days) {
        if (!is_array($days) || !preg_match('/^[a-z0-9-]{3,64}$/i', (string)$dev)) continue;
        foreach ($days as $d => $n) if (preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$d) && is_numeric($n)) $out['xp'][(string)$dev][(string)$d] = (int)$n;
    }
    return $out;
}

function merge_state(array $server, array $client): array
{
    $s = clean_state($server);
    $c = clean_state($client);
    if ((int)($c['settings']['u'] ?? 0) > (int)($s['settings']['u'] ?? 0)) $s['settings'] = $c['settings'];
    foreach (MAPS as $k) {
        foreach ($c[$k] as $id => $v) {
            if (strlen($id) > 120) continue;
            if (!isset($s[$k][$id]) || (int)($v['u'] ?? 0) > (int)($s[$k][$id]['u'] ?? 0)) $s[$k][$id] = $v;
        }
    }
    foreach ($c['xp'] as $dev => $days) foreach ($days as $d => $n) if ($n > ($s['xp'][$dev][$d] ?? 0)) $s['xp'][$dev][$d] = $n;
    return $s;
}

// En JSON, une collection vide doit rester {} (et non []).
function out_state(array $st): array
{
    $st = clean_state($st);
    $st['settings'] = (object)$st['settings'];
    foreach (MAPS as $k) $st[$k] = (object)$st[$k];
    foreach ($st['xp'] as $dev => $days) $st['xp'][$dev] = (object)$days;
    $st['xp'] = (object)$st['xp'];
    return $st;
}

function state_stats(array $st): array
{
    $st = clean_state($st);
    $xp = 0;
    foreach ($st['xp'] as $days) $xp += array_sum($days);
    return ['items' => count($st['items']), 'langs' => count($st['langs']), 'xp' => $xp];
}

// Copie de sauvegarde avant écriture : au plus une toutes les 3 h (30 gardées),
// et toujours une si la nouvelle version a moins de mots ou de points que l'ancienne.
function backup_state(string $name, array $old, array $new): void
{
    $a = state_stats($old); $b = state_stats($new);
    if (!$a['items'] && !$a['xp']) return; // rien à protéger encore
    $dir = backup_dir($name);
    $files = glob($dir . '/*.json.php') ?: [];
    sort($files);
    $loss = $b['items'] < $a['items'] || $b['xp'] < $a['xp'] || $b['langs'] < $a['langs'];
    if (!$loss && $files && time() - filemtime(end($files)) < 3 * 3600) return;
    @file_put_contents($dir . '/' . date('Ymd-His') . ($loss ? '-avant-perte' : '') . '.json.php',
        GUARD . json_encode(out_state($old), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
    foreach (array_slice($files, 0, max(0, count($files) + 1 - 30)) as $f) @unlink($f);
}

function get_rev(string $name): string
{
    clearstatcache(true, rev_file($name));
    return (string)@file_get_contents(rev_file($name));
}
function bump_rev(string $name): void { @file_put_contents(rev_file($name), uniqid('', true), LOCK_EX); }

// ---------- Mot du jour (notification, widget, app) ----------
const WORD_LANGS = ['en' => ['Anglais', '🇬🇧'], 'ar' => ['Arabe', '🇩🇿'], 'es' => ['Espagnol', '🇪🇸'], 'de' => ['Allemand', '🇩🇪'], 'it' => ['Italien', '🇮🇹'],
    'pt' => ['Portugais', '🇵🇹'], 'nl' => ['Néerlandais', '🇳🇱'], 'ru' => ['Russe', '🇷🇺'], 'tr' => ['Turc', '🇹🇷']];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

/**
 * Mot n° $k du jour pour une langue et un niveau : le n° 0 est le « mot du jour » affiché dans l'app (même calcul que
 * js/views.js), les suivants servent aux autres notifications de la journée. ['title','body','label','url','image'].
 */
function word_card(string $l, string $lvl, int $k, string $app): ?array
{
    if (!isset(WORD_LANGS[$l])) return null;
    static $cache = [];
    if (!isset($cache[$l])) $cache[$l] = json_decode((string)@file_get_contents(__DIR__ . "/../content/$l.json"), true);
    $d = $cache[$l];
    if (!$d) return null;
    $lv = array_search($lvl, LEVELS, true);
    if ($lv === false) $lv = 0;
    // Noms, verbes, adjectifs, adverbes, expressions, avec un exemple, sans les mots transparents (même filtre que l'app).
    $norm = function ($t) { return strtolower(trim(preg_replace('/[^\p{L}\p{N}]+/u', ' ', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $t) ?: $t))); };
    $list = array_values(array_filter($d['words'], function ($w) use ($lv, $l, $norm) {
        return $w['l'] === LEVELS[$lv] && !empty($w['ex']) && in_array($w['p'], ['n', 'v', 'adj', 'adv', 'phr'], true)
            && ($l === 'ar' || $norm($w['fr'][0]) !== $norm($w['w']));
    }));
    if (!$list) $list = array_values(array_filter($d['words'], function ($w) { return !empty($w['ex']); }));
    if (!$list) return null;
    $h = 0;
    foreach (str_split(date('Y-m-d')) as $c) $h = ($h * 31 + ord($c)) & 0xFFFFFFFF;
    $w = $list[($h + $k * 7919) % count($list)];
    [$name, $flag] = WORD_LANGS[$l];
    $ex = str_replace('*', '', $w['ex'][0]);
    return [
        'title' => !empty($w['tl']) ? "$flag {$w['w']} · {$w['tl']}" : "$flag {$w['w']}",
        'body' => '<b>' . htmlspecialchars($w['fr'][0]) . '</b> — ' . htmlspecialchars($ex) . ' <i>' . htmlspecialchars($w['ex'][1]) . '</i>',
        'text' => $w['fr'][0] . ' — ' . $ex . ' (' . $w['ex'][1] . ')',
        'label' => "$flag Mot du jour · {$name} · " . LEVELS[$lv],
        'image' => '',
        'url' => $app . '?l=' . $l . '&word=' . rawurlencode("$l:w:" . $w['id']),
    ];
}

function app_url(): string
{
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') ? 'https' : 'http';
    if (PHP_SAPI === 'cli' || empty($_SERVER['HTTP_HOST'])) return PUSH_CONTACT;
    return $scheme . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/x/api/w.php')), '/') . '/';
}

// ---------- Notifications web (sans l'APK), comme Carnet ----------
// Le serveur envoie une notification « vide » signée (VAPID) ; le service worker se réveille et va chercher le mot
// à afficher (api.php?a=pushpull). Horaires : settings.notifPlan du profil ({langue: ["09:30", …]}), calculés par l'app.
function http_post(string $url, array $headers, string $body): int
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
        curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return $code;
    }
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => implode("\r\n", $headers) . "\r\n", 'content' => $body, 'timeout' => 10, 'ignore_errors' => true]]);
    @file_get_contents($url, false, $ctx);
    preg_match('#HTTP/\S+ (\d{3})#', $http_response_header[0] ?? '', $m);
    return (int)($m[1] ?? 0);
}
function b64url(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function push_file(string $name): string { return data_dir('users') . '/' . $name . '.push.php'; }

function vapid_keys(): array
{
    $f = data_dir() . '/vapid.json.php';
    $k = load_file($f);
    if (!empty($k['pem'])) return $k;
    $opts = ['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC];
    $res = @openssl_pkey_new($opts);
    $pem = null;
    if (!$res || !@openssl_pkey_export($res, $pem)) {
        $cnf = data_dir() . '/openssl.cnf';
        if (!is_file($cnf)) @file_put_contents($cnf, "[req]\ndefault_bits = 2048\ndistinguished_name = dn\n[dn]\n");
        $opts['config'] = $cnf;
        $res = @openssl_pkey_new($opts);
        if (!$res || !@openssl_pkey_export($res, $pem, null, ['config' => $cnf])) return [];
    }
    while (openssl_error_string()) {}
    $d = openssl_pkey_get_details($res);
    $pad = function ($s) { return str_pad($s, 32, "\0", STR_PAD_LEFT); };
    $new = ['pem' => $pem, 'pub' => b64url("\x04" . $pad($d['ec']['x']) . $pad($d['ec']['y']))];
    update_file($f, function (array &$x) use ($new) { if (!empty($x['pem'])) return false; $x = $new; return true; });
    return load_file($f);
}
function der_to_raw(string $der): string
{
    $pos = 2;
    if (ord($der[1]) & 0x80) $pos += ord($der[1]) & 0x7f;
    $out = '';
    for ($i = 0; $i < 2; $i++) {
        $pos++;
        $len = ord($der[$pos++]);
        $int = ltrim(substr($der, $pos, $len), "\0");
        $pos += $len;
        $out .= str_pad($int, 32, "\0", STR_PAD_LEFT);
    }
    return $out;
}
function vapid_jwt(string $endpoint): string
{
    $k = vapid_keys();
    $u = parse_url($endpoint);
    if (!$k || empty($u['scheme']) || empty($u['host'])) return '';
    $h = b64url(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    $c = b64url(json_encode(['aud' => $u['scheme'] . '://' . $u['host'], 'exp' => time() + 12 * 3600, 'sub' => PUSH_CONTACT], JSON_UNESCAPED_SLASHES));
    if (!openssl_sign("$h.$c", $der, $k['pem'], OPENSSL_ALGO_SHA256)) return '';
    return "$h.$c." . b64url(der_to_raw($der));
}
function webpush_send(string $endpoint): int
{
    $jwt = vapid_jwt($endpoint);
    if ($jwt === '') return 0;
    $k = vapid_keys();
    return http_post($endpoint, ['TTL: 3600', 'Urgency: normal', 'Authorization: vapid t=' . $jwt . ', k=' . $k['pub'], 'Content-Length: 0'], '');
}

// Met des notifications en file d'attente et réveille tous les appareils abonnés (navigateur) du compte.
function push_notify(string $name, array $items): int
{
    $subs = [];
    update_file(push_file($name), function (array &$p) use ($items, &$subs) {
        $lim = time() - 86400;
        $q = array_values(array_filter($p['queue'] ?? [], function ($i) use ($lim) { return ($i['ts'] ?? 0) > $lim; }));
        foreach ($items as $it) $q[] = $it + ['ts' => time(), 'pulled' => []];
        $p['queue'] = array_slice($q, -30);
        $subs = $p['subs'] ?? [];
        return true;
    });
    $ok = 0;
    $dead = [];
    foreach ($subs as $h => $s) {
        $code = webpush_send((string)$s['endpoint']);
        if ($code >= 200 && $code < 300) $ok++;
        elseif ($code === 404 || $code === 410) $dead[] = $h;
    }
    if ($dead) update_file(push_file($name), function (array &$p) use ($dead) { foreach ($dead as $h) unset($p['subs'][$h]); return true; });
    return $ok;
}

// Envoie les mots du jour arrivés à échéance (cron.php chaque minute, et au passage des appareils ouverts).
function run_word_pushes(): int
{
    $sent = 0;
    $now = time();
    $today = date('Y-m-d');
    $app = app_url();
    foreach (glob(data_dir('users') . '/*.push.php') ?: [] as $pf) {
        $name = basename($pf, '.push.php');
        $push = load_file($pf);
        if (empty($push['subs'])) continue;
        $st = clean_state(load_file(state_file($name)));
        $s = $st['settings'];
        if (empty($s['notif']['on']) || !is_array($s['notifPlan'] ?? null)) continue;
        $due = [];
        $fired = $push['fired'] ?? [];
        foreach ($s['notifPlan'] as $l => $times) {
            if (!isset(WORD_LANGS[$l]) || !is_array($times)) continue;
            $lvl = LEVELS[max(0, min(4, (int)floor((float)($st['langs'][$l]['lv'] ?? 0))))];
            foreach (array_values($times) as $k => $t) {
                if (!preg_match('/^\d{2}:\d{2}$/', (string)$t)) continue;
                $at = strtotime("$today $t");
                // Échéance passée depuis moins de 30 min, et pas encore envoyée aujourd'hui.
                if ($at > $now || $at < $now - 1800) continue;
                $key = "$l|$t";
                if (($fired[$key] ?? '') === $today) continue;
                $fired[$key] = $today;
                $c = word_card($l, $lvl, $k, $app);
                if ($c) $due[] = ['id' => "mot-$l-$k-$today", 'title' => $c['title'], 'body' => $c['text'], 'url' => $c['url']];
            }
        }
        if (!$due) continue;
        update_file($pf, function (array &$p) use ($fired) { $p['fired'] = array_slice($fired, -60, null, true); return true; });
        if (push_notify($name, $due)) $sent += count($due);
    }
    return $sent;
}
function maybe_run_word_pushes(): void
{
    $f = data_dir() . '/.cron';
    if (is_file($f) && time() - filemtime($f) < 55) return;
    $fp = @fopen($f, 'c');
    if (!$fp) return;
    if (flock($fp, LOCK_EX | LOCK_NB)) { touch($f); run_word_pushes(); flock($fp, LOCK_UN); }
    fclose($fp);
}
