import {json,quote,productA} from './_lib.mjs';
export default async (req,context)=>{const u=new URL(req.url).searchParams,p=await productA(u.get('slug')||'');if(!p)return json({error:'Unknown'},404);
 const country=context&&context.geo&&context.geo.country&&context.geo.country.code;
 return json(await quote(p,String(u.get('email')||'').trim(),u.get('ref')||'',u.get('ck')||'',{country,cur:u.get('cur')||''}));};
