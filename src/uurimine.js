/* =====================================================================
   Kalade uurimiskeskus (geneetikalabori vaheleht „Uurimine“).
   Kala antakse uurimiseks → mikroskoobi all läheb aega → DNA, uurimispunktid, vahel salajase retsepti tükk.
   DNA + punktidega avastatakse geene (kanduvad hübriididele) ja arendatakse uurimispuud.
   Server: schema.sql jaotised 2n ja 6m (research_*).
   ===================================================================== */
const RS = { d: null, loading: false, pick: null, conf: null, skew: 0, timer: 0, busy: false };
const RS_GENE = {
  leegisuda: ['❤️‍🔥', 'Leegisüda', 'kala kasvab 25% raskemaks', '#ff8a3a'], jaakristall: ['💎', 'Jääkristall', 'võime +3%', '#9fe8ff'],
  suvanagemine: ['👁️', 'Süvanägemine', 'haruldasemad hübriidid sagedamini', '#3fa0ff'], tormisoomus: ['🌩️', 'Tormisoomus', 'väärtus +20%', '#ffe65a'],
  kuuhobe: ['🌙', 'Kuuhõbe', 'väärtus +30%', '#c9c4ff'], paikesekiir: ['☀️', 'Päikesekiir', 'haruldasemad hübriidid palju sagedamini', '#ffd36a'],
  eluvorse: ['🌱', 'Eluvõrse', 'võime +2% ja kala 10% suurem', '#7ee08a'], kuldgenoom: ['👑', 'Kuldne genoom', 'väärtus +50% ja haruldused sagedamini', '#ffc444']
};
const RS_ELS = ['tuli', 'jää', 'vesi', 'välk', 'vari', 'valgus', 'loodus'];

