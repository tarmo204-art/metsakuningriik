/* =====================================================================
   Geneetikalabor – vaade, kalade valik, ühendamise animatsioon, hübriidid, raamat, turg ja areng.
   Kõik otsused teeb server (lab_* funktsioonid schema.sql jaotises 6l). Joonistamine: hubriid.js.
   ===================================================================== */
const LAB = { d: null, loading: false, sub: 'labor', a: null, b: null, filter: 'all', busy: false, conf: null, listFor: null, more: false, objs: [], raf: 0, frame: 0, anim: null, dexF: 'all' };
const LAB_SUBS = [['labor', '⚗️ Labor'], ['uurimine', '🔬 Uurimine'], ['hybriidid', '🐠 Hübriidid'], ['raamat', '📖 Raamat'], ['turg', '⚖️ Turg'], ['areng', '🏛️ Areng']];
FTABS.labor = '🧬 Labor';
const LAB_VIEWS = {}; // alamvaated (täidetakse allpool ja uurimine.js-is)

document.head.insertAdjacentHTML('beforeend', `<style>
.lab{--lb0:#060a1a;--lb1:#0d1630;--lb2:#162246;--lgl:rgba(150,190,255,.16);--lgo:#ffc96a;--lvi:#b98bff;--lcy:#6fe3ff;--ltx:#e9eefc;--lmu:#9aa8cc;
  display:grid;gap:12px;color:var(--ltx)}
.lab-sub{display:flex;gap:6px;flex-wrap:wrap;padding:2px}
.lab-sub button{flex:none;border:1px solid rgba(160,180,255,.18);background:rgba(13,22,48,.7);color:var(--lmu);border-radius:999px;padding:8px 14px;font-weight:700;font-size:13.5px;cursor:pointer}
.lab-sub button.on{color:#fff;background:linear-gradient(180deg,rgba(150,110,255,.45),rgba(70,50,160,.5));border-color:rgba(185,139,255,.7);box-shadow:0 0 16px rgba(150,110,255,.35)}
.lab-sub button:focus-visible,.lab button:focus-visible{outline:2px solid var(--lgo);outline-offset:2px}
.lab-hero{position:relative;border-radius:22px;overflow:hidden;border:1px solid rgba(150,180,255,.22);box-shadow:0 20px 60px rgba(0,0,30,.55),inset 0 0 0 1px rgba(255,255,255,.04);background:var(--lb0)}
.lab-hero canvas{display:block;width:100%;height:300px}
.lab-hero .ttl{position:absolute;left:18px;top:14px;display:grid;gap:2px;pointer-events:none}
.lab-hero .ttl h2{margin:0;font-family:var(--f-display);font-weight:400;font-size:30px;line-height:1;color:#f3ecff;text-shadow:0 0 18px rgba(170,130,255,.7),0 2px 4px #000}
.lab-hero .ttl small{color:#c8b8ff;font-weight:700;font-size:13px;text-shadow:0 1px 3px #000}
.lab-hero .meta{position:absolute;right:14px;top:14px;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.lab-chip{display:inline-flex;gap:5px;align-items:center;padding:4px 10px;border-radius:999px;font-weight:700;font-size:12.5px;background:rgba(6,10,26,.65);border:1px solid rgba(160,180,255,.25);color:#e4e8ff;backdrop-filter:blur(4px)}
.lab-panel{border-radius:18px;padding:14px;background:linear-gradient(180deg,rgba(22,34,70,.92),rgba(10,16,36,.95));border:1px solid rgba(150,180,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.lab-panel h3{margin:0 0 10px;font-size:16px;color:#f0f2ff;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.lab-panel h3 small{color:var(--lmu);font-weight:600;font-size:12.5px}
.lab-lead{margin:0;color:var(--lmu);font-size:13.5px;line-height:1.45}
.lab-slots{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:center}
.lab-slot{position:relative;min-height:112px;border-radius:16px;border:1.5px dashed rgba(160,180,255,.3);background:rgba(6,10,26,.5);display:grid;justify-items:center;align-content:center;gap:2px;padding:8px;text-align:center;cursor:pointer;color:var(--lmu);font-size:13px}
.lab-slot.full{border-style:solid;border-color:var(--sc);background:radial-gradient(90% 90% at 50% 30%,color-mix(in srgb,var(--sc) 22%,transparent),rgba(6,10,26,.6))}
.lab-slot canvas{width:100%;max-width:170px;height:70px}
.lab-slot b{color:#fff;font-size:13.5px}.lab-slot .x{position:absolute;top:6px;right:8px;color:var(--lmu);font-size:15px}
.lab-fuse{border:0;cursor:pointer;width:92px;height:92px;border-radius:50%;font-weight:800;font-size:13px;line-height:1.2;color:#1a0f00;display:grid;place-items:center;text-align:center;padding:8px;
  background:radial-gradient(circle at 35% 30%,#fff3c4,#ffc96a 45%,#d9862a);box-shadow:0 0 0 4px rgba(255,201,106,.18),0 0 30px rgba(255,190,90,.55);animation:labPulse 2.4s ease-in-out infinite}
.lab-fuse:disabled{filter:grayscale(.9) brightness(.6);animation:none;cursor:default;box-shadow:none}
.lab-fuse .i{display:block;font-size:24px}
.lab-odds{display:flex;height:22px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.1)}
.lab-odds span{display:grid;place-items:center;font:700 10.5px system-ui;color:#0b0f20;min-width:0;white-space:nowrap;overflow:hidden}
.lab-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;color:var(--lmu);font-size:13px}
.lab-meta b{color:#fff}
.lab-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.lab-filters button{border:1px solid rgba(160,180,255,.18);background:rgba(6,10,26,.55);color:#dfe6ff;border-radius:999px;padding:5px 11px;font-size:13px;cursor:pointer}
.lab-filters button.on{border-color:var(--lgo);color:#fff;background:rgba(255,201,106,.14)}
.lab-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}
.lab-tile{position:relative;border:1px solid rgba(160,180,255,.14);background:rgba(6,10,26,.55);border-radius:14px;padding:6px 6px 8px;display:grid;gap:2px;justify-items:center;text-align:center;cursor:pointer;color:var(--ltx);font-size:12.5px}
.lab-tile:hover{border-color:rgba(200,180,255,.45)}
.lab-tile canvas{width:100%;height:62px}
.lab-tile b{font-size:13px;line-height:1.2}.lab-tile small{color:var(--lmu)}
.lab-tile.sel{border-color:var(--lgo);box-shadow:0 0 0 1px var(--lgo),0 0 16px rgba(255,201,106,.35)}
.lab-tile .ab{position:absolute;top:5px;left:6px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:800 12px system-ui;background:var(--lgo);color:#1a0f00}
.lab-tile .el{position:absolute;top:4px;right:6px;font-size:14px}
.lab-rar{display:inline-block;padding:1px 8px;border-radius:999px;font:800 11px system-ui;color:#0b0f20;background:var(--rc)}
.lab-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.lab-card{position:relative;border-radius:16px;overflow:hidden;border:1px solid color-mix(in srgb,var(--rc) 45%,transparent);background:radial-gradient(110% 70% at 50% 0%,color-mix(in srgb,var(--rc) 16%,#0c1430),#080d20);display:grid}
.lab-card canvas{width:100%;height:140px;cursor:pointer}
.lab-card .bd{padding:8px 12px 12px;display:grid;gap:6px}
.lab-card h4{margin:0;font-family:var(--f-display);font-weight:400;font-size:19px;color:#fff;line-height:1.15}
.lab-card .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--lmu)}
.lab-card .flag{position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap}
.lab-card .flag span{padding:2px 8px;border-radius:999px;font:800 11px system-ui;background:rgba(6,10,26,.75);border:1px solid rgba(255,255,255,.18)}
.lab-genes{display:grid;grid-template-columns:auto minmax(0,1fr);gap:3px 8px;align-items:center;font-size:12px;color:var(--lmu)}
.lab-bar{display:flex;gap:2px}.lab-bar i{flex:1;height:6px;border-radius:2px;background:rgba(255,255,255,.08)}.lab-bar i.on{background:linear-gradient(180deg,#d8c4ff,#9b6bff)}
.lab-ab{font-size:12.5px;color:#e6e0ff;line-height:1.35}
.lab-acts{display:flex;gap:6px;flex-wrap:wrap}
.lab-btn{border:1px solid rgba(160,180,255,.25);background:rgba(20,30,64,.9);color:#eef;border-radius:10px;padding:6px 10px;font-weight:700;font-size:12.5px;cursor:pointer}
.lab-btn:hover{border-color:rgba(200,180,255,.6)}
.lab-btn.gold{background:linear-gradient(180deg,#ffe3a0,#e9a640);color:#2a1a05;border-color:transparent}
.lab-btn.vi{background:linear-gradient(180deg,#c9a8ff,#7a4ae0);color:#fff;border-color:transparent}
.lab-btn:disabled{opacity:.45;cursor:default}
.lab-price{display:flex;gap:6px;align-items:center}.lab-price input{width:110px;padding:6px 8px;border-radius:9px;border:1px solid rgba(160,180,255,.35);background:#060a1a;color:#fff;font-weight:700}
.lab-tanks{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.lab-tank{position:relative;height:118px;border-radius:14px;overflow:hidden;border:1px solid rgba(110,220,255,.3);background:linear-gradient(180deg,#0f3550,#061826)}
.lab-tank canvas{width:100%;height:100%}
.lab-tank.empty{display:grid;place-items:center;color:#6f91a8;font-size:12.5px;border-style:dashed}
.lab-tank b{position:absolute;left:8px;bottom:6px;font-size:12px;color:#fff;text-shadow:0 1px 3px #000}
.lab-aura{display:flex;gap:6px;flex-wrap:wrap}
.lab-req{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center}
.lab-req .big{font-size:38px;filter:drop-shadow(0 0 12px rgba(255,255,255,.35))}
.lab-prog{height:10px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden}.lab-prog i{display:block;height:100%;background:linear-gradient(90deg,#7a4ae0,#ffc96a)}
.lab-dex{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:7px}
.lab-dex .lab-tile canvas{height:56px}
.lab-dex .lab-tile.unk b{color:#6f7aa0}
.lab-dex .lab-tile.leg{border-color:rgba(255,201,106,.4)}
.lab-lv{display:grid;gap:8px}
.lab-lvn{display:grid;grid-template-columns:44px minmax(0,1fr);gap:12px;padding:12px;border-radius:14px;border:1px solid rgba(160,180,255,.14);background:rgba(6,10,26,.5)}
.lab-lvn .n{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font:800 18px Georgia,serif;background:rgba(255,255,255,.06);color:#8a96bb}
.lab-lvn.done .n{background:linear-gradient(180deg,#d8c4ff,#7a4ae0);color:#fff}
.lab-lvn.cur{border-color:rgba(185,139,255,.6);box-shadow:0 0 18px rgba(150,110,255,.25)}
.lab-lvn.next{border-color:rgba(255,201,106,.5)}
.lab-lvn b{font-size:15px}.lab-lvn small{color:var(--lmu);display:block;line-height:1.4;margin-top:2px}
.lab-req-l{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.lab-req-l span{padding:2px 8px;border-radius:8px;font-size:12px;background:rgba(255,255,255,.06)}.lab-req-l .y{color:#9fe69f}.lab-req-l .n2{color:#ff9a8a}
.lab-lock{display:grid;gap:8px;justify-items:center;text-align:center;padding:20px}
/* ühendamise animatsioon */
.lab-fx{position:fixed;inset:0;z-index:80;background:#03050f}
.lab-fx canvas{position:absolute;inset:0;width:100%;height:100%}
.lab-fx .skip{position:absolute;right:16px;top:14px;z-index:2;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.4);color:#fff;border-radius:999px;padding:8px 14px;font-weight:700;cursor:pointer}
.lab-fx .myth{position:absolute;left:50%;top:13%;transform:translateX(-50%);z-index:2;text-align:center;font-family:var(--f-display);font-size:clamp(24px,7.5vw,56px);line-height:1.05;width:min(92vw,900px);color:#fff4c8;letter-spacing:.02em;
  text-shadow:0 0 18px #ffb84a,0 0 40px #ff9a1a,0 3px 6px #000;animation:labMyth 1.2s cubic-bezier(.2,1.4,.4,1) both}
.lab-res{position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:3;width:min(520px,calc(100vw - 24px));max-height:58vh;overflow:auto;
  border-radius:20px;padding:16px;display:grid;gap:8px;background:linear-gradient(180deg,rgba(18,26,58,.94),rgba(6,10,26,.97));border:1px solid var(--rc);box-shadow:0 0 40px color-mix(in srgb,var(--rc) 40%,transparent);animation:labRes .5s cubic-bezier(.2,1.3,.4,1) both}
.lab-res h2{margin:0;font-family:var(--f-display);font-weight:400;font-size:30px;line-height:1.05;color:#fff;text-align:center}
.lab-res .c{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.lab-res .badge{padding:3px 10px;border-radius:999px;font:800 12px system-ui;background:rgba(255,255,255,.1)}
.lab-res .badge.new{background:linear-gradient(180deg,#b8f5c4,#5ccf7a);color:#06200d}.lab-res .badge.first{background:linear-gradient(180deg,#ffe3a0,#f2b552);color:#2a1a05}.lab-res .badge.mut{background:linear-gradient(180deg,#d8c4ff,#8a5ae8);color:#fff}
@keyframes labPulse{0%,100%{box-shadow:0 0 0 4px rgba(255,201,106,.18),0 0 26px rgba(255,190,90,.45)}50%{box-shadow:0 0 0 8px rgba(255,201,106,.08),0 0 40px rgba(255,190,90,.7)}}
@keyframes labMyth{from{opacity:0;transform:translateX(-50%) scale(.6)}to{opacity:1;transform:translateX(-50%) scale(1)}}
@keyframes labRes{from{opacity:0;transform:translate(-50%,30px)}to{opacity:1;transform:translate(-50%,0)}}
@media (max-width:620px){.lab-sub{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.lab-sub button{padding:8px 6px;font-size:13px;text-align:center}.lab-hero canvas{height:220px}.lab-hero .ttl h2{font-size:23px}.lab-slots{grid-template-columns:1fr 1fr}.lab-slots .lab-fuse{grid-column:1/-1;grid-row:2;justify-self:center;width:100%;height:auto;border-radius:16px;padding:12px}.lab-fuse .i{display:inline;font-size:18px;margin-right:6px}.lab-hero .meta{top:auto;bottom:10px;right:10px}}
@media (prefers-reduced-motion:reduce){.lab-fuse,.lab-fx .myth,.lab-res{animation:none!important}}
</style>`);

