#!/usr/bin/env python3
"""Construit content/en.json et content/ar.json à partir des listes relues à la main (content/src/*.txt).

    python3 tools/build-content.py

Chaque mot : id, mot, nature, niveau, traductions (la première = usage le plus courant), exemple avec la cible.
Vérifie au passage : champs manquants, cible absente de l'exemple, doublons. S'arrête sur la première erreur.
Après une modification : changer CONTENT dans sw.js (les apps rechargent le contenu).
"""
import json, re, sys, pathlib, hashlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'content' / 'src'
OUT = ROOT / 'content'
LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
POS = {'n', 'v', 'adj', 'adv', 'prep', 'pron', 'conj', 'det', 'int', 'num', 'q', 'phr'}
errors = []
dups = []


def lines(path):
    for k, raw in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        s = raw.strip()
        if s and not s.startswith('#'):
            yield k, s


def target(ex, where):
    m = re.search(r'\*([^*]+)\*', ex)
    if not m:
        errors.append(f'{where} : la cible *…* manque dans « {ex} »')
        return ex, ''
    if ex.count('*') != 2:
        errors.append(f'{where} : une seule cible *…* par exemple')
    return ex, m.group(1)


def fields(s):
    """Découpe sur « | », sauf dans [a|b] et dans « || » (deux formulations acceptées)."""
    out, cur, depth, i = [], '', 0, 0
    while i < len(s):
        c = s[i]
        if c == '[': depth += 1
        elif c == ']': depth -= 1
        if c == '|' and depth == 0:
            if s[i:i + 2] == '||':
                cur += '||'; i += 2; continue
            out.append(cur); cur = ''
        else:
            cur += c
        i += 1
    out.append(cur)
    return out


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def words_en():
    out, seen = [], {}
    for f in sorted(SRC.glob('en-words-*.txt')):
        for k, s in lines(f):
            p = s.split('|')
            where = f'{f.name}:{k}'
            if len(p) != 6:
                errors.append(f'{where} : 6 champs attendus, {len(p)} trouvés')
                continue
            lvl, w, pos, fr, ex, exfr = (x.strip() for x in p)
            if lvl not in LEVELS: errors.append(f'{where} : niveau inconnu {lvl}')
            if pos not in POS: errors.append(f'{where} : nature inconnue {pos}')
            ex, t = target(ex, where)
            key = (w.lower(), pos)
            if key in seen:
                dups.append(f'{where} : déjà dans {seen[key]}, ignoré')
                continue
            seen[key] = where
            out.append({'w': w, 'p': pos, 'l': lvl, 'fr': [x.strip() for x in fr.split(';') if x.strip()], 'ex': [ex, exfr], 't': t})
    # Identifiant : le mot, ou mot#nature s'il existe sous plusieurs natures (work nom / work verbe).
    count = {}
    for x in out: count[x['w'].lower()] = count.get(x['w'].lower(), 0) + 1
    for x in out:
        x['id'] = slug(x['w']) + ('.' + x['p'] if count[x['w'].lower()] > 1 else '')
    return out


def sentences(path, lang):
    out = []
    for k, s in lines(path):
        p = fields(s)
        where = f'{path.name}:{k}'
        if lang == 'en':
            if len(p) not in (4, 5):
                errors.append(f'{where} : 4 ou 5 champs attendus'); continue
            lvl, theme, tgt, fr = (x.strip() for x in p[:4])
            tip = p[4].strip() if len(p) > 4 else ''
            item = {'l': lvl, 'th': theme, 'tg': [x.strip() for x in tgt.split('||')], 'fr': [x.strip() for x in fr.split('||')], 'tip': tip}
        else:
            if len(p) != 6:
                errors.append(f'{where} : 6 champs attendus'); continue
            lvl, theme, ar, tl, fr, tip = (x.strip() for x in p)
            item = {'l': lvl, 'th': theme, 'tg': [ar], 'tl': tl, 'fr': [x.strip() for x in fr.split(';') if x.strip()], 'tip': tip}
        if lvl not in LEVELS: errors.append(f'{where} : niveau inconnu {lvl}')
        for v in item['tg'] + item['fr']:
            if v.count('[') != v.count(']'): errors.append(f'{where} : crochets mal fermés dans « {v} »')
        item['id'] = 's' + hashlib.md5(item['tg'][0].encode()).hexdigest()[:7]
        out.append(item)
    return out