document.head.insertAdjacentHTML('beforeend', `<style>
.rs-hero{position:relative;border-radius:22px;overflow:hidden;border:1px solid rgba(120,220,255,.22);background:#040a14;box-shadow:0 20px 60px rgba(0,0,30,.55)}
.rs-hero canvas{display:block;width:100%;height:270px}
.rs-hero .ttl{position:absolute;left:18px;top:14px;pointer-events:none}
.rs-hero .ttl h2{margin:0;font-family:var(--f-display);font-weight:400;font-size:30px;line-height:1;color:#e6fbff;text-shadow:0 0 18px rgba(80,220,255,.7),0 2px 4px #000}
.rs-hero .ttl small{display:block;margin-top:3px;color:#9fe3f5;font-weight:700;font-size:13px;text-shadow:0 1px 3px #000}
.rs-hero .meta{position:absolute;right:14px;top:14px;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.rs-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.rs-slot{position:relative;border-radius:16px;padding:12px;display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:center;
  background:radial-gradient(120% 120% at 0% 0%,rgba(60,180,220,.16),rgba(6,12,26,.7));border:1px solid rgba(110,220,255,.25)}
.rs-slot.ready{border-color:#7ef0b0;box-shadow:0 0 22px rgba(120,240,170,.3)}
.rs-slot.empty,.rs-slot.lock{grid-template-columns:1fr;justify-items:center;text-align:center;color:var(--lmu);font-size:13px;min-height:96px;border-style:dashed}
.rs-slot canvas{width:96px;height:72px;border-radius:12px;background:radial-gradient(circle at 50% 45%,rgba(120,220,255,.25),rgba(0,0,0,.2));border:1px solid rgba(160,230,255,.25)}
.rs-slot b{display:block;color:#fff;font-size:14.5px}
.rs-slot small{color:var(--lmu)}
.rs-bar{height:8px;border-radius:5px;background:rgba(255,255,255,.08);overflow:hidden;margin:6px 0}
.rs-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3fd0ff,#b98bff);box-shadow:0 0 10px #6fe3ff;transition:width .9s linear}
.rs-slot.ready .rs-bar i{background:linear-gradient(90deg,#7ef0b0,#d4ffb0)}
.rs-wallet{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px}
.rs-vial{display:grid;justify-items:center;gap:2px;padding:6px 2px;border-radius:12px;background:rgba(6,10,26,.55);border:1px solid rgba(160,180,255,.14);font-size:12px;color:var(--lmu)}
.rs-vial i{font-style:normal;font-size:17px}.rs-vial b{color:#fff;font-size:15px}
.rs-genes{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.rs-gene{position:relative;border-radius:16px;padding:14px;display:grid;gap:6px;background:linear-gradient(180deg,rgba(18,28,58,.9),rgba(6,10,26,.95));border:1px solid rgba(160,180,255,.16);overflow:hidden}
.rs-gene.own{border-color:var(--gc);box-shadow:0 0 20px color-mix(in srgb,var(--gc) 30%,transparent);background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--gc) 22%,#0c1430),#070b1c)}
.rs-gene .orb{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;font-size:24px;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--gc) 60%,#fff),color-mix(in srgb,var(--gc) 50%,#0a1022) 70%);box-shadow:0 0 18px color-mix(in srgb,var(--gc) 60%,transparent)}
.rs-gene:not(.own) .orb{filter:saturate(.3) brightness(.7)}
.rs-gene h4{margin:0;font-size:16px;color:#fff}.rs-gene p{margin:0;font-size:12.5px;color:#cdd6f0;line-height:1.4}
.rs-cost{display:flex;gap:6px;flex-wrap:wrap;font-size:12px}.rs-cost span{padding:2px 8px;border-radius:8px;background:rgba(255,255,255,.06)}.rs-cost .y{color:#9fe69f}.rs-cost .n{color:#ff9a8a}
.rs-recs{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.rs-rec{border-radius:16px;padding:12px;display:grid;gap:6px;background:linear-gradient(180deg,rgba(40,30,10,.55),rgba(8,8,20,.95));border:1px solid rgba(255,201,106,.25)}
.rs-rec.open{border-color:#ffc96a;box-shadow:0 0 22px rgba(255,190,90,.3)}
.rs-rec canvas{width:100%;height:84px}
.rs-rec h4{margin:0;font-family:var(--f-display);font-weight:400;font-size:18px;color:#ffe9b8}
.rs-pips{display:flex;gap:4px}.rs-pips i{flex:1;height:7px;border-radius:4px;background:rgba(255,255,255,.08)}.rs-pips i.on{background:linear-gradient(90deg,#ffe3a0,#f2b552);box-shadow:0 0 8px rgba(255,200,100,.6)}
.rs-hint{font-size:12.5px;color:#f1e6cc;line-height:1.4;font-style:italic}.rs-hint.lock{color:#7b7f95;font-style:normal}
.rs-tree{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.rs-sk{border-radius:16px;padding:12px;display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;background:rgba(6,10,26,.55);border:1px solid rgba(160,180,255,.14)}
.rs-sk.max{border-color:rgba(126,240,176,.5)}
.rs-sk .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:rgba(111,227,255,.12);border:1px solid rgba(111,227,255,.3)}
.rs-sk b{color:#fff}.rs-sk small{display:block;color:var(--lmu);font-size:12px;line-height:1.35;margin:2px 0 6px}
.rs-lv{display:flex;gap:3px;margin-bottom:6px}.rs-lv i{width:18px;height:6px;border-radius:3px;background:rgba(255,255,255,.1)}.rs-lv i.on{background:#6fe3ff;box-shadow:0 0 6px #6fe3ff}
.rs-go{position:sticky;bottom:8px;z-index:3;margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 12px;border-radius:14px;background:rgba(8,20,40,.96);border:1px solid rgba(111,227,255,.5);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.rs-go p{margin:0;flex:1 1 220px;font-size:13px;color:#dff6ff;line-height:1.4}
.rs-tile-y{font-size:11.5px;color:#9fe3f5}
.rs-res{display:grid;gap:10px;text-align:center}
.rs-res canvas{width:100%;height:170px;border-radius:14px;background:#040a14}
.rs-res h2{margin:0;font-family:var(--f-display);font-weight:400;font-size:26px;color:#e6fbff}
.rs-res .frag{border-radius:14px;padding:12px;background:linear-gradient(180deg,rgba(80,56,10,.6),rgba(30,20,4,.7));border:1px solid #ffc96a;color:#ffefc8;animation:rsFrag .8s cubic-bezier(.2,1.4,.4,1) both}
.rs-res .frag b{display:block;font-family:var(--f-display);font-weight:400;font-size:21px;color:#ffe3a0;margin-bottom:4px}
@keyframes rsFrag{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
@media (max-width:620px){.rs-hero canvas{height:300px}.rs-hero .ttl h2{font-size:23px}.rs-wallet{grid-template-columns:repeat(4,minmax(0,1fr))}.rs-hero .meta{display:none}}
@media (prefers-reduced-motion:reduce){.rs-res .frag{animation:none}.rs-bar i{transition:none}}
</style>`);