/* ---------- andmed ---------- */
async function labLoad(force) {
  if ((LAB.loading && !force) || !CL.user) return; LAB.loading = true;
  try { LAB.d = await rpc('lab_state') } catch (e) { toast(e.message, 'bad') }
  LAB.loading = false; if (FV.open && FV.tab === 'labor') renderFV(true);
}
function labRar(r) { return HY_RAR[r] || HY_RAR[1] }
function labEl(e) { return HY_EL[e] || HY_EL.vesi }
function labCatchEl(sp) { return (FD.sp[sp] && FD.sp[sp].element) || 'vesi' }
// valitavad vanemad: saak (kept) ja hübriidid (alates 2. tasemest)
function labPool() {
  const out = [];
  (FS.inventory || []).filter(x => !x.trophy && x.species !== 'vahk').forEach(x => { const s = FD.sp[x.species]; if (s) out.push({ kind: 'c', id: x.id, species: x.species, name: s.name, rarity: x.rarity, weight: +x.weight, el: [labCatchEl(x.species)] }) });
  if (LAB.d && LAB.d.level >= 2) (LAB.d.fish || []).filter(h => h.status === 'kept').forEach(h => out.push({ kind: 'h', id: h.id, species: h.species, name: h.name, rarity: h.rarity, weight: +h.weight, el: [h.e1, h.e2], h }));
  return out.sort((a, b) => b.rarity - a.rarity || b.weight - a.weight);
}
function labFind(k) { return k && labPool().find(x => x.kind === k.kind && x.id === k.id) }
function labObj(o) { LAB.objs.push(o); return LAB.objs.length - 1 }
function labCv(o, cls = '') { return `<canvas class="${cls}" data-labcv="${labObj(o)}"></canvas>` }
function labElIc(list) { return [...new Set(list)].map(e => labEl(e).ic).join('') }
function labGenes(g) {
  const bar = v => `<div class="lab-bar">${Array.from({ length: 10 }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('')}</div>`;
  return `<div class="lab-genes"><span>Suurus</span>${bar(g.size || 1)}<span>Kiirus</span>${bar(g.speed || 1)}<span>Jõud</span>${bar(g.strength || 1)}</div>`;
}
function labAbTxt(g) { const a = HY_AB[g.ability] || HY_AB.tarkus; return `${a[0]} <b>${a[1]}</b> +${g.power || 1}% ${a[2]} <small style="color:var(--lmu)">(kui kala on labori akvaariumis)</small>` }
function labHidTxt(g) { const tr = g.trait && typeof RS_GENE !== 'undefined' && RS_GENE[g.trait] ? `<div class="lab-ab">${RS_GENE[g.trait][0]} <b>${RS_GENE[g.trait][1]}</b> – ${RS_GENE[g.trait][2]} <small style="color:var(--lmu)">(uurimiskeskuse geen)</small></div>` : ''; return tr + labHidTxt0(g) }
function labHidTxt0(g) { if (!g.hidden) return ''; const h = HY_HID[g.hidden.id] || HY_HID['?']; return `<div class="lab-ab">${h[0]} <b>${h[1]}</b> – ${h[2]}${g.hidden.el ? ' (' + labEl(g.hidden.el).ic + ' ' + labEl(g.hidden.el).n + ')' : ''}</div>` }

