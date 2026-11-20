<script>
/* Breathing: header button opens a full-screen exercise (all screen sizes) */
(()=>{const $=q=>document.querySelector(q);
const bb=document.createElement('button');bb.className='hbtn';bb.id='breathBtn';bb.setAttribute('aria-label','Breathe');
bb.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="6.6" opacity=".6"/><circle cx="12" cy="12" r="9.8" opacity=".3"/></svg>';
const hr=$('.hright');const ab=$('#alarmBtn')||$('#histBtn');hr.insertBefore(bb,ab);
const ov=document.createElement('div');ov.id='mBreath';ov.innerHTML='<button class="x" aria-label="Close">×</button><h2>Breathe</h2><p>One minute. In for 4, hold, out for 4.</p>';
document.body.appendChild(ov);const pc=$('#pChill');ov.appendChild(pc);
bb.onclick=()=>{ov.classList.add('on')};
ov.querySelector('.x').onclick=()=>{const b=$('#bStart');if(b&&/stop/i.test(b.textContent))b.click();ov.classList.remove('on')};
})();
</script>
