<?php
// Kalima : comptes, synchronisation entre appareils et administration. POST api.php?a=<action>, corps JSON.
declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_out(['error' => 'POST uniquement'], 405);

$raw = (string)file_get_contents('php://input');
if (strlen($raw) > MAX_BODY) json_out(['error' => 'Données trop volumineuses'], 413);
$in = json_decode($raw, true);
if (!is_array($in)) $in = [];

// Nouveau compte (sous verrou) ; $extra : admin, code utilisé, import Curio…
function create_user(string $name, string $hash, string $tok, array $extra): bool
{
    return (bool)update_file(users_file(), function (array &$users) use ($name, $hash, $tok, $extra) {
        if (isset($users[$name])) return false;
        $users[$name] = ['hash' => $hash, 'created' => time(), 'tokens' => [hash('sha256', $tok) => time()]] + $extra;
        return true;
    });
}

// Reprise de la progression Curio (une seule fois, à la création du compte) : déposée dans « import »,
// l'app la convertit avec les nouveaux dictionnaires.
function import_curio(string $name): void
{
    $w = curio_words($name);
    if (!$w) return;
    update_file(state_file($name), function (array &$st) use ($w) {
        $st = clean_state($st);
        $st['settings']['import'] = $w;
        $st['settings']['u'] = 1;
        return true;
    }, 'out_state');
}

