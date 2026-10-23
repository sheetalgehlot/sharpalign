(()=>{
const g=k=>{try{return localStorage.getItem(k)||''}catch(e){return ''}},s=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const r=new URLSearchParams(location.search).get('ref');if(r&&/^[A-Fa-f0-9]{8}$/.test(r))s('sa_ref',r.toUpperCase());
const btn=document.querySelector('[data-buy]');if(!btn)return;
const msg=document.getElementById('msg'),slug=btn.dataset.buy,inr=n=>'₹'+n.toLocaleString('en-IN');
fetch('/api/quote?slug='+slug+'&ref='+g('sa_ref')+'&ck='+g('sa_ck')).then(x=>x.json()).then(q=>{
 if(q.pay==null)return;
 if(q.pay<q.price)document.getElementById('price').innerHTML=inr(q.pay)+' <s>'+inr(q.price)+'</s>';
 btn.textContent='Buy now · '+inr(q.pay);
 let h='';if(q.fd>0)h+='<p class="offer">🎁 Friend offer: you save '+inr(q.fd)+' on your first purchase.</p>';
 if(q.credit>0)h+='<p class="offer">💳 Your referral credit of '+inr(q.credit)+' is applied at checkout.</p>';
 document.getElementById('offers').innerHTML=h;}).catch(()=>{});
btn.addEventListener('click',async()=>{
 const email=document.getElementById('buyer').value.trim();
 if(!/^\S+@\S+\.\S+$/.test(email)){msg.textContent='Enter a valid email so we can send your PDF link.';return}
 btn.disabled=true;msg.textContent='Opening secure payment...';
 try{
  const o=await (await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,email,ref:g('sa_ref'),ck:g('sa_ck')})})).json();
  if(!o.order_id)throw new Error(o.error||'Could not start payment.');
  new Razorpay({key:o.key,amount:o.amount,currency:'INR',order_id:o.order_id,name:'Sharpalign',description:o.title,prefill:{email},callback_url:o.callback,redirect:true,modal:{ondismiss:()=>{btn.disabled=false;msg.textContent=''}}}).open();
 }catch(e){msg.textContent=e.message;btn.disabled=false}
});})();