/* ---------- vaade ---------- */
function tabLabor() {
  LAB.objs = [];
  if (!CL.user) return '<div class="fv-card"><p class="lead">Geneetikalabor vajab sisselogimist.</p></div>';
  if (!LAB.d) { labLoad(); return '<div class="lab"><div class="lab-panel"><p class="lab-lead">Süütan labori kristallid…</p></div></div>' }
  const d = LAB.d;
  if (!d.unlocked) return `<div class="lab"><div class="lab-hero">${labCv({ hero: 1 })}<div class="ttl"><h2>Geneetikalabor</h2><small>🔒 Avaneb kalapüügi 5. tasemel</small></div></div>
    <div class="lab-panel lab-lock"><h3>Salapärane labor ootab</h3><p class="lab-lead">Siin saab kahest kalast aretada täiesti uue liigi. Püüa veel kalu ja tule tagasi kalapüügi 5. tasemel (praegu ${d.fish_level}).</p></div></div>`;
  const lv = d.levels[d.level - 1];
  let h = `<div class="lab"><div class="lab-sub" role="tablist">${LAB_SUBS.map(([k, n]) => `<button type="button" role="tab" aria-selected="${LAB.sub === k}" class="${LAB.sub === k ? 'on' : ''}" data-lab="sub" data-arg="${k}">${n}</button>`).join('')}</div>`;
  if (LAB.sub === 'labor' || LAB.sub === 'hybriidid') h += `<div class="lab-hero">${labCv({ hero: 1 })}<div class="ttl"><h2>Geneetikalabor</h2><small>Tase ${d.level} · ${esc(lv.name)}</small></div>
    <div class="meta"><span class="lab-chip">⚗️ ${d.fusions}/${d.cap} täna</span><span class="lab-chip">🪙 ${fmt(d.gold)}</span></div></div>`;
  h += (LAB_VIEWS[LAB.sub] || labViewMain)();
  return h + '</div>';
}
function labSlot(k, which) {
  const x = labFind(k);
  if (!x) return `<div class="lab-slot" data-lab="slot" data-arg="${which}"><span style="font-size:22px">${which === 'a' ? '🧪' : '🧫'}</span><span>${which === 'a' ? 'Esimene kala' : 'Teine kala'}</span><small>Vali allpool</small></div>`;
  const col = labEl(x.el[0]).glow;
  return `<div class="lab-slot full" style="--sc:${col}" data-lab="slot" data-arg="${which}" title="Eemalda"><span class="x">×</span>${labCv(x.kind === 'h' ? { h: x.h } : { c: x.species, w: x.weight })}<b>${esc(x.name)}</b><small>${labElIc(x.el)} · ${fKg(x.weight)}</small></div>`;
}
function labViewMain() {
  const d = LAB.d, A = labFind(LAB.a), B = labFind(LAB.b), left = d.cap - d.fusions, can = A && B && left > 0 && d.gold >= d.fee && !LAB.busy;
  const why = !A || !B ? 'Vali kaks kala' : left <= 0 ? 'Tänased ühendamised on tehtud' : d.gold < d.fee ? `Vaja ${fmt(d.fee)} kulda` : '';
  let h = `<div class="lab-panel"><div class="lab-slots">${labSlot(LAB.a, 'a')}<button class="lab-fuse" type="button" data-lab="fuse" ${can ? '' : 'disabled'} title="${esc(why)}"><span><span class="i">🧬</span>Ühenda kalad</span></button>${labSlot(LAB.b, 'b')}</div>
    <div class="lab-meta" style="margin-top:10px"><span>Tasu <b>${fmt(d.fee)}</b> kulda</span><span>Täna <b>${d.fusions}/${d.cap}</b></span>${A && B ? `<span>${labElIc(A.el)} + ${labElIc(B.el)} → <b>???</b></span>` : ''}${why && (A || B) ? `<span style="color:#ffb3a0">${esc(why)}</span>` : ''}</div>
    <div style="margin-top:10px;display:grid;gap:4px"><small style="color:var(--lmu)">Mutatsiooni haruldus sinu labori tasemel</small><div class="lab-odds">${d.odds.map((p, i) => `<span style="flex:${Math.max(p, 4)};background:${labRar(i + 1)[1]}" title="${labRar(i + 1)[0]} ${p}%">${p >= 3 ? p + '%' : ''}</span>`).join('')}</div>
    <div class="lab-meta" style="font-size:11.5px">${d.odds.map((p, i) => `<span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${labRar(i + 1)[1]};margin-right:4px"></i>${labRar(i + 1)[0]} ${p}%</span>`).join('')}</div></div></div>`;
  // labori tellimus
  const r = d.req, E = labEl(r.element), fit = (d.fish || []).filter(f => f.status !== 'listed' && (f.e1 === r.element || f.e2 === r.element) && f.rarity >= r.minr);
  h += `<div class="lab-panel"><div class="lab-req"><span class="big">${E.ic}</span><div><h3 style="margin:0 0 4px">Labori tellimus ${r.done ? '<small>✓ täna täidetud</small>' : ''}</h3>
    <p class="lab-lead">${r.done ? 'Tellija on rahul. Uus tellimus tuleb kesköösel.' : `Kuninglik alkeemik soovib hübriidi, millel on element <b style="color:#fff">${E.ic} ${E.n}</b> ja haruldus vähemalt <b style="color:${labRar(r.minr)[1]}">${labRar(r.minr)[0]}</b>. Tasu: <b style="color:#ffe3a0">${fmt(r.gold)} kulda</b>, ${r.xp} kogemust ja üllatusese.`}</p>
    ${!r.done && fit.length ? `<div class="lab-acts" style="margin-top:8px">${fit.slice(0, 4).map(f => `<button class="lab-btn gold" type="button" data-lab="deliver" data-arg="${f.id}">Anna: ${esc(f.name)}</button>`).join('')}</div>` : ''}</div></div></div>`;
  // kalade valik
  const pool = labPool(), F = LAB.filter, list = pool.filter(x => F === 'all' ? true : F === 'h' ? x.kind === 'h' : x.el.includes(F));
  const show = LAB.more ? list : list.slice(0, 36);
  h += `<div class="lab-panel"><h3>Vali kaks kala <small>${pool.length} kala saagis ja laboris</small></h3>
    <div class="lab-filters"><button type="button" class="${F === 'all' ? 'on' : ''}" data-lab="filter" data-arg="all">Kõik</button>${Object.entries(HY_EL).map(([k, e]) => `<button type="button" class="${F === k ? 'on' : ''}" data-lab="filter" data-arg="${k}">${e.ic} ${e.n}</button>`).join('')}${d.level >= 2 ? `<button type="button" class="${F === 'h' ? 'on' : ''}" data-lab="filter" data-arg="h">🧬 Hübriidid</button>` : ''}</div>
    ${show.length ? `<div class="lab-grid">${show.map(x => { const sa = LAB.a && LAB.a.kind === x.kind && LAB.a.id === x.id, sb = LAB.b && LAB.b.kind === x.kind && LAB.b.id === x.id;
      return `<div class="lab-tile ${sa || sb ? 'sel' : ''}" role="button" tabindex="0" data-lab="pick" data-kind="${x.kind}" data-arg="${x.id}">${sa ? '<span class="ab">A</span>' : sb ? '<span class="ab">B</span>' : ''}<span class="el">${labElIc(x.el)}</span>
        ${labCv(x.kind === 'h' ? { h: x.h, small: 1 } : { c: x.species, w: x.weight })}<b>${esc(x.name)}</b><small><span class="lab-rar" style="--rc:${(x.kind === 'h' ? labRar(x.rarity) : RAR2[x.rarity] || RAR2[1])[1]}">${(x.kind === 'h' ? labRar(x.rarity) : RAR2[x.rarity] || RAR2[1])[0]}</span> ${fKg(x.weight)}</small></div>` }).join('')}</div>
      ${list.length > show.length ? `<div style="margin-top:8px"><button class="lab-btn" type="button" data-lab="more">Näita kõiki ${list.length}</button></div>` : ''}`
      : `<p class="lab-lead">${pool.length ? 'Selle elemendiga kalu sul praegu pole.' : 'Saagis pole ühtegi kala. Mine püüa kalu – iga kala võib saada uue liigi vanemaks.'}</p>`}
    <p class="lab-lead" style="margin-top:10px">Vanemkalad kaovad ühendamisel. Uus kala pärib vanematelt elemendid, keha, värvid, suuruse, kiiruse ja jõu. Muinasjutukalad kannavad tugevaid elemente: 🔥 Kuldne ahven, ❄️ Jäähaug, ⚡ Tormihaug, ✨ Kuldkala, 🌑 Udukala…</p></div>`;
  return h;
}
function labCardActs(f) {
  const d = LAB.d, tanksUsed = (d.fish || []).filter(x => x.status === 'tank').length, conf = LAB.conf === 'sell' + f.id;
  if (f.status === 'listed') return `<div class="lab-acts"><span class="lab-chip">⚖️ Turul ${fmt(f.listing ? f.listing.price : 0)} kulda</span><button class="lab-btn" type="button" data-lab="unlist" data-arg="${f.listing ? f.listing.id : 0}">Võta turult</button></div>`;
  if (LAB.listFor === f.id) return `<div class="lab-price"><input type="number" min="1" step="1" inputmode="numeric" id="labPrice${f.id}" value="${Math.round(f.value * 1.3)}" aria-label="Hind kullas"><button class="lab-btn gold" type="button" data-lab="listgo" data-arg="${f.id}">Pane turule</button><button class="lab-btn" type="button" data-lab="listno">Loobu</button></div>`;
  return `<div class="lab-acts">${f.status === 'tank' ? `<button class="lab-btn" type="button" data-lab="untank" data-arg="${f.id}">Võta akvaariumist</button>` : `<button class="lab-btn vi" type="button" data-lab="tank" data-arg="${f.id}" ${tanksUsed >= d.tanks ? 'disabled title="Akvaariumid on täis"' : ''}>Pane akvaariumi</button>`}
    <button class="lab-btn ${conf ? 'gold' : ''}" type="button" data-lab="sell" data-arg="${f.id}">${conf ? `Kinnita: müü ${fmt(f.value)} kulda eest` : `Müü · ${fmt(f.value)} 🪙`}</button>
    ${f.status === 'kept' ? `<button class="lab-btn" type="button" data-lab="list" data-arg="${f.id}">Turule</button>` : ''}</div>`;
}
function labCard(f) {
  const rc = labRar(f.rarity)[1], g = f.genes || {};
  return `<div class="lab-card" style="--rc:${rc}"><div class="flag">${f.first ? '<span>🏆 Esmaavastus</span>' : ''}${f.legend ? '<span>👑 Legend</span>' : ''}${g.mutated ? '<span>🧬 Mutatsioon</span>' : ''}</div>
    <div data-lab="detail" data-arg="${f.id}" role="button" tabindex="0" aria-label="Vaata lähemalt: ${esc(f.name)}">${labCv({ h: f })}</div>
    <div class="bd"><h4>${esc(f.name)}</h4><div class="row"><span class="lab-rar" style="--rc:${rc}">${labRar(f.rarity)[0]}</span><span>${labEl(f.e1).ic} ${labEl(f.e1).n}${f.e2 !== f.e1 ? ' + ' + labEl(f.e2).ic + ' ' + labEl(f.e2).n : ''}</span></div>
    <div class="row"><span>⚖️ ${fKg(f.weight)} · 📏 ${Math.round(f.length)} cm</span></div>${labGenes(g)}<div class="lab-ab">${labAbTxt(g)}</div>${labHidTxt(g)}${labCardActs(f)}</div></div>`;
}
function labViewMine() {
  const d = LAB.d, mine = d.fish || [], tank = mine.filter(f => f.status === 'tank'), au = d.aura || {};
  const auraChip = (k) => { const a = HY_AB[k], v = Math.round((+au[k] || 0) * 1000) / 10; return v ? `<span class="lab-chip">${a[0]} ${a[1]} +${v}% ${a[2]}</span>` : '' };
  let h = `<div class="lab-panel"><h3>Labori akvaariumid <small>${tank.length}/${d.tanks}</small></h3>
    <p class="lab-lead" style="margin-bottom:10px">Akvaariumis olevate hübriidide võimed mõjuvad päriselt sinu kalapüügile (iga võime kokku kuni 15%).</p>
    <div class="lab-aura" style="margin-bottom:10px">${['tarkus', 'kuld', 'onn', 'kaitse'].map(auraChip).join('') || '<span class="lab-chip">Akvaariumid on tühjad – pane siia oma parimad hübriidid</span>'}</div>
    <div class="lab-tanks">${Array.from({ length: d.tanks }, (_, i) => tank[i] ? `<div class="lab-tank">${labCv({ h: tank[i], tank: 1 })}<b>${esc(tank[i].name)}</b></div>` : '<div class="lab-tank empty">Tühi akvaarium</div>').join('')}</div></div>`;
  h += `<div class="lab-panel"><h3>Sinu hübriidid <small>${mine.length}</small></h3>${mine.length ? `<div class="lab-cards">${mine.map(labCard).join('')}</div>` : '<p class="lab-lead">Sul pole veel hübriide. Ava labor ja ühenda kaks kala.</p>'}</div>`;
  return h;
}
function labViewDex() {
  const d = LAB.d, dex = d.dex || [], got = dex.filter(x => x.mine).length, F = LAB.dexF;
  const list = dex.filter(x => F === 'all' ? true : F === 'mine' ? x.mine : x.legend);
  return `<div class="lab-panel"><h3>Hübriidiraamat <small>${got}/${dex.length} avastatud</small></h3><div class="lab-prog"><i style="width:${(got / dex.length * 100).toFixed(1)}%"></i></div>
    <p class="lab-lead" style="margin:8px 0 10px">Iga liik tekib kindlast elementide ja kehakuju kombinatsioonist. Retsepte keegi ei ütle – need tuleb ise avastada. 8 legendi vajavad kindlaid muinasjutukalu ja labori 4. taset.</p>
    <div class="lab-filters">${[['all', 'Kõik'], ['mine', 'Avastatud'], ['leg', '👑 Legendid']].map(([k, n]) => `<button type="button" class="${F === k ? 'on' : ''}" data-lab="dexf" data-arg="${k}">${n}</button>`).join('')}</div>
    <div class="lab-dex">${list.map(x => { const sp = { species: x.id, body: x.body, e1: x.e1 || 'vesi', e2: x.e2 || x.e1 || 'vesi', rarity: x.mine ? x.mine.best : 1, legend: x.legend, genes: { seed: x.sort * 131 + 7 } };
      return `<div class="lab-tile ${x.mine ? '' : 'unk'} ${x.legend ? 'leg' : ''}" role="button" tabindex="0" data-lab="dex" data-arg="${x.id}">${labCv(x.mine ? { h: sp, small: 1 } : { sil: sp })}<b>${x.mine ? esc(x.name) : x.legend ? '👑 ???' : '???'}</b><small>${x.mine ? labElIc([x.e1, x.e2]) + ' · ' + labRar(x.mine.best)[0] : x.hint ? labElIc(x.hint) + ' · avastamata' : x.first_name ? 'Avastatud kuningriigis' : 'Avastamata'}</small></div>` }).join('')}</div></div>`;
}
function labViewMarket() {
  const d = LAB.d, m = d.market || [], mine = m.filter(x => x.mine), other = m.filter(x => !x.mine);
  const card = x => { const conf = LAB.conf === 'buy' + x.listing_id, rc = labRar(x.rarity)[1];
    return `<div class="lab-card" style="--rc:${rc}"><div data-lab="mdetail" data-arg="${x.listing_id}" role="button" tabindex="0" aria-label="Vaata lähemalt: ${esc(x.name)}">${labCv({ h: x })}</div><div class="bd"><h4>${esc(x.name)}</h4>
      <div class="row"><span class="lab-rar" style="--rc:${rc}">${labRar(x.rarity)[0]}</span><span>${labElIc([x.e1, x.e2])} · ${fKg(x.weight)} · ${Math.round(x.length)} cm</span></div>${labGenes(x.genes || {})}<div class="lab-ab">${labAbTxt(x.genes || {})}</div>
      <div class="row"><span>Müüja: <b style="color:#fff">${esc(x.seller || 'Kalur')}</b></span></div>
      <div class="lab-acts">${x.mine ? `<button class="lab-btn" type="button" data-lab="unlist" data-arg="${x.listing_id}">Võta turult · ${fmt(x.price)} 🪙</button>` : `<button class="lab-btn gold" type="button" data-lab="buy" data-arg="${x.listing_id}" ${d.gold < x.price ? 'disabled' : ''}>${conf ? `Kinnita ost ${fmt(x.price)} kulda eest` : `Osta · ${fmt(x.price)} 🪙`}</button>`}</div></div></div>` };
  return `<div class="lab-panel"><h3>Hübriidide turg <small>${other.length} pakkumist</small></h3><p class="lab-lead" style="margin-bottom:10px">Kalurid müüvad siin oma aretatud kalu. Müüja saab 95% hinnast. Ostetud hübriid läheb sinu hübriidiraamatusse, aga esmaavastajaks saab ainult aretaja.</p>
    ${other.length ? `<div class="lab-cards">${other.map(card).join('')}</div>` : '<p class="lab-lead">Turul pole praegu ühtegi pakkumist. Ole esimene – pane oma hübriid müüki vahekaardil „Hübriidid“.</p>'}</div>
    ${mine.length ? `<div class="lab-panel"><h3>Sinu pakkumised</h3><div class="lab-cards">${mine.map(card).join('')}</div></div>` : ''}`;
}
function labViewLevels() {
  const d = LAB.d, items = FS.items || {};
  return `<div class="lab-panel"><h3>Labori areng <small>Tase ${d.level}/5</small></h3><div class="lab-lv">${d.levels.map(l => {
    const st = l.lvl < d.level ? 'done' : l.lvl === d.level ? 'cur' : l.lvl === d.level + 1 ? 'next' : '';
    const req = st === 'next' ? `<div class="lab-req-l"><span class="${d.fish_level >= l.req ? 'y' : 'n2'}">Kalapüügi tase ${l.req}</span>${l.gold ? `<span class="${d.gold >= l.gold ? 'y' : 'n2'}">${fmt(l.gold)} kulda</span>` : ''}${Object.entries(l.items || {}).map(([k, q]) => `<span class="${(items[k] || 0) >= q ? 'y' : 'n2'}">${itemName(k)} ${Math.min(items[k] || 0, q)}/${q}</span>`).join('')}</div>` : '';
    const ok = st === 'next' && d.fish_level >= l.req && d.gold >= l.gold && Object.entries(l.items || {}).every(([k, q]) => (items[k] || 0) >= q);
    return `<div class="lab-lvn ${st}"><span class="n">${st === 'done' ? '✓' : l.lvl}</span><div><b>${esc(l.name)}</b>${st === 'cur' ? ' <span class="lab-chip">Praegu</span>' : ''}<small>${esc(l.unlock)} · ühendamisi päevas: ${['6', '8', '10', '12', '15'][l.lvl - 1]}</small>${req}
      ${st === 'next' ? `<div style="margin-top:8px"><button class="lab-btn gold" type="button" data-lab="upgrade" ${ok && !LAB.busy ? '' : 'disabled'}>Arenda laborit</button></div>` : ''}</div></div>` }).join('')}</div></div>`;
}

