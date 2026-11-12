/* =====================================================================
   Realistlikud söödad ja landid (asendab drawBait'i).
   Iga sööt on joonistatud nii, nagu kalastaja seda kasutab: konksu otsas, varjude, läike ja pisidetailidega.
   Mõõdud: keskpunkt (0,0), r = S * .36; kõik mahub umbes ±1,3r sisse.
   ===================================================================== */
function sbW(S, k) { return Math.max(.5, S * k) }
function sbSteel(c, x0, y0, x1, y1) { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#6e767e'); g.addColorStop(.45, '#eef2f5'); g.addColorStop(.55, '#b9c1c8'); g.addColorStop(1, '#555c63'); return g }
function sbShadow(c, x, y, rx, ry, a = .28) { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, 6.283); c.fill(); c.restore() }
// J-konks: silm üleval, vars alla, kõver ja ots kidaga
function sbHook(c, x, y, s, ang, S, gold) {
  c.save(); c.translate(x, y); c.rotate(ang || 0); c.lineCap = 'round';
  const path = () => { c.beginPath(); c.moveTo(0, -s * .9); c.lineTo(0, s * .35); c.bezierCurveTo(0, s * .78, s * .55, s * .78, s * .56, s * .3); c.lineTo(s * .52, -s * .05) };
  c.strokeStyle = gold ? '#8a6a1a' : '#4a5158'; c.lineWidth = sbW(S, .028); path(); c.stroke();
  c.strokeStyle = gold ? '#f0d070' : '#d8dee3'; c.lineWidth = sbW(S, .014); path(); c.stroke();
  // kida
  c.strokeStyle = gold ? '#c8a040' : '#9aa2a9'; c.lineWidth = sbW(S, .014); c.beginPath(); c.moveTo(s * .53, s * .02); c.lineTo(s * .42, s * .1); c.stroke();
  // silm
  c.lineWidth = sbW(S, .02); c.strokeStyle = gold ? '#c8a040' : '#9aa2a9'; c.beginPath(); c.ellipse(0, -s * .98, s * .09, s * .11, 0, 0, 6.283); c.stroke();
  c.restore();
}
function sbRing(c, x, y, rr, S) { c.lineWidth = sbW(S, .016); c.strokeStyle = '#5a6168'; c.beginPath(); c.arc(x, y, rr, 0, 6.283); c.stroke(); c.lineWidth = sbW(S, .007); c.strokeStyle = '#e4e9ed'; c.beginPath(); c.arc(x, y, rr, -2.4, -.6); c.stroke() }
// kolmikkonks rippumas punktist (x, y)
function sbTreble(c, x, y, s, S, feather) {
  c.save(); c.translate(x, y); c.lineCap = 'round';
  sbRing(c, 0, 0, s * .12, S);
  const shank = () => { c.beginPath(); c.moveTo(0, s * .1); c.lineTo(0, s * .62) };
  c.strokeStyle = '#4a5158'; c.lineWidth = sbW(S, .022); shank(); c.stroke(); c.strokeStyle = '#d0d6db'; c.lineWidth = sbW(S, .01); shank(); c.stroke();
  if (feather) for (let i = 0; i < 7; i++) { const a = -.5 + i * .17; c.strokeStyle = i % 2 ? '#e8343a' : '#ff6a5a'; c.lineWidth = sbW(S, .014); c.beginPath(); c.moveTo(0, s * .55); c.quadraticCurveTo(Math.sin(a) * s * .25, s * .85, Math.sin(a) * s * .32, s * 1.05); c.stroke() }
  for (const k of [-1, 1, 0]) {
    const p = () => { c.beginPath(); c.moveTo(0, s * .6); c.bezierCurveTo(k * s * .05, s * .82, k * s * .38 + (k ? 0 : s * .02), s * .84, k * s * .4 + (k ? 0 : s * .1), s * .5) };
    c.globalAlpha = k === 0 ? .7 : 1; c.strokeStyle = '#4a5158'; c.lineWidth = sbW(S, .022); p(); c.stroke(); c.strokeStyle = '#d0d6db'; c.lineWidth = sbW(S, .01); p(); c.stroke();
  }
  c.globalAlpha = 1; c.restore();
}
// tõmbenöör / pöörel lantide kohal
function sbSwivel(c, x, y, s, S) {
  c.save(); c.translate(x, y); sbRing(c, 0, 0, s * .1, S);
  c.fillStyle = sbSteel(c, -s * .08, 0, s * .08, 0); c.beginPath(); c.ellipse(0, -s * .24, s * .07, s * .13, 0, 0, 6.283); c.fill(); c.strokeStyle = '#4a5158'; c.lineWidth = sbW(S, .008); c.stroke();
  sbRing(c, 0, -s * .44, s * .08, S); c.restore();
}

