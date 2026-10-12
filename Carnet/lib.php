<?php
declare(strict_types=1);
require __DIR__ . '/config.php';

date_default_timezone_set(TIMEZONE);

// Collections synchronisées élément par élément.
const COLLECTIONS = ['tasks', 'notes', 'lists', 'images']; // images : galerie des images gardées de notes supprimées

// Préfixe de chaque fichier de données : empêche leur lecture via le navigateur.
const GUARD = "<?php exit; ?>\n";

function json_out($data, int $code = 200): void
{
    if (PHP_SAPI !== 'cli') http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function data_dir(): string
{
    static $ready = false;
    if (!$ready) {
        if (!is_dir(DATA_DIR . '/users') && !@mkdir(DATA_DIR . '/users', 0770, true)) {
            error_log('[rappels] impossible de créer ' . DATA_DIR . ' (droits d\'écriture ?)');
            json_out(['error' => 'Service momentanément indisponible, réessaie plus tard.'], 500);
        }
        if (!is_file(DATA_DIR . '/.htaccess')) {
            @file_put_contents(DATA_DIR . '/.htaccess',
                "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
        }
        if (!is_file(DATA_DIR . '/index.html')) @file_put_contents(DATA_DIR . '/index.html', '');
        $ready = true;
    }
    return DATA_DIR;
}

function users_file(): string
{
    return data_dir() . '/users.json.php';
}

function user_file(string $name): string
{
    return data_dir() . '/users/' . $name . '.json.php';
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

// Lecture + modification + écriture sous verrou. $fn reçoit les données par référence ;
// s'il renvoie false, rien n'est écrit.
function update_file(string $path, callable $fn)
{
    $fp = fopen($path, 'c+');
    if (!$fp) {
        error_log('[rappels] écriture impossible : ' . $path);
        json_out(['error' => 'Service momentanément indisponible, réessaie plus tard.'], 500);
    }
    flock($fp, LOCK_EX);
    $data = decode_data((string)stream_get_contents($fp));
    $result = $fn($data);
    if ($result !== false) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, GUARD . json_encode($data, JSON_UNESCAPED_UNICODE));
        fflush($fp);
    }
    flock($fp, LOCK_UN);
    fclose($fp);
    return $result;
}

// ---------- Comptes / session ----------

function norm_user($name): string
{
    return strtolower(trim((string)$name));
}

function valid_user(string $name): bool
{
    return (bool)preg_match('/^[a-z][a-z0-9._-]{1,31}$/', $name);
}

function cookie_opts(int $expires): array
{
    $path = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') . '/';
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    return ['expires' => $expires, 'path' => $path, 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax'];
}

function set_auth_cookie(string $tok): void
{
    // ~10 ans : on reste connecté.
    setcookie(COOKIE_NAME, $tok, cookie_opts(time() + 3650 * 86400));
}

function clear_auth_cookie(): void
{
    setcookie(COOKIE_NAME, '', cookie_opts(time() - 3600));
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

function current_token(): ?string
{
    $tok = $_COOKIE[COOKIE_NAME] ?? '';
    return is_string($tok) && preg_match('/^[a-f0-9]{64}$/', $tok) ? $tok : null;
}

function current_user(): ?string
{
    $tok = current_token();
    if ($tok === null) return null;
    $h = hash('sha256', $tok);
    foreach (load_file(users_file()) as $name => $u) {
        if (isset($u['tokens'][$h])) return (string)$name;
    }
    return null;
}

// Administrateur : compte créé avec le code de config.php (INVITE_CODE), ou listé dans ADMIN_USERS,
// ou à défaut le premier compte créé.
function is_admin(string $name): bool
{
    $u = load_file(users_file())[$name] ?? null;
    if (!empty($u['admin'])) return true;
    if (ADMIN_USERS) return in_array($name, ADMIN_USERS, true);
    $users = load_file(users_file());
    uasort($users, fn($a, $b) => ($a['created'] ?? 0) <=> ($b['created'] ?? 0));
    return array_key_first($users) === $name;
}

function require_admin(): string
{
    $name = require_user();
    if (!is_admin($name)) json_out(['error' => 'Réservé à l\'administrateur'], 403);
    return $name;
}

// Réglages du serveur modifiables par l'administrateur (ex. : inscription libre, sans code).
function server_settings(): array
{
    return load_file(data_dir() . '/server.json.php');
}

// ---------- Codes d'invitation ----------
// 'single' : utilisable une seule fois ; 'open' : ouvert à tous, sans limite.
// Le code de config.php (INVITE_CODE) n'est pas dans ce fichier : il crée un compte administrateur.

function codes_file(): string
{
    return data_dir() . '/codes.json.php';
}

// Saisie tolérante : majuscules, sans espaces ni tirets.
function norm_code($code): string
{
    return preg_replace('/[^A-Z0-9]/', '', strtoupper((string)$code));
}

// 8 caractères sans ambiguïté (pas de 0/O, 1/I/L), affichés XXXX-XXXX.
function new_code(array $codes): string
{
    $abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    do {
        $c = '';
        for ($i = 0; $i < 8; $i++) $c .= $abc[random_int(0, strlen($abc) - 1)];
    } while (isset($codes[$c]));
    return $c;
}

// Dernière activité connue d'un compte (ouverture de l'appli ou connexion).
function user_last_seen(array $u): int
{
    $t = (int)($u['seen'] ?? 0);
    foreach ($u['tokens'] ?? [] as $ts) $t = max($t, (int)$ts);
    return $t ?: (int)($u['created'] ?? 0);
}

function require_user(): string
{
    $u = current_user();
    if ($u === null) json_out(['error' => 'Non connecté'], 401);
    return $u;
}

// ---------- Données & synchronisation ----------

function clean_state($st): array
{
    $st = is_array($st) ? $st : [];
    $out = [];
    foreach (['tasks', 'notes', 'lists', 'images', 'fired', 'settings'] as $k) {
        $out[$k] = isset($st[$k]) && is_array($st[$k]) ? $st[$k] : [];
    }
    return $out;
}

// Fusion élément par élément.
// Chaque élément envoyé porte "bv" = la version serveur (updatedAt) dont il dérive.
//  - bv égal à la version actuelle du serveur : modification normale, acceptée ;
//  - bv différent : l'élément a aussi changé ailleurs → conflit, le serveur garde
//    sa version et l'appareil fusionne / demande à l'utilisateur ;
//  - pas de bv (ancienne version de l'appli) : la plus récente gagne.
function merge_state(array $server, array $client): array
{
    $s = clean_state($server);
    $c = clean_state($client);

    foreach (COLLECTIONS as $k) {
        foreach ($c[$k] as $id => $item) {
            $id = (string)$id;
            if (!is_array($item) || !preg_match('/^[a-z][a-z0-9]{3,47}$/i', $id)) continue;
            $bv = isset($item['bv']) ? (int)$item['bv'] : null;
            unset($item['bv']);
            $item['id'] = $id;
            $cur = $s[$k][$id] ?? null;
            $iu = (int)($item['updatedAt'] ?? 0);
            $cu = (int)($cur['updatedAt'] ?? 0);
            if (!$cur || ($bv !== null ? $bv === $cu : $iu > $cu)) $s[$k][$id] = $item;
        }
    }
    foreach ($c['fired'] as $id => $ts) {
        if (is_numeric($ts) && (int)$ts > (int)($s['fired'][$id] ?? 0)) $s['fired'][$id] = (int)$ts;
    }
    if ((int)($c['settings']['updatedAt'] ?? 0) > (int)($s['settings']['updatedAt'] ?? 0)) {
        $s['settings'] = $c['settings'];
    }

    // Nettoyage des éléments supprimés depuis plus de 60 jours.
    $limit = (time() - 60 * 86400) * 1000;
    foreach (COLLECTIONS as $k) {
        foreach ($s[$k] as $id => $it) {
            if (!empty($it['deleted']) && (int)($it['updatedAt'] ?? 0) < $limit) unset($s[$k][$id]);
        }
    }
    foreach ($s['fired'] as $id => $_) {
        if (!isset($s['tasks'][$id])) unset($s['fired'][$id]);
    }
    return $s;
}

// Force les collections vides à sortir en {} et non [] en JSON.
function out_state(array $st): array
{
    $st = clean_state($st);
    foreach ($st as $k => $v) $st[$k] = (object)$v;
    return $st;
}

// Tâches répétitives cochées : elles reviennent (décochées) le jour de leur prochaine occurrence.
function rollover_tasks(array &$st): bool
{
    $today = date('Y-m-d');
    $changed = false;
    foreach ($st['tasks'] as $id => $t) {
        if (!is_array($t) || !empty($t['deleted']) || empty($t['done'])) continue;
        if (($t['repeat'] ?? 'none') === 'none' || empty($t['nextDate']) || $t['nextDate'] > $today) continue;
        $t['date'] = $t['nextDate'];
        $t['nextDate'] = '';
        $t['done'] = false;
        $t['doneAt'] = 0;
        $t['updatedAt'] = (int)(microtime(true) * 1000);
        $st['tasks'][$id] = $t;
        $changed = true;
    }
    return $changed;
}

// Heure du rappel d'une tâche en millisecondes, 0 si aucun rappel.
function task_due_ms(array $t): int
{
    if (!empty($t['deleted']) || !empty($t['done'])) return 0;
    $date = (string)($t['date'] ?? '');
    $time = (string)($t['time'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $time)) return 0;
    $ts = strtotime("$date $time");
    return $ts ? $ts * 1000 : 0;
}

// ---------- Révision : prévient les appareils ouverts qu'il y a du nouveau ----------

function rev_file(string $name): string
{
    return data_dir() . '/users/' . $name . '.rev';
}

function get_rev(string $name): string
{
    clearstatcache(true, rev_file($name));
    return (string)@file_get_contents(rev_file($name));
}

function bump_rev(string $name): void
{
    @file_put_contents(rev_file($name), uniqid('', true), LOCK_EX);
}

// ---------- HTTP sortant ----------

function http_post(string $url, array $headers, string $body): int
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
        ]);
        curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return $code;
    }
    $ctx = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => implode("\r\n", $headers) . "\r\n",
        'content' => $body,
        'timeout' => 10,
        'ignore_errors' => true,
    ]]);
    @file_get_contents($url, false, $ctx);
    preg_match('#HTTP/\S+ (\d{3})#', $http_response_header[0] ?? '', $m);
    return (int)($m[1] ?? 0);
}