Object.assign(LAB_VIEWS, { labor: labViewMain, hybriidid: labViewMine, raamat: labViewDex, turg: labViewMarket, areng: labViewLevels });

/* ---------- lõuendid ---------- */
function labHeroDraw(c, w, h, t) {
  const d = LAB.d || {}, gold = d.level >= 5;
  let g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a1030'); g.addColorStop(.6, '#071026'); g.addColorStop(1, '#03060f'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { const x = w * (.15 + i * .18) + Math.sin(t * .3 + i) * 20; const sg = c.createLinearGradient(x, 0, x + 60, h); sg.addColorStop(0, `rgba(140,120,255,${.07 + .03 * Math.sin(t + i)})`); sg.addColorStop(1, 'rgba(140,120,255,0)'); c.fillStyle = sg; c.beginPath(); c.moveTo(x - 20, 0); c.lineTo(x + 20, 0); c.lineTo(x + 90, h); c.lineTo(x + 30, h); c.fill() }
  c.restore();
  // kristallid
  const crys = (cx, base, s, col, ph) => labCrystal(c, cx, base, s, col, t, ph);
  const s = Math.min(w, h * 1.4) * .07;
  crys(w * .06, h * .96, s, gold ? '#ffc96a' : '#b98bff', 0); crys(w * .94, h * .96, s * .9, '#6fe3ff', 2); if (w > 500) { crys(w * .16, h * .99, s * .6, '#6fe3ff', 4); crys(w * .85, h * .99, s * .55, gold ? '#ffc96a' : '#b98bff', 1) }
  // akvaarium
  const nar = w < 520, tx = w * (nar ? .06 : .13), ty = h * (nar ? .3 : .2), tw = w * (nar ? .88 : .74), th3 = h * (nar ? .6 : .66), r = Math.min(26, th3 * .15);
  const rr = () => { c.beginPath(); c.moveTo(tx + r, ty); c.arcTo(tx + tw, ty, tx + tw, ty + th3, r); c.arcTo(tx + tw, ty + th3, tx, ty + th3, r); c.arcTo(tx, ty + th3, tx, ty, r); c.arcTo(tx, ty, tx + tw, ty, r); c.closePath() };
  c.save(); rr(); c.clip();
  g = c.createLinearGradient(0, ty, 0, ty + th3); g.addColorStop(0, gold ? '#3a3a6a' : '#16466e'); g.addColorStop(1, '#06162c'); c.fillStyle = g; c.fillRect(tx, ty, tw, th3);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { c.strokeStyle = `rgba(180,230,255,${.05 + .03 * Math.sin(t + i)})`; c.lineWidth = 2; c.beginPath(); for (let x = tx; x <= tx + tw; x += 10) { const y = ty + 10 + i * 9 + Math.sin(x * .03 + t * 1.3 + i) * 5; x === tx ? c.moveTo(x, y) : c.lineTo(x, y) } c.stroke() }
  for (let i = 0; i < 22; i++) { const p = (t * (.06 + (i % 5) * .02) + i * .37) % 1, x = tx + ((i * 97) % 100) / 100 * tw + Math.sin(t + i) * 6, y = ty + th3 - p * th3; c.strokeStyle = `rgba(210,245,255,${(1 - p) * .55})`; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 1.2 + (i % 3), 0, 6.283); c.stroke() }
  c.restore();
  { const sy = ty + th3 * .86, sg = c.createLinearGradient(0, sy, 0, ty + th3); sg.addColorStop(0, gold ? '#5a4a2a' : '#1d3a4a'); sg.addColorStop(1, gold ? '#2a2010' : '#0a1822'); c.fillStyle = sg;
    c.beginPath(); c.moveTo(tx, ty + th3); for (let x = tx; x <= tx + tw; x += 12) c.lineTo(x, sy + Math.sin(x * .05) * 4 + Math.sin(x * .013) * 6); c.lineTo(tx + tw, ty + th3); c.fill();
    for (let i = 0; i < 9; i++) { const px = tx + tw * (.05 + i * .113), ph2 = i * 1.7, hh = th3 * (.18 + (i % 3) * .08), col = i % 3 === 0 ? '#3fae8a' : i % 3 === 1 ? '#2f8a7a' : '#6a5acd';
      c.strokeStyle = hexA(col, .85); c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(px, sy + 6); for (let k = 1; k <= 6; k++) c.lineTo(px + Math.sin(t * 1.1 + ph2 + k * .6) * k * 1.6, sy + 6 - hh * k / 6); c.stroke();
      if (i % 3 === 2) { c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, px + Math.sin(t * 1.1 + ph2 + 3.6) * 9, sy + 6 - hh, 9, '#b98bff', .5 + .3 * Math.sin(t * 2 + i)); c.restore() } }
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .07; for (let i = 0; i < 14; i++) { c.fillStyle = '#cfefff'; c.beginPath(); c.ellipse(tx + ((i * 61 + t * 14) % tw), sy + 8 + (i % 4) * 5, 18 + (i % 3) * 8, 3, 0, 0, 6.283); c.fill() } c.restore() }
  // valitud kalad ja energialained
  const A = labFind(LAB.a), B = labFind(LAB.b), cy = ty + th3 * .52;
  [[A, tx + tw * .3, -1, 0], [B, tx + tw * .7, 1, 2]].forEach(([x, px, dir, ph]) => {
    if (!x) return; const el = labEl(x.el[0]), L = Math.min(tw * .3, th3 * .75), yy = cy + Math.sin(t * 1.4 + ph) * th3 * .04, xx = px + Math.sin(t * .7 + ph) * tw * .015;
    c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const p = (t * .5 + k / 3) % 1; c.strokeStyle = hexA(el.glow, (1 - p) * .55); c.lineWidth = 2; c.beginPath(); c.ellipse(xx, yy, L * (.35 + p * .45), L * (.18 + p * .25), 0, 0, 6.283); c.stroke() } c.restore();
    labDrawAny(c, xx, yy, L, x.kind === 'h' ? { h: x.h } : { c: x.species, w: x.weight }, t, dir);
  });
  if (!A && !B) { c.fillStyle = 'rgba(200,220,255,.55)'; c.font = `600 ${Math.max(13, h * .055)}px system-ui`; c.textAlign = 'center'; c.fillText('Vali allpool kaks kala', tx + tw / 2, cy + 5); c.textAlign = 'left' }
  c.restore();
  // klaas
  c.save(); rr(); c.strokeStyle = 'rgba(170,215,255,.45)'; c.lineWidth = 2; c.stroke();
  const hl = c.createLinearGradient(tx, ty, tx, ty + th3 * .3); hl.addColorStop(0, 'rgba(255,255,255,.14)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = hl; c.fillRect(tx + 6, ty + 3, tw - 12, th3 * .3);
  c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(tx + tw * .06, ty + 8, 5, th3 - 16); c.restore();
  // hõljuvad osakesed
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const p = (t * .03 + i * .173) % 1, x = (i * 151 % w) + Math.sin(t * .5 + i) * 12, y = h - p * h, a2 = Math.sin(p * Math.PI) * .7; c.fillStyle = i % 3 ? `rgba(185,160,255,${a2})` : `rgba(255,214,140,${a2})`; c.beginPath(); c.arc(x, y, 1 + (i % 3) * .6, 0, 6.283); c.fill() }
  c.restore();
}
function labCrystal(c, cx, base, s, col, t, ph, k = 1) { const pulse = .6 + .4 * Math.sin(t * 1.6 + ph); c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, cx, base - s * .6, s * 1.6, col, .35 * pulse * k); c.restore();
    [[0, 1, 0], [-.45, .7, -.25], [.42, .62, .28], [-.2, .45, -.5], [.25, .4, .55]].forEach(([dx, k, rot]) => { c.save(); c.translate(cx + dx * s, base); c.rotate(rot * .5); const hh = s * k * 1.3, ww = s * .2;
      const cg = c.createLinearGradient(-ww, 0, ww, -hh); cg.addColorStop(0, hexA(col, .55)); cg.addColorStop(.5, hexA(mixC(col, '#ffffff', .5), .9)); cg.addColorStop(1, hexA(col, .7)); c.fillStyle = cg;
      c.beginPath(); c.moveTo(-ww, 0); c.lineTo(-ww * .8, -hh * .75); c.lineTo(0, -hh); c.lineTo(ww * .8, -hh * .75); c.lineTo(ww, 0); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(0, -hh); c.lineTo(-ww * .2, 0); c.stroke(); c.restore() }) }