/* ---------- andmed ---------- */
async function rsLoad() {
  if (RS.loading || !CL.user) return; RS.loading = true;
  try { rsSet(await rpc('research_state')) } catch (e) { toast(e.message, 'bad') }
  RS.loading = false; if (FV.open && FV.tab === 'labor') renderFV(true);
}
function rsSet(d) { RS.d = d; if (d && d.now) RS.skew = Date.parse(d.now) - Date.now() }
function rsNow() { return Date.now() + RS.skew }
function rsLeft(ms) { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h} h ${String(m).padStart(2, '0')} min` : m ? `${m} min ${String(x).padStart(2, '0')} s` : `${x} s` }
function rsMinTxt(m) { return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min` }
function rsSk(k) { return (RS.d && RS.d.skills && +RS.d.skills[k]) || 0 }
// ootuspärane saak – sama valem mis serveris (research_claim, fx_rs_minutes)
function rsYield(x) {
  const r = x.rarity, h = x.kind === 'h';
  return { dna: (h ? 2 * r + 1 : [1, 2, 3, 5, 8, 12][Math.min(r, 6) - 1]) + rsSk('saak'), rp: (h ? 8 : 5) * r,
    min: Math.max(5, Math.round((h ? [60, 90, 120, 180, 240][Math.min(r, 5) - 1] : [20, 40, 60, 90, 120, 180][Math.min(r, 6) - 1]) * (1 - .15 * rsSk('kiirus')))) };
}
function rsPool() {
  const out = [];
  (FS.inventory || []).filter(x => !x.trophy).forEach(x => { const s = FD.sp[x.species]; if (s) out.push({ kind: 'c', id: x.id, species: x.species, name: s.name, rarity: x.rarity, weight: +x.weight, el: [labCatchEl(x.species)] }) });
  if (LAB.d) (LAB.d.fish || []).filter(h => h.status === 'kept').forEach(h => out.push({ kind: 'h', id: h.id, species: h.species, name: h.name, rarity: h.rarity, weight: +h.weight, el: [...new Set([h.e1, h.e2])], h }));
  return out.sort((a, b) => b.rarity - a.rarity || b.weight - a.weight);
}
function rsHybObj(id, els, rar, seed) {
  const dx = LAB.d && (LAB.d.dex || []).find(x => x.id === id);
  return { species: id, body: dx ? dx.body : 'karp', e1: els[0], e2: els[1] || els[0], rarity: rar, legend: dx ? dx.legend : false, genes: { seed: seed || 7 } };
}

