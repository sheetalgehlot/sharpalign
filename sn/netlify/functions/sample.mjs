import {store,servePdf} from './_lib.mjs';
// Free sample PDF for a product (uploaded in the admin page).
export default async req=>{
 const u=new URL(req.url).searchParams,sl=u.get('slug')||'';
 if(!/^[a-z0-9-]{1,80}$/.test(sl))return new Response('Not found',{status:404});
 return servePdf(sl,store(),async()=>{},u.get('dl')!=='1','sample');
};
