/* =====================================================================
   Merikurat – müütiline süvamere-kuningas (täiesti uus välimus)
   Tumelilla keha helendavate pragude ja valgustäppidega, hiiglaslik alalõug
   nõeltaoliste hammastega ja kolm helendavat ridva-latrit pea kohal.
   Joonistatakse koodiga ise; sama pilt on püügil, saagis, kalaraamatus ja kaartidel.
   ===================================================================== */
Object.assign(SP_ARCH, { merikurat: 'abyss' });
Object.assign(KI, {
  merikurat: ['Lophius rex abyssi', 'Merikurat on müütiline süvamere-kuningas. Tema kolm helendavat latrit on sügavuses nähtavad nagu tähed – kes neid järgib, satub otse tema lõugade vahele.',
    ['Keskmine latter helendab nii eredalt, et selle valgel saaks lugeda.', 'Kehal hõõguvad praod, mis vanade kalurite sõnul on tekkinud vulkaani lähedal elades.', 'Ta jahib ainult öösel ja ainult Sügavikus.', 'Tema hambad on klaasjad ja painduvad sissepoole – kord haaratud saak enam ei pääse.'], 1]
});

function mkDraw(c, L, t, glow = 1) {
  const P = (x, y) => [x * L, y * L], pulse = k => .6 + .4 * Math.sin(t * 2.4 + k);
  const jaw = .55 + .45 * (.5 + .5 * Math.sin(t * .8)); // suu avanemine
  c.save(); c.lineJoin = c.lineCap = 'round';

  // kuma taga
  const ag = c.createRadialGradient(-.15 * L, 0, 0, -.15 * L, 0, .7 * L); ag.addColorStop(0, `rgba(120,70,200,${.22 * glow})`); ag.addColorStop(1, 'rgba(120,70,200,0)');
  c.fillStyle = ag; c.beginPath(); c.arc(-.15 * L, 0, .7 * L, 0, 7); c.fill();

  // sabauim (narmendav, poolläbipaistev)
  const sw = Math.sin(t * 1.6) * .03;
  c.beginPath(); c.moveTo(...P(.33, -.05));
  const tail = [[.46, -.2 + sw], [.5, -.12 + sw], [.53, -.05 + sw], [.5, .02 + sw], [.54, .09 + sw], [.48, .17 + sw]];
  tail.forEach(([x, y], i) => { const [px, py] = P(x, y); c.lineTo(px, py); if (i < tail.length - 1) c.lineTo(...P((x + tail[i + 1][0]) / 2 - .03, (y + tail[i + 1][1]) / 2)) });
  c.lineTo(...P(.33, .05)); c.closePath();
  const tg = c.createLinearGradient(...P(.33, 0), ...P(.54, 0)); tg.addColorStop(0, 'rgba(60,30,90,.95)'); tg.addColorStop(1, 'rgba(90,60,160,.25)'); c.fillStyle = tg; c.fill();
  c.strokeStyle = 'rgba(160,120,255,.35)'; c.lineWidth = Math.max(.6, L * .003);
  tail.forEach(([x, y]) => { c.beginPath(); c.moveTo(...P(.34, 0)); c.lineTo(...P(x, y)); c.stroke() });
  c.shadowColor = '#7cf0ff'; c.shadowBlur = L * .02 * glow; c.fillStyle = '#9ff6ff';
  tail.forEach(([x, y], i) => { c.globalAlpha = Math.min(1, glow * pulse(i)); c.beginPath(); c.arc(...P(x, y), L * .006, 0, 7); c.fill() });
  c.globalAlpha = 1; c.shadowBlur = 0;

  // seljauim (ogad ja kile)
  c.beginPath(); c.moveTo(...P(.02, -.2)); [[.06, -.3], [.1, -.21], [.15, -.27], [.19, -.17], [.24, -.21], [.27, -.11]].forEach(p => c.lineTo(...P(...p))); c.lineTo(...P(.3, -.07)); c.closePath();
  c.fillStyle = 'rgba(70,40,110,.75)'; c.fill(); c.strokeStyle = 'rgba(150,110,240,.4)'; c.stroke();

  // keha: suur pea ja kitsenev saba, alalõug ette
  const ja = .05 + .04 * jaw; // lõua liikumine (suu on alati lahti)
  c.beginPath();
  c.moveTo(...P(-.47, -.02));                                        // ülalõua tipp
  c.bezierCurveTo(...P(-.42, -.2), ...P(-.22, -.3), ...P(-.02, -.24)); // laup
  c.bezierCurveTo(...P(.14, -.19), ...P(.27, -.1), ...P(.35, -.05));  // selg
  c.lineTo(...P(.35, .05));
  c.bezierCurveTo(...P(.24, .12), ...P(.08, .23), ...P(-.12, .23));   // kõht
  c.bezierCurveTo(...P(-.3, .23), ...P(-.44, .16 + ja), ...P(-.52, .07 + ja)); // alalõug
  c.lineTo(...P(-.47, .045 + ja * .6));                               // alalõua serv
  c.quadraticCurveTo(...P(-.3, .06 + ja * .5), ...P(-.16, .035));     // suunurk
  c.quadraticCurveTo(...P(-.3, .0), ...P(-.47, -.02));
  c.closePath();
  const bg = c.createLinearGradient(0, -.3 * L, 0, .25 * L); bg.addColorStop(0, '#3b1f5e'); bg.addColorStop(.5, '#1c0f2e'); bg.addColorStop(1, '#09050f'); c.fillStyle = bg; c.fill();
  c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = Math.max(1, L * .004); c.stroke();
  c.save(); c.clip();
  // tüükad
  c.fillStyle = 'rgba(0,0,0,.35)';
  for (let i = 0; i < 26; i++) { const x = -.38 + ((i * 37) % 60) / 100, y = -.2 + ((i * 53) % 40) / 100; c.beginPath(); c.arc(...P(x, y), L * (.006 + (i % 3) * .003), 0, 7); c.fill() }
  // helendavad praod
  c.shadowColor = '#b48cff'; c.shadowBlur = L * .025 * glow; c.strokeStyle = '#c9a8ff'; c.lineWidth = Math.max(.7, L * .0045);
  [[[-.3, -.18], [-.24, -.12], [-.26, -.05], [-.19, .0]], [[-.06, -.2], [-.02, -.12], [.05, -.1], [.08, -.02], [.15, .02]], [[-.1, .1], [-.02, .08], [.04, .14], [.12, .1]], [[.18, -.12], [.22, -.06], [.28, -.04]]]
    .forEach((pts, k) => { c.globalAlpha = Math.min(1, glow * pulse(k * 1.7)); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(...P(...p)) : c.moveTo(...P(...p))); c.stroke() });
  c.globalAlpha = 1; c.shadowBlur = 0;
  // kõhu kuma
  c.fillStyle = 'rgba(90,60,150,.18)'; c.beginPath(); c.ellipse(...P(-.05, .17), .25 * L, .06 * L, 0, 0, 7); c.fill();
  c.restore();
  // suu sisemus
  c.beginPath(); c.moveTo(...P(-.46, -.012)); c.quadraticCurveTo(...P(-.3, .005), ...P(-.17, .035)); c.quadraticCurveTo(...P(-.3, .055 + ja * .5), ...P(-.47, .05 + ja * .6)); c.closePath();
  const mg = c.createLinearGradient(...P(-.47, 0), ...P(-.17, 0)); mg.addColorStop(0, '#2a0b18'); mg.addColorStop(1, '#070208'); c.fillStyle = mg; c.fill();
  // hambad: pikad, klaasjad, otsad helendavad
  const tooth = (x, y, len, dir, k) => { const [bx, by] = P(x, y); c.beginPath(); c.moveTo(bx - L * .006, by); c.quadraticCurveTo(bx + L * .004, by + dir * len * L * .6, bx + L * .01, by + dir * len * L); c.lineTo(bx + L * .006, by); c.closePath();
    const g = c.createLinearGradient(bx, by, bx, by + dir * len * L); g.addColorStop(0, 'rgba(235,240,255,.95)'); g.addColorStop(1, 'rgba(160,240,255,.9)'); c.fillStyle = g; c.fill() };
  for (let i = 0; i < 7; i++) tooth(-.45 + i * .04, -.008 + i * .006, .028 + (i % 2) * .018, 1, i);
  for (let i = 0; i < 7; i++) tooth(-.49 + i * .045, .045 + ja * .6 - i * (ja * .08), .035 + ((i + 1) % 2) * .022, -1, i);
  // silm
  c.shadowColor = '#b6ff9a'; c.shadowBlur = L * .03 * glow; c.fillStyle = '#d9ffb8'; c.beginPath(); c.ellipse(...P(-.23, -.12), .02 * L, .016 * L, -.2, 0, 7); c.fill();
  c.shadowBlur = 0; c.fillStyle = '#0a1404'; c.beginPath(); c.ellipse(...P(-.232, -.12), .004 * L, .013 * L, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = L * .006; c.beginPath(); c.moveTo(...P(-.27, -.15)); c.quadraticCurveTo(...P(-.23, -.165), ...P(-.19, -.145)); c.stroke();
  // rinnauim
  c.beginPath(); c.moveTo(...P(-.02, .06)); [[.06, .2], [.1, .16], [.13, .22], [.15, .14], [.13, .07]].forEach(p => c.lineTo(...P(p[0], p[1] + Math.sin(t * 2) * .01))); c.closePath();
  c.fillStyle = 'rgba(110,70,190,.45)'; c.fill(); c.strokeStyle = 'rgba(180,140,255,.45)'; c.lineWidth = Math.max(.6, L * .0025); c.stroke();
  // valgustäpid (süttivad järjest)
  for (let i = 0; i < 9; i++) { const x = -.12 + i * .055, y = .02 + Math.sin(i * .7) * .02, on = .5 + .5 * Math.sin(t * 3 - i * .7);
    c.shadowColor = '#7cf0ff'; c.shadowBlur = L * .02 * glow * on; c.fillStyle = `rgba(150,245,255,${(.3 + .7 * on) * glow})`; c.beginPath(); c.arc(...P(x, y), L * .006, 0, 7); c.fill() }
  for (let i = 0; i < 6; i++) { const x = -.3 + i * .06, on = .5 + .5 * Math.sin(t * 3 - i * .9 + 2);
    c.shadowColor = '#c9a8ff'; c.shadowBlur = L * .015 * glow * on; c.fillStyle = `rgba(210,180,255,${(.3 + .7 * on) * glow})`; c.beginPath(); c.arc(...P(x, .16 + i * .004), L * .005, 0, 7); c.fill() }
  c.shadowBlur = 0;

  // kolm latrit (ridvad helendavate pallidega)
  const lure = (bx, by, tx, ty, cx, cy, r, col, k) => {
    const s1 = Math.sin(t * 1.3 + k) * .025, s2 = Math.cos(t * 1.1 + k) * .02, ex = tx + s1, ey = ty + s2;
    c.strokeStyle = '#23123a'; c.lineWidth = Math.max(1, L * .007); c.beginPath(); c.moveTo(...P(bx, by)); c.quadraticCurveTo(...P(cx + s1 * .5, cy), ...P(ex, ey)); c.stroke();
    c.strokeStyle = 'rgba(180,140,255,.35)'; c.lineWidth = Math.max(.5, L * .002); c.stroke();
    const [ox, oy] = P(ex, ey), pr = r * L * (.9 + .15 * Math.sin(t * 3 + k));
    const hg = c.createRadialGradient(ox, oy, 0, ox, oy, pr * 4); hg.addColorStop(0, col.replace('A', String(.55 * glow))); hg.addColorStop(1, col.replace('A', '0')); c.fillStyle = hg; c.beginPath(); c.arc(ox, oy, pr * 4, 0, 7); c.fill();
    c.shadowColor = col.replace('A', '1'); c.shadowBlur = L * .05 * glow; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(ox, oy, pr * .55, 0, 7); c.fill();
    c.fillStyle = col.replace('A', '.9'); c.beginPath(); c.arc(ox, oy, pr, 0, 7); c.globalAlpha = .55; c.fill(); c.globalAlpha = 1; c.shadowBlur = 0;
    // kiud palli all
    c.strokeStyle = col.replace('A', '.6'); c.lineWidth = Math.max(.5, L * .002);
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(ox + i * pr * .4, oy + pr * .6); c.quadraticCurveTo(ox + i * pr, oy + pr * 2, ox + i * pr * .6 + Math.sin(t * 2 + i) * pr * .5, oy + pr * 2.8); c.stroke() }
  };
  lure(-.13, -.26, -.24, -.42, -.12, -.48, .012, 'rgba(255,190,90,A)', 2);
  lure(-.05, -.24, .08, -.4, -.02, -.46, .012, 'rgba(200,140,255,A)', 4);
  lure(-.18, -.25, -.56, -.3, -.3, -.6, .022, 'rgba(120,245,255,A)', 0);
  c.restore();
}

{
  const _dl = drawLook;
  drawLook = function (c, x, y, L, look, t = 0, dir = 1, junk) {
    if (junk || !look || look.fx !== 'angler2') return _dl.apply(this, arguments);
    c.save(); c.translate(x, y + L * .06); c.scale(dir, 1); mkDraw(c, L * .78, t || 1.2, 1); c.restore();
  };
}