function labDrawAny(c, x, y, L, o, t, dir = 1) {
  if (o.h) return drawHybrid(c, x, y, L, o.h, t, dir, o.small ? { fx: true } : {});
  if (o.sil) return drawHybrid(c, x, y, L, o.sil, t, dir, { sil: true });
  if (o.c && FD.sp[o.c]) { const s = FD.sp[o.c], look = Object.assign({}, s.look || {}, { _id: s.id }); drawLook(c, x, y, L, look, t, dir) }
}
function labFitAny(o, w, h) {
  if (o.h) return hyFitL(o.h, w, h); if (o.sil) return hyFitL(o.sil, w, h);
  const s = FD.sp[o.c]; return s ? Math.min(w * .7, h * .62 / fishFit(Object.assign({}, s.look || {}, { _id: s.id }))) : w * .5;
}
function labPaintAll(ts) {
  const t = ts / 1000, cvs = document.querySelectorAll('#fishView canvas[data-labcv]');
  if (!FV.open || FV.tab !== 'labor' || !cvs.length) { LAB.raf = 0; return }
  LAB.frame++;
  cvs.forEach(cv => {
    const o = LAB.objs[+cv.dataset.labcv]; if (!o) return;
    if (!o.hero && !o.tank && (LAB.frame % 3) && cv.width) return; // väikesed pildid joonistatakse harvem
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    const dpr = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    if (o.hero) return labHeroDraw(c, w, h, t);
    if (o.draw) return o.draw(c, w, h, t);
    if (o.tank) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#10405e'); g.addColorStop(1, '#05141f'); c.fillStyle = g; c.fillRect(0, 0, w, h) }
    const L = labFitAny(o, w, h); labDrawAny(c, w / 2 + (o.tank ? Math.sin(t * .6) * w * .06 : 0), h / 2, L, o, t + (+cv.dataset.labcv) * .37, o.tank ? (Math.cos(t * .3) > 0 ? 1 : -1) : 1);
  });
  LAB.raf = requestAnimationFrame(labPaintAll);
}
function labStart() { if (!LAB.raf) LAB.raf = requestAnimationFrame(labPaintAll) }

