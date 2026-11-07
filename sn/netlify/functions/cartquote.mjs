import {json,quoteCart} from './_lib.mjs';
export default async (req,context)=>{
 const b=req.method==='POST'?await req.json().catch(()=>({})):Object.fromEntries(new URL(req.url).searchParams);
 const slugs=Array.isArray(b.slugs)?b.slugs:String(b.slugs||'').split(',').filter(Boolean);
 const country=context&&context.geo&&context.geo.country&&context.geo.country.code;
 return json(await quoteCart(slugs,String(b.email||'').trim(),String(b.ref||''),String(b.ck||''),{country,cur:String(b.cur||'')}));
};
