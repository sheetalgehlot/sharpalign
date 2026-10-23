import {readToken,store,CFG} from './_lib.mjs';
import {createReadStream,existsSync,statSync} from 'node:fs';
import {Readable} from 'node:stream';
import path from 'node:path';
export default async req=>{
 const t=readToken(new URL(req.url).searchParams.get('t')||'');
 if(!t)return new Response('This link has expired. Please contact us and we will help.',{status:410});
 const s=store(),k='order/'+t.o,r=await s.get(k,{type:'json'});
 if(!r||r.dl>=CFG.max_downloads)return new Response('Download limit reached. Please contact us and we will help.',{status:410});
 const H=len=>({'content-type':'application/pdf','content-disposition':`attachment; filename="${t.s}.pdf"`,'content-length':String(len),'x-robots-tag':'noindex','cache-control':'private, no-store'});
 const m=((await s.get('adm/pdfs',{type:'json'}))||{})[t.s];
 if(m){r.dl++;await s.setJSON(k,r);let i=0;
  return new Response(new ReadableStream({async pull(c){if(i>=m.parts){c.close();return;}const b=await s.get(`pdf/${t.s}/${i++}`,{type:'arrayBuffer'});if(!b){c.error(new Error('missing part'));return;}c.enqueue(new Uint8Array(b));}}),{headers:H(m.size)});}
 const file=t.s+'.pdf',here=path.dirname(new URL(import.meta.url).pathname);
 const f=[path.join(process.env.LAMBDA_TASK_ROOT||'/var/task','private-pdfs',file),path.join(process.cwd(),'private-pdfs',file),path.join(here,'../../private-pdfs',file)].find(existsSync);
 if(!f)return new Response('File not found. Please contact us.',{status:404});
 r.dl++;await s.setJSON(k,r);
 return new Response(Readable.toWeb(createReadStream(f)),{headers:H(statSync(f).size)});
};
