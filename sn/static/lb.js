(async()=>{
const C=window.SA_CAMP,S=window.SA;let d={members:0,top:[]};try{d=await (await fetch('/api/leaderboard')).json()}catch(e){}
const m=d.members||0,pk=C.perks;
document.getElementById('lbm').textContent=m+' members have joined so far.';
document.getElementById('pz').innerHTML=C.prizes.map(p=>{const u=p.unlock_members||0,open=m>=u;
 return '<div class="ph"><b>'+p.ranks+'</b><span>'+(open?'🎁 '+p.title:'🔒 Mystery prize · unlocks when we reach '+u+' members ('+(u-m)+' to go)')+'</span></div>'}).join('');
document.getElementById('lb').innerHTML=d.top.length?'<table class="lb"><tr><th>#</th><th>Referrer</th><th>Friends</th></tr>'+d.top.map(r=>'<tr><td>'+r.rank+(r.rank<=pk.top_free?' 🏆':r.rank<=pk.top_vip?' ⭐':'')+'</td><td>'+r.name+'</td><td>'+r.n+'</td></tr>').join('')+'</table>':'<p>No referrals yet. Be the first!</p>';
})();
