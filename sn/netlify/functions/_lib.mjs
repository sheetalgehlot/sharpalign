import {createHmac,timingSafeEqual} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import CFG from './_config.mjs';
import P from './_products.mjs';
export {CFG,P};
export const env=k=>Netlify.env.get(k)||'';
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
export async function quote(p,email,ref,ck){
 const q={price:p.price,fd:0,credit:0,ref:'',cr:'',pay:0};
 const rr=await getRef(ref);
 if(rr&&(!email||(rr.email!==email.toLowerCase()&&!(await getRef(rcode(email)))))){q.ref=ref;q.fd=Math.floor(p.price*CFG.friend_discount_pct/100);}
 const cc=keyCode(ck),r=cc?await getRef(cc):null;
 if(r){const c=Math.max(0,Math.min(balance(r)[0],Math.floor((p.price-q.fd)*CFG.credit_max_pct/100)));if(c>0){q.credit=c;q.cr=cc;}}
 q.pay=p.price-q.fd-q.credit;return q;}
async function ledger(oid,em,o,n){
 const s=store(),code=rcode(em),now=Date.now();
 if(!(await getRef(code)))await s.setJSON('ref/'+code,{email:em,ledger:[]});
 const cr=parseInt(n.credit||0);
 if(cr>0&&n.cr){const r=await getRef(n.cr);if(r){r.ledger.push({t:now,type:'spend',amt:cr,order:oid});await s.setJSON('ref/'+n.cr,r);}}
 if(n.ref&&n.ref!==code){const r=await getRef(n.ref);if(r&&r.email!==em){const c=Math.floor(Math.floor((o.amount_paid||0)/100)*CFG.ref_commission_pct/100);if(c>0){r.ledger.push({t:now,type:'earn',amt:c,avail:now+CFG.hold_days*864e5,order:oid});await s.setJSON('ref/'+n.ref,r);}}}}
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
 await ledger(oid,em,o,n);
 const code=rcode(em);
 await mail(em,'Your PDF: '+p.title,`Thank you for your purchase!\n\nDownload "${p.title}" here:\n${origin}/thank-you/?t=${tok}\n\nThe link works for ${CFG.link_days} days. Need help? Just reply to this email.\n\nShare Sharpalign and earn store credit: friends get ${CFG.friend_discount_pct}% off their first PDF and you earn ${CFG.ref_commission_pct}% of what they pay.\nYour share link: ${origin}/?ref=${code}\nYour credit page (keep private): ${origin}/credit/#${rkey(code)}\n\nSharpalign`);
 await mail(CFG.owner_email,'New sale: '+p.title,`${em} bought ${p.title} for Rs ${Math.floor((o.amount_paid||0)/100)}.\nOrder: ${oid}`);
 return tok;}
// ---- admin ----
export const mkAdmin=()=>{const p=Buffer.from(JSON.stringify({a:1,x:Date.now()+432e5})).toString('base64url');return p+'.'+hmac(sec(),'adm'+p).slice(0,32);};
export const isAdmin=req=>{try{const c=(req.headers.get('cookie')||'').match(/(?:^|; )adm=([^;]+)/);if(!c)return false;const [p,m]=c[1].split('.');return safe(hmac(sec(),'adm'+p).slice(0,32),m)&&JSON.parse(Buffer.from(p,'base64url').toString()).x>Date.now();}catch{return false;}};
export const passOk=p=>{const a=env('ADMIN_PASSWORD');return a.length>=8&&safe(hmac('pw',String(p)),hmac('pw',a));};
