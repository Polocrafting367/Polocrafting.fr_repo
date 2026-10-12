<?php
// Agrégateur d'actualités : flux RSS publics de la presse (titres, chapeaux, liens vers l'article d'origine).
// GET news.php?region=bretagne  ->  {"items":[{title, summary, link, image, source, date, kind, local}]}
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

const FEEDS = [
    ['Le Monde',          'https://www.lemonde.fr/rss/une.xml',                         'actu'],
    ['franceinfo',        'https://www.francetvinfo.fr/titres.rss',                     'actu'],
    ['BFMTV',             'https://www.bfmtv.com/rss/news-24-7/',                       'actu'],
    ['20 Minutes',        'https://www.20minutes.fr/feeds/rss-une.xml',                 'actu'],
    ['Le Figaro',         'https://www.lefigaro.fr/rss/figaro_actualites.xml',          'actu'],
    ['Libération',        'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml', 'actu'],
    ['Le Parisien',       'https://feeds.leparisien.fr/leparisien/rss',                 'actu'],
    ['HuffPost',          'https://www.huffingtonpost.fr/rss/all_headline.xml',         'actu'],
    ['France 24',         'https://www.france24.com/fr/rss',                            'monde'],
    ['RFI',               'https://www.rfi.fr/fr/rss',                                  'monde'],
    ['Futura',            'https://www.futura-sciences.com/rss/actualites.xml',         'science'],
    ['Sciences et Avenir', 'https://www.sciencesetavenir.fr/rss.xml',                   'science'],
    ['Numerama',          'https://www.numerama.com/feed/',                             'tech'],
    ['The Conversation',  'https://theconversation.com/fr/articles.atom',               'savoir'],
    ['CNRS Le Journal',   'https://lejournal.cnrs.fr/rss',                              'science'],
];
// Presse régionale en plus de France 3 Régions.
const REGIONAL = [
    'bretagne'           => [['Ouest-France', 'https://www.ouest-france.fr/rss/une']],
    'normandie'          => [['Ouest-France', 'https://www.ouest-france.fr/rss/une']],
    'pays-de-la-loire'   => [['Ouest-France', 'https://www.ouest-france.fr/rss/une']],
    'occitanie'          => [['La Dépêche', 'https://www.ladepeche.fr/rss.xml']],
    'nouvelle-aquitaine' => [['Sud Ouest', 'https://www.sudouest.fr/rss.xml']],
];
const REGION_SLUGS = ['auvergne-rhone-alpes', 'bourgogne-franche-comte', 'bretagne', 'centre-val-de-loire', 'corse', 'grand-est',
    'hauts-de-france', 'paris-ile-de-france', 'normandie', 'nouvelle-aquitaine', 'occitanie', 'pays-de-la-loire', 'provence-alpes-cote-d-azur'];

function http_get(string $url): ?string
{
    $c = curl_init($url);
    curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; CurioNews/1.0; +https://polocrafting.fr/Curio/)', CURLOPT_ENCODING => '']);
    $body = curl_exec($c);
    $code = curl_getinfo($c, CURLINFO_HTTP_CODE);
    curl_close($c);
    return ($body && $code < 400) ? $body : null;
}

