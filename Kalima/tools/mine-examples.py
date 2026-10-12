#!/usr/bin/env python3
"""Phrases d'exemple supplémentaires pour les mots anglais, tirées de Tatoeba (traductions faites par des humains).

    python3 tools/mine-examples.py      (puis python3 tools/build-content.py)

Sources (~/.cache/curio-lexicon) : eng_sentences.tsv, fra_sentences.tsv, eng-fra_links.tsv (exports Tatoeba, CC BY 2.0 FR).

On ne garde qu'une phrase SIMPLE pour un mot donné :
  - courte (3 à 7 mots en A1, 8 en A2, 10 en B1, 12 au-delà) ;
  - TOUS ses autres mots sont des mots-outils ou des mots de la liste Kalima d'un niveau inférieur ou égal ;
  - une seule phrase, pas de guillemets, pas de dialogue ;
  - le mot visé y apparaît (sous une forme fléchie au besoin : houses, went, bigger…).
Au plus 4 phrases par mot, les plus courtes et les plus variées, en évitant les répétitions de « Tom ».
Résultat : content/src/en-examples.tsv (id du mot, phrase avec *cible*, traduction), relu par build-content.py.
"""
import json, re, pathlib, collections, random

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = pathlib.Path.home() / '.cache' / 'curio-lexicon'
LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
MAXLEN = {0: 7, 1: 8, 2: 10, 3: 12, 4: 12}
PER_WORD = 4
random.seed(7)

FUNC = set('''a an the i you he she it we they me him her us them my your his its our their mine yours ours theirs myself yourself himself herself itself ourselves themselves
is am are was were be been being do does did done doing have has had having will would shall should can could may might must not no yes
to of in on at for with from by about into onto up down out off over under than as so if or and but because when where what who whom whose which why how
this that these those there here then now very too also just only all some any every each both either neither other another such much many more most few little lot lots
one two three four five six seven eight nine ten first second last next
s t d ll m re ve ok oh please mr mrs ms tom mary john'''.split())
NAMES = {'tom', 'mary', 'john'}

IRR = {}
def irr(base, *forms):
    for f in forms: IRR.setdefault(f, set()).add(base)
for line in '''be was were been being am is are|have has had having|do does did done doing|go goes went gone going|get gets got gotten getting|make made|say said|see saw seen|come came|take took taken|know knew known|think thought|give gave given|find found|tell told|feel felt|leave left|buy bought|eat ate eaten|drink drank drunk|write wrote written|read|speak spoke spoken|meet met|pay paid|sleep slept|lose lost|forget forgot forgotten|begin began begun|bring brought|run ran|sit sat|stand stood|hear heard|put|cut|let|hurt|cost|keep kept|hold held|win won|sell sold|send sent|spend spent|build built|break broke broken|choose chose chosen|drive drove driven|fall fell fallen|fly flew flown|grow grew grown|hide hid hidden|lend lent|ride rode ridden|sing sang sung|swim swam swum|teach taught|throw threw thrown|understand understood|wake woke woken|wear wore worn|catch caught|draw drew drawn|forgive forgave forgiven|lie lay lain|mean meant|steal stole stolen|fight fought|feed fed|shoot shot|shut|bite bit bitten|blow blew blown|freeze froze frozen|hang hung|lead led|learn learnt learned|dream dreamt dreamed|burn burnt burned|smell smelt|light lit|child children|man men|woman women|person people|foot feet|tooth teeth|mouse mice|good better best|bad worse worst|far further farther furthest|well better best|little less least|much more most|many more most'''.split('|'):
    w = line.split()
    irr(w[0], w[0], *w[1:])


def forms(lemma):
    """Formes régulières d'un mot simple (pluriel, 3e personne, passé, -ing, comparatif)."""
    w = lemma
    out = {w, w + 's', w + 'es', w + 'ed', w + 'd', w + 'ing', w + 'er', w + 'est', w + 'ly'}
    if w.endswith('y') and len(w) > 2 and w[-2] not in 'aeiou':
        out |= {w[:-1] + 'ies', w[:-1] + 'ied', w[:-1] + 'ier', w[:-1] + 'iest', w[:-1] + 'ily'}
    if w.endswith('e'):
        out |= {w[:-1] + 'ing', w + 'd', w + 'r', w + 'st'}
    if re.search(r'[^aeiou][aeiou][bdgklmnprt]$', w):
        out |= {w + w[-1] + 'ed', w + w[-1] + 'ing', w + w[-1] + 'er', w + w[-1] + 'est'}
    if w.endswith('f'): out.add(w[:-1] + 'ves')
    if w.endswith('fe'): out.add(w[:-2] + 'ves')
    return out


import unicodedata
def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn').replace('’', "'")

# Français trop littéraire ou vieilli : passé simple, tournures soutenues.
LITTERAIRE = re.compile(r"\b(fut|furent|fus|eut|eurent|fit|firent|dut|put|vint|vit|mit|prit|alla|fûmes|fûtes|à son endroit|nous en voyez|point|guère|naguère|céans|tripe|tripes|triper|char|chars|magasiner|présentement|dispendieux|pantoute|placoter|jaser|courriel|clavarder|fin de semaine)\b|\b\w+(âmes|âtes|èrent|irent|urent)\b", re.I)

