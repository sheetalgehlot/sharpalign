import {createHash,createHmac,timingSafeEqual,scryptSync,randomBytes} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import {createReadStream,existsSync,statSync} from 'node:fs';
import {Readable} from 'node:stream';
import path from 'node:path';
import CFG from './_config.mjs';
import P from './_products.mjs';
export {CFG,P};
export const env=k=>String(Netlify.env.get(k)||'').trim().replace(/^["']+|["']+$/g,'').trim();
export const store=()=>getStore('sharpalign');
export const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const sec=()=>{const s=env('TOKEN_SECRET');if(s.length<16)throw new Error('Set TOKEN_SECRET (long random text) in Netlify');return s;};
const hmac=(k,m)=>createHmac('sha256',k).update(m).digest('hex');
const safe=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
export const product=s=>Object.hasOwn(P,s)?P[s]:null;
// Live product list = products built into the site + everything saved in the admin page. No rebuild needed.
let CATC=null,CATT=0;
export const bust=()=>{CATC=null;};
export async function catalog(){
 if(CATC&&Date.now()-CATT<15000)return CATC;
 const s=store(),g=async(k,d)=>(await s.get(k,{type:'json'}))||d;
 const [ap,pd,cv,rm,sm,gl]=await Promise.all([g('adm/products',[]),g('adm/pdfs',{}),g('adm/covers',{}),g('adm/removed',[]),g('adm/samples',{}),g('adm/gallery',{})]);
 const out={};
 for(const [k,v] of Object.entries(P)){if(rm.includes(k))continue;out[k]={...v,pdf:!!(v.pdf||pd[k]),cover:!!cv[k],source:'file',pdfmeta:pd[k]||null,sample:!!sm[k],gallery:gl[k]||[]};}
 for(const p of ap){const old=P[p.slug];out[p.slug]={title:p.title,price:p.price,prices:p.prices||{},img:old&&old.img,cat:p.cat,short:p.short,emoji:p.emoji,color:p.color,added:p.added,pdf:!!(pd[p.slug]||(old&&old.pdf)),cover:!!cv[p.slug],rec:p,source:'admin',pdfmeta:pd[p.slug]||null,sample:!!sm[p.slug],gallery:gl[p.slug]||[]};}
 CATC=out;CATT=Date.now();return out;}
export const productA=async s=>{const c=await catalog();return Object.hasOwn(c,s)?c[s]:null;};
export async function reviewsFor(slug){const s=store(),out=[];for(const b of (await s.list({prefix:'rv/'})).blobs){const r=await s.get(b.key,{type:'json'});if(r&&r.status==='approved'&&(!slug||r.slug===slug))out.push({slug:r.slug,name:r.name,rating:r.rating,text:r.text,date:r.date,verified:!!r.verified});}return out;}
export const rcode=em=>hmac(sec(),'c'+em.trim().toLowerCase()).slice(0,8).toUpperCase();
export const rkey=c=>c+hmac(sec(),'k'+c).slice(0,16);
export const keyCode=k=>{k=String(k||'');const c=k.slice(0,8);return /^[A-F0-9]{8}$/.test(c)&&safe(rkey(c),k)?c:'';};
export const mkToken=(oid,slug,created)=>{const p=Buffer.from(JSON.stringify({o:oid,s:slug,x:created+CFG.link_days*864e5})).toString('base64url');return p+'.'+hmac(sec(),p).slice(0,32);};
export const readToken=t=>{try{const [p,m]=String(t).split('.');if(!safe(hmac(sec(),p).slice(0,32),m))return null;const d=JSON.parse(Buffer.from(p,'base64url').toString());return d.x>Date.now()&&/^[a-z0-9-]+$/.test(d.s)?d:null;}catch{return null;}};
export const verifySig=(oid,pid,sig)=>safe(hmac(env('RAZORPAY_KEY_SECRET'),oid+'|'+pid),sig);
export const verifyWebhook=(raw,sig)=>safe(hmac(env('RAZORPAY_WEBHOOK_SECRET'),raw),sig);
export const rzp=async(m,path,body)=>{const r=await fetch('https://api.razorpay.com/v1/'+path,{method:m,headers:{'content-type':'application/json',authorization:'Basic '+Buffer.from(env('RAZORPAY_KEY_ID')+':'+env('RAZORPAY_KEY_SECRET')).toString('base64')},body:body?JSON.stringify(body):undefined});return r.json();};
export async function mail(to,subject,text){const k=env('BREVO_API_KEY');if(!k||!to)return;await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':k,'content-type':'application/json'},body:JSON.stringify({sender:{name:CFG.from_name,email:env('FROM_EMAIL')},to:[{email:to}],subject,textContent:text})}).catch(()=>{});}
export const getRef=async c=>/^[A-F0-9]{8}$/.test(c||'')?store().get('ref/'+c,{type:'json'}):null;
export const balance=r=>{const n=Date.now();let b=0,p=0;for(const x of r.ledger){if(x.type==='earn'){if(x.avail<=n)b+=x.amt;else p+=x.amt;}else if(x.type==='spend')b-=x.amt;else b+=x.amt;}return [b,p];};
export const CP=CFG.campaign||{};
export const BD=CFG.bundle||{enabled:false,tiers:[],max_items:10};
export const bundleLive=(b,n=Date.now())=>!!b&&b.active!==false&&(!b.starts||n>=b.starts)&&(!b.ends||n<b.ends);
// bundle: the more PDFs in one order, the lower the percentage of the price you pay for each
export const bundlePct=n=>{let p=100;if(BD.enabled)for(const t of BD.tiers||[])if(n>=t.items)p=t.pct;return p;};
export const phase=c=>CP.enabled?(CP.phases||{})[c]||null:null;
export const stateOf=(c,n=Date.now())=>{const f=phase(c);return !f?'open':n<f.open?'soon':n<f.end?'launch':'after';};
export const rwp=()=>Object.entries(CP.phases||{}).find(([c,f])=>f.reward_price||f.reward_pct);
export const unlockOn=(r,n=Date.now())=>!!(r&&r.unlock&&n<r.unlock.until);
export const isBuyer=r=>!!r&&r.buyer!==false;
export const hasPerk=r=>!!(r&&(r.founder||r.top));
export const seasonOn=(n=Date.now())=>!!CP.enabled&&n>=CP.start&&n<CP.rank_end;
export const mask=e=>{const l=String(e).split('@')[0];return l.slice(0,2)+'•••'+(l.length>3?l.slice(-1):'');};
export const wk=e=>'wl/'+createHash('sha256').update(String(e).trim().toLowerCase()).digest('hex').slice(0,32);
export async function onWaitlist(email,cat,before){const e=await store().get(wk(email),{type:'json'});return !!(e&&e.cats&&e.cats[cat]&&e.cats[cat]<before);}
export const prog=r=>{const w=rwp(),x=w?w[1]:null,now=Date.now(),rf=r.refs||[];return{refs:x?rf.filter(y=>y.t>=x.open&&y.t<x.end).length:0,total:rf.length,need:CP.unlock_referrals||5,unlock:r.unlock||null,on:!!x&&now>=x.open&&now<x.end,until:x?x.end:0,cat:w?w[0]:'',founder:r.founder||0,top:r.top||'',rankEnd:CP.rank_end||0};};
export async function board(force){
 const s=store(),c=force?null:await s.get('lb/cache',{type:'json'});if(c&&Date.now()-c.t<3e5)return c;
 const rows=[];let members=0;
 for(const b of (await s.list({prefix:'ref/'})).blobs){const r=await s.get(b.key,{type:'json'});if(!r)continue;members++;const n=(r.refs||[]).length;if(n)rows.push({code:b.key.slice(4),n,t:Math.max(...r.refs.map(x=>x.t)),mask:mask(r.email)});}
 rows.sort((a,b)=>b.n-a.n||a.t-b.t);const out={t:Date.now(),members,rows};await s.setJSON('lb/cache',out);return out;}
// ---- currencies: India pays rupees, UK pounds, euro countries euros, everyone else dollars ----
const EU=new Set('AT BE BG HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES'.split(' '));
export function currencyFor(country,req){const c=String(country||'').toUpperCase();if(!c||c==='IN')return 'INR';if(['USD','EUR','GBP'].includes(req))return req;if(c==='GB')return 'GBP';if(EU.has(c))return 'EUR';return 'USD';}
export function pickCurrency(p,country,req){const want=currencyFor(country,req),pr=p.prices||{};if(want==='INR')return 'INR';if(pr[want]>0)return want;if(pr.USD>0)return 'USD';return 'INR';}
const r2=n=>Math.round(n*100)/100;
export async function quote(p,email,ref,ck,opt={}){
 const now=Date.now(),f=phase(p.cat),cc=keyCode(ck),rk=cc?await getRef(cc):null,re=email?await getRef(rcode(email)):null;
 const cur=(opt.forceCur||pickCurrency(p,opt.country,opt.cur)),pc=cur==='INR'?p.price:p.prices[cur],ratio=pc/p.price,conv=v=>cur==='INR'?v:r2(v*ratio);
 const perk=hasPerk(rk)||hasPerk(re),unl=unlockOn(rk)||unlockOn(re);
 const q={price:pc,base:pc,tag:'',fd:0,credit:0,ref:'',cr:'',pay:pc,pay_inr:p.price,currency:cur,state:stateOf(p.cat,now),locked:false,wl:false,avail:!!p.pdf};
 const early=((CP.perks||{}).early_hours||0)*36e5;
 if(q.state==='soon'){if(perk&&f&&now>=f.open-early)q.state='launch';else{q.locked=true;return q;}}
 // all discount rules run in rupees; other currencies get the same percentage off their own price
 let base=p.price,tag='';
 if(f&&q.state==='launch'){
  if(!f.waitlist_required||(email&&await onWaitlist(email,p.cat,f.open))){if(f.launch_price)base=Math.min(base,f.launch_price);if(f.discount_pct)base=Math.min(base,Math.floor(p.price*(100-f.discount_pct)/100));if(base<p.price)tag='launch';}
  else q.wl=true;}
 if(f&&unl&&(f.reward_price||f.reward_pct)){const rv=Math.min(f.reward_price||Infinity,f.reward_pct?Math.floor(p.price*(100-f.reward_pct)/100):Infinity);if(rv<base){base=rv;tag='reward';}}
 if(perk&&CP.perks){const v=Math.floor(p.price*(100-CP.perks.discount_pct)/100);if(v<base){base=v;tag='perk';}}
 if(opt.bundlePct&&opt.bundlePct<100){const v=Math.floor(p.price*opt.bundlePct/100);if(v<base){base=v;tag='bundle';}}
 q.tag=tag;
 const rr=await getRef(ref);let fd=0,credit=0,crc='';
 if(rr&&(!email||(rr.email!==email.toLowerCase()&&!isBuyer(re)))){q.ref=ref;fd=Math.floor(base*CFG.friend_discount_pct/100);}
 if(rk&&cur==='INR'&&!opt.noCredit){const c=Math.max(0,Math.min(balance(rk)[0],Math.floor((base-fd)*CFG.credit_max_pct/100)));if(c>0){credit=c;crc=cc;}} // store credit is in rupees
 const floor=Math.ceil(p.price*(CP.min_pay_pct||0)/100);let pay=base-fd-credit;
 if(pay<floor){let need=floor-pay;const d=Math.min(need,credit);credit-=d;need-=d;if(need>0)fd-=Math.min(need,fd);if(credit===0)crc='';pay=base-fd-credit;}
 q.base=conv(base);q.fd=conv(fd);q.credit=credit;q.cr=crc;q.pay_inr=Math.max(1,pay);q.pay=cur==='INR'?Math.max(1,pay):Math.max(0.5,r2(pay*ratio));
 return q;}
async function ledger(oid,em,o,n,origin){
 const s=store(),code=rcode(em),now=Date.now();let me=await getRef(code);
 if(!me||me.buyer===false){
  const rec=me||{email:em,ledger:[],refs:[]};rec.buyer=true;
  const m=(await s.get('meta/founders',{type:'json'}))||{n:0};
  if(CP.enabled&&!rec.founder&&m.n<((CP.perks||{}).founders||0)){m.n++;await s.setJSON('meta/founders',m);rec.founder=m.n;}
  me=rec;}
 me.bought=me.bought||[];(n.slugs||[n.slug]).forEach(sl=>{if(sl&&!me.bought.some(b=>b.slug===sl))me.bought.push({slug:sl,oid,t:now});});
 await s.setJSON('ref/'+code,me);
 const cr=parseInt(n.credit||0);
 if(cr>0&&n.cr){const r=await getRef(n.cr);if(r){r.ledger.push({t:now,type:'spend',amt:cr,order:oid});await s.setJSON('ref/'+n.cr,r);}}
 if(n.ref&&n.ref!==code){const r=await getRef(n.ref);if(r&&r.email!==em){
  const inrAmt=parseInt(n.inr)||Math.floor((o.amount_paid||0)/100),c=Math.floor(inrAmt*CFG.ref_commission_pct/100); // rupee value of the sale, whatever currency was paid
  if(c>0)r.ledger.push({t:now,type:'earn',amt:c,avail:now+CFG.hold_days*864e5,order:oid});
  let won=false;const w=rwp();
  if(seasonOn(now)){r.refs=r.refs||[];if(!r.refs.some(x=>x.email===em)){r.refs.push({t:now,order:oid,email:em});
   if(w&&!r.unlock&&now>=w[1].open&&now<w[1].end&&r.refs.filter(x=>x.t>=w[1].open&&x.t<w[1].end).length>=CP.unlock_referrals){r.unlock={t:now,until:now+(w[1].reward_days||7)*864e5};won=true;}}}
  await s.setJSON('ref/'+n.ref,r);
  if(won)await mail(r.email,'You unlocked '+(w[1].reward_price?'₹'+w[1].reward_price:w[1].reward_pct+'% off')+' on all '+w[0]+' books!',`Congratulations! ${CP.unlock_referrals} friends bought through your link.\n\nFor the next ${w[1].reward_days||7} days every ${w[0]} book is ${w[1].reward_price?'just ₹'+w[1].reward_price:w[1].reward_pct+'% off'} for you.\nOpen your private page and shop: ${origin}/credit/#${rkey(n.ref)}\n\nThis is a one-time reward.\n\nSharpalign`);
 }}}
// Runs after a verified payment (browser return OR webhook). Safe to run twice.
export async function fulfil(oid,origin){
 const o=await rzp('GET','orders/'+encodeURIComponent(oid));
 if(o.status!=='paid')return null;
 const n=o.notes||{},em=String(n.email||'').toLowerCase(),cat=await catalog();
 let slugs=[n.slug];if(n.cid){const c=await store().get('cart/'+n.cid,{type:'json'});if(c&&Array.isArray(c.slugs))slugs=c.slugs;}
 slugs=slugs.filter(x=>x&&Object.hasOwn(cat,x));
 if(!slugs.length||!em)return null;
 n.slugs=slugs;n.slug=slugs[0];const p={title:slugs.map(x=>cat[x].title).join(', ')};
 const tok=mkToken(oid,n.slug,(o.created_at||0)*1000),s=store(),k='order/'+oid;
 if(await s.get(k,{type:'json'}))return tok;
 const w=await s.setJSON(k,{slug:slugs[0],slugs,bundle:n.bundle||'',email:em,t:Date.now(),dl:0,dls:{}},{onlyIfNew:true});
 if(w&&w.modified===false)return tok;
 await ledger(oid,em,o,n,origin);
 const code=rcode(em),rec=await getRef(code),fl=rec&&rec.founder?`\n\n🏅 You are Founding Customer #${rec.founder}: ${CP.perks.discount_pct}% off any PDF, early access to new launches and free updates to every PDF you buy (see My Library on your private page).`:'';
 await mail(em,(slugs.length>3?'Your '+slugs.length+' PDFs from Sharpalign':(slugs.length>1?'Your PDFs: ':'Your PDF: ')+p.title),`Thank you for your purchase!\n\nDownload ${slugs.length>1?'these '+slugs.length+' PDFs':'"'+p.title+'"'} here:\n${origin}/thank-you/?t=${tok}${slugs.length>1?'\n\nIncluded:\n'+slugs.map(x=>'- '+cat[x].title).join('\n'):''}\n\nThe link works for ${CFG.link_days} days. Need help? Just reply to this email.${fl}\n\nShare Sharpalign and earn store credit: friends get ${CFG.friend_discount_pct}% off their first PDF and you earn ${CFG.ref_commission_pct}% of what they pay.\nYour share link: ${origin}/?ref=${code}\nYour credit page (keep private): ${origin}/credit/#${rkey(code)}\n\nSharpalign`);
 await mail(CFG.owner_email,'New sale: '+p.title,`${em} bought ${p.title} for ${o.currency||'INR'} ${((o.amount_paid||0)/100).toFixed(2)}.\nOrder: ${oid}`);
 return tok;}
// ---- admin ----
export const mkAdmin=()=>{const p=Buffer.from(JSON.stringify({a:1,x:Date.now()+432e5})).toString('base64url');return p+'.'+hmac(sec(),'adm'+p).slice(0,32);};
export const isAdmin=req=>{try{const c=(req.headers.get('cookie')||'').match(/(?:^|; )adm=([^;]+)/);if(!c)return false;const [p,m]=c[1].split('.');return safe(hmac(sec(),'adm'+p).slice(0,32),m)&&JSON.parse(Buffer.from(p,'base64url').toString()).x>Date.now();}catch{return false;}};
export const PW_MIN=6;
export const same=(a,b)=>safe(hmac('cmp',String(a)),hmac('cmp',String(b)));
export const hashPw=(p,salt=randomBytes(16).toString('hex'))=>({salt,hash:scryptSync(String(p).trim(),salt,32).toString('hex')});
// Password order: 1) the one saved from the admin page, 2) the ADMIN_PASSWORD setting, 3) TOKEN_SECRET as a last resort.
export const passOk=p=>{const a=env('ADMIN_PASSWORD'),t=env('TOKEN_SECRET'),want=a.length>=PW_MIN?a:(t.length>=16?t:'');return want.length>=PW_MIN&&same(String(p).trim(),want);};
export async function passOkAsync(p){const saved=await store().get('adm/pw',{type:'json'});if(saved&&saved.salt)return safe(scryptSync(String(p).trim(),saved.salt,32).toString('hex'),saved.hash);return passOk(p);}

// Sends a PDF to the browser (from the admin upload, or from the files bundled with the site).
export async function servePdf(slug,s,count,inline,kind='pdf'){
 const H=len=>({'content-type':'application/pdf','content-disposition':`${inline?'inline':'attachment'}; filename="${slug}${kind==='sample'?'-sample':''}.pdf"`,'content-length':String(len),'x-robots-tag':'noindex','cache-control':'private, no-store'});
 const m=((await s.get(kind==='sample'?'adm/samples':'adm/pdfs',{type:'json'}))||{})[slug];
 if(m){await count();let i=0;
  return new Response(new ReadableStream({async pull(c){if(i>=m.parts){c.close();return;}const b=await s.get(`${kind==='sample'?'sample':'pdf'}/${slug}/${i++}`,{type:'arrayBuffer'});if(!b){c.error(new Error('missing part'));return;}c.enqueue(new Uint8Array(b));}}),{headers:H(m.size)});}
 if(kind==='sample')return new Response('No sample for this PDF yet.',{status:404});
 const file=slug+'.pdf',here=path.dirname(new URL(import.meta.url).pathname);
 const f=[path.join(process.env.LAMBDA_TASK_ROOT||'/var/task','private-pdfs',file),path.join(process.cwd(),'private-pdfs',file),path.join(here,'../../private-pdfs',file)].find(existsSync);
 if(!f)return new Response('File not found. Please contact us.',{status:404});
 await count();
 return new Response(Readable.toWeb(createReadStream(f)),{headers:H(statSync(f).size)});
}

// Price for a whole bundle (several PDFs in one order) in one currency.
export async function quoteCart(slugs,email,ref,ck,opt={}){
 const list=[...new Set((slugs||[]).map(String))].slice(0,BD.max_items||10);
 if(!list.length)return {error:'Your bundle is empty.'};
 const cat=await catalog(),prods=list.map(s=>Object.hasOwn(cat,s)?{slug:s,...cat[s]}:null);
 if(prods.some(x=>!x))return {error:'One of the PDFs is no longer available.',bad:list.filter(x=>!Object.hasOwn(cat,x))};
 const want=currencyFor(opt.country,opt.cur);
 const cur=want==='INR'?'INR':(prods.every(p=>(p.prices||{})[want]>0)?want:(prods.every(p=>(p.prices||{}).USD>0)?'USD':'INR'));
 const pct=bundlePct(list.length),qs=[];
 for(const p of prods)qs.push(await quote(p,email,ref,ck,{...opt,forceCur:cur,bundlePct:pct,noCredit:true}));
 if(qs.some(q=>q.locked))return {error:'One of the PDFs has not opened yet.',bad:list.filter((x,i)=>qs[i].locked)};
 if(qs.some(q=>!q.avail))return {error:'One of the PDFs is not available yet.',bad:list.filter((x,i)=>!qs[i].avail)};
 const totalInr=qs.reduce((a,q)=>a+q.pay_inr,0),cc=keyCode(ck),rk=cc?await getRef(cc):null;let credit=0,crc='';
 if(rk&&cur==='INR'){const fl=prods.reduce((a,p)=>a+Math.ceil(p.price*(CP.min_pay_pct||0)/100),0);credit=Math.max(0,Math.min(balance(rk)[0],Math.floor(totalInr*CFG.credit_max_pct/100),totalInr-fl));if(credit>0)crc=cc;}
 const totalCur=cur==='INR'?totalInr-credit:r2(qs.reduce((a,q)=>a+q.pay,0));
 return {currency:cur,pct,count:list.length,
  items:prods.map((p,i)=>({slug:p.slug,title:p.title,cat:p.cat,thumb:p.cover?'/api/cover?slug='+p.slug:(p.img?'/covers/'+p.img:''),emoji:p.emoji||'📘',color:p.color||'#3b82f6',price:qs[i].price,pay:qs[i].pay,tag:qs[i].tag})),
  regular:cur==='INR'?prods.reduce((a,p)=>a+p.price,0):r2(qs.reduce((a,q)=>a+q.price,0)),
  total:Math.max(cur==='INR'?1:0.5,totalCur),total_inr:Math.max(1,totalInr-credit),credit,cr:crc,ref:qs[0].ref};
}

// A section bundle: one fixed price (set in the admin page) for ALL PDFs of a section, for a limited time.
export async function bundleOffer(id,country,cur){
 const bl=(await store().get('adm/bundles',{type:'json'}))||[],b=bl.find(x=>x.id===id);
 if(!bundleLive(b))return {error:'This bundle offer is not available right now.'};
 const cat=await catalog(),items=Object.entries(cat).filter(([k,p])=>p.cat===b.cat&&p.pdf);
 if(!items.length)return {error:'There are no PDFs in this bundle yet.'};
 const want=currencyFor(country,cur);let c='INR';
 if(want!=='INR'&&b.prices){if(b.prices[want]>0)c=want;else if(b.prices.USD>0)c='USD';}
 const price=c==='INR'?b.price:b.prices[c];
 const worth=items.every(([k,p])=>c==='INR'||(p.prices||{})[c]>0)?r2(items.reduce((a,[k,p])=>a+(c==='INR'?p.price:p.prices[c]),0)):null;
 return {b,items,slugs:items.map(x=>x[0]),currency:c,price,worth,inr:b.price};
}
