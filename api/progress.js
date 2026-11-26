import {normalize} from '../src/model.js';
import {body,redis,session,progressKey,sameOrigin} from '../server/auth.js';
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');try{
 if(!['GET','PUT'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
 if(req.method==='PUT'&&!sameOrigin(req))return res.status(403).json({error:'Invalid origin'});
 const u=await session(req);if(!u)return res.status(401).json({error:'Sign in again to save progress'});
 if(req.method==='GET'){const v=await redis(['GET',progressKey(u)]);return res.status(200).json({progress:v?JSON.parse(v):null})}
 if(req.headers['x-tracker-user']!==u)return res.status(409).json({error:'Account changed in another tab. Reload before saving.'});
 const s=body(req);if(!s||!['counts','levels','edits'].every(k=>s[k]&&typeof s[k]==='object'&&!Array.isArray(s[k]))||JSON.stringify(s).length>250000)return res.status(400).json({error:'Invalid progress'});
 await redis(['SET',progressKey(u),JSON.stringify(normalize(s))]);return res.status(200).json({ok:true});
 }catch{return res.status(502).json({error:'Storage request failed'})}}
