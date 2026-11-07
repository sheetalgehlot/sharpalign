import {store} from './_lib.mjs';
// "Look inside" pictures of a product (uploaded in the admin page).
export default async req=>{
 const u=new URL(req.url).searchParams,sl=u.get('slug')||'',n=parseInt(u.get('n'));
 if(!/^[a-z0-9-]{1,80}$/.test(sl)||!(n>0&&n<1000))return new Response('Not found',{status:404});
 const b=await store().get(`img/${sl}/${n}`,{type:'arrayBuffer'});
 if(!b)return new Response('Not found',{status:404});
 return new Response(b,{headers:{'content-type':'image/jpeg','cache-control':'public, max-age=3600','netlify-cdn-cache-control':'public, max-age=86400, stale-while-revalidate=86400'}});
};
