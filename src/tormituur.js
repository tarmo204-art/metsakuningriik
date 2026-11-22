/* =====================================================================
   Tormituur – müütiline hiidtuur, kes tõuseb tormiga
   Tumehall keha, seljal ja külgedel luukilbid, mille vahel sähvivad sinised välgud.
   Püüdmisel lööb kogu püügikohal välk ja tuleb „TORMITUUR!“ hüüe.
   ===================================================================== */
Object.assign(SP_ARCH, { tormituur: 'storm' });
Object.assign(KI, {
  tormituur: ['Acipenser fulminis', 'Tormituur on müütiline hiidtuur, kes magab merepõhjas ja ärkab ainult siis, kui taevas müristab. Kalurid ütlevad, et välk otsib teda – ja tema otsib välku.',
    ['Tormi ajal näkkab ta kõige sagedamini, tormi eel harvem.', 'Virmalislandiga on teda kaks korda lihtsam meelitada.', 'Tema seljakilpidest on leitud sulanud liiva – välgu jälgi.']]
});

function stDraw(c, L, t) {
  const P = (x, y) => [x * L, y * L], sw = Math.sin(t * 2.2) * .025;
  c.save(); c.lineJoin = c.lineCap = 'round';
  // elektrikuma
  const ag = c.createRadialGradient(0, 0, 0, 0, 0, .62 * L); ag.addColorStop(0, `rgba(110,200,255,${.32 + .12 * Math.sin(t * 5)})`); ag.addColorStop(1, 'rgba(110,200,255,0)');
  c.fillStyle = ag; c.beginPath(); c.arc(0, 0, .62 * L, 0, 7); c.fill();
  // sabauim (tuurale omane – ülemine sagar pikem)
  c.beginPath(); c.moveTo(...P(.3, -.03)); c.quadraticCurveTo(...P(.42, -.1 + sw), ...P(.52, -.2 + sw)); c.quadraticCurveTo(...P(.47, -.04 + sw), ...P(.44, .02 + sw));
  c.quadraticCurveTo(...P(.47, .08 + sw), ...P(.45, .12 + sw)); c.quadraticCurveTo(...P(.38, .06), ...P(.3, .04)); c.closePath();
  let g = c.createLinearGradient(...P(.3, 0), ...P(.52, 0)); g.addColorStop(0, '#1c2733'); g.addColorStop(1, '#3a5068'); c.fillStyle = g; c.fill();
  // kõhu- ja rinnauimed
  c.fillStyle = '#26323f';
  c.beginPath(); c.moveTo(...P(-.24, .05)); c.quadraticCurveTo(...P(-.2, .16), ...P(-.12, .15)); c.quadraticCurveTo(...P(-.15, .08), ...P(-.16, .05)); c.fill();
  c.beginPath(); c.moveTo(...P(.08, .06)); c.quadraticCurveTo(...P(.12, .13), ...P(.18, .12)); c.lineTo(...P(.16, .055)); c.fill();
  c.beginPath(); c.moveTo(...P(.14, -.06)); c.quadraticCurveTo(...P(.19, -.15), ...P(.25, -.13)); c.lineTo(...P(.22, -.05)); c.fill(); // seljauim
  // keha (pikk, terava ninaga)
  const body = () => { c.beginPath(); c.moveTo(...P(-.56, .005)); c.quadraticCurveTo(...P(-.5, -.05), ...P(-.38, -.07)); c.bezierCurveTo(...P(-.15, -.11), ...P(.15, -.08), ...P(.31, -.03));
    c.lineTo(...P(.31, .04)); c.bezierCurveTo(...P(.15, .08), ...P(-.15, .1), ...P(-.38, .07)); c.quadraticCurveTo(...P(-.5, .05), ...P(-.56, .005)); c.closePath() };
  body(); g = c.createLinearGradient(...P(0, -.1), ...P(0, .1)); g.addColorStop(0, '#141c26'); g.addColorStop(.45, '#33465a'); g.addColorStop(.7, '#6c8296'); g.addColorStop(1, '#b8c8d4'); c.fillStyle = g; c.fill();
  c.save(); body(); c.clip();
  // välgusooned keha sees (vilguvad)
  const zap = (k, x0, x1, y) => { const a = Math.max(0, Math.sin(t * 6 + k * 2.3)); const al = .45 + .55 * a; c.strokeStyle = `rgba(170,240,255,${al})`; c.lineWidth = Math.max(.9, L * .009); c.shadowColor = '#8ae0ff'; c.shadowBlur = L * .05;
    c.beginPath(); c.moveTo(...P(x0, y)); for (let i = 1; i <= 6; i++) { const x = x0 + (x1 - x0) * i / 6; c.lineTo(...P(x, y + (((i * 37 + k * 11 + Math.floor(t * 8)) % 7) - 3) * .01)) } c.stroke(); c.shadowBlur = 0 };
  zap(0, -.35, -.05, -.02); zap(1, -.1, .22, .02); zap(2, -.3, .1, .045);
  c.restore();
  body(); c.strokeStyle = 'rgba(5,10,20,.7)'; c.lineWidth = Math.max(.7, L * .006); c.stroke();
  // luukilbid: seljal ja külgedel, servad hõõguvad
  const scute = (x, y, s, k) => { const glow = .5 + .5 * Math.sin(t * 4 + k * .8);
    c.beginPath(); c.moveTo(...P(x - s, y)); c.lineTo(...P(x, y - s * .9)); c.lineTo(...P(x + s, y)); c.lineTo(...P(x, y + s * .5)); c.closePath();
    c.fillStyle = `rgb(${120 + glow * 120 | 0},${170 + glow * 80 | 0},255)`; c.shadowColor = '#8ae0ff'; c.shadowBlur = L * .025 * glow; c.fill(); c.shadowBlur = 0;
    c.strokeStyle = `rgba(230,250,255,${glow})`; c.lineWidth = Math.max(.6, L * .004); c.stroke() };
  for (let i = 0; i < 9; i++) { const x = -.36 + i * .075; scute(x, -.075 - Math.sin((i + 1) / 10 * Math.PI) * .02 + (i > 6 ? .02 : 0), .022, i) }
  for (let i = 0; i < 10; i++) scute(-.33 + i * .065, .005, .014, i + 3);
  // nina ja poised
  c.strokeStyle = '#a8b4c0'; c.lineWidth = Math.max(.5, L * .003);
  for (const x of [-.47, -.44]) { c.beginPath(); c.moveTo(...P(x, .04)); c.lineTo(...P(x - .01, .085)); c.stroke() }
  // silm – sinine välgusilm
  const [ex, ey] = P(-.37, -.025); c.fillStyle = '#0a1018'; c.beginPath(); c.arc(ex, ey, L * .018, 0, 7); c.fill();
  c.shadowColor = '#8ae0ff'; c.shadowBlur = L * .07; c.fillStyle = '#e8fbff'; c.beginPath(); c.arc(ex, ey, L * .011, 0, 7); c.fill(); c.shadowBlur = 0;
  // praksuvad kaared keha ümber
  const arc = (k, x, y, dx, dy) => { const f = Math.sin(t * 9 + k * 3.1); if (f < -.2) return; c.strokeStyle = `rgba(200,245,255,${.5 + .5 * f})`; c.lineWidth = Math.max(.8, L * .006); c.shadowColor = '#8ae0ff'; c.shadowBlur = L * .05;
    c.beginPath(); c.moveTo(...P(x, y)); for (let i = 1; i <= 4; i++) { const j = ((i * 53 + k * 17 + Math.floor(t * 10)) % 9 - 4) * .008; c.lineTo(...P(x + dx * i / 4 + j, y + dy * i / 4 - j)) } c.stroke(); c.shadowBlur = 0 };
  arc(0, -.2, -.1, -.04, -.1); arc(1, .1, -.09, .05, -.11); arc(2, -.05, .09, .03, .1); arc(3, .28, .04, .08, .07);
  // välk, mis aeg-ajalt lööb kalast üles
  const ph = (t * .7) % 1;
  if (ph < .22) { const a = 1 - ph / .22; c.strokeStyle = `rgba(220,245,255,${a})`; c.lineWidth = Math.max(1, L * .008); c.shadowColor = '#8ae0ff'; c.shadowBlur = L * .05;
    c.beginPath(); let x = .05, y = -.08; c.moveTo(...P(x, y)); for (let i = 0; i < 5; i++) { x += (i % 2 ? .03 : -.035); y -= .06; c.lineTo(...P(x, y)) } c.stroke(); c.shadowBlur = 0 }
  c.restore();
}