def sense_ok(w, fr):
    """La traduction contient-elle une des traductions du mot ? (sinon : autre sens, ex. « thanks to » = « grâce à »)"""
    f = fold(fr)
    for t in w['fr']:
        t = fold(re.sub(r'\(.*?\)', '', t)).strip()
        for part in re.split(r"[ ,/]+|\bou\b", t):
            part = part.strip("'’ ")
            if len(part) < 3 or part in ('le', 'la', 'les', 'un', 'une', 'de', 'des', 'qui', 'que', 'pas', 'avoir', 'etre', 'faire', 'se', "s'"): continue
            stem = part[:max(3, min(len(part) - 1, 5))] if len(part) > 4 else part
            if re.search(r"(?<![a-z])" + re.escape(stem), f): return True
    return False

FLEX_POS = {'n', 'v', 'adj', 'adv'}

def norm_tokens(s):
    s = s.replace('’', "'").lower()
    s = re.sub(r"n't\b", ' not', s)
    s = re.sub(r"'(s|m|re|ve|ll|d)\b", r' \1', s)
    return re.findall(r"[a-z]+|\d+", s)


def main():
    en = json.loads((ROOT / 'content' / 'en.json').read_text())
    words = en['words']
    # Niveau de chaque forme : celui du mot le plus facile qui la produit.
    form_lv = {}
    single = collections.defaultdict(list)  # forme -> mots simples (un seul mot) qu'elle représente
    for w in words:
        toks = w['w'].lower().split()
        lv = LEVELS.index(w['l'])
        for t in toks:
            fs = forms(t) | {f for f, bases in IRR.items() if t in bases}
            for f in fs:
                if f not in form_lv or lv < form_lv[f]: form_lv[f] = lv
        if len(toks) == 1:
            for f in forms(toks[0]) | {f for f, bases in IRR.items() if toks[0] in bases}:
                single[f].append(w)
    for f in FUNC: form_lv[f] = -1

    print('lecture des phrases…')
    eng = {}
    with open(CACHE / 'eng_sentences.tsv', encoding='utf-8') as fh:
        for line in fh:
            i, _, t = line.rstrip('\n').split('\t', 2)
            if len(t) > 80 or '"' in t or '“' in t or ';' in t or ' - ' in t: continue
            if len(re.findall(r'[.!?]', t.rstrip('.!?'))) > 0: continue  # une seule phrase
            eng[i] = t
    links = collections.defaultdict(list)
    with open(CACHE / 'eng-fra_links.tsv', encoding='utf-8') as fh:
        for line in fh:
            a, b = line.split()
            if a in eng: links[a].append(b)
    need = {b for v in links.values() for b in v}
    fra = {}
    with open(CACHE / 'fra_sentences.tsv', encoding='utf-8') as fh:
        for line in fh:
            i, _, t = line.rstrip('\n').split('\t', 2)
            if i in need: fra[i] = t

    cand = collections.defaultdict(list)
    for i, t in eng.items():
        frs = [fra[b] for b in links.get(i, []) if b in fra and len(fra[b]) <= 100]
        if not frs: continue
        toks = norm_tokens(t)
        if not 3 <= len(toks) <= 12: continue
        if any(x not in form_lv for x in toks if not x.isdigit()): continue
        top = max(form_lv.get(x, -1) for x in toks)
        if top < 0 or len(toks) > MAXLEN[top]: continue
        names = sum(x in NAMES for x in toks)
        # Mots visés : ceux du niveau le plus haut de la phrase (les autres mots sont plus faciles).
        for x in set(toks):
            for w in single.get(x, []):
                if LEVELS.index(w['l']) != top: continue
                # Mots-outils (please, hello, yes…) : seulement la forme exacte.
                if w['p'] not in FLEX_POS and x != w['w'].lower(): continue
                m = re.search(r"(?i)(?<![A-Za-z'-])(" + re.escape(x) + r")(?![A-Za-z-])", t)
                if not m: continue
                marked = t[:m.start()] + '*' + m.group(1) + '*' + t[m.end():]
                good = [f for f in frs if not LITTERAIRE.search(f) and sense_ok(w, f)]
                if not good: continue
                fr = min(good, key=lambda f: abs(len(f) - len(t) * 1.15))
                cand[w['id']].append((names, len(toks), marked, fr))

    out, n = [], 0
    for w in words:
        lst = cand.get(w['id'], [])
        own = w['ex'][0].replace('*', '').lower()
        seen, chosen = {own}, []
        random.shuffle(lst)
        for names, ln, marked, fr in sorted(lst, key=lambda c: (c[0] > 0, abs(c[1] - 6))):
            key = marked.replace('*', '').lower()
            if key in seen: continue
            if names and sum(1 for c in chosen if c[0]) >= 1: continue  # au plus une phrase avec Tom/Mary
            seen.add(key); chosen.append((names, ln, marked, fr))
            if len(chosen) >= PER_WORD: break
        for _, _, marked, fr in chosen:
            out.append(f"{w['id']}\t{marked}\t{fr}"); n += 1
    (ROOT / 'content' / 'src' / 'en-examples.tsv').write_text(
        '# Généré par tools/mine-examples.py (Tatoeba, CC BY 2.0 FR) : id du mot, phrase avec *cible*, traduction.\n' + '\n'.join(out) + '\n', encoding='utf-8')
    have = sum(1 for w in words if cand.get(w['id']))
    print(f'{n} phrases pour {have}/{len(words)} mots')


main()
