import {json,store,env} from './_lib.mjs';
// Used only by build.py during a deploy, to pull products, covers and approved reviews saved in the admin.
export default async req=>{
 const k=env('EXPORT_KEY');if(k.length<16||req.headers.get('x-export-key')!==k)return json({error:'no'},403);
 const s=store(),g=async(x,d)=>(await s.get(x,{type:'json'}))||d,pd=await g('adm/pdfs',{}),cv=await g('adm/covers',{}),gl=await g('adm/gallery',{}),sm=await g('adm/samples',{}),covers={},reviews=[];
 for(const sl of Object.keys(cv)){const b=await s.get('cover/'+sl,{type:'arrayBuffer'});if(b)covers[sl]=Buffer.from(b).toString('base64');}
 for(const b of (await s.list({prefix:'rv/'})).blobs){const r=await g(b.key,null);if(r&&r.status==='approved')reviews.push({slug:r.slug,name:r.name,rating:r.rating,text:r.text,date:r.date,verified:!!r.verified});}
 return json({products:await g('adm/products',[]),removed:await g('adm/removed',[]),pdfs:Object.keys(pd),gallery:gl,samples:Object.keys(sm),covers,reviews});
};
