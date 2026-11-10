(()=>{
const g=k=>{try{return localStorage.getItem(k)||''}catch(e){return ''}},s=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const C=window.SA_CAMP,P=(C&&C.phases)||{},N=(C&&C.names)||{},inr=n=>'₹'+Number(n).toLocaleString('en-IN'),dt=ms=>new Date(ms).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
const st=(c,n=Date.now())=>{const f=P[c];return !f?'open':n<f.open?'soon':n<f.end?'launch':'after'};
const T=ms=>{const x=Math.max(0,Math.floor((ms-Date.now())/1e3)),d=Math.floor(x/86400),h=Math.floor(x%86400/3600),m=Math.floor(x%3600/60);return(d?d+'d ':'')+h+'h '+m+'m '+(x%60)+'s'};
let CUR='INR',PR={},CATM={},ready=false;const SYM={INR:'\u20B9',USD:'$',EUR:'\u20AC',GBP:'\u00A3'},r2=n=>Math.round(n*100)/100;
const money=(n,c)=>{c=c||CUR;return c==='INR'?inr(n):SYM[c]+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})};
const curFor=sl=>{const p=PR[sl]||{};return CUR==='INR'?'INR':p[CUR]>0?CUR:p.USD>0?'USD':'INR'};
const rtxt=f=>f.reward_price?inr(f.reward_price):f.reward_pct+'% off';
// a launch offer is only shown when it really lowers a price (no "399 each" on books that already cost less)
const useful=(c,f)=>{if(f.discount_pct||f.reward_pct||f.waitlist_required)return true;if(!ready)return false;return Object.keys(CATM).filter(k=>CATM[k]===c).some(k=>{const p=(PR[k]||{}).INR||0;return (f.launch_price&&p>f.launch_price)||(f.reward_price&&p>f.reward_price)})};
const offer=(f)=>{const t=[];if(f.launch_price)t.push(CUR==='INR'?inr(f.launch_price)+' each':'special launch prices');if(f.discount_pct)t.push(f.discount_pct+'% off'+(f.waitlist_required?' for waitlist members':''));return t.join(' · ')};
const rw=Object.entries(P).find(([c,f])=>f.reward_price||f.reward_pct);
const live=()=>Object.entries(P).filter(([c,f])=>f.end>f.open&&Date.now()>=f.open&&Date.now()<f.end&&useful(c,f)).sort((a,b)=>a[1].end-b[1].end)[0];
window.SA={C,inr,dt,money:(n,c)=>money(n,c),
 perks:d=>(d.founder?'<p class="offer">🏅 <b>Founding Customer #'+d.founder+'</b>: '+C.perks.discount_pct+'% off any PDF, early access to new launches, free updates in My Library.</p>':'')+(d.top?'<p class="offer">🏆 <b>'+(d.top==='top10'?'Top 10':'Top 100')+' referrer</b>: '+C.perks.discount_pct+'% off any PDF, early access'+(d.top==='top10'?', free new launches':'')+'.</p>':''),
 prog:d=>{if(!C)return '';
  if(d.unlock&&d.unlock.until>Date.now())return '<p class="offer">🏆 Unlocked! All '+d.cat+' books are '+(rw?rtxt(rw[1]):'')+' for you until '+dt(d.unlock.until)+'.</p>';
  let h='';if(d.on&&rw){const n=d.refs||0,need=d.need,pc=Math.min(100,Math.round(n/need*100));
   h+='<p><b>'+n+' of '+need+'</b> friends bought through your link. '+Math.max(0,need-n)+' more to unlock '+rtxt(rw[1])+' on all '+d.cat+' books.</p><div class="pbar"><div class="pfill" style="width:'+pc+'%"></div></div><p class="note">Offer ends in <b class="sa-t" data-to="'+d.until+'"></b></p>'}
  if(Date.now()<C.rank_end)h+='<p class="note">Total referrals: <b>'+(d.total||0)+'</b>. Leaderboard closes in <b class="sa-t" data-to="'+C.rank_end+'"></b>. <a href="/leaderboard/">See prizes</a></p>';return h},
 share:ln=>{const l=live(),m=(l?'Sharpalign '+N[l[0]]+' launch offer: '+offer(l[1])+' until '+dt(l[1].end)+'. ':'I love these PDFs from Sharpalign. ')+'My link: '+ln;
  return '<p><a class="cta" href="https://wa.me/?text='+encodeURIComponent(m)+'">WhatsApp</a> <a class="cta" href="https://t.me/share/url?url='+encodeURIComponent(ln)+'&text='+encodeURIComponent(m)+'">Telegram</a> <button class="cta" data-copy="'+m.replace(/"/g,'&quot;')+'">Copy message</button></p>'}};
document.addEventListener('click',e=>{const m=e.target.closest('[data-more]');if(m){const d=document.getElementById(m.dataset.more);if(d){d.classList.toggle('open');m.textContent=d.classList.contains('open')?'Show less':'Read more'}return}const b=e.target.closest('[data-copy]');if(b){try{navigator.clipboard.writeText(b.dataset.copy)}catch(x){}b.textContent='Copied ✓'}});
// ---- top bar + timers ----
const bar=document.createElement('div');bar.className='bar';let cur='';
const render=()=>{if(!C)return;const l=live(),nx=Object.entries(P).filter(([c,f])=>Date.now()<f.open).sort((a,b)=>a[1].open-b[1].open)[0];let h='';
 if(l){const[c,f]=l;h='🎉 <b>'+N[c]+' launch offer:</b> '+offer(f)+((f.reward_price||f.reward_pct)?' · refer '+C.unlock_referrals+' friends → '+(CUR==='INR'||f.reward_pct?rtxt(f):'a bigger discount'):'')+' · ends in <b class="sa-t" data-to="'+f.end+'"></b> · <a href="/'+c+'/">Shop</a>'}
 else if(nx){const[c,f]=nx;h='⏳ <b>'+N[c]+'</b> opens in <b class="sa-t" data-to="'+f.open+'"></b> · <a href="/'+c+'/">'+(f.waitlist_required?'Join the waitlist':'Get notified')+'</a>'}
 if(h!==cur){cur=h;if(h){bar.innerHTML=h;if(!bar.isConnected)document.body.prepend(bar)}else bar.remove()}
 document.querySelectorAll('.ph').forEach(e=>{const c=e.dataset.cat,f=P[c],x=st(c),k=e.dataset.s;if(k===x||!f)return;e.dataset.s=x;
  e.querySelector('.st').innerHTML=f.end<=f.open?'':x==='launch'?'🔴 Live now · ends in <b class="sa-t" data-to="'+f.end+'"></b>':x==='soon'?'⏳ Opens in <b class="sa-t" data-to="'+f.open+'"></b>':'Launch offer ended'});
 document.querySelectorAll('.sa-t[data-to]').forEach(e=>e.textContent=T(+e.dataset.to))};
if(C){render();setInterval(render,1000)}
// ---- cards ----
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decorate=()=>document.querySelectorAll('.pr[data-price]').forEach(e=>{const c=e.dataset.cat,f=P[c],x=st(c),p0=+e.dataset.price,card=e.closest('article'),sl=card?card.dataset.slug:'',cu=sl?curFor(sl):'INR';
 let v=p0;if(f&&x==='launch'&&!f.waitlist_required){if(f.launch_price)v=Math.min(v,f.launch_price);if(f.discount_pct)v=Math.min(v,Math.floor(p0*(100-f.discount_pct)/100))}
 if(f&&x==='soon'){const b=e.parentNode.querySelector('.buy');if(b)b.textContent='Opens '+dt(f.open)}
 const pc=cu==='INR'?p0:PR[sl][cu],fin=cu==='INR'?v:r2(pc*v/p0);
 e.innerHTML=fin<pc?money(fin,cu)+' <s>'+money(pc,cu)+'</s>':money(pc,cu)});
decorate();
// ---- currency: show each visitor their own currency ----
const geoP=fetch('/api/geo?cur='+g('sa_cur')).then(r=>r.json()).catch(()=>({currency:'INR'})),prodP=fetch('/api/products').then(r=>r.json()).catch(()=>({}));
const currencyPicker=gd=>{if(!gd.country||gd.country==='IN')return;const foot=document.querySelector('.foot .w');if(!foot||document.getElementById('cursel'))return;
 foot.insertAdjacentHTML('beforeend','<p class="note">Currency: <select id="cursel" style="width:auto;display:inline">'+['USD','EUR','GBP'].map(c=>'<option value="'+c+'"'+(c===CUR?' selected':'')+'>'+c+'</option>').join('')+'</select></p>');
 document.getElementById('cursel').onchange=e=>{s('sa_cur',e.target.value);location.reload()}};
Promise.all([geoP,prodP]).then(([gd,pd])=>{CUR=gd.currency||'INR';PR=pd.prices||{};CATM=pd.cats||{};ready=true;currencyPicker(gd);decorate();if(C)render()});
// ---- waitlist / notify forms ----
const cat=((document.body.className.match(/\bt-(\w+)/)||[])[1]),f0=P[cat],soonEl=document.getElementById('soon'),box=document.getElementById('buybox');
const wlForm=(c,f)=>'<form class="wl" data-cat="'+c+'"><label>'+(f.waitlist_required?'Join the waitlist. Only waitlist members get the launch price.':'Get an email when it opens')+'</label><input type="email" required placeholder="you@example.com" autocomplete="email"><input class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="cta" type="submit">'+(f.waitlist_required?'Join waitlist':'Notify me')+'</button><p class="note wm" role="status"></p></form>';
const gate=()=>{if(!soonEl||!f0)return;const x=st(cat);
 if(x==='soon'){soonEl.innerHTML='<div class="offer">🔒 <b>'+N[cat]+'</b> opens on '+dt(f0.open)+' · in <b class="sa-t" data-to="'+f0.open+'"></b>'+(f0.waitlist_required?'<br>🎁 Waitlist members get '+f0.discount_pct+'% off at launch. This offer will never return.':(f0.end>f0.open?'<br>🎁 Launch offer: '+offer(f0)+' for the first week, one time only.':''))+'</div>'+wlForm(cat,f0);if(box)box.hidden=true}
 else if(x==='launch'&&f0.waitlist_required)soonEl.innerHTML='<div class="offer">🎁 Waitlist launch price ends in <b class="sa-t" data-to="'+f0.end+'"></b>. It is only for people who joined the waitlist before launch.</div>';
 };
gate();
// products added in the admin page appear here instantly (no site rebuild)
const pcard=p=>{const h='/'+p.cat+'/'+p.slug+'/',img=p.cover?'<img src="/api/cover?slug='+p.slug+'" alt="Cover of '+esc(p.title)+'" loading="lazy" width="600" height="800">':'';
 return '<article class="card" data-slug="'+p.slug+'"><a class="cv'+(img?' img':'')+'" href="'+h+'" style="background:'+esc(p.color||'#3b82f6')+'" tabindex="-1">'+(img||esc(p.emoji||'📘')+'<small>'+esc(p.title)+'</small>')+'</a><h3><a href="'+h+'">'+esc(p.title)+'</a></h3><p>'+esc(p.short||'')+'</p><div class="row"><span class="pr" data-cat="'+p.cat+'" data-price="'+p.price+'">'+inr(p.price)+'</span><a class="buy" href="'+h+'">'+(p.pdf?'View PDF':'Coming soon')+'</a></div></article>'};
const grid=document.querySelector('#shop .grid')||document.querySelector('.tiles ~ .grid');
if(grid)prodP.then(d=>{if(!d.live)return;
 const here=cat&&cat!=='home'?cat:'',live=new Set(d.live||[]);
 grid.querySelectorAll('[data-slug]').forEach(a=>{const sl=a.dataset.slug;if(!live.has(sl)){a.remove();return}const f=(d.flags||{})[sl],b=a.querySelector('.buy');if(f&&f.pdf&&b&&/Coming soon/.test(b.textContent))b.textContent='View PDF'});
 const have=new Set([...grid.querySelectorAll('[data-slug]')].map(a=>a.dataset.slug));
 const fresh=(d.items||[]).filter(p=>!have.has(p.slug)&&(!here||p.cat===here)).sort((a,b)=>String(b.added).localeCompare(String(a.added)));
 if(fresh.length){fresh.forEach(p=>grid.insertAdjacentHTML(here?'beforeend':'afterbegin',pcard(p)));if(!here)while(grid.children.length>6)grid.lastElementChild.remove()}
 const none=document.querySelector('#shop > p.panel');if(none&&grid.children.length)none.remove();
 decorate()}).catch(()=>{});
// ---- bundle (buy more, pay less), free sample, inside pictures ----
const BD=window.SA_BUNDLE||{enabled:false,tiers:[]};
const cartGet=()=>{try{return JSON.parse(g('sa_cart')||'[]')}catch(e){return []}},cartSet=a=>s('sa_cart',JSON.stringify([...new Set(a)].slice(0,BD.max_items||10)));
const tierTxt=()=>['1 PDF: full price'].concat((BD.tiers||[]).map((t,i,a)=>t.items+(i===a.length-1?'+':'')+' PDFs: '+(100-t.pct)+'% off each')).join(' · ');
const cbar=document.createElement('a');cbar.className='cartbar';cbar.href='/cart/';
const cartRender=()=>{const n=cartGet().length;if(!BD.enabled||!n||location.pathname.indexOf('/cart')===0){cbar.remove();return}
 let pc=100;for(const t of BD.tiers)if(n>=t.items)pc=t.pct;const nx=BD.tiers.find(t=>t.items>n);
 cbar.innerHTML='🧺 <b>Bundle: '+n+' PDF'+(n>1?'s':'')+'</b>'+(pc<100?' · '+(100-pc)+'% off each':'')+(nx?' · add '+(nx.items-n)+' more for '+(100-nx.pct)+'% off':'')+' · <u>View bundle</u>';
 if(!cbar.isConnected)document.body.appendChild(cbar)};
cartRender();
const bb=document.getElementById('bundle'),bslug=(document.querySelector('[data-buy]')||{dataset:{}}).dataset.buy||'';
if(bb&&BD.enabled&&bslug){const draw=()=>{const inCart=cartGet().includes(bslug);bb.innerHTML='<div class="offer">🧺 <b>Bundle &amp; save:</b> '+tierTxt()+'</div><button class="cta ghost" id="addb" type="button">'+(inCart?'✓ In your bundle · View bundle':'＋ Add to bundle')+'</button>';
 document.getElementById('addb').onclick=()=>{if(cartGet().includes(bslug)){location.href='/cart/';return}cartSet([...cartGet(),bslug]);draw();cartRender()}};draw()}
const shopEl=document.getElementById('shop');
if(shopEl&&BD.enabled&&BD.tiers.length)shopEl.insertAdjacentHTML('afterbegin','<div class="offer">🧺 <b>Bundle &amp; save:</b> '+tierTxt()+'. Open any PDF and tap Add to bundle.</div>');
prodP.then(d=>{const f=(d.flags||{})[bslug];if(!f)return;
 const sm=document.getElementById('sample');if(sm&&f.sample)sm.hidden=false;
 const gal=document.getElementById('gal'),ins=document.getElementById('inside'),t0=(document.querySelector('h1')||{}).textContent||'';
 if(gal&&f.gallery&&f.gallery.length&&!gal.innerHTML.trim())gal.innerHTML=f.gallery.map((n,i)=>'<img src="/api/img?slug='+bslug+'&n='+n+'" alt="'+esc(t0+': inside page '+(i+1))+'" loading="lazy">').join('');
 if(ins&&gal&&gal.innerHTML.trim())ins.hidden=false});
document.addEventListener('click',e=>{const im=e.target.closest&&e.target.closest('.gal img');if(!im)return;const o=document.createElement('div');o.className='lbx';o.innerHTML='<img src="'+im.src+'" alt="'+esc(im.alt)+'"><span>✕</span>';o.onclick=()=>o.remove();document.body.appendChild(o)});
// ---- section bundle popup (price and timer are set in the admin page) ----
(async()=>{
 if(/^\/(thank-you|credit|cart)\//.test(location.pathname))return;
 let d;try{d=await (await fetch('/api/bundles?cur='+g('sa_cur'))).json()}catch(e){return}
 const list=(d.items||[]).filter(x=>!g('sa_bdbuy_'+x.id)&&(!x.ends||x.ends>Date.now()));
 if(!list.length)return;
 list.sort((x,y)=>((y.cat===cat)-(x.cat===cat))||((x.ends||9e15)-(y.ends||9e15)));
 const b=list[0],m=v=>money(v,b.currency);
 const html='<div class="bbox"><button class="bx" type="button" aria-label="Close">✕</button>'+(b.thumbs.length?'<div class="bthumbs">'+b.thumbs.map(u=>'<img src="'+esc(u)+'" alt="">').join('')+'</div>':'')
  +'<h3>'+esc(b.title)+'</h3><p>'+esc(b.text||('Get all '+b.count+' '+b.catName+' PDFs together'))+'</p>'
  +'<p class="bprice">'+(b.worth&&b.worth>b.price?'<s>'+m(b.worth)+'</s> ':'')+m(b.price)+'</p>'
  +'<p class="note">Includes '+b.count+' PDF'+(b.count>1?'s':'')+': '+b.titles.map(esc).join(', ')+(b.count>b.titles.length?' and '+(b.count-b.titles.length)+' more':'')+'</p>'
  +(b.ends?'<p class="offer">⏳ Offer ends in <b class="sa-t" data-to="'+b.ends+'"></b></p>':'')
  +'<input type="email" id="bem" placeholder="Your email for the download links" autocomplete="email" value="'+esc(g('sa_email'))+'"><button class="cta" id="bpay" type="button">Get all '+b.count+' PDFs · '+m(b.price)+'</button><p class="note" id="bmsg" role="status"></p></div>';
 let pop=null;const chip=document.createElement('button');chip.className='bchip';chip.type='button';chip.textContent='🎁 '+b.catName+' bundle '+m(b.price);
 const tick=()=>document.querySelectorAll('.sa-t[data-to]').forEach(e=>e.textContent=T(+e.dataset.to));
 const close=()=>{if(pop){pop.remove();pop=null}s('sa_bdx_'+b.id,String(Date.now()));if(!chip.isConnected)document.body.appendChild(chip)};
 const open=()=>{if(pop)return;chip.remove();pop=document.createElement('div');pop.className='bpop';pop.setAttribute('role','dialog');pop.innerHTML=html;document.body.appendChild(pop);
  pop.onclick=e=>{if(e.target===pop)close()};pop.querySelector('.bx').onclick=close;tick();
  pop.querySelector('#bpay').onclick=async()=>{const email=pop.querySelector('#bem').value.trim(),msg=pop.querySelector('#bmsg'),btn=pop.querySelector('#bpay');
   if(!/^\S+@\S+\.\S+$/.test(email)){msg.textContent='Enter a valid email so we can send your PDFs.';return}
   s('sa_email',email);btn.disabled=true;msg.textContent='Opening secure payment...';
   try{const o=await (await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bundle:b.id,email,ref:g('sa_ref'),ck:g('sa_ck'),cur:g('sa_cur')})})).json();
    if(!o.order_id)throw new Error(o.error||'Could not start payment.');
    if(!window.Razorpay)await new Promise((res,rej)=>{const sc=document.createElement('script');sc.src='https://checkout.razorpay.com/v1/checkout.js';sc.onload=res;sc.onerror=rej;document.head.appendChild(sc)});
    new Razorpay({key:o.key,amount:o.amount,currency:o.currency||'INR',order_id:o.order_id,name:'Sharpalign',description:o.title,prefill:{email},callback_url:o.callback,redirect:true,modal:{ondismiss:()=>{btn.disabled=false;msg.textContent=''}}}).open();
   }catch(err){msg.textContent=err.message;btn.disabled=false}}};
 chip.onclick=open;
 setInterval(()=>{tick();if(b.ends&&Date.now()>=b.ends){if(pop)pop.remove();chip.remove()}},1000);
 if(Date.now()-(+g('sa_bdx_'+b.id)||0)<8*36e5)document.body.appendChild(chip);else setTimeout(open,3500);
})();
document.addEventListener('submit',async e=>{const w=e.target.closest('.wl');if(!w)return;e.preventDefault();const m=w.querySelector('.wm'),b=w.querySelector('button');b.disabled=true;m.textContent='Saving…';
 try{const x=await (await fetch('/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:w.querySelector('input[type=email]').value,cat:w.dataset.cat,website:w.querySelector('.hp').value})})).json();
 if(x.ok)w.innerHTML='<p><b>You are on the list ✓</b> We will email you when it opens.</p>';else{m.textContent=x.error||'Could not save. Please try again.';b.disabled=false}}catch(y){m.textContent='Could not save. Please try again.';b.disabled=false}});
const r=new URLSearchParams(location.search).get('ref');if(r&&/^[A-Fa-f0-9]{8}$/.test(r))s('sa_ref',r.toUpperCase());
// ---- live reviews ----
const rl=document.getElementById('revlist');
if(rl)fetch('/api/reviews?slug='+encodeURIComponent(rl.dataset.slug)).then(r=>r.json()).then(d=>{if(d.items&&d.items.length)rl.innerHTML=d.items.map(x=>'<div class="rev"><span class="stars">'+'★'.repeat(x.rating)+'☆'.repeat(5-x.rating)+'</span> <b>'+esc(x.name)+'</b>'+(x.verified?' <small>Verified buyer</small>':'')+'<p>'+esc(x.text)+'</p></div>').join('')}).catch(()=>{});
// ---- review form ----
const rf=document.getElementById('rvf');
if(rf)rf.addEventListener('submit',async e=>{e.preventDefault();const m=document.getElementById('rvm'),b=rf.querySelector('button');b.disabled=true;m.textContent='Sending…';
 try{const x=await (await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:rf.dataset.slug,rating:document.getElementById('rvr').value,name:document.getElementById('rvn').value,text:document.getElementById('rvt').value,website:document.getElementById('rvw').value})})).json();
 if(x.ok)rf.innerHTML='<p>Thank you! Your review will appear after we check it.</p>';else{m.textContent=x.error||'Could not send. Please try again.';b.disabled=false}}catch(y){m.textContent='Could not send. Please try again.';b.disabled=false}});