function b64url(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

// ---------- ntfy ----------

function valid_topic(string $topic): bool
{
    return (bool)preg_match('/^[A-Za-z0-9_-]{1,64}$/', $topic);
}

function ntfy_send(string $topic, string $title, string $message): bool
{
    $payload = [
        'topic' => $topic,
        'title' => $title,
        'message' => $message !== '' ? $message : $title,
        'tags' => ['bell'],
        'priority' => 4,
    ];
    if (APP_URL !== '') $payload['click'] = APP_URL;
    $code = http_post(rtrim(NTFY_SERVER, '/') . '/', ['Content-Type: application/json'], json_encode($payload, JSON_UNESCAPED_UNICODE));
    return $code >= 200 && $code < 300;
}

// ---------- Web Push (notifications même appli fermée / en arrière-plan) ----------
// Le serveur envoie une notification "vide" signée (VAPID) ; le service worker du téléphone
// se réveille et va chercher le contenu du rappel via api.php?a=pushpull.

function push_file(string $name): string
{
    return data_dir() . '/users/' . $name . '.push.php';
}

// Clés VAPID générées une fois pour toutes et gardées dans data/.
function vapid_keys(): array
{
    $f = data_dir() . '/vapid.json.php';
    $k = load_file($f);
    if (!empty($k['pem'])) return $k;
    $opts = ['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC];
    $res = @openssl_pkey_new($opts);
    $pem = null;
    if (!$res || !@openssl_pkey_export($res, $pem)) {
        // Certains hébergeurs n'ont pas de openssl.cnf : on en fournit un minimal.
        $cnf = data_dir() . '/openssl.cnf';
        if (!is_file($cnf)) @file_put_contents($cnf, "[req]\ndefault_bits = 2048\ndistinguished_name = dn\n[dn]\n");
        $opts['config'] = $cnf;
        $res = @openssl_pkey_new($opts);
        if (!$res || !@openssl_pkey_export($res, $pem, null, ['config' => $cnf])) return [];
    }
    while (openssl_error_string()) {} // vide la pile d'erreurs OpenSSL
    $d = openssl_pkey_get_details($res);
    $pad = fn($s) => str_pad($s, 32, "\0", STR_PAD_LEFT);
    $new = ['pem' => $pem, 'pub' => b64url("\x04" . $pad($d['ec']['x']) . $pad($d['ec']['y']))];
    update_file($f, function (array &$x) use ($new) {
        if (!empty($x['pem'])) return false; // généré en même temps par une autre requête
        $x = $new;
        return true;
    });
    return load_file($f);
}

// Signature ECDSA : format DER (OpenSSL) → 64 octets r||s (JWT ES256).
function der_to_raw(string $der): string
{
    $pos = 2;
    if (ord($der[1]) & 0x80) $pos += ord($der[1]) & 0x7f;
    $out = '';
    for ($i = 0; $i < 2; $i++) {
        $pos++; // type INTEGER
        $len = ord($der[$pos++]);
        $int = ltrim(substr($der, $pos, $len), "\0");
        $pos += $len;
        $out .= str_pad($int, 32, "\0", STR_PAD_LEFT);
    }
    return $out;
}

// Jeton VAPID (JWT ES256) pour le service de push qui héberge $endpoint.
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
    return http_post($endpoint, [
        'TTL: 3600',
        'Urgency: high',
        'Authorization: vapid t=' . $jwt . ', k=' . $k['pub'],
        'Content-Length: 0',
    ], '');
}

// Met des rappels en file d'attente et réveille tous les appareils abonnés de l'utilisateur.
function push_notify(string $name, array $items): int
{
    $subs = [];
    update_file(push_file($name), function (array &$p) use ($items, &$subs) {
        $lim = time() - 86400;
        $q = array_values(array_filter($p['queue'] ?? [], fn($i) => ($i['ts'] ?? 0) > $lim));
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
        elseif ($code === 404 || $code === 410) $dead[] = $h; // abonnement expiré
    }
    if ($dead) {
        update_file(push_file($name), function (array &$p) use ($dead) {
            foreach ($dead as $h) unset($p['subs'][$h]);
            return true;
        });
    }
    return $ok;
}

// ---------- Rappels (cron.php + déclenchement opportuniste) ----------

function run_reminders(): int
{
    $now = time() * 1000;
    $window = 6 * 3600 * 1000; // on ignore les rappels ratés depuis plus de 6 h
    $sent = 0;
    foreach (glob(data_dir() . '/users/*.json.php') ?: [] as $file) {
        $name = basename($file, '.json.php');
        $hasPush = !empty(load_file(push_file($name))['subs']);
        $due = [];
        $topic = '';
        $changed = update_file($file, function (array &$st) use ($now, $window, $hasPush, &$due, &$topic) {
            $st = clean_state($st);
            $changed = rollover_tasks($st);
            $topic = trim((string)($st['settings']['ntfy'] ?? ''));
            if (!$hasPush && !valid_topic($topic)) return $changed;
            foreach ($st['tasks'] as $id => $t) {
                if (!is_array($t)) continue;
                $ms = task_due_ms($t);
                if (!$ms || $ms > $now || $ms < $now - $window) continue;
                if ((int)($st['fired'][$id] ?? 0) >= $ms) continue;
                $st['fired'][$id] = $ms;
                $changed = true;
                $due[] = ['id' => (string)$id, 'title' => trim((string)($t['title'] ?? '')) ?: 'Rappel',
                    'body' => trim((string)($t['details'] ?? '')) ?: 'Prévu à ' . ($t['time'] ?? '')];
            }
            return $changed;
        });
        if ($changed) bump_rev($name);
        if (!$due) continue;
        if (valid_topic($topic)) foreach ($due as $d) if (ntfy_send($topic, $d['title'], $d['body'])) $sent++;
        if ($hasPush && push_notify($name, $due)) $sent += count($due);
    }
    return $sent;
}

// Lancé depuis les requêtes des appareils ouverts : au plus une fois par minute.
function maybe_run_reminders(): void
{
    $f = data_dir() . '/.cron';
    if (is_file($f) && time() - filemtime($f) < 55) return;
    $fp = @fopen($f, 'c');
    if (!$fp) return;
    if (flock($fp, LOCK_EX | LOCK_NB)) {
        touch($f);
        run_reminders();
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

// ---------- Images des notes ----------
// Deux fichiers par image : "id" (qualité normale) et "id.t" (miniature très compressée).
// Stockés en .php avec un préfixe "<?php exit;" : jamais lisibles directement depuis le web.

function files_dir(string $name): string
{
    $d = data_dir() . '/files/' . $name;
    if (!is_dir($d)) @mkdir($d, 0770, true);
    return $d;
}

function image_path(string $name, string $id, bool $thumb): string
{
    return files_dir($name) . '/' . $id . ($thumb ? '.t' : '') . '.img.php';
}

function valid_id(string $id): bool
{
    return (bool)preg_match('/^[a-z][a-z0-9]{3,47}$/i', $id);
}

// Type réel du fichier (on ne fait pas confiance à ce qu'annonce le navigateur).
function sniff_image(string $b): ?string
{
    if (strncmp($b, "\xFF\xD8\xFF", 3) === 0) return 'image/jpeg';
    if (strncmp($b, "\x89PNG\r\n\x1a\n", 8) === 0) return 'image/png';
    if (substr($b, 0, 4) === 'RIFF' && substr($b, 8, 4) === 'WEBP') return 'image/webp';
    return null;
}

// Images encore utilisées : par une note (même dans la corbeille) ou gardées dans la galerie.
function used_images(array $st): array
{
    $used = [];
    foreach ($st['notes'] ?? [] as $n) {
        if (!is_array($n) || !empty($n['deleted'])) continue;
        foreach ($n['images'] ?? [] as $im) {
            if (is_array($im) && isset($im['id'])) $used[(string)$im['id']] = true;
        }
    }
    foreach ($st['images'] ?? [] as $id => $im) {
        if (is_array($im) && empty($im['deleted'])) $used[(string)$id] = true;
    }
    return $used;
}

// Images à effacer tout de suite : celles d'une note supprimée définitivement (ou retirées de la galerie)
// pendant cette synchronisation, et que plus rien n'utilise.
function purged_images(array $old, array $new): array
{
    $used = used_images($new);
    $out = [];
    foreach ($old['notes'] ?? [] as $id => $n) {
        if (!is_array($n) || !empty($n['deleted']) || empty($new['notes'][$id]['deleted'])) continue;
        foreach ($n['images'] ?? [] as $im) {
            if (is_array($im) && isset($im['id']) && !isset($used[(string)$im['id']])) $out[] = (string)$im['id'];
        }
    }
    foreach ($old['images'] ?? [] as $id => $im) {
        if (is_array($im) && empty($im['deleted']) && !empty($new['images'][$id]['deleted']) && !isset($used[(string)$id])) $out[] = (string)$id;
    }
    return array_values(array_unique($out));
}

function delete_images(string $name, array $ids): void
{
    foreach ($ids as $id) {
        if (!valid_id($id)) continue;
        foreach ([false, true] as $thumb) { $f = image_path($name, $id, $thumb); if (is_file($f)) @unlink($f); }
    }
}

// Supprime les images qui ne sont plus utilisées (retirées d'une note : 7 jours de délai de grâce, pour « Annuler »).
function gc_images(string $name, array $st): void
{
    $used = used_images($st);
    foreach (glob(files_dir($name) . '/*.img.php') ?: [] as $f) {
        $id = preg_replace('/(\.t)?\.img\.php$/', '', basename($f));
        if (!isset($used[$id]) && filemtime($f) < time() - 7 * 86400) @unlink($f);
    }
}

// ---------- Aperçu des liens ----------
// Le serveur lit la page du lien (titre, description, image) à la place du navigateur, qui ne le peut pas (CORS).
// Protections : http(s) uniquement, adresses publiques seulement (jamais le réseau local du serveur),
// 3 redirections au plus, 5 s et 600 Ko maximum. Résultat gardé 7 jours.

function public_ip_of(string $host): ?string
{
    if (filter_var($host, FILTER_VALIDATE_IP)) $ips = [$host];
    else {
        $ips = gethostbynamel($host) ?: [];
        foreach (@dns_get_record($host, DNS_AAAA) ?: [] as $r) if (!empty($r['ipv6'])) $ips[] = $r['ipv6'];
    }
    if (!$ips) return null;
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return null;
    }
    return $ips[0];
}

function fetch_page(string $url): ?array
{
    if (!function_exists('curl_init')) return null;
    for ($hop = 0; $hop < 4; $hop++) {
        $p = parse_url($url);
        $scheme = strtolower($p['scheme'] ?? '');
        $host = $p['host'] ?? '';
        if (!in_array($scheme, ['http', 'https'], true) || $host === '' || isset($p['user'])) return null;
        $port = (int)($p['port'] ?? ($scheme === 'https' ? 443 : 80));
        if (!in_array($port, [80, 443, 8080, 8443], true)) return null;
        $ip = public_ip_of(trim($host, '[]'));
        if ($ip === null) return null;
        $body = '';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RESOLVE => [$host . ':' . $port . ':' . (strpos($ip, ':') !== false ? '[' . $ip . ']' : $ip)], // pas de changement d'adresse entre vérification et connexion
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; CarnetApercu/1.0)',
            CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml', 'Accept-Language: fr,en;q=0.8'],
            CURLOPT_ENCODING => '',
            CURLOPT_HEADER => false,
            CURLOPT_WRITEFUNCTION => function ($ch, $chunk) use (&$body) {
                $body .= $chunk;
                return strlen($body) > 600000 ? 0 : strlen($chunk); // stoppe au-delà de 600 Ko
            },
        ]);
        curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $type = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $loc = (string)curl_getinfo($ch, CURLINFO_REDIRECT_URL);
        curl_close($ch);
        if ($code >= 300 && $code < 400 && $loc !== '') { $url = $loc; continue; }
        if ($code < 200 || $code >= 300 || $body === '') return null;
        return ['url' => $url, 'type' => $type, 'body' => $body];
    }
    return null;
}

