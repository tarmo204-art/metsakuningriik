/* =====================================================================
   Õhtukuma – iga päev kell 19–22 (Tallinna aeg) annab kalapüük topelt kogemust.
   Topeltkogemuse arvutab server (fx_kuma / fx_xp_mult). Siin on ainult välimus:
   kuldne õhtupäike püügistseenis, sädemed, bänner, kuldne kogemuse riba ja ×2 märgid.
   ===================================================================== */
const KUMA = { from: 19, to: 22, was: null };

document.head.insertAdjacentHTML('beforeend', `<style>
.kuma-b{position:relative;overflow:hidden;border-radius:18px;padding:16px 18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 14px;align-items:center;
  color:#fff3df;border:1px solid rgba(255,190,120,.45);
  background:radial-gradient(60% 140% at 12% 120%,rgba(255,200,110,.75),transparent 60%),linear-gradient(100deg,#3b1f4f 0%,#7a2f52 38%,#c4543f 70%,#f09a4a 100%)}
.kuma-b::before{content:"";position:absolute;left:-40px;bottom:-62px;width:150px;height:150px;border-radius:50%;
  background:radial-gradient(circle,#fff1c4 0%,#ffcf6e 35%,rgba(255,170,80,.0) 70%);filter:blur(1px);animation:kumaSun 6s ease-in-out infinite}
.kuma-b::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.05) 0 2px,transparent 2px 9px);mask-image:linear-gradient(180deg,transparent 55%,#000);-webkit-mask-image:linear-gradient(180deg,transparent 55%,#000);pointer-events:none}
.kuma-b > *{position:relative;z-index:1}
.kuma-b h2{margin:0;font-family:var(--f-display),Georgia,serif;font-weight:400;font-size:26px;line-height:1.1;color:#fff6e4;text-shadow:0 2px 10px rgba(80,20,40,.5)}
.kuma-b p{margin:0;font-size:14px;line-height:1.45;color:#ffe6c8}
.kuma-b p b{color:#fff}
.kuma-x{grid-row:span 2;font-family:Georgia,serif;font-size:54px;line-height:1;font-weight:700;letter-spacing:-.02em;
  background:linear-gradient(180deg,#fff7d6,#ffcf6e 55%,#f09a4a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 8px rgba(90,20,30,.45))}
.kuma-bar{grid-column:1/-1;height:5px;border-radius:4px;background:rgba(0,0,0,.25);overflow:hidden}
.kuma-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#ffe6a8,#fff)}
.kuma-sp{position:absolute;bottom:-8px;width:4px;height:4px;border-radius:50%;background:#ffe2a0;box-shadow:0 0 8px 2px rgba(255,200,110,.8);z-index:0;opacity:0;animation:kumaRise 5.5s linear infinite}
.kx2{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:8px;font:800 12px system-ui;color:#3a1408;vertical-align:middle;
  background:linear-gradient(180deg,#ffe2a0,#f09a4a);box-shadow:0 0 10px rgba(255,170,90,.55)}
.fv-xp.kuma{box-shadow:0 0 12px rgba(255,170,90,.45)}
.fv-xp.kuma i{background:linear-gradient(90deg,#f09a4a,#ffe2a0,#f09a4a);background-size:200% 100%;animation:kumaFlow 2.4s linear infinite}
@keyframes kumaSun{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.05)}}
@keyframes kumaRise{0%{transform:translate(0,0);opacity:0}12%{opacity:.9}100%{transform:translate(var(--dx),-120px);opacity:0}}
@keyframes kumaFlow{from{background-position:0 0}to{background-position:-200% 0}}
@media (max-width:560px){.kuma-b{padding:14px}.kuma-b h2{font-size:22px}.kuma-x{font-size:42px}}
@media (prefers-reduced-motion:reduce){.kuma-b::before,.kuma-sp,.fv-xp.kuma i{animation:none!important}.kuma-sp{display:none}}
</style>`);

