/* =====================================================================
   Müütilised kalad: 10 uut liiki ja nende eriefektid (look.fx).
   Efekt joonistatakse kala peale igal pool, kus kala on näha (püük, saak, kalaraamat, kaardid).
   ===================================================================== */
Object.assign(SP_ARCH, { hiidhai: 'tuna', virmalislohe: 'salmon', aikeseangerjas: 'eel', kristallangerjas: 'eel', vikerkaarekuningas: 'salmon', kummitusforell: 'salmon', rubiinahven: 'perch', kuldnesaga: 'catfish', tahehaug: 'pike', myrgikuningas: 'monster', ajakala: 'angel', merihunt: 'monster' });
Object.assign(GHOST, { kummitusforell: 1 });
Object.assign(KI, {
  aikeseangerjas: ['Anguilla fulminans', 'Äikeseangerjas tõuseb sügavusest ainult äikese ajal. Tema keha on täis elektrit ja sinised sädemed käivad üle naha.', ['Püütav ainult tormiga.', 'Tema lähedal õngenöör sumiseb.', 'Iga välgulöök teeb ta tugevamaks.', 'Tõmbab ligi teisi välgukalu.'], 1],
  vikerkaarekuningas: ['Iridichthys rex', 'Vikerkaarekuningas on kõigi värviliste kalade valitseja. Tema soomused muudavad värvi iga hetkega.', ['Ilmub vihma või päikesega – kõige parem siis, kui mõlemad korraga.', 'Ühelgi kahel kalal pole samu värve.', 'Tema järel tekib vette vikerkaar.', 'Teised vikerkaarekalad järgivad teda.'], 1],
  kummitusforell: ['Salmo spectralis', 'Kummitusforell on peaaegu läbipaistev forell, kelle läbi paistavad luud. Teda nähakse ainult öösel.', ['Kuuvalgel muutub ta peaaegu nähtamatuks.', 'Ujub täiesti hääletult.', 'Vanad kalurid pidasid teda uppunud kaluri hingeks.', 'Hommikuks kaob ta jälle.'], 1],
  rubiinahven: ['Perca rubina', 'Rubiinahven on ahven, kelle soomused on punased ja säravad nagu vääriskivid.', ['Päikese käes säravad ta soomused nagu rubiinid.', 'Kuningakojas hinnatakse teda kõrgelt.', 'Ujub parvedes tavaliste ahvenatega.', 'Iga soomus on erineva tooniga.'], 1],
  kuldnesaga: ['Silurus aureus', 'Kuldne säga on hiiglaslik öine säga, kelle vurrud on puhtast kullast.', ['Tema vurrud helendavad pimedas vees.', 'Võib kaaluda üle 80 kg.', 'Elab sügavates jõeaukudes.', 'Legend ütleb, et kes ta püüab, sellel ei puudu kunagi kulda.'], 1],
  tahehaug: ['Esox stellaris', 'Tähehaug on öine haug, kelle tumedal kehal helendavad täpid nagu tähed taevas.', ['Ilmub ainult selgetel öödel.', 'Tema täppide muster on igal kalal erinev.', 'Jahib tähevalgel.', 'Vanad kalurid lugesid tema täppidest tähtkujusid.'], 1],
  myrgikuningas: ['Venenichthys rex', 'Mürgikuningas on soode ohtlik valitseja, keda ümbritseb roheline mürgiaura.', ['Ilmub ainult udus.', 'Tema ümber muutub vesi roheliseks.', 'Teised kalad põgenevad tema eest.', 'Ole ettevaatlik – tema uimed on teravad.'], 1],
  ajakala: ['Chronichthys aeternus', 'Ajakala on kõige salapärasem kala. Tema ümber keerlevad kellasümbolid ja öeldakse, et ta suudab hetkeks aja peatada.', ['Keegi ei tea, kui vana ta on.', 'Ilmub ainult sügaval öösel.', 'Tema lähedal kellad jäävad seisma.', 'Väga vähesed kalurid on teda näinud.'], 1],
  merihunt: ['Anarhichas regius', 'Kuninglik merihunt on mere valitseja. Tema pead ehib sinine kroon ja ta hambad on tugevad nagu kivi.', ['Päris merihunt elab külmades meredes ja purustab hammastega karbikoori.', 'Kuninglik merihunt on neist kõige suurem.', 'Teised kalad annavad talle teed.', 'Tema kroon helendab sügavuses sinakalt.'], 1],
  kristallangerjas: ['Anguilla crystallina', 'Kristallangerjas on läbipaistev angerjas, kelle keha on nagu kristall. Valgus murdub temas vikerkaareks.', ['Elab kõige külmemates vetes.', 'Tema keha läbi näeb vett.', 'Jääkristallid kasvavad tema uimedel.', 'Talvel on teda kõige kergem leida.'], 1]
});
Object.assign(KI_GRP, { aikeseangerjas: 'angerjas', kristallangerjas: 'angerjas', kummitusforell: 'forell', rubiinahven: 'ahven', tahehaug: 'haug' });

