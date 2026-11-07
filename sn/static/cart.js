(async()=>{
const el=document.getElementById('app'),S=window.SA,BD=window.SA_BUNDLE||{tiers:[]},ls=k=>{try{return localStorage.getItem(k)||''}catch(e){return ''}};
const h=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),box=x=>'<div class="panel">'+x+'</div>';
const getC=()=>{try{return JSON.parse(ls('sa_cart')||'[]')}catch(e){return []}},setC=a=>{try{localStorage.setItem('sa_cart',JSON.stringify(a))}catch(e){}};
const post=(u,b)=>fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());
async function show(){
 const slugs=getC();
 if(!slugs.length){el.innerHTML=box('<h1>Your bundle is empty</h1><p>Add 2 or more PDFs and each one costs less.</p><p><a class="cta" href="/">Browse PDFs</a></p>');return}
 el.innerHTML=box('<p>Loading…</p>');
 const r=await post('/api/cartquote',{slugs,email:ls('sa_email'),ref:ls('sa_ref'),ck:ls('sa_ck'),cur:ls('sa_cur')}).catch(()=>({error:'Could not load your bundle. Please try again.'}));
 if(r.error){el.innerHTML=box('<h1>Your bundle</h1><p>'+h(r.error)+'</p>'+(r.bad&&r.bad.length?'<p><button class="cta" id="rmbad">Remove those PDFs</button></p>':'')+'<p><a href="/">Back to the shop</a></p>');const b=document.getElementById('rmbad');if(b)b.onclick=()=>{setC(getC().filter(x=>!r.bad.includes(x)));show()};return}
 const m=v=>S.money(v,r.currency),n=r.count,tiers=BD.tiers||[],nx=tiers.find(t=>t.items>n);
 const rows=r.items.map(i=>'<div class="line"><div><b>'+h(i.title)+'</b><br><small>'+(i.pay<i.price?'<s>'+m(i.price)+'</s> ':'')+m(i.pay)+'</small></div><button class="x g" data-rm="'+h(i.slug)+'">Remove</button></div>').join('');
 const tt=['<tr'+(n<(tiers[0]?tiers[0].items:2)?' class="on"':'')+'><td>1 PDF</td><td>Full price</td></tr>'].concat(tiers.map((t,k)=>'<tr'+(n>=t.items&&(!tiers[k+1]||n<tiers[k+1].items)?' class="on"':'')+'><td>'+t.items+(k===tiers.length-1?'+':'')+' PDFs</td><td>'+(100-t.pct)+'% off each</td></tr>')).join('');
 const save=r.regular-r.total;
 el.innerHTML=box('<h1>Your bundle ('+n+')</h1>'+rows)
 +box('<h2>Buy more, pay less</h2><table class="lb">'+tt+'</table>'+(nx?'<p class="offer">Add '+(nx.items-n)+' more PDF'+(nx.items-n>1?'s':'')+' to get '+(100-nx.pct)+'% off each. <a href="/">Browse PDFs</a></p>':'<p class="note">You have the biggest bundle discount.</p>'))
 +box('<p>Regular price: <s>'+m(r.regular)+'</s></p>'+(r.credit>0?'<p>Store credit used: '+S.inr(r.credit)+'</p>':'')+'<p class="pr big">'+m(r.total)+'</p>'+(save>0?'<p class="offer">You save '+m(save)+'</p>':'')+'<label for="em">Email for your download links</label><input id="em" type="email" autocomplete="email" placeholder="you@example.com" value="'+h(ls('sa_email'))+'"><button class="cta" id="pay" type="button">Pay '+m(r.total)+'</button><p id="msg" class="note" role="status"></p><p class="note">Secure payment by Razorpay. After paying you return here and every PDF downloads right away.</p>');
 el.onclick=e=>{const x=e.target.closest('[data-rm]');if(x){setC(getC().filter(v=>v!==x.dataset.rm));show()}};
 document.getElementById('pay').onclick=async()=>{const email=document.getElementById('em').value.trim(),msg=document.getElementById('msg'),btn=document.getElementById('pay');
  if(!/^\S+@\S+\.\S+$/.test(email)){msg.textContent='Enter a valid email so we can send your PDFs.';return}
  try{localStorage.setItem('sa_email',email)}catch(e){}
  btn.disabled=true;msg.textContent='Opening secure payment...';
  try{const o=await post('/api/create-order',{slugs:getC(),email,ref:ls('sa_ref'),ck:ls('sa_ck'),cur:ls('sa_cur')});if(!o.order_id)throw new Error(o.error||'Could not start payment.');
   new Razorpay({key:o.key,amount:o.amount,currency:o.currency||'INR',order_id:o.order_id,name:'Sharpalign',description:o.title,prefill:{email},callback_url:o.callback,redirect:true,modal:{ondismiss:()=>{btn.disabled=false;msg.textContent=''}}}).open()}catch(err){msg.textContent=err.message;btn.disabled=false}};
}
show();
})();
