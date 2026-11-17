import re
root='/home/claude/desk-hub/'
s=open('/home/claude/tools/base_nd.html').read()
s=s.replace('"three":"./vendor/three.module.min.js"','"three":"../vendor/three.module.min.js"')
s=s.replace("import { init } from './turntable3d.js';","import { init } from '../turntable3d.js';")
s=s.replace('href="icon.png"','href="../icon.png"').replace('href="manifest.webmanifest"','href="../manifest.webmanifest"')
s=s.replace("<title>Desk Hub</title>","<title>Desk Hub</title>")
s=s.replace('<meta name="theme-color" content="#16110d">','<meta name="theme-color" content="#121010">')
s=s.replace('content="black-translucent"','content="black-translucent"')
s=re.sub(r'<link href="https://fonts.googleapis.com/css2\?family=Fraunces[^"]*" rel="stylesheet">','<link href="fonts.css" rel="stylesheet">',s)
s=s.replace("let skinName=store.get('skin','black');","let skinName=store.get('skin_nd3','mono');")
s=s.replace("function applySkin(n){skinName=n;store.set('skin',n);","function applySkin(n){skinName=n;store.set('skin_nd3',n);")
s=s.replace('<button data-skin="black">','<button data-skin="noir"><span class="sw" style="background:#141414;position:relative"><i style="position:absolute;left:8px;bottom:7px;width:7px;height:7px;border-radius:50%;background:#d71921"></i></span>Black · red</button>\n          <button data-skin="mono"><span class="sw" style="background:#efefec;position:relative"><i style="position:absolute;left:8px;bottom:7px;width:7px;height:7px;border-radius:50%;background:#d71921"></i></span>White · red</button>\n          <button data-skin="black">')
s=s.replace("const HUB_V='","const HUB_V='G-'+'",1)
# sleeves: color chip instead of gradient tile
s=s.replace("b.style.setProperty('--c',`linear-gradient(150deg,${s.c},${shade(s.c,-35)})`);","b.style.setProperty('--c',s.c);")
s=s.replace("b.innerHTML=`<span>${esc(s.name)}</span>","b.innerHTML=`<i class=\"chipc\"></i><span>${esc(s.name)}</span>")
# dotted timer ring (small dots), mask-driven
a=s.index('<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88"'); b=s.index('</svg>',a)+6
s=s[:a]+'''<svg viewBox="0 0 200 200"><defs><mask id="rm"><circle id="ringArc" cx="100" cy="100" r="88" fill="none" stroke="#fff" stroke-width="14" stroke-dasharray="553" stroke-dashoffset="0" style="transition:stroke-dashoffset 1s linear"/></mask></defs>
              <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0 7.37"/>
              <circle cx="100" cy="100" r="88" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0 7.37" mask="url(#rm)"/></svg>'''+s[b:]
# mesh background element
s=s.replace('<div class="ambient" id="ambient"></div>','<div class="mesh"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="b4"></i></div>\n<div class="ambient" id="ambient"></div>')
s=s.replace('<button class="chip on" data-len="25">25′</button><button class="chip" data-len="50">50′</button>','<button class="chip" data-len="5">5′</button><button class="chip" data-len="15">15′</button><button class="chip on" data-len="25">25′</button><button class="chip" data-len="50">50′</button>')
s=s.replace('<div class="now" id="now">','<canvas id="wave"></canvas>\n      <div class="now" id="now">',1)
s=s.replace('</body>',open('/home/claude/tools/wave.js').read()+'\n</body>',1)
import re as _re  # EYE_ICON
s=_re.sub(r'(<button class="hbtn" id="skinBtn"[^>]*>)<svg.*?</svg>',r'\1<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',s,count=1,flags=_re.S)
exec(open('/home/claude/tools/i18n_en.py').read())

theme=open('/home/claude/tools/glass.css').read()
s=s.replace("</style>",theme+"</style>",1)
open(root+'nd/index.html','w').write(s)
print('built')
