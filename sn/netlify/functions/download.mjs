import {readToken,store,keyCode,getRef,catalog,CFG} from './_lib.mjs';
import {createReadStream,existsSync,statSync} from 'node:fs';
import {Readable} from 'node:stream';
import path from 'node:path';
async function serve(slug,s,count){
 const H=len=>({'content-type':'application/pdf','content-disposition':`attachment; filename="${slug}.pdf"`,'content-length':String(len),'x-robots-tag':'noindex','cache-control':'private, no-store'});
 const m=((await s.get('adm/pdfs',{type:'json'}))||{})[slug];
 if(m){await count();let i=0;
  return new Response(new ReadableStream({async pull(c){if(i>=m.parts){c.close();return;}const b=await s.get(`pdf/${slug}/${i++}`,{type:'arrayBuffer'});if(!b){c.error(new Error('missing part'));return;}c.enqueue(new Uint8Array(b));}}),{headers:H(m.size)});}
 const file=slug+'.pdf',here=path.dirname(new URL(import.meta.url).pathname);
 const f=[path.join(process.env.LAMBDA_TASK_ROOT||'/var/task','private-pdfs',file),path.join(process.cwd(),'private-pdfs',file),path.join(here,'../../private-pdfs',file)].find(existsSync);
 if(!f)return new Response('File not found. Please contact us.',{status:404});
 await count();
 return new Response(Readable.toWeb(createReadStream(f)),{headers:H(statSync(f).size)});
}
export default async req=>{
 const u=new URL(req.url).searchParams,s=store();
 if(u.get('k')){ // My Library: any time, always the latest version
  const c=keyCode(u.get('k')),r=c?await getRef(c):null,sl=String(u.get('slug')||'');
  const cat=await catalog(),ok=r&&/^[a-z0-9-]+$/.test(sl)&&((r.bought||[]).some(b=>b.slug===sl)||(r.top==='top10'&&cat[sl]&&cat[sl].pdf));
  if(!ok)return new Response('Not available for this account.',{status:403});
  return serve(sl,s,async()=>{});
 }
 const t=readToken(u.get('t')||'');
 if(!t)return new Response('This link has expired. Please contact us and we will help.',{status:410});
 const k='order/'+t.o,r=await s.get(k,{type:'json'});
 if(!r||r.dl>=CFG.max_downloads)return new Response('Download limit reached. Please open My Library on your private page, or contact us.',{status:410});
 return serve(t.s,s,async()=>{r.dl++;await s.setJSON(k,r);});
};
