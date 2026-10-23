(()=>{
const $=s=>document.querySelector(s),H=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),inr=n=>'₹'+Number(n).toLocaleString('en-IN');
const CATS=['kids','cooking','journals','novels','trading'];let tab='orders',target=null;
async function api(a,body,q,type){const o={headers:{'x-admin':'1'}};if(body!==undefined){o.method='POST';o.body=type?body:JSON.stringify(body);o.headers['content-type']=type||'application/json'}
 const r=await fetch('/api/admin?a='+a+(q||''),o);if(r.status===401&&a!=='login'){login();throw new Error('login')}return r.json()}
function login(){$('#nav').hidden=true;$('#bn').innerHTML='';$('#app').innerHTML='<div class="box"><h2>Log in</h2><input id="pw" type="password" placeholder="Admin password" autocomplete="current-password"><button id="go">Log in</button> <span id="lm" class="mu"></span></div>';
 const go=async()=>{const r=await api('login',{password:$('#pw').value});r.ok?start():$('#lm').textContent=r.error||'Failed'};$('#go').onclick=go;$('#pw').onkeydown=e=>{if(e.key==='Enter')go()}}
function banner(m){$('#bn').innerHTML=m.dirty?'<div class="warn">Changes are saved but not live yet. <button id="pub">Publish now</button> <span id="pm"></span></div>':'';
 if(m.dirty)$('#pub').onclick=async()=>{$('#pm').textContent='Publishing…';const r=await api('publish',{});$('#pm').textContent=r.ok?'Started. It goes live in about a minute.':(r.error||'Failed')}}
const refresh=()=>api('me').then(banner).catch(()=>{});
async function start(){await refresh();$('#nav').hidden=false;show(tab)}
function show(t){tab=t;document.querySelectorAll('#nav [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===t));({orders,products,reviews,credit})[t]()}
async function orders(){const r=await api('orders');$('#app').innerHTML=r.items.length?r.items.map(o=>`<div class="box"><b>${H(o.title)}</b><br>${H(o.email)}<br><small>${new Date(o.t).toLocaleString('en-IN')} · downloads used: ${o.dl} · ${H(o.oid)}</small><p><button class="g" data-a="resend" data-o="${H(o.oid)}">Resend email</button> <button class="g" data-a="resetdl" data-o="${H(o.oid)}">Reset downloads</button></p></div>`).join(''):'<p>No orders yet.</p>'}
async function reviews(){const r=await api('reviews');$('#app').innerHTML=r.items.length?r.items.map(v=>`<div class="box"><b>${H(v.title)}</b> <span class="chip ${v.status==='approved'?'ok':v.status==='rejected'?'no':''}">${H(v.status)}</span><br>${'★'.repeat(v.rating)}${'☆'.repeat(5-v.rating)} ${H(v.name)}<p>${H(v.text)}</p><button data-a="rv" data-s="approved" data-o="${H(v.oid)}">Approve</button> <button class="g" data-a="rv" data-s="rejected" data-o="${H(v.oid)}">Reject</button></div>`).join(''):'<p>No reviews yet.</p>'}
async function credit(){const r=await api('credit');$('#app').innerHTML=(r.items.length?r.items.map(c=>`<div class="box"><b>${H(c.code)}</b> ${H(c.email)}<br>Available ${inr(c.avail)} · Pending ${inr(c.pending)} · Earned ${inr(c.earned)}</div>`).join(''):'<p>No referral accounts yet.</p>')
 +'<div class="box"><h2>Adjust a balance</h2><p class="mu">Use a minus to deduct, for example -50 after a refund.</p><label>Referral code</label><input id="ac"><label>Amount in rupees</label><input id="aa" type="number"><button data-a="adj">Adjust</button> <span id="am" class="mu"></span></div>'}
async function products(){const r=await api('products');
 const rows=r.items.map(p=>`<div class="box"><b>${H(p.title)}</b> <small>${H(p.cat||'')} · ${inr(p.price)}</small><br><span class="chip ${p.pdf?'ok':'no'}">PDF ${p.pdf?'ready':'missing'}</span><span class="chip ${p.cover?'ok':''}">Cover ${p.cover?'uploaded':'none'}</span><span class="chip">${p.source==='file'?'from products.json':'admin'}</span>
 <p><button class="g" data-a="pick" data-k="pdf" data-s="${H(p.slug)}">Upload PDF</button> <button class="g" data-a="pick" data-k="cover" data-s="${H(p.slug)}">Upload cover</button>${p.rec?` <button class="g" data-a="edit" data-s="${H(p.slug)}">Edit</button>`:''} <button class="g r" data-a="del" data-s="${H(p.slug)}">Remove</button></p></div>`).join('');
 window._items=r.items;
 $('#app').innerHTML=`<div class="box"><h2 id="ft">Add a product</h2><form id="pf"><input type="hidden" name="slug">
 <label>Title</label><input name="title" required><label>Section</label><select name="cat">${CATS.map(c=>`<option>${c}</option>`).join('')}</select>
 <label>Price in rupees</label><input name="price" type="number" min="1" required><label>Number of pages</label><input name="pages" type="number" min="0">
 <label>Cover emoji (used when there is no cover image)</label><input name="emoji" maxlength="4" placeholder="📘"><label>Cover colour</label><input name="color" type="color" value="#3b82f6">
 <label>Short description (1–2 sentences, shown on Google)</label><input name="short" maxlength="160"><label>Full description</label><textarea name="desc" rows="5"></textarea>
 <label>Cover image (any picture, cropped to 600×800)</label><input id="cov" type="file" accept="image/*"><label>PDF file (up to about 24 MB)</label><input id="pdf" type="file" accept="application/pdf">
 <button>Save product</button> <span id="ps" class="mu"></span></form></div>${rows}<input id="fp" type="file" hidden>`;
 $('#pf').onsubmit=saveProduct}
async function coverJpeg(f){const im=await createImageBitmap(f),W=600,Ht=800,c=document.createElement('canvas');c.width=W;c.height=Ht;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,Ht);const s=Math.max(W/im.width,Ht/im.height),w=im.width*s,h=im.height*s;x.drawImage(im,(W-w)/2,(Ht-h)/2,w,h);return new Promise(r=>c.toBlob(r,'image/jpeg',.85))}
async function upCover(slug,f){const b=await (await coverJpeg(f)).arrayBuffer(),r=await api('cover',b,'&slug='+slug,'application/octet-stream');if(!r.ok)throw new Error(r.error||'cover failed')}
async function upPdf(slug,f,prog){const C=3*1024*1024,n=Math.ceil(f.size/C);if(n>8)throw new Error('PDF is too big (limit about 24 MB)');
 for(let i=0;i<n;i++){const b=await f.slice(i*C,(i+1)*C).arrayBuffer();let r,t=0;do{r=await api('chunk',b,`&slug=${slug}&i=${i}&n=${n}&size=${f.size}`,'application/octet-stream')}while(!r.ok&&++t<3);if(!r.ok)throw new Error(r.error||'upload failed');prog(Math.round((i+1)/n*100))}}
async function saveProduct(e){e.preventDefault();const d=Object.fromEntries(new FormData(e.target)),st=$('#ps');st.textContent='Saving…';
 const r=await api('save',{slug:d.slug,title:d.title,cat:d.cat,price:+d.price,pages:+d.pages||0,emoji:d.emoji,color:d.color,short:d.short,desc:d.desc});
 if(!r.slug){st.textContent=r.error||'Could not save';return}
 try{if($('#cov').files[0]){st.textContent='Uploading cover…';await upCover(r.slug,$('#cov').files[0])}if($('#pdf').files[0])await upPdf(r.slug,$('#pdf').files[0],p=>st.textContent='Uploading PDF '+p+'%')}catch(x){st.textContent='Upload problem: '+x.message;return}
 await refresh();products()}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.id==='lo'){await api('logout');login();return}
 if(b.dataset.t){show(b.dataset.t);return}
 const a=b.dataset.a;if(!a)return;const o=b.dataset.o,s=b.dataset.s;
 if(a==='resend'){b.textContent='Sending…';const r=await api('resend',{oid:o});b.textContent=r.ok?'Sent ✓':(r.error||'Failed')}
 if(a==='resetdl'){const r=await api('resetdl',{oid:o});b.textContent=r.ok?'Reset ✓':'Failed'}
 if(a==='rv'){await api('reviewset',{oid:o,status:b.dataset.s});await refresh();reviews()}
 if(a==='adj'){const r=await api('adjust',{code:$('#ac').value.trim(),amt:+$('#aa').value});if(r.ok)credit();else $('#am').textContent=r.error||'Failed'}
 if(a==='del'&&confirm('Remove this product from the shop? (PDF files are kept)')){await api('delete',{slug:s});await refresh();products()}
 if(a==='edit'){const p=window._items.find(x=>x.slug===s).rec,f=$('#pf');for(const k of['slug','title','cat','price','pages','emoji','color','short','desc'])f.elements[k].value=p[k]??'';$('#ft').textContent='Edit: '+p.title;scrollTo(0,0)}
 if(a==='pick'){target={k:b.dataset.k,s};const fp=$('#fp');fp.accept=b.dataset.k==='pdf'?'application/pdf':'image/*';fp.value='';fp.onchange=async()=>{const f=fp.files[0];if(!f)return;b.textContent='Uploading…';try{if(target.k==='pdf')await upPdf(target.s,f,p=>b.textContent='PDF '+p+'%');else await upCover(target.s,f)}catch(x){b.textContent='Failed: '+x.message;return}await refresh();products()};fp.click()}
});
start().catch(()=>{});
})();
