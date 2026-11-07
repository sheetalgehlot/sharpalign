import {randomBytes} from 'node:crypto';
import {json,quote,quoteCart,rzp,env,productA,store} from './_lib.mjs';
export default async (req,context)=>{
 if(req.method!=='POST')return json({error:'POST only'},405);
 const b=await req.json().catch(()=>({})),email=String(b.email||'').trim();
 if(!/^\S+@\S+\.\S+$/.test(email))return json({error:'Please check your email address.'},400);
 const opt={country:context&&context.geo&&context.geo.country&&context.geo.country.code,cur:String(b.cur||'')};
 const list=Array.isArray(b.slugs)?[...new Set(b.slugs.map(String))]:[];
 let notes,amount,currency,title,first;
 if(list.length>1){ // a bundle of several PDFs: one payment, one price
  const c=await quoteCart(list,email,String(b.ref||''),String(b.ck||''),opt);
  if(c.error)return json({error:c.error},409);
  const cid=randomBytes(8).toString('hex');
  await store().setJSON('cart/'+cid,{slugs:c.items.map(i=>i.slug),email,t:Date.now()});
  first=c.items[0].slug;notes={slug:first,cid,email,cur:c.currency,inr:String(c.total_inr)};
  if(c.ref)notes.ref=c.ref;if(c.credit>0){notes.cr=c.cr;notes.credit=String(c.credit);}
  amount=Math.round(c.total*100);currency=c.currency;title=c.items.length+' PDFs (bundle)';
 }else{
  first=list.length?list[0]:String(b.slug||'');const p=await productA(first);
  if(!p)return json({error:'This PDF was not found.'},404);
  if(!p.pdf)return json({error:'This PDF is not available yet.'},409);
  const q=await quote(p,email,String(b.ref||''),String(b.ck||''),opt);
  if(q.locked)return json({error:'This launch has not opened yet. Join the notify list on the page.'},409);
  notes={slug:first,email,cur:q.currency,inr:String(q.pay_inr)};if(q.ref)notes.ref=q.ref;if(q.credit>0){notes.cr=q.cr;notes.credit=String(q.credit);}
  amount=Math.round(q.pay*100);currency=q.currency;title=p.title;
 }
 const o=await rzp('POST','orders',{amount,currency,receipt:(first.slice(0,28)+'-'+Date.now()).slice(0,40),notes});
 if(!o.id)return json({error:'Payment service is unavailable. Please try again.'},502);
 return json({order_id:o.id,amount:o.amount,currency,key:env('RAZORPAY_KEY_ID'),title,callback:new URL(req.url).origin+'/api/payment-callback'});
};
