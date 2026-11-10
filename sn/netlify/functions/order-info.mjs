import {json,readToken,store,catalog,rcode,rkey,getRef,prog,CFG} from './_lib.mjs';
export default async req=>{
 const t=readToken(new URL(req.url).searchParams.get('t')||''),r=t?await store().get('order/'+t.o,{type:'json'}):null,cat=await catalog();
 const items=r?(r.slugs||[r.slug]).filter(x=>cat[x]).map(x=>({slug:x,title:cat[x].title})):[];
 if(!items.length)return json({error:'expired'},404);
 const code=rcode(r.email),rr=(await getRef(code))||{};
 return json({title:items.length>3?items.length+' PDFs':items.map(i=>i.title).join(', '),bundle:r.bundle||'',items,code,key:rkey(code),days:CFG.link_days,fd:CFG.friend_discount_pct,cm:CFG.ref_commission_pct,...prog(rr)});
};
