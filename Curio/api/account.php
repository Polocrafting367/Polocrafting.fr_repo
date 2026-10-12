<?php
// Comptes et sauvegarde du profil Curio (sujets, apprentissage, bibliothèque...).
declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_out(['error' => 'POST uniquement'], 405);

$raw = (string)file_get_contents('php://input');
if (strlen($raw) > MAX_PROFILE + 10000) json_out(['error' => 'Profil trop volumineux'], 413);
$in = json_decode($raw, true);
if (!is_array($in)) $in = [];
// Réponse JSON contenant un profil brut (texte déjà encodé, objets vides préservés).
function out_profile(array $head, ?string $json): void
{
    $s = json_encode($head, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    echo substr($s, 0, -1) . ',"profile":' . ($json ?? 'null') . '}';
    exit;
}

switch ($_GET['a'] ?? '') {

    // Public : l'inscription demande-t-elle un code ?
    case 'signup':
        json_out(['open' => !empty(server_settings()['openSignup'])]);

    case 'register':
        $name = norm_user($in['user'] ?? '');
        $pass = (string)($in['pass'] ?? '');
        $code = trim((string)($in['code'] ?? ''));
        if (!valid_user($name)) json_out(['error' => 'Pseudo invalide : 2 à 32 caractères, commence par une lettre (lettres, chiffres, . _ -)'], 400);
        if (strlen($pass) < 6) json_out(['error' => 'Mot de passe trop court (6 caractères minimum)'], 400);
        $tok = bin2hex(random_bytes(32));
        $add = function (array $extra) use ($name, $pass, $tok) {
            return (bool)update_file(users_file(), function (array &$users) use ($name, $pass, $tok, $extra) {
                if (isset($users[$name])) return false;
                $users[$name] = ['hash' => password_hash($pass, PASSWORD_DEFAULT), 'created' => time(), 'tokens' => [hash('sha256', $tok) => time()]] + $extra;
                return true;
            });
        };
        // Code administrateur, inscription libre, ou code d'invitation créé par l'administrateur.
        if ($code !== '' && hash_equals(INVITE_CODE, $code)) $ok = $add(['admin' => true, 'code' => 'admin']);
        elseif ($code === '' && !empty(server_settings()['openSignup'])) $ok = $add(['code' => 'libre']);
        elseif ($code === '') json_out(['error' => 'Inscription sur invitation : entre ton code', 'needCode' => true], 403);
        else {
            $c = norm_code($code);
            $bad = false;
            $ok = update_file(codes_file(), function (array &$codes) use ($c, $add, $name, &$bad) {
                $k = $codes[$c] ?? null;
                if (!$k || !empty($k['disabled']) || (($k['type'] ?? 'single') === 'single' && !empty($k['uses']))) { $bad = true; return false; }
                if (!$add(['code' => $c])) return false;
                $codes[$c]['uses'][] = ['user' => $name, 'at' => time()];
                return true;
            });
            if ($bad) { sleep(1); json_out(['error' => "Code d'invitation incorrect ou déjà utilisé"], 403); }
        }
        if (!$ok) json_out(['error' => 'Ce pseudo est déjà pris'], 409);
        set_auth_cookie($tok);
        json_out(['ok' => true, 'user' => $name, 'tok' => $tok]);

    case 'login':
        $name = norm_user($in['user'] ?? '');
        $u = load_file(users_file())[$name] ?? null;
        if (!$u || !password_verify((string)($in['pass'] ?? ''), (string)$u['hash'])) {
            sleep(1);
            json_out(['error' => 'Pseudo ou mot de passe incorrect'], 401);
        }
        if (!empty($u['disabled'])) json_out(['error' => 'Ce compte est désactivé'], 403);
        $tok = bin2hex(random_bytes(32));
        add_token($name, $tok);
        set_auth_cookie($tok);
        json_out(['ok' => true, 'user' => $name, 'tok' => $tok]);

    case 'me':
        $name = current_user();
        if ($name === null) json_out(['user' => null]);
        $u = [];
        update_file(users_file(), function (array &$users) use ($name, &$u) { $users[$name]['seen'] = time(); $u = $users[$name]; return true; });
        json_out(['user' => $name, 'updated' => profile_read($name)['updated'], 'rev' => get_rev($name), 'admin' => is_admin($name), 'mustChange' => !empty($u['mustChange'])]);

    // Attente longue : répond dès qu'un autre appareil a sauvegardé (révision changée), sinon après ~25 s.
    case 'wait':
        $name = require_user();
        $known = (string)($in['rev'] ?? '');
        @set_time_limit(45);
        $end = microtime(true) + 25;
        do {
            $rev = get_rev($name);
            if ($rev !== $known) break;
            usleep(300000);
        } while (microtime(true) < $end);
        json_out(['rev' => $rev]);

    case 'load':
        $name = require_user();
        $p = profile_read($name);
        out_profile(['user' => $name, 'updated' => $p['updated']], $p['json']);

    case 'save':
        $name = require_user();
        // Décodage en objets : {} reste {} (voir profile_read).
        $obj = json_decode($raw);
        $profile = is_object($obj) && isset($obj->profile) && is_object($obj->profile) ? $obj->profile : null;
        $updated = (int)($in['updated'] ?? 0);
        if ($profile === null) json_out(['error' => 'Profil manquant'], 400);
        $json = json_encode($profile, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        // Un autre appareil a sauvegardé une version plus récente : on la renvoie, l'app fusionne les deux et renvoie le tout.
        $cur = profile_write($name, $updated, $json);
        if ($cur !== null) out_profile(['ok' => false, 'stale' => true, 'updated' => $cur['updated']], $cur['json']);
        bump_rev($name);
        json_out(['ok' => true, 'stale' => false, 'updated' => $updated, 'rev' => get_rev($name)]);

    // Sauvegardes du profil : liste, puis restauration d'une version (elle devient la plus récente, fusionnée par l'app).
    case 'backups':
        $name = require_user();
        $out = [];
        foreach (array_reverse(glob(backup_dir($name) . '/*.json.php') ?: []) as $f) {
            $p = profile_parse((string)file_get_contents($f));
            $out[] = ['id' => basename($f, '.json.php'), 't' => filemtime($f), 'updated' => $p['updated']] + profile_stats($p['json']);
        }
        json_out(['backups' => $out]);

    case 'backup':
        $name = require_user();
        $id = preg_replace('/[^0-9a-z-]/', '', (string)($in['id'] ?? ''));
        $f = backup_dir($name) . '/' . $id . '.json.php';
        if ($id === '' || !is_file($f)) json_out(['error' => 'Sauvegarde introuvable'], 404);
        $p = profile_parse((string)file_get_contents($f));
        out_profile(['ok' => true, 'updated' => $p['updated']], $p['json']);

    case 'logout':
        $tok = current_token();
        if ($tok !== null) {
            $h = hash('sha256', $tok);
            update_file(users_file(), function (array &$users) use ($h) {
                foreach ($users as &$u) unset($u['tokens'][$h]);
                return true;
            });
        }
        clear_auth_cookie();
        json_out(['ok' => true]);

    case 'password':
        $name = require_user();
        $new = (string)($in['new'] ?? '');
        if (strlen($new) < 6) json_out(['error' => 'Mot de passe trop court (6 caractères minimum)'], 400);
        $u = load_file(users_file())[$name] ?? [];
        if (!password_verify((string)($in['old'] ?? ''), (string)($u['hash'] ?? ''))) { sleep(1); json_out(['error' => 'Mot de passe actuel incorrect'], 403); }
        update_file(users_file(), function (array &$users) use ($name, $new) { $users[$name]['hash'] = password_hash($new, PASSWORD_DEFAULT); unset($users[$name]['mustChange']); return true; });
        json_out(['ok' => true]);

    case 'delete':
        $name = require_user();
        $u = load_file(users_file())[$name] ?? [];
        if (!password_verify((string)($in['pass'] ?? ''), (string)($u['hash'] ?? ''))) { sleep(1); json_out(['error' => 'Mot de passe incorrect'], 403); }
        update_file(users_file(), function (array &$users) use ($name) { unset($users[$name]); return true; });
        @unlink(profile_file($name));
        @unlink(rev_file($name));
        clear_auth_cookie();
        json_out(['ok' => true]);

    // ----- Administration : comptes, inscription, codes d'invitation -----
    case 'admin':
        require_admin();
        $users = load_file(users_file());
        $now = time();
        $acc = [];
        foreach ($users as $n => $u) {
            $n = (string)$n;
            $p = profile_read($n);
            $acc[] = ['user' => $n, 'created' => (int)($u['created'] ?? 0), 'lastSeen' => user_last_seen($u), 'devices' => count($u['tokens'] ?? []),
                'admin' => is_admin($n, $users), 'disabled' => !empty($u['disabled']), 'code' => (string)($u['code'] ?? ''),
                'size' => $p['json'] ? strlen($p['json']) : 0, 'updated' => $p['updated']];
        }
        usort($acc, function ($a, $b) { return $b['lastSeen'] <=> $a['lastSeen']; });
        $codes = [];
        foreach (load_file(codes_file()) as $c => $k) $codes[] = ['code' => (string)$c, 'type' => $k['type'] ?? 'single', 'label' => (string)($k['label'] ?? ''),
            'created' => (int)($k['created'] ?? 0), 'disabled' => !empty($k['disabled']), 'uses' => array_values($k['uses'] ?? [])];
        usort($codes, function ($a, $b) { return $b['created'] <=> $a['created']; });
        $active = function (int $d) use ($acc, $now) { return count(array_filter($acc, function ($a) use ($d, $now) { return $a['lastSeen'] > $now - $d * 86400; })); };
        json_out(['accounts' => $acc, 'codes' => $codes, 'openSignup' => !empty(server_settings()['openSignup']),
            'stats' => ['accounts' => count($acc), 'active1' => $active(1), 'active7' => $active(7), 'active30' => $active(30)]]);

    case 'adminsettings':
        require_admin();
        update_file(data_dir() . '/server.json.php', function (array &$st) use ($in) {
            if (array_key_exists('openSignup', $in)) $st['openSignup'] = !empty($in['openSignup']);
            return true;
        });
        json_out(['ok' => true] + server_settings());

    // Action sur un compte : mot de passe provisoire, déconnexion, rôle, blocage, suppression.
    case 'adminuser':
        $me = require_admin();
        $who = norm_user($in['user'] ?? '');
        $op = (string)($in['op'] ?? '');
        $res = ['ok' => true];
        $ok = update_file(users_file(), function (array &$users) use ($who, $op, $me, &$res) {
            if (!isset($users[$who])) { $res = ['error' => 'Compte introuvable']; return false; }
            if ($who === $me && in_array($op, ['delete', 'demote', 'disable'], true)) { $res = ['error' => 'Impossible sur ton propre compte']; return false; }
            switch ($op) {
                case 'reset':
                    $abc = 'abcdefghjkmnpqrstuvwxyz23456789';
                    $p = '';
                    for ($i = 0; $i < 10; $i++) $p .= $abc[random_int(0, strlen($abc) - 1)];
                    $users[$who]['hash'] = password_hash($p, PASSWORD_DEFAULT);
                    $users[$who]['tokens'] = [];
                    $users[$who]['mustChange'] = true;
                    $res['password'] = $p;
                    return true;
                case 'logout': $users[$who]['tokens'] = []; return true;
                case 'promote': $users[$who]['admin'] = true; return true;
                case 'demote': unset($users[$who]['admin']); return true;
                case 'disable': $users[$who]['disabled'] = true; $users[$who]['tokens'] = []; return true;
                case 'enable': unset($users[$who]['disabled']); return true;
                case 'delete': unset($users[$who]); return true;
            }
            $res = ['error' => 'Action inconnue'];
            return false;
        });
        if (!$ok) json_out($res, 400);
        if ($op === 'delete') { @unlink(profile_file($who)); @unlink(rev_file($who)); }
        json_out($res);

    case 'codecreate':
        require_admin();
        $type = ($in['type'] ?? '') === 'open' ? 'open' : 'single';
        $label = mb_substr(trim((string)($in['label'] ?? '')), 0, 80);
        $code = '';
        update_file(codes_file(), function (array &$codes) use ($type, $label, &$code) {
            $code = new_code($codes);
            $codes[$code] = ['type' => $type, 'label' => $label, 'created' => time(), 'uses' => []];
            return true;
        });
        json_out(['ok' => true, 'code' => $code]);

    case 'codeupdate':
        require_admin();
        $c = norm_code($in['code'] ?? '');
        $ok = update_file(codes_file(), function (array &$codes) use ($c, $in) {
            if (!isset($codes[$c])) return false;
            if (array_key_exists('disabled', $in)) $codes[$c]['disabled'] = !empty($in['disabled']);
            if (!empty($in['delete'])) unset($codes[$c]);
            return true;
        });
        if (!$ok) json_out(['error' => 'Code introuvable'], 404);
        json_out(['ok' => true]);
}
json_out(['error' => 'Action inconnue'], 400);
