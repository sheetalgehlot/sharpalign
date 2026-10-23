import {json,keyCode,getRef,balance,CFG} from './_lib.mjs';
export default async req=>{
 const c=keyCode(new URL(req.url).searchParams.get('k')||''),r=c?await getRef(c):null;
 if(!r)return json({error:'not found'},404);
 const [b,p]=balance(r);
 return json({balance:b,pending:p,ledger:r.ledger.slice().reverse().slice(0,50),code:c,hold:CFG.hold_days,max:CFG.credit_max_pct,fd:CFG.friend_discount_pct,cm:CFG.ref_commission_pct});
};