// eriefektid: joonistatakse kala peale (x,y = kala keskpunkt, L = pikkus, t = aeg sekundites)
function mfStar(c, x, y, r, col) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) } c.closePath(); c.fillStyle = col; c.fill() }
function mfGlow(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, hexA(col, a)); g.addColorStop(1, hexA(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2) }
function mfFx(c, L, look, t) {
  const fx = look.fx, H = L * .16, eel = look.s === 'e';
  const rnd = k => (Math.sin(k * 12.9898) * 43758.5453) % 1, R = k => Math.abs(rnd(k));
  c.save();
  if (fx === 'spark') {
    mfGlow(c, 0, 0, L * .7, '#9ab0ff', .25 + .15 * Math.abs(Math.sin(t * 7)));
    c.strokeStyle = '#fff6a0'; c.lineWidth = Math.max(1, L * .012); c.shadowColor = '#fff080'; c.shadowBlur = L * .05; c.lineJoin = 'round';
    const n = 4, ph = Math.floor(t * 8);
    for (let i = 0; i < n; i++) {
      const s = i + ph * 7, x0 = -L * .4 + R(s) * L * .8, y0 = (R(s + 1) > .5 ? -1 : 1) * H * (.6 + R(s + 2) * .6); c.beginPath(); c.moveTo(x0, y0);
      for (let k = 1; k <= 4; k++) c.lineTo(x0 + (R(s + k * 3) - .5) * L * .12, y0 + Math.sign(y0) * k * H * .28);
      c.stroke();
    }
  } else if (fx === 'rainbow') {
    c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(-L / 2, 0, L / 2, 0), o = (t * .15) % 1;
    ['#ff5a5a', '#ffb84a', '#fff06a', '#6aff8a', '#4ac8ff', '#a06aff', '#ff5a5a'].forEach((col, i) => g.addColorStop(((i / 6) + o) % 1, col));
    c.fillStyle = g; c.globalAlpha = .38; c.fillRect(-L / 2, -L / 2, L, L);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    for (let i = 0; i < 6; i++) mfStar(c, -L * .35 + R(i + 3) * L * .7, (R(i + 9) - .5) * H * 2.6, L * .018 * (.6 + .4 * Math.abs(Math.sin(t * 3 + i))), '#ffffff');
  } else if (fx === 'ghost') {
    for (let i = 0; i < 3; i++) { c.globalAlpha = .18 - i * .05; c.fillStyle = '#e8f4ff'; c.beginPath(); c.ellipse(L * (.5 + i * .12) + Math.sin(t * 2 + i) * L * .02, Math.sin(t + i) * H * .4, L * .1, H * .35, 0, 0, Math.PI * 2); c.fill() }
    c.globalAlpha = 1; mfGlow(c, 0, 0, L * .6, '#d8ecff', .18);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(.6, L * .006); // luud läbi keha
    c.beginPath(); c.moveTo(-L * .3, 0); c.lineTo(L * .3, 0); for (let i = 0; i < 9; i++) { const x = -L * .24 + i * L * .06; c.moveTo(x, -H * .55); c.lineTo(x + L * .02, 0); c.lineTo(x, H * .5) } c.stroke();
  } else if (fx === 'ruby') {
    c.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 22; i++) { const x = -L * .36 + (i % 11) * L * .066, y = (i < 11 ? -.35 : .2) * H * 1.2, s = L * .022;
      c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * .8, y); c.lineTo(x, y + s); c.lineTo(x - s * .8, y); c.closePath(); c.fillStyle = 'rgba(255,40,70,.35)'; c.fill();
      c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * .8, y); c.lineTo(x, y); c.closePath(); c.fillStyle = 'rgba(255,200,210,.45)'; c.fill() }
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3; i++) { const a = Math.abs(Math.sin(t * 2.4 + i * 2)); if (a > .6) mfStar(c, -L * .25 + i * L * .2, -H * .3, L * .03 * a, '#ffe8ec') }
  } else if (fx === 'goldw') {
    mfGlow(c, -L * .45, H * .3, L * .3, '#ffd86a', .3);
    c.strokeStyle = '#ffd86a'; c.lineCap = 'round'; c.shadowColor = '#ffe8a0'; c.shadowBlur = L * .03; const sw = Math.sin(t * 2) * L * .02;
    [[.9, 1.3, 1], [.6, 1.0, .8], [.3, 1.6, .7], [.1, .9, .6]].forEach(([dy, len, wdt], i) => { c.lineWidth = Math.max(1, L * .012 * wdt); c.beginPath(); c.moveTo(-L * .44, H * (.05 + i * .05)); c.bezierCurveTo(-L * .55, H * (dy + .2), -L * (.5 + len * .08), H * (dy + .9) + sw, -L * (.42 + len * .1), H * (dy + 1.6) + sw); c.stroke() });
    c.shadowBlur = 0;
    for (let i = 0; i < 4; i++) { const a = Math.abs(Math.sin(t * 2 + i * 1.7)); mfStar(c, -L * .5 - L * .05 * i, H * (.6 + i * .5), L * .02 * (.4 + a), '#fff4c0') }
    c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(-L / 2, -H, L / 2, H); g.addColorStop(0, 'rgba(255,240,180,0)'); g.addColorStop(((t * .3) % 1), 'rgba(255,240,180,.45)'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = g; c.fillRect(-L / 2, -L / 2, L, L);
  } else if (fx === 'stars') {
    c.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 16; i++) { const x = -L * .38 + R(i + 1) * L * .76, y = (R(i + 31) - .5) * H * 1.5, tw = .55 + .45 * Math.sin(t * 3 + i * 1.3); mfGlow(c, x, y, L * .04, '#c8d8ff', .6 * tw); mfStar(c, x, y, L * .016 * tw + L * .006, '#ffffff') }
    c.globalCompositeOperation = 'source-over';
  } else if (fx === 'toxic') {
    mfGlow(c, 0, 0, L * .75, '#7aff3a', .22 + .1 * Math.sin(t * 2.5));
    for (let i = 0; i < 7; i++) { const p = ((t * .5 + R(i)) % 1), x = -L * .35 + R(i + 5) * L * .7, y = -H * .6 - p * H * 2.2; c.globalAlpha = 1 - p; c.strokeStyle = '#a8ff6a'; c.lineWidth = Math.max(.8, L * .006); c.beginPath(); c.arc(x, y, L * (.012 + R(i + 2) * .018), 0, Math.PI * 2); c.stroke() }
    c.globalAlpha = 1;
  } else if (fx === 'clock') {
    mfGlow(c, 0, 0, L * .7, '#fff0b0', .22);
    const n = 5, rx = L * .58, ry = H * 2.6;
    for (let i = 0; i < n; i++) {
      const a = t * .8 + i * Math.PI * 2 / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry, s = L * (.045 + .015 * Math.sin(a)), front = Math.sin(a) > 0;
      c.globalAlpha = front ? .95 : .45; c.fillStyle = '#fff8e0'; c.strokeStyle = '#8a6a2a'; c.lineWidth = Math.max(.8, s * .14);
      c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(t * 2 + i) * s * .7, y + Math.sin(t * 2 + i) * s * .7); c.moveTo(x, y); c.lineTo(x + Math.cos(t * .3 + i) * s * .45, y + Math.sin(t * .3 + i) * s * .45); c.stroke();
    }
    c.globalAlpha = 1;
  } else if (fx === 'crown') {
    const x = -L * .3, y = -H * 1.35, w = L * .16, h = L * .09; mfGlow(c, x, y, L * .16, '#7ab0ff', .45 + .15 * Math.sin(t * 2));
    c.beginPath(); c.moveTo(x - w / 2, y + h / 2); c.lineTo(x - w / 2, y - h * .2); c.lineTo(x - w * .25, y + h * .1); c.lineTo(x, y - h / 2); c.lineTo(x + w * .25, y + h * .1); c.lineTo(x + w / 2, y - h * .2); c.lineTo(x + w / 2, y + h / 2); c.closePath();
    const g = c.createLinearGradient(x, y - h / 2, x, y + h / 2); g.addColorStop(0, '#bcdcff'); g.addColorStop(1, '#2a5aba'); c.fillStyle = g; c.fill(); c.strokeStyle = '#e8f2ff'; c.lineWidth = Math.max(.8, L * .006); c.stroke();
    [[-w / 2, -h * .2], [0, -h / 2], [w / 2, -h * .2]].forEach(([dx, dy]) => { c.beginPath(); c.arc(x + dx, y + dy, L * .01, 0, Math.PI * 2); c.fillStyle = '#ffffff'; c.fill() });
    c.beginPath(); c.arc(x, y + h * .15, L * .012, 0, Math.PI * 2); c.fillStyle = '#4ae0ff'; c.fill();
  } else if (fx === 'crystal') {
    mfGlow(c, 0, 0, L * .7, '#c8f0ff', .28);
    c.globalCompositeOperation = 'source-atop'; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(.6, L * .005);
    c.beginPath(); for (let i = 0; i < 14; i++) { const x = -L * .45 + i * L * .07; c.moveTo(x, -H); c.lineTo(x + L * .05, H); c.moveTo(x + L * .05, -H); c.lineTo(x, H) } c.stroke();
    const g = c.createLinearGradient(-L / 2, 0, L / 2, 0), o = (t * .2) % 1; g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(o, 'rgba(255,255,255,.55)'); g.addColorStop(Math.min(1, o + .08), 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-L / 2, -L / 2, L, L);
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 4; i++) { const a = Math.abs(Math.sin(t * 2 + i * 1.6)); if (a > .5) mfStar(c, -L * .3 + i * L * .2, (i % 2 ? -1 : 1) * H * .5, L * .025 * a, '#ffffff') }
  }
  c.restore();
}
{
  const _dl = drawLook;
  drawLook = function (c, x, y, L, look, t = 0, dir = 1, junk) {
    if (junk || !look || !look.fx) return _dl.apply(this, arguments);
    // läbipaistvad kalad (kristall) joonistatakse poolläbipaistvalt
    const ga = c.globalAlpha; if (look.fx === 'crystal' || look.fx === 'ghost') c.globalAlpha = ga * (look.fx === 'crystal' ? .72 : 1);
    // efektid, mis kasutavad 'source-atop', vajavad eraldi kihti, et taust ei värvuks
    const atop = { rainbow: 1, ruby: 1, goldw: 1, stars: 1, crystal: 1 }[look.fx];
    if (atop && typeof OffscreenCanvas !== 'undefined' || atop && typeof document !== 'undefined') {
      const m = c.getTransform(), sc = Math.max(1, Math.hypot(m.a, m.b)), S = Math.ceil(L * 1.6 * sc), cv = document.createElement('canvas'); cv.width = cv.height = S;
      const k = cv.getContext('2d'); k.setTransform(sc, 0, 0, sc, S / 2, S / 2); _dl.call(this, k, 0, 0, L, look, t, dir); k.save(); k.scale(dir, 1); mfFx(k, L, look, t); k.restore();
      c.save(); c.translate(x, y); c.scale(1 / sc, 1 / sc); c.drawImage(cv, -S / 2, -S / 2); c.restore();
    } else {
      _dl.apply(this, arguments); c.save(); c.translate(x, y); c.scale(dir, 1); mfFx(c, L, look, t); c.restore();
    }
    c.globalAlpha = ga;
  };
}
