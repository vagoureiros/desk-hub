<script>
/* Phone layout: album-art player + right panel in a bottom drawer */
(()=>{const ph=matchMedia('(max-width:700px), (max-height:500px) and (pointer:coarse)').matches;if(!ph)return;
document.body.classList.add('phone');
const $=q=>document.querySelector(q);
// album art player
const art=document.createElement('button');art.id='mArt';art.setAttribute('aria-label','Play / pause');art.innerHTML='<i class="disc"></i><span class="img"></span>';
const wave=$('#wave');wave.parentNode.insertBefore(art,wave);
art.onclick=()=>window.hub&&hub.toggle();
let lastCv=null;setInterval(()=>{if(!window.hub)return;const cv=hub.cover||'';const im=art.querySelector('.img');
  if(cv!==lastCv){lastCv=cv;im.style.backgroundImage=cv?`url("${cv.replace(/"/g,'%22')}")`:'';art.classList.toggle('has',!!cv);}
  art.style.setProperty('--c',hub.color||'#3a3330');
  art.classList.toggle('playing',!$('#now').classList.contains('paused'));},500);
setTimeout(()=>{try{hub.emptyLabel()}catch(e){}},0);
const cta=document.createElement('button');cta.id='mPick';$('#now').appendChild(cta);
cta.onclick=()=>set(true);
setInterval(()=>{const t=$('#npTitle').textContent;const empty=/^Pick a /.test(t);document.body.classList.toggle('no-cur',empty);
  if(empty){const r=true;const txt=r?'Pick a radio station':'Pick a record';
    if(cta.dataset.t!==txt){cta.dataset.t=txt;cta.innerHTML=(r?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="M7 8 17 3.5"/><circle cx="15.5" cy="14" r="2.6"/><path d="M6.5 12.5h4M6.5 15.5h4"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/></svg>')+'<span>'+txt+'</span>';}}},300);
// drawer
const aside=$('aside');const grab=document.createElement('div');grab.className='grab';
grab.innerHTML='<i></i><div class="gl"><span id="gTitle">Records</span><span id="gTimer"></span></div>';
aside.insertBefore(grab,aside.firstChild);
const scrim=document.createElement('div');scrim.id='mScrim';$('main').appendChild(scrim);
const set=o=>{aside.classList.toggle('open',o);document.body.classList.toggle('drawer-open',o);if(!o)aside.scrollTop=0;};
grab.onclick=()=>set(!aside.classList.contains('open'));scrim.onclick=()=>set(false);
let y0=null;grab.addEventListener('touchstart',e=>{y0=e.touches[0].clientY},{passive:true});
grab.addEventListener('touchend',e=>{if(y0==null)return;const dy=e.changedTouches[0].clientY-y0;y0=null;if(dy<-30)set(true);else if(dy>30)set(false);},{passive:true});
// close drawer when a record/station is chosen
$('#crate').addEventListener('click',e=>{const t=e.target.closest('.sleeve');if(t&&!t.classList.contains('wish')&&!t.classList.contains('add'))setTimeout(()=>set(false),250);});
// peek label: crate title + running timer
setInterval(()=>{const ct=$('#crateTitle'),tt=$('#tTime'),gt=$('#gTitle'),gm=$('#gTimer');if(gt)gt.textContent='Stations';
  if(tt&&gm){const run=$('#tStart')&&/pause/i.test($('#tStart').textContent);const n=document.querySelectorAll('#crate .sleeve:not(.add)').length;gm.textContent=(document.body.classList.contains('chill')?'Chill':'Focus')+' · '+n;gm.classList.remove('run');}},700);

// phone = radio only: no records/radio switch; breathing gets its own screen
const goRadio=()=>{try{if(hub.view!=='radio')hub.setView('radio')}catch(e){}};setTimeout(goRadio,0);setTimeout(goRadio,800);
const bb=document.createElement('button');bb.className='hbtn';bb.id='breathBtn';bb.setAttribute('aria-label','Breathe');
bb.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="6.6" opacity=".6"/><circle cx="12" cy="12" r="9.8" opacity=".3"/></svg>';
const hr=$('.hright');hr.insertBefore(bb,hr.firstChild);
const ov=document.createElement('div');ov.id='mBreath';ov.innerHTML='<button class="x" aria-label="Close">×</button><h2>Breathe</h2><p>One minute. In for 4, hold, out for 4.</p>';
document.body.appendChild(ov);const pc=$('#pChill');ov.appendChild(pc);
bb.onclick=()=>{ov.classList.add('on')};
ov.querySelector('.x').onclick=()=>{const b=$('#bStart');if(b&&/stop/i.test(b.textContent))b.click();ov.classList.remove('on')};
})();
</script>