function clean(string $s, int $max = 320): string
{
    $s = html_entity_decode(strip_tags($s), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $s = trim(preg_replace('/\s+/u', ' ', $s));
    return mb_strlen($s) > $max ? rtrim(mb_substr($s, 0, $max - 1)) . '…' : $s;
}

function parse_feed(string $xml, string $source, string $kind, bool $local): array
{
    $prev = libxml_use_internal_errors(true);
    $rss = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
    libxml_use_internal_errors($prev);
    if (!$rss) return [];
    $out = [];
    // Flux Atom (The Conversation...)
    if (isset($rss->entry)) {
        foreach ($rss->entry as $it) {
            $link = '';
            foreach ($it->link as $l) if ((string)$l['rel'] === 'alternate' || !$link) $link = (string)$l['href'];
            $html = (string)($it->summary ?: $it->content);
            preg_match_all('#<img[^>]+src="(https://[^"]+)"#', (string)$it->content . $html, $mm);
            $m = [1 => current(array_filter($mm[1] ?? [], fn($u) => !preg_match('#count\.gif|pixel|1x1#', $u))) ?: ''];
            $title = clean((string)$it->title, 200);
            if ($title === '' || !preg_match('#^https?://#', $link)) continue;
            $out[] = ['title' => $title, 'summary' => clean($html), 'link' => $link, 'image' => $m[1] ?? '', 'source' => $source,
                'date' => strtotime((string)($it->published ?: $it->updated)) ?: time(), 'kind' => $kind, 'local' => $local];
        }
        return $out;
    }
    if (!isset($rss->channel->item)) return [];
    foreach ($rss->channel->item as $it) {
        $title = clean((string)$it->title, 200);
        $link = trim((string)$it->link);
        if ($title === '' || !preg_match('#^https?://#', $link)) continue;
        $img = '';
        $etype = isset($it->enclosure) ? (string)$it->enclosure['type'] : '';
        if (isset($it->enclosure) && ($etype === '' || strpos($etype, 'image') === 0)) $img = (string)$it->enclosure['url'];
        $media = $it->children('http://search.yahoo.com/mrss/');
        if (!$img && isset($media->content)) foreach ($media->content as $m) { $img = (string)$m->attributes()->url; if ($img) break; }
        if (!$img && isset($media->thumbnail)) $img = (string)$media->thumbnail->attributes()->url;
        if (!$img && isset($media->group->content)) $img = (string)$media->group->content->attributes()->url;
        if (!$img && preg_match('#<img[^>]+src="([^"]+)"#', (string)$it->description, $m)) $img = $m[1];
        $date = strtotime((string)($it->pubDate ?: $it->children('http://purl.org/dc/elements/1.1/')->date)) ?: time();
        $out[] = [
            'title' => $title,
            'summary' => clean((string)$it->description),
            'link' => $link,
            'image' => preg_match('#^https://#', $img) ? $img : '',
            'source' => $source,
            'date' => $date,
            'kind' => $kind,
            'local' => $local,
        ];
    }
    return $out;
}

function feed_items(string $source, string $url, string $kind, bool $local): array
{
    $cache = data_dir('cache') . '/news-' . md5($url) . '.json.php';
    $c = load_file($cache);
    if ($c && time() - (int)($c['t'] ?? 0) < NEWS_TTL) return $c['items'] ?? [];
    $xml = http_get($url);
    $items = $xml ? parse_feed($xml, $source, $kind, $local) : [];
    if ($items || !$c) update_file($cache, function (array &$d) use ($items) { $d = ['t' => time(), 'items' => $items]; return true; });
    return $items ?: ($c['items'] ?? []);
}

$region = (string)($_GET['region'] ?? '');
$feeds = array_map(fn($f) => [$f[0], $f[1], $f[2], false], FEEDS);
if (in_array($region, REGION_SLUGS, true)) {
    $feeds[] = ['France 3 ' . ucwords(str_replace('-', ' ', $region)), "https://france3-regions.francetvinfo.fr/$region/rss", 'local', true];
    foreach (REGIONAL[$region] ?? [] as $r) $feeds[] = [$r[0], $r[1], 'local', true];
}

$all = [];
$seen = [];
foreach ($feeds as [$src, $url, $kind, $local]) {
    $n = 0;
    foreach (feed_items($src, $url, $kind, $local) as $it) {
        // Au plus 20 titres par journal, de moins de 3 jours (7 pour la presse locale).
        if ($n >= 20 || time() - $it['date'] > ($local ? 7 : 3) * 86400) continue;
        // Doublons : même début de titre.
        $key = mb_strtolower(mb_substr(preg_replace('/\W+/u', '', $it['title']), 0, 40));
        if (isset($seen[$key])) continue;
        $seen[$key] = true;
        $all[] = $it;
        $n++;
    }
}
usort($all, fn($a, $b) => $b['date'] <=> $a['date']);
echo json_encode(['items' => array_slice($all, 0, 300), 'generated' => time()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