function kumaHour() { return typeof remTallinn === 'function' ? remTallinn(typeof remNow === 'function' ? remNow() : Date.now()) : new Date().getHours() + new Date().getMinutes() / 60 }
function kumaOn() { const h = kumaHour(); return h >= KUMA.from && h < KUMA.to }
function kumaEnd() { return Date.now() + (KUMA.to - kumaHour()) * 36e5 }
function kumaNext() { const h = kumaHour(); return Date.now() + ((h < KUMA.from ? KUMA.from - h : 24 - h + KUMA.from)) * 36e5 }
function kumaLeft() { const ms = kumaEnd() - Date.now(), m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min` }

/* ---------- bänner püügi lehel ---------- */
function kumaBanner() {
  if (!kumaOn()) return '';
  const k = typeof KT !== 'undefined' && KT.d && KT.d.active, pct = Math.min(100, (kumaHour() - KUMA.from) / (KUMA.to - KUMA.from) * 100);
  const sparks = Array.from({ length: 9 }, (_, i) => `<i class="kuma-sp" style="left:${8 + i * 10.5}%;--dx:${(i % 2 ? 1 : -1) * (6 + i * 2)}px;animation-delay:${(i * .63).toFixed(2)}s;animation-duration:${(4.6 + (i % 4) * .7).toFixed(1)}s"></i>`).join('');
  return `<section class="kuma-b" aria-label="Õhtukuma">${sparks}
    <h2>Õhtukuma</h2><span class="kuma-x" aria-label="topelt kogemus">×2</span>
    <p>${k ? '<b>Kalatund käib</b> ja iga kala annab <b>topelt kogemust</b>!' : 'Iga kala, leid ja kirst annab <b>topelt kogemust</b>.'} Kuni kella 22-ni, veel ${kumaLeft()}.</p>
    <div class="kuma-bar"><i style="width:${pct.toFixed(1)}%"></i></div></section>`;
}

/* ---------- püügistseen: õhtupäike ja sädemed ---------- */
{
  const baseBackdrop = drawBackdrop;
  drawBackdrop = function (c, w, h, t, night, d, wTop, wBot) {
    baseBackdrop(c, w, h, t, night, d, wTop, wBot);
    if (!kumaOn()) return;
    const k = night ? .5 : 1, hz = h * .32, sx = w * .8;
    c.save();
    // soe loojangutoon kogu pildile (taevas rohkem, vesi vähem)
    c.globalCompositeOperation = 'multiply';
    const m = c.createLinearGradient(0, 0, 0, h); m.addColorStop(0, `rgba(255,140,110,${.55 * k})`); m.addColorStop(.3, `rgba(255,185,120,${.45 * k})`); m.addColorStop(1, `rgba(220,150,170,${.3 * k})`);
    c.fillStyle = m; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'soft-light';
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(255,110,70,${.6 * k})`); g.addColorStop(.32, `rgba(255,170,90,${.55 * k})`); g.addColorStop(1, `rgba(190,70,120,${.35 * k})`);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'screen';
    const s = c.createRadialGradient(sx, hz, 0, sx, hz, h * .55); s.addColorStop(0, `rgba(255,214,140,${.8 * k})`); s.addColorStop(.3, `rgba(255,160,90,${.35 * k})`); s.addColorStop(1, 'rgba(255,120,60,0)');
    c.fillStyle = s; c.fillRect(0, 0, w, h);
    // päikese peegeldus vees: väreleb
    for (let i = 0; i < 9; i++) {
      const y = hz + 6 + i * (h - hz) / 10, ww = (w * .05) * (1 - i / 12) * (1 + .35 * Math.sin(t * 2.2 + i * 1.7)), a = (.45 - i * .035) * k;
      c.fillStyle = `rgba(255,214,150,${Math.max(0, a)})`; c.beginPath(); c.ellipse(sx + Math.sin(t * 1.3 + i) * 4, y, ww, 1.6 + i * .25, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  };
  const baseFx = drawFx;
  drawFx = function (c, w, h, dt, t) {
    baseFx(c, w, h, dt, t);
    if (!kumaOn() || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    c.save(); c.globalCompositeOperation = 'screen';
    for (let i = 0; i < 14; i++) {
      const sp = 10 + (i % 4) * 5, x = (i * 97.3 + Math.sin(t * .7 + i) * 18 + t * (4 + i % 3)) % w, y = h - ((t * sp + i * 61) % (h * .95)), a = .55 * Math.sin(Math.PI * (1 - y / h));
      c.fillStyle = `rgba(255,205,130,${Math.max(0, a).toFixed(3)})`; c.beginPath(); c.arc((x + w) % w, y, 1.1 + (i % 3) * .5, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  };
  // päis: kuldne kogemuse riba ja ×2
  const baseHeader = fvHeader;
  fvHeader = function () { const h = baseHeader(); if (!kumaOn()) return h; return h.replace('class="fv-xp', 'class="fv-xp kuma').replace('</b><div class="fv-xp', ' <span class="kx2" title="Õhtukuma: topelt kogemus kuni kella 22-ni">×2</span></b><div class="fv-xp') };
  // bänner püügi lehe kõige ülemiseks
  const basePuukK = tabPuuk;
  tabPuuk = function () { let b = ''; try { b = kumaBanner() } catch (e) { } return b + basePuukK() };
}
// algus ja lõpp: teade ja uus joonistus
setInterval(() => {
  const on = kumaOn();
  if (KUMA.was !== null && on !== KUMA.was && CL.user) {
    if (on) { toast('Õhtukuma algas! Kuni kella 22-ni annab kalapüük topelt kogemust.', 'gold', 'fish'); if (typeof sfx === 'function') sfx('chime') }
    else toast('Õhtukuma lõppes. Homme kell 19 tuleb uuesti!', 'info');
    if (FV.open) { if (typeof refreshFS === 'function') refreshFS().then(() => renderFV(true)); else renderFV(true) }
  }
  KUMA.was = on;
}, 20000);
