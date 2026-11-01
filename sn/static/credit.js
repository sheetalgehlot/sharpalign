(async()=>{
const el=document.getElementById('app'),k=location.hash.slice(1),box=x=>'<div class="panel">'+x+'</div>',inr=n=>'₹'+Number(n).toLocaleString('en-IN'),S=window.SA,h=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let d={},lib={};try{[d,lib]=await Promise.all([fetch('/api/credit?k='+encodeURIComponent(k)).then(r=>r.json()),fetch('/api/library?k='+encodeURIComponent(k)).then(r=>r.json())])}catch(e){}
if(d.balance==null){el.innerHTML=box('<h1>Page not found</h1><p>Please use the link from your email.</p>');return}
try{localStorage.setItem('sa_ck',k)}catch(e){}
const ln=location.origin+'/?ref='+d.code;
const hist=d.ledger.length?d.ledger.map(x=>'<p>'+new Date(x.t).toLocaleDateString('en-IN')+': '+(x.type==='earn'?'Earned '+inr(x.amt)+' from a friend’s purchase':x.type==='spend'?'Used '+inr(x.amt):'Adjustment '+x.amt)+'</p>').join(''):'<p>No activity yet.</p>';
const libH=(lib.items&&lib.items.length)?lib.items.map(i=>'<p><b>'+h(i.title)+'</b> <a class="cta" href="/api/download?k='+encodeURIComponent(k)+'&slug='+encodeURIComponent(i.slug)+'">Download latest</a></p>').join(''):'<p>PDFs you buy will appear here. You can always download the newest version.</p>';
const rank=d.rank?'<p class="note">Your rank: <b>#'+d.rank+'</b> of '+d.ranked+' referrers · <a href="/leaderboard/">leaderboard and prizes</a></p>':'';
el.innerHTML=box('<h1>My Sharpalign page</h1>'+S.perks(d)+S.prog(d)+rank+'<p class="pr big">'+inr(d.balance)+'</p><p>store credit available now<br><span class="note">Pending (usable after '+d.hold+' days): '+inr(d.pending)+'</span></p><p>Credit is applied automatically at checkout on this device, up to '+d.max+'% of the price of each PDF.</p><p><a class="cta" href="/">Shop now</a></p>')
+box('<h2>My Library</h2>'+(lib.free?'<p class="note">As a Top 10 referrer you also get every new launch here.</p>':'')+libH+'<p class="note">Updated PDFs appear here automatically. Always download from here to get the newest version.</p>')
+box('<h2>Share and earn</h2><p>Friends get '+d.fd+'% off their first PDF. You earn '+d.cm+'% of what they pay.</p><label for="sl">Your share link</label><input id="sl" readonly value="'+h(ln)+'">'+S.share(ln))
+box('<h2>History</h2>'+hist);
document.getElementById('sl').onclick=e=>e.target.select();
})();
