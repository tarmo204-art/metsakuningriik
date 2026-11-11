/* ===== Ühtne edetabelite kujundus: poodium + read, kus pealkirjad ja numbrid on täpselt kohakuti ===== */
{
  const st = document.createElement('style'); st.textContent = `
.lbc{container-type:inline-size;min-width:0}.lbx{display:grid;gap:6px;--cw:76px}
.lbx .hd,.lbx .rw{display:grid;grid-template-columns:40px minmax(0,1fr) repeat(var(--n),var(--cw)) var(--ax,0px);align-items:center;gap:8px;padding:0 12px}
.lbx .hd{font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#8fb4a8;padding-bottom:2px}
.lbx .hd span:nth-child(n+3),.lbx .rw .v{text-align:right}
.lbx .rw{min-height:52px;border-radius:12px;background:linear-gradient(90deg,rgba(255,255,255,.045),rgba(255,255,255,.015));border:1px solid rgba(195,211,164,.09);transition:background .2s}
.lbx .rw:hover{background:linear-gradient(90deg,rgba(255,255,255,.07),rgba(255,255,255,.025))}
.lbx .rw.me{background:linear-gradient(90deg,rgba(242,181,82,.2),rgba(242,181,82,.06));border-color:rgba(242,181,82,.5);box-shadow:0 0 0 1px rgba(242,181,82,.15) inset}
.lbx .rk{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;font-weight:800;font-size:13px;color:#c8d4c0;background:rgba(0,0,0,.28);font-variant-numeric:tabular-nums}
.lbx .rk.m1{background:radial-gradient(circle at 35% 30%,#fff2b0,#e6b02e 55%,#9a6a10);color:#3a2604;box-shadow:0 0 12px rgba(242,190,60,.5)}
.lbx .rk.m2{background:radial-gradient(circle at 35% 30%,#ffffff,#c4ccd4 55%,#7a848e);color:#252b31}
.lbx .rk.m3{background:radial-gradient(circle at 35% 30%,#ffd8b0,#c8844a 55%,#7a4a1e);color:#2e1808}
.lbx .who{display:flex;align-items:center;gap:10px;min-width:0}
.lbx .av{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:15px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4);box-shadow:inset 0 -3px 6px rgba(0,0,0,.25)}
.lbx .nm{min-width:0;display:grid}
.lbx .nm b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lbx .nm small{font-size:11.5px;color:#9aaa94;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lbx .nm .you{display:inline-block;margin-left:6px;padding:0 6px;border-radius:6px;background:#f2b552;color:#2a1a04;font-size:10px;font-weight:800;vertical-align:2px}
.lbx .v{font-variant-numeric:tabular-nums;font-weight:700;font-size:14px;white-space:nowrap}
.lbx .v.main{color:#ffd88a;font-size:15px}
.lbx .ac{display:flex;justify-content:flex-end}
.lbx .live{width:9px;height:9px;border-radius:50%;background:#7fe07a;box-shadow:0 0 0 3px rgba(127,224,122,.2);animation:lbLive 1.4s infinite}@keyframes lbLive{50%{box-shadow:0 0 0 6px rgba(127,224,122,0)}}
.lbpod{display:grid;grid-template-columns:1fr 1.12fr 1fr;gap:8px;align-items:end;margin:4px 0 8px}
.lbpod .pc{position:relative;display:grid;justify-items:center;gap:3px;text-align:center;padding:14px 8px 10px;border-radius:16px;border:1px solid rgba(255,255,255,.1);min-width:0}
.lbpod .pc.p1{padding-top:22px;background:linear-gradient(180deg,rgba(242,190,60,.28),rgba(242,190,60,.05));border-color:rgba(242,190,60,.55)}
.lbpod .pc.p2{background:linear-gradient(180deg,rgba(200,210,220,.2),rgba(200,210,220,.04));border-color:rgba(200,210,220,.35)}
.lbpod .pc.p3{background:linear-gradient(180deg,rgba(200,132,74,.22),rgba(200,132,74,.04));border-color:rgba(200,132,74,.4)}
.lbpod .pc.me{box-shadow:0 0 0 2px rgba(242,181,82,.7)}
.lbpod .av{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:19px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4);box-shadow:inset 0 -4px 8px rgba(0,0,0,.25),0 4px 10px rgba(0,0,0,.3)}
.lbpod .p1 .av{width:56px;height:56px;font-size:23px;box-shadow:inset 0 -4px 8px rgba(0,0,0,.25),0 0 0 3px #e6b02e,0 6px 16px rgba(0,0,0,.35)}
.lbpod .crown{position:absolute;top:-14px;font-size:24px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
.lbpod .pl{font-size:11px;font-weight:800;letter-spacing:.06em;color:#c8d4c0}
.lbpod b{font-size:14px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lbpod small{font-size:11px;color:#9aaa94;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lbpod .pv{font-family:var(--f-head,serif);font-size:18px;color:#ffd88a;font-variant-numeric:tabular-nums}
.lbpod{min-width:0}@container (max-width:520px){.lbpod{gap:5px}.lbpod .pc{padding:12px 4px 8px}.lbpod .pv{font-size:15px}.lbpod .av{width:38px;height:38px;font-size:16px}.lbpod .p1 .av{width:46px;height:46px}}
.lbpod .pv i{font-style:normal;font-size:11px;color:#c8d4c0;margin-left:3px}
@container (max-width:520px){.lbx{--cw:54px}.lbx .xm{display:none}.lbx .hd,.lbx .rw{grid-template-columns:34px minmax(0,1fr) repeat(var(--nm),var(--cw)) var(--ax,0px);gap:6px;padding:0 9px}.lbx .av{width:30px;height:30px;font-size:13px}}`; document.head.appendChild(st);
}
function lbAvCol(s) { let h = 0; for (const ch of String(s || '?')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const hue = h % 360; return `linear-gradient(145deg,hsl(${hue} 55% 52%),hsl(${(hue + 30) % 360} 50% 34%))` }
function lbAv(name) { const n = String(name || '?').trim(); return `<span class="av" style="background:${lbAvCol(n)}">${esc((n[0] || '?').toUpperCase())}</span>` }
/* cfg: { cols: ['Tase', 'Kuulsus'], main: 0 (rõhutatud veerg), unit: ['', ' kg'], rows: [{ place, name, sub, me, vals: [..], live, act }], podium: true, act: true, actW: '90px' } */
function lbHtml(cfg) {
  const rows = cfg.rows || [], n = cfg.cols.length, mainI = cfg.main ?? 0;
  let h = '<div class="lbc">', list = rows;
  if (cfg.podium && rows.length >= 3) {
    const top = rows.slice(0, 3), order = [top[1], top[0], top[2]];
    h += `<div class="lbpod">${order.map(r => { const p = r.place; return `<div class="pc p${p} ${r.me ? 'me' : ''}">${p === 1 ? '<span class="crown">👑</span>' : ''}${lbAv(r.name)}<span class="pl">${p}. KOHT</span><b>${esc(r.name)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}<span class="pv">${r.vals[mainI]}<i>${esc(cfg.cols[mainI]).toLowerCase()}</i></span></div>` }).join('')}</div>`;
    list = rows.slice(3);
  }
  if (!list.length) return h + '</div>';
  const hm = new Set(cfg.hideM || []), xm = i => hm.has(i) ? ' xm' : '';
  const st = `--n:${n};--nm:${n - hm.size};${cfg.cw ? '--cw:' + cfg.cw + ';' : ''}${cfg.act ? `--ax:${cfg.actW || '96px'}` : ''}`;
  h += `<div class="lbx" style="${st}"><div class="hd"><span>#</span><span>${esc(cfg.who || 'Mängija')}</span>${cfg.cols.map((c, i) => `<span class="${xm(i)}">${esc(c)}</span>`).join('')}${cfg.act ? '<span></span>' : ''}</div>`;
  h += list.map(r => `<div class="rw ${r.me ? 'me' : ''}"><span class="rk ${r.place <= 3 ? 'm' + r.place : ''}">${r.live ? '<span class="live"></span>' : r.place}</span>
    <div class="who">${lbAv(r.name)}<div class="nm"><b>${esc(r.name)}</b>${r.sub || r.me ? `<small>${r.me ? '<span class="you" style="margin:0 5px 0 0">SINA</span>' : ''}${esc(r.sub || '')}</small>` : ''}</div></div>
    ${r.vals.map((v, i) => `<span class="v ${i === mainI ? 'main' : ''}${xm(i)}"${r.colors && r.colors[i] ? ` style="color:${r.colors[i]}"` : ''}>${v}</span>`).join('')}${cfg.act ? `<span class="ac">${r.act || ''}</span>` : ''}</div>`).join('');
  return h + '</div></div>';
}