// ---- join the referral club ----
const jf=document.getElementById('jf');
if(jf)jf.addEventListener('submit',async e=>{e.preventDefault();const m=document.getElementById('jm'),b=jf.querySelector('button');b.disabled=true;m.textContent='Sending…';
 try{const x=await (await fetch('/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('je').value,website:document.getElementById('jw').value})})).json();
 if(x.ok)jf.innerHTML='<p><b>Done!</b> We emailed your personal link. Check your inbox and spam folder.</p>';else{m.textContent=x.error||'Could not send. Please try again.';b.disabled=false}}catch(y){m.textContent='Could not send. Please try again.';b.disabled=false}});
// ---- buy button ----
const btn=document.querySelector('[data-buy]');if(!btn)return;
const msg=document.getElementById('msg'),slug=btn.dataset.buy,buyer=document.getElementById('buyer');
const load=email=>fetch('/api/quote?slug='+slug+'&ref='+g('sa_ref')+'&ck='+g('sa_ck')+'&cur='+g('sa_cur')+(email?'&email='+encodeURIComponent(email):'')).then(x=>x.json()).then(q=>{
 if(q.pay==null){if(box)box.hidden=true;if(bb)bb.hidden=true;if(soonEl)soonEl.innerHTML='<div class="offer">This PDF is no longer available.</div>';return}
 if(q.locked){if(box)box.hidden=true;if(bb)bb.hidden=true;return}
 if(!q.avail){if(box)box.hidden=true;if(bb)bb.hidden=true;if(soonEl&&st(cat)!=='soon')soonEl.innerHTML='<div class="offer">This PDF is coming soon.</div>';return}
 if(box)box.hidden=false;if(bb)bb.hidden=false;
 if(box&&st(cat)==='soon'){box.hidden=false;soonEl.innerHTML='<div class="offer">🏅 Early access for members: you can buy before the public launch.</div>'}
 const m=v=>money(v,q.currency||'INR');
 document.getElementById('price').innerHTML=q.pay<q.price?m(q.pay)+' <s>'+m(q.price)+'</s>':m(q.price);
 btn.textContent='Buy now · '+m(q.pay);
 let h='';
 if(q.tag==='reward')h+='<p class="offer">🏆 You unlocked '+m(q.base)+' for all '+cat+' books!</p>';
 else if(q.tag==='perk')h+='<p class="offer">🏅 Your VIP price: '+m(q.base)+' ('+C.perks.discount_pct+'% off).</p>';
 else if(q.tag==='launch')h+='<p class="offer">🎉 Launch price '+m(q.base)+(f0?' until '+dt(f0.end):'')+'.'+(rw&&cat===rw[0]?' <a href="/refer/">Refer '+C.unlock_referrals+' friends to get '+(q.currency==='INR'||rw[1].reward_pct?rtxt(rw[1]):'a bigger discount')+'</a>':'')+'</p>';
 if(q.wl)h+='<p class="offer">🔔 The launch price is for waitlist members who joined before launch. Enter the email you joined with to check.</p>';
 if(q.fd>0)h+='<p class="offer">🎁 Friend offer: you save '+m(q.fd)+' on your first purchase.</p>';
 if(q.credit>0)h+='<p class="offer">💳 Your referral credit of '+inr(q.credit)+' is applied at checkout.</p>';
 document.getElementById('offers').innerHTML=h}).catch(()=>{});
load('');buyer.addEventListener('change',()=>load(buyer.value.trim()));
btn.addEventListener('click',async()=>{
 const email=buyer.value.trim();
 if(!/^\S+@\S+\.\S+$/.test(email)){msg.textContent='Enter a valid email so we can send your PDF link.';return}
 btn.disabled=true;msg.textContent='Opening secure payment...';
 try{
  const o=await (await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,email,ref:g('sa_ref'),ck:g('sa_ck'),cur:g('sa_cur')})})).json();
  if(!o.order_id)throw new Error(o.error||'Could not start payment.');
  new Razorpay({key:o.key,amount:o.amount,currency:o.currency||'INR',order_id:o.order_id,name:'Sharpalign',description:o.title,prefill:{email},callback_url:o.callback,redirect:true,modal:{ondismiss:()=>{btn.disabled=false;msg.textContent=''}}}).open();
 }catch(e){msg.textContent=e.message;btn.disabled=false}
});})();
