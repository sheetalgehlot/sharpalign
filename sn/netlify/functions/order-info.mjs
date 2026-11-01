import {json,readToken,store,product,rcode,rkey,getRef,prog,CFG} from './_lib.mjs';
export default async req=>{
 const t=readToken(new URL(req.url).searchParams.get('t')||''),r=t?await store().get('order/'+t.o,{type:'json'}):null,p=r?product(r.slug):null;
 if(!p)return json({error:'expired'},404);
 const code=rcode(r.email),rr=(await getRef(code))||{};
 return json({title:p.title,code,key:rkey(code),days:CFG.link_days,fd:CFG.friend_discount_pct,cm:CFG.ref_commission_pct,...prog(rr)});
};