/* ---------- detailaken ---------- */
function labDetail(f, dexItem) {
  const big = { h: f };
  showModal(() => {
    const rc = labRar(f.rarity)[1], g = f.genes || {}, mineFish = !dexItem;
    const parents = (f.parents || []).map(p => esc(p.name)).join(' + ');
    return `<div style="display:grid;gap:10px"><div style="position:relative;border-radius:16px;overflow:hidden;background:radial-gradient(100% 90% at 50% 40%,${hexA(labEl(f.e1).glow, .22)},#060a1a)"><canvas class="lab-big" style="width:100%;height:230px;display:block"></canvas>
      <button class="fc-x" type="button" data-act="closeModal" aria-label="Sulge" style="position:absolute;right:10px;top:10px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:18px;cursor:pointer">×</button></div>
      <h2 style="margin:0;font-family:var(--f-display);font-weight:400;font-size:28px;color:#fff">${esc(f.name)}</h2>
      <div class="lab-meta"><span class="lab-rar" style="--rc:${rc}">${labRar(f.rarity)[0]}</span><span>${labEl(f.e1).ic} ${labEl(f.e1).n}${f.e2 !== f.e1 ? ' + ' + labEl(f.e2).ic + ' ' + labEl(f.e2).n : ''}</span>${f.legend ? '<span>👑 Salajane legend</span>' : ''}</div>
      ${f.descr ? `<p class="lab-lead" style="font-style:italic">${esc(f.descr)}</p>` : ''}
      ${dexItem ? `<div class="lab-lead">${dexItem.mine ? `📖 Avastasid ${fcDate(dexItem.mine.at)} · aretatud ${dexItem.mine.n}× · parim ${labRar(dexItem.mine.best)[0]}${dexItem.mine.parents ? `<br>🧪 Retsept: <b style="color:#fff">${dexItem.mine.parents.map(esc).join(' + ')}</b>` : ''}` : ''}${dexItem.first_name ? `<br>🏆 Esmaavastaja: <b style="color:#ffe3a0">${esc(dexItem.first_name)}</b> · ${fcDate(dexItem.first_at)}` : ''}</div>`
        : `<div class="lab-meta"><span>⚖️ ${fKg(f.weight)}</span><span>📏 ${Math.round(f.length)} cm</span><span>🪙 ${fmt(f.value)}</span></div>${labGenes(g)}<div class="lab-ab">${labAbTxt(g)}</div>${labHidTxt(g)}
          ${parents ? `<div class="lab-lead">🧪 Vanemad: <b style="color:#fff">${parents}</b>${f.at ? ' · ' + fcDate(f.at) : ''}</div>` : ''}${f.first ? '<div class="lab-lead">🏆 Sina avastasid selle liigi esimesena kogu kuningriigis!</div>' : ''}`}
    </div>`;
  }, 'labdet');
  const card = document.querySelector('#modalCard'); card.style.background = 'linear-gradient(180deg,#121a3a,#070b1c)'; card.style.border = '1px solid ' + labRar(f.rarity)[1]; card.style.maxWidth = '520px';
  const loop = ts => { const cv = document.querySelector('#modalCard canvas.lab-big'); if (!cv) return; const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) } const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    drawHybrid(c, w / 2, h / 2 + Math.sin(ts / 900) * 6, hyFitL(f, w, h, 1.1), f, ts / 1000, 1); requestAnimationFrame(loop) };
  requestAnimationFrame(loop);
}

