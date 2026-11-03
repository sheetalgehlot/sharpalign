import {catalog,reviewsFor} from './_lib.mjs';
import SH from './_shell.mjs';
// Page for a product that was added in the admin page after the last site build (same design as the built pages).
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const INR=n=>'₹'+Number(n).toLocaleString('en-IN');
const stars=n=>'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n));
const ldjs=j=>'<script type="application/ld+json">'+JSON.stringify(j).replace(/</g,'\\u003c')+'</script>';
const head=(title,desc,theme,path,ld,img,noindex)=>{const u=SH.site+'/'+path.replace(/^\//,'');
 return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+SH.verify+SH.fav+'<title>'+E(title)+'</title><meta name="description" content="'+E(desc)+'"><link rel="canonical" href="'+E(u)+'">'+(noindex?'<meta name="robots" content="noindex">':'')
 +'<meta property="og:title" content="'+E(title)+'"><meta property="og:description" content="'+E(desc)+'"><meta property="og:type" content="website"><meta property="og:url" content="'+E(u)+'"><meta property="og:site_name" content="Sharpalign">'
 +(img?'<meta property="og:image" content="'+E(img)+'"><meta name="twitter:card" content="summary_large_image">':'')
 +'<link rel="stylesheet" href="'+SH.fonts+'"><link rel="stylesheet" href="/assets/style.css"><script src="/assets/site.js" defer></script>'+SH.campjs+ld.map(ldjs).join('')+'</head><body class="t-'+theme+'"><div class="top"><a class="logo" href="/">Sharpalign</a><nav aria-label="Main">'+SH.nav+'</nav></div>';};
const cover=(slug,p)=>p.cover?['/api/cover?slug='+slug,true]:p.img?['/covers/'+p.img,true]:['',false];
const cvparts=(slug,p)=>{const [src,has]=cover(slug,p);return has?[' img','<img src="'+E(src)+'" alt="Cover of '+E(p.title)+'" loading="lazy" width="600" height="800">']:['',E(p.emoji||'📘')+'<small>'+E(p.title)+'</small>'];};
const card=(slug,p)=>{const [cls,inner]=cvparts(slug,p),h=`/${p.cat}/${slug}/`;
 return `<article class="card" data-slug="${E(slug)}"><a class="cv${cls}" href="${h}" style="background:${E(p.color||'#3b82f6')}"${cls?'':' aria-hidden="true"'} tabindex="-1">${inner}</a><h3><a href="${h}">${E(p.title)}</a></h3><p>${E(p.short||'')}</p><div class="row"><span class="pr" data-cat="${p.cat}" data-price="${p.price}">${INR(p.price)}</span><a class="buy" href="${h}">${p.pdf?'View PDF':'Coming soon'}</a></div></article>`;};
const RVF=slug=>`<h3>Write a review</h3><form id="rvf" data-slug="${E(slug)}"><label for="rvr">Your rating</label><select id="rvr"><option value="5">★★★★★ 5 – Loved it</option><option value="4">★★★★☆ 4</option><option value="3">★★★☆☆ 3</option><option value="2">★★☆☆☆ 2</option><option value="1">★☆☆☆☆ 1</option></select><label for="rvn">Your name</label><input id="rvn" maxlength="40" autocomplete="name"><label for="rvt">Your review</label><textarea id="rvt" rows="4" maxlength="600" required></textarea><input id="rvw" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="cta" type="submit">Submit review</button><p id="rvm" class="note" role="status">Reviews are checked before they appear. Readers who bought this PDF here get a “Verified buyer” label.</p></form>`;
const page=(html,status=200)=>new Response(html,{status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=0, must-revalidate','netlify-cdn-cache-control':'public, max-age=60, stale-while-revalidate=300'}});
export default async req=>{
 const q=new URL(req.url).searchParams,cat=q.get('cat')||'',slug=q.get('slug')||'';
 const c=await catalog(),p=Object.hasOwn(c,slug)?c[slug]:null;
 if(!p||p.cat!==cat||!p.rec||!SH.cats[cat])return page(head('Page not found','Page not found','home','',[],'',true)+'<main class="w"><div class="panel"><h1>Page not found</h1><p><a href="/">Back to the shop</a></p></div></main>'+SH.foot,404);
 const r=p.rec,ci=SH.cats[cat],rv=await reviewsFor(slug),av=rv.length?rv.reduce((a,x)=>a+x.rating,0)/rv.length:0,path=`${cat}/${slug}/`,img=p.cover?SH.site+'/api/cover?slug='+slug:(p.img?SH.site+'/covers/'+p.img:'');
 const pj={'@context':'https://schema.org','@type':'Product',name:r.title,description:r.short||r.title,brand:{'@type':'Brand',name:ci.name},offers:{'@type':'Offer',price:r.price,priceCurrency:'INR',availability:p.pdf?'https://schema.org/InStock':'https://schema.org/OutOfStock',url:SH.site+'/'+path}};
 if(img)pj.image=img;
 if(rv.length){pj.aggregateRating={'@type':'AggregateRating',ratingValue:Math.round(av*10)/10,reviewCount:rv.length};pj.review=rv.map(x=>({'@type':'Review',author:{'@type':'Person',name:x.name},reviewRating:{'@type':'Rating',ratingValue:x.rating},reviewBody:x.text}));}
 const bc={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SH.site+'/'},{'@type':'ListItem',position:2,name:ci.short,item:SH.site+'/'+cat+'/'},{'@type':'ListItem',position:3,name:r.title}]};
 const [cls,inner]=cvparts(slug,p),vf=av.toFixed(1);
 const rate=rv.length?`<p class="rate"><span class="stars" aria-label="${vf} out of 5">${stars(av)}</span> ${vf} (${rv.length} review${rv.length>1?'s':''}) · <a href="#reviews">Write a review</a></p>`:'<p class="rate note">No reviews yet. <a href="#reviews">Be the first to review</a></p>';
 const buy=`<div id="buybox" hidden><label for="buyer">Your email (we send the PDF link here)</label><input id="buyer" type="email" autocomplete="email" placeholder="you@example.com"><button class="cta" data-buy="${E(slug)}">Buy now · ${INR(r.price)}</button><p id="msg" class="note" role="status"></p><p class="note">Secure payment by Razorpay: UPI, cards, net banking and wallets. After paying you return to our site and your download opens right away.</p><script src="https://checkout.razorpay.com/v1/checkout.js"></script></div>`;
 const revs=rv.map(x=>`<div class="rev"><span class="stars">${stars(x.rating)}</span> <b>${E(x.name)}</b>${x.verified?' <small>Verified buyer</small>':''}<p>${E(x.text)}</p></div>`).join('')||'<p>No reviews yet.</p>';
 const rel=Object.entries(c).filter(([k,x])=>x.cat===cat&&k!==slug).slice(0,3);
 const body=`<main class="w"><p class="crumbs"><a href="/">Home</a> / <a href="/${cat}/">${E(ci.short)}</a> / ${E(r.title)}</p><div class="prod"><div class="cv big${cls}" style="background:${E(r.color||'#3b82f6')}"${cls?'':` role="img" aria-label="Cover of ${E(r.title)}"`}>${inner}</div><div class="panel"><h1>${E(r.title)}</h1>${rate}<p class="pr big" id="price">${INR(r.price)}</p><div id="offers"></div><div id="soon"></div><p>${E(r.short||'')}</p>${buy}</div></div>`
  +`<section class="panel"><h2>About this PDF</h2>${String(r.desc||'').split('\n').filter(l=>l.trim()).map(l=>'<p>'+E(l)+'</p>').join('')}<ul><li>${parseInt(r.pages)||0} pages, PDF format</li><li>Opens on phone, tablet and computer</li><li>Link sent by email after payment</li></ul></section>${cat==='trading'?SH.disc:''}<section class="panel" id="reviews"><h2>Reviews</h2><div id="revlist" data-slug="${E(slug)}">${revs}</div>${RVF(slug)}</section>`
  +(rel.length?`<h2 class="tag">More from ${E(ci.name)}</h2><div class="grid">${rel.map(([k,x])=>card(k,x)).join('')}</div>`:'')+'</main>';
 return page(head(r.title+' (PDF) | '+ci.name,r.short||r.title,cat,path,[pj,bc],img)+body+SH.foot);
};