function drawBaitReal(c, S, id, t) {
  const r = S * .36;
  c.save();
  switch (id) {
    /* ---------- leivatükk ---------- */
    case 'leib': {
      sbShadow(c, r * .05, r * .55, r * .95, r * .2);
      // pehmed kõverad läbi punktide; ühel küljel rebitud serv
      const edge = (k) => { const n = 18, P = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, rr = r * k * (.82 + .1 * Math.sin(a * 2 + 1) + .05 * Math.sin(a * 5 + .5) + (a > 4.4 && a < 5.9 ? .05 * Math.sin(a * 17) : 0)); P.push([Math.cos(a) * rr * 1.18, Math.sin(a) * rr * .78]) }
        c.beginPath(); const m = (i) => [(P[i % n][0] + P[(i + 1) % n][0]) / 2, (P[i % n][1] + P[(i + 1) % n][1]) / 2]; let s0 = m(0); c.moveTo(s0[0], s0[1]); for (let i = 1; i <= n; i++) { const q = P[i % n], e = m(i); c.quadraticCurveTo(q[0], q[1], e[0], e[1]) } c.closePath() };
      // koorik
      edge(1); let g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#b8692a'); g.addColorStop(.5, '#9a4f1c'); g.addColorStop(1, '#6e3510'); c.fillStyle = g; c.fill();
      // sisu (pehme sai)
      c.save(); c.translate(-r * .06, r * .04); edge(.82); g = c.createRadialGradient(-r * .2, -r * .25, r * .1, 0, 0, r); g.addColorStop(0, '#fff4dc'); g.addColorStop(.7, '#f1dcb0'); g.addColorStop(1, '#d9b67c'); c.fillStyle = g; c.fill(); c.clip();
      for (let i = 0; i < 40; i++) { const x = (th(i, 3, 1) - .5) * r * 1.7, y = (th(i, 5, 1) - .5) * r * 1.2, s2 = r * (.025 + th(i, 7, 1) * .05); c.fillStyle = 'rgba(170,120,60,.35)'; c.beginPath(); c.ellipse(x, y, s2 * 1.3, s2, th(i, 9, 1) * 3, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x - s2 * .3, y - s2 * .4, s2 * .5, s2 * .3, 0, 0, 6.283); c.fill() }
      c.restore();
      // koorikul läige (koorikuserva sees)
      c.save(); edge(1); c.clip(); c.strokeStyle = 'rgba(255,215,160,.5)'; c.lineWidth = sbW(S, .016); c.beginPath(); c.ellipse(-r * .05, -r * .02, r * .86, r * .56, 0, 3.7, 4.9); c.stroke(); c.restore();
      break;
    }
    /* ---------- vihmauss konksul ---------- */
    case 'uss': {
      sbShadow(c, 0, r * .62, r * 1.1, r * .16);
      sbHook(c, r * .12, -r * .1, r * .62, .08, S);
      const N = 42, P = [], wv = (u) => Math.sin(u * 6.4 + t * 2.2) * r * .26 * Math.sin(Math.PI * Math.min(1, u * 1.1 + .05));
      for (let i = 0; i <= N; i++) { const u = i / N; P.push([-r * 1.15 + u * r * 2.3, wv(u) + (u - .5) * r * .2]) }
      const wid = (u) => r * .15 * Math.pow(Math.sin(Math.PI * Math.min(.985, Math.max(.015, u))), .45) * (u < .45 ? 1.08 : .95);
      const L = [], R = [];
      for (let i = 0; i <= N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1, nx = -dy / ln, ny = dx / ln, w = wid(i / N); L.push([P[i][0] + nx * w, P[i][1] + ny * w]); R.push([P[i][0] - nx * w, P[i][1] - ny * w]) }
      c.beginPath(); L.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath();
      let g = c.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, '#9a4a4e'); g.addColorStop(.3, '#c46a62'); g.addColorStop(.36, '#d88a6e'); g.addColorStop(.44, '#c46a62'); g.addColorStop(1, '#a25258'); c.fillStyle = g; c.fill();
      c.save(); c.clip();
      // vöö (clitellum)
      c.fillStyle = 'rgba(230,150,110,.55)'; for (let i = Math.round(N * .28); i < Math.round(N * .4); i++) { c.beginPath(); c.arc(P[i][0], P[i][1], wid(i / N) * 1.05, 0, 6.283); c.fill() }
      // rõngad
      c.strokeStyle = 'rgba(90,30,35,.35)'; c.lineWidth = sbW(S, .006); for (let i = 1; i < N; i++) { c.beginPath(); c.moveTo(L[i][0], L[i][1]); c.lineTo(R[i][0], R[i][1]); c.stroke() }
      // varjuserv ja märg läige
      c.strokeStyle = 'rgba(60,15,20,.35)'; c.lineWidth = sbW(S, .03); c.beginPath(); R.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
      c.restore();
      c.strokeStyle = 'rgba(255,235,230,.7)'; c.lineWidth = sbW(S, .012); c.beginPath(); for (let i = 3; i < N - 3; i++) { const p = P[i], q = L[i]; const x = p[0] + (q[0] - p[0]) * .5, y = p[1] + (q[1] - p[1]) * .5; i > 3 ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke();
      // konksu ots tuleb ussist läbi
      const ip = P[Math.round(N * .56)]; c.save(); c.lineCap = 'round'; c.strokeStyle = '#4a5158'; c.lineWidth = sbW(S, .028); c.beginPath(); c.moveTo(ip[0] + r * .2, ip[1] - r * .02); c.lineTo(ip[0] + r * .2, ip[1] - r * .26); c.stroke(); c.strokeStyle = '#e0e6ea'; c.lineWidth = sbW(S, .012); c.stroke(); c.restore();
      break;
    }
    /* ---------- kärbsevaklad konksul ---------- */
    case 'vagel': {
      sbShadow(c, 0, r * .62, r * .95, r * .16);
      sbHook(c, 0, -r * .15, r * .7, 0, S);
      const M = [[-r * .42, r * .12, -.9], [r * .08, r * .38, .15], [r * .5, r * .05, 1.1], [-r * .1, -r * .32, -.35]];
      M.forEach(([x, y, a], i) => {
        c.save(); c.translate(x, y); c.rotate(a + Math.sin(t * 3.5 + i * 1.7) * .12);
        const l = r * .36, w = r * .14;
        c.beginPath(); c.moveTo(-l, 0); c.bezierCurveTo(-l * .7, -w * 1.1, l * .7, -w * 1.25, l, -w * .2); c.bezierCurveTo(l * 1.05, w * .5, l * .7, w * 1.2, 0, w * 1.05); c.bezierCurveTo(-l * .6, w * .9, -l * .85, w * .45, -l, 0); c.closePath();
        const g = c.createLinearGradient(0, -w, 0, w); g.addColorStop(0, '#fffaf0'); g.addColorStop(.5, '#f2e6c8'); g.addColorStop(1, '#cdb88a'); c.fillStyle = g; c.fill();
        c.save(); c.clip();
        c.strokeStyle = 'rgba(160,130,80,.35)'; c.lineWidth = sbW(S, .006); for (let k = -5; k <= 5; k++) { c.beginPath(); c.moveTo(k * l * .17, -w * 1.2); c.quadraticCurveTo(k * l * .17 + w * .2, 0, k * l * .17, w * 1.2); c.stroke() }
        c.fillStyle = 'rgba(150,115,70,.28)'; c.beginPath(); c.ellipse(l * .1, w * .1, l * .55, w * .22, 0, 0, 6.283); c.fill();
        c.restore();
        c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(-l * .1, -w * .45, l * .5, w * .16, -.05, 0, 6.283); c.fill();
        c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(-l * .93, 0, w * .12, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(80,50,20,.6)'; c.beginPath(); c.arc(l * .92, -w * .05, w * .08, 0, 6.283); c.arc(l * .9, w * .25, w * .08, 0, 6.283); c.fill();
        c.restore();
      });
      break;
    }
    /* ---------- magus mais konksul ---------- */
    case 'mais': {
      sbShadow(c, 0, r * .62, r * .9, r * .16);
      sbHook(c, -r * .05, -r * .1, r * .72, -.1, S, true);
      const K = [[-r * .12, -r * .45, -.35], [r * .02, -r * .02, .2], [-r * .08, r * .38, -.15]];
      K.forEach(([x, y, a], i) => {
        c.save(); c.translate(x, y); c.rotate(a); const s = r * .3;
        c.beginPath(); c.moveTo(-s * .85, -s * .55); c.quadraticCurveTo(0, -s * .9, s * .85, -s * .55); c.quadraticCurveTo(s * 1.05, s * .1, s * .7, s * .7); c.quadraticCurveTo(0, s * 1.05, -s * .7, s * .7); c.quadraticCurveTo(-s * 1.05, s * .1, -s * .85, -s * .55); c.closePath();
        const g = c.createRadialGradient(-s * .3, -s * .3, s * .1, 0, 0, s * 1.2); g.addColorStop(0, '#fff2a0'); g.addColorStop(.45, '#f7c62a'); g.addColorStop(1, '#c98a06'); c.fillStyle = g; c.fill();
        c.strokeStyle = 'rgba(140,90,0,.55)'; c.lineWidth = sbW(S, .008); c.stroke();
        // idukoht ja läige
        c.fillStyle = 'rgba(255,250,225,.85)'; c.beginPath(); c.ellipse(0, s * .55, s * .38, s * .2, 0, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(-s * .35, -s * .35, s * .22, s * .12, -.6, 0, 6.283); c.fill();
        c.restore();
      });
      break;
    }
    /* ---------- hõbelant (lusikas) ---------- */
    case 'hobelant': {
      c.scale(.82, .82); c.translate(0, r * .05); c.rotate(-.18 + Math.sin(t * 2) * .05);
      sbSwivel(c, 0, -r * .92, r * .9, S);
      const body = () => { c.beginPath(); c.moveTo(0, -r * .82); c.bezierCurveTo(r * .42, -r * .72, r * .5, r * .2, r * .02, r * .62); c.bezierCurveTo(-r * .5, r * .2, -r * .42, -r * .72, 0, -r * .82); c.closePath() };
      body(); let g = c.createLinearGradient(-r * .45, 0, r * .45, 0); g.addColorStop(0, '#5d6670'); g.addColorStop(.18, '#c9d0d6'); g.addColorStop(.38, '#ffffff'); g.addColorStop(.55, '#9aa4ae'); g.addColorStop(.75, '#e6ebef'); g.addColorStop(1, '#4f5760'); c.fillStyle = g; c.fill();
      c.save(); c.clip();
      // haamritud pind
      for (let i = 0; i < 26; i++) { const x = (th(i, 2, 1) - .5) * r * .8, y = (th(i, 4, 1) - .55) * r * 1.3, s2 = r * (.04 + th(i, 6, 1) * .04); c.fillStyle = i % 2 ? 'rgba(255,255,255,.35)' : 'rgba(40,50,60,.18)'; c.beginPath(); c.ellipse(x, y, s2, s2 * .7, .3, 0, 6.283); c.fill() }
      // liikuv läige
      const sw = ((t * .35) % 1.6 - .3) * r * 2.2; c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(sw - r, -r); c.lineTo(sw - r * .75, -r); c.lineTo(sw + r * .25, r); c.lineTo(sw, r); c.fill();
      // nõgususe vari
      c.strokeStyle = 'rgba(30,40,50,.25)'; c.lineWidth = sbW(S, .04); c.beginPath(); c.ellipse(-r * .05, -r * .08, r * .25, r * .55, 0, 1.2, 4.5); c.stroke();
      c.restore();
      body(); c.strokeStyle = '#3e454c'; c.lineWidth = sbW(S, .012); c.stroke();
      // punane täpp
      c.fillStyle = '#d8322e'; c.beginPath(); c.ellipse(r * .02, r * .2, r * .09, r * .12, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(-r * .01, r * .15, r * .03, 0, 6.283); c.fill();
      sbRing(c, 0, -r * .74, r * .07, S); sbTreble(c, r * .02, r * .66, r * .6, S, true);
      break;
    }
    /* ---------- krevett ---------- */
    case 'krevett': {
      sbShadow(c, 0, r * .66, r * 1.1, r * .16);
      c.rotate(.08);
      const cx = r * .05, cy = r * .1, R0 = r * .58;
      // jalad
      c.strokeStyle = 'rgba(214,110,70,.85)'; c.lineWidth = sbW(S, .01); for (let i = 0; i < 6; i++) { const a = -.5 + i * .3, x = cx + Math.cos(a) * R0 * .55, y = cy + Math.sin(a) * R0 * .55; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - r * .08, y + r * .18, x - r * .02, y + r * .3 + Math.sin(t * 5 + i) * r * .02); c.stroke() }
      // tagakeha lülid (kaar)
      const segs = 6;
      for (let i = segs; i >= 0; i--) {
        const a = -1.35 + (i / segs) * 2.45, x = cx + Math.cos(a) * R0, y = cy + Math.sin(a) * R0, sz = r * (.27 - i * .018);
        c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
        c.beginPath(); c.ellipse(0, 0, sz * 1.05, sz * .8, 0, 0, 6.283);
        const g = c.createLinearGradient(0, -sz, 0, sz); g.addColorStop(0, '#ffd2b8'); g.addColorStop(.4, '#f6976a'); g.addColorStop(1, '#d4603a'); c.fillStyle = g; c.fill();
        c.strokeStyle = 'rgba(150,50,25,.45)'; c.lineWidth = sbW(S, .006); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-sz * .2, -sz * .35, sz * .5, sz * .15, 0, 0, 6.283); c.fill();
        c.restore();
      }
      // saba-lehvik
      const ta = 1.2, tx = cx + Math.cos(ta) * R0 * 1.02, ty = cy + Math.sin(ta) * R0 * 1.02;
      c.save(); c.translate(tx, ty); c.rotate(ta + .3);
      for (const k of [-1, -.4, .4, 1]) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(k * r * .1, r * .18, k * r * .16, r * .3); c.quadraticCurveTo(k * r * .02, r * .26, 0, 0); c.fillStyle = 'rgba(232,120,80,.9)'; c.fill(); c.strokeStyle = 'rgba(150,50,25,.5)'; c.lineWidth = sbW(S, .005); c.stroke() }
      c.restore();
      // pea-kilp ja ninasarv
      const ha = -1.45, hx = cx + Math.cos(ha) * R0 * .95, hy = cy + Math.sin(ha) * R0 * .95;
      c.save(); c.translate(hx, hy); c.rotate(-.3);
      c.beginPath(); c.moveTo(r * .2, r * .05); c.quadraticCurveTo(r * .1, -r * .22, -r * .32, -r * .12); c.lineTo(-r * .62, -r * .2); c.lineTo(-r * .34, -r * .02); c.quadraticCurveTo(-r * .1, r * .2, r * .2, r * .05); c.closePath();
      const hg = c.createLinearGradient(0, -r * .2, 0, r * .2); hg.addColorStop(0, '#ffcdb0'); hg.addColorStop(1, '#e0703f'); c.fillStyle = hg; c.fill(); c.strokeStyle = 'rgba(150,50,25,.5)'; c.lineWidth = sbW(S, .006); c.stroke();
      // silm varrel
      c.strokeStyle = '#c46038'; c.lineWidth = sbW(S, .012); c.beginPath(); c.moveTo(-r * .18, -r * .1); c.lineTo(-r * .26, -r * .2); c.stroke();
      c.fillStyle = '#111'; c.beginPath(); c.arc(-r * .27, -r * .22, r * .055, 0, 6.283); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * .285, -r * .235, r * .018, 0, 6.283); c.fill();
      // tundlad
      c.strokeStyle = 'rgba(200,90,55,.85)'; c.lineWidth = sbW(S, .006);
      c.beginPath(); c.moveTo(-r * .3, -r * .1); c.bezierCurveTo(-r * .7, -r * .55, -r * .9, -r * .2, -r * 1.2, -r * .6 + Math.sin(t * 2) * r * .05); c.stroke();
      c.beginPath(); c.moveTo(-r * .3, -r * .08); c.bezierCurveTo(-r * .8, -r * .1, -r * .95, r * .2, -r * 1.25, r * .05 + Math.sin(t * 2.4) * r * .05); c.stroke();
      c.restore();
      break;
    }
    /* ---------- kuldvobler ---------- */
    case 'kuldvobler': {
      c.rotate(-.06 + Math.sin(t * 2.5) * .04);
      const body = () => { c.beginPath(); c.moveTo(-r * .95, -r * .02); c.bezierCurveTo(-r * .9, -r * .36, -r * .3, -r * .42, r * .35, -r * .3); c.bezierCurveTo(r * .65, -r * .22, r * .85, -r * .1, r * 1.0, -r * .02); c.bezierCurveTo(r * .85, r * .1, r * .6, r * .22, r * .3, r * .28); c.bezierCurveTo(-r * .3, r * .38, -r * .88, r * .28, -r * .95, -r * .02); c.closePath() };
      // sukeldumishuul (läbipaistev plast)
      c.beginPath(); c.moveTo(-r * .92, r * .06); c.lineTo(-r * 1.32, r * .34); c.quadraticCurveTo(-r * 1.36, r * .5, -r * 1.18, r * .48); c.lineTo(-r * .78, r * .22); c.closePath(); c.fillStyle = 'rgba(210,235,250,.45)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = sbW(S, .008); c.stroke();
      sbRing(c, -r * 1.2, r * .4, r * .05, S);
      body(); let g = c.createLinearGradient(0, -r * .42, 0, r * .36); g.addColorStop(0, '#1f3a22'); g.addColorStop(.28, '#4e6a2a'); g.addColorStop(.42, '#f3c440'); g.addColorStop(.72, '#ffe590'); g.addColorStop(1, '#fff6d8'); c.fillStyle = g; c.fill();
      c.save(); c.clip();
      // soomused
      c.strokeStyle = 'rgba(120,80,0,.28)'; c.lineWidth = sbW(S, .006); for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) { const x = -r * .45 + i * r * .15 + (row % 2) * r * .075, y = -r * .22 + row * r * .12; c.beginPath(); c.arc(x, y, r * .085, -1.3, 1.3); c.stroke() }
      // selja mustrid
      c.fillStyle = 'rgba(20,40,20,.45)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(-r * .3 + i * r * .25, -r * .26, r * .07, r * .1, 0, 0, 6.283); c.fill() }
      // läige
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-r * .1, -r * .2, r * .55, r * .05, -.05, 0, 6.283); c.fill();
      c.restore();
      body(); c.strokeStyle = 'rgba(70,50,0,.6)'; c.lineWidth = sbW(S, .01); c.stroke();
      // lõpus
      c.strokeStyle = 'rgba(80,50,0,.5)'; c.lineWidth = sbW(S, .01); c.beginPath(); c.arc(-r * .55, r * .0, r * .2, -1.2, 1.1); c.stroke();
      // silm
      c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(-r * .72, -r * .08, r * .12, 0, 6.283); c.fill(); c.fillStyle = '#e8a010'; c.beginPath(); c.arc(-r * .72, -r * .08, r * .085, 0, 6.283); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(-r * .73, -r * .08, r * .05, 0, 6.283); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * .76, -r * .11, r * .022, 0, 6.283); c.fill();
      // kolmikkonksud
      sbTreble(c, -r * .15, r * .34, r * .5, S); sbTreble(c, r * .62, r * .2, r * .45, S);
      break;
    }
    /* ---------- helendav sööt (jigipea + keerdsabaga kummikas) ---------- */
    case 'valgus': {
      const pulse = .55 + Math.sin(t * 3) * .15;
      const gl = c.createRadialGradient(r * .1, 0, 0, r * .1, 0, r * 1.3); gl.addColorStop(0, `rgba(140,255,240,${pulse * .6})`); gl.addColorStop(1, 'rgba(140,255,240,0)'); c.fillStyle = gl; c.fillRect(-r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
      // keha
      const body = () => { c.beginPath(); c.moveTo(-r * .45, -r * .16); c.bezierCurveTo(-r * .1, -r * .2, r * .3, -r * .14, r * .48, -r * .06); c.lineTo(r * .48, r * .08); c.bezierCurveTo(r * .3, r * .14, -r * .1, r * .2, -r * .45, r * .16); c.closePath() };
      body(); let g = c.createLinearGradient(0, -r * .2, 0, r * .2); g.addColorStop(0, '#e6fffb'); g.addColorStop(.5, '#7cf2dc'); g.addColorStop(1, '#2fb8a8'); c.fillStyle = g; c.fill();
      c.save(); c.clip(); c.strokeStyle = 'rgba(20,110,100,.35)'; c.lineWidth = sbW(S, .01); for (let i = 0; i < 8; i++) { const x = -r * .32 + i * r * .1; c.beginPath(); c.moveTo(x, -r * .25); c.quadraticCurveTo(x + r * .03, 0, x, r * .25); c.stroke() } c.restore();
      // keerdsaba
      c.lineCap = 'round'; c.strokeStyle = '#7cf2dc'; c.lineWidth = sbW(S, .07); const wob = Math.sin(t * 4) * r * .08;
      c.beginPath(); c.moveTo(r * .46, 0); c.bezierCurveTo(r * .75, -r * .05, r * .9, r * .35 + wob, r * .7, r * .5); c.bezierCurveTo(r * .55, r * .6, r * .4, r * .45, r * .55, r * .35); c.stroke();
      c.strokeStyle = 'rgba(230,255,252,.8)'; c.lineWidth = sbW(S, .02); c.stroke();
      // jigipea
      const hg = c.createRadialGradient(-r * .62, -r * .08, r * .02, -r * .55, 0, r * .25); hg.addColorStop(0, '#fff7c8'); hg.addColorStop(.5, '#f4c84a'); hg.addColorStop(1, '#a87410'); c.fillStyle = hg; c.beginPath(); c.arc(-r * .55, 0, r * .22, 0, 6.283); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * .62, -r * .06, r * .075, 0, 6.283); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(-r * .63, -r * .06, r * .045, 0, 6.283); c.fill();
      sbRing(c, -r * .62, -r * .26, r * .05, S);
      // konksu ots tuleb seljast välja
      c.strokeStyle = '#4a5158'; c.lineWidth = sbW(S, .024); c.beginPath(); c.moveTo(r * .12, -r * .12); c.lineTo(r * .16, -r * .38); c.stroke(); c.strokeStyle = '#e0e6ea'; c.lineWidth = sbW(S, .01); c.stroke();
      for (let i = 0; i < 4; i++) { const k = (t * .5 + i / 4) % 1; gSparkle(c, -r * .3 + i * r * .3, -r * .3 - k * r * .5, r * .08 * (1 - k), '#d8fffa') }
      break;
    }
    /* ---------- haldjatolm (klaaspudel) ---------- */
    case 'haldjatolm': {
      glowAt(c, 0, r * .1, r * 1.2, '#f0b0ff', .35 + Math.sin(t * 2) * .08);
      const bottle = () => { c.beginPath(); c.moveTo(-r * .14, -r * .62); c.lineTo(r * .14, -r * .62); c.lineTo(r * .14, -r * .42); c.bezierCurveTo(r * .52, -r * .34, r * .55, -r * .05, r * .52, r * .3); c.quadraticCurveTo(r * .5, r * .68, 0, r * .7); c.quadraticCurveTo(-r * .5, r * .68, -r * .52, r * .3); c.bezierCurveTo(-r * .55, -r * .05, -r * .52, -r * .34, -r * .14, -r * .42); c.closePath() };
      sbShadow(c, 0, r * .74, r * .6, r * .1);
      bottle(); c.fillStyle = 'rgba(220,235,255,.18)'; c.fill();
      c.save(); bottle(); c.clip();
      const pg = c.createLinearGradient(0, -r * .05, 0, r * .7); pg.addColorStop(0, '#ffc8f4'); pg.addColorStop(.5, '#c890ff'); pg.addColorStop(1, '#7a50e0'); c.fillStyle = pg; c.beginPath(); c.moveTo(-r, r * .02 + Math.sin(t * 1.5) * r * .02); c.quadraticCurveTo(0, -r * .06, r, r * .02); c.lineTo(r, r); c.lineTo(-r, r); c.fill();
      for (let i = 0; i < 16; i++) { const tw = .5 + .5 * Math.sin(t * 4 + i * 2.1); c.fillStyle = `rgba(255,255,255,${(.3 + tw * .6).toFixed(2)})`; c.beginPath(); c.arc((th(i, 1, 3) - .5) * r * .8, r * .1 + th(i, 2, 3) * r * .55, r * (.012 + tw * .018), 0, 6.283); c.fill() }
      // klaasi paksus ja peegeldused
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = sbW(S, .05); bottle(); c.stroke();
      c.restore();
      bottle(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = sbW(S, .01); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-r * .3, -r * .02, r * .06, r * .26, .15, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(r * .32, r * .3, r * .03, r * .14, -.2, 0, 6.283); c.fill();
      // kork
      const kg = c.createLinearGradient(-r * .16, 0, r * .16, 0); kg.addColorStop(0, '#8a5a2a'); kg.addColorStop(.5, '#c99560'); kg.addColorStop(1, '#7a4a1e'); c.fillStyle = kg; c.beginPath(); c.moveTo(-r * .17, -r * .58); c.lineTo(r * .17, -r * .58); c.lineTo(r * .15, -r * .86); c.lineTo(-r * .15, -r * .86); c.closePath(); c.fill();
      c.fillStyle = 'rgba(60,30,10,.35)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-r * .1 + th(i, 4, 2) * r * .2, -r * .65 - th(i, 5, 2) * r * .18, r * .015, 0, 6.283); c.fill() }
      // nöör ja silt
      c.strokeStyle = '#d8c090'; c.lineWidth = sbW(S, .01); c.beginPath(); c.moveTo(r * .14, -r * .5); c.quadraticCurveTo(r * .45, -r * .48, r * .5, -r * .3); c.stroke();
      c.save(); c.translate(r * .52, -r * .24); c.rotate(.35); c.fillStyle = '#f4e6c4'; c.fillRect(-r * .1, 0, r * .2, r * .26); c.strokeStyle = 'rgba(120,90,40,.6)'; c.lineWidth = sbW(S, .006); c.strokeRect(-r * .1, 0, r * .2, r * .26); c.fillStyle = '#b070e0'; c.beginPath(); c.arc(0, r * .13, r * .04, 0, 6.283); c.fill(); c.restore();
      for (let i = 0; i < 6; i++) { const k = (t * .35 + i / 6) % 1; gSparkle(c, (th(i, 1, 2) - .5) * r * .9, -r * .95 - k * r * .45, r * .09 * (1 - k), hexA('#fff0ff', 1 - k)) }
      break;
    }
    /* ---------- draakonilant (liigendiga) ---------- */
    case 'draakonilant': {
      glowAt(c, 0, 0, r * 1.5, '#ff7a2a', .35 + Math.sin(t * 2.5) * .1);
      c.rotate(-.05);
      const sw = Math.sin(t * 3) * .12;
      const sec = (x0, x1, h0, h1) => { c.beginPath(); c.moveTo(x0, -h0); c.bezierCurveTo((x0 + x1) / 2, -h0 * 1.15, x1, -h1 * 1.1, x1, 0); c.bezierCurveTo(x1, h1 * 1.1, (x0 + x1) / 2, h0 * 1.15, x0, h0); c.closePath() };
      const paint = (x0, x1, h0, h1) => {
        const g = c.createLinearGradient(0, -h0 * 1.2, 0, h0 * 1.2); g.addColorStop(0, '#4a0a08'); g.addColorStop(.3, '#b81e14'); g.addColorStop(.6, '#ff8a2a'); g.addColorStop(1, '#ffd890'); c.fillStyle = g; sec(x0, x1, h0, h1); c.fill();
        c.save(); sec(x0, x1, h0, h1); c.clip();
        c.strokeStyle = 'rgba(255,210,120,.45)'; c.lineWidth = sbW(S, .007); for (let row = 0; row < 4; row++) for (let i = 0; i < 6; i++) { const x = x0 + (i + .5) * (x1 - x0) / 6 + (row % 2) * (x1 - x0) / 12, y = -h0 * .6 + row * h0 * .4; c.beginPath(); c.arc(x, y, h0 * .25, -1.3, 1.3); c.stroke() }
        c.fillStyle = 'rgba(255,240,200,.4)'; c.beginPath(); c.ellipse((x0 + x1) / 2, -h0 * .5, (x1 - x0) * .4, h0 * .1, 0, 0, 6.283); c.fill();
        c.restore(); c.strokeStyle = 'rgba(60,5,0,.7)'; c.lineWidth = sbW(S, .01); sec(x0, x1, h0, h1); c.stroke();
      };
      // tagumine osa (liigub)
      c.save(); c.translate(r * .05, 0); c.rotate(sw);
      paint(0, r * .7, r * .26, r * .14);
      poly(c, [r * .66, 0, r * 1.05, -r * .32, r * .92, 0, r * 1.05, r * .32], '#ffb030');
      poly(c, [r * .15, -r * .26, r * .3, -r * .48, r * .42, -r * .22], '#ff9a2a');
      c.restore();
      // eesmine osa
      paint(-r * .95, r * .08, r * .3, r * .27);
      for (let i = 0; i < 4; i++) poly(c, [-r * .6 + i * r * .17, -r * .3, -r * .52 + i * r * .17, -r * .52, -r * .44 + i * r * .17, -r * .3], '#ffb030');
      // hõõguv silm
      glowAt(c, -r * .66, -r * .06, r * .25, '#ffd040', .7); c.fillStyle = '#fff2a0'; c.beginPath(); c.arc(-r * .66, -r * .06, r * .09, 0, 6.283); c.fill(); c.fillStyle = '#c03000'; c.beginPath(); c.ellipse(-r * .66, -r * .06, r * .025, r * .07, 0, 0, 6.283); c.fill();
      sbRing(c, -r * .98, 0, r * .06, S);
      sbTreble(c, -r * .35, r * .3, r * .48, S); sbTreble(c, r * .45, r * .16, r * .42, S);
      for (let i = 0; i < 5; i++) { const k = (t * .5 + i / 5) % 1; c.fillStyle = `rgba(255,${150 + i * 15},60,${(1 - k).toFixed(2)})`; c.beginPath(); c.arc(-r * .6 + i * r * .32 + Math.sin(t + i) * r * .05, -r * .4 - k * r * .7, r * .035 * (1 - k * .5), 0, 6.283); c.fill() }
      break;
    }
    default: circ(c, 0, 0, r * .5, '#aaa');
  }
  c.restore();
}
drawBait = drawBaitReal;
