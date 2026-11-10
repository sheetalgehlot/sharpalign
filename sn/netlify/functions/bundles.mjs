import {json,store,catalog,bundleLive,currencyFor} from './_lib.mjs';
import SH from './_shell.mjs';
// Bundles that are live right now (shown in the popup on every page).
export default async (req,context)=>{
 const country=context&&context.geo&&context.geo.country&&context.geo.country.code,want=currencyFor(country,new URL(req.url).searchParams.get('cur')||'');
 const bl=(await store().get('adm/bundles',{type:'json'}))||[],cat=await catalog(),now=Date.now(),out=[];
 for(const b of bl){if(!bundleLive(b,now))continue;
  const items=Object.entries(cat).filter(([k,p])=>p.cat===b.cat&&p.pdf);if(!items.length)continue;
  let c='INR';if(want!=='INR'&&b.prices){if(b.prices[want]>0)c=want;else if(b.prices.USD>0)c='USD';}
  const price=c==='INR'?b.price:b.prices[c],ok=items.every(([k,p])=>c==='INR'||(p.prices||{})[c]>0);
  out.push({id:b.id,cat:b.cat,catName:(SH.cats[b.cat]||{}).short||b.cat,title:b.title,text:b.text||'',count:items.length,currency:c,price,
   worth:ok?Math.round(items.reduce((a,[k,p])=>a+(c==='INR'?p.price:p.prices[c]),0)*100)/100:null,ends:b.ends||0,starts:b.starts||0,
   titles:items.slice(0,6).map(([k,p])=>p.title),thumbs:items.filter(([k,p])=>p.cover||p.img).slice(0,4).map(([k,p])=>p.cover?'/api/cover?slug='+k:'/covers/'+p.img)});}
 return json({items:out});
};
