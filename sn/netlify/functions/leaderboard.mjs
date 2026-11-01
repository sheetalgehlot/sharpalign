import {json,board} from './_lib.mjs';
export default async()=>{const b=await board();return json({members:b.members,ranked:b.rows.length,top:b.rows.slice(0,20).map((x,i)=>({rank:i+1,n:x.n,name:x.mask}))});};
