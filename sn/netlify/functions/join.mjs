import {createHash} from 'node:crypto';
import {json,store,getRef,rcode,rkey,mail,CFG,CP,campOn} from './_lib.mjs';
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
  await s.setJSON(jk,{t:Date.now()});const o=new URL(req.url).origin,cats=(CP.cats||[]).join('/');
  await mail(email,'Your Sharpalign referral link',`Welcome! Here is your personal link:\n${o}/?ref=${code}\n\nYour private page (keep it to yourself): ${o}/credit/#${rkey(code)}\n\nFriends who buy through your link get ${CFG.friend_discount_pct}% off their first PDF and you earn ${CFG.ref_commission_pct}% of what they pay as store credit.`+(campOn()?`\n\nLAUNCH OFFER: every ${cats} book is ₹${CP.launch_price} until ${new Date(CP.end).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'})}. When ${CP.unlock_referrals} friends buy through your link, you get ALL ${cats} books for ₹${CP.reward_price} for ${CP.reward_days} days. One-time offer.`:'')+'\n\nSharpalign');
 }
 return json({ok:true});
};
