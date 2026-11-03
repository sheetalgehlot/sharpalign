import {json,keyCode,getRef,catalog} from './_lib.mjs';
// "My Library": every PDF a customer bought (always the newest version). Top-10 referrers also see every new launch.
export default async req=>{
 const c=keyCode(new URL(req.url).searchParams.get('k')||''),r=c?await getRef(c):null;
 if(!r)return json({error:'not found'},404);
 const cat=await catalog(),sl=new Set((r.bought||[]).map(b=>b.slug)),free=r.top==='top10';
 if(free)for(const [k,p] of Object.entries(cat))if(p.pdf)sl.add(k);
 return json({free,items:[...sl].filter(k=>cat[k]).map(k=>({slug:k,title:cat[k].title}))});
};