/* ---------- ühendamise animatsioon ---------- */
function labFuseAnim(A, B, promise) {
  const box = document.createElement('div'); box.className = 'lab-fx'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Mutatsioon');
  box.innerHTML = '<canvas></canvas><button class="skip" type="button">Jäta vahele ⏭</button>'; document.body.appendChild(box);
  const cv = box.querySelector('canvas'), st = { t0: performance.now(), res: null, err: null, revealAt: 0, skip: false, done: false, shown: false };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, T1 = reduce ? 200 : 900, T2 = reduce ? 400 : 2500, T3 = reduce ? 600 : 3300;
  promise.then(r => { st.res = r }, e => { st.err = e });
  box.querySelector('.skip').onclick = () => { st.skip = true };
  if (typeof sfx === 'function') sfx('chime');
  const frame = now => {
    if (st.done) return;
    const w = innerWidth, h = innerHeight, dpr = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    let el = now - st.t0; if (st.skip && el < T3) { st.t0 = now - T3; el = T3 }
    if (st.err) { st.done = true; box.remove(); toast(st.err.message, 'bad'); return }
    const res = st.res && st.res.result, myth = res && res.rarity === 5, t = now / 1000;
    if (el >= T3 && res && !st.revealAt) { st.revealAt = now; if (typeof sfx === 'function') sfx(res.rarity >= 4 ? 'levelup' : 'coin'); if (myth) { const m = document.createElement('div'); m.className = 'myth'; m.textContent = 'MÜÜTILINE MUTATSIOON!'; box.appendChild(m) } }
    const rv = st.revealAt ? Math.min(1, (now - st.revealAt) / (myth ? 2200 : 1300) * (st.skip ? 3 : 1)) : 0;
    // taust: labor; müütilise puhul kuldne
    const gk = myth ? Math.min(1, rv * 1.5) : 0, bg = c.createRadialGradient(w / 2, h * .45, 0, w / 2, h * .45, Math.max(w, h) * .75);
    bg.addColorStop(0, mixC('#1a2a5a', '#7a5a10', gk)); bg.addColorStop(1, mixC('#03050f', '#1a1003', gk)); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    // suur akvaarium
    const tw = Math.min(w * .9, 760), th3 = Math.min(h * .55, 420), tx = (w - tw) / 2, ty = h * .14, cx = w / 2, cy = ty + th3 * .5;
    const glow0 = Math.min(1, el / T2), cA = A ? labEl(A.el[0]).glow : '#9fd0ff', cB = B ? labEl(B.el[0]).glow : '#c9a8ff', cG = myth && rv ? '#ffc96a' : null;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const x = w * (i + .5) / 7 + Math.sin(t * .4 + i) * 30, a0 = .05 + .05 * glow0 + (cG ? .08 * rv : 0); const sg = c.createLinearGradient(x, 0, x, h); sg.addColorStop(0, hexA(cG || (i % 2 ? cA : cB), a0)); sg.addColorStop(1, hexA(cG || (i % 2 ? cA : cB), 0)); c.fillStyle = sg; c.beginPath(); c.moveTo(x - 18, 0); c.lineTo(x + 18, 0); c.lineTo(x + 70, h); c.lineTo(x - 30, h); c.fill() }
    for (let i = 0; i < 40; i++) { const p = (t * .04 + i * .137) % 1, x = (i * 173) % w + Math.sin(t * .6 + i) * 14, y = h - p * h; c.fillStyle = hexA(cG || (i % 3 ? cB : cA), Math.sin(p * Math.PI) * (.4 + .4 * glow0)); c.beginPath(); c.arc(x, y, 1 + (i % 3) * .7, 0, 6.283); c.fill() }
    c.restore();
    { const base = Math.min(h * .14 + Math.min(h * .55, 420) + 30, h - 10), cs = Math.min(w, 900) * .055; labCrystal(c, w * .5 - Math.min(w * .9, 760) / 2 - cs * .2, base, cs, cG || cA, t, 0, .6 + glow0); labCrystal(c, w * .5 + Math.min(w * .9, 760) / 2 + cs * .2, base, cs, cG || cB, t, 2, .6 + glow0) }
    c.save(); c.beginPath(); c.roundRect ? c.roundRect(tx, ty, tw, th3, 28) : c.rect(tx, ty, tw, th3); const wg = c.createLinearGradient(0, ty, 0, ty + th3); wg.addColorStop(0, hexA(mixC('#1b5a8a', '#c8902a', gk), .9)); wg.addColorStop(1, 'rgba(4,14,30,.95)'); c.fillStyle = wg; c.fill(); c.clip();
    const glowK = Math.min(1, el / T2);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 30; i++) { const p = (t * (.08 + (i % 5) * .03) + i * .21) % 1; c.fillStyle = `rgba(210,240,255,${(1 - p) * .5})`; c.beginPath(); c.arc(tx + ((i * 89) % 100) / 100 * tw, ty + th3 - p * th3, 1.5 + (i % 3), 0, 6.283); c.fill() }
    const L = Math.min(tw * .26, th3 * .6);
    if (!st.revealAt || rv < .35) {
      // kaks kala lähenevad ja keerlevad
      const k = el < T1 ? el / T1 : 1, sp = el < T1 ? 0 : Math.min(1, (el - T1) / (T2 - T1)), rad = tw * .28 * (1 - sp * .85), ang = sp * sp * 9 + t * .5 * sp;
      const fade = st.revealAt ? 1 - rv / .35 : 1;
      [[A, 0, -1], [B, Math.PI, 1]].forEach(([x, a0, dir]) => { if (!x) return; const el2 = labEl(x.el[0]), px = cx + Math.cos(a0 + ang) * rad, py = cy + Math.sin(a0 + ang) * rad * .45;
        for (let q = 0; q < 4; q++) { const p = (t * (.6 + sp) + q / 4) % 1; c.strokeStyle = hexA(el2.glow, (1 - p) * (.25 + .5 * glowK) * fade); c.lineWidth = 2 + sp * 3; c.beginPath(); c.ellipse(px, py, L * (.3 + p * .7), L * (.16 + p * .4), 0, 0, 6.283); c.stroke() }
        c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = k * fade; labDrawAny(c, px, py, L * (1 - sp * .25), x.kind === 'h' ? { h: x.h } : { c: x.species, w: x.weight }, t, Math.sin(a0 + ang) > 0 ? -dir : dir); c.restore() });
      // energia keerises
      if (sp > 0) { for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283 + t * 3, r2 = (40 + (i % 7) * 18) * (1 - sp * .6); c.fillStyle = hexA(i % 2 && A ? labEl(A.el[0]).glow : B ? labEl(B.el[0]).glow : '#ffffff', .6 * sp); c.beginPath(); c.arc(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * .5, 2, 0, 6.283); c.fill() } }
    }
    // valgussähvatus (kuni server vastab ja kala ilmub)
    const flash = el < T2 ? 0 : !st.revealAt ? Math.min(1, (el - T2) / (T3 - T2)) : Math.max(0, 1 - rv * 1.6);
    if (flash > 0) { const fg = c.createRadialGradient(cx, cy, 0, cx, cy, tw * .7); fg.addColorStop(0, `rgba(255,255,255,${flash})`); fg.addColorStop(.4, `rgba(220,230,255,${flash * .7})`); fg.addColorStop(1, 'rgba(200,210,255,0)'); c.fillStyle = fg; c.fillRect(tx, ty, tw, th3) }
    if (st.revealAt && res) {
      // uus kala ilmub valguse seest
      const k2 = Math.min(1, rv / .7), ease = 1 - Math.pow(1 - k2, 3);
      if (myth || res.rarity >= 4) { c.save(); c.translate(cx, cy); c.rotate(t * .2); for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283, rr2 = tw * .7; const gr = c.createLinearGradient(0, 0, Math.cos(a) * rr2, Math.sin(a) * rr2); gr.addColorStop(0, myth ? `rgba(255,214,120,${.35 * k2})` : `rgba(200,150,255,${.25 * k2})`); gr.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, rr2, a - .06, a + .06); c.fill() } c.restore() }
      if (myth) { const p = Math.min(1, rv * 1.2); c.strokeStyle = `rgba(255,220,140,${(1 - p) * .9})`; c.lineWidth = 6 * (1 - p) + 1; c.beginPath(); c.arc(cx, cy, tw * .1 + p * tw * .8, 0, 6.283); c.stroke() }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = ease;
      drawHybrid(c, cx, cy + Math.sin(t * 1.2) * 6, hyFitL(res, tw, th3, .95) * (.6 + .4 * ease), res, t, 1); c.globalAlpha = 1;
    }
    c.restore();
    // klaas
    c.save(); c.beginPath(); c.roundRect ? c.roundRect(tx, ty, tw, th3, 28) : c.rect(tx, ty, tw, th3); c.strokeStyle = myth && rv ? 'rgba(255,214,120,.8)' : 'rgba(170,215,255,.45)'; c.lineWidth = myth && rv ? 3 : 2; c.stroke(); c.restore();
    if (!st.revealAt || rv < .4) { const msg = el < T1 ? 'Kalad sisenevad akvaariumi…' : el < T1 + (T2 - T1) * .5 ? 'Energialained põimuvad…' : el < T2 ? 'Geenid segunevad…' : 'Mutatsioon!'; c.save(); c.globalAlpha = st.revealAt ? 1 - rv / .4 : 1; c.textAlign = 'center'; c.font = `600 ${Math.max(15, Math.min(22, w * .03))}px system-ui`; c.fillStyle = '#dfe6ff'; c.shadowColor = '#7a5aff'; c.shadowBlur = 14; c.fillText(msg, w / 2, ty + th3 + 56); c.restore() }
    if (st.revealAt && rv >= .55 && !st.shown) { st.shown = true; labResultPanel(box, st.res) }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  box.addEventListener('click', e => { const b = e.target.closest('[data-labfx]'); if (!b) return; const a = b.dataset.labfx;
    if (a === 'close' || a === 'mine' || a === 'tank') { st.done = true; box.remove(); if (a === 'mine') { LAB.sub = 'hybriidid'; renderFV(true) } if (a === 'tank' && st.res) labAct('tank', st.res.result.id) } });
}
function labResultPanel(box, r) {
  const f = r.result, rc = labRar(f.rarity)[1], g = f.genes || {}, d = LAB.d, tanksUsed = (d && d.fish || []).filter(x => x.status === 'tank').length;
  const el = document.createElement('div'); el.className = 'lab-res'; el.style.setProperty('--rc', rc);
  el.innerHTML = `<div class="c">${r.new ? '<span class="badge new">✨ Uus liik!</span>' : ''}${r.first_find ? '<span class="badge first">🏆 Esmaavastaja kogu kuningriigis!</span>' : ''}${g.mutated ? '<span class="badge mut">🧬 Mutatsioon!</span>' : ''}</div>
    <h2>${esc(f.name)}</h2><div class="c"><span class="lab-rar" style="--rc:${rc}">${labRar(f.rarity)[0]}</span><span class="badge">${labEl(f.e1).ic} ${labEl(f.e1).n}${f.e2 !== f.e1 ? ' + ' + labEl(f.e2).ic + ' ' + labEl(f.e2).n : ''}</span><span class="badge">⚖️ ${fKg(f.weight)} · 📏 ${Math.round(f.length)} cm</span><span class="badge">🪙 ${fmt(f.value)}</span></div>
    ${f.descr ? `<p class="lab-lead" style="text-align:center;font-style:italic">${esc(f.descr)}</p>` : ''}${labGenes(g)}<div class="lab-ab">${labAbTxt(g)}</div>${labHidTxt(g)}
    <div class="lab-acts" style="justify-content:center;margin-top:4px"><button class="lab-btn vi" type="button" data-labfx="tank" ${tanksUsed >= (d ? d.tanks : 1) ? 'disabled' : ''}>Pane labori akvaariumi</button><button class="lab-btn" type="button" data-labfx="mine">Vaata hübriide</button><button class="lab-btn gold" type="button" data-labfx="close">Jätka aretamist</button></div>`;
  box.appendChild(el); const sk = box.querySelector('.skip'); if (sk) sk.remove();
}