/* ---------- joonistus ---------- */
// suur heelik ja DNA katseklaasid
function rsHeroDraw(c, w, h, t) {
  const d = RS.d || {}, scans = d.scans || [], act = scans.find(s => !s.ready) || scans[0];
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#06142a'); g.addColorStop(1, '#02060e'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  // ruudustik nagu laboriekraanil
  c.save(); c.strokeStyle = 'rgba(90,200,255,.06)'; c.lineWidth = 1; for (let x = (t * 8) % 28; x < w; x += 28) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke() } for (let y = 0; y < h; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke() } c.restore();
  const nar = w < 520, H = nar ? w * .84 : h * .78, R = nar ? Math.min(26, h * .1) : Math.min(w * .1, 70), cx = 0, cy = 0;
  c.save(); if (nar) { c.translate(w / 2, h * .42); c.rotate(Math.PI / 2) } else c.translate(w * .36, h * .56);
  const cols = act ? act.elements.map(e => labEl(e).glow) : ['#6fe3ff', '#b98bff'];
  const spd = act && !act.ready ? 1.6 : .6;
  // heeliks (püstine)
  c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, cx, cy, R * 2.6, cols[0], .18);
  const N = 22;
  for (let i = 0; i < N; i++) {
    const y = cy - H / 2 + (i + .5) / N * H, a = t * spd + i * .55, x1 = cx + Math.sin(a) * R, x2 = cx - Math.sin(a) * R, z = Math.cos(a);
    c.strokeStyle = hexA(i % 2 ? cols[0] : cols[1] || cols[0], .25 + .25 * Math.abs(z)); c.lineWidth = 2; c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.stroke();
    [[x1, z], [x2, -z]].forEach(([x, zz], k) => { const rr = 3.2 + 1.8 * (zz + 1) / 2; c.fillStyle = hexA(k ? (cols[1] || cols[0]) : cols[0], .5 + .5 * (zz + 1) / 2); c.beginPath(); c.arc(x, y, rr, 0, 6.283); c.fill() });
  }
  // selgroo jooned
  [0, Math.PI].forEach((ph, k) => { c.strokeStyle = hexA(k ? (cols[1] || cols[0]) : cols[0], .55); c.lineWidth = 2.4; c.beginPath(); for (let i = 0; i <= 60; i++) { const y = cy - H / 2 + i / 60 * H, a = t * spd + (i / 60 * N - .5) * .55 + ph, x = cx + Math.sin(a) * R; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke() });
  // skaneerimisjoon
  if (act && !act.ready) { const sy = cy - H / 2 + ((t * .35) % 1) * H; const sg = c.createLinearGradient(0, sy - 14, 0, sy + 14); sg.addColorStop(0, 'rgba(120,240,255,0)'); sg.addColorStop(.5, 'rgba(120,240,255,.5)'); sg.addColorStop(1, 'rgba(120,240,255,0)'); c.fillStyle = sg; c.fillRect(cx - R * 2, sy - 14, R * 4, 28) }
  c.restore(); c.restore();
  // katseklaasid DNA kogusega
  const dna = d.dna || {}, mx = Math.max(30, ...RS_ELS.map(e => +dna[e] || 0)), tx0 = nar ? w * .06 : w * .58, tw = nar ? w * .88 : w * .38, bw = tw / 7, base = nar ? h * .97 : h * .9, th = nar ? h * .26 : h * .55;
  RS_ELS.forEach((e, i) => {
    const E = labEl(e), x = tx0 + i * bw + bw * .22, ww = bw * .56, v = +dna[e] || 0, fill = Math.min(1, v / mx), top = base - th;
    c.save(); c.beginPath(); c.moveTo(x, top); c.lineTo(x, base - ww / 2); c.arc(x + ww / 2, base - ww / 2, ww / 2, Math.PI, 0, true); c.lineTo(x + ww, top); c.closePath();
    c.fillStyle = 'rgba(255,255,255,.05)'; c.fill(); c.save(); c.clip();
    const ly = base - (th - 6) * fill - 2 + Math.sin(t * 2 + i) * 1.5, lg = c.createLinearGradient(0, ly, 0, base); lg.addColorStop(0, hexA(E.glow, .95)); lg.addColorStop(1, hexA(E.glow, .45)); c.fillStyle = lg; c.fillRect(x, ly, ww, base - ly);
    c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const p = (t * .4 + k / 3 + i * .13) % 1, by = base - p * (base - ly); if (by > ly) { c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(x + ww * (.3 + .4 * ((k * 37 + i) % 10) / 10), by, 1.6, 0, 6.283); c.fill() } }
    c.restore(); c.strokeStyle = 'rgba(200,235,255,.55)'; c.lineWidth = 1.4; c.stroke(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + ww * .18, top + 4, 2, th - ww);
    c.restore();
    c.fillStyle = '#fff'; c.font = `700 ${nar ? 11 : 12}px system-ui`; c.textAlign = 'center'; c.fillText(String(v), x + ww / 2, top - 6); c.font = `${nar ? 12 : 14}px system-ui`; c.fillText(E.ic, x + ww / 2, top - 22); c.textAlign = 'left';
  });
  // hõljuvad osakesed
  c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 24; i++) { const p = (t * .03 + i * .19) % 1, x = (i * 137) % w, y = h - p * h; c.fillStyle = `rgba(120,230,255,${Math.sin(p * Math.PI) * .5})`; c.beginPath(); c.arc(x, y, 1 + (i % 3) * .5, 0, 6.283); c.fill() } c.restore();
}
// hübriidi geeni sära (orbiidil tiirlevad tulukesed)
{
  const baseDrawH = drawHybrid;
  drawHybrid = function (c, x, y, L, f, t = 0, dir = 1, o = {}) {
    baseDrawH(c, x, y, L, f, t, dir, o);
    const tr = f && f.genes && f.genes.trait; if (!tr || o.sil || !RS_GENE[tr]) return;
    const col = RS_GENE[tr][3]; c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const a = t * 1.4 + i * 2.094, px = x + Math.cos(a) * L * .55, py = y + Math.sin(a) * L * .16; glowAt(c, px, py, L * .07, col, .6); c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py, Math.max(1, L * .012), 0, 6.283); c.fill() }
    c.restore();
  };
}

