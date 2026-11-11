"""Genera una versión reducida de la fuente Material Symbols con solo los íconos usados en src/.
Uso (opcional, al agregar íconos nuevos):  pip install fonttools brotli  y  python scripts/subset-iconos.py"""
import re, pathlib
from fontTools.ttLib import TTFont
from fontTools import subset

raiz = pathlib.Path(__file__).resolve().parent.parent
origen = raiz / 'node_modules/material-symbols/material-symbols-outlined.woff2'
base = TTFont(origen)
# Mapa nombre de ícono → glifo, leído de las ligaduras (algunos nombres son alias, p. ej. location_on → place)
inv = {g: chr(c) for c, g in base.getBestCmap().items()}
glifos = {}
for lk in base['GSUB'].table.LookupList.Lookup:
    for st in lk.SubTable:
        t = getattr(st, 'ExtSubTable', st)
        for primero, ligs in getattr(t, 'ligatures', {}).items():
            for lig in ligs:
                try: glifos[inv[primero] + ''.join(inv[c] for c in lig.Component)] = lig.LigGlyph
                except KeyError: pass
palabras = set()
for f in (raiz / 'src').rglob('*.js*'):
    palabras |= set(re.findall(r"[a-z][a-z0-9_]{1,40}", f.read_text(encoding='utf-8')))
iconos = sorted(p for p in palabras if p in glifos and len(p) > 2)
nombres = set(base.getGlyphOrder())
usar = sorted({glifos[i] for i in iconos}); usar += [g + '.fill' for g in usar if g + '.fill' in nombres]
opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_closure = False; opts.layout_features = ['*']; opts.notdef_outline = True
s = subset.Subsetter(opts)
s.populate(glyphs=usar, text='abcdefghijklmnopqrstuvwxyz0123456789_')
fuente = TTFont(origen); s.subset(fuente)
destino = raiz / 'src/assets/material-symbols-subset.woff2'
fuente.save(destino)
print(f'{len(iconos)} íconos → {destino.stat().st_size // 1024} KB')
