import {json,readToken,store,mail,product,CFG} from './_lib.mjs';
export default async req=>{
 if(req.method!=='POST')return json({error:'POST only'},405);
 const b=await req.json().catch(()=>({})),t=readToken(b.t);
 if(!t)return json({error:'Invalid link'},400);
 const s=store(),k='rv/'+t.o;
 if(await s.get(k,{type:'json'}))return json({ok:true});
 const rv={slug:t.s,name:String(b.name||'').trim().slice(0,40)||'Verified buyer',rating:Math.max(1,Math.min(5,parseInt(b.rating)||5)),text:String(b.text||'').trim().slice(0,600),date:new Date().toISOString().slice(0,10),verified:true,status:'pending'};
 await s.setJSON(k,rv);
 await mail(CFG.owner_email,'New review waiting: '+(product(t.s)?.title||t.s),'A new review is waiting for your approval. Open '+new URL(req.url).origin+'/admin/ > Reviews.');
 return json({ok:true});
};
