#!/usr/bin/env python3
"""Ehitab mängu: index.html (Netlify, Supabase server) ja claude.ai versioon."""
import os, sys
R = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(R, 'src')
def read(n): return open(os.path.join(S, n), encoding='utf-8').read()
BASE = ['data.js', 'data2.js', 'engine.js', 'render.js', 'ui.js', 'adventure.js', 'elu.js', 'heli.js', 'noustaja.js', 'loodus.js', 'joulud.js', 'tabel.js']
HEAD_DOC = '<!doctype html><html lang="et"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="description" content="Metsakuningriik – rahulik metsakuningriigi mäng kalapüügiga"><style>:root{color-scheme:dark;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
def web():
    js = '\n'.join(read(n) for n in BASE + ['kalapuuk.js', 'kalastseen.js', 'cloud.js', 'koostoo.js', 'pwa.js', 'saladus.js', 'meeldetuletus.js', 'paev.js', 'ohtukuma.js'])
    pwa = '<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#12261b"><link rel="icon" type="image/png" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Metsakuningriik">'
    html = HEAD_DOC.replace('</head>', pwa + '</head>') + read('head.html') + '\n<script src="vendor/supabase.js"></script>\n<script>\n' + js + '\n</script>\n</body></html>'
    open(os.path.join(R, 'index.html'), 'w', encoding='utf-8').write(html)
    print('index.html', len(html))
def artifact(out):
    js = '\n'.join(read(n) for n in BASE + ['leaderboard.js', 'fishing.js', 'export.js'])
    html = read('head.html') + '<script>\n' + js + '\n</script>'
    open(out, 'w', encoding='utf-8').write(html); print(out, len(html))
web()
if len(sys.argv) > 1: artifact(sys.argv[1])