/* ---------- tegevused ---------- */
async function labAct(a, arg, el) {
  if (LAB.busy) return;
  const call = async (fn, args) => { LAB.busy = true; renderFV(true); try { const r = await rpc(fn, args); const { result, sold, bought, delivered, upgraded, lvlup, ach, ...st } = r; LAB.d = st;
    if (sold) toast(`Müüdud ${fmt(sold)} kulda eest`, 'gold', 'gold');
    if (bought) toast(`Ostsid hübriidi: ${bought.name}`, 'gold', 'fish');
    if (delivered) toast(`Labori tellimus täidetud! +${fmt(delivered.gold)} kulda${itemsTxt(delivered.items)}`, 'gold', 'gold');
    if (upgraded) { toast(`Labor arenes: ${LAB.d.levels[upgraded - 1].name}!`, 'gold', 'fame'); if (typeof sfx === 'function') sfx('levelup') }
    if ((lvlup && lvlup.length) || (ach && ach.length)) { await refreshFS(); if (typeof afterLevels === 'function') afterLevels(lvlup); if (typeof afterAch === 'function') afterAch(ach) } else if (sold || bought || delivered || upgraded) await refreshFS();
    return r } catch (e) { toast(e.message, 'bad') } finally { LAB.busy = false; LAB.conf = null; renderFV(true) } };
  if (a === 'tank') return call('lab_tank', { p_id: +arg, p_on: true });
  if (a === 'untank') return call('lab_tank', { p_id: +arg, p_on: false });
  if (a === 'sell') { if (LAB.conf !== 'sell' + arg) { LAB.conf = 'sell' + arg; return renderFV(true) } return call('lab_sell', { p_id: +arg }) }
  if (a === 'list') { LAB.listFor = +arg; return renderFV(true) }
  if (a === 'listno') { LAB.listFor = null; return renderFV(true) }
  if (a === 'listgo') { const v = Math.round(+(document.getElementById('labPrice' + arg) || {}).value); LAB.listFor = null; return call('lab_list', { p_id: +arg, p_price: v }) }
  if (a === 'unlist') return call('lab_unlist', { p_listing: +arg });
  if (a === 'buy') { if (LAB.conf !== 'buy' + arg) { LAB.conf = 'buy' + arg; return renderFV(true) } return call('lab_buy', { p_listing: +arg }) }
  if (a === 'deliver') return call('lab_deliver', { p_id: +arg });
  if (a === 'upgrade') return call('lab_upgrade');
  if (a === 'fuse') {
    const A = labFind(LAB.a), B = labFind(LAB.b); if (!A || !B) return;
    LAB.busy = true;
    const p = rpc('lab_fuse', { p_a_kind: A.kind, p_a: A.id, p_b_kind: B.kind, p_b: B.id });
    labFuseAnim(A, B, p);
    try { const r = await p; const { result, lvlup, ach, ...st } = r; LAB.d = st; LAB.a = LAB.b = null; await refreshFS(); setTimeout(() => { if (typeof afterLevels === 'function') afterLevels(lvlup); if (typeof afterAch === 'function') afterAch(ach) }, 4500) } catch (e) { }
    LAB.busy = false; renderFV(true);
  }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-lab]'); if (!el || el.disabled) return;
  const a = el.dataset.lab, arg = el.dataset.arg;
  if (a === 'sub') { LAB.sub = arg; LAB.conf = null; LAB.listFor = null; return renderFV(true) }
  if (a === 'filter') { LAB.filter = arg; LAB.more = false; return renderFV(true) }
  if (a === 'dexf') { LAB.dexF = arg; return renderFV(true) }
  if (a === 'more') { LAB.more = true; return renderFV(true) }
  if (a === 'slot') { LAB[arg] = null; return renderFV(true) }
  if (a === 'pick') {
    const k = { kind: el.dataset.kind, id: +arg }, same = x => x && x.kind === k.kind && x.id === k.id;
    if (same(LAB.a)) LAB.a = null; else if (same(LAB.b)) LAB.b = null;
    else if (!LAB.a) LAB.a = k; else if (!LAB.b) LAB.b = k; else LAB.b = k;
    if (typeof sfx === 'function') sfx('pop');
    return renderFV(true);
  }
  if (a === 'detail') { const f = (LAB.d.fish || []).find(x => x.id === +arg); if (f) labDetail(f); return }
  if (a === 'mdetail') { const f = (LAB.d.market || []).find(x => x.listing_id === +arg); if (f) labDetail(f); return }
  if (a === 'dex') { const x = (LAB.d.dex || []).find(y => y.id === arg); if (!x) return; if (!x.mine) { const rc = x.legend && typeof RS !== 'undefined' && RS.d ? (RS.d.recipes || []).find(y => y.id === x.id) : null; if (rc && rc.recipe) return toast(`Retsept: ${rc.recipe.map(k => FD.sp[k] ? FD.sp[k].name : k).join(' + ')} (labori 4. tase)`, 'info') } if (!x.mine) return toast(x.legend ? 'Salajane legend: ühenda õiged kaks muinasjutukala labori 4. tasemel.' : 'Seda liiki sa veel avastanud pole. Proovi eri elementidega kalu ühendada!', 'info');
    return labDetail({ species: x.id, name: x.name, e1: x.e1, e2: x.e2, body: x.body, legend: x.legend, rarity: x.mine.best, descr: x.descr, genes: { seed: x.sort * 131 + 7 } }, x) }
  labAct(a, arg, el);
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.lab && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.target.click() } });

/* ---------- ühendus ülejäänud mänguga ---------- */
{
  FTAB_FN.labor = tabLabor;
  const baseRenderL = renderFV;
  renderFV = function (force) { baseRenderL(force); if (FV.open && FV.tab === 'labor') labStart() };
  const baseNewsL = newsText;
  newsText = function (n) {
    const who = `<b>${esc(n.name)}</b>${n.title ? ` <small class="lead">${esc(n.title)}</small>` : ''}`, d = n.data || {};
    if (n.kind === 'lab_first') return `${who} avastas geneetikalaboris esimesena uue liigi: <b style="color:#c9a8ff">${esc(d.name || '')}</b>! 🧬`;
    if (n.kind === 'lab_myyt') return `${who} lõi <b style="color:#ffc444">MÜÜTILISE</b> hübriidi: ${esc(d.name || '')}! ✨`;
    if (n.kind === 'lab_legend') return `${who} avastas salajase legendi: <b style="color:#ffe3a0">${esc(d.name || '')}</b>! 👑`;
    if (n.kind === 'lab_level') return `${who} arendas oma geneetikalabori ${d.level}. tasemele (${esc(d.name || '')}).`;
    return baseNewsL(n);
  };
  Object.assign(NEWS_IC, { lab_first: '🧬', lab_myyt: '✨', lab_legend: '👑', lab_level: '⚗️' });
  const baseBadgesL = fvBadges;
  fvBadges = function () { const b = baseBadgesL(); if (LAB.d && LAB.d.unlocked && LAB.d.req && !LAB.d.req.done && (LAB.d.fish || []).some(f => (f.e1 === LAB.d.req.element || f.e2 === LAB.d.req.element) && f.rarity >= LAB.d.req.minr && f.status !== 'listed')) b.labor = 1; return b };
  if (typeof remTodo === 'function') {
    const baseTodoL = remTodo;
    remTodo = function () { const r = baseTodoL(); const d = LAB.d; if (d && d.unlocked) { r.total++; if (d.fusions >= d.cap) r.done++; else r.T.push({ c: '#c27aff', t: 'Geneetikalabor', s: `${d.cap - d.fusions} ühendamist täna alles`, p: d.fusions / d.cap, tab: 'labor', b: 'Ava' }) } return r };
  }
  const baseRefreshL = refreshFS;
  refreshFS = async function () { const r = await baseRefreshL(); if (!LAB.d && !LAB.loading && CL.user && FS && FS.level >= 5) labLoad(); return r };
}
document.addEventListener('click', e => { const t = e.target.closest('[data-fa="tab"][data-arg="labor"]'); if (t) { LAB.d = LAB.d || null; labLoad(true) } });
