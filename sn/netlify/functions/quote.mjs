import {json,quote,product} from './_lib.mjs';
export default async req=>{const u=new URL(req.url).searchParams,p=product(u.get('slug')||'');if(!p)return json({error:'Unknown'},404);return json(await quote(p,'',u.get('ref')||'',u.get('ck')||''));};
