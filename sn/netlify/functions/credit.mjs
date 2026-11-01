import {json,keyCode,getRef,balance,prog,board,CFG} from './_lib.mjs';
export default async req=>{
 const c=keyCode(new URL(req.url).searchParams.get('k')||''),r=c?await getRef(c):null;
 if(!r)return json({error:'not found'},404);
 const [b,p]=balance(r),bd=await board(),i=bd.rows.findIndex(x=>x.code===c);
 return json({balance:b,pending:p,ledger:r.ledger.slice().reverse().slice(0,50),code:c,hold:CFG.hold_days,max:CFG.credit_max_pct,fd:CFG.friend_discount_pct,cm:CFG.ref_commission_pct,rank:i>=0?i+1:0,ranked:bd.rows.length,members:bd.members,...prog(r)});
};