/* ---------- vaade ---------- */
function labViewResearch() {
  if (!RS.d) { rsLoad(); return '<div class="lab-panel"><p class="lab-lead">Käivitan mikroskoope…</p></div>' }
  const d = RS.d, now = rsNow(), scans = d.scans || [];
  let h = `<div class="rs-hero">${labCv({ draw: rsHeroDraw })}<div class="ttl"><h2>Uurimiskeskus</h2><small>DNA analüüs · geenid · salajased retseptid</small></div>
    <div class="meta"><span class="lab-chip">🔬 ${scans.length}/${d.slots} analüüsi</span><span class="lab-chip">🧠 ${fmt(d.rp)} uurimispunkti</span></div></div>`;
  // mikroskoobid
  h += `<div class="lab-panel"><h3>Mikroskoobid <small>Analüüse tehtud kokku: ${d.scans_done}</small></h3><div class="rs-slots">`;
  for (let i = 0; i < 3; i++) {
    const s = scans[i];
    if (s) {
      const t0 = Date.parse(s.started_at), t1 = Date.parse(s.ready_at), ready = now >= t1, p = Math.min(1, (now - t0) / Math.max(1, t1 - t0)), conf = RS.conf === 'rush' + s.id;
      const obj = s.kind === 'h' ? { h: rsHybObj(s.species, s.elements, s.rarity, s.id) } : { c: s.species, w: FD.sp[s.species] ? FD.sp[s.species].max_w * .6 : 1 };
      h += `<div class="rs-slot ${ready ? 'ready' : ''}" data-rs-scan="${s.id}" data-t0="${t0}" data-t1="${t1}">${labCv(obj)}<div><b>${esc(s.name)}</b><small>${labElIc(s.elements)} · ${s.kind === 'h' ? labRar(s.rarity)[0] + ' hübriid' : (RAR2[s.rarity] || RAR2[1])[0]}</small>
        <div class="rs-bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
        <small data-rs-left>${ready ? '✓ Analüüs on valmis!' : 'Valmis ' + rsLeft(t1 - now) + ' pärast'}</small>
        <div class="lab-acts" style="margin-top:6px">${ready ? `<button class="lab-btn gold" type="button" data-rs="claim" data-arg="${s.id}">Vaata tulemust</button>` : `<button class="lab-btn ${conf ? 'gold' : ''}" type="button" data-rs="rush" data-arg="${s.id}" ${d.gold < s.rush && conf ? 'disabled' : ''}>${conf ? `Kinnita: ${fmt(s.rush)} kulda` : `Kiirenda · ${fmt(s.rush)} 🪙`}</button>`}</div></div></div>`;
    } else if (i < d.slots) h += '<div class="rs-slot empty"><span style="font-size:24px">🔬</span>Mikroskoop on vaba – vali allpool kala, mida uurida</div>';
    else h += `<div class="rs-slot lock"><span style="font-size:22px">🔒</span>${i === 1 ? 'Teine' : 'Kolmas'} mikroskoop avaneb uurimispuus</div>`;
  }
  h += '</div></div>';
  // proovi valik
  const pool = rsPool(), free = scans.length < d.slots, sel = RS.pick && pool.find(x => x.kind === RS.pick.kind && x.id === RS.pick.id);
  h += `<div class="lab-panel"><h3>Anna kala uurimiseks <small>${pool.length} kala</small></h3>
    <p class="lab-lead" style="margin-bottom:10px">Uuritud kala kaob, aga sinu katseklaasidesse tuleb tema elemendi DNA ja saad uurimispunkte. Haruldasem kala annab rohkem. Muinasjutukalade DNA-s võivad peituda salajaste retseptide tükid.</p>
    ${pool.length ? `<div class="lab-grid">${pool.slice(0, 48).map(x => { const y = rsYield(x), on = sel && sel === x;
      return `<div class="lab-tile ${on ? 'sel' : ''}" role="button" tabindex="0" data-rs="pick" data-kind="${x.kind}" data-arg="${x.id}"><span class="el">${labElIc(x.el)}</span>${labCv(x.kind === 'h' ? { h: x.h, small: 1 } : { c: x.species, w: x.weight })}
        <b>${esc(x.name)}</b><small><span class="lab-rar" style="--rc:${(x.kind === 'h' ? labRar(x.rarity) : RAR2[x.rarity] || RAR2[1])[1]}">${(x.kind === 'h' ? labRar(x.rarity) : RAR2[x.rarity] || RAR2[1])[0]}</span></small><span class="rs-tile-y">+${y.dna} DNA · ⏱ ${rsMinTxt(y.min)}</span></div>` }).join('')}</div>` : '<p class="lab-lead">Saagis pole kalu. Mine püüa – iga kala on uurimiseks väärtuslik.</p>'}
    ${sel ? (() => { const y = rsYield(sel); return `<div class="rs-go"><p>Uuri: <b>${esc(sel.name)}</b>. Kala kaob ja sinu katseklaasidesse tuleb <b>${sel.el.map(e => labEl(e).ic + ' +' + y.dna).join(', ')}</b> DNA-d ja umbes <b>${y.rp}</b> uurimispunkti. Aega läheb <b>${rsMinTxt(y.min)}</b>.</p>
      <button class="lab-btn gold" type="button" data-rs="start" ${free && !RS.busy ? '' : 'disabled'}>${free ? 'Alusta analüüsi' : 'Mikroskoobid on hõivatud'}</button><button class="lab-btn" type="button" data-rs="unpick">Loobu</button></div>` })() : ''}</div>`;
  // DNA ja geenid
  const dna = d.dna || {};
  h += `<div class="lab-panel"><h3>Geenid <small>${(d.genes || []).filter(g => g.own).length}/${(d.genes || []).length} avastatud</small></h3>
    <div class="rs-wallet" style="margin-bottom:12px">${RS_ELS.map(e => `<div class="rs-vial"><i>${labEl(e).ic}</i><b>${dna[e] || 0}</b>${labEl(e).n}</div>`).join('')}<div class="rs-vial"><i>🧠</i><b>${fmt(d.rp)}</b>punkti</div></div>
    <p class="lab-lead" style="margin-bottom:10px">Avastatud geen võib kanduda igale uuele hübriidile, millel on sama element. Siis saab kala geeni võime ja helendavad geenitulukesed.</p>
    <div class="rs-genes">${(d.genes || []).map(g => { const G = RS_GENE[g.id] || ['🧬', g.name, '', '#b98bff'], ownN = (d.genes || []).filter(x => x.own && x.el).length;
      const dnaOk = g.el ? (dna[g.el] || 0) >= g.dna : RS_ELS.every(e => (dna[e] || 0) >= g.dna), rpOk = d.rp >= g.rp, pre = g.el || ownN >= 7;
      return `<div class="rs-gene ${g.own ? 'own' : ''}" style="--gc:${G[3]}"><div style="display:flex;gap:10px;align-items:center"><span class="orb">${g.ic}</span><div><h4>${esc(g.name)}</h4><small style="color:var(--lmu)">${g.el ? labEl(g.el).ic + ' ' + labEl(g.el).n + ' element' : '✨ Kõik elemendid'}</small></div></div>
        <p>${esc(g.descr)}</p>${g.own ? '<div class="lab-chip" style="justify-self:start">✓ Avastatud</div>' : `<div class="rs-cost"><span class="${dnaOk ? 'y' : 'n'}">${g.el ? labEl(g.el).ic + ' ' + g.dna + ' DNA' : g.dna + ' DNA igast elemendist'}</span><span class="${rpOk ? 'y' : 'n'}">🧠 ${g.rp}</span>${g.el ? '' : `<span class="${pre ? 'y' : 'n'}">7 geeni avastatud</span>`}</div>
        <button class="lab-btn vi" type="button" data-rs="gene" data-arg="${g.id}" ${dnaOk && rpOk && pre && !RS.busy ? '' : 'disabled'} style="justify-self:start">Avasta geen</button>`}</div>` }).join('')}</div></div>`;
  // retseptid
  const recs = d.recipes || [];
  h += `<div class="lab-panel"><h3>Salajased retseptid <small>${recs.filter(r => r.n >= 3 || r.found).length}/${recs.length} teada</small></h3>
    <p class="lab-lead" style="margin-bottom:10px">Iga legendi retsept koosneb kolmest tükist. Kaks esimest on vihjed, kolmas näitab mõlemat vanemat. Tükke leiab DNA analüüsist – kõige sagedamini nende kalade DNA-st, kes on ise legendi vanemad.</p>
    <div class="rs-recs">${recs.map(r => { const done = r.n >= 3 || r.found, sp = rsHybObj(r.id, [r.e1, r.e2], 4, r.sort * 131 + 7); sp.legend = true;
      return `<div class="rs-rec ${done ? 'open' : ''}">${labCv(done ? { h: sp, small: 1 } : { sil: sp })}<h4>${done ? esc(r.name || '') : '👑 Tundmatu legend'}</h4><div class="rs-pips">${[0, 1, 2].map(i => `<i class="${i < Math.min(3, r.n) || r.found ? 'on' : ''}"></i>`).join('')}</div>
        ${[0, 1].map(i => r.hints && r.hints[i] ? `<div class="rs-hint">„${esc(r.hints[i])}“</div>` : `<div class="rs-hint lock">🔒 Vihje ${i + 1} on veel leidmata</div>`).join('')}
        ${done && r.recipe ? `<div class="rs-hint" style="font-style:normal;color:#ffe3a0">🧪 <b>${r.recipe.map(k => esc(FD.sp[k] ? FD.sp[k].name : k)).join(' + ')}</b>${r.found ? ' · ✓ aretatud' : ' · aretamiseks labori 4. tase'}</div>` : '<div class="rs-hint lock">🔒 Vanemad selguvad kolmanda tükiga</div>'}</div>` }).join('')}</div></div>`;
  // uurimispuu
  h += `<div class="lab-panel"><h3>Uurimispuu <small>🧠 ${fmt(d.rp)} punkti (kokku teenitud ${fmt(d.rp_total)})</small></h3><div class="rs-tree">${(d.skill_list || []).map(s => {
    const lv = rsSk(s.id), max = s.cost.length, cost = s.cost[lv];
    return `<div class="rs-sk ${lv >= max ? 'max' : ''}"><span class="ic">${s.ic}</span><div><b>${esc(s.name)}</b><small>${esc(s.descr)}</small><div class="rs-lv">${s.cost.map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>
      ${lv >= max ? '<span class="lab-chip">✓ Täielikult uuritud</span>' : `<button class="lab-btn" type="button" data-rs="skill" data-arg="${s.id}" ${d.rp >= cost && !RS.busy ? '' : 'disabled'}>Uuri · 🧠 ${cost}</button>`}</div></div>` }).join('')}</div></div>`;
  return h;
}
LAB_VIEWS.uurimine = labViewResearch;

/* ---------- tulemus ---------- */
function rsResult(cl) {
  const fr = cl.frag;
  showModal(() => `<div class="rs-res"><canvas class="rs-cv"></canvas><h2>Analüüs valmis!</h2><p class="lab-lead">${esc(cl.name)} – DNA on katseklaasides.</p>
    <div class="c" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">${Object.entries(cl.dna || {}).map(([e, n]) => `<span class="lab-chip">${labEl(e).ic} +${n} DNA</span>`).join('')}<span class="lab-chip">🧠 +${cl.rp} uurimispunkti</span></div>
    ${fr ? `<div class="frag"><b>${fr.recipe ? '📜 Salajane retsept avatud!' : '📜 Leidsid retseptitüki!'}</b>${fr.recipe ? `${esc(fr.name || '')}: <b>${fr.recipe.map(k => esc(FD.sp[k] ? FD.sp[k].name : k)).join(' + ')}</b><br><small>Ühenda need kaks kala labori 4. tasemel.</small>` : `„${esc(fr.hint || '')}“<br><small>Tükk ${fr.n}/3</small>`}</div>` : ''}
    <div class="mbtns"><button class="btn" type="button" data-act="closeModal">Jätka uurimist</button></div></div>`, 'rsres');
  const card = document.querySelector('#modalCard'); if (card) { card.style.background = 'linear-gradient(180deg,#0c1a30,#040a14)'; card.style.border = '1px solid ' + (fr ? '#ffc96a' : '#6fe3ff'); card.style.maxWidth = '480px' }
  const cols = Object.keys(cl.dna || {}).map(e => labEl(e).glow), t0 = performance.now();
  const loop = ts => { const cv = document.querySelector('#modalCard canvas.rs-cv'); if (!cv) return; const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) } const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const t = ts / 1000, k = Math.min(1, (ts - t0) / 1400), cx = w / 2, cy = h / 2, R = Math.min(h * .32, 60);
    c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, cx, cy, R * 2.4, fr ? '#ffc96a' : cols[0] || '#6fe3ff', .25 + .2 * k);
    for (let i = 0; i < 26; i++) { const x = cx - w * .42 + (i + .5) / 26 * w * .84, a = t * 2 + i * .5, y1 = cy + Math.sin(a) * R * k, y2 = cy - Math.sin(a) * R * k, z = Math.cos(a);
      c.strokeStyle = hexA(cols[i % cols.length] || '#6fe3ff', .35); c.lineWidth = 2; c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2); c.stroke();
      c.fillStyle = hexA(cols[0] || '#6fe3ff', .6 + .4 * z); c.beginPath(); c.arc(x, y1, 3.5, 0, 6.283); c.fill(); c.fillStyle = hexA(cols[1] || cols[0] || '#b98bff', .6 - .4 * z); c.beginPath(); c.arc(x, y2, 3.5, 0, 6.283); c.fill() }
    for (let i = 0; i < 30; i++) { const p = ((ts - t0) / 1600 + i / 30) % 1, a = i * 2.4; c.fillStyle = `rgba(255,255,255,${(1 - p) * .7})`; c.beginPath(); c.arc(cx + Math.cos(a) * p * w * .5, cy + Math.sin(a) * p * h * .6, 1.6, 0, 6.283); c.fill() }
    c.restore(); requestAnimationFrame(loop) };
  requestAnimationFrame(loop);
}

