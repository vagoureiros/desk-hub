<script>
/* ===== Alarms: voice or quick buttons, no note — just a ring ===== */
(()=>{const $=s=>document.querySelector(s);const hdr=document.querySelector('.hright');const hist=$('#histBtn');if(!hdr||!hist)return;
const KEY='hub.alarms';const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}};const save=a=>{try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}};
let alarms=load().filter(t=>t>Date.now()-60000);save(alarms);
const fmt=t=>new Date(t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
const inMin=t=>{const m=Math.max(0,Math.round((t-Date.now())/60000));return m<60?`in ${m} min`:`in ${Math.floor(m/60)}h ${m%60?m%60+'m':''}`.trim()};

/* --- header button --- */
const b=document.createElement('button');b.className='hbtn';b.id='alarmBtn';b.setAttribute('aria-label','Alarm');
b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.2 1.6M5 4.5 2.8 6.6M19 4.5l2.2 2.1"/></svg><span class="ab-t"></span>';
hist.parentNode.insertBefore(b,hist);

/* --- sheet --- */
const sh=document.createElement('div');sh.id='alarmSheet';sh.innerHTML=`<div class="sheet as-box">
 <div class="sh-head"><div class="sh-top"><h2>Alarm</h2><button id="asClose" aria-label="Close">×</button></div></div>
 <div class="as-body">
  <button id="asMic" class="as-mic" aria-label="Speak"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>
  <div id="asHint" class="as-hint">Tap and say “in 10 minutes” or “at 17:30”<br><span>«σε 10 λεπτά» · «στις 5 και μισή» also work</span></div>
  <div class="as-quick"><button class="chip" data-m="5">+5′</button><button class="chip" data-m="10">+10′</button><button class="chip" data-m="15">+15′</button><button class="chip" data-m="30">+30′</button><button class="chip" data-m="60">+1h</button></div>
  <div class="as-at"><input id="asTime" type="time"><button class="chip solid" id="asSet">Set</button></div>
  <div id="asList"></div>
 </div></div>`;document.body.appendChild(sh);
const fire=document.createElement('div');fire.id='alarmFire';fire.innerHTML=`<div class="af-ring"></div><div class="af-t" id="afT"></div><div class="af-l">Alarm</div>
 <div class="af-b"><button class="chip" id="afSnooze">Snooze 5′</button><button class="chip solid" id="afStop">Stop</button></div>`;document.body.appendChild(fire);

/* --- audio (needs a tap to unlock on iPad) --- */
let ctx=null;function unlock(){try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();ctx.resume();}catch(e){}}
function ring(){if(!ctx)return;const t=ctx.currentTime;[880,1174.66,880,1174.66].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;
  const s=t+i*.22;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(.32,s+.02);g.gain.exponentialRampToValueAtTime(.0001,s+.5);o.connect(g).connect(ctx.destination);o.start(s);o.stop(s+.55);});}
addEventListener('pointerdown',unlock,{once:true});

/* --- idle screen list --- */
const idl=document.getElementById('idle');const ia=document.createElement('div');ia.id='idleAlarms';if(idl)idl.appendChild(ia);
function renderIdle(){if(!idl)return;ia.innerHTML=alarms.slice(0,4).map(a=>`<div class="ia-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.2 1.6"/></svg><b>${fmt(a)}</b><span>${inMin(a)}</span></div>`).join('')+(alarms.length>4?`<div class="ia-more">+${alarms.length-4} more</div>`:'');}
/* --- state & render --- */
function render(){alarms.sort((a,b)=>a-b);save(alarms);renderIdle();
  const t=b.querySelector('.ab-t');t.textContent=alarms.length?fmt(alarms[0]):'';b.classList.toggle('has',!!alarms.length);
  const L=$('#asList');L.innerHTML=alarms.length?'':'<div class="as-empty">No alarms set</div>';
  alarms.forEach(a=>{const r=document.createElement('div');r.className='as-row';r.innerHTML=`<b>${fmt(a)}</b><span>${inMin(a)}</span><button aria-label="Remove">×</button>`;
    r.querySelector('button').onclick=()=>{alarms=alarms.filter(x=>x!==a);render();};L.appendChild(r);});}
function add(t,src){if(!t||t<Date.now()+20000){hint('Couldn’t get a time from that — try again',true);return;}
  alarms.push(t);render();hint(`Alarm set for ${fmt(t)} · ${inMin(t)}`);unlock();}
function hint(m,err){const h=$('#asHint');h.innerHTML=m;h.classList.toggle('err',!!err);}
setInterval(()=>{const now=Date.now();const due=alarms.filter(a=>a<=now);if(due.length){alarms=alarms.filter(a=>a>now);render();ringNow(due[0]);}
  else if(sh.classList.contains('on'))render();else if(idl&&idl.classList.contains('on'))renderIdle();},1000);
