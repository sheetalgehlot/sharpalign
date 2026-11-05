import {json,quote,rzp,env,productA} from './_lib.mjs';
export default async (req,context)=>{
 if(req.method!=='POST')return json({error:'POST only'},405);
 const b=await req.json().catch(()=>({})),p=await productA(String(b.slug||'')),email=String(b.email||'').trim();
 if(!p||!/^\S+@\S+\.\S+$/.test(email))return json({error:'Please check your email address.'},400);
 if(!p.pdf)return json({error:'This PDF is not available yet.'},409);
 const q=await quote(p,email,String(b.ref||''),String(b.ck||''),{country:context&&context.geo&&context.geo.country&&context.geo.country.code,cur:String(b.cur||'')});
 if(q.locked)return json({error:'This launch has not opened yet. Join the notify list on the page.'},409);
 const notes={slug:b.slug,email,cur:q.currency,inr:String(q.pay_inr)};if(q.ref)notes.ref=q.ref;if(q.credit>0){notes.cr=q.cr;notes.credit=String(q.credit);}
 const o=await rzp('POST','orders',{amount:Math.round(q.pay*100),currency:q.currency,receipt:(b.slug.slice(0,28)+'-'+Date.now()).slice(0,40),notes});
 if(!o.id)return json({error:'Payment service is unavailable. Please try again.'},502);
 return json({order_id:o.id,amount:o.amount,currency:q.currency,key:env('RAZORPAY_KEY_ID'),title:p.title,callback:new URL(req.url).origin+'/api/payment-callback'});
};