function abs_url(string $u, string $base): string
{
    $u = trim($u);
    if ($u === '' || preg_match('#^https?://#i', $u)) return $u;
    $b = parse_url($base);
    $root = ($b['scheme'] ?? 'https') . '://' . ($b['host'] ?? '') . (isset($b['port']) ? ':' . $b['port'] : '');
    if (strpos($u, '//') === 0) return ($b['scheme'] ?? 'https') . ':' . $u;
    if ($u[0] === '/') return $root . $u;
    $dir = preg_replace('#/[^/]*$#', '/', $b['path'] ?? '/');
    return $root . $dir . $u;
}

function link_preview(string $url): array
{
    if (strlen($url) > 2000 || !preg_match('#^https?://#i', $url)) return ['error' => 'Lien invalide'];
    $cf = data_dir() . '/linkcache';
    if (!is_dir($cf)) @mkdir($cf, 0770, true);
    $file = $cf . '/' . sha1($url) . '.json.php';
    if (is_file($file) && filemtime($file) > time() - 7 * 86400) return load_file($file);

    $out = ['url' => $url];
    $page = fetch_page($url);
    if ($page && stripos($page['type'], 'html') !== false) {
        $html = $page['body'];
        $head = preg_split('#</head>#i', $html)[0];
        // Encodage : converti en UTF-8 si la page en annonce un autre.
        $cs = '';
        if (preg_match('/charset=([\w-]+)/i', $page['type'], $m) || preg_match('/<meta[^>]+charset=["\']?([\w-]+)/i', $head, $m)) $cs = strtoupper($m[1]);
        if ($cs && $cs !== 'UTF-8' && function_exists('mb_convert_encoding')) $head = @mb_convert_encoding($head, 'UTF-8', $cs) ?: $head;
        $meta = [];
        if (preg_match_all('#<meta\s[^>]*>#i', $head, $tags)) {
            foreach ($tags[0] as $t) {
                if (!preg_match('#(?:property|name)\s*=\s*["\']([^"\']+)#i', $t, $k) || !preg_match('#content\s*=\s*("([^"]*)"|\'([^\']*)\')#i', $t, $v)) continue;
                $meta[strtolower($k[1])] ??= $v[2] !== '' ? $v[2] : ($v[3] ?? '');
            }
        }
        $dec = fn($s) => trim(preg_replace('/\s+/u', ' ', html_entity_decode((string)$s, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
        $title = $meta['og:title'] ?? $meta['twitter:title'] ?? (preg_match('#<title[^>]*>(.*?)</title>#is', $head, $m) ? $m[1] : '');
        $out['title'] = mb_substr($dec($title), 0, 200);
        $out['desc'] = mb_substr($dec($meta['og:description'] ?? $meta['twitter:description'] ?? $meta['description'] ?? ''), 0, 300);
        $out['site'] = mb_substr($dec($meta['og:site_name'] ?? ''), 0, 80);
        $img = $dec($meta['og:image'] ?? $meta['og:image:url'] ?? $meta['twitter:image'] ?? '');
        if ($img !== '') $out['image'] = abs_url($img, $page['url']);
        if (preg_match('#<link[^>]+rel=["\'][^"\']*icon[^"\']*["\'][^>]*>#i', $head, $l) && preg_match('#href=["\']([^"\']+)#i', $l[0], $h)) {
            $out['icon'] = abs_url($dec($h[1]), $page['url']);
        }
    }
    if (empty($out['title'])) $out['title'] = '';
    @file_put_contents($file, GUARD . json_encode($out, JSON_UNESCAPED_UNICODE), LOCK_EX);
    return $out;
}

