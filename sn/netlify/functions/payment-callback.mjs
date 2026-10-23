import {fulfil,verifySig} from './_lib.mjs';
// Razorpay sends the buyer here (POST) right after payment. We verify, then send them to the download page.
export default async req=>{
 const origin=new URL(req.url).origin,go=q=>new Response(null,{status:303,headers:{location:origin+'/thank-you/'+q}});
 let f;try{f=await req.formData();}catch{return go('?e=1');}
 const oid=String(f.get('razorpay_order_id')||''),pid=String(f.get('razorpay_payment_id')||''),sig=String(f.get('razorpay_signature')||'');
 if(!oid||!pid||!sig||!verifySig(oid,pid,sig))return go('?e=1');
 const t=await fulfil(oid,origin);
 return go(t?'?t='+t:'?e=2');
};
