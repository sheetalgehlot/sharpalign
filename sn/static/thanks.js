(async()=>{
const el=document.getElementById('app'),q=new URLSearchParams(location.search),t=q.get('t');
const h=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),box=x=>'<div class="panel">'+x+'</div>';
if(!t){const e=q.get('e');el.innerHTML=box(e==='2'?'<h1>Payment received</h1><p>We are confirming it with the bank. Your PDF link will arrive by email within a few minutes.</p>':e?'<h1>Payment not completed</h1><p>No PDF was issued. If money was deducted, your bank or Razorpay will refund it, or contact us and we will help.</p><p><a class="cta" href="/">Back to the shop</a></p>':'<h1>Link not found</h1><p>Please use the link from your email.</p>');return}
let d={};try{d=await (await fetch('/api/order-info?t='+encodeURIComponent(t))).json()}catch(e){}
if(!d.title){el.innerHTML=box('<h1>Link expired</h1><p>Please contact us and we will help.</p>');return}
try{localStorage.setItem('sa_ck',d.key)}catch(e){}
const ln=location.origin+'/?ref='+d.code;
el.innerHTML=box('<h1>Thank you! Your PDF is ready</h1><p><b>'+h(d.title)+'</b></p><p><a class="cta" href="/api/download?t='+encodeURIComponent(t)+'">Download PDF</a></p><p class="note">We also emailed this link to you. It works for '+d.days+' days.</p>')
+box('<h2>Share and earn credit</h2><p>Friends get '+d.fd+'% off their first PDF. You earn '+d.cm+'% of what they pay, as store credit for your next purchase.</p><label for="sl">Your share link</label><input id="sl" readonly value="'+h(ln)+'"><p><a class="cta" href="https://wa.me/?text='+encodeURIComponent('I love these PDFs from Sharpalign: '+ln)+'">Share on WhatsApp</a></p><p><a href="/credit/#'+d.key+'">See my credit balance</a> <span class="note">(keep this link private)</span></p>')
+box('<h2>Rate this PDF</h2><div id="rv"><label for="rt">Stars</label><select id="rt"><option value="5">5 – Loved it</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select><label for="nm">Your name</label><input id="nm" maxlength="40"><label for="tx">Your review</label><textarea id="tx" rows="4" maxlength="600"></textarea><button class="cta" id="rb">Send review</button></div>');
document.getElementById('sl').onclick=e=>e.target.select();
document.getElementById('rb').onclick=async()=>{await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({t,rating:document.getElementById('rt').value,name:document.getElementById('nm').value,text:document.getElementById('tx').value})}).catch(()=>{});document.getElementById('rv').innerHTML='<p>Thank you! Your review will appear after we check it.</p>'};
})();
