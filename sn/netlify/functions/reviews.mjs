import {json,reviewsFor} from './_lib.mjs';
export default async req=>{const sl=new URL(req.url).searchParams.get('slug')||'';if(!/^[a-z0-9-]{1,80}$/.test(sl))return json({items:[]});return json({items:await reviewsFor(sl)});};
