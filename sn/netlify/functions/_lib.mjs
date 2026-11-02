import {createHash,createHmac,timingSafeEqual,scryptSync,randomBytes} from 'node:crypto';
import {getStore} from '@netlify/blobs';
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
export const phase=c=>CP.enabled?(CP.phases||{})[c]||null:null;
export const stateOf=(c,n=Date.now())=>{const f=phase(c);return !f?'open':n<f.open?'soon':n<f.end?'launch':'after';};
export const rwp=()=>Object.entries(CP.phases||{}).find(([c,f])=>f.reward_price);
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
export async function quote(p,email,ref,ck){
 const now=Date.now(),f=phase(p.cat),cc=keyCode(ck),rk=cc?await getRef(cc):null,re=email?await getRef(rcode(email)):null;
 const perk=hasPerk(rk)||hasPerk(re),unl=unlockOn(rk)||unlockOn(re);
 const q={price:p.price,base:p.price,tag:'',fd:0,credit:0,ref:'',cr:'',pay:p.price,state:stateOf(p.cat,now),locked:false,wl:false};
 const early=((CP.perks||{}).early_hours||0)*36e5;
 if(q.state==='soon'){if(perk&&f&&now>=f.open-early)q.state='launch';else{q.locked=true;return q;}}
 let base=p.price,tag='';
 if(f&&q.state==='launch'){
  if(!f.waitlist_required||(email&&await onWaitlist(email,p.cat,f.open))){if(f.launch_price)base=Math.min(base,f.launch_price);if(f.discount_pct)base=Math.min(base,Math.floor(p.price*(100-f.discount_pct)/100));if(base<p.price)tag='launch';}
  else q.wl=true;}
 if(f&&f.reward_price&&unl&&f.reward_price<base){base=f.reward_price;tag='reward';}
 if(perk&&CP.perks){const v=Math.floor(p.price*(100-CP.perks.discount_pct)/100);if(v<base){base=v;tag='perk';}}
 q.base=base;q.tag=tag;
 const rr=await getRef(ref);
 if(rr&&(!email||(rr.email!==email.toLowerCase()&&!isBuyer(re)))){q.ref=ref;q.fd=Math.floor(base*CFG.friend_discount_pct/100);}
 if(rk){const c=Math.max(0,Math.min(balance(rk)[0],Math.floor((base-q.fd)*CFG.credit_max_pct/100)));if(c>0){q.credit=c;q.cr=cc;}}
 const floor=Math.ceil(p.price*(CP.min_pay_pct||0)/100);let pay=base-q.fd-q.credit;
 if(pay<floor){let need=floor-pay;const d=Math.min(need,q.credit);q.credit-=d;need-=d;if(need>0)q.fd-=Math.min(need,q.fd);if(q.credit===0)q.cr='';pay=base-q.fd-q.credit;}
 q.pay=Math.max(1,pay);return q;}
async function ledger(oid,em,o,n,origin){
 const s=store(),code=rcode(em),now=Date.now();let me=await getRef(code);
 if(!me||me.buyer===false){
  const rec=me||{email:em,ledger:[],refs:[]};rec.buyer=true;
  const m=(await s.get('meta/founders',{type:'json'}))||{n:0};
  if(CP.enabled&&!rec.founder&&m.n<((CP.perks||{}).founders||0)){m.n++;await s.setJSON('meta/founders',m);rec.founder=m.n;}
  me=rec;}
 me.bought=me.bought||[];if(n.slug&&!me.bought.some(b=>b.slug===n.slug))me.bought.push({slug:n.slug,oid,t:now});
 await s.setJSON('ref/'+code,me);
 const cr=parseInt(n.credit||0);
 if(cr>0&&n.cr){const r=await getRef(n.cr);if(r){r.ledger.push({t:now,type:'spend',amt:cr,order:oid});await s.setJSON('ref/'+n.cr,r);}}
 if(n.ref&&n.ref!==code){const r=await getRef(n.ref);if(r&&r.email!==em){
  const c=Math.floor(Math.floor((o.amount_paid||0)/100)*CFG.ref_commission_pct/100);
  if(c>0)r.ledger.push({t:now,type:'earn',amt:c,avail:now+CFG.hold_days*864e5,order:oid});
  let won=false;const w=rwp();
  if(seasonOn(now)){r.refs=r.refs||[];if(!r.refs.some(x=>x.email===em)){r.refs.push({t:now,order:oid,email:em});
   if(w&&!r.unlock&&now>=w[1].open&&now<w[1].end&&r.refs.filter(x=>x.t>=w[1].open&&x.t<w[1].end).length>=CP.unlock_referrals){r.unlock={t:now,until:now+(w[1].reward_days||7)*864e5};won=true;}}}
  await s.setJSON('ref/'+n.ref,r);
  if(won)await mail(r.email,'You unlocked ₹'+w[1].reward_price+' on all '+w[0]+' books!',`Congratulations! ${CP.unlock_referrals} friends bought through your link.\n\nFor the next ${w[1].reward_days||7} days every ${w[0]} book is just ₹${w[1].reward_price} for you.\nOpen your private page and shop: ${origin}/credit/#${rkey(n.ref)}\n\nThis is a one-time reward.\n\nSharpalign`);
 }}}
// Runs after a verified payment (browser return OR webhook). Safe to run twice.
export async function fulfil(oid,origin){
 const o=await rzp('GET','orders/'+encodeURIComponent(oid));
 if(o.status!=='paid')return null;
 const n=o.notes||{},p=product(n.slug||''),em=String(n.email||'').toLowerCase();
 if(!p||!em)return null;
 const tok=mkToken(oid,n.slug,(o.created_at||0)*1000),s=store(),k='order/'+oid;
 if(await s.get(k,{type:'json'}))return tok;
 const w=await s.setJSON(k,{slug:n.slug,email:em,t:Date.now(),dl:0},{onlyIfNew:true});
 if(w&&w.modified===false)return tok;
 await ledger(oid,em,o,n,origin);
 const code=rcode(em),rec=await getRef(code),fl=rec&&rec.founder?`\n\n🏅 You are Founding Customer #${rec.founder}: ${CP.perks.discount_pct}% off any PDF, early access to new launches and free updates to every PDF you buy (see My Library on your private page).`:'';
 await mail(em,'Your PDF: '+p.title,`Thank you for your purchase!\n\nDownload "${p.title}" here:\n${origin}/thank-you/?t=${tok}\n\nThe link works for ${CFG.link_days} days. Need help? Just reply to this email.${fl}\n\nShare Sharpalign and earn store credit: friends get ${CFG.friend_discount_pct}% off their first PDF and you earn ${CFG.ref_commission_pct}% of what they pay.\nYour share link: ${origin}/?ref=${code}\nYour credit page (keep private): ${origin}/credit/#${rkey(code)}\n\nSharpalign`);
 await mail(CFG.owner_email,'New sale: '+p.title,`${em} bought ${p.title} for Rs ${Math.floor((o.amount_paid||0)/100)}.\nOrder: ${oid}`);
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
