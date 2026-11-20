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
const cta=document.createElement('button');cta.id='mPick';document.body.appendChild(cta);
cta.onclick=()=>set(true);
const RADIO_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="M7 8 17 3.5"/><circle cx="15.5" cy="14" r="2.6"/><path d="M6.5 12.5h4M6.5 15.5h4"/></svg>';
setInterval(()=>{const t=$('#npTitle').textContent;const empty=/^Pick a /.test(t);document.body.classList.toggle('no-cur',empty);
  const txt=empty?'Pick a radio station':'Change station';
  if(cta.dataset.t!==txt){cta.dataset.t=txt;cta.innerHTML=RADIO_SVG+'<span>'+txt+'</span>';cta.classList.toggle('sec',!empty);}},300);
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
setInterval(()=>{const ct=$('#crateTitle'),tt=$('#tTime'),gt=$('#gTitle'),gm=$('#gTimer');const ctt=ct?ct.textContent.split(' · '):['Stations',''];if(gt)gt.textContent=ctt[0];
  if(tt&&gm){const run=$('#tStart')&&/pause/i.test($('#tStart').textContent);gm.textContent=(ctt[1]||'0')+(ctt[1]==='1'?' station':' stations');gm.classList.remove('run');}},700);

// phone = radio only: no records/radio switch; breathing gets its own screen
const goRadio=()=>{try{if(hub.view!=='radio')hub.setView('radio')}catch(e){}};setTimeout(goRadio,0);setTimeout(goRadio,800);

// ON CALL is automatic on phones (system interruption), so the pill is a status, not a button
const oab=$('#oaBtn');if(oab){oab.onclick=null;oab.setAttribute('aria-disabled','true');oab.title='Turns on by itself when a call comes in';}
// pull down anywhere on the page to refresh
const ptr=document.createElement('div');ptr.id='mPtr';ptr.innerHTML='<i></i>';document.body.appendChild(ptr);
let py=null,pd=0;const TH=90;
document.addEventListener('touchstart',e=>{if(document.body.classList.contains('drawer-open')||e.target.closest('aside,#mBreath,#hist,#sheet,#alarmSheet,#moodMenu,#onair'))return;py=e.touches[0].clientY;pd=0;},{passive:true});
document.addEventListener('touchmove',e=>{if(py==null)return;pd=Math.max(0,e.touches[0].clientY-py);const k=Math.min(1,pd/TH);
  ptr.style.transform=`translate(-50%,${Math.min(pd*.6,80)-50}px) rotate(${pd*2.4}deg)`;ptr.style.opacity=k;ptr.classList.toggle('ready',pd>=TH);
  document.querySelector('.app').style.transform=`translateY(${Math.min(pd*.35,40)}px)`;},{passive:true});
document.addEventListener('touchend',()=>{if(py==null)return;const go=pd>=TH;py=null;document.querySelector('.app').style.transform='';
  if(go){ptr.classList.add('spin');setTimeout(()=>location.reload(),350);}else{ptr.style.opacity=0;ptr.style.transform='translate(-50%,-50px)';}},{passive:true});
})();
</script>