def words_ar():
    out, seen, forms = [], set(), set()
    for f in sorted(SRC.glob('ar-words*.txt')):
        for k, s in lines(f):
            p = s.split('|')
            where = f'{f.name}:{k}'
            if len(p) != 8:
                errors.append(f'{where} : 8 champs attendus, {len(p)} trouvés'); continue
            lvl, w, tl, pos, fr, ex, extl, exfr = (x.strip() for x in p)
            if lvl not in LEVELS: errors.append(f'{where} : niveau inconnu {lvl}')
            if pos not in POS: errors.append(f'{where} : nature inconnue {pos}')
            ex, t = target(ex, where)
            # Même mot (sans voyelles) et même nature déjà présent : on garde le premier.
            bare = re.sub('[\u064B-\u0652\u0670\u0640]', '', w) + '|' + pos
            if bare in forms:
                dups.append(f'{where} : {w} déjà présent, ignoré'); continue
            forms.add(bare)
            wid = slug(tl.replace("'", '').replace('ʿ', '3').translate(str.maketrans('âîôûḥṣḍṭẓ', 'aiouhsdtz')))
            if wid in seen: wid += '-' + pos
            if wid in seen: errors.append(f'{where} : doublon {wid}')
            seen.add(wid)
            out.append({'id': wid, 'w': w, 'tl': tl, 'p': pos, 'l': lvl, 'fr': [x.strip() for x in fr.split(';') if x.strip()], 'ex': [ex, exfr], 'extl': extl, 't': t})
    return out


def examples(words):
    """Phrases supplémentaires par mot (en-examples.tsv, tirées de Tatoeba par tools/mine-examples.py)."""
    f = SRC / 'en-examples.tsv'
    if not f.exists(): return
    by = {w['id']: w for w in words}
    for k, s in lines(f):
        p = s.split('\t')
        if len(p) != 3 or p[0] not in by: continue
        _, t = target(p[1], f'en-examples.tsv:{k}')
        if t: by[p[0]].setdefault('xs', []).append([p[1], p[2], t])


def examples_ar(words):
    """Phrases arabes supplémentaires (ar-examples.txt), rattachées au mot par sa forme sans voyelles."""
    bare = lambda x: re.sub('[\u064B-\u0652\u0670\u0640]', '', x)
    by = {}
    for w in words: by.setdefault(bare(w['w']), w)
    for k, s in lines(SRC / 'ar-examples.txt'):
        p = [x.strip() for x in s.split('|')]
        where = f'ar-examples.txt:{k}'
        if len(p) != 4: errors.append(f'{where} : 4 champs attendus'); continue
        w = by.get(bare(p[0]))
        if not w: errors.append(f'{where} : mot inconnu {p[0]}'); continue
        _, t = target(p[1], where)
        w.setdefault('xs', []).append([p[1], p[3], t, p[2]])


def path(name, words, sents, n_alpha=0):
    """Parcours « premiers pas » (content/src/<langue>-path.txt) : étapes de 1 à 3 éléments déjà dans les contenus."""
    f = SRC / name
    if not f.exists(): return []
    bare = lambda x: re.sub('[\u064B-\u0652\u0670\u0640]', '', x).strip().lower()
    wby, sby = {}, {}
    for w in words:
        wby.setdefault(bare(w['w']), w); wby.setdefault(w['id'], w)
    for x in sents: sby.setdefault(bare(x['tg'][0]), x)
    out = []
    for k, s in lines(f):
        p = [x.strip() for x in s.split('|')]
        where = f'{name}:{k}'
        if p[0] == 'alpha':
            if not p[1].isdigit() or int(p[1]) >= n_alpha: errors.append(f'{where} : étape d\'alphabet inconnue {p[1]}')
            out.append({'id': f'al{p[1]}', 'alpha': int(p[1])}); continue
        if len(p) != 3: errors.append(f'{where} : 3 champs attendus'); continue
        items = []
        for e in (x.strip() for x in p[2].split(';') if x.strip()):
            if e.startswith('s:'):
                x = sby.get(bare(e[2:]))
                if x: items.append('s:' + x['id']); continue
            else:
                x = wby.get(bare(e))
                if x: items.append('w:' + x['id']); continue
                x = sby.get(bare(e))
                if x: items.append('s:' + x['id']); continue
            errors.append(f'{where} : élément introuvable « {e} »')
        if not 1 <= len(items) <= 3: errors.append(f'{where} : 1 à 3 éléments par étape')
        out.append({'id': 'p' + hashlib.md5(p[2].encode()).hexdigest()[:6], 'title': p[0], 'sub': p[1], 'items': items})
    return out


