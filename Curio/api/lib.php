<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
date_default_timezone_set(TIMEZONE);

// Préfixe de chaque fichier de données : empêche leur lecture via le navigateur.
const GUARD = "<?php exit; ?>\n";

function json_out($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function data_dir(string $sub = ''): string
{
    $dir = DATA_DIR . ($sub ? '/' . $sub : '');
    if (!is_dir($dir) && !@mkdir($dir, 0770, true)) {
        error_log('[curio] impossible de créer ' . $dir);
        json_out(['error' => 'Service momentanément indisponible.'], 500);
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

// Lecture + modification + écriture sous verrou. Si $fn renvoie false, rien n'est écrit.
function update_file(string $path, callable $fn)
{
    $fp = fopen($path, 'c+');
    if (!$fp) json_out(['error' => 'Service momentanément indisponible.'], 500);
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

// ---------- Profils ----------
// Le profil est gardé tel quel en JSON : surtout pas de json_decode(..., true), qui change les objets vides {}
// en tableaux [] ; côté app, des points ou des mots écrits ensuite dans un « tableau » disparaissaient à l'enregistrement.

/** ['updated' => int, 'json' => string|null] : date et profil (texte JSON brut). */
function profile_read(string $name): array
{
    $path = profile_file($name);
    if (!is_file($path)) return ['updated' => 0, 'json' => null];
    $fp = fopen($path, 'r');
    if (!$fp) return ['updated' => 0, 'json' => null];
    flock($fp, LOCK_SH);
    $raw = (string)stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return profile_parse($raw);
}

function profile_parse(string $raw): array
{
    if (strncmp($raw, GUARD, strlen(GUARD)) === 0) $raw = substr($raw, strlen(GUARD));
    $d = json_decode($raw);
    if (!is_object($d)) return ['updated' => 0, 'json' => null];
    $json = isset($d->profile) && is_object($d->profile) ? json_encode($d->profile, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
    return ['updated' => (int)($d->updated ?? 0), 'json' => $json];
}

/** Enregistre si $updated est au moins aussi récent que la version du serveur. Renvoie la version du serveur si elle gagne. */
function profile_write(string $name, int $updated, string $json): ?array
{
    $fp = fopen(profile_file($name), 'c+');
    if (!$fp) json_out(['error' => 'Service momentanément indisponible.'], 500);
    flock($fp, LOCK_EX);
    $cur = profile_parse((string)stream_get_contents($fp));
    if ($cur['updated'] > $updated) { flock($fp, LOCK_UN); fclose($fp); return $cur; }
    if ($cur['json'] !== null) {
        $a = profile_stats($cur['json']); $b = profile_stats($json);
        if ($b['saved'] < $a['saved'] || $b['topics'] < $a['topics'] || $b['reads'] + 20 < $a['reads']) {
            @file_put_contents(backup_dir($name) . '/' . date('Ymd-His') . '-avant-perte.json.php', GUARD . '{"updated":' . $cur['updated'] . ',"profile":' . $cur['json'] . '}', LOCK_EX);
        } else profile_backup($name, $cur);
    }
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, GUARD . '{"updated":' . $updated . ',"profile":' . $json . '}');
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return null;
}

// ---------- Sauvegardes des profils ----------
// Avant chaque écrasement, au plus une copie toutes les 3 h (30 gardées, soit plusieurs jours d'historique),
// et toujours une copie si la nouvelle version a moins d'articles gardés, de sujets ou de lectures que l'ancienne.
function backup_dir(string $name): string { return data_dir('backups/' . $name); }

function profile_stats(?string $json): array
{
    $p = $json ? json_decode($json, true) : null;
    $n = function ($k) use ($p) { return is_array($p[$k] ?? null) ? count($p[$k]) : 0; };
    return ['saved' => $n('saved'), 'liked' => $n('liked'), 'reads' => $n('history'), 'topics' => $n('interests')];
}

function profile_backup(string $name, array $cur, ?string $next = null): void
{
    $dir = backup_dir($name);
    $files = glob($dir . '/*.json.php') ?: [];
    sort($files);
    $last = $files ? filemtime(end($files)) : 0;
    if (time() - $last < 3 * 3600) return;
    @file_put_contents($dir . '/' . date('Ymd-His') . '.json.php', GUARD . '{"updated":' . $cur['updated'] . ',"profile":' . $cur['json'] . '}', LOCK_EX);
    foreach (array_slice($files, 0, max(0, count($files) + 1 - 30)) as $old) @unlink($old);
}

function users_file(): string { return data_dir() . '/users.json.php'; }
function profile_file(string $name): string { return data_dir('profiles') . '/' . $name . '.json.php'; }

function norm_user($name): string { return strtolower(trim((string)$name)); }
function valid_user(string $name): bool { return (bool)preg_match('/^[a-z][a-z0-9._-]{1,31}$/', $name); }

function cookie_opts(int $expires): array
{
    $path = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') . '/';
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    return ['expires' => $expires, 'path' => $path, 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax'];
}
function set_auth_cookie(string $tok): void { setcookie(COOKIE_NAME, $tok, cookie_opts(time() + 3650 * 86400)); }
function clear_auth_cookie(): void { setcookie(COOKIE_NAME, '', cookie_opts(time() - 3600)); }

function current_token(): ?string
{
    // Cookie, ou à défaut l'en-tête X-Curio-Token : la WebView Android perd parfois ses cookies quand l'app est tuée.
    $tok = $_COOKIE[COOKIE_NAME] ?? ($_SERVER['HTTP_X_CURIO_TOKEN'] ?? '');
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
    if ($u === null) json_out(['error' => 'Non connecté'], 401);
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

// ---------- Temps réel : « révision » du profil, changée à chaque sauvegarde ----------
// Les appareils ouverts attendent sur account.php?a=wait, qui répond dès que la révision change (comme Carnet).
function rev_file(string $name): string { return data_dir('profiles') . '/' . $name . '.rev'; }
function get_rev(string $name): string { clearstatcache(true, rev_file($name)); return (string)@file_get_contents(rev_file($name)); }
function bump_rev(string $name): void { @file_put_contents(rev_file($name), uniqid('', true), LOCK_EX); }

// ---------- Administration ----------
function is_admin(string $name, ?array $users = null): bool
{
    $users = $users ?? load_file(users_file());
    $u = $users[$name] ?? null;
    if (!$u) return false;
    if (!empty($u['admin'])) return true;
    if (ADMIN_USERS) return in_array($name, ADMIN_USERS, true);
    uasort($users, function ($a, $b) { return ($a['created'] ?? 0) <=> ($b['created'] ?? 0); });
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
function user_last_seen(array $u): int
{
    $t = (int)($u['seen'] ?? 0);
    foreach ($u['tokens'] ?? [] as $ts) $t = max($t, (int)$ts);
    return $t ?: (int)($u['created'] ?? 0);
}
// Codes d'invitation : 'single' (une fois) ou 'open' (sans limite).
function codes_file(): string { return data_dir() . '/codes.json.php'; }
function norm_code($code): string { return preg_replace('/[^A-Z0-9]/', '', strtoupper((string)$code)); }
function new_code(array $codes): string
{
    $abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    do { $c = ''; for ($i = 0; $i < 8; $i++) $c .= $abc[random_int(0, strlen($abc) - 1)]; } while (isset($codes[$c]));
    return $c;
}