/* ---------- tegevused ---------- */
async function rsAct(a, arg, el) {
  if (RS.busy) return;
  if (a === 'pick') { const k = { kind: el.dataset.kind, id: +arg }; RS.pick = RS.pick && RS.pick.kind === k.kind && RS.pick.id === k.id ? null : k; if (typeof sfx === 'function') sfx('pop'); return renderFV(true) }
  if (a === 'unpick') { RS.pick = null; return renderFV(true) }
  if (a === 'rush' && RS.conf !== 'rush' + arg) { RS.conf = 'rush' + arg; return renderFV(true) }
  const fn = { start: 'research_start', rush: 'research_rush', claim: 'research_claim', gene: 'research_gene', skill: 'research_skill' }[a]; if (!fn) return;
  const args = a === 'start' ? { p_kind: RS.pick.kind, p_id: RS.pick.id } : a === 'gene' || a === 'skill' ? { p_id: arg } : { p_id: +arg };
  RS.busy = true; renderFV(true);
  try {
    const r = await rpc(fn, args); const { claimed, gene, skill, lvlup, ach, ...st } = r; rsSet(st); RS.conf = null;
    if (a === 'start') { RS.pick = null; if (typeof sfx === 'function') sfx('chime'); await refreshFS(); labLoad(true); toast('Analüüs algas. Mikroskoop töötab!', 'info', 'fish') }
    if (a === 'rush') { await refreshFS(); if (typeof sfx === 'function') sfx('coin') }
    if (claimed) { rsResult(claimed); if (typeof sfx === 'function') sfx(claimed.frag ? 'levelup' : 'chime') }
    if (gene) { const G = RS_GENE[gene]; toast(`Uus geen avastatud: ${G ? G[0] + ' ' + G[1] : gene}!`, 'gold', 'fame'); if (typeof sfx === 'function') sfx('levelup') }
    if (skill) { toast('Uurimispuu arenes!', 'gold', 'fame'); if (typeof sfx === 'function') sfx('chime'); if (skill === 'genoom') labLoad(true) }
    if ((lvlup && lvlup.length) || (ach && ach.length)) { await refreshFS(); if (typeof afterLevels === 'function') afterLevels(lvlup); if (typeof afterAch === 'function') afterAch(ach) }
  } catch (e) { toast(e.message, 'bad') }
  RS.busy = false; renderFV(true);
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-rs]'); if (el && !el.disabled) return rsAct(el.dataset.rs, el.dataset.arg, el);
  const sub = e.target.closest('[data-lab="sub"][data-arg="uurimine"]'); if (sub) rsLoad();
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.rs && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.target.click() } });

