import {json,store,env,mail,P,CFG,rkey,rcode,mkToken,mkAdmin,isAdmin,passOk,balance} from './_lib.mjs';
const SLUG=/^[a-z0-9-]{1,80}$/,CATS=['kids','cooking','journals','novels','trading'];
export default async req=>{
 const u=new URL(req.url),a=u.searchParams.get('a')||'',q=k=>u.searchParams.get(k)||'',s=store(),origin=u.origin;
 const g=async(k,d)=>(await s.get(k,{type:'json'}))||d,mark=()=>s.setJSON('adm/dirty',{v:true});
 const all=async p=>{const o=[];for(const b of (await s.list({prefix:p})).blobs.slice(0,300))o.push([b.key,await g(b.key,null)]);return o;};
 const ck=(v)=>new Response('{"ok":true}',{headers:{'content-type':'application/json','set-cookie':'adm='+v+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+(v?43200:0)}});
 if(a==='login'&&req.method==='POST'){const b=await req.json().catch(()=>({}));if(!passOk(b.password)){await new Promise(r=>setTimeout(r,1500));return json({error:'Wrong password'},401);}return ck(mkAdmin());}
 if(a==='logout')return ck('');
 if(!isAdmin(req))return json({error:'login'},401);
 if(req.method!=='GET'&&req.headers.get('x-admin')!=='1')return json({error:'bad request'},400);
 if(a==='me')return json({ok:true,dirty:!!(await g('adm/dirty',null))?.v});
 if(a==='orders'){const o=(await all('order/')).filter(x=>x[1]).map(([k,r])=>({oid:k.slice(6),email:r.email,title:P[r.slug]?.title||r.slug,t:r.t,dl:r.dl}));o.sort((x,y)=>y.t-x.t);return json({items:o.slice(0,100)});}
 if(a==='resend'){const b=await req.json(),r=await g('order/'+b.oid,null);if(!r)return json({error:'Order not found'},404);
  await mail(r.email,'Your PDF link: '+(P[r.slug]?.title||r.slug),`Here is your download link again:\n${origin}/thank-you/?t=${mkToken(b.oid,r.slug,Date.now())}\n\nThe link works for ${CFG.link_days} days.\n\nSharpalign`);return json({ok:true});}
 if(a==='resetdl'){const b=await req.json(),r=await g('order/'+b.oid,null);if(!r)return json({error:'Order not found'},404);r.dl=0;await s.setJSON('order/'+b.oid,r);return json({ok:true});}
 if(a==='credit'){const o=(await all('ref/')).filter(x=>x[1]).map(([k,r])=>{const [b,p]=balance(r);return {code:k.slice(4),email:r.email,avail:b,pending:p,earned:r.ledger.reduce((n,x)=>n+(x.type==='earn'?x.amt:0),0)};});return json({items:o});}
 if(a==='adjust'){const b=await req.json(),k='ref/'+String(b.code).toUpperCase(),r=await g(k,null),amt=parseInt(b.amt);if(!r||!amt)return json({error:'Check the code and amount'},400);r.ledger.push({t:Date.now(),type:'adj',amt});await s.setJSON(k,r);return json({ok:true});}
 if(a==='reviews'){return json({items:(await all('rv/')).filter(x=>x[1]).map(([k,r])=>({oid:k.slice(3),title:P[r.slug]?.title||r.slug,...r,status:r.status||'pending'}))});}
 if(a==='reviewset'){const b=await req.json(),k='rv/'+b.oid,r=await g(k,null);if(!r)return json({error:'Not found'},404);r.status=['approved','rejected'].includes(b.status)?b.status:'pending';await s.setJSON(k,r);await mark();return json({ok:true});}
 if(a==='products'){const ap=await g('adm/products',[]),pd=await g('adm/pdfs',{}),cv=await g('adm/covers',{}),rm=await g('adm/removed',[]),seen=new Set(),items=[];
  for(const p of ap){seen.add(p.slug);items.push({slug:p.slug,title:p.title,cat:p.cat,price:p.price,source:'admin',pdf:!!pd[p.slug],cover:!!cv[p.slug],rec:p});}
  for(const [sl,p] of Object.entries(P)){if(seen.has(sl)||rm.includes(sl))continue;items.push({slug:sl,title:p.title,price:p.price,source:'file',pdf:!!pd[sl]||p.pdf,cover:!!cv[sl]});}
  return json({items});}
 if(a==='save'){const b=await req.json(),title=String(b.title||'').trim().slice(0,120),cat=String(b.cat),price=parseInt(b.price);
  const slug=String(b.slug||'')||title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
  if(!title||!CATS.includes(cat)||!(price>0)||!SLUG.test(slug))return json({error:'Please fill title, section and price.'},400);
  const ap=await g('adm/products',[]),old=ap.find(x=>x.slug===slug);
  if(!b.slug&&(old||Object.hasOwn(P,slug)))return json({error:'A product with this title already exists.'},400);
  const rec={slug,cat,title,price,pages:parseInt(b.pages)||0,emoji:String(b.emoji||'📘').slice(0,4),color:/^#[0-9a-f]{6}$/i.test(b.color)?b.color:'#3b82f6',short:String(b.short||'').slice(0,160),desc:String(b.desc||'').slice(0,4000),added:old?.added||new Date().toISOString().slice(0,10)};
  await s.setJSON('adm/products',[...ap.filter(x=>x.slug!==slug),rec]);await mark();return json({slug});}
 if(a==='delete'){const sl=String((await req.json()).slug),ap=await g('adm/products',[]);await s.setJSON('adm/products',ap.filter(x=>x.slug!==sl));
  if(Object.hasOwn(P,sl)){const rm=await g('adm/removed',[]);if(!rm.includes(sl))await s.setJSON('adm/removed',[...rm,sl]);}await mark();return json({ok:true});}
 if(a==='chunk'){const sl=q('slug'),i=parseInt(q('i')),n=parseInt(q('n')),size=parseInt(q('size')),buf=await req.arrayBuffer();
  if(!SLUG.test(sl)||!(n>0&&n<=8)||!(i>=0&&i<n)||buf.byteLength>4.2e6)return json({error:'Bad upload (PDF must be under about 24 MB)'},400);
  if(i===0&&Buffer.from(buf.slice(0,5)).toString()!=='%PDF-')return json({error:'That file is not a PDF'},400);
  await s.set(`pdf/${sl}/${i}`,buf);
  if(i===n-1){const pd=await g('adm/pdfs',{});pd[sl]={parts:n,size,t:Date.now()};await s.setJSON('adm/pdfs',pd);await mark();}
  return json({ok:true});}
 if(a==='cover'){const sl=q('slug'),buf=await req.arrayBuffer(),b=Buffer.from(buf);
  if(!SLUG.test(sl)||buf.byteLength>9e5||b[0]!==0xFF||b[1]!==0xD8)return json({error:'Cover must be a JPEG under 900 KB'},400);
  await s.set('cover/'+sl,buf);const cv=await g('adm/covers',{});cv[sl]=1;await s.setJSON('adm/covers',cv);await mark();return json({ok:true});}
 if(a==='publish'){const h=env('BUILD_HOOK_URL');if(!h)return json({error:'BUILD_HOOK_URL is not set. In Netlify, open Deploys and press Trigger deploy instead.'},400);
  const r=await fetch(h,{method:'POST'});if(!r.ok)return json({error:'Netlify refused the publish request'},502);await s.setJSON('adm/dirty',{v:false});return json({ok:true});}
 return json({error:'unknown'},404);
};
