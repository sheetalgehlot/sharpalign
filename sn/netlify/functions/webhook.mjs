import {fulfil,verifyWebhook} from './_lib.mjs';
// Safety net: Razorpay tells us about every captured payment, even if the buyer closed the page.
export default async req=>{
 const raw=await req.text();
 if(!verifyWebhook(raw,req.headers.get('x-razorpay-signature')||''))return new Response('bad signature',{status:400});
 const d=JSON.parse(raw||'{}');
 if(['payment.captured','order.paid'].includes(d.event)){
  const oid=d.payload?.payment?.entity?.order_id||d.payload?.order?.entity?.id;
  if(oid)await fulfil(oid,new URL(req.url).origin);
 }
 return new Response('ok');
};
