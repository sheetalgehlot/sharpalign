import {createHash,randomBytes} from 'node:crypto';
import {json,readToken,store,mail,productA,CFG} from './_lib.mjs';
// Anyone can send a review from a PDF page (shown as "not verified"). Buyers who use their download link are "Verified buyer".
// Every review waits for your approval in the admin page.
export default async (req,context)=>{
 if(req.method!=='POST')return json({error:'POST only'},405);
 const b=await req.json().catch(()=>({})),s=store();
 if(b.website)return json({ok:true});
 const cl=(x,n)=>String(x||'').trim().slice(0,n);
 const rv={name:cl(b.name,40)||'Reader',rating:Math.max(1,Math.min(5,parseInt(b.rating)||5)),text:cl(b.text,600),date:new Date().toISOString().slice(0,10),status:'pending'};
 if(rv.text.length<3)return json({error:'Please write a few words.'},400);
 let k;
 if(b.t){const t=readToken(b.t);if(!t)return json({error:'Invalid link'},400);k='rv/'+t.o;if(await s.get(k,{type:'json'}))return json({ok:true});rv.slug=t.s;rv.verified=true;}
 else{
  if(!(await productA(String(b.slug||''))))return json({error:'Unknown PDF'},404);
  const ip=context?.ip||req.headers.get('x-nf-client-connection-ip')||'?',rk='rl/'+createHash('sha256').update(ip+rv.date).digest('hex').slice(0,24),n=(await s.get(rk,{type:'json'}))||{c:0};
  if(n.c>=3)return json({error:'Too many reviews today. Please try again tomorrow.'},429);
  await s.setJSON(rk,{c:n.c+1});
  rv.slug=b.slug;rv.verified=false;k='rv/p-'+randomBytes(8).toString('hex');
 }
 await s.setJSON(k,rv);
 await mail(CFG.owner_email,'New review waiting: '+((await productA(rv.slug))?.title||rv.slug),'A new review is waiting for your approval. Open '+new URL(req.url).origin+'/'+CFG.admin_path+'/ > Reviews.');
 return json({ok:true});
};