{
  const _dl = drawLook;
  drawLook = function (c, x, y, L, look, t = 0, dir = 1, junk) {
    if (junk || !look || look.fx !== 'storm') return _dl.apply(this, arguments);
    c.save(); c.translate(x, y); c.scale(dir, 1); stDraw(c, L * .92, t || 1.3); c.restore();
  };
}

// püüdmisel: välgusähvatus üle püügikoha ja oma hüüe
(function () {
  const css = document.createElement('style');
  css.textContent = `.st-flash{position:fixed;inset:0;pointer-events:none;z-index:60;background:radial-gradient(circle at 50% 35%,rgba(230,248,255,.95),rgba(140,210,255,.5) 40%,rgba(20,40,80,0) 75%);animation:stFl 1.1s ease-out forwards}
  @keyframes stFl{0%{opacity:0}6%{opacity:1}14%{opacity:.15}22%{opacity:.9}100%{opacity:0}}
  @media (prefers-reduced-motion:reduce){.st-flash{animation-duration:.01s}}`;
  document.head.appendChild(css);
  const _l = fxLand;
  fxLand = function (r) {
    _l(r);
    if (r && r.kind === 'fish' && r.species === 'tormituur') {
      const d = document.createElement('div'); d.className = 'st-flash'; document.body.appendChild(d); setTimeout(() => d.remove(), 1200);
      try { if (typeof noise === 'function') { noise(.08, { f: 3000, q: .7, vol: .35, type: 'highpass' }); setTimeout(() => noise(1.6, { f: 140, to: 60, q: .5, vol: .6, type: 'lowpass' }), 120) } } catch (e) { }
    }
  };
})();