let ringInt=null,ringStop=null;
function ringNow(t){$('#afT').textContent=fmt(t);fire.classList.add('on');ring();clearInterval(ringInt);ringInt=setInterval(ring,2200);clearTimeout(ringStop);ringStop=setTimeout(stop,120000);}
function stop(){fire.classList.remove('on');clearInterval(ringInt);clearTimeout(ringStop);}
$('#afStop').onclick=stop;$('#afSnooze').onclick=()=>{stop();alarms.push(Date.now()+5*60000);render();};

/* --- open/close --- */
b.onclick=()=>{unlock();render();hint('Tap and say “in 10 minutes” or “at 17:30”<br><span>«σε 10 λεπτά» · «στις 5 και μισή» also work</span>');sh.classList.add('on');};
$('#asClose').onclick=()=>sh.classList.remove('on');sh.addEventListener('click',e=>{if(e.target===sh)sh.classList.remove('on')});
sh.querySelectorAll('.as-quick .chip').forEach(c=>c.onclick=()=>add(Date.now()+(+c.dataset.m)*60000));
$('#asSet').onclick=()=>{const v=$('#asTime').value;if(!v)return;const [h,m]=v.split(':').map(Number);const d=new Date();d.setHours(h,m,0,0);if(d<=Date.now())d.setDate(d.getDate()+1);add(+d);};

/* --- voice --- */
const NUM={zero:0,one:1,a:1,an:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30,forty:40,fortyfive:45,fifty:50,sixty:60,
 'ένα':1,'μία':1,'μια':1,'ένα':1,'δύο':2,'δυο':2,'τρία':3,'τρεις':3,'τέσσερα':4,'τέσσερις':4,'πέντε':5,'έξι':6,'εφτά':7,'επτά':7,'οχτώ':8,'οκτώ':8,'εννιά':9,'εννέα':9,'δέκα':10,'έντεκα':11,'δώδεκα':12,'δεκαπέντε':15,'είκοσι':20,'τριάντα':30,'σαράντα':40,'πενήντα':50,'εξήντα':60};
function norm(t){return t.toLowerCase().replace(/[.,!?]/g,' ').replace(/\b(\w+)\b/g,w=>NUM[w]!=null?NUM[w]:w).replace(/(^|\s)([α-ωάέήίόύώϊϋΐΰ]+)(?=\s|$)/g,(m,a,w)=>a+(NUM[w]!=null?NUM[w]:w)).replace(/\s+/g,' ').trim();}
function parse(raw){const low=raw.toLowerCase();const t=norm(raw);const now=new Date();
  // relative
  if(/(μισή ώρα|μισή ωρα|μισάωρο|half an hour|half hour)/.test(low))return +now+30*60000;
  if(/(τέταρτο|quarter)/.test(low)&&!/(και|past|to|παρά|στις|at)/.test(low))return +now+15*60000;
  let m=t.match(/(\d+)\s*(λεπ|min|m\b)/);let h=t.match(/(\d+)\s*(ώρ|ωρ|hour|hr|h\b)/);
  if((m||h)&&!/(στις|at)\s*\d/.test(t))return +now+((h?+h[1]*60:0)+(m?+m[1]:0))*60000;
  // absolute
  let a=t.match(/(?:στις|at|για τις|for)\s*(\d{1,2})(?:[:.\s](\d{2}))?/)||t.match(/^(\d{1,2})[:.](\d{2})$/);
  if(a){let H=+a[1],M=a[2]?+a[2]:0;if(/και μισή|και μισο|thirty|half past|:30/.test(t)&&!a[2])M=30;if(/και τέταρτο|quarter past/.test(t)&&!a[2])M=15;
    if(/παρά τέταρτο|quarter to/.test(t)&&!a[2]){H=H-1;M=45;}
    const pm=/(pm|μ\.?μ|απόγευμα|βράδυ)/.test(t),am=/(am|π\.?μ|πρωί)/.test(t);
    const c=[];if(pm&&H<12)c.push(H+12);else if(am&&H===12)c.push(0);else{c.push(H);if(H<12&&!am)c.push(H+12);}
    const opts=c.map(x=>{const d=new Date();d.setHours(x%24,M,0,0);if(d<=now)d.setDate(d.getDate()+1);return +d;});return Math.min(...opts);}
  return null;}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;const mic=$('#asMic');