// kell: loendurid ja ribad iga sekund, valmis analüüsi korral joonistab vaate uuesti
RS.timer = setInterval(() => {
  if (!RS.d || !(RS.d.scans || []).length) return;
  const now = rsNow(), ready = (RS.d.scans || []).some(s => !s.ready && Date.parse(s.ready_at) <= now);
  if (ready) { RS.d.scans.forEach(s => { if (Date.parse(s.ready_at) <= now) s.ready = true }); if (FV.open) renderFV(true); if (typeof sfx === 'function' && FV.open && FV.tab === 'labor') sfx('chime'); return }
  if (!FV.open || FV.tab !== 'labor' || LAB.sub !== 'uurimine') return;
  document.querySelectorAll('[data-rs-scan]').forEach(n => { const t0 = +n.dataset.t0, t1 = +n.dataset.t1, p = Math.min(1, (now - t0) / Math.max(1, t1 - t0)); const b = n.querySelector('.rs-bar i'); if (b) b.style.width = (p * 100).toFixed(1) + '%'; const l = n.querySelector('[data-rs-left]'); if (l && now < t1) l.textContent = 'Valmis ' + rsLeft(t1 - now) + ' pärast' });
}, 1000);

/* ---------- ühendus ülejäänud mänguga ---------- */
{
  const baseBadgesR = fvBadges;
  fvBadges = function () { const b = baseBadgesR(); const n = RS.d ? (RS.d.scans || []).filter(s => s.ready).length : 0; if (n) b.labor = (b.labor || 0) + n; return b };
  if (typeof remTodo === 'function') {
    const baseTodoR = remTodo;
    remTodo = function () {
      const r = baseTodoR(); const d = RS.d; if (!d || !d.unlocked) return r;
      const sc = d.scans || [], rd = sc.filter(s => s.ready || Date.parse(s.ready_at) <= rsNow()).length;
      if (rd) r.T.unshift({ c: '#6fe3ff', claim: true, t: rd === 1 ? 'DNA analüüs on valmis' : `${rd} DNA analüüsi on valmis`, tab: 'labor', b: 'Vaata' });
      else if (sc.length < d.slots) r.T.push({ c: '#6fe3ff', t: 'Uurimiskeskus', s: 'Mikroskoop on vaba – anna kala uurimiseks', tab: 'labor', b: 'Ava' });
      return r;
    };
  }
  const baseRefreshR = refreshFS;
  refreshFS = async function () { const r = await baseRefreshR(); if (!RS.d && !RS.loading && CL.user && FS && FS.level >= 5) rsLoad(); return r };
}
document.addEventListener('click', e => { const t = e.target.closest('[data-fa="tab"][data-arg="labor"]'); if (t) rsLoad() });
// Kaluri päeva „Ava“ nupp viib laborisse: kui DNA on valmis, ava kohe uurimine
document.addEventListener('click', e => { const b = e.target.closest('.rem-go[data-arg="labor"]'); if (b && RS.d && (RS.d.scans || []).some(s => s.ready)) LAB.sub = 'uurimine' }, true);