switch ($_GET['a'] ?? '') {

    // Public : l'inscription demande-t-elle un code ?
    case 'signup':
        json_out(['open' => !empty(server_settings()['openSignup'])]);

    case 'register':
        $name = norm_user($in['user'] ?? '');
        $pass = (string)($in['pass'] ?? '');
        $code = trim((string)($in['code'] ?? ''));
        if (!valid_user($name)) json_out(['error' => BAD_NAME], 400);
        if (strlen($pass) < 6) json_out(['error' => 'Mot de passe trop court (6 caractères minimum)'], 400);
        $tok = bin2hex(random_bytes(32));
        $hash = password_hash($pass, PASSWORD_DEFAULT);
        $err = null;
        if ($code !== '' && hash_equals(INVITE_CODE, $code)) {
            if (!create_user($name, $hash, $tok, ['admin' => true, 'code' => 'admin'])) $err = ['Ce pseudo est déjà pris', 409];
        } elseif ($code === '' && !empty(server_settings()['openSignup'])) {
            if (!create_user($name, $hash, $tok, ['code' => 'libre'])) $err = ['Ce pseudo est déjà pris', 409];
        } elseif ($code === '') {
            $err = ['Inscription sur invitation : entre ton code', 403];
        } else {
            $c = norm_code($code);
            update_file(codes_file(), function (array &$codes) use ($c, $name, $hash, $tok, &$err) {
                $k = $codes[$c] ?? null;
                if (!$k || !empty($k['disabled']) || (($k['type'] ?? 'single') === 'single' && !empty($k['uses']))) {
                    $err = ["Code d'invitation incorrect ou déjà utilisé", 403];
                    return false;
                }
                if (!create_user($name, $hash, $tok, ['code' => $c])) { $err = ['Ce pseudo est déjà pris', 409]; return false; }
                $codes[$c]['uses'][] = ['user' => $name, 'at' => time()];
                return true;
            });
        }
        if ($err) { if ($err[1] === 403) sleep(1); json_out(['error' => $err[0]], $err[1]); }
        set_auth_cookie($tok);
        json_out(['ok' => true, 'user' => $name, 'tok' => $tok, 'admin' => is_admin($name)]);

    case 'login':
        $name = norm_user($in['user'] ?? '');
        $pass = (string)($in['pass'] ?? '');
        $u = load_file(users_file())[$name] ?? null;
        $tok = bin2hex(random_bytes(32));
        if ($u && !empty($u['disabled'])) {
            sleep(1);
            json_out(['error' => 'Ce compte est désactivé'], 403);
        } elseif ($u && password_verify($pass, (string)$u['hash'])) {
            add_token($name, $tok);
        } elseif (!$u && ($cu = curio_user($name, $pass))) {
            // Ancien compte Curio : même pseudo, même mot de passe.
            if (!create_user($name, (string)$cu['hash'], $tok, ['code' => 'curio'])) json_out(['error' => 'Réessaie dans un instant'], 409);
            import_curio($name);
        } else {
            sleep(1);
            json_out(['error' => 'Pseudo ou mot de passe incorrect'], 401);
        }
        set_auth_cookie($tok);
        json_out(['ok' => true, 'user' => $name, 'tok' => $tok, 'admin' => is_admin($name)]);

    case 'me':
        $name = current_user();
        if ($name === null) json_out(['user' => null]);
        $h = hash('sha256', (string)current_token());
        $devices = 0;
        update_file(users_file(), function (array &$users) use ($name, $h, &$devices) {
            $users[$name]['seen'] = time();
            $users[$name]['tokens'][$h] = time();
            $devices = count($users[$name]['tokens']);
            return true;
        });
        set_auth_cookie((string)current_token()); // prolonge le cookie
        $mustChange = !empty(load_file(users_file())[$name]['mustChange']);
        json_out(['user' => $name, 'admin' => is_admin($name), 'devices' => $devices, 'rev' => get_rev($name), 'mustChange' => $mustChange]);

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

    case 'logoutothers':
        $name = require_user();
        $keep = hash('sha256', (string)current_token());
        update_file(users_file(), function (array &$users) use ($name, $keep) { $users[$name]['tokens'] = [$keep => time()]; return true; });
        json_out(['ok' => true]);

    // Envoi des éléments modifiés sur cet appareil ; réponse : l'état complet fusionné.
    case 'sync':
        $name = require_user();
        $client = is_array($in['state'] ?? null) ? $in['state'] : [];
        $merged = [];
        $changed = update_file(state_file($name), function (array &$st) use ($client, &$merged, $name) {
            $old = clean_state($st);
            $st = merge_state($old, $client);
            $merged = $st;
            if (json_encode($st) === json_encode($old)) return false; // rien de nouveau : pas d'écriture
            backup_state($name, $old, $st);
            return true;
        }, 'out_state');
        if ($changed) bump_rev($name);
        maybe_run_word_pushes(); // au plus une fois par minute, en complément du cron
        json_out(['state' => out_state($merged), 'rev' => get_rev($name)]);

    // ----- Notifications web « mot du jour » (sans l'APK) -----
    case 'vapid':
        $k = vapid_keys();
        if (!$k) json_out(['error' => 'Notifications indisponibles sur ce serveur (OpenSSL).'], 500);
        json_out(['key' => $k['pub']]);

    case 'pushsub':
        $name = require_user();
        $ep = (string)($in['sub']['endpoint'] ?? '');
        if (!preg_match('#^https://#', $ep)) json_out(['error' => 'Abonnement invalide'], 400);
        $h = hash('sha256', $ep);
        // Un navigateur n'appartient qu'à un seul compte à la fois.
        foreach (glob(data_dir('users') . '/*.push.php') ?: [] as $f) {
            if ($f === push_file($name)) continue;
            update_file($f, function (array &$p) use ($h) { if (!isset($p['subs'][$h])) return false; unset($p['subs'][$h]); return true; });
        }
        update_file(push_file($name), function (array &$p) use ($h, $ep) { $p['subs'][$h] = ['endpoint' => $ep, 'created' => time()]; return true; });
        json_out(['ok' => true]);

    case 'pushunsub':
        $name = require_user();
        $h = hash('sha256', (string)($in['endpoint'] ?? ''));
        update_file(push_file($name), function (array &$p) use ($h) { unset($p['subs'][$h]); return true; });
        json_out(['ok' => true]);

    // Appelé par le service worker quand une notification arrive : les mots à afficher.
    case 'pushpull':
        $h = hash('sha256', (string)($in['endpoint'] ?? ''));
        foreach (glob(data_dir('users') . '/*.push.php') ?: [] as $f) {
            $items = null;
            update_file($f, function (array &$p) use ($h, &$items) {
                if (!isset($p['subs'][$h])) return false;
                $items = [];
                $lim = time() - 3600;
                foreach ($p['queue'] ?? [] as $i => $it) {
                    if (($it['ts'] ?? 0) < $lim || !empty($it['pulled'][$h])) continue;
                    $p['queue'][$i]['pulled'][$h] = 1;
                    $items[] = ['id' => $it['id'], 'title' => $it['title'], 'body' => $it['body'], 'url' => $it['url'] ?? ''];
                }
                return true;
            });
            if ($items !== null) json_out(['items' => $items]);
        }
        json_out(['items' => []]);

    case 'pushtest':
        $name = require_user();
        if (empty(load_file(push_file($name))['subs'])) json_out(['error' => 'Aucun navigateur abonné : active d\'abord les notifications sur cet appareil'], 400);
        $st = clean_state(load_file(state_file($name)));
        $l = (string)($in['lang'] ?? 'en');
        $lvl = LEVELS[max(0, min(4, (int)floor((float)($st['langs'][$l]['lv'] ?? 0))))];
        $c = word_card($l, $lvl, (int)date('s') % 7, app_url());
        if (!$c || !push_notify($name, [['id' => 'test-' . time(), 'title' => $c['title'], 'body' => $c['text'], 'url' => $c['url']]])) json_out(['error' => 'Envoi refusé par le service de notification'], 502);
        json_out(['ok' => true]);

    // Attente longue : répond dès que les données changent (autre appareil), sinon après ~25 s.
    case 'wait':
        $name = require_user();
        $known = (string)($in['rev'] ?? '');
        @set_time_limit(45);
        if (function_exists('session_write_close')) @session_write_close();
        $end = microtime(true) + 25;
        do {
            $rev = get_rev($name);
            if ($rev !== $known) break;
            usleep(300000);
        } while (microtime(true) < $end);
        json_out(['rev' => $rev]);

    case 'backups':
        $name = require_user();
        $out = [];
        foreach (array_reverse(glob(backup_dir($name) . '/*.json.php') ?: []) as $f) {
            $out[] = ['id' => basename($f, '.json.php'), 't' => filemtime($f)] + state_stats(load_file($f));
        }
        json_out(['backups' => $out]);

    // Restauration : la sauvegarde est fusionnée avec l'état actuel (rien de récent n'est perdu),
    // sauf avec « replace » où elle remplace tout (l'état actuel est d'abord sauvegardé).
    case 'restore':
        $name = require_user();
        $id = preg_replace('/[^0-9a-z-]/', '', (string)($in['id'] ?? ''));
        $f = backup_dir($name) . '/' . $id . '.json.php';
        if ($id === '' || !is_file($f)) json_out(['error' => 'Sauvegarde introuvable'], 404);
        $bk = load_file($f);
        $merged = [];
        update_file(state_file($name), function (array &$st) use ($bk, $in, &$merged, $name) {
            $old = clean_state($st);
            @file_put_contents(backup_dir($name) . '/' . date('Ymd-His') . '-avant-restauration.json.php', GUARD . json_encode(out_state($old), JSON_UNESCAPED_UNICODE), LOCK_EX);
            if (!empty($in['replace'])) {
                // Les éléments restaurés deviennent les plus récents : ils l'emportent aussi sur les autres appareils.
                $now = (int)(microtime(true) * 1000);
                $st = clean_state($bk);
                $st['settings']['u'] = $now;
                foreach (MAPS as $k) foreach ($st[$k] as $i => $v) $st[$k][$i]['u'] = $now;
                foreach ($old['items'] as $i => $v) if (!isset($st['items'][$i])) $st['items'][$i] = ['u' => $now, 'del' => 1];
                foreach ($old['xp'] as $dev => $days) foreach ($days as $d => $n) $st['xp'][$dev][$d] = max($n, $st['xp'][$dev][$d] ?? 0);
            } else $st = merge_state($old, $bk);
            $merged = $st;
            return true;
        }, 'out_state');
        bump_rev($name);
        json_out(['ok' => true, 'state' => out_state($merged), 'rev' => get_rev($name)]);

    case 'password':
        $name = require_user();
        $new = (string)($in['new'] ?? '');
        if (strlen($new) < 6) json_out(['error' => 'Nouveau mot de passe trop court (6 caractères minimum)'], 400);
        $keep = hash('sha256', (string)current_token());
        $ok = update_file(users_file(), function (array &$users) use ($name, $in, $new, $keep) {
            if (!password_verify((string)($in['old'] ?? ''), (string)($users[$name]['hash'] ?? ''))) return false;
            $users[$name]['hash'] = password_hash($new, PASSWORD_DEFAULT);
            unset($users[$name]['mustChange']);
            if (!empty($in['others'])) $users[$name]['tokens'] = [$keep => time()];
            return true;
        });
        if (!$ok) { sleep(1); json_out(['error' => 'Mot de passe actuel incorrect'], 403); }
        json_out(['ok' => true]);

    case 'rename':
        $name = require_user();
        $new = norm_user($in['user'] ?? '');
        if (!valid_user($new)) json_out(['error' => BAD_NAME], 400);
        if ($new === $name) json_out(['ok' => true, 'user' => $name]);
        $err = null;
        update_file(users_file(), function (array &$users) use ($name, $new, &$err) {
            if (isset($users[$new]) || is_file(state_file($new))) { $err = 'Ce pseudo est déjà pris'; return false; }
            foreach ([state_file($name) => state_file($new), rev_file($name) => rev_file($new)] as $a => $b) if (is_file($a)) @rename($a, $b);
            if (is_dir(DATA_DIR . '/backups/' . $name)) @rename(DATA_DIR . '/backups/' . $name, DATA_DIR . '/backups/' . $new);
            $users[$new] = $users[$name];
            unset($users[$name]);
            return true;
        });
        if ($err) json_out(['error' => $err], 409);
        json_out(['ok' => true, 'user' => $new]);

    case 'deleteaccount':
        $name = require_user();
        $ok = update_file(users_file(), function (array &$users) use ($name, $in) {
            if (!password_verify((string)($in['pass'] ?? ''), (string)($users[$name]['hash'] ?? ''))) return false;
            unset($users[$name]);
            return true;
        });
        if (!$ok) { sleep(1); json_out(['error' => 'Mot de passe incorrect'], 403); }
        foreach ([state_file($name), rev_file($name)] as $f) if (is_file($f)) @unlink($f);
        clear_auth_cookie();
        json_out(['ok' => true]);

    // ----- Administration -----
    case 'admin':
        require_admin();
        $users = load_file(users_file());
        $now = time();
        $acc = [];
        foreach ($users as $n => $u) {
            $n = (string)$n;
            $st = is_file(state_file($n)) ? load_file(state_file($n)) : [];
            $langs = array_keys(clean_state($st)['langs']);
            $acc[] = ['user' => $n, 'created' => (int)($u['created'] ?? 0), 'lastSeen' => user_last_seen($u), 'devices' => count($u['tokens'] ?? []),
                'code' => (string)($u['code'] ?? ''), 'admin' => is_admin($n, $users), 'disabled' => !empty($u['disabled']), 'langs' => $langs] + state_stats($st);
        }
        usort($acc, fn($a, $b) => $b['lastSeen'] <=> $a['lastSeen']);
        $codes = [];
        foreach (load_file(codes_file()) as $c => $k) {
            $codes[] = ['code' => (string)$c, 'type' => $k['type'] ?? 'single', 'label' => (string)($k['label'] ?? ''), 'created' => (int)($k['created'] ?? 0),
                'by' => (string)($k['by'] ?? ''), 'disabled' => !empty($k['disabled']), 'uses' => array_values($k['uses'] ?? [])];
        }
        usort($codes, fn($a, $b) => $b['created'] <=> $a['created']);
        $active = fn(int $days) => count(array_filter($acc, fn($a) => $a['lastSeen'] > $now - $days * 86400));
        $cf = data_dir() . '/.cron-ext';
        json_out(['cronAge' => is_file($cf) ? time() - filemtime($cf) : null, 'accounts' => $acc, 'codes' => $codes, 'openSignup' => !empty(server_settings()['openSignup']),
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
            if (!isset($users[$who])) return false;
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
        if (!$ok) json_out(isset($res['error']) ? $res : ['error' => 'Compte introuvable'], 400);
        if ($op === 'delete') foreach ([state_file($who), rev_file($who)] as $f) if (is_file($f)) @unlink($f);
        json_out($res);

    case 'codecreate':
        $by = require_admin();
        $type = ($in['type'] ?? '') === 'open' ? 'open' : 'single';
        $label = mb_substr(trim((string)($in['label'] ?? '')), 0, 80);
        $code = '';
        update_file(codes_file(), function (array &$codes) use ($type, $label, $by, &$code) {
            $code = new_code($codes);
            $codes[$code] = ['type' => $type, 'label' => $label, 'created' => time(), 'by' => $by, 'uses' => []];
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
