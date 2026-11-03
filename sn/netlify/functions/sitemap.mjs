import {catalog} from './_lib.mjs';
import SH from './_shell.mjs';
// Always up to date: includes products added in the admin page without any rebuild.
export default async()=>{
 const c=await catalog(),d=new Date().toISOString().slice(0,10),u=[['',d],['refer/',d]];
 if(SH.leaderboard)u.push(['leaderboard/',d]);
 for(const k of Object.keys(SH.cats))u.push([k+'/',d]);
 for(const [sl,p] of Object.entries(c))if(p.pdf)u.push([`${p.cat}/${sl}/`,p.added||d]);
 const x=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
 return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+u.map(([p,m])=>`<url><loc>${x(SH.site+'/'+p)}</loc><lastmod>${m}</lastmod></url>`).join('')+'</urlset>',{headers:{'content-type':'application/xml; charset=utf-8','cache-control':'public, max-age=1800'}});
};
