import {createHash} from 'node:crypto';
import {json,store,env,mail,P,catalog,bust,CFG,CP,rwp,rkey,rcode,mkToken,mkAdmin,isAdmin,passOkAsync,hashPw,same,PW_MIN,balance} from './_lib.mjs';
const SLUG=/^[a-z0-9-]{1,80}$/,CATS=['kids','cooking','journals','novels','trading'];
export default async (req,context)=>{
 const u=new URL(req.url),a=u.searchParams.get('a')||'',q=k=>u.searchParams.get(k)||'',s=store(),origin=u.origin;
 const g=async(k,d)=>(await s.get(k,{type:'json'}))||d,mark=async()=>{bust();};
 const all=async p=>{const o=[];for(const b of (await s.list({prefix:p})).blobs.slice(0,300))o.push([b.key,await g(b.key,null)]);return o;};
 const tries=async()=>{const ip=(context&&context.ip)||req.headers.get('x-nf-client-connection-ip')||'?',k='rl/a'+createHash('sha256').update(ip+new Date().toISOString().slice(0,13)).digest('hex').slice(0,22);return {k,c:((await s.get(k,{type:'json'}))||{c:0}).c};};
 const ck=(v)=>new Response('{"ok":true}',{headers:{'content-type':'application/json','set-cookie':'adm='+v+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+(v?43200:0)}});
 if(a==='health')return json({admin_password:env('ADMIN_PASSWORD').length>=6,password_source:(await s.get('adm/pw',{type:'json'}))?'saved in the admin page':env('ADMIN_PASSWORD').length>=6?'ADMIN_PASSWORD setting':env('TOKEN_SECRET').length>=16?'TOKEN_SECRET (fallback)':'none',token_secret:env('TOKEN_SECRET').length>=16,razorpay_keys:!!env('RAZORPAY_KEY_ID')&&!!env('RAZORPAY_KEY_SECRET'),razorpay_webhook_secret:!!env('RAZORPAY_WEBHOOK_SECRET'),email:!!env('BREVO_API_KEY')&&!!env('FROM_EMAIL'),export_key:env('EXPORT_KEY').length>=16,build_hook:!!env('BUILD_HOOK_URL'),diag:(()=>{const raw=String(Netlify.env.get('ADMIN_PASSWORD')??''),ks=typeof Netlify.env.toObject==='function'?Object.keys(Netlify.env.toObject()).filter(k=>/admin|pass/i.test(k)).map(k=>JSON.stringify(k)):[];return {deploy_context:(context&&context.deploy&&context.deploy.context)||'unknown',admin_or_pass_names_seen:ks,admin_value:raw===''?'EMPTY or not found':raw.length<6?'too short ('+raw.length+' characters)':'ok (6+ characters)',spaces_or_quotes_at_edges:raw!==raw.trim()||/^["']|["']$/.test(raw.trim())};})()});
 if(a==='login'&&req.method==='POST'){const b=await req.json().catch(()=>({}));
  if(env('TOKEN_SECRET').length<16)return json({error:'The server cannot see TOKEN_SECRET (missing or under 16 characters). Check it in Netlify, then deploy again.'},500);const rk=await tries(),saved=await s.get('adm/pw',{type:'json'});
  if(rk.c>=10)return json({error:'Too many wrong tries. Please wait an hour and try again.'},429);
  if(!(await passOkAsync(b.password))){await s.setJSON(rk.k,{c:rk.c+1});await new Promise(r=>setTimeout(r,1500));return json({error:saved?'Wrong password':'Wrong password. If you have not created one yet, use "Set or reset password" below.'},401);}return ck(mkAdmin());}
 if(a==='setpw'&&req.method==='POST'){const b=await req.json().catch(()=>({})),t=env('TOKEN_SECRET'),pw=String(b.password||'').trim(),rk=await tries();
  if(t.length<16)return json({error:'The server cannot see TOKEN_SECRET (missing or under 16 characters). Check it in Netlify, then deploy again.'},500);
  if(rk.c>=10)return json({error:'Too many wrong tries. Please wait an hour and try again.'},429);
  if(!same(String(b.key||'').trim(),t)){await s.setJSON(rk.k,{c:rk.c+1});await new Promise(r=>setTimeout(r,1500));return json({error:'That setup key is not right. It is the TOKEN_SECRET value from Netlify.'},401);}
  if(pw.length<PW_MIN)return json({error:'Use at least '+PW_MIN+' characters for the new password.'},400);
  await s.setJSON('adm/pw',hashPw(pw));return ck(mkAdmin());}
 if(a==='logout')return ck('');
 if(!isAdmin(req))return json({error:'login'},401);
 if(req.method!=='GET'&&req.headers.get('x-admin')!=='1')return json({error:'bad request'},400);
 const CAT=await catalog();
 if(a==='chpw'){const pw=String((await req.json().catch(()=>({}))).password||'').trim();if(pw.length<PW_MIN)return json({error:'Use at least '+PW_MIN+' characters.'},400);await s.setJSON('adm/pw',hashPw(pw));return json({ok:true});}
 if(a==='me')return json({ok:true,dirty:false});
 if(a==='orders'){const o=(await all('order/')).filter(x=>x[1]).map(([k,r])=>({oid:k.slice(6),email:r.email,title:CAT[r.slug]?.title||r.slug,t:r.t,dl:r.dl}));o.sort((x,y)=>y.t-x.t);return json({items:o.slice(0,100)});}
 if(a==='resend'){const b=await req.json(),r=await g('order/'+b.oid,null);if(!r)return json({error:'Order not found'},404);
  await mail(r.email,'Your PDF link: '+(CAT[r.slug]?.title||r.slug),`Here is your download link again:\n${origin}/thank-you/?t=${mkToken(b.oid,r.slug,Date.now())}\n\nThe link works for ${CFG.link_days} days.\n\nSharpalign`);return json({ok:true});}
 if(a==='resetdl'){const b=await req.json(),r=await g('order/'+b.oid,null);if(!r)return json({error:'Order not found'},404);r.dl=0;await s.setJSON('order/'+b.oid,r);return json({ok:true});}
 if(a==='credit'){const o=(await all('ref/')).filter(x=>x[1]).map(([k,r])=>{const [b,p]=balance(r);return {code:k.slice(4),email:r.email,avail:b,pending:p,earned:r.ledger.reduce((n,x)=>n+(x.type==='earn'?x.amt:0),0),refs:(r.refs||[]).length,unlock:r.unlock||null};});return json({items:o});}
 if(a==='adjust'){const b=await req.json(),k='ref/'+String(b.code).toUpperCase(),r=await g(k,null),amt=parseInt(b.amt);if(!r||!amt)return json({error:'Check the code and amount'},400);r.ledger.push({t:Date.now(),type:'adj',amt});await s.setJSON(k,r);return json({ok:true});}
 if(a==='unlock'){const b=await req.json(),k='ref/'+String(b.code).toUpperCase(),r=await g(k,null);if(!r)return json({error:'Not found'},404);if(b.on)r.unlock={t:Date.now(),until:Date.now()+((rwp()||[0,{}])[1].reward_days||7)*864e5};else delete r.unlock;await s.setJSON(k,r);return json({ok:true});}
 if(a==='waitlist'){return json({items:(await all('wl/')).filter(x=>x[1]).map(x=>x[1])});}
 if(a==='notify'){const b=await req.json(),cat=String(b.cat||'');if(!b.subject||!b.body)return json({error:'Write a subject and a message.'},400);let sent=0,left=0;
  for(const [k,e] of await all('wl/')){if(!e||!e.cats||!e.cats[cat]||(e.notified||{})[cat])continue;if(sent>=80){left++;continue;}
   await mail(e.email,String(b.subject).slice(0,150),String(b.body).slice(0,3000)+'\n\n--\nSharpalign. You get this because you asked to be notified. Reply STOP to unsubscribe.');e.notified={...(e.notified||{}),[cat]:Date.now()};await s.setJSON(k,e);sent++;}
  return json({ok:true,sent,left});}
 if(a==='ranking'){const lst=await all('ref/'),rows=[];for(const [k,r] of lst){if(!r)continue;const n=(r.refs||[]).length;if(n||r.top||r.founder)rows.push({code:k.slice(4),email:r.email,n,t:n?Math.max(...r.refs.map(x=>x.t)):0,founder:r.founder||0,top:r.top||''});}
  rows.sort((x,y)=>y.n-x.n||x.t-y.t);return json({items:rows.slice(0,150),members:lst.length,rankEnd:CP.rank_end||0,finalized:await g('meta/finalized',null),min:(CP.perks||{}).min_referrals||3});}
 if(a==='finalize'){const pk=CP.perks||{},min=pk.min_referrals||3,lst=await all('ref/');
  const rows=lst.filter(x=>x[1]&&(x[1].refs||[]).length>=min).map(([k,r])=>({k,r,n:r.refs.length,t:Math.max(...r.refs.map(x=>x.t))})).sort((x,y)=>y.n-x.n||x.t-y.t).slice(0,pk.top_vip||100);
  let i=0;for(const {k,r} of rows){i++;r.top=i<=(pk.top_free||10)?'top10':'top100';r.rank=i;await s.setJSON(k,r);
   await mail(r.email,'You made the Sharpalign Top '+(i<=(pk.top_free||10)?'10':'100')+'!','Congratulations! You finished at rank #'+i+' in our referral ranking.\n\nYour perks: '+pk.discount_pct+'% off any PDF, early access to new launches'+(r.top==='top10'?', and free access to new launches':'')+'. Open your private page to see them: '+origin+'/credit/#'+rkey(k.slice(4))+'\n\nWe will contact you about any prize.\n\nSharpalign');}
  await s.setJSON('meta/finalized',{t:Date.now(),count:rows.length});return json({ok:true,count:rows.length});}
 if(a==='reviews'){return json({items:(await all('rv/')).filter(x=>x[1]).map(([k,r])=>({oid:k.slice(3),title:CAT[r.slug]?.title||r.slug,...r,status:r.status||'pending'}))});}
 if(a==='reviewset'){const b=await req.json(),k='rv/'+b.oid,r=await g(k,null);if(!r)return json({error:'Not found'},404);r.status=['approved','rejected'].includes(b.status)?b.status:'pending';await s.setJSON(k,r);await mark();return json({ok:true});}
 if(a==='products'){return json({items:Object.entries(CAT).map(([sl,p])=>({slug:sl,title:p.title,cat:p.cat,price:p.price,source:p.source,pdf:!!p.pdf,cover:!!p.cover,rec:p.rec||null}))});}
 if(a==='save'){const b=await req.json(),title=String(b.title||'').trim().slice(0,120),cat=String(b.cat),price=parseInt(b.price);
  const slug=String(b.slug||'')||title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
  if(!title||!CATS.includes(cat)||!(price>0)||!SLUG.test(slug))return json({error:'Please fill title, section and price.'},400);
  const ap=await g('adm/products',[]),old=ap.find(x=>x.slug===slug);
  if(!b.slug&&(old||Object.hasOwn(CAT,slug)))return json({error:'A product with this title already exists.'},400);
  const rec={slug,cat,title,price,pages:parseInt(b.pages)||0,emoji:String(b.emoji||'📘').slice(0,4),color:/^#[0-9a-f]{6}$/i.test(b.color)?b.color:'#3b82f6',short:String(b.short||'').slice(0,160),desc:String(b.desc||'').slice(0,4000),added:old?.added||new Date().toISOString().slice(0,10)};
  await s.setJSON('adm/products',[...ap.filter(x=>x.slug!==slug),rec]);await mark();return json({slug});}
 if(a==='delete'){const sl=String((await req.json()).slug),ap=await g('adm/products',[]);await s.setJSON('adm/products',ap.filter(x=>x.slug!==sl));
  if(Object.hasOwn(P,sl)){const rm=await g('adm/removed',[]);if(!rm.includes(sl))await s.setJSON('adm/removed',[...rm,sl]);}await mark();return json({ok:true});}
 if(a==='chunk'){const sl=q('slug'),i=parseInt(q('i')),n=parseInt(q('n')),size=parseInt(q('size')),buf=await req.arrayBuffer();
  if(!SLUG.test(sl)||!(n>0&&n<=6)||!(i>=0&&i<n)||buf.byteLength>4.2e6)return json({error:'Bad upload (each PDF must be under about 18 MB)'},400);
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