if(!SR){mic.classList.add('off');mic.title='Voice not available here';}
let rec=null,listening=false;
mic.onclick=()=>{unlock();if(!SR){hint('Voice input isn’t available in this browser — use the buttons below',true);return;}
  if(listening){rec&&rec.stop();return;}
  rec=new SR();rec.lang='el-GR';rec.interimResults=true;rec.maxAlternatives=3;
  rec.onstart=()=>{listening=true;mic.classList.add('rec');hint('Listening…');};
  rec.onresult=e=>{const r=e.results[e.results.length-1];const txt=r[0].transcript;hint('“'+txt+'”');
    if(r.isFinal){let t=null;for(let i=0;i<r.length&&!t;i++)t=parse(r[i].transcript);if(t)add(t);else hint('“'+txt+'” — didn’t catch a time, try again',true);}};
  rec.onerror=e=>hint(e.error==='not-allowed'?'Allow microphone access for this page in Settings › Safari':'Didn’t hear that — try again',true);
  rec.onend=()=>{listening=false;mic.classList.remove('rec');};
  try{rec.start();}catch(e){}};
render();
})();
</script>
<style>
#alarmBtn{width:auto;min-width:42px;padding:0 11px;gap:6px;display:flex;align-items:center;justify-content:center}
#alarmBtn .ab-t{font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
#alarmBtn.has{color:#fff}
#alarmSheet{position:fixed;inset:0;z-index:26;background:rgba(10,8,8,.55);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s}
#alarmSheet.on{opacity:1;pointer-events:auto}
#alarmSheet .as-box{width:min(520px,92vw);height:auto;max-height:86vh}
.as-body{padding:22px;display:flex;flex-direction:column;align-items:center;gap:16px;overflow:auto}
.as-mic{width:92px;height:92px;border-radius:50%;display:grid;place-items:center;background:#f3eee9;color:#141110;box-shadow:0 12px 30px -10px rgba(0,0,0,.6);transition:transform .2s}
.as-mic svg{width:38px;height:38px}
.as-mic.rec{background:#ff6a3d;color:#fff;animation:mp 1.2s ease-in-out infinite}
.as-mic.off{opacity:.4}
@keyframes mp{50%{transform:scale(1.07)}}
.as-hint{text-align:center;color:rgba(243,238,233,.8);font-size:15px;line-height:1.5;min-height:46px}
.as-hint span{font-size:12.5px;color:rgba(243,238,233,.5)}
.as-hint.err{color:#ff9a7a}
.as-quick,.as-at{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.as-at input{font:inherit;font-size:16px;color:#f3eee9;background:#262626;border:0;border-radius:10px;padding:9px 12px;color-scheme:dark}
#asList{width:100%;display:flex;flex-direction:column;gap:6px}
.as-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;background:#262626}
.as-row b{font-family:Fraunces,Georgia,serif;font-weight:300;font-size:24px}
.as-row span{flex:1;color:rgba(243,238,233,.55);font-size:13px}
.as-row button{width:30px;height:30px;border-radius:50%;color:rgba(243,238,233,.6);font-size:18px}
.as-empty{text-align:center;color:rgba(243,238,233,.4);font-size:13px}
#alarmFire{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(60% 60% at 50% 45%,rgba(214,96,205,.35),transparent 70%),#0b0a0a;opacity:0;pointer-events:none;transition:opacity .4s}
#alarmFire.on{opacity:1;pointer-events:auto}
.af-ring{width:16px;height:16px;border-radius:50%;background:#ff6a3d;box-shadow:0 0 0 0 rgba(255,106,61,.6);animation:afp 1.4s ease-out infinite;margin-bottom:10px}
@keyframes afp{to{box-shadow:0 0 0 40px rgba(255,106,61,0)}}
.af-t{font-family:Fraunces,Georgia,serif;font-weight:300;font-size:150px;line-height:1;color:#f3eee9}
.af-l{font-size:18px;color:rgba(243,238,233,.6);letter-spacing:.04em}
.af-b{display:flex;gap:10px;margin-top:30px}
.af-b .chip{padding:14px 26px;font-size:16px}
#idleAlarms{margin-top:44px;display:flex;flex-direction:column;align-items:center;gap:10px}
.ia-row{display:flex;align-items:center;gap:12px;padding:10px 18px;border-radius:999px;background:rgba(255,255,255,.06);color:rgba(243,238,233,.85)}
.ia-row svg{width:18px;height:18px;opacity:.7}
.ia-row b{font-family:Fraunces,Georgia,serif;font-weight:300;font-size:26px;font-variant-numeric:tabular-nums}
.ia-row span{font-size:14px;color:rgba(243,238,233,.5)}
.ia-more{font-size:13px;color:rgba(243,238,233,.4)}
#idle.night #idleAlarms{opacity:.5}
</style>
