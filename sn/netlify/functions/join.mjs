import {createHash} from 'node:crypto';
import {json,store,getRef,rcode,rkey,mail,CFG,CP} from './_lib.mjs';
// Anyone can join the referral club with just an email (no purchase needed). The private link is sent by email, so only the owner of the email gets it.
export default async (req,context)=>{
 if(req.method!=='POST')return json({error:'POST only'},405);
 const b=await req.json().catch(()=>({})),email=String(b.email||'').trim().toLowerCase();
 if(b.website)return json({ok:true});
 if(!/^\S+@\S+\.\S+$/.test(email)||email.length>120)return json({error:'Please check your email address.'},400);
 const s=store(),ip=context?.ip||req.headers.get('x-nf-client-connection-ip')||'?',day=new Date().toISOString().slice(0,10);
 const rk='rl/j'+createHash('sha256').update(ip+day).digest('hex').slice(0,22),n=(await s.get(rk,{type:'json'}))||{c:0};
 if(n.c>=5)return json({error:'Too many tries today. Please try again tomorrow.'},429);
 await s.setJSON(rk,{c:n.c+1});
 const code=rcode(email);
 if(!(await getRef(code)))await s.setJSON('ref/'+code,{email,ledger:[],refs:[],buyer:false});
 const jk='jn/'+code,last=await s.get(jk,{type:'json'});
 if(!last||Date.now()-last.t>36e5){
  await s.setJSON(jk,{t:Date.now()});
  const o=new URL(req.url).origin,now=Date.now(),dd=ms=>new Date(ms).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
  const live=Object.entries(CP.phases||{}).filter(([c,f])=>CP.enabled&&f.end>f.open&&now>=f.open&&now<f.end).sort((a,b)=>a[1].end-b[1].end)[0];
  let offer='';
  if(live){const [c,f]=live,t=[];if(f.launch_price)t.push('every book ₹'+f.launch_price);if(f.discount_pct)t.push(f.discount_pct+'% off');
   offer=`\n\nLAUNCH OFFER: ${c} PDFs, ${t.join(', ')}, until ${dd(f.end)}.`+(f.reward_price?` When ${CP.unlock_referrals} friends buy through your link, you get ALL ${c} books for ₹${f.reward_price} for ${f.reward_days||7} days. One-time offer.`:'');}
  await mail(email,'Your Sharpalign referral link',`Welcome! Here is your personal link:\n${o}/?ref=${code}\n\nYour private page (keep it to yourself): ${o}/credit/#${rkey(code)}\n\nFriends who buy through your link get ${CFG.friend_discount_pct}% off their first PDF and you earn ${CFG.ref_commission_pct}% of what they pay as store credit. The top referrers win VIP perks and prizes: ${o}/leaderboard/`+offer+'\n\nSharpalign');
 }
 return json({ok:true});
};
