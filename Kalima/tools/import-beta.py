#!/usr/bin/env python3
"""Langues « bêta » : reprises des anciens dictionnaires de Curio (Wiktionnaire), moins fiables que l'anglais et l'arabe
relus à la main. Proposées dans l'app avec la mention « bêta ».

    python3 tools/import-beta.py [es de it pt nl ru tr]

Sources : Archives/Curio-langues-2026-10-12/learn/data/<l>.json (dictionnaires de Curio),
~/.cache/curio-lexicon : <l>_freq.txt (fréquences), exports Tatoeba <l3>_sentences.tsv et <l3>-fra_links.tsv.
Pour chaque langue : les ~1500 mots de base les plus courants, traduction nettoyée (la première = la plus courante
d'après le Wiktionnaire), niveau d'après la fréquence, et des phrases d'exemple Tatoeba SIMPLES (courtes, mots
fréquents seulement, traduction qui contient bien le mot : bon sens).
"""
import json, re, sys, pathlib, collections, unicodedata, random, hashlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OLD = ROOT.parent / 'Archives' / 'Curio-langues-2026-10-12' / 'learn' / 'data'
CACHE = pathlib.Path.home() / '.cache' / 'curio-lexicon'
T3 = {'es': 'spa', 'de': 'deu', 'it': 'ita', 'pt': 'por', 'nl': 'nld', 'ru': 'rus', 'tr': 'tur'}
POS = {'nom': 'n', 'verbe': 'v', 'adjectif': 'adj', 'adverbe': 'adv', 'pronom': 'pron', 'préposition': 'prep', 'conjonction': 'conj',
       'interjection': 'int', 'déterminant': 'det', 'article': 'det', 'numéral': 'num', 'locution': 'phr'}
INFLECTED = re.compile(r'^(Passé|Prétérit|Participe|Pluriel|Troisième personne|Forme|Comparatif|Superlatif|Gérondif|Variante|Féminin|Masculin|Première personne|Deuxième personne|Présent|Imparfait|Subjonctif|Impératif|Conditionnel|Futur|Pluriel de|Génitif|Datif|Accusatif|Instrumental|Locatif)', re.I)
LITTERAIRE = re.compile(r"\b(fut|furent|eut|eurent|fit|firent|dut|vint|vit|prit|alla|fûmes|fûtes|point|guère|tripe|char|magasiner|présentement|dispendieux|courriel)\b|\b\w+(âmes|âtes|èrent)\b", re.I)
MAX_WORDS = 1500
random.seed(3)


def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn').replace('’', "'")


def clean_tr(glosses):
    """« (transitif) Demander, interroger. Plus de détails » → ['demander', 'interroger']."""
    out = []
    for g in glosses[:2]:
        g = re.sub(r'^\s*(\([^)]*\)\s*)+', '', g)
        g = re.split(r'\.\s|\s:\s|;|\s—\s', g)[0]
        g = re.sub(r'\s*\([^)]*\)', '', g).strip(' .,')
        for part in re.split(r',\s*', g):
            part = part.strip()
            if not part or len(part) > 40 or INFLECTED.match(part): continue
            if re.match(r"(?i)(au |le |dans le )?sens |se dit|désigne|qualifie|personne qui|action de|fait de|relatif|forme |variante|terme|abréviation", part): continue
            part = part[0].lower() + part[1:] if not part[:2].isupper() else part
            if part not in out: out.append(part)
    return out[:4]


def sense_ok(frs, fr):
    f = fold(fr)
    for t in frs:
        for part in re.split(r"[ ,/']+", fold(t)):
            if len(part) < 3 or part in ('les', 'une', 'des', 'qui', 'que', 'pas', 'etre', 'avoir', 'faire', 'pour', 'dans', 'avec', 'son', 'sur'): continue
            stem = part[:max(3, min(len(part) - 1, 5))] if len(part) > 4 else part
            if re.search(r"(?<![a-z])" + re.escape(stem), f): return True
    return False


def level(rank):
    return 'A1' if rank <= 300 else 'A2' if rank <= 800 else 'B1' if rank <= 1600 else 'B2' if rank <= 2600 else 'C1'


def tokens(s):
    return re.findall(r"\w+", s.lower())


