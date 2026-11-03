import {store} from './_lib.mjs';
// Cover pictures uploaded in the admin page are served from here.
export default async req=>{
 const sl=new URL(req.url).searchParams.get('slug')||'';
 if(!/^[a-z0-9-]{1,80}$/.test(sl))return new Response('Not found',{status:404});
 const b=await store().get('cover/'+sl,{type:'arrayBuffer'});
 if(!b)return new Response('Not found',{status:404});
 return new Response(b,{headers:{'content-type':'image/jpeg','cache-control':'public, max-age=3600','netlify-cdn-cache-control':'public, max-age=86400, stale-while-revalidate=86400'}});
};
