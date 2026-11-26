import {randomBytes} from 'node:crypto';
import {redis,session,isAdmin,username,validUser,userKey,progressKey,accountRecord,publicProfile,sameOrigin,body,validPassword,hashPassword} from '../server/auth.js';
// Compare-and-swap protects against concurrent profile/account changes.
export const changeScript="if redis.call('GET',KEYS[1]) ~= ARGV[1] then return 0 end; if ARGV[2] == '' then redis.call('DEL',KEYS[1]) else redis.call('SET',KEYS[1],ARGV[2]) end; if ARGV[3] == '1' then redis.call('DEL',KEYS[2]) end; return 1";
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');try{
 const actor=await session(req);if(!actor||!isAdmin(actor))return res.status(403).json({error:'Administrator access required'});
 if(req.method==='GET'){let cursor='0',users=[];do{const [next,keys]=await redis(['SCAN',cursor,'MATCH','mw4:v2:user:*','COUNT',100]);cursor=String(next);if(keys.length){const records=await redis(['MGET',...keys]);keys.forEach((key,i)=>{const u=key.slice('mw4:v2:user:'.length),a=accountRecord(records[i]);if(a&&validUser(u))users.push({...publicProfile(u,a),disabled:!!a.disabled})})}}while(cursor!=='0');return res.status(200).json({users:[...new Map(users.map(u=>[u.username,u])).values()].sort((a,b)=>a.username.localeCompare(b.username))})}
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(!sameOrigin(req)||req.headers['x-tracker-user']!==actor)return res.status(403).json({error:'Invalid request'});
 const b=body(req)||{},u=username(b.username);if(!validUser(u)||isAdmin(u))return res.status(400).json({error:'Administrator accounts are protected'});
 if(!['delete','reset','disable','enable','revoke','password'].includes(b.action))return res.status(400).json({error:'Invalid action'});
 const raw=await redis(['GET',userKey(u)]),a=accountRecord(raw);if(!a)return res.status(404).json({error:'Account not found'});
 if(b.action==='password'){if(!validPassword(b.password))return res.status(400).json({error:'Password must be at least 10 characters and at most 256 bytes'});a.hash=await hashPassword(b.password)}
 if(b.action==='disable')a.disabled=true;if(b.action==='enable')a.disabled=false;
 a.epoch=randomBytes(24).toString('hex'); // invalidate all previous sessions and recovery copies
 const ok=await redis(['EVAL',changeScript,2,userKey(u),progressKey(u),raw,b.action==='delete'?'':JSON.stringify(a),['delete','reset'].includes(b.action)?'1':'0']);
 if(!ok)return res.status(409).json({error:'Account changed; refresh and retry'});
 return res.status(200).json({ok:true});
 }catch{return res.status(503).json({error:'Admin storage unavailable'})}}
