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
const hint=$('#npArtist');if(hint&&/on the right/.test(hint.textContent))hint.textContent='Tap the cover, or pick a record below';
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
setInterval(()=>{const ct=$('#crateTitle'),tt=$('#tTime'),gt=$('#gTitle'),gm=$('#gTimer');if(ct&&gt)gt.textContent=ct.textContent.replace(/\s*·.*$/,'');
  if(tt&&gm){const run=$('#tStart')&&/pause/i.test($('#tStart').textContent);gm.textContent=(run?'● ':'')+'Timer '+tt.textContent;gm.classList.toggle('run',run);}},700);
})();
</script>
