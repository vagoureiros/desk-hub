<script>
/* "Send to phone": snapshot of stations + focus stats as a link (no accounts, no server). */
(()=>{const hdr=document.querySelector('.hright');const hist=document.getElementById('histBtn');if(!hdr||!hist)return;
const b=document.createElement('button');b.className='hbtn';b.id='phoneBtn';b.setAttribute('aria-label','Send to phone');
b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>';
hist.parentNode.insertBefore(b,hist);
const get=k=>{try{return JSON.parse(localStorage.getItem('hub.'+k)||'null')}catch(e){return null}};
function enc(o){const u=new TextEncoder().encode(JSON.stringify(o));let s='';u.forEach(c=>s+=String.fromCharCode(c));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function toast(m){const t=document.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2600);}
b.onclick=async()=>{const st=get('stats')||{};const keep={};Object.keys(st).sort().slice(-14).forEach(k=>keep[k]=st[k]);
  const data={v:1,ts:Date.now(),custom:get('custom')||[],hidden:get('hidden')||[],imgs:get('imgs')||{},stats:keep};
  const url=new URL('m/',location.href).href+'#sync='+enc(data);
  if(navigator.share){try{await navigator.share({title:'Desk Hub · Pocket',url});return;}catch(e){if(e.name==='AbortError')return;}}
  try{await navigator.clipboard.writeText(url);toast('Link copied · open it on your phone');}catch(e){prompt('Open this on your phone',url);}};
})();
</script>
