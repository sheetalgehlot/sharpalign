import {json,keyCode,getRef,P} from './_lib.mjs';
// "My Library": every PDF a customer bought (always the newest version). Top-10 referrers also see every new launch.
export default async req=>{
 const c=keyCode(new URL(req.url).searchParams.get('k')||''),r=c?await getRef(c):null;
 if(!r)return json({error:'not found'},404);
 const sl=new Set((r.bought||[]).map(b=>b.slug)),free=r.top==='top10';
 if(free)for(const [k,p] of Object.entries(P))if(p.pdf)sl.add(k);
 return json({free,items:[...sl].filter(k=>P[k]).map(k=>({slug:k,title:P[k].title}))});
};
