import {body,username,validUser,validPassword,hashPassword,checkPassword,redis,session,issue,cookie,tokenFrom,sessionKey,userKey,sameOrigin,rateLimit,cleanName,validName,accountRecord,publicProfile} from '../server/auth.js';
import {createHash} from 'node:crypto';
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');try{
 if(req.method==='GET'){const u=await session(req);return res.status(200).json({user:u?publicProfile(u,accountRecord(await redis(['GET',userKey(u)]))):null})}
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(!sameOrigin(req))return res.status(403).json({error:'Invalid origin'});
 const b=body(req)||{};
 if(b.action==='logout'){const u=await session(req);if(u&&req.headers['x-tracker-user']!==u)return res.status(409).json({error:'Account changed in another tab. Reload.'});const t=tokenFrom(req);if(t)await redis(['DEL',sessionKey(t)]);cookie(res,'',0);return res.status(200).json({ok:true})}
 if(b.action==='profile'){const u=await session(req);if(!u)return res.status(401).json({error:'Sign in again'});if(req.headers['x-tracker-user']!==u)return res.status(409).json({error:'Account changed. Reload.'});const firstName=cleanName(b.firstName),lastName=cleanName(b.lastName);if(!validName(firstName)||!validName(lastName))return res.status(400).json({error:'Enter valid first and last names (1–60 characters each).'});const raw=await redis(['GET',userKey(u)]);const a=accountRecord(raw);if(!a||a.disabled)return res.status(401).json({error:'Account not found'});const record={...a,firstName,lastName};await redis(['SET',userKey(u),JSON.stringify(record),'XX']);return res.status(200).json({user:publicProfile(u,record)})}
 if(!['register','login'].includes(b.action))return res.status(400).json({error:'Invalid action'});
 const u=username(b.username),p=b.password;
 if(!validUser(u)||!validPassword(p))return res.status(400).json({error:'Use 3–24 letters, digits or underscores and a password of at least 10 characters (max 256 bytes).'});
 const ip=String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||'unknown').split(',')[0].trim();const ipHash=createHash('sha256').update(ip).digest('hex');
 if(!await rateLimit(`mw4:v2:rate:ip:${ipHash}`,30,900)||!await rateLimit(`mw4:v2:rate:user:${u}`,10,900))return res.status(429).json({error:'Too many attempts. Try again in 15 minutes.'});
 let account;
 if(b.action==='register'){const firstName=cleanName(b.firstName),lastName=cleanName(b.lastName);if(!validName(firstName)||!validName(lastName))return res.status(400).json({error:'Enter valid first and last names (1–60 characters each).'});account={hash:await hashPassword(p),firstName,lastName,epoch:createHash('sha256').update(await hashPassword(p)).digest('hex')};const ok=await redis(['SET',userKey(u),JSON.stringify(account),'NX']);if(ok!=='OK')return res.status(409).json({error:'Username unavailable'});}
 else {account=accountRecord(await redis(['GET',userKey(u)]));if(!await checkPassword(p,account?.hash)||!account||account.disabled)return res.status(401).json({error:'Invalid username or password'});}
 const old=tokenFrom(req);if(old)await redis(['DEL',sessionKey(old)]);await issue(res,u,redis,account);return res.status(200).json({user:publicProfile(u,account)});
 }catch(e){return res.status(503).json({error:'Authentication unavailable. Check Redis configuration.'})}}