def synonyms():
    """Groupes par langue ([en], [fr], [ar], [es]…) ; signale les groupes d'un seul élément."""
    groups, cur = {}, None
    for k, s in lines(SRC / 'synonyms.txt'):
        if s.startswith('['):
            cur = s.strip('[]'); groups.setdefault(cur, []); continue
        g = list(dict.fromkeys(x.strip().lower() for x in s.split(',') if x.strip()))
        if len(g) < 2: errors.append(f'synonyms.txt:{k} : groupe d\'un seul élément'); continue
        groups[cur].append(g)
    return groups


def beta_syn(syn):
    """Langues bêta : leurs fichiers sont faits par tools/import-beta.py ; on n'y remplace que les synonymes."""
    for f in sorted(OUT.glob('*.json')):
        if f.stem in ('en', 'ar'): continue
        d = json.loads(f.read_text(encoding='utf-8'))
        d['syn'] = {'fr': syn['fr'], **({f.stem: syn[f.stem]} if f.stem in syn else {})}
        f.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


# Verbes irréguliers : seulement les plus courants (ceux qu'on rencontre vraiment), révisés de temps en temps.
IRREGULAR = [
    ('be', 'was/were', 'been', 'être'), ('have', 'had', 'had', 'avoir'), ('do', 'did', 'done', 'faire'), ('go', 'went', 'gone', 'aller'),
    ('get', 'got', 'got', 'obtenir'), ('make', 'made', 'made', 'faire'), ('say', 'said', 'said', 'dire'), ('see', 'saw', 'seen', 'voir'),
    ('come', 'came', 'come', 'venir'), ('take', 'took', 'taken', 'prendre'), ('know', 'knew', 'known', 'savoir'), ('think', 'thought', 'thought', 'penser'),
    ('give', 'gave', 'given', 'donner'), ('find', 'found', 'found', 'trouver'), ('tell', 'told', 'told', 'dire'), ('feel', 'felt', 'felt', 'ressentir'),
    ('leave', 'left', 'left', 'partir'), ('buy', 'bought', 'bought', 'acheter'), ('eat', 'ate', 'eaten', 'manger'), ('drink', 'drank', 'drunk', 'boire'),
    ('write', 'wrote', 'written', 'écrire'), ('read', 'read', 'read', 'lire'), ('speak', 'spoke', 'spoken', 'parler'), ('meet', 'met', 'met', 'rencontrer'),
    ('pay', 'paid', 'paid', 'payer'), ('sleep', 'slept', 'slept', 'dormir'), ('lose', 'lost', 'lost', 'perdre'), ('forget', 'forgot', 'forgotten', 'oublier'),
    ('begin', 'began', 'begun', 'commencer'), ('bring', 'brought', 'brought', 'apporter'),
]


def main():
    en_words = words_en()
    examples(en_words)
    en_sent = sentences(SRC / 'en-sentences.txt', 'en')
    ar_words = words_ar()
    examples_ar(ar_words)
    ar_phr = sentences(SRC / 'ar-phrases.txt', 'ar')
    syn = synonyms()
    letters = json.loads((SRC / 'ar-letters.json').read_text(encoding='utf-8'))
    en_path = path('en-path.txt', en_words, en_sent)
    ar_path = path('ar-path.txt', ar_words, ar_phr, len(letters['groups']))
    if dups: print(f'{len(dups)} doublon(s) ignoré(s), ex. : ' + ' | '.join(dups[:4]))
    if errors:
        print('\n'.join(errors[:60]), file=sys.stderr)
        print(f'{len(errors)} erreur(s)', file=sys.stderr)
        sys.exit(1)
    en = {'lang': 'en', 'v': 1, 'words': en_words, 'sentences': en_sent, 'syn': {'en': syn['en'], 'fr': syn['fr']},
          'irregular': [{'b': b, 'p': p, 'pp': pp, 'fr': fr} for b, p, pp, fr in IRREGULAR], 'path': en_path}
    ar = {'lang': 'ar', 'v': 1, 'words': ar_words, 'sentences': ar_phr, 'syn': {'fr': syn['fr'], 'ar': syn.get('ar', [])}, 'alphabet': letters, 'path': ar_path}
    for name, d in (('en', en), ('ar', ar)):
        (OUT / f'{name}.json').write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    beta_syn(syn)
    print('synonymes : ' + ', '.join(f'{k} {len(v)}' for k, v in syn.items()))
    for name, d in (('en', en), ('ar', ar)):
        by = {}
        for w in d['words']: by[w['l']] = by.get(w['l'], 0) + 1
        sb = {}
        for s in d['sentences']: sb[s['l']] = sb.get(s['l'], 0) + 1
        xs = sum(len(w.get('xs', [])) for w in d['words'])
        print(f"{name} : {len(d['words'])} mots {by}, {len(d['sentences'])} phrases {sb}, {xs} exemples en plus, parcours de {len(d['path'])} étapes")


main()
