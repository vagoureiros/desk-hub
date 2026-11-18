<script>
/* Decorative waveform: animates while a record plays, settles to a flat line when paused.
   (Streams are cross-origin, so this is a stylised visual, not a real audio analysis.) */
(()=>{const c=document.getElementById('wave');if(!c)return;const x=c.getContext('2d');const now=document.getElementById('now');
const N=56;let amp=0,t=0,ph=[...Array(N)].map(()=>Math.random()*6.28),sp=[...Array(N)].map(()=>.6+Math.random()*1.6);
function size(){const r=c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);c.width=r.width*d;c.height=r.height*d;x.setTransform(d,0,0,d,0,0);}
addEventListener('resize',size);size();
function frame(){requestAnimationFrame(frame);if(document.hidden)return;
  const on=!now.classList.contains('paused');amp+=((on?1:0)-amp)*.06;t+=.016;
  const w=c.clientWidth,h=c.clientHeight,gap=w/N,bw=Math.max(2,gap*.42);x.clearRect(0,0,w,h);
  for(let i=0;i<N;i++){const env=Math.sin(Math.PI*(i+.5)/N)**.8;
    const v=.5+.5*Math.sin(t*sp[i]*3+ph[i])*Math.sin(t*1.3+i*.35);
    const bh=Math.max(2,(.12+.88*v*env)*h*.92*amp+2*(1-amp));
    const a=.35+.6*env;x.fillStyle=`rgba(243,238,233,${a*(.4+.6*amp)})`;
    const xx=i*gap+(gap-bw)/2,y=(h-bh)/2;x.beginPath();x.roundRect?x.roundRect(xx,y,bw,bh,bw/2):x.rect(xx,y,bw,bh);x.fill();}}
frame();})();
</script>
<script>
/* Big title = station. When the station shares the song, show it in a centered line under the waveform. */
(()=>{const st=document.getElementById('npStation'),ti=document.getElementById('npTitle'),ar=document.getElementById('npArtist'),wave=document.getElementById('wave');
if(!st||!ti||!ar||!wave)return;const row=st.closest('.np-station');row.style.display='none';
const line=document.createElement('div');line.id='songLine';line.innerHTML='<span class="sl-t"></span><span class="sl-a"></span>';
wave.insertAdjacentElement('afterend',line);const like=document.getElementById('likeBtn');if(like)line.appendChild(like);
const mk=(d,path)=>{const b=document.createElement('button');b.className='tk';b.setAttribute('aria-label',d<0?'Previous track':'Next track');b.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor"><path d="'+path+'"/></svg>';b.onclick=()=>window.hub&&hub.trackStep(d);return b;};
line.insertBefore(mk(-1,'M6 5h2v14H6zM20 5v14L9 12z'),line.firstChild);line.appendChild(mk(1,'M16 5h2v14h-2zM4 5v14l11-7z'));
setInterval(()=>document.body.classList.toggle('is-record',!!(window.hub&&hub.isRecord&&hub.isRecord())),800);
let busy=false;
function curSub(){const c=document.querySelector('.sleeve.cur em');return c?c.textContent:'';}
function upd(){if(busy)return;const sn=st.textContent.trim(),t=ti.textContent.trim();
  if(sn&&t&&t!==sn){busy=true;line.querySelector('.sl-t').textContent=t;line.querySelector('.sl-a').textContent=ar.textContent.trim();
    line.classList.add('on');ti.textContent=sn;ar.textContent=curSub();busy=false;}
  else if(t===sn&&!line.dataset.keep){/* station view; keep song line only while same station plays */}
}
let lastStation='';new MutationObserver(()=>{const sn=st.textContent.trim();if(sn!==lastStation){lastStation=sn;line.classList.remove('on');}upd();}).observe(st,{childList:true,characterData:true,subtree:true});
new MutationObserver(upd).observe(ti,{childList:true,characterData:true,subtree:true});
upd();})();
</script>
