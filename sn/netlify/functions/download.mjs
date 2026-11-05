import {readToken,store,keyCode,getRef,catalog,servePdf,CFG} from './_lib.mjs';
export default async req=>{
 const u=new URL(req.url).searchParams,s=store();
 if(u.get('k')){ // My Library: any time, always the latest version
  const c=keyCode(u.get('k')),r=c?await getRef(c):null,sl=String(u.get('slug')||'');
  const cat=await catalog(),ok=r&&/^[a-z0-9-]+$/.test(sl)&&((r.bought||[]).some(b=>b.slug===sl)||(r.top==='top10'&&cat[sl]&&cat[sl].pdf));
  if(!ok)return new Response('Not available for this account.',{status:403});
  return servePdf(sl,s,async()=>{});
 }
 const t=readToken(u.get('t')||'');
 if(!t)return new Response('This link has expired. Please contact us and we will help.',{status:410});
 const k='order/'+t.o,r=await s.get(k,{type:'json'});
 if(!r||r.dl>=CFG.max_downloads)return new Response('Download limit reached. Please open My Library on your private page, or contact us.',{status:410});
 return servePdf(t.s,s,async()=>{r.dl++;await s.setJSON(k,r);});
};
