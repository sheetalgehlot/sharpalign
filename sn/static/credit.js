(async()=>{
const el=document.getElementById('app'),k=location.hash.slice(1),box=x=>'<div class="panel">'+x+'</div>',inr=n=>'₹'+n.toLocaleString('en-IN');
let d={};try{d=await (await fetch('/api/credit?k='+encodeURIComponent(k))).json()}catch(e){}
if(d.balance==null){el.innerHTML=box('<h1>Credit page not found</h1><p>Please use the link from your purchase email.</p>');return}
try{localStorage.setItem('sa_ck',k)}catch(e){}
const ln=location.origin+'/?ref='+d.code;
const hist=d.ledger.length?d.ledger.map(x=>'<p>'+new Date(x.t).toLocaleDateString('en-IN')+': '+(x.type==='earn'?'Earned '+inr(x.amt)+' from a friend’s purchase':x.type==='spend'?'Used '+inr(x.amt):'Adjustment '+x.amt)+'</p>').join(''):'<p>No activity yet.</p>';
el.innerHTML=box('<h1>My referral credit</h1><p class="pr big">'+inr(d.balance)+'</p><p>available now<br><span class="note">Pending (usable after '+d.hold+' days): '+inr(d.pending)+'</span></p><p>It is applied automatically at checkout on this device, up to '+d.max+'% of the price of each PDF.</p><p><a class="cta" href="/">Shop now</a></p>')
+box('<h2>Share and earn</h2><p>Friends get '+d.fd+'% off their first PDF. You earn '+d.cm+'% of what they pay.</p><label for="sl">Your share link</label><input id="sl" readonly value="'+ln+'"><p><a class="cta" href="https://wa.me/?text='+encodeURIComponent('I love these PDFs from Sharpalign: '+ln)+'">Share on WhatsApp</a></p>')
+box('<h2>History</h2>'+hist);
document.getElementById('sl').onclick=e=>e.target.select();
})();
