import {json,catalog} from './_lib.mjs';
// Public list used by the shop pages to show products added in the admin page right away.
export default async()=>{
 const c=await catalog(),items=[],flags={},prices={},cats={};
 for(const [sl,p] of Object.entries(c)){flags[sl]={pdf:!!p.pdf};cats[sl]=p.cat;prices[sl]={INR:p.price,...(p.prices||{})};if(p.source==='admin'&&p.rec)items.push({...p.rec,pdf:!!p.pdf,cover:!!p.cover});}
 return json({items,flags,prices,cats,live:Object.keys(c)});
};