def build(code):
    old = json.loads((OLD / f'{code}.json').read_text())
    freq = {}
    with open(CACHE / f'{code}_freq.txt', encoding='utf-8') as fh:
        for k, line in enumerate(fh, 1):
            w = line.split()[0].lower()
            if w not in freq: freq[w] = k
            if k >= 6000: break
    words, seen = [], set()
    for w in sorted(old['words'], key=lambda x: x.get('r', 99999)):
        if w.get('f') or not w.get('g') or all(INFLECTED.match(g) for g in w['g']): continue
        lemma = w['w']
        if len(lemma) < 2 or lemma.isupper() or lemma.lower() in seen: continue
        if 'lettre' in ' '.join(w['g']).lower()[:40]: continue
        fr = clean_tr(w['g'])
        if not fr: continue
        seen.add(lemma.lower())
        pos = next((POS[p] for p in w.get('p', []) if p in POS), 'n')
        words.append({'id': re.sub(r'\W+', '-', fold(lemma)).strip('-') or f'w{len(words)}', 'w': lemma, 'p': pos, 'l': level(w.get('r', 9999)), 'fr': fr, 'r': w.get('r', 9999)})
        if len(words) >= MAX_WORDS: break
    ids = collections.Counter(x['id'] for x in words)
    for x in words:
        if ids[x['id']] > 1: x['id'] += '.' + x['p']

    # Phrases Tatoeba de la langue, traduites en français.
    t3 = T3[code]
    sents = {}
    with open(CACHE / f'{t3}_sentences.tsv', encoding='utf-8') as fh:
        for line in fh:
            i, _, t = line.rstrip('\n').split('\t', 2)
            if len(t) <= 70 and not re.search(r'["“«»]', t) and not re.search(r'[.!?].', t.rstrip('.!?…')): sents[i] = t
    links = collections.defaultdict(list)
    with open(CACHE / f'{t3}-fra_links.tsv', encoding='utf-8') as fh:
        for line in fh:
            a, b = line.split()
            if a in sents: links[a].append(b)
    need = {b for v in links.values() for b in v}
    fra = {}
    with open(CACHE / 'fra_sentences.tsv', encoding='utf-8') as fh:
        for line in fh:
            i, _, t = line.rstrip('\n').split('\t', 2)
            if i in need and len(t) <= 90 and not LITTERAIRE.search(t): fra[i] = t
    pool = []
    for i, t in sents.items():
        frs = [fra[b] for b in links.get(i, []) if b in fra]
        toks = tokens(t)
        if not frs or not 2 <= len(toks) <= 8: continue
        ranks = [freq.get(x, 99999) for x in toks if not x.isdigit()]
        if not ranks or max(ranks) > 4000: continue
        pool.append((t, frs, toks, max(ranks)))
    by_tok = collections.defaultdict(list)
    for p in pool:
        for x in set(p[2]): by_tok[x].append(p)

    n_ex = 0
    for w in words:
        lw = w['w'].lower()
        cands = [p for p in by_tok.get(lw, []) if p[3] <= max(w['r'] * 2, 600)]
        random.shuffle(cands)
        chosen = []
        for t, frs, toks, mx in sorted(cands, key=lambda p: abs(len(p[2]) - 5)):
            good = [f for f in frs if sense_ok(w['fr'], f)]
            if not good: continue
            m = re.search(r'(?i)(?<!\w)(' + re.escape(w['w']) + r')(?!\w)', t)
            if not m: continue
            marked = t[:m.start()] + '*' + m.group(1) + '*' + t[m.end():]
            if any(c[0].replace('*', '') == t for c in chosen): continue
            chosen.append([marked, min(good, key=len), m.group(1)])
            if len(chosen) >= 4: break
        if chosen:
            w['ex'] = chosen[0][:2]; w['t'] = chosen[0][2]
            if len(chosen) > 1: w['xs'] = chosen[1:]
            n_ex += len(chosen)
        else:
            w['ex'] = None; w['t'] = w['w']
        del w['r']

    # Phrases à traduire : les plus simples, toutes traductions françaises acceptées.
    sentences = []
    levels = ['A1', 'A2', 'B1', 'B2']
    for t, frs, toks, mx in sorted(pool, key=lambda p: (p[3], len(p[2]))):
        if len(toks) < 3 or len(frs) < 1: continue
        lv = level(mx)
        if lv not in levels: continue
        if sum(1 for s in sentences if s['l'] == lv) >= 80: continue
        sentences.append({'l': lv, 'th': '', 'tg': [t], 'fr': list(dict.fromkeys(frs))[:4], 'tip': '', 'id': 's' + hashlib.md5(t.encode()).hexdigest()[:7]})
        if len(sentences) >= 300: break
    # Synonymes : remis à jour ensuite par tools/build-content.py (sections [fr] et [<langue>] de synonyms.txt).
    syn = json.loads((ROOT / 'content' / 'en.json').read_text())['syn']
    out = {'lang': code, 'v': 1, 'beta': True, 'words': words, 'sentences': sentences, 'syn': {'fr': syn['fr']}}
    (ROOT / 'content' / f'{code}.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    lv = collections.Counter(w['l'] for w in words)
    print(f"{code} : {len(words)} mots {dict(lv)}, {sum(1 for w in words if w['ex'])} avec exemple ({n_ex} phrases), {len(sentences)} phrases à traduire")


for c in (sys.argv[1:] or list(T3)):
    build(c)
