<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

// Lecture d'une image (GET, mise en cache longue durée : le contenu d'un identifiant ne change jamais).
if (($_GET['a'] ?? '') === 'file') {
    $name = current_user();
    $id = (string)($_GET['id'] ?? '');
    if ($name === null || !valid_id($id)) { http_response_code($name === null ? 401 : 400); exit; }
    $f = image_path($name, $id, ($_GET['v'] ?? '') === 't');
    if (!is_file($f)) { http_response_code(404); header('Cache-Control: no-store'); exit; }
    $raw = substr((string)file_get_contents($f), strlen(GUARD));
    $nl = strpos($raw, "\n");
    header('Content-Type: ' . substr($raw, 0, $nl));
    header('Cache-Control: private, max-age=31536000, immutable');
    header('X-Content-Type-Options: nosniff');
    echo substr($raw, $nl + 1);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_out(['error' => 'POST uniquement'], 405);

$raw = (string)file_get_contents('php://input');
$in = ($_GET['a'] ?? '') === 'upload' ? [] : json_decode($raw, true);
if (!is_array($in)) $in = [];

switch ($_GET['a'] ?? '') {

    case 'register':
        $name = norm_user($in['user'] ?? '');
        $pass = (string)($in['pass'] ?? '');
        $code = (string)($in['code'] ?? '');
        if (!valid_user($name)) {
            json_out(['error' => 'Nom invalide : 2 à 32 caractères, commence par une lettre (lettres, chiffres, . _ -)'], 400);
        }
        if (strlen($pass) < 6) json_out(['error' => 'Mot de passe trop court (6 caractères minimum)'], 400);

        $tok = bin2hex(random_bytes(32));
        $newUser = fn(array $extra) => [
            'hash' => password_hash($pass, PASSWORD_DEFAULT),
            'created' => time(),
            'tokens' => [hash('sha256', $tok) => time()],
        ] + $extra;
        $err = null;
        if (hash_equals(INVITE_CODE, $code)) {
            // Code de config.php : compte administrateur.
            $ok = update_file(users_file(), function (array &$users) use ($name, $newUser) {
                if (isset($users[$name])) return false;
                $users[$name] = $newUser(['admin' => true, 'code' => 'admin']);
                return true;
            });
            if (!$ok) $err = ['Ce nom est déjà pris', 409];
        } elseif (trim($code) === '' && !empty(server_settings()['openSignup'])) {
            // Inscription libre activée par l'administrateur : pas besoin de code.
            $ok = update_file(users_file(), function (array &$users) use ($name, $newUser) {
                if (isset($users[$name])) return false;
                $users[$name] = $newUser(['code' => 'libre']);
                return true;
            });
            if (!$ok) $err = ['Ce nom est déjà pris', 409];
        } else {
            // Code généré par l'administrateur : vérifié et compté sous verrou, avec la création du compte.
            $c = norm_code($code);
            update_file(codes_file(), function (array &$codes) use ($c, $name, $newUser, &$err) {
                $k = $codes[$c] ?? null;
                if ($c === '' || !$k || !empty($k['disabled']) || (($k['type'] ?? 'single') === 'single' && !empty($k['uses']))) {
                    $err = ["Code d'invitation incorrect ou déjà utilisé", 403];
                    return false;
                }
                $ok = update_file(users_file(), function (array &$users) use ($name, $newUser, $c) {
                    if (isset($users[$name])) return false;
                    $users[$name] = $newUser(['code' => $c]);
                    return true;
                });
                if (!$ok) { $err = ['Ce nom est déjà pris', 409]; return false; }
                $codes[$c]['uses'][] = ['user' => $name, 'at' => time()];
                return true;
            });
        }
        if ($err) {
            if ($err[1] === 403) sleep(1);
            json_out(['error' => $err[0]], $err[1]);
        }
        set_auth_cookie($tok);
        json_out(['ok' => true, 'user' => $name]);

    // Public : l'écran d'inscription demande-t-il un code ?
    case 'signup':
        json_out(['open' => !empty(server_settings()['openSignup'])]);

    case 'login':
        $name = norm_user($in['user'] ?? '');
        $pass = (string)($in['pass'] ?? '');
        $u = load_file(users_file())[$name] ?? null;
        if (!$u || !password_verify($pass, (string)$u['hash'])) {
            sleep(1);
            json_out(['error' => 'Identifiant ou mot de passe incorrect'], 401);
        }
        $tok = bin2hex(random_bytes(32));
        add_token($name, $tok);
        set_auth_cookie($tok);
        json_out(['ok' => true, 'user' => $name]);

    case 'me':
        $name = require_user();
        $h = hash('sha256', (string)current_token());
        $info = [];
        update_file(users_file(), function (array &$users) use ($name, $h, &$info) {
            $u = &$users[$name];
            $now = time();
            // Nouvelle session si plus de 30 min d'inactivité : on garde la précédente.
            if ($now - (int)($u['seen'] ?? 0) > 1800) $u['prevSeen'] = (int)($u['seen'] ?? 0);
            $u['seen'] = $now;
            $u['tokens'][$h] = $now;
            $info = ['lastSeen' => (int)($u['prevSeen'] ?? 0), 'devices' => count($u['tokens'])];
            return true;
        });
        set_auth_cookie((string)current_token()); // prolonge le cookie
        json_out(['user' => $name] + $info);

    case 'logoutothers':
        $name = require_user();
        $keep = hash('sha256', (string)current_token());
        update_file(users_file(), function (array &$users) use ($name, $keep) {
            $users[$name]['tokens'] = [$keep => time()];
            return true;
        });
        json_out(['ok' => true]);

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

    case 'sync':
        $name = require_user();
        $client = is_array($in['state'] ?? null) ? $in['state'] : [];
        $merged = [];
        $gone = [];
        $changed = update_file(user_file($name), function (array &$st) use ($client, &$merged, &$gone) {
            $old = clean_state($st);
            $before = json_encode($old);
            $st = merge_state($st, $client);
            $merged = $st;
            $gone = purged_images($old, $st);
            return json_encode($st) !== $before; // n'écrit que s'il y a du nouveau
        });
        if ($changed) bump_rev($name);
        if ($gone) delete_images($name, $gone); // suppression définitive : fichiers effacés tout de suite
        if (random_int(1, 40) === 1) gc_images($name, $merged); // ménage occasionnel des images inutilisées
        maybe_run_reminders(); // au plus une fois par minute, en complément du cron
        json_out(['state' => out_state($merged), 'rev' => get_rev($name)]);

    // Attente longue : répond dès que les données changent (autre appareil, cron…), sinon après ~25 s.
    case 'wait':
        $name = require_user();
        $known = (string)($in['rev'] ?? '');
        @set_time_limit(45);
        maybe_run_reminders();
        $end = microtime(true) + 25;
        do {
            $rev = get_rev($name);
            if ($rev !== $known) break;
            usleep(250000);
        } while (microtime(true) < $end);
        json_out(['rev' => $rev]);

    // Réglages : nombre d'appareils abonnés ; pour l'administrateur, état de l'envoi automatique (cron).
    case 'status':
        $name = require_user();
        $out = ['pushDevices' => count(load_file(push_file($name))['subs'] ?? []), 'admin' => is_admin($name)];
        if ($out['admin']) {
            $f = data_dir() . '/.cron-ext';
            $out['cronAge'] = is_file($f) ? time() - filemtime($f) : null;
        }
        json_out($out);

    // Envoi d'une image (corps = le fichier brut). v=t : miniature, sinon qualité normale.
    case 'upload':
        $name = require_user();
        $id = (string)($_GET['id'] ?? '');
        if (!valid_id($id)) json_out(['error' => 'Image invalide'], 400);
        if (strlen($raw) > 10 * 1024 * 1024) json_out(['error' => 'Image trop lourde'], 413);
        $mime = sniff_image($raw);
        if ($mime === null) json_out(['error' => "Format d'image non pris en charge"], 415);
        if (@file_put_contents(image_path($name, $id, ($_GET['v'] ?? '') === 't'), GUARD . $mime . "\n" . $raw, LOCK_EX) === false) {
            error_log('[rappels] écriture image impossible pour ' . $name);
            json_out(['error' => 'Service momentanément indisponible, réessaie plus tard.'], 500);
        }
        json_out(['ok' => true]);

    case 'vapid':
        $k = vapid_keys();
        if (!$k) {
            error_log('[rappels] génération des clés VAPID impossible (extension OpenSSL ?)');
            json_out(['error' => 'Notifications indisponibles pour le moment.'], 500);
        }
        json_out(['key' => $k['pub']]);

    case 'pushsub':
        $name = require_user();
        $sub = $in['sub'] ?? null;
        $ep = is_array($sub) ? (string)($sub['endpoint'] ?? '') : '';
        if (!preg_match('#^https://#', $ep)) json_out(['error' => 'Abonnement invalide'], 400);
        $h = hash('sha256', $ep);
        // Un appareil n'appartient qu'à un seul compte à la fois.
        foreach (glob(data_dir() . '/users/*.push.php') ?: [] as $f) {
            if ($f === push_file($name)) continue;
            update_file($f, function (array &$p) use ($h) {
                if (!isset($p['subs'][$h])) return false;
                unset($p['subs'][$h]);
                return true;
            });
        }
        update_file(push_file($name), function (array &$p) use ($h, $ep) {
            $p['subs'][$h] = ['endpoint' => $ep, 'created' => time()];
            return true;
        });
        json_out(['ok' => true]);

    case 'pushunsub':
        $name = require_user();
        $h = hash('sha256', (string)($in['endpoint'] ?? ''));
        update_file(push_file($name), function (array &$p) use ($h) {
            unset($p['subs'][$h]);
            return true;
        });
        json_out(['ok' => true]);

    // Appelé par le service worker quand une notification push arrive : renvoie les rappels à afficher.
    case 'pushpull':
        $ep = (string)($in['endpoint'] ?? '');
        if ($ep === '') json_out(['items' => []]);
        $h = hash('sha256', $ep);
        foreach (glob(data_dir() . '/users/*.push.php') ?: [] as $f) {
            $items = null;
            update_file($f, function (array &$p) use ($h, &$items) {
                if (!isset($p['subs'][$h])) return false;
                $items = [];
                $lim = time() - 3600;
                if (!isset($p['queue'])) $p['queue'] = [];
                foreach ($p['queue'] as &$it) {
                    if (($it['ts'] ?? 0) < $lim || !empty($it['pulled'][$h])) continue;
                    $it['pulled'][$h] = 1;
                    $items[] = ['id' => $it['id'], 'title' => $it['title'], 'body' => $it['body']];
                }
                unset($it);
                return true;
            });
            if ($items !== null) json_out(['items' => $items]);
        }
        json_out(['items' => []]);

    case 'pushtest':
        $name = require_user();
        if (empty(load_file(push_file($name))['subs'])) json_out(['error' => 'Aucun appareil abonné'], 400);
        $n = push_notify($name, [['id' => 'test' . time(), 'title' => 'Rappels', 'body' => 'Test réussi : les notifications push fonctionnent.']]);
        if (!$n) json_out(['error' => "Envoi refusé par le service de notification"], 502);
        json_out(['ok' => true, 'sent' => $n]);

    case 'password':
        $name = require_user();
        $old = (string)($in['old'] ?? '');
        $new = (string)($in['new'] ?? '');
        if (strlen($new) < 6) json_out(['error' => 'Nouveau mot de passe trop court (6 caractères minimum)'], 400);
        $keep = hash('sha256', (string)current_token());
        $ok = update_file(users_file(), function (array &$users) use ($name, $old, $new, $keep) {
            if (!password_verify($old, (string)($users[$name]['hash'] ?? ''))) return false;
            $users[$name]['hash'] = password_hash($new, PASSWORD_DEFAULT);
            // Déconnecte les autres appareils, garde celui-ci.
            $users[$name]['tokens'] = [$keep => time()];
            return true;
        });
        if (!$ok) {
            sleep(1);
            json_out(['error' => 'Mot de passe actuel incorrect'], 403);
        }
        json_out(['ok' => true]);

    case 'rename':
        $name = require_user();
        $new = norm_user($in['user'] ?? '');
        if (!valid_user($new)) {
            json_out(['error' => 'Nom invalide : 2 à 32 caractères, commence par une lettre (lettres, chiffres, . _ -)'], 400);
        }
        if ($new === $name) json_out(['ok' => true, 'user' => $name]);
        $err = null;
        update_file(users_file(), function (array &$users) use ($name, $new, &$err) {
            if (isset($users[$new]) || is_file(user_file($new))) { $err = 'Ce nom est déjà pris'; return false; }
            if (is_file(user_file($name)) && !rename(user_file($name), user_file($new))) { $err = 'Renommage impossible'; return false; }
            foreach (['push_file', 'rev_file'] as $fn) if (is_file($fn($name))) @rename($fn($name), $fn($new));
            if (is_dir(data_dir() . '/files/' . $name)) @rename(data_dir() . '/files/' . $name, data_dir() . '/files/' . $new);
            $users[$new] = $users[$name];
            unset($users[$name]);
            return true;
        });
        if ($err) json_out(['error' => $err], 409);
        if (is_file(codes_file())) {
            update_file(codes_file(), function (array &$codes) use ($name, $new) { // historique des codes : suit le nouveau nom
                $hit = false;
                foreach ($codes as &$k) foreach ($k['uses'] ?? [] as $i => $u) if (($u['user'] ?? '') === $name) { $k['uses'][$i]['user'] = $new; $hit = true; }
                return $hit;
            });
        }
        json_out(['ok' => true, 'user' => $new]);

    case 'deleteaccount':
        $name = require_user();
        $pass = (string)($in['pass'] ?? '');
        $ok = update_file(users_file(), function (array &$users) use ($name, $pass) {
            if (!password_verify($pass, (string)($users[$name]['hash'] ?? ''))) return false;
            unset($users[$name]);
            return true;
        });
        if (!$ok) {
            sleep(1);
            json_out(['error' => 'Mot de passe incorrect'], 403);
        }
        foreach ([user_file($name), push_file($name), rev_file($name)] as $f) if (is_file($f)) @unlink($f);
        $dir = data_dir() . '/files/' . $name;
        if (is_dir($dir)) {
            foreach (glob($dir . '/*') ?: [] as $f) @unlink($f);
            @rmdir($dir);
        }
        clear_auth_cookie();
        json_out(['ok' => true]);

    case 'ntfytest':
        require_user();
        $topic = (string)($in['topic'] ?? '');
        if (!valid_topic($topic)) json_out(['error' => 'Sujet invalide (lettres, chiffres, - et _)'], 400);
        if (!ntfy_send($topic, 'Rappels', 'Test réussi : les notifications fonctionnent.')) {
            error_log('[rappels] envoi ntfy impossible (curl / allow_url_fopen ?)');
            json_out(['error' => 'Envoi impossible pour le moment.'], 502);
        }
        json_out(['ok' => true]);

    // Images présentes sur le serveur (version normale / miniature) : sert à restaurer depuis un appareil
    // une image perdue côté serveur mais encore en mémoire sur le téléphone.
    case 'imgstatus':
        $name = require_user();
        $out = [];
        foreach (array_slice((array)($in['ids'] ?? []), 0, 3000) as $id) {
            $id = (string)$id;
            if (!valid_id($id)) continue;
            $out[$id] = ['full' => is_file(image_path($name, $id, false)), 'thumb' => is_file(image_path($name, $id, true))];
        }
        json_out(['images' => $out]);

    case 'linkpreview':
        require_user();
        json_out(link_preview(trim((string)($in['url'] ?? ''))));

    // ----- Administration : codes d'invitation et statistiques des comptes -----
    case 'admincodes':
        require_admin();
        $users = load_file(users_file());
        $codes = load_file(codes_file());
        $now = time();
        $acc = [];
        foreach ($users as $n => $u) {
            $acc[] = [
                'user' => (string)$n, 'created' => (int)($u['created'] ?? 0), 'lastSeen' => user_last_seen($u),
                'devices' => count($u['tokens'] ?? []), 'code' => (string)($u['code'] ?? ''), 'admin' => is_admin((string)$n),
            ];
        }
        usort($acc, fn($a, $b) => $b['lastSeen'] <=> $a['lastSeen']);
        $out = [];
        foreach ($codes as $c => $k) {
            $out[] = [
                'code' => (string)$c, 'type' => $k['type'] ?? 'single', 'label' => (string)($k['label'] ?? ''),
                'created' => (int)($k['created'] ?? 0), 'by' => (string)($k['by'] ?? ''), 'disabled' => !empty($k['disabled']),
                'uses' => array_values($k['uses'] ?? []),
            ];
        }
        usort($out, fn($a, $b) => $b['created'] <=> $a['created']);
        $active = fn(int $days) => count(array_filter($acc, fn($a) => $a['lastSeen'] > $now - $days * 86400));
        json_out(['codes' => $out, 'accounts' => $acc, 'openSignup' => !empty(server_settings()['openSignup']), 'stats' => [
            'accounts' => count($acc), 'active1' => $active(1), 'active7' => $active(7), 'active30' => $active(30),
            'codes' => count($out), 'uses' => array_sum(array_map(fn($k) => count($k['uses']), $out)),
        ]]);

    case 'adminsettings':
        require_admin();
        update_file(data_dir() . '/server.json.php', function (array &$st) use ($in) {
            if (array_key_exists('openSignup', $in)) $st['openSignup'] = !empty($in['openSignup']);
            return true;
        });
        json_out(['ok' => true] + server_settings());

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
            if (array_key_exists('label', $in)) $codes[$c]['label'] = mb_substr(trim((string)$in['label']), 0, 80);
            return true;
        });
        if (!$ok) json_out(['error' => 'Code introuvable'], 404);
        json_out(['ok' => true]);

    case 'codedelete':
        require_admin();
        $c = norm_code($in['code'] ?? '');
        update_file(codes_file(), function (array &$codes) use ($c) {
            if (!isset($codes[$c])) return false;
            unset($codes[$c]);
            return true;
        });
        json_out(['ok' => true]);

    default:
        json_out(['error' => 'Action inconnue'], 400);
}
