import {createHash} from 'node:crypto';
import {json,store,wk,CP} from './_lib.mjs';
// "Notify me when it opens". For waitlist-only launches, joining BEFORE the launch is what qualifies for the launch price.
export default async (req,context)=>{
 if(req.method!=='POST')return json({error:'POST only'},405);
 const b=await req.json().catch(()=>({})),email=String(b.email||'').trim().toLowerCase(),cat=String(b.cat||'');
 if(b.website)return json({ok:true});
 if(!/^\S+@\S+\.\S+$/.test(email)||email.length>120)return json({error:'Please check your email address.'},400);
 if(!Object.hasOwn(CP.phases||{},cat))return json({error:'Unknown section'},400);
 const s=store(),ip=context?.ip||req.headers.get('x-nf-client-connection-ip')||'?',day=new Date().toISOString().slice(0,10);
 const rk='rl/w'+createHash('sha256').update(ip+day).digest('hex').slice(0,22),n=(await s.get(rk,{type:'json'}))||{c:0};
 if(n.c>=10)return json({error:'Too many tries today. Please try again tomorrow.'},429);
 await s.setJSON(rk,{c:n.c+1});
 const k=wk(email),e=(await s.get(k,{type:'json'}))||{email,cats:{}};
 if(!e.cats[cat])e.cats[cat]=Date.now();
 await s.setJSON(k,e);
 return json({ok:true});
};
