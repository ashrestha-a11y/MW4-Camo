import { timingSafeEqual } from 'node:crypto';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const {UPSTASH_REDIS_REST_URL:url,UPSTASH_REDIS_REST_TOKEN:token,TRACKER_ACCESS_KEY:key}=process.env;
 if(!url||!token||!key)return res.status(503).json({error:'Cloud storage not configured'});
 const a=Buffer.from(req.headers.authorization||''), b=Buffer.from('Bearer '+key);
 if(a.length!==b.length||!timingSafeEqual(a,b))return res.status(401).json({error:'Invalid access key'});
 if(!['GET','PUT'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
 try{
  let cmd=['GET','mw4-camo-command:progress'];
  if(req.method==='PUT'){
   const s=typeof req.body==='string'?JSON.parse(req.body):req.body;
   if(!s||!['counts','levels','edits'].every(k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k]))||JSON.stringify(s).length>250000)return res.status(400).json({error:'Invalid progress'});
   cmd=['SET','mw4-camo-command:progress',JSON.stringify(s)];
  }
  const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(cmd)}); const j=await r.json(); if(!r.ok||j.error)throw Error('Database error');
  return res.status(200).json(req.method==='GET'?{progress:j.result?JSON.parse(j.result):null}:{ok:true});
 }catch{return res.status(502).json({error:'Storage request failed'});}
}
